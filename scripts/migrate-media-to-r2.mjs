/**
 * One-off backfill: copy existing Blog cover images from their current host
 * (Cloudinary, etc.) into the R2 bucket and rewrite Blog.photo to the new URL.
 *
 * Usage:
 *   node scripts/migrate-media-to-r2.mjs          # dry run, prints what it would do
 *   node scripts/migrate-media-to-r2.mjs --apply  # actually upload + update DB
 *
 * Requires these env vars (same as the app, plus MONGO_URI):
 *   MONGO_URI
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL
 *
 * Loads .env automatically. Idempotent: blogs whose photo already points at
 * R2_PUBLIC_BASE_URL are skipped.
 */
import { randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import mongoose from "mongoose"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

// --- minimal .env loader (avoids adding a dependency) ---
try {
  const envPath = path.resolve(process.cwd(), ".env")
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/)
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
    }
  }
} catch {
  // no .env file — rely on the ambient environment
}

const APPLY = process.argv.includes("--apply")

const {
  MONGO_URI,
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
} = process.env
const R2_PUBLIC_BASE_URL = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/$/, "")

for (const [k, v] of Object.entries({
  MONGO_URI,
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
  R2_PUBLIC_BASE_URL,
})) {
  if (!v) {
    console.error(`Missing required env var: ${k}`)
    process.exit(1)
  }
}

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
})

function extFromContentType(ct) {
  if (!ct) return ""
  if (ct.includes("png")) return ".png"
  if (ct.includes("webp")) return ".webp"
  if (ct.includes("jpeg") || ct.includes("jpg")) return ".jpg"
  if (ct.includes("gif")) return ".gif"
  if (ct.includes("svg")) return ".svg"
  return ""
}

async function main() {
  await mongoose.connect(MONGO_URI, { authSource: "admin" })
  console.log(`Connected to MongoDB (${APPLY ? "APPLY" : "DRY RUN"} mode)\n`)

  // Use the raw collection so we don't depend on the TS model.
  const blogs = mongoose.connection.collection("blogs")
  const cursor = blogs.find({ photo: { $exists: true, $nin: ["", null] } })

  let migrated = 0
  let skipped = 0
  let failed = 0

  for await (const blog of cursor) {
    const photo = blog.photo
    if (typeof photo !== "string" || !/^https?:\/\//i.test(photo)) {
      console.log(`- skip ${blog._id}: photo is not a remote URL`)
      skipped++
      continue
    }
    if (photo.startsWith(R2_PUBLIC_BASE_URL)) {
      skipped++
      continue
    }

    try {
      const res = await fetch(photo)
      if (!res.ok) throw new Error(`fetch ${res.status}`)
      const contentType = res.headers.get("content-type") || "application/octet-stream"
      const buffer = Buffer.from(await res.arrayBuffer())
      const ext = extFromContentType(contentType) || path.extname(new URL(photo).pathname)
      const key = `blog/${randomUUID()}${ext}`

      if (APPLY) {
        await r2.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: contentType,
          }),
        )
        const newUrl = `${R2_PUBLIC_BASE_URL}/${key}`
        await blogs.updateOne({ _id: blog._id }, { $set: { photo: newUrl } })
        console.log(`✓ ${blog._id}: ${photo}\n          -> ${newUrl}`)
      } else {
        console.log(`would migrate ${blog._id}: ${photo} (${(buffer.length / 1024).toFixed(0)} KB, ${contentType})`)
      }
      migrated++
    } catch (err) {
      console.error(`✗ ${blog._id}: ${photo} — ${err.message}`)
      failed++
    }
  }

  console.log(`\nDone. ${APPLY ? "migrated" : "would migrate"}: ${migrated}, skipped: ${skipped}, failed: ${failed}`)
  await mongoose.disconnect()
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

/**
 * Delete a blog post by slug, after backing it up.
 *
 * Written for the DEV-019 duplicate ("what-every-new-trader-…-2"), but kept
 * general: any removal of a published post needs the same treatment, because
 * the URL is already in the sitemap and may be linked externally.
 *
 * Always pair a deletion with a 301 to the surviving URL — see the redirects in
 * clt-acdemy/next.config.ts. A deleted post that 404s throws away whatever
 * authority the URL had accumulated.
 *
 * Usage:
 *   node scripts/delete-blog.mjs --slug=some-slug            # dry run
 *   node scripts/delete-blog.mjs --slug=some-slug --apply    # back up, then delete
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import path from "node:path"
import mongoose from "mongoose"

const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : undefined
}

const APPLY = process.argv.includes("--apply")
const SLUG = arg("slug")

if (!SLUG) {
  console.error("--slug=<slug> is required")
  process.exit(1)
}

function loadMongoUri() {
  if (process.env.MONGO_URI) return process.env.MONGO_URI
  for (const file of [".env", ".env.local"]) {
    let raw
    try {
      raw = readFileSync(path.resolve(process.cwd(), file), "utf8")
    } catch {
      continue
    }
    const m = raw.match(/^\s*MONGO_URI\s*=\s*(.+)$/m)
    // Strip surrounding quotes only. Do NOT treat # as a comment: it is a
    // legal password character and stripping it corrupts the credential.
    if (m) return m[1].trim().replace(/^(["'])([\s\S]*)\1$/, "$2")
  }
  throw new Error("MONGO_URI not found in env or .env/.env.local")
}

await mongoose.connect(loadMongoUri(), { authSource: "admin" })
const blogs = mongoose.connection.collection("blogs")

const doc = await blogs.findOne({ slug: SLUG })
if (!doc) {
  console.log(`No post with slug "${SLUG}". Nothing to do.`)
  await mongoose.disconnect()
  process.exit(0)
}

const words = (doc.content || "").replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length
console.log(`${APPLY ? "APPLY" : "DRY RUN"}`)
console.log(`  slug    : ${doc.slug}`)
console.log(`  title   : ${doc.title}`)
console.log(`  author  : ${doc.author}`)
console.log(`  created : ${doc.createdAt}`)
console.log(`  words   : ${words}`)

if (!APPLY) {
  console.log("\nDry run — nothing deleted. Re-run with --apply.")
  await mongoose.disconnect()
  process.exit(0)
}

const dir = path.resolve(process.cwd(), "backups")
if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
const stamp = new Date().toISOString().replace(/[:.]/g, "-")
const backup = path.join(dir, `deleted-blog-${SLUG}-${stamp}.json`)
writeFileSync(backup, JSON.stringify(doc, null, 2))
console.log(`\nBackup written: ${backup}`)

const res = await blogs.deleteOne({ _id: doc._id })
console.log(`Deleted ${res.deletedCount} document.`)
console.log("Remember the 301 in clt-acdemy/next.config.ts.")

await mongoose.disconnect()

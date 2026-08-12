/**
 * Rewrite stored blog image URLs from one host to another.
 *
 * Used to move off the raw Cloudflare `pub-<hash>.r2.dev` hostname and onto the
 * owned CDN domain (SEO handover DEV-032). The r2.dev hostname weakens brand
 * association in image search and adds a DNS lookup to an unrelated host.
 *
 * Why not `migrate-media-to-r2.mjs`: that script only rewrites `Blog.photo`.
 * Most image URLs live inside the article HTML in `Blog.content` — on a sampled
 * post, 10 of 14 were in the body — so a photo-only pass would leave the
 * majority of images on the old host.
 *
 * The rewrite is a plain host-for-host string swap. Object keys are untouched,
 * so this is only valid once the objects exist at the same paths under the new
 * host. Verify that first.
 *
 * Usage:
 *   node scripts/rewrite-media-host.mjs                 # dry run, writes nothing
 *   node scripts/rewrite-media-host.mjs --apply         # write, after backing up
 *   node scripts/rewrite-media-host.mjs --apply --from=https://old --to=https://new
 *
 * Defaults to the DEV-032 migration hosts. `--apply` always writes a timestamped
 * backup of every affected document to ./backups/ before touching the database.
 *
 * Idempotent: documents already free of the old host are skipped, so a second
 * run is a no-op.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import path from "node:path"
import mongoose from "mongoose"

const DEFAULT_FROM = "https://pub-f6c8ef0c2045452392b80e6506116a6e.r2.dev"
const DEFAULT_TO = "https://cdn.clt-academy.com"

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : fallback
}

const APPLY = process.argv.includes("--apply")
const FROM = arg("from", DEFAULT_FROM).replace(/\/$/, "")
const TO = arg("to", DEFAULT_TO).replace(/\/$/, "")

if (!FROM || !TO || FROM === TO) {
  console.error("--from and --to must both be set and differ")
  process.exit(1)
}

/** Read MONGO_URI from the environment, falling back to .env / .env.local. */
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
    if (m) {
      // Strip surrounding quotes only. Do NOT treat # as a comment: it is a
      // legal password character and stripping it corrupts the credential.
      return m[1].trim().replace(/^(["'])([\s\S]*)\1$/, "$2")
    }
  }
  throw new Error("MONGO_URI not found in env or .env/.env.local")
}

const countOccurrences = (text, needle) =>
  typeof text === "string" ? text.split(needle).length - 1 : 0

const uri = loadMongoUri()
// authSource must match lib/mongodb.ts — credentials live in the admin db.
await mongoose.connect(uri, { authSource: "admin" })
const blogs = mongoose.connection.collection("blogs")

const docs = await blogs
  .find(
    { $or: [{ photo: { $regex: FROM } }, { content: { $regex: FROM } }] },
    { projection: { title: 1, slug: 1, photo: 1, content: 1 } }
  )
  .toArray()

console.log(`${APPLY ? "APPLY" : "DRY RUN"}`)
console.log(`  from: ${FROM}`)
console.log(`  to:   ${TO}`)
console.log(`  ${docs.length} document(s) reference the old host\n`)

let totalPhoto = 0
let totalContent = 0
const plan = []

for (const doc of docs) {
  const inPhoto = countOccurrences(doc.photo, FROM)
  const inContent = countOccurrences(doc.content, FROM)
  totalPhoto += inPhoto
  totalContent += inContent

  const update = {}
  if (inPhoto) update.photo = doc.photo.split(FROM).join(TO)
  if (inContent) update.content = doc.content.split(FROM).join(TO)

  plan.push({ _id: doc._id, update })
  console.log(
    `  ${String(inPhoto).padStart(2)} photo  ${String(inContent).padStart(
      3
    )} body   ${doc.slug || doc.title || doc._id}`
  )
}

console.log(
  `\n  totals: ${totalPhoto} in photo, ${totalContent} in content, ` +
    `${totalPhoto + totalContent} URL(s) across ${docs.length} document(s)`
)

if (!docs.length) {
  console.log("\nNothing to do.")
  await mongoose.disconnect()
  process.exit(0)
}

if (!APPLY) {
  console.log("\nDry run — nothing written. Re-run with --apply to write.")
  await mongoose.disconnect()
  process.exit(0)
}

// Full pre-change snapshot of every affected document, so the rewrite can be
// reversed even if the old host is later switched off.
const dir = path.resolve(process.cwd(), "backups")
if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
const stamp = new Date().toISOString().replace(/[:.]/g, "-")
const backup = path.join(dir, `blogs-media-host-${stamp}.json`)
writeFileSync(backup, JSON.stringify(docs, null, 2))
console.log(`\nBackup written: ${backup}`)

let updated = 0
for (const { _id, update } of plan) {
  const res = await blogs.updateOne({ _id }, { $set: update })
  updated += res.modifiedCount
}

console.log(`Updated ${updated} of ${plan.length} document(s).`)

const left = await blogs.countDocuments({
  $or: [{ photo: { $regex: FROM } }, { content: { $regex: FROM } }],
})
console.log(`Remaining references to the old host: ${left}`)

await mongoose.disconnect()

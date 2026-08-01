/**
 * Backfills Blog.slug and builds the unique index.
 *
 * Order matters: the index cannot build while duplicate slugs exist, so every
 * document is assigned a unique slug first.
 *
 * Sorted createdAt DESC to match how the site resolves a slug today — the list
 * API sorts newest-first and the lookup takes the first match. Claiming in that
 * same order means the post currently answering a URL keeps it, and the
 * shadowed one gets the -2 suffix. Ascending would silently repoint a live,
 * indexed URL at different content.
 *
 * Run with --apply to write. Without it, prints the plan and exits.
 *
 *   node scripts/backfill-blog-slugs.mjs           # dry run
 *   node scripts/backfill-blog-slugs.mjs --apply
 */
import mongoose from "mongoose"
import { readFileSync } from "node:fs"

const APPLY = process.argv.includes("--apply")

function loadEnv() {
  if (process.env.MONGO_URI) return process.env.MONGO_URI
  for (const f of [".env.local", ".env"]) {
    let raw
    try {
      raw = readFileSync(f, "utf8")
    } catch {
      continue
    }
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*MONGO_URI\s*=\s*(.*)$/)
      if (!m) continue
      // Strip surrounding quotes only. Do NOT treat # as a comment: it is a
      // legal password character and stripping it corrupts the credential.
      return m[1].trim().replace(/^(["'])([\s\S]*)\1$/, "$2")
    }
  }
  throw new Error("MONGO_URI not found in env or .env.local/.env")
}

const slugify = (title) =>
  title
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const uri = loadEnv()
// authSource must match lib/mongodb.ts — credentials live in the admin db.
await mongoose.connect(uri, { authSource: "admin" })
const blogs = mongoose.connection.collection("blogs")

const docs = await blogs
  .find({}, { projection: { title: 1, slug: 1, createdAt: 1 } })
  .sort({ createdAt: -1 })
  .toArray()

const taken = new Set(docs.filter((d) => d.slug).map((d) => d.slug))
const plan = []

for (const doc of docs) {
  if (doc.slug) continue
  const base = slugify(doc.title || "") || "post"
  let slug = base
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`
  taken.add(slug)
  plan.push({ _id: doc._id, title: doc.title, slug, collided: slug !== base })
}

console.log(`${docs.length} posts, ${plan.length} need a slug`)
for (const p of plan) {
  console.log(`  ${p.collided ? "COLLISION " : "          "}${p.slug}  <- ${p.title}`)
}

if (!APPLY) {
  console.log("\nDry run. Re-run with --apply to write.")
  await mongoose.disconnect()
  process.exit(0)
}

for (const p of plan) {
  await blogs.updateOne({ _id: p._id }, { $set: { slug: p.slug } })
}
console.log(`Updated ${plan.length} documents`)

await blogs.createIndex({ slug: 1 }, { unique: true, name: "slug_unique" })
console.log("Built unique index slug_unique")

await mongoose.disconnect()

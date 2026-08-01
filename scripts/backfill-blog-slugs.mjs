/**
 * Backfills Blog.slug and builds the unique index.
 *
 * Order matters: the index cannot build while duplicate slugs exist, so every
 * document is assigned a unique slug first. Existing URLs are derived from
 * slugify(title), so the first post to claim a title keeps its live URL and
 * later collisions get -2, -3. Sorted by createdAt so "first" is the oldest
 * post, i.e. the one already indexed.
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
    try {
      const m = readFileSync(f, "utf8").match(/^MONGO_URI=(.*)$/m)
      if (m) return m[1].trim().replace(/^["']|["']$/g, "")
    } catch {}
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
await mongoose.connect(uri)
const blogs = mongoose.connection.collection("blogs")

const docs = await blogs
  .find({}, { projection: { title: 1, slug: 1, createdAt: 1 } })
  .sort({ createdAt: 1 })
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

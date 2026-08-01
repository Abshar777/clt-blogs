import { Blog } from "@/lib/models/Blog"

/** Must stay byte-identical to slugify() in the main site's lib/getBlogPosts.ts. */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Slugs were derived from the title at render time, so two posts sharing a
 * title resolved to one URL and the second silently became unreachable.
 * Suffixes the first free `-2`, `-3`, … instead.
 */
export async function uniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title) || "post"

  for (let n = 1; ; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`
    const clash = await Blog.findOne({
      slug: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
      .select("_id")
      .lean()

    if (!clash) return candidate
  }
}

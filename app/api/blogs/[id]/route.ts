import { connectDB } from "@/lib/mongodb"
import { Author } from "@/lib/models/Author"
import { Blog } from "@/lib/models/Blog"
import { serializeBlog } from "@/lib/serializers/blog"
import { uniqueSlug } from "@/lib/slug"
import { normalizeBlogContent } from "@/lib/normalizeContent"
import { type NextRequest, NextResponse } from "next/server"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await connectDB()
    const { id } = await context.params
    const blog = await Blog.findById(id)
      .populate("authorId", "name profession link createdAt updatedAt")
      .populate("reviewerId", "name profession link createdAt updatedAt")

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    return NextResponse.json(serializeBlog(blog))
  } catch (error) {
    console.error("GET /api/blogs/[id] error:", error)
    return NextResponse.json({ error: "Failed to fetch blog" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const isAdmin = request.cookies.get("admin_auth")
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const { id } = await context.params
    const data = await request.json()

    const payload: Record<string, unknown> = { ...data }

    // Only touch the byline when the caller actually sent it.
    //
    // This previously defaulted on every request: a client that did not send
    // authorId — the SEO editor at /admin/edit/[id] does not — had the post's
    // authorId reset to null and its author reset to "Admin", silently
    // stripping the byline the public site renders and the Person entity in
    // its schema. The same applies to every field added since: a partial save
    // from one editor must not erase what another editor set.
    if (data.authorId !== undefined) {
      const selectedAuthor =
        data.authorId && typeof data.authorId === "string"
          ? await Author.findById(data.authorId).select("name")
          : null
      payload.author = selectedAuthor?.name || data.author || "Admin"
      payload.authorId = data.authorId || null
    } else {
      delete payload.author
    }

    if (data.reviewerId !== undefined) payload.reviewerId = data.reviewerId || null
    if (data.type !== undefined)
      payload.type = data.type === "guide" ? "guide" : "post"
    if (data.relatedCourses !== undefined)
      payload.relatedCourses = Array.isArray(data.relatedCourses)
        ? data.relatedCourses
        : []
    if (data.relatedPosts !== undefined)
      payload.relatedPosts = Array.isArray(data.relatedPosts)
        ? data.relatedPosts
        : []

    if (data.content !== undefined) payload.content = normalizeBlogContent(data.content)

    // Only re-slug on explicit request. Changing a published post's URL
    // silently would orphan every existing inbound link.
    if (data.category !== undefined) payload.category = data.category || null
    if (data.seo) payload.seo = data.seo

    if (data.slug) {
      payload.slug = await uniqueSlug(data.slug, id)
    } else {
      delete payload.slug
    }

    const blog = await Blog.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    })
      .populate("authorId", "name profession link createdAt updatedAt")
      .populate("reviewerId", "name profession link createdAt updatedAt")

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    return NextResponse.json(serializeBlog(blog))
  } catch (error) {
    console.error("PUT /api/blogs/[id] error:", error)
    return NextResponse.json({ error: "Failed to update blog" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const isAdmin = request.cookies.get("admin_auth")
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const { id } = await context.params
    const blog = await Blog.findByIdAndDelete(id)

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Blog deleted successfully" })
  } catch (error) {
    console.error("DELETE /api/blogs/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete blog" }, { status: 500 })
  }
}

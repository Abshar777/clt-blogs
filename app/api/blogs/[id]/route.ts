import { connectDB } from "@/lib/mongodb"
import { Author } from "@/lib/models/Author"
import { Blog } from "@/lib/models/Blog"
import { serializeBlog } from "@/lib/serializers/blog"
import { type NextRequest, NextResponse } from "next/server"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await connectDB()
    const { id } = await context.params
    const blog = await Blog.findById(id).populate(
      "authorId",
      "name profession link createdAt updatedAt",
    )

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    return NextResponse.json(serializeBlog(blog))
  } catch (error) {
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
    const selectedAuthor =
      data.authorId && typeof data.authorId === "string"
        ? await Author.findById(data.authorId).select("name")
        : null

    const payload = {
      ...data,
      author: selectedAuthor?.name || data.author || "Admin",
      authorId: data.authorId || null,
    }

    const blog = await Blog.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).populate("authorId", "name profession link createdAt updatedAt")

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    return NextResponse.json(serializeBlog(blog))
  } catch (error) {
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
    return NextResponse.json({ error: "Failed to delete blog" }, { status: 500 })
  }
}

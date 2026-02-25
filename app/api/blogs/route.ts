import { connectDB } from "@/lib/mongodb"
import { Author } from "@/lib/models/Author"
import { Blog } from "@/lib/models/Blog"
import { serializeBlog } from "@/lib/serializers/blog"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // get query data
    const query = request.nextUrl.searchParams
    const category = query.get("category")
    await connectDB()
    const blogs = await Blog.find(category ? { tags: { $in: [category] } } : {})
      .populate("authorId", "name profession link createdAt updatedAt")
      .sort({ createdAt: -1 })
    
    return NextResponse.json(blogs.map(serializeBlog))
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Request received")
    const isAdmin = request.cookies.get("admin_auth")
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log("Admin authorized")
    await connectDB()
    console.log("Connected to MongoDB")
    const data = await request.json()
    const selectedAuthor =
      data.authorId && typeof data.authorId === "string"
        ? await Author.findById(data.authorId).select("name")
        : null

    const blog = await Blog.create({
      ...data,
      tags: data.tags || [],
      author: selectedAuthor?.name || data.author || "Admin",
      authorId: data.authorId || null,
    })

    const populatedBlog = await Blog.findById(blog._id).populate(
      "authorId",
      "name profession link createdAt updatedAt",
    )

    return NextResponse.json(serializeBlog(populatedBlog || blog), { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create blog" }, { status: 500 })
  }
}

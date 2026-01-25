import { connectDB } from "@/lib/mongodb"
import { Blog } from "@/lib/models/Blog"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    await connectDB()
    const tags = await Blog.find().sort({ createdAt: -1 }).select("tags")
    // i want to count the tages how many times they appear in the database
    const uniqueTags = tags.reduce((acc, tag) => {
      tag.tags.forEach((t: string) => {
        acc[t] = (acc[t] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)
    
    return NextResponse.json(uniqueTags)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 })
  }
}

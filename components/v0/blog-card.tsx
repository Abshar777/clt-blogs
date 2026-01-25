"use client"

import Link from "next/link"
import Image from "next/image"

interface BlogCardProps {
  blog: {
    _id: string
    title: string
    description: string
    photo: string
    tags: string[]
    createdAt: string
  }
  onDelete: () => void
}

export function BlogCard({ blog, onDelete }: BlogCardProps) {
  const formattedDate = new Date(blog.createdAt).toLocaleDateString()

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
      <div className="relative h-48 w-full">
        <Image src={blog.photo || "/placeholder.svg"} alt={blog.title} fill className="object-cover" />
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">{blog.title}</h3>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{blog.description}</p>

        {blog.tags.length > 0 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {blog.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {tag}
              </span>
            ))}
            {blog.tags.length > 2 && <span className="text-gray-500 text-xs">+{blog.tags.length - 2}</span>}
          </div>
        )}

        <p className="text-xs text-gray-500 mb-4">{formattedDate}</p>

        <div className="flex gap-2">
          <Link
            href={`/admin/edit/${blog._id}`}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-center text-sm hover:bg-blue-700 transition"
          >
            Edit
          </Link>
          <button
            onClick={onDelete}
            className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

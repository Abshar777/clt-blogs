import mongoose from "mongoose"

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // Unique at the DB level, not just in application code — the public URL
    // depends on it and a collision makes a post unreachable.
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    photo: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      default: "Admin",
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
)

export const Blog = mongoose.models.Blog || mongoose.model("Blog", blogSchema)

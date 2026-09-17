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
    // Controlled taxonomy. Free-text tags stay for topic detail; the category
    // is what drives the /blogs/category hubs and related-post links.
    category: {
      type: String,
      enum: [
        "forex-basics",
        "trading-psychology",
        "risk-management",
        "trading-strategies",
        "uae-markets-regulation",
        "crypto-trading",
        "stock-markets",
      ],
      default: null,
    },
    // Separates the pillar reference guides served from /learn from ordinary
    // blog posts. Defaults to "post" so every existing record keeps its
    // current behaviour with no migration.
    type: {
      type: String,
      enum: ["post", "guide"],
      default: "post",
      index: true,
    },
    // Second byline for guides: who checked the content, as opposed to who
    // wrote it. Reviewers and authors are the same kind of entity, so both
    // point at the Author collection rather than duplicating name/title/link
    // on every document.
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
      default: null,
    },
    // Course ids for the call to action. The public site has read this field
    // since the related-course block shipped, but it was never defined here,
    // so Mongoose stripped it on every save and the value could never persist.
    relatedCourses: {
      type: [Number],
      default: [],
    },
    // Supporting articles an editor maps to a pillar guide.
    relatedPosts: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Blog",
      default: [],
    },
    // Lets marketing publish an optimised page without a code deploy.
    seo: {
      metaTitle: { type: String, trim: true, default: "" },
      metaDescription: { type: String, trim: true, default: "" },
      canonicalOverride: { type: String, trim: true, default: "" },
      ogImage: { type: String, trim: true, default: "" },
      noindex: { type: Boolean, default: false },
      focusKeyword: { type: String, trim: true, default: "" },
      schemaOverride: { type: String, default: "" },
    },
    photo: {
      type: String,
      required: true,
    },
    // Manually set by the author, in whole minutes. Word-count estimation
    // was replaced because it was frequently wrong on posts with tables,
    // code blocks, or embedded media.
    readTime: {
      type: Number,
      required: true,
      min: 1,
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

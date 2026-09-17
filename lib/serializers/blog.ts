import { Types } from "mongoose";

type PopulatedAuthor = {
  _id: Types.ObjectId | string;
  name: string;
  profession: string;
  link: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type BlogDocLike = {
  toObject?: () => Record<string, unknown>;
  _doc?: Record<string, unknown>;
  _id?: Types.ObjectId | string;
  author?: string;
  authorId?: Types.ObjectId | string | PopulatedAuthor | null;
  reviewerId?: Types.ObjectId | string | PopulatedAuthor | null;
};

/** A ref is either populated to a full author document or left as an id. */
const populated = (value: unknown): PopulatedAuthor | null =>
  value && typeof value === "object" && "name" in (value as object)
    ? (value as PopulatedAuthor)
    : null;

const asProfile = (author: PopulatedAuthor | null) =>
  author
    ? {
        _id: String(author._id),
        name: author.name,
        profession: author.profession,
        link: author.link,
        createdAt: author.createdAt?.toISOString(),
        updatedAt: author.updatedAt?.toISOString(),
      }
    : null;

export function serializeBlog(blog: BlogDocLike) {
  const base: any =
    typeof blog.toObject === "function"
      ? blog.toObject()
      : blog._doc
        ? { ...blog._doc }
        : { ...blog };

  const resolvedAuthor = populated(base.authorId);
  const resolvedReviewer = populated(base.reviewerId);

  return {
    ...base,
    _id: String(base._id),
    authorId: resolvedAuthor
      ? String(resolvedAuthor._id)
      : base.authorId
        ? String(base.authorId)
        : undefined,
    author: resolvedAuthor?.name || base.author || "Admin",
    authorDetails: asProfile(resolvedAuthor),
    reviewerId: resolvedReviewer
      ? String(resolvedReviewer._id)
      : base.reviewerId
        ? String(base.reviewerId)
        : undefined,
    reviewerDetails: asProfile(resolvedReviewer),
  };
}

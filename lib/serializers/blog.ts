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
};

export function serializeBlog(blog: BlogDocLike) {
  const base: any =
    typeof blog.toObject === "function"
      ? blog.toObject()
      : blog._doc
        ? { ...blog._doc }
        : { ...blog };

  const resolvedAuthor =
    base.authorId && typeof base.authorId === "object" && "name" in base.authorId
      ? (base.authorId as PopulatedAuthor)
      : null;

  return {
    ...base,
    _id: String(base._id),
    authorId: resolvedAuthor
      ? String(resolvedAuthor._id)
      : base.authorId
        ? String(base.authorId)
        : undefined,
    author: resolvedAuthor?.name || base.author || "Admin",
    authorDetails: resolvedAuthor
      ? {
          _id: String(resolvedAuthor._id),
          name: resolvedAuthor.name,
          profession: resolvedAuthor.profession,
          link: resolvedAuthor.link,
          createdAt: resolvedAuthor.createdAt?.toISOString(),
          updatedAt: resolvedAuthor.updatedAt?.toISOString(),
        }
      : null,
  };
}

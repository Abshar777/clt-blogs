import React from "react";
import { Post } from "@/types";

interface BlogCardProps {
  post: Post;
  onClick: (post: Post) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

const BlogCard: React.FC<BlogCardProps> = ({
  post,
  onClick,
  onEdit,
  onDelete,
  isAdmin,
}) => {
  return (
    <div
      className="group relative bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden hover:border-primary transition-all duration-500 cursor-pointer flex flex-col shadow-2xl hover:shadow-primary/10"
      onClick={() => onClick(post)}
    >
      <div className="aspect-[4/3] overflow-hidden relative">
        <img
          src={post.photo}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>

        {/* Always visible. These were opacity-0 until the card was hovered,
            which hid them completely on any touch device and made them
            undiscoverable on desktop — editors reported there was no way to
            edit or delete anything at all. */}
        {isAdmin && (
          <div className="absolute top-4 right-4 flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(post);
              }}
              className="flex items-center gap-2 h-10 px-3 rounded-xl bg-zinc-950/90 backdrop-blur-md border border-zinc-700 text-zinc-200 hover:text-primary hover:border-primary/50 transition-all text-xs font-bold uppercase tracking-wider"
              title="Edit this entry"
              aria-label={`Edit ${post.title}`}
            >
              <i className="fa-solid fa-pen-nib text-xs"></i>
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Permanently delete this entry from database?")) {
                  onDelete?.(post._id);
                }
              }}
              className="flex items-center gap-2 h-10 px-3 rounded-xl bg-zinc-950/90 backdrop-blur-md border border-zinc-700 text-zinc-200 hover:text-red-500 hover:border-red-500/50 transition-all text-xs font-bold uppercase tracking-wider"
              title="Delete this entry"
              aria-label={`Delete ${post.title}`}
            >
              <i className="fa-solid fa-trash-can text-xs"></i>
              Delete
            </button>
          </div>
        )}

        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex flex-wrap gap-2 mb-3">
            {/* A guide is served from /learn, not /blogs. Without this the two
                are indistinguishable in a list of thirty entries. */}
            {post.type === "guide" && (
              <span className="px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] bg-emerald-500/15 text-emerald-300 rounded-lg border border-emerald-500/40 backdrop-blur-md">
                Guide · /learn
              </span>
            )}
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] bg-primary/20 text-primary 400 rounded-lg border border-primary/20 backdrop-blur-md"
              >
                {tag}
              </span>
            ))}
          </div>
          <h3 className="text-xl md:text-2xl font-black text-white leading-tight  400 transition-colors line-clamp-2">
            {post.title}
          </h3>
        </div>
      </div>

      <div className="p-8 flex-1 flex flex-col">
        <p className="text-zinc-500 text-sm line-clamp-3 mb-6 font-medium leading-relaxed italic">
          "{post.description}"
        </p>

        <div className="flex items-center justify-between mt-auto pt-6 border-t border-zinc-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 border border-zinc-700 shadow-inner group-hover:border-primary/30 transition-colors">
              <i className="fa-solid fa-user-astronaut text-sm"></i>
            </div>
            <div className="">
              <p className="text-zinc-300 font-black uppercase tracking-tighter text-xs">
                {post.authorDetails?.name || post.author}
              </p>
              <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-wide">
                {post.authorDetails?.profession || "Admin"} •{" "}
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-700 group-hover:text-primary group-hover:border-primary/50 transition-all">
            <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;

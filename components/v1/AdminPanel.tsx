import React, { useState, useEffect } from "react";
import { AuthorProfile, Post } from "@/types";
import {
  improveContent,
  generateTagsAndDescription,
} from "@/lib/geminiService";
import { ImageUpload } from "@/components/v0/image-upload";
import { RichTextEditor } from "@/components/v0/rich-text-editor";

interface AdminPanelProps {
  onAddPost: (post: Partial<Post>) => void;
  onUpdatePost: (id: string, post: Partial<Post>) => void;
  onClose: () => void;
  editingPost: Post | null;
  authors: AuthorProfile[];
  posts: Post[];
  /** Set by whichever button opened the panel; decides where a new entry publishes. */
  initialType?: "post" | "guide";
  onAuthorCreated: () => Promise<void>;
}

/**
 * Mirrors the course catalogue on the public site, which keeps courses in code
 * rather than in this CMS. Ids must match COURSE_SLUGS there.
 */
const COURSE_OPTIONS = [
  { id: 1, name: "Trade Craft (beginner)" },
  { id: 2, name: "Profit Matrix (intermediate)" },
  { id: 3, name: "Market Code (advanced)" },
  { id: 4, name: "CLT Vantage (mentorship)" },
];

const AdminPanel: React.FC<AdminPanelProps> = ({
  onAddPost,
  onUpdatePost,
  onClose,
  editingPost,
  authors,
  posts,
  initialType = "post",
  onAuthorCreated,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    photo: "",
    readTime: "",
    tags: "",
    authorId: "",
    type: initialType,
    reviewerId: "",
  });
  const [relatedCourses, setRelatedCourses] = useState<number[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<string[]>([]);
  const [newAuthor, setNewAuthor] = useState({
    name: "",
    profession: "",
    link: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiStatus, setAiStatus] = useState("");

  useEffect(() => {
    if (editingPost) {
      setFormData({
        title: editingPost.title,
        description: editingPost.description,
        content: editingPost.content,
        photo: editingPost.photo,
        readTime: editingPost.readTime ? String(editingPost.readTime) : "",
        tags: editingPost.tags.join(", "),
        authorId: editingPost.authorId || "",
        type: editingPost.type === "guide" ? "guide" : "post",
        reviewerId: editingPost.reviewerId || "",
      });
      setRelatedCourses(editingPost.relatedCourses || []);
      setRelatedPosts(editingPost.relatedPosts || []);
    }
  }, [editingPost]);

  const handleImageUpload = (url: string) => {
    setFormData((prev) => ({ ...prev, photo: url }));
  };

  const handleImproveContent = async () => {
    if (!formData.content) return;
    setIsProcessing(true);
    setAiStatus("Gemini is refining your prose...");
    try {
      // Stripping HTML for AI processing to keep it clean, though Gemini handles HTML okay too
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = formData.content;
      const textOnly = tempDiv.textContent || tempDiv.innerText || "";

      const improved = await improveContent(textOnly);
      // We wrap the improved text back into paragraphs for the editor
      const wrappedImproved = `<p>${improved.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`;
      setFormData((prev) => ({ ...prev, content: wrappedImproved }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
      setAiStatus("");
    }
  };

  const handleAutoFill = async () => {
    if (!formData.title || !formData.content) return;
    setIsProcessing(true);
    setAiStatus("Gemini is generating metadata...");
    try {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = formData.content;
      const textOnly = tempDiv.textContent || tempDiv.innerText || "";

      const { tags, description } = await generateTagsAndDescription(
        formData.title,
        textOnly,
      );
      setFormData((prev) => ({
        ...prev,
        tags: tags.join(", "),
        description: description,
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
      setAiStatus("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content || !formData.photo) {
      alert("Title, Content, and a Photo are required!");
      return;
    }

    const readTimeMinutes = Number(formData.readTime);
    if (!formData.readTime || !Number.isInteger(readTimeMinutes) || readTimeMinutes < 1) {
      alert("Reading Time is required and must be a whole number of minutes (1 or more).");
      return;
    }

    setIsProcessing(true);
    setAiStatus("Synchronizing with Database...");

    const postPayload: Partial<Post> = {
      title: formData.title,
      description:
        formData.description ||
        formData.content.replace(/<[^>]*>?/gm, "").substring(0, 150) + "...",
      content: formData.content,
      photo: formData.photo,
      readTime: readTimeMinutes,
      tags: formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t !== ""),
      author: "Admin",
      authorId: formData.authorId || null,
      type: formData.type === "guide" ? "guide" : "post",
      reviewerId: formData.reviewerId || null,
      relatedCourses,
      relatedPosts,
    };

    try {
      if (editingPost) {
        await onUpdatePost(editingPost._id, postPayload);
      } else {
        await onAddPost(postPayload);
      }
      onClose();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Database error. Operation failed.");
    } finally {
      setIsProcessing(false);
      setAiStatus("");
    }
  };

  const handleCreateAuthor = async () => {
    if (!newAuthor.name || !newAuthor.profession || !newAuthor.link) {
      alert("Please fill name, profession and link to create user.");
      return;
    }

    setIsProcessing(true);
    setAiStatus("Creating user...");
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAuthor),
      });

      if (!response.ok) {
        throw new Error("Failed to create user");
      }

      const createdAuthor = await response.json();
      await onAuthorCreated();
      setFormData((prev) => ({ ...prev, authorId: createdAuthor._id }));
      setNewAuthor({ name: "", profession: "", link: "" });
    } catch (error) {
      console.error(error);
      alert("Unable to create user.");
    } finally {
      setIsProcessing(false);
      setAiStatus("");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-[1500px] bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        <div className="px-8 py-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <i
                className={`fa-solid ${editingPost ? "fa-pen-to-square" : "fa-plus"} text-xl`}
              ></i>
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-100 uppercase tracking-tight">
                {editingPost ? "Edit" : "New"}{" "}
                {formData.type === "guide" ? "Learn Guide" : "Blog Post"}
              </h2>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                {formData.type === "guide"
                  ? "Publishes to clt-academy.com/learn"
                  : "Publishes to clt-academy.com/blogs"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-500 hover:text-white transition-all border border-zinc-700"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10 max-h-[86vh] overflow-y-auto custom-scrollbar"
        >
          <div className="lg:col-span-4 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Post title"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">
                Cover Image
              </label>
              <ImageUpload
                onImageUpload={handleImageUpload}
                currentImage={formData.photo}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">
                  Metadata
                </label>
                <button
                  type="button"
                  onClick={handleAutoFill}
                  disabled={
                    isProcessing || !formData.title || !formData.content
                  }
                  className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary disabled:opacity-30 transition-all flex items-center space-x-1"
                >
                  <i className="fa-solid fa-sparkles text-[8px]"></i>
                  <span>AI Generate</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Short summary shown in listings and search results"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none text-sm leading-relaxed"
              />
              <input
                type="text"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                placeholder="Tags, separated by commas"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
              />
              <input
                type="number"
                min={1}
                step={1}
                required
                value={formData.readTime}
                onChange={(e) =>
                  setFormData({ ...formData, readTime: e.target.value })
                }
                placeholder="Reading Time (minutes) *"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">
                Publishing As
              </label>
              {/* Chosen by the button that opened this panel, so nobody has to
                  know that a hidden dropdown decides where the page appears.
                  Still switchable while editing, since a post can be promoted. */}
              <div className="flex gap-2">
                {[
                  { v: "post", label: "Blog Post", path: "/blogs" },
                  { v: "guide", label: "Learn Guide", path: "/learn" },
                ].map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: o.v })}
                    className={`flex-1 rounded-2xl border px-4 py-3 text-left transition-all ${
                      formData.type === o.v
                        ? "border-primary bg-primary/10 text-zinc-100"
                        : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700"
                    }`}
                  >
                    <span className="block text-sm font-bold">{o.label}</span>
                    <span className="block text-[10px] text-zinc-500">{o.path}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-zinc-600 leading-relaxed ml-1">
                A guide lives at /learn and is kept out of the blog listing and
                blog sitemap, so the same content never sits at two addresses.
              </p>

              {formData.type === "guide" && (
                <div className="border border-zinc-800 rounded-2xl p-4 space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">
                      Reviewed By
                    </p>
                    <select
                      value={formData.reviewerId}
                      onChange={(e) =>
                        setFormData({ ...formData, reviewerId: e.target.value })
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all text-sm"
                    >
                      <option value="">No reviewer</option>
                      {authors.map((author) => (
                        <option key={author._id} value={author._id}>
                          {author.name} - {author.profession}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-zinc-600 leading-relaxed">
                      Shown as a second byline and published as reviewedBy in the
                      page schema. Leave empty if nobody has checked it.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">
                      Course Call To Action
                    </p>
                    {COURSE_OPTIONS.map((course) => (
                      <label
                        key={course.id}
                        className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={relatedCourses.includes(course.id)}
                          onChange={(e) =>
                            setRelatedCourses((prev) =>
                              e.target.checked
                                ? [...prev, course.id]
                                : prev.filter((id) => id !== course.id),
                            )
                          }
                        />
                        <span>{course.name}</span>
                      </label>
                    ))}
                    <p className="text-[10px] text-zinc-600 leading-relaxed">
                      Up to two are shown. Leave all unchecked to let the site
                      pick by category.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">
                      Supporting Articles
                    </p>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {posts
                        .filter(
                          (post) =>
                            post.type !== "guide" &&
                            post._id !== editingPost?._id,
                        )
                        .map((post) => (
                          <label
                            key={post._id}
                            className="flex items-start gap-3 text-sm text-zinc-300 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={relatedPosts.includes(post._id)}
                              onChange={(e) =>
                                setRelatedPosts((prev) =>
                                  e.target.checked
                                    ? [...prev, post._id]
                                    : prev.filter((id) => id !== post._id),
                                )
                              }
                            />
                            <span className="leading-snug">{post.title}</span>
                          </label>
                        ))}
                    </div>
                    <p className="text-[10px] text-zinc-600 leading-relaxed">
                      These stay in the blog. Leave empty to fall back to the
                      guide's category.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">
                Writer/User
              </label>
              <select
                value={formData.authorId}
                onChange={(e) =>
                  setFormData({ ...formData, authorId: e.target.value })
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
              >
                <option value="">Default Admin</option>
                {authors.map((author) => (
                  <option key={author._id} value={author._id}>
                    {author.name} - {author.profession}
                  </option>
                ))}
              </select>

              <div className="border border-zinc-800 rounded-2xl p-4 space-y-3">
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">
                  Add New User
                </p>
                <input
                  type="text"
                  value={newAuthor.name}
                  onChange={(e) =>
                    setNewAuthor((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Name"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
                <input
                  type="text"
                  value={newAuthor.profession}
                  onChange={(e) =>
                    setNewAuthor((prev) => ({
                      ...prev,
                      profession: e.target.value,
                    }))
                  }
                  placeholder="Profession"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
                <input
                  type="url"
                  value={newAuthor.link}
                  onChange={(e) =>
                    setNewAuthor((prev) => ({ ...prev, link: e.target.value }))
                  }
                  placeholder="Profile Link (https://...)"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
                <button
                  type="button"
                  onClick={handleCreateAuthor}
                  disabled={isProcessing}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-all text-xs font-black uppercase tracking-[0.2em]"
                >
                  Create User
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col space-y-4 min-h-[60vh]">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">
                Content
              </label>
              <button
                type="button"
                onClick={handleImproveContent}
                disabled={isProcessing || !formData.content}
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary disabled:opacity-30 transition-all flex items-center space-x-1"
              >
                <i className="fa-solid fa-wand-magic-sparkles text-[8px]"></i>
                <span>Improve wording</span>
              </button>
            </div>

            <RichTextEditor
              value={formData.content}
              onChange={(val) => setFormData({ ...formData, content: val })}
            />

            {aiStatus && (
              <div className="flex items-center space-x-3 py-2 px-4 rounded-xl bg-primary/5 border border-primary/10 text-primary animate-pulse text-[10px] font-black uppercase tracking-widest">
                <i className="fa-solid fa-atom fa-spin"></i>
                <span>{aiStatus}</span>
              </div>
            )}

            <div className="flex space-x-4 pt-6 mt-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 px-8 py-5 rounded-2xl border border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-all font-black uppercase tracking-widest text-xs"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="flex-[2] px-8 py-5 rounded-2xl bg-zinc-100 text-zinc-950 hover:bg-white shadow-2xl shadow-white/5 transition-all font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-3 active:scale-[0.98]"
              >
                {isProcessing ? (
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                ) : (
                  <i
                    className={`fa-solid ${editingPost ? "fa-save" : "fa-paper-plane"}`}
                  ></i>
                )}
                <span>
                  {editingPost ? "Commit Changes" : "Initialize Transmission"}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPanel;

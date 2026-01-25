"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Post, User } from "@/types";
import { ADMIN_CREDENTIALS, INITIAL_POSTS } from "@/constants";
import BlogCard from "@/components/v1/BlogCard";
import PostModal from "@/components/v1/PostModal";
import AdminPanel from "@/components/v1/AdminPanel";
import { AdminGuard } from "@/components/v0/admin-guard";

const App: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Sync with Backend
  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/blogs");
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else {
        setPosts(INITIAL_POSTS);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      setPosts(INITIAL_POSTS);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAuth = async () => {
    try {
      const response = await fetch("/api/auth/verify");
      if (response.ok) {
        setCurrentUser({ id: "admin-1", username: "admin", role: "admin" });
      } else {
        setCurrentUser(null);
      }
    } catch (e) {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    fetchPosts();
    verifyAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      if (response.ok) {
        setCurrentUser({
          id: "admin-1",
          username: loginData.username,
          role: "admin",
        });
        setShowLoginModal(false);
        setLoginData({ username: "", password: "" });
      } else {
        alert("Credential verification failed.");
      }
    } catch (err) {
      // Fallback for demo if API not available
      if (
        loginData.username === ADMIN_CREDENTIALS.username &&
        loginData.password === ADMIN_CREDENTIALS.password
      ) {
        setCurrentUser({ id: "admin-1", username: "admin", role: "admin" });
        setShowLoginModal(false);
      } else {
        alert("Identity check failure.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      setCurrentUser(null);
    }
  };

  const handleAddPost = async (newPostData: Partial<Post>) => {
    try {
      const response = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPostData),
      });

      if (response.ok) {
        await fetchPosts();
      } else {
        throw new Error("API Write Error");
      }
    } catch (error) {
      console.error("Write Error:", error);
      const fallback: Post = {
        ...(newPostData as any),
        _id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      setPosts((prev) => [fallback, ...prev]);
    }
  };

  const handleUpdatePost = async (id: string, postData: Partial<Post>) => {
    try {
      const response = await fetch(`/api/blogs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });
      if (response.ok) {
        await fetchPosts();
      }
    } catch (error) {
      console.error("Update Error:", error);
      setPosts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, ...postData } : p)),
      );
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      const response = await fetch(`/api/blogs/${id}`, { method: "DELETE" });
      if (response.ok) {
        setPosts((prev) => prev.filter((p) => p._id !== id));
      }
    } catch (error) {
      console.error("Delete Error:", error);
      setPosts((prev) => prev.filter((p) => p._id !== id));
    }
  };

  const handleOpenEdit = (post: Post) => {
    setEditingPost(post);
    setShowAdminPanel(true);
  };

  const handleClosePanel = () => {
    setShowAdminPanel(false);
    setEditingPost(null);
  };

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  return (
    <div className="min-h-screen bg-zinc-950 selection:bg-primary/50 500/30 selection:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 w-full border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            <div
              className="flex items-center space-x-4 cursor-pointer group"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              {/* <div className="w-12 h-12 rounded-2xl bg-primary/50 600 flex items-center justify-center shadow-[0_0_40px_-5px_rgba(124,58,237,0.5)] group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <i className="fa-solid fa-atom text-white text-2xl"></i>
              </div> */}
              <div>
                <span className="text-3xl font-black tracking-tighter text-zinc-100 uppercase italic leading-none block">
                  Clt Academy
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600"></span>
              </div>
            </div>

            {/* <div className="hidden lg:flex flex-1 max-w-2xl mx-16">
              <div className="relative w-full group">
                <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 text-sm group-focus-within:text-primary/50 500 transition-colors"></i>
                <input
                  type="text"
                  placeholder="Scan data clusters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl py-4 pl-14 pr-6 text-sm text-zinc-300 focus:outline-none focus:border-primary/50 500 focus:ring-8 focus:ring-primary/50 500/5 transition-all placeholder:text-zinc-700 font-bold"
                />
              </div>
            </div> */}

            <div className="flex items-center space-x-6">
              {currentUser ? (
                <div className="flex items-center space-x-6">
                  <button
                    onClick={() => setShowAdminPanel(true)}
                    className="flex items-center space-x-3 bg-white hover:bg-zinc-200 text-zinc-950 px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95"
                  >
                    <i className="fa-solid fa-plus-circle"></i>
                    <span className="hidden sm:inline">New Data</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-600 hover:text-red-500 hover:border-red-500/30 transition-all"
                    title="Terminate Session"
                  >
                    <i className="fa-solid fa-power-off text-lg"></i>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-6 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white hover:border-zinc-700 transition-all flex items-center space-x-3 active:scale-95"
                >
                  <i className="fa-solid fa-key text-[10px]"></i>
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="pt-20 pb-24 px-6 text-center max-w-5xl mx-auto">
        <h1 className="text-7xl  font-black tracking-tighter text-zinc-100 mb-12 bg-gradient-to-b from-white via-zinc-400 to-zinc-800 bg-clip-text text-transparent leading-[0.85] italic">
          BLOGS
        </h1>
        {/* <p className="text-zinc-500 text-xl md:text-3xl max-w-3xl mx-auto font-light leading-relaxed tracking-tight">
          Architecting narratives across the digital horizon. Driven by Gemini's cognitive engines.
        </p> */}
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 sm:px-12 pb-48">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-60 space-y-8">
            <div className="w-20 h-20 border-t-4 border-primary/50 600 rounded-full animate-spin"></div>
            <span className="text-zinc-600 text-xs font-black uppercase tracking-[0.6em] animate-pulse">
              Scanning Neural Clusters
            </span>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {filteredPosts.map((post) => (
              <BlogCard
                key={post._id}
                post={post}
                onClick={setSelectedPost}
                onEdit={handleOpenEdit}
                isAdmin={currentUser?.role === "admin"}
                onDelete={handleDeletePost}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-48 text-zinc-900 border-4 border-dashed border-zinc-900 rounded-[4rem] group hover:border-zinc-800 transition-colors duration-1000">
            <i className="fa-solid fa-satellite-dish text-8xl mb-10 opacity-10 group-hover:rotate-12 transition-transform duration-1000"></i>
            <p className="text-2xl font-black uppercase tracking-[0.6em] opacity-20">
              Zero Signal Strength
            </p>
          </div>
        )}
      </main>

      {/* Footer */}

      {/* Modals */}
      <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />

      {showAdminPanel && (
        <AdminGuard onAuthFailed={() => setShowAdminPanel(false)}>
          <AdminPanel
            onAddPost={handleAddPost}
            onUpdatePost={handleUpdatePost}
            onClose={handleClosePanel}
            editingPost={editingPost}
          />
        </AdminGuard>
      )}

      {showLoginModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/98 backdrop-blur-3xl animate-in fade-in duration-500"
            onClick={() => setShowLoginModal(false)}
          ></div>
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[3rem] p-12 shadow-[0_0_150px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 rounded-3xl bg-primary/50 600 flex items-center justify-center shadow-[0_0_60px_-10px_rgba(124,58,237,1)] mx-auto mb-10 rotate-3">
              <i className="fa-solid fa-fingerprint text-white text-5xl"></i>
            </div>
            <h2 className="text-4xl font-black text-center text-zinc-100 mb-4 uppercase tracking-tighter italic leading-none">
              Access Required
            </h2>
            <p className="text-zinc-600 text-center text-sm mb-12 font-bold uppercase tracking-[0.2em]">
              Biometric verification in progress...
            </p>

            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] ml-4 mb-2 block">
                  Operator Identity
                </label>
                <input
                  type="text"
                  autoFocus
                  value={loginData.username}
                  onChange={(e) =>
                    setLoginData({ ...loginData, username: e.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-[1.5rem] px-8 py-5 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/50 500/50 transition-all font-bold tracking-tight"
                  placeholder="admin_root"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] ml-4 mb-2 block">
                  Cortex Secret
                </label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-[1.5rem] px-8 py-5 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/50 500/50 transition-all font-bold tracking-tight"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-white text-zinc-950 py-6 rounded-[1.5rem] font-black uppercase tracking-[0.4em] text-sm hover:scale-[1.03] active:scale-[0.97] transition-all mt-10 shadow-2xl shadow-white/5"
              >
                {isLoading ? "Authenticating..." : "Authenticate"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

"use client";

import { useEffect, useMemo, useState } from "react";
import PostCard from "@/components/features/post/PostCard";
import { useAuth } from "@/hooks/useAuth";
import { getPosts } from "@/services/postServices";
import type { Post } from "@/types/post";
import CreatePostModal from "@/components/features/post/CreatePostModal"

export default function MyPostsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState("Layout");
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);

      try {
        const data = await getPosts();
        setPosts(data);
      } catch (error) {
        console.error("Lỗi khi tải bài đăng của tôi", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const myPosts = useMemo(() => {
    const normalizedSearch = search.toLowerCase();

    return posts.filter((post) => {
      const isOwner = user ? post.ownerId === user.id : false;
      const matchesSearch =
        post.title.toLowerCase().includes(normalizedSearch) ||
        post.category.toLowerCase().includes(normalizedSearch) ||
        post.type.toLowerCase().includes(normalizedSearch);

      return isOwner && matchesSearch;
    });
  }, [posts, search, user]);

    // Logic lọc bài đăng (Search + Category)
  const filtered = posts.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === "" || p.category === selectedCategory;
    return matchSearch && matchCategory;
  });


  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-500">UET Marketplace</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              My Posts
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Chỉ hiển thị bài do {user?.fullName ?? "tài khoản hiện tại"} đăng.
            </p>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            type="button"
            className="inline-flex items-center justify-center rounded-full bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
          >
            + Tạo bài đăng
          </button>
          <CreatePostModal 
              isOpen={isCreating} 
                onClose={() => setIsCreating(false)}
                onPostCreated={(post) => setPosts((currentPosts) => [post, ...currentPosts])}
          />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
          {/* BỘ LỌC DANH MỤC MỚI THÊM */}
          <select
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium transition focus:border-cyan-500 focus:bg-white"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Tất cả danh mục</option>
            {/* Các option này nên khớp với danh mục bạn thiết kế trong form tạo bài */}
            <option value="Sách vở">Sách vở - Tài liệu</option>
            <option value="Quần áo">Quần áo</option>
            <option value="Đồ học tập">Đồ dùng học tập</option>
            <option value="Khác">Khác</option>
          </select>

          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nhập từ khóa để tìm kiếm..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-3xl bg-white p-12 text-center text-slate-500">
          Đang tải bài đăng của bạn...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {myPosts.map((post) => (
            <PostCard key={post.id} post={post} onClick={() => {}} />
          ))}

          {myPosts.length === 0 && (
            <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
              Tài khoản này chưa có bài đăng nào.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import PostCard, { typeColor } from "@/components/features/post/PostCard";
import CreatePostModal from "@/components/features/post/CreatePostModal";
import { getPosts } from "@/services/postServices";
import type { Post } from "@/types/post";

export default function PostsPage() {
  // State tìm kiếm và bộ lọc
  const [search, setSearch] = useState("");
  const [selectedPostType, setSelectedPostType] = useState("");
  
  // State dữ liệu bài đăng
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State quản lý Pop-up
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const data = await getPosts();
        setPosts(data);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Lọc bài đăng theo title và post_type từ DB
  const filtered = posts.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchType = selectedPostType === "" || p.post_category === selectedPostType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6 relative">
      {/* 1. HEADER + SEARCH + NÚT TẠO BÀI ĐĂNG */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800">📰 Danh sách bài đăng</h1>

        <div className="flex w-full md:w-auto gap-3 flex-grow justify-end">

          {/* BỘ LỌC LOẠI BÀI ĐĂNG (Thay cho Category cũ) */}
          <select
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium transition focus:border-cyan-500 focus:bg-white"
            value={selectedPostType}
            onChange={(e) => setSelectedPostType(e.target.value)}
          >
            <option value="">Tất cả loại bài</option>
            <option value="Selling">Mua bán</option>
            <option value="Trading">Trao đổi</option>
            <option value="Donating">Quyên góp</option>
          </select>

          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nhập từ khóa..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
            />
          </div>
          
          <button 
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center justify-center rounded-full bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600 whitespace-nowrap"
          >
            + Tạo bài đăng
          </button>

          <CreatePostModal 
              isOpen={isCreating} 
              onClose={() => setIsCreating(false)}
              onPostCreated={(post) => setPosts((currentPosts) => [post, ...currentPosts])}
          />
        </div>
      </div>

      {/* 2. KHU VỰC RENDER DANH SÁCH BÀI ĐĂNG */}
      {isLoading ? (
        <div className="text-center py-10 text-gray-500">Đang tải dữ liệu từ hệ thống...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((post) => (
            <PostCard 
              key={post.post_id} 
              post={post} 
              onClick={() => setSelectedPost(post)}
            />
          ))} 
          {filtered.length === 0 && (
             <div className="col-span-full text-center text-gray-500 py-10 bg-white rounded-xl">
               Không tìm thấy bài đăng nào.
             </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. POP-UP (MODAL) GIAO DIỆN XEM CHI TIẾT BÀI ĐĂNG */}
      {/* ============================================================== */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 md:p-10 transition-opacity duration-300">
          
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-full md:h-[85vh] flex flex-col md:flex-row overflow-hidden relative animate-fadeIn">
            
            {/* CỘT TRÁI: HÌNH ẢNH */}
            <div className="w-full md:w-3/5 bg-gray-100 flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-gray-200 relative">
              <img 
                // Sử dụng thumbnail_url từ DB, nếu null thì dùng ảnh mặc định
                src={selectedPost.thumbnail_url || "https://placehold.co/600x400?text=No+Image"} 
                alt={selectedPost.title} 
                className="w-full h-full object-contain rounded-lg"
              />
            </div>

            {/* CỘT PHẢI: THÔNG TIN CHI TIẾT */}
            <div className="w-full md:w-2/5 flex flex-col h-full bg-white">
              
              {/* Header */}
              <div className="p-4 border-blue-200 shadow-md flex items-center justify-between bg-blue-100/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-200 border flex items-center justify-center text-lg font-bold text-blue-700 uppercase">
                    {selectedPost.seller_email.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-800">{selectedPost.seller_email}</p>
                    <p className="text-xs text-gray-500">📅 {selectedPost.created_at ? new Date(selectedPost.created_at).toLocaleDateString("vi-VN") : "Chưa rõ"}</p>
                  </div>
                </div>
                <span className="text-xs text-blue-500 bg-white px-2 py-0.5 rounded shadow-sm border border-blue-100">
                  ID: {selectedPost.post_id}
                </span>
              </div>

              {/* Content chính */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Tiêu đề & Tag */}
                <div className="space-y-3">
                  <h2 className="text-3xl font-semibold text-gray-900 leading-tight">
                    {selectedPost.title}
                  </h2>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${typeColor?.[selectedPost.post_category] || "bg-gray-100 text-gray-700"}`}>
                       {selectedPost.post_category}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${selectedPost.approval === "Approved" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                       Trạng thái: {selectedPost.approval}
                    </span>
                    {selectedPost.campaign_id && (
                       <span className="text-sm px-3 py-1 rounded-full bg-pink-100 text-pink-700 font-semibold border border-pink-200">
                          🚩 Chiến dịch #{selectedPost.campaign_id}
                       </span>
                    )}
                  </div>
                </div>

                {/* Mô tả */}
                <div className="space-y-2 border-l-4 border-blue-200 pl-4 bg-blue-50/50 py-3 rounded-r-lg">
                  <h3 className="text-lg font-semibold text-gray-800">📝 Mô tả chi tiết:</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                     {selectedPost.description || "Chưa có thông tin mô tả chi tiết cho bài đăng này."}
                  </p>
                </div>

                {/* Danh sách vật phẩm */}
                <div>
                   <h3 className="text-xl font-semibold mb-4 text-gray-900">📦 Danh sách vật phẩm</h3>
                   {selectedPost.products && selectedPost.products.length > 0 ? (
                      <div className="space-y-3">
                         {selectedPost.products.map(product => (
                            <div key={product.product_id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all shadow-sm">
                               <div>
                                  <p className="font-semibold text-sm text-gray-800">{product.product_name}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">Số lượng: {product.product_quantity}</p>
                               </div>
                               <div className="flex items-center gap-4">
                                  <div className="text-right">
                                     {selectedPost.post_category === "Selling" ? (
                                        <p className="font-bold text-blue-600 text-base">
                                          {Number(product.product_price).toLocaleString('vi-VN')} đ
                                        </p>
                                     ) : (
                                        <p className="font-bold text-green-600">0 đ</p>
                                     )}
                                  </div>
                                  
                                  <button 
                                     onClick={() => alert(`Đã thêm ${product.product_name} vào giỏ hàng!`)}
                                     className="bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
                                  >
                                     + Thêm
                                  </button>
                               </div>
                            </div>
                         ))}
                      </div>
                   ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed text-gray-500 text-sm">
                         Bài đăng này hiện chưa đính kèm vật phẩm nào.
                      </div>
                   )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-blue-100 bg-white mt-auto">
                 <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setSelectedPost(null)}
                      className="py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
                    >
                       ❌ Thoát
                    </button>
                    <button 
                       onClick={() => alert("Chuyển sang trang Giỏ hàng để Thanh toán/Chốt đơn!")}
                       className="py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-md flex items-center justify-center gap-2"
                    >
                       🛒 Xem giỏ hàng
                    </button>
                 </div>
              </div>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
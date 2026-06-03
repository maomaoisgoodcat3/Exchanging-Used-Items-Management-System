"use client";

import { useState, useEffect } from "react";
import PostCard, { typeColor } from "@/components/features/post/PostCard";
import CreatePostModal from "@/components/features/post/CreatePostModal";
import { getPosts } from "@/services/postServices";
import type { Post } from "@/types/post";

export default function PostsPage() {
  // State tìm kiếm và bộ lọc
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  
  // State dữ liệu bài đăng
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State quản lý Pop-up (Xem chi tiết & Tạo bài đăng)
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

  // Logic lọc bài đăng (Search + Category)
  const filtered = posts.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === "" || p.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6 relative">
      {/* 1. HEADER + SEARCH + NÚT TẠO BÀI ĐĂNG */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800">📰 Danh sách bài đăng</h1>

        <div className="flex w-full md:w-auto gap-3 flex-grow justify-end">

          {/* BỘ LỌC DANH MỤC MỚI THÊM */}
          <select
            className="border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white transition-colors cursor-pointer text-sm md:text-base outline-none focus:ring-2 focus:ring-blue-200"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Tất cả danh mục</option>
            {/* Các option này nên khớp với danh mục bạn thiết kế trong form tạo bài */}
            <option value="Sách vở">Sách vở - Tài liệu</option>
            <option value="Quần áo">Quần áo - Đồng phục</option>
            <option value="Đồ học tập">Đồ dùng học tập</option>
            <option value="Khác">Khác</option>
          </select>

          <input
            className="border rounded-lg px-4 py-2 w-full md:w-80 bg-gray-50 focus:bg-white transition-colors"
            placeholder="Tìm kiếm bài đăng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-6 rounded-lg transition-colors whitespace-nowrap shadow-md"
          >
            + Tạo bài đăng
            
          </button>

          <CreatePostModal 
              isOpen={isCreating} 
                onClose={() => setIsCreating(false)} 
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
              key={post.id} 
              post={post} 
              // Khi bấm "Xem chi tiết", hàm này sẽ chạy, 
              // lấy dữ liệu bài đăng đó nhét vào state selectedPost để mở Modal
              
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
{/* 4. POP-UP (MODAL) GIAO DIỆN XEM CHI TIẾT BÀI ĐĂNG (ĐỒNG BỘ GIỎ HÀNG) */}
{/* ============================================================== */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 md:p-10 transition-opacity duration-300">
          
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-full md:h-[85vh] flex flex-col md:flex-row overflow-hidden relative animate-fadeIn">
            
            
            {/* ------------------- CỘT TRÁI: HÌNH ẢNH ------------------- */}
            <div className="w-full md:w-3/5 bg-gray-100 flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-gray-200 relative">
              <img 
                src={selectedPost.image || selectedPost.images?.[0]} 
                alt={selectedPost.title} 
                className="w-full h-full object-contain rounded-lg"
              />
              <div className="absolute bottom-4 left-4 flex gap-2">
                 <div className="w-16 h-16 border-2 border-blue-500 rounded-md bg-white p-1 shadow-md">
                    <img src={selectedPost.image || selectedPost.images?.[0]} alt="thumb" className="w-full h-full object-cover rounded" />
                 </div>
              </div>
            </div>

            {/* ------------------- CỘT PHẢI: THÔNG TIN CHI TIẾT ------------------- */}
            <div className="w-full md:w-2/5 flex flex-col h-full bg-white">
              
              {/* Header */}
              <div className="p-4 border-blue-200 shadow-md flex items-center justify-between bg-blue-100/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 border flex items-center justify-center text-lg font-bold text-gray-500">
                    {selectedPost.sellerName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-s text-gray-800">{selectedPost.sellerName}</p>
                    <p className="text-xs text-gray-500">📍 {selectedPost.location}</p>
                  </div>
                </div>
                <span className="text-xs text-blue-500 bg-white-900 px-2 py-0.5 rounded">ID: {selectedPost.id}</span>
              </div>

              {/* Content chính */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Tiêu đề & Tag */}
                <div className="space-y-3">
                  <h2 className="text-3xl font-semibold text-gray-900 leading-tight">
                    {selectedPost.title}
                  </h2>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${typeColor[selectedPost.type]}`}>
                       {selectedPost.type}
                    </span>
                    <span className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                       📂 {selectedPost.category}
                    </span>
                    {selectedPost.campaignName && (
                       <span className="text-sm px-3 py-1 rounded-full bg-pink-100 text-pink-700 font-semibold border border-pink-200">
                          🚩 {selectedPost.campaignName}
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
                            <div key={product.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all shadow-sm">
                               <div>
                                  <p className="font-semibold text-sm text-gray-800">{product.name}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">Số lượng: {product.quantity}</p>
                               </div>
                               <div className="flex items-center gap-4">
                                  <div className="text-right">
                                     {selectedPost.type === "MUA_BAN" ? (
                                        <p className="font-bold text-blue-600 text-base">{product.price.toLocaleString('vi-VN')} đ</p>
                                     ) : (
                                        <p className="font-bold text-green-600">0 đ</p>
                                     )}
                                  </div>
                                  
                                  {/* ĐỒNG BỘ: Tất cả đều là Thêm vào giỏ */}
                                  <button 
                                     onClick={() => alert(`Đã thêm ${product.name} vào giỏ hàng!`)}
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
                         (Giả lập: Bài đăng này chưa có danh sách vật phẩm)
                      </div>
                   )}
                </div>
              </div>

              {/* 3. Footer: ĐỒNG BỘ NÚT CHO TẤT CẢ CÁC LOẠI BÀI ĐĂNG */}
              <div className="p-4 border-blue-100 bg-white mt-auto">
                 <div className="grid grid-cols-2 gap-3"
                 onClick={() => setSelectedPost(null)}>
                    <button className="py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition">
                       
                       ❌ Thoát
                    </button>
                    <button 
                       onClick={() => alert("Chuyển sang trang Giỏ hàng để Thanh toán/Chốt đơn!")}
                       className="py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-md flex items-center justify-center gap-2"
                    >
                       🛒 Xem giỏ hàng
                       <span className="bg-white text-blue-600 px-2 py-0.5 rounded-full text-xs font-black">2</span>
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
"use client";

import { useMemo, useState } from "react";
import { mockPosts } from "@/mocks/post.mocks"; 
import CreatePostModal from "@/components/features/post/CreatePostModal";

const statusStyles: Record<string, string> = {
  "ĐANG HIỂN THỊ": "text-green-600 font-medium bg-green-50 px-2 py-1 rounded",
  "CHỜ DUYỆT": "text-yellow-600 font-medium bg-yellow-50 px-2 py-1 rounded",
  "ĐÃ ẨN": "text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded",
  "ĐÃ BÁN": "text-red-500 font-medium bg-red-50 px-2 py-1 rounded",
};

export default function MyStoragePage() {
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const tabs = ["Tất cả", "CHỜ DUYỆT", "ĐANG HIỂN THỊ", "ĐÃ ẨN/ĐÃ BÁN"];

  const myPosts = useMemo(() => mockPosts.filter((post) => post.ownerId === "U-STUDENT-001"), []);


  const displayedPosts = myPosts.filter((item) => {
    const currentStatus = item.status || "ĐANG HIỂN THỊ"; 

    let matchTab = false;
    if (activeTab === "Tất cả") matchTab = true;
    else if (activeTab === "ĐÃ ẨN/ĐÃ BÁN") matchTab = (currentStatus === "ĐÃ ẨN" || currentStatus === "ĐÃ BÁN");
    else matchTab = (currentStatus === activeTab);

    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === "" || item.category === selectedCategory;

    return matchTab && matchSearch && matchCategory;
  });

  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === 0) return "Trao đổi / Tặng";
    return price.toLocaleString('vi-VN');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* ========================================================== */}
      {/* KHU VỰC 1: HEADER GIỐNG HỆT TRANG POSTS (ĐỒNG NHẤT UI)       */}
      {/* ========================================================== */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 whitespace-nowrap">📦 Kho đồ của tôi</h1>

        <div className="flex w-full md:w-auto gap-3 flex-grow justify-end">
          {/* Lọc danh mục */}
          <select
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium transition focus:border-cyan-500 focus:bg-white"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Tất cả danh mục</option>
            <option value="Sách vở">Sách vở - Tài liệu</option>
            <option value="Quần áo">Quần áo - Đồng phục</option>
            <option value="Đồ học tập">Đồ dùng học tập</option>
            <option value="Khác">Khác</option>
          </select>

          {/* Thanh tìm kiếm */}
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

          {/* Nút tạo bài đăng */}
          <button 
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center justify-center rounded-full bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
            >
            + Tạo bài đăng
          </button>
          
          <CreatePostModal 
            isOpen={isCreating} 
            onClose={() => setIsCreating(false)} 
           />
        </div>
      </div>

      {/* ========================================== */}
      {/* KHU VỰC 2: THANH ĐIỀU HƯỚNG TABS (TRẠNG THÁI)*/}
      {/* ========================================== */}
      <div className="bg-white px-4 rounded-xl shadow-sm border border-gray-100 overflow-x-auto flex gap-6 min-w-max">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-4 text-sm font-bold transition-all relative whitespace-nowrap ${
              activeTab === tab ? "text-blue-600" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-md animate-fadeIn" />
            )}
          </button>
        ))}
      </div>

      {/* ========================================== */}
      {/* KHU VỰC 3: DANH SÁCH BÀI ĐĂNG (NẰM NGANG)    */}
      {/* ========================================== */}
      <div className="flex flex-col gap-4">
        {displayedPosts.map((post) => {
          const status = post.status || "ĐANG HIỂN THỊ";
          const imageSrc = post.images?.[0] || post.image || "https://placehold.co/600x400";
          const isFree = (post.price === undefined || post.price === 0);

          return (
            <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:shadow-md hover:border-blue-200 transition-all group">
              
              <div className="w-full sm:w-28 sm:h-28 h-40 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                <img 
                  src={imageSrc} 
                  alt={post.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="flex-1 space-y-2 w-full">
                <h3 className="font-bold text-lg text-gray-900 leading-snug line-clamp-2" title={post.title}>
                  {post.title}
                </h3>
                
                
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="px-2.5 py-1 rounded bg-gray-100 text-gray-600 font-medium">ID: {post.id}</span>
                  <span className="px-2.5 py-1 rounded bg-gray-100 text-gray-600 font-medium">
                    📂 {post.category}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">🕒 {post.createdAt || "Vừa xong"}</span>
                </div>
                
                <div className={`font-bold text-m pt-1 ${isFree ? "text-green-600" : "text-red-600"}`}>
                  {formatPrice(post.price)}
                  {!isFree && <span className="text-gray-400 font-medium ml-1 text-sm">đ</span>}
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-gray-50">
                <span className={`text-xs uppercase tracking-wider ${statusStyles[status]}`}>
                  {status}
                </span>

                <div className="flex gap-2">
                  {status !== "ĐÃ BÁN" && (
                    <button 
                      onClick={() => alert(`Sửa bài: ${post.id}`)}
                      className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition"
                    >
                      Sửa
                    </button>
                  )}
                  <button 
                      onClick={() => alert(`Mở menu hành động cho bài: ${post.id}`)}
                      className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-800 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                  </button>
                </div>
              </div>

            </div>
          );
        })}

        {displayedPosts.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-xl border border-dashed border-gray-300">
            <span className="text-5xl mb-4">📭</span>
            <h3 className="text-xl font-bold text-gray-800">Chưa có bài đăng nào</h3>
            <p className="text-gray-500 mt-2">Thử thay đổi bộ lọc hoặc tạo bài đăng mới nhé!</p>
          </div>
        )}
      </div>

    </div>
  );
}

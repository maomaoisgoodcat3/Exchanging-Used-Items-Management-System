"use client";

import { useState, useEffect } from "react";
import PostCard, { typeColor } from "@/components/features/post/PostCard";
import CreatePostModal from "@/components/features/post/CreatePostModal";
import type { Post } from "@/types/post";
import { useAuthStore } from "@/store/authStore";
import { Clock, Check, X, Search, RefreshCw } from "lucide-react";

export default function PostsPage() {
  const { token, user } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState(false);

  // State tìm kiếm và bộ lọc (User)
  const [search, setSearch] = useState("");
  const [selectedPostType, setSelectedPostType] = useState("");
  
  // State bộ lọc (Admin)
  const [adminFilter, setAdminFilter] = useState("Pending");

  // State dữ liệu bài đăng
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State quản lý Pop-up Modal chi tiết bài đăng
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const fetchLivePosts = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      
      const userRes = await fetch("http://127.0.0.1:8000/api/v1/users/me", { headers: { Authorization: `Bearer ${token}` } });
      const userData = await userRes.json();
      const checkAdmin = String(userData.role).toUpperCase().includes("ADMIN");
      setIsAdmin(checkAdmin);

      const endpoint = checkAdmin ? "http://127.0.0.1:8000/api/v1/posts/admin-all" : "http://127.0.0.1:8000/api/v1/posts/";
      const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setPosts(await res.json());
    } catch (err) { console.error(err); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchLivePosts(); }, [token]);

  // Hành động Duyệt của Admin gọi thẳng xuống API Database
  const handleReviewPost = async (id: number, action: "approve" | "reject") => {
    let reason = null;
    if (action === "reject") {
        reason = prompt("Nhập lý do từ chối bài đăng này (Bắt buộc):");
        if (!reason) return alert("Phải nhập lý do từ chối bài viết!");
    }
    try {
        const res = await fetch(`http://127.0.0.1:8000/api/v1/admin/posts/${id}/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action, reject_reason: reason })
        });
        if (res.ok) {
            alert("Đã xử lý trạng thái bài đăng thành công!");
            fetchLivePosts(); // Tự động load lại số liệu mới nhất
        }
    } catch (e) { alert("Lỗi kết nối"); }
  };

  // TÍNH TOÁN SỐ LIỆU THỐNG KÊ THẬT TRỰC TIẾP TỪ ARRAY CỦA DATABASE (DÀNH CHO ADMIN)
  const pendingPosts = posts.filter(p => p.approval === "Pending" || p.approval === "Resending");
  const rejectedPosts = posts.filter(p => p.approval === "Rejected");
  const approvedPosts = posts.filter(p => p.approval === "Approved");

  // Lọc dữ liệu hiển thị trên bảng Admin
  const adminFilteredPosts = posts.filter(p => {
      if (adminFilter === "Pending") return p.approval === "Pending" || p.approval === "Resending";
      if (adminFilter === "Rejected") return p.approval === "Rejected";
      if (adminFilter === "Approved") return p.approval === "Approved";
      return true; // "All"
  }).filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.seller_email.toLowerCase().includes(search.toLowerCase()));

  // Lọc bài đăng hiển thị bằng giao diện Grid (Dành cho User)
  const userFilteredPosts = posts.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchType = selectedPostType === "" || p.post_category === selectedPostType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6 relative">
      
      {/* ============================================================== */}
      {/* 1. GIAO DIỆN MODERATION DÀNH RIÊNG CHO ADMIN (GIỐNG UI MOCKUP) */}
      {/* ============================================================== */}
      {isAdmin ? (
         <div className="space-y-6 animate-in fade-in">
            {/* Header Title */}
            <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Admin layout</p>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Moderation</h1>
                <p className="text-gray-500 mt-1">Khu vực duyệt và quản lý thông báo, bài đăng do người dùng gửi.</p>
            </div>

            {/* 3 Thẻ Thống Kê */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#fff9f0] border border-[#ffeed3] rounded-2xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition">
                    <div className="w-14 h-14 rounded-full bg-[#f97316] flex items-center justify-center text-white shrink-0 shadow-inner">
                        <Clock size={28} strokeWidth={2.5}/>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-700">Bài chờ duyệt</p>
                        <p className="text-4xl font-black text-gray-900">{pendingPosts.length}</p>
                        <p className="text-xs text-gray-500 mt-1">Cần duyệt trong 24h</p>
                    </div>
                </div>

                <div className="bg-[#fff1f2] border border-[#ffe4e6] rounded-2xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition">
                    <div className="w-14 h-14 rounded-full bg-[#fb7185] flex items-center justify-center text-white shrink-0 shadow-inner">
                        <X size={28} strokeWidth={2.5}/>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-700">Bài bị từ chối</p>
                        <p className="text-4xl font-black text-gray-900">{rejectedPosts.length}</p>
                        <p className="text-xs text-gray-500 mt-1">Tổng số bài bị từ chối</p>
                    </div>
                </div>

                <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-2xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition">
                    <div className="w-14 h-14 rounded-full bg-[#10b981] flex items-center justify-center text-white shrink-0 shadow-inner">
                        <Check size={28} strokeWidth={2.5}/>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-700">Bài đã duyệt</p>
                        <p className="text-4xl font-black text-gray-900">{approvedPosts.length}</p>
                        <p className="text-xs text-gray-500 mt-1">Tổng số bài đã duyệt</p>
                    </div>
                </div>
            </div>

            {/* Bảng Log hành động */}
            <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row justify-around text-sm font-semibold text-gray-600 gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><Check size={14} strokeWidth={3}/></div>
                    <span>Duyệt gần nhất: Vừa xong bởi {user?.email}</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><X size={14} strokeWidth={3}/></div>
                    <span>Từ chối gần nhất: Vừa xong bởi {user?.email}</span>
                </div>
            </div>

            {/* Bảng Danh sách bài chờ duyệt */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">📋 Danh sách bài chờ duyệt</h2>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm tiêu đề, người đăng..." className="w-full rounded-full border border-gray-300 py-2.5 pl-5 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-sm" />
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500" size={18}/>
                        </div>
                        <select value={adminFilter} onChange={e => setAdminFilter(e.target.value)} className="rounded-full border border-gray-300 py-2.5 px-5 text-sm outline-none focus:border-blue-500 bg-white font-semibold text-gray-700 cursor-pointer shadow-sm">
                            <option value="Pending">Chờ duyệt</option>
                            <option value="Approved">Đã duyệt</option>
                            <option value="Rejected">Đã từ chối</option>
                            <option value="All">Tất cả bài</option>
                        </select>
                        <button onClick={fetchLivePosts} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition text-gray-600 shadow-sm bg-white"><RefreshCw size={16}/></button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white text-slate-500 font-bold border-b border-gray-200 uppercase text-[11px] tracking-wider">
                            <tr>
                                <th className="p-4 pl-6">Mã bài</th>
                                <th className="p-4">Tiêu đề bài đăng</th>
                                <th className="p-4">Người đăng</th>
                                <th className="p-4">Loại bài</th>
                                <th className="p-4">Thời gian gửi</th>
                                <th className="p-4">Trạng thái</th>
                                <th className="p-4 pr-6 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                            {isLoading ? (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-400">Đang tải dữ liệu...</td></tr>
                            ) : adminFilteredPosts.length === 0 ? (
                                <tr><td colSpan={7} className="p-12 text-center text-gray-400">Không có dữ liệu bài đăng.</td></tr>
                            ) : adminFilteredPosts.map(p => (
                                <tr key={p.post_id} className="hover:bg-blue-50/30 transition">
                                    <td className="p-4 pl-6 text-gray-900 font-bold">#{p.post_id}</td>
                                    <td className="p-4 max-w-[200px] truncate" title={p.title}>{p.title}</td>
                                    <td className="p-4 text-gray-500">{p.seller_email}</td>
                                    <td className="p-4"><span className="bg-gray-100 px-2.5 py-1 rounded text-[11px] font-bold text-gray-600 uppercase border border-gray-200">{p.post_category}</span></td>
                                    <td className="p-4 text-gray-500">{p.created_at ? new Date(p.created_at).toLocaleDateString("vi-VN") : "Hôm nay"}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border ${
                                            p.approval === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                            p.approval === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                                            'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}>
                                            {p.approval}
                                        </span>
                                    </td>
                                    <td className="p-4 pr-6 text-right space-x-2">
                                        {(p.approval === 'Pending' || p.approval === 'Resending') ? (
                                            <>
                                                <button onClick={() => handleReviewPost(p.post_id, 'approve')} className="bg-emerald-500 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-emerald-600 transition shadow-sm">Duyệt</button>
                                                <button onClick={() => handleReviewPost(p.post_id, 'reject')} className="bg-rose-500 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-rose-600 transition shadow-sm">Từ chối</button>
                                            </>
                                        ) : (
                                            <button onClick={() => setSelectedPost(p)} className="bg-white text-blue-600 px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-50 transition border border-blue-200 shadow-sm">Chi tiết</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
         </div>
      ) : (

      /* ============================================================== */
      /* 2. GIAO DIỆN CHỢ GIAO DỊCH DÀNH CHO USER THƯỜNG               */
      /* ============================================================== */
      <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-2xl font-bold text-gray-800">📰 Danh sách bài đăng</h1>

            <div className="flex w-full md:w-auto gap-3 flex-grow justify-end">
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
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
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

          {isLoading ? (
            <div className="text-center py-10 text-gray-500">Đang tải dữ liệu từ hệ thống...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {userFilteredPosts.map((post) => (
                <PostCard 
                  key={post.post_id} 
                  post={post} 
                  onClick={() => setSelectedPost(post)}
                />
              ))} 
              {userFilteredPosts.length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-10 bg-white rounded-xl">Không tìm thấy bài đăng nào.</div>
              )}
            </div>
          )}
      </div>
      )}

      {/* ============================================================== */}
      {/* 3. POP-UP (MODAL) GIAO DIỆN XEM CHI TIẾT BÀI ĐĂNG (DÙNG CHUNG) */}
      {/* ============================================================== */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 md:p-10 transition-opacity duration-300">
          
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-full md:h-[85vh] flex flex-col md:flex-row overflow-hidden relative animate-fadeIn">
            
            {/* CỘT TRÁI: HÌNH ẢNH */}
            <div className="w-full md:w-3/5 bg-gray-100 flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-gray-200 relative">
              <img 
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
                    <p className="text-xs text-gray-500">📅 {selectedPost.created_at ? new Date(selectedPost.created_at).toLocaleDateString("vi-VN") : "Hôm nay"}</p>
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
                       {selectedPost.post_category || selectedPost.post_category}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${selectedPost.approval === "Approved" ? "bg-green-100 text-green-700" : selectedPost.approval === "Rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
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
                
                {/* Lý do từ chối (Chỉ hiện khi bị Reject) */}
                {selectedPost.approval === "Rejected" && selectedPost.reject_reason && (
                  <div className="space-y-2 border-l-4 border-red-400 pl-4 bg-red-50 py-3 rounded-r-lg">
                    <h3 className="text-sm font-bold text-red-800">⚠️ Lý do từ chối:</h3>
                    <p className="text-sm text-red-700 font-medium">{selectedPost.reject_reason}</p>
                  </div>
                )}

                {/* Danh sách vật phẩm */}
                <div>
                   <h3 className="text-xl font-semibold mb-4 text-gray-900">📦 Danh sách vật phẩm</h3>
                   {selectedPost.products && selectedPost.products.length > 0 ? (
                      <div className="space-y-3">
                         {selectedPost.products.map((product: any) => (
                            <div key={product.product_id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all shadow-sm">
                               <div>
                                  <p className="font-semibold text-sm text-gray-800">{product.product_name}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">Số lượng: {product.product_quantity}</p>
                               </div>
                               <div className="flex items-center gap-4">
                                  <div className="text-right">
                                     {(selectedPost.post_category === "Selling") ? (
                                        <p className="font-bold text-blue-600 text-base">
                                          {Number(product.product_price).toLocaleString('vi-VN')} đ
                                        </p>
                                     ) : (
                                        <p className="font-bold text-green-600">0 đ</p>
                                     )}
                                  </div>
                                  
                                  {!isAdmin && (
                                    <button 
                                      onClick={() => alert(`Đã thêm ${product.product_name} vào giỏ hàng!`)}
                                      className="bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
                                    >
                                      + Thêm
                                    </button>
                                  )}
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
                 <div className="flex gap-3 justify-end">
                    <button 
                      onClick={() => setSelectedPost(null)}
                      className="px-6 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
                    >
                       Đóng lại
                    </button>
                    {!isAdmin && (
                        <button 
                        onClick={() => alert("Chuyển sang trang Giỏ hàng để Thanh toán/Chốt đơn!")}
                        className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-sm flex items-center justify-center gap-2"
                        >
                        🛒 Xem giỏ hàng
                        </button>
                    )}
                 </div>
              </div>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
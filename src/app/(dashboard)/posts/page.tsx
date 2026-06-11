"use client";

import { useState, useEffect } from "react";
import PostCard, { typeColor } from "@/components/features/post/PostCard";
import CreatePostModal from "@/components/features/post/CreatePostModal";
import type { Post } from "@/types/post";
import { useAuthStore } from "@/store/authStore";
import { Clock, Check, X, Search, RefreshCw, Eye } from "lucide-react";

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
  
  // State quản lý Pop-up Modal
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // ĐÃ SỬA: Chuẩn hóa tên hàm để useEffect gọi không bị lỗi
  const fetchLivePosts = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const userRes = await fetch("http://127.0.0.1:8000/api/v1/users/me", { headers: { Authorization: `Bearer ${token}` } });
      const userData = await userRes.json();
      const checkAdmin = String(userData.role).toUpperCase().includes("ADMIN");
      setIsAdmin(checkAdmin);

      const endpoint = checkAdmin ? "http://127.0.0.1:8000/api/v1/posts/admin-all" : "http://127.0.0.1:8000/api/v1/posts/";
      const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setPosts(await res.json());
    } catch (err) { 
      console.error(err); 
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => { fetchLivePosts(); }, [token]);

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
            fetchLivePosts(); 
        }
    } catch (e) { alert("Lỗi kết nối"); }
  };

  const handleOpenDetails = async (post: Post) => {
    setIsLoadingProducts(true);
    setSelectedPost(post);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/posts/${post.post_id}`);
      if (res.ok) {
        const fullPostDetail = await res.json();
        setSelectedPost(fullPostDetail);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Tính toán số liệu thống kê
  const pendingPosts = posts.filter(p => p.approval === "Pending" || p.approval === "Resending");
  const rejectedPosts = posts.filter(p => p.approval === "Rejected");
  const approvedPosts = posts.filter(p => p.approval === "Approved");

  const adminFilteredPosts = posts.filter(p => {
      if (adminFilter === "Pending") return p.approval === "Pending" || p.approval === "Resending";
      if (adminFilter === "Rejected") return p.approval === "Rejected";
      if (adminFilter === "Approved") return p.approval === "Approved";
      return true;
  }).filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.seller_email.toLowerCase().includes(search.toLowerCase()));

  const userFilteredPosts = posts.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchType = selectedPostType === "" || p.post_category === selectedPostType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6 relative">
      
      {/* ============================================================== */}
      {/* PHÂN RẼ NHÁNH: KIỂM TRA ROLE ĐỂ RENDER GIAO DIỆN PHÙ HỢP        */}
      {/* ============================================================== */}
      {isAdmin ? (
        
        /* ---------------- GIAO DIỆN ADMIN ---------------- */
        <div className="space-y-6 animate-in fade-in">
          <div>
              <p className="text-sm text-gray-400 font-semibold mb-0.5">Admin layout</p>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Moderation</h1>
              <p className="text-sm text-gray-500">Khu vực duyệt và quản lý bài đăng do sinh viên gửi.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#fff9f0] border border-[#ffeed3] rounded-2xl p-6 flex items-center gap-5 shadow-sm">
                  <div className="w-14 h-14 rounded-full bg-[#f97316] flex items-center justify-center text-white shrink-0 shadow-inner"><Clock size={28} strokeWidth={2.5}/></div>
                  <div>
                      <p className="text-sm font-bold text-gray-700">Bài chờ duyệt</p>
                      <p className="text-4xl font-black text-gray-900">{pendingPosts.length}</p>
                      <p className="text-xs text-gray-500 mt-1">Cần duyệt trong 24h</p>
                  </div>
              </div>
              <div className="bg-[#fff1f2] border border-[#ffe4e6] rounded-2xl p-6 flex items-center gap-5 shadow-sm">
                  <div className="w-14 h-14 rounded-full bg-[#fb7185] flex items-center justify-center text-white shrink-0 shadow-inner"><X size={28} strokeWidth={2.5}/></div>
                  <div>
                      <p className="text-sm font-bold text-gray-700">Bài bị từ chối</p>
                      <p className="text-4xl font-black text-gray-900">{rejectedPosts.length}</p>
                      <p className="text-xs text-gray-500 mt-1">Tổng bài viết không đạt</p>
                  </div>
              </div>
              <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-2xl p-6 flex items-center gap-5 shadow-sm">
                  <div className="w-14 h-14 rounded-full bg-[#10b981] flex items-center justify-center text-white shrink-0 shadow-inner"><Check size={28} strokeWidth={2.5}/></div>
                  <div>
                      <p className="text-sm font-bold text-gray-700">Bài đã duyệt</p>
                      <p className="text-4xl font-black text-gray-900">{approvedPosts.length}</p>
                      <p className="text-xs text-gray-500 mt-1">Đã hiển thị trên chợ</p>
                  </div>
              </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">Danh sách bài chờ duyệt</h2>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                      <div className="relative flex-1 md:w-64">
                          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tiêu đề, người đăng..." className="w-full rounded-full border border-gray-300 py-2 pl-4 pr-10 text-sm outline-none focus:border-blue-500 text-gray-900 placeholder-gray-400" />
                          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                      </div>
                      <select value={adminFilter} onChange={e => setAdminFilter(e.target.value)} className="rounded-full border border-gray-300 py-2 px-4 text-sm bg-white font-semibold text-gray-700 outline-none">
                          <option value="Pending">Chờ duyệt</option>
                          <option value="Approved">Đã duyệt</option>
                          <option value="Rejected">Đã từ chối</option>
                          <option value="All">Tất cả bài</option>
                      </select>
                      <button onClick={fetchLivePosts} className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 bg-white text-gray-600"><RefreshCw size={14}/></button>
                  </div>
              </div>

              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-gray-50/70 text-gray-500 font-bold border-b text-[11px] uppercase tracking-wider">
                          <tr>
                              <th className="p-4 pl-6">Mã bài</th>
                              <th className="p-4">Tiêu đề bài đăng</th>
                              <th className="p-4">Người đăng</th>
                              <th className="p-4">Thời gian</th>
                              <th className="p-4">Trạng thái</th>
                              <th className="p-4 pr-6 text-right">Thao tác</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                          {isLoading ? (
                              <tr><td colSpan={6} className="p-8 text-center text-gray-400">Đang tải dữ liệu kiểm duyệt...</td></tr>
                          ) : adminFilteredPosts.length === 0 ? (
                              <tr><td colSpan={6} className="p-12 text-center text-gray-400">Không tìm thấy bài đăng nào.</td></tr>
                          ) : adminFilteredPosts.map(p => (
                              <tr key={p.post_id} className="hover:bg-slate-50/50 transition">
                                  <td className="p-4 pl-6 font-bold text-gray-900">#{p.post_id}</td>
                                  <td className="p-4 max-w-[220px] truncate" title={p.title}>{p.title}</td>
                                  <td className="p-4 text-gray-500 text-xs">{p.seller_email}</td>
                                  <td className="p-4 text-gray-400 text-xs">{p.created_at ? new Date(p.created_at).toLocaleDateString("vi-VN") : "Hôm nay"}</td>
                                  <td className="p-4">
                                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                          p.approval === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' : 
                                          p.approval === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : 
                                          'bg-amber-50 text-amber-700 border-amber-200'
                                      }`}>{p.approval}</span>
                                  </td>
                                  <td className="p-4 pr-6 text-right space-x-1.5">
                                      {(p.approval === 'Pending' || p.approval === 'Resending') ? (
                                          <>
                                              <button onClick={() => handleReviewPost(p.post_id, 'approve')} className="bg-green-600 text-white px-3 py-1 rounded font-bold text-xs hover:bg-green-700 shadow-sm">Duyệt</button>
                                              <button onClick={() => handleReviewPost(p.post_id, 'reject')} className="bg-red-50 text-white px-3 py-1 rounded font-bold text-xs hover:bg-red-700 shadow-sm">Từ chối</button>
                                          </>
                                      ) : (
                                          <button onClick={() => handleOpenDetails(p)} className="text-blue-600 bg-blue-50 px-3 py-1 rounded font-bold text-xs hover:bg-blue-100 border border-blue-200"><Eye size={12} className="inline mr-1"/> Xem lại</button>
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

        /* ---------------- GIAO DIỆN USER THƯỜNG ---------------- */
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-2xl font-bold text-gray-800">Danh sách bài đăng</h1>

            <div className="flex w-full md:w-auto gap-3 flex-grow justify-end">
              <select
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium transition focus:border-cyan-500 focus:bg-white text-gray-900"
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
                  className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-cyan-500 focus:bg-white"
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
                  onClick={() => handleOpenDetails(post)}
                />
              ))} 
              {userFilteredPosts.length === 0 && (
                 <div className="col-span-full text-center text-gray-500 py-10 bg-white rounded-xl">
                   Không tìm thấy bài đăng nào.
                 </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* POP-UP (MODAL) GIAO DIỆN XEM CHI TIẾT BÀI ĐĂNG (DÙNG CHUNG)      */}
      {/* ============================================================== */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 md:p-10 transition-opacity duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-full md:h-[85vh] flex flex-col md:flex-row overflow-hidden relative animate-fadeIn">
            
            <div className="w-full md:w-3/5 bg-gray-100 flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-gray-200 relative">
              <img 
                src={selectedPost.thumbnail_url || "https://placehold.co/600x400?text=No+Image"} 
                alt={selectedPost.title} 
                className="w-full h-full object-contain rounded-lg"
              />
            </div>

            <div className="w-full md:w-2/5 flex flex-col h-full bg-white">
              <div className="p-4 border-blue-200 shadow-md flex items-center justify-between bg-blue-100/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-200 border flex items-center justify-center text-lg font-bold text-blue-700 uppercase">
                    {selectedPost.seller_email.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-800">{selectedPost.seller_email}</p>
                    <p className="text-xs text-gray-500">{selectedPost.created_at ? new Date(selectedPost.created_at).toLocaleDateString("vi-VN") : "Chưa rõ"}</p>
                  </div>
                </div>
                <span className="text-xs text-blue-500 bg-white px-2 py-0.5 rounded shadow-sm border border-blue-100">
                  ID: {selectedPost.post_id}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-3">
                  <h2 className="text-3xl font-semibold text-gray-900 leading-tight">
                    {selectedPost.title}
                  </h2>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${typeColor?.[selectedPost.post_category] || "bg-gray-100 text-gray-700"}`}>
                       {selectedPost.post_category}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${selectedPost.approval === "Approved" ? "bg-green-100 text-green-700" : selectedPost.approval === "Rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                       Trạng thái: {selectedPost.approval}
                    </span>
                    {selectedPost.campaign_id && (
                       <span className="text-sm px-3 py-1 rounded-full bg-pink-100 text-pink-700 font-semibold border border-pink-200">
                          Chiến dịch #{selectedPost.campaign_id}
                       </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 border-l-4 border-blue-200 pl-4 bg-blue-50/50 py-3 rounded-r-lg">
                  <h3 className="text-lg font-semibold text-gray-800">Mô tả chi tiết:</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                     {selectedPost.description || "Chưa có thông tin mô tả chi tiết cho bài đăng này."}
                  </p>
                </div>
                
                {selectedPost.approval === "Rejected" && selectedPost.reject_reason && (
                  <div className="space-y-2 border-l-4 border-red-400 pl-4 bg-red-50 py-3 rounded-r-lg">
                    <h3 className="text-sm font-bold text-red-800">⚠️ Lý do từ chối:</h3>
                    <p className="text-sm text-red-700 font-medium">{selectedPost.reject_reason}</p>
                  </div>
                )}

        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-900">Danh sách vật phẩm</h3>
          
          {isLoadingProducts ? (
            <div className="text-center py-6 text-sm text-gray-400 animate-pulse">
              ⏳ Đang tải thông tin chi tiết vật phẩm...
            </div>
          ) : (selectedPost?.products && selectedPost.products.length > 0) ? (
            <div className="space-y-3">
              {selectedPost.products.map((item: any) => (
                <div 
                  key={item.product_id} 
                  className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all shadow-sm"
                >
                  <div>
                    <p className="font-semibold text-sm text-gray-800">
                      {item.product?.product_name || "Vật phẩm không rõ tên"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Số lượng: {item.product?.product_quantity ?? 1}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {selectedPost.post_category === "Selling" ? (
                        <p className="font-bold text-blue-600 text-base">
                          {Number(item.product?.product_price || 0).toLocaleString('vi-VN')} đ
                        </p>
                      ) : (
                        <p className="font-bold text-green-600">0 đ</p>
                      )}
                    </div>
                    
                    {!isAdmin && (
                      <button 
                        onClick={() => alert(`Đã thêm ${item.product_name || 'vật phẩm'} vào giỏ hàng!`)}
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


              <div className="p-4 border-t border-blue-100 bg-white mt-auto">
                 <div className="flex gap-3 justify-end">
                    <button 
                      onClick={() => setSelectedPost(null)}
                      className="px-6 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
                    >
                       Thoát
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
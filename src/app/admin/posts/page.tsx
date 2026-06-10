"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Package, CheckCircle, XCircle } from "lucide-react";

export default function AdminPostsPage() {
  const { token } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      // Admin lấy danh sách toàn bộ bài đăng
      const res = await fetch("http://127.0.0.1:8000/api/v1/posts/admin-all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setPosts(await res.json());
    } catch (err) {
      console.error("Lỗi:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [token]);

  const reviewPost = async (id: number, action: "approve" | "reject") => {
    let reason = null;
    if (action === "reject") {
      reason = prompt("Nhập lý do từ chối bài đăng này (Bắt buộc):");
      if (!reason) { alert("Phải nhập lý do từ chối!"); return; }
    }

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/admin/posts/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, reject_reason: reason })
      });

      if (res.ok) {
        alert("Thao tác duyệt bài đăng thành công!");
        fetchPosts(); // Load lại data
      } else {
        alert((await res.json()).detail || "Lỗi xử lý hệ thống");
      }
    } catch (e) {
      alert("Lỗi kết nối đến Server");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="text-blue-600" /> Quản lý kiểm duyệt Bài Đăng (Posts)
        </h1>
      </div>

      {isLoading ? (
        <p className="text-center text-gray-500 py-10">Đang tải dữ liệu...</p>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl bg-gray-50">
          <p className="text-gray-500">Chưa có bài đăng nào trên hệ thống.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {posts.map((p) => {
            const isPending = p.approval === "Pending" || p.approval === "Resending";
            return (
              <div key={p.post_id} className={`bg-white rounded-xl shadow-sm border p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition ${isPending ? "border-yellow-300 bg-yellow-50/30" : "border-gray-200"}`}>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] bg-gray-100 text-gray-600 font-bold px-2 py-1 rounded">ID: #{p.post_id}</span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm ${
                      p.approval === 'Approved' ? 'bg-green-100 text-green-700' : 
                      p.approval === 'Rejected' ? 'bg-red-100 text-red-700' : 
                      p.approval === 'Resending' ? 'bg-blue-100 text-blue-700' : 
                      'bg-yellow-200 text-yellow-800'
                    }`}>
                      {p.approval}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 uppercase">
                      {p.post_type}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-xl text-gray-900">{p.title}</h3>
                  <p className="text-sm text-gray-600">{p.description}</p>
                  <p className="text-xs text-gray-500 font-medium">Người đăng: {p.seller_email}</p>

                  {p.approval === "Rejected" && p.reject_reason && (
                    <div className="mt-2 text-red-600 text-sm font-medium">
                      ⚠️ Lý do từ chối: {p.reject_reason}
                    </div>
                  )}
                </div>

                {/* Nút Thao tác Admin */}
                <div className="w-full md:w-auto flex gap-2 md:flex-col shrink-0">
                  {isPending ? (
                    <>
                      <button onClick={() => reviewPost(p.post_id, "approve")} className="flex-1 md:w-32 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg text-sm transition">
                        <CheckCircle size={16}/> Duyệt
                      </button>
                      <button onClick={() => reviewPost(p.post_id, "reject")} className="flex-1 md:w-32 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg text-sm transition">
                        <XCircle size={16}/> Từ chối
                      </button>
                    </>
                  ) : (
                    <div className="w-full md:w-32 text-center text-sm font-bold text-gray-400 bg-gray-50 py-2.5 rounded-lg border">
                      Đã xử lý
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Clock, Tag, Users, Check, X, RefreshCw, Layers } from "lucide-react";

export default function AdminDashboardPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch("http://127.0.0.1:8000/api/v1/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error("Lỗi tải dữ liệu Dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const handleQuickReview = async (id: number, action: "approve" | "reject") => {
    let reason = null;
    if (action === "reject") {
      reason = prompt("Nhập lý do từ chối yêu cầu này:");
      if (!reason) return;
    }

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/admin/posts/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, reject_reason: reason }),
      });
      if (res.ok) {
        alert("Đã xử lý thành công!");
        fetchDashboardData();
      }
    } catch (e) {
      alert("Lỗi kết nối");
    }
  };

  if (isLoading) {
    return <p className="text-center py-10 text-gray-500 animate-pulse">Đang tải số liệu hệ thống...</p>;
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-400 font-semibold uppercase tracking-wider">Hệ thống tổng quan</p>
          <h1 className="text-3xl text-black font-bold text-gray-900 tracking-tight">Bảng Điều Khiển Quản Trị</h1>
        </div>
        <button onClick={fetchDashboardData} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center bg-white text-gray-600 hover:bg-gray-50 shadow-sm transition">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* 3 Thẻ Thống Kê Lớn (Real-data Khớp Chuẩn Khung Thiết Kế) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Khối 1: Bài đăng chờ duyệt */}
        <div className="bg-[#fff9f0] border border-[#ffeed3] rounded-2xl p-6 flex items-center gap-5 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-[#f97316] flex items-center justify-center text-white shrink-0">
            <Clock size={26} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bài đăng chờ duyệt</p>
            <p className="text-4xl font-black text-gray-900 mt-0.5">{data?.stats?.pending_posts ?? 0}</p>
            <p className="text-[11px] text-orange-600 font-medium mt-1">Yêu cầu từ chợ sinh viên</p>
          </div>
        </div>

        {/* Khối 2: Chiến dịch chờ duyệt */}
        <div className="bg-[#fef3c7] border border-[#fde68a] rounded-2xl p-6 flex items-center gap-5 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-[#d97706] flex items-center justify-center text-white shrink-0">
            <Tag size={26} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chiến dịch chờ duyệt</p>
            <p className="text-4xl font-black text-gray-900 mt-0.5">{data?.stats?.pending_campaigns ?? 0}</p>
            <p className="text-[11px] text-amber-700 font-medium mt-1">Đăng ký từ các Câu lạc bộ</p>
          </div>
        </div>

        {/* Khối 3: Thành viên hệ thống */}
        <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-2xl p-6 flex items-center gap-5 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-[#10b981] flex items-center justify-center text-white shrink-0">
            <Users size={26} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tổng số tài khoản</p>
            <p className="text-4xl font-black text-gray-900 mt-0.5">{data?.stats?.total_users ?? 0}</p>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">Sinh viên UET đang hoạt động</p>
          </div>
        </div>
      </div>

      {/* Bảng Danh sách hàng chờ xử lý nhanh */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">⏱️ Hàng chờ duyệt mới tiếp nhận</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b text-[11px] uppercase tracking-wider">
              <tr>
                <th className="p-4 pl-6">Mã số</th>
                <th className="p-4">Tiêu đề nội dung</th>
                <th className="p-4">Người gửi / Đại diện</th>
                <th className="p-4">Phân loại bài</th>
                <th className="p-4">Thời gian gửi</th>
                <th className="p-4 pr-6 text-right">Thao tác nhanh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {data?.recent_pending_queue?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400">
                    Tuyệt vời! Hiện tại không có yêu cầu nào tồn đọng trong hàng chờ.
                  </td>
                </tr>
              ) : (
                data?.recent_pending_queue?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 pl-6 font-bold text-gray-900">#{item.id}</td>
                    <td className="p-4 max-w-[250px] truncate" title={item.title}>{item.title}</td>
                    <td className="p-4 text-gray-500 text-xs">{item.sender}</td>
                    <td className="p-4">
                      <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 text-xs">
                      {item.created_at ? new Date(item.created_at).toLocaleString("vi-VN") : "Vừa xong"}
                    </td>
                    <td className="p-4 pr-6 text-right space-x-2">
                      <button onClick={() => handleQuickReview(item.id, "approve")} className="bg-emerald-500 text-white px-3 py-1.5 rounded font-bold text-xs hover:bg-emerald-600 shadow-sm transition">
                        Duyệt
                      </button>
                      <button onClick={() => handleQuickReview(item.id, "reject")} className="bg-rose-500 text-white px-3 py-1.5 rounded font-bold text-xs hover:bg-rose-600 shadow-sm transition">
                        Từ chối
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Calendar, Tag, Image as ImageIcon, CheckCircle, XCircle } from "lucide-react";

export default function AdminCampaignsPage() {
  const { token } = useAuthStore();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCampaigns = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      // Admin lấy danh sách toàn bộ campaign để kiểm duyệt
      const res = await fetch("http://127.0.0.1:8000/api/v1/campaigns", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setCampaigns(await res.json());
    } catch (err) {
      console.error("Lỗi:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [token]);

  const reviewCampaign = async (id: number, action: "approve" | "reject") => {
    let reason = null;
    if (action === "reject") {
      reason = prompt("Nhập lý do từ chối chiến dịch này (Bắt buộc):");
      if (!reason) { alert("Phải nhập lý do từ chối!"); return; }
    }

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/admin/campaigns/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, reject_reason: reason })
      });

      if (res.ok) {
        alert("Thao tác duyệt thành công!");
        fetchCampaigns(); // Load lại data
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
          <Tag className="text-blue-600" /> Quản lý kiểm duyệt Chiến dịch
        </h1>
      </div>

      {isLoading ? (
        <p className="text-center text-gray-500 py-10">Đang tải dữ liệu...</p>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl bg-gray-50">
          <p className="text-gray-500">Chưa có chiến dịch nào trên hệ thống.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => {
            const isPending = c.approval === "Pending" || c.approval === "Resending";
            return (
              <div key={c.campaign_id} className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col transition ${isPending ? "border-yellow-300 ring-2 ring-yellow-100" : "border-gray-200"}`}>
                <div className="h-40 bg-gray-100 relative flex items-center justify-center border-b">
                  {c.thumbnail_url ? <img src={c.thumbnail_url} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-300" size={40}/>}
                  <span className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm ${
                    c.approval === 'Approved' ? 'bg-green-500 text-white' : 
                    c.approval === 'Rejected' ? 'bg-red-500 text-white' : 
                    c.approval === 'Resending' ? 'bg-blue-500 text-white' : 
                    'bg-yellow-500 text-black'
                  }`}>
                    {c.approval}
                  </span>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <span className="text-[11px] bg-gray-100 text-gray-600 font-bold px-2 py-1 rounded w-fit mb-2">ID: #{c.campaign_id}</span>
                  <h3 className="font-bold text-lg text-gray-900 line-clamp-2 leading-tight">{c.title}</h3>
                  <p className="text-sm font-medium text-blue-600 mt-1 mb-4">🏛️ {c.org_name}</p>
                  
                  <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 space-y-1.5 border border-gray-100 mb-4">
                    <p className="flex items-center gap-1.5"><Calendar size={14}/> <b>Bắt đầu:</b> {new Date(c.start_date).toLocaleDateString("vi-VN")}</p>
                    <p className="flex items-center gap-1.5"><Calendar size={14}/> <b>Kết thúc:</b> {new Date(c.end_date).toLocaleDateString("vi-VN")}</p>
                  </div>

                  {c.approval === "Rejected" && c.reject_reason && (
                    <div className="mb-4 bg-red-50 border border-red-100 text-red-700 text-xs p-3 rounded-lg">
                      <b>Lý do từ chối:</b> {c.reject_reason}
                    </div>
                  )}

                  {/* Nút thao tác dành cho Admin */}
                  <div className="mt-auto border-t border-dashed pt-4 flex gap-2">
                    {isPending ? (
                      <>
                        <button onClick={() => reviewCampaign(c.campaign_id, "approve")} className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg text-sm transition">
                          <CheckCircle size={16}/> Duyệt
                        </button>
                        <button onClick={() => reviewCampaign(c.campaign_id, "reject")} className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-sm transition">
                          <XCircle size={16}/> Từ chối
                        </button>
                      </>
                    ) : (
                      <div className="w-full text-center text-sm font-medium text-gray-400 bg-gray-50 py-2 rounded-lg border">
                        Đã xử lý
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
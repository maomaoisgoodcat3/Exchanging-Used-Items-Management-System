"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function CampaignsPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;

    // Gọi API thật tới FastAPI
    fetch("http://127.0.0.1:8000/api/v1/campaigns", {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      // Backend FastAPI trả về mảng, set vào state
      setCampaigns(Array.isArray(data) ? data : []);
    })
    .catch(err => console.error("Lỗi tải chiến dịch:", err));
  }, [token]);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Danh sách chiến dịch</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {campaigns.map((c) => (
          <div key={c.campaign_id} className="border p-4 rounded-xl shadow-sm bg-white">
            <h3 className="font-bold text-lg">{c.title}</h3>
            <p className="text-sm text-gray-500">Trạng thái: {c.approval}</p>
            <p className="text-xs text-gray-400 mt-2">ID: {c.campaign_id}</p>
            <button 
              onClick={() => router.push(`/campaigns/${c.campaign_id}`)} 
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-semibold"
            >
              Xem chi tiết
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
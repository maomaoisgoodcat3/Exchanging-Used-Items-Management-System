"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import CreatePostModal from "@/components/features/post/CreatePostModal";
import { useAuthStore } from "@/store/authStore";
import { ArrowLeft, Users, FileText, Calendar } from "lucide-react";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const { token } = useAuthStore(); 

  const [campaign, setCampaign] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`http://127.0.0.1:8000/api/v1/campaigns`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const found = data.find((c: any) => c.campaign_id === parseInt(campaignId));
        setCampaign(found);
      })
      .finally(() => setIsLoading(false));
  }, [campaignId, token]);

  if (isLoading) return <p className="text-center py-20 text-gray-500">Đang tải dữ liệu...</p>;
  if (!campaign) return <div className="text-center py-20"><p className="text-red-500 font-bold mb-4">Không tìm thấy chiến dịch</p><button onClick={()=>router.back()} className="text-blue-600 underline">Quay lại</button></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button onClick={() => router.push("/user/campaigns")} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium transition">
        <ArrowLeft size={18}/> Quay lại danh sách
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Banner */}
        <div className="w-full h-80 bg-gray-100 relative">
          {campaign.thumbnail_url ? (
            <img src={campaign.thumbnail_url} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-2xl">CHƯA CÓ ẢNH</div>
          )}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-blue-800 shadow">
            ID: #{campaign.campaign_id}
          </div>
        </div>

        <div className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 border-b border-gray-100 pb-6">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-2">{campaign.title}</h1>
              <p className="text-lg font-medium text-blue-600">Tổ chức: {campaign.org_name}</p>
              <p className="text-sm text-gray-500 mt-1">Người đăng (Poster): {campaign.org_email}</p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold shadow-md transition whitespace-nowrap text-lg"
            >
              + Tham gia ngay
            </button>
          </div>

          {/* DỮ LIỆU THỐNG KÊ THẬT 100% TỪ DATABASE */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
               <FileText className="text-blue-600 mb-2"/>
               <p className="text-2xl font-bold text-blue-900">{campaign.total_posts || 0}</p>
               <p className="text-xs font-semibold text-blue-700 uppercase">Bài đăng tham gia</p>
             </div>
             <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
               <Users className="text-emerald-600 mb-2"/>
               <p className="text-2xl font-bold text-emerald-900">{campaign.total_participants || 0}</p>
               <p className="text-xs font-semibold text-emerald-700 uppercase">Người tham gia</p>
             </div>
             <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
               <Calendar className="text-gray-500 mb-2"/>
               <p className="text-sm font-bold text-gray-900">{new Date(campaign.start_date).toLocaleDateString("vi-VN")}</p>
               <p className="text-xs font-semibold text-gray-500 uppercase">Ngày bắt đầu</p>
             </div>
             <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
               <Calendar className="text-gray-500 mb-2"/>
               <p className="text-sm font-bold text-gray-900">{new Date(campaign.end_date).toLocaleDateString("vi-VN")}</p>
               <p className="text-xs font-semibold text-gray-500 uppercase">Ngày kết thúc</p>
             </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-3">Mô tả chiến dịch</h3>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-6 rounded-xl border border-gray-100 text-lg">
            {campaign.description || "Chưa có mô tả chi tiết."}
          </p>
        </div>
      </div>

      {isModalOpen && (
        <CreatePostModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          campaignId={String(campaign.campaign_id)} 
          campaignName={campaign.title}
        />
      )}
    </div>
  );
}
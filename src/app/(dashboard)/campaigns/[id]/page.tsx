"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function CampaignsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [myOrgs, setMyOrgs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State cho Modal tạo chiến dịch
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  // 1. FETCH DỮ LIỆU
  const fetchData = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      setIsLoading(true);
      // Lấy danh sách chiến dịch
      const campRes = await fetch("http://127.0.0.1:8000/api/v1/campaigns", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (campRes.ok) {
        const campData = await campRes.json();
        setCampaigns(Array.isArray(campData) ? campData : []);
      }

      // Lấy danh sách tổ chức của User để phân quyền
      const orgRes = await fetch("http://127.0.0.1:8000/api/v1/users/my-organizations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (orgRes.ok) {
        const orgData = await orgRes.json();
        // Chỉ những tổ chức mà user là Manager hoặc Poster mới được tạo chiến dịch
        const validOrgs = orgData.filter((o: any) => o.my_permission === "Manager" || o.my_permission === "Poster");
        setMyOrgs(validOrgs);
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. XỬ LÝ UPLOAD ẢNH (Giống hệt app.js)
  const uploadImageToLocal = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://127.0.0.1:8000/api/v1/upload/", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    
    if (res.ok && data.url) return data.url;
    throw new Error("Lỗi Upload ảnh lên hệ thống!");
  };

  // 3. XỬ LÝ SUBMIT FORM TẠO CHIẾN DỊCH
  const handleCreateCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem("access_token");

    const formData = new FormData(e.currentTarget);
    const orgEmail = formData.get("org_email") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const startDate = formData.get("start_date") as string;
    const endDate = formData.get("end_date") as string;
    const fileInput = formData.get("image_file") as File;

    try {
      if (!orgEmail || !title || !description || !startDate || !endDate) {
        throw new Error("Vui lòng điền đủ thông tin bắt buộc!");
      }

      let imageUrl = "";
      // Nếu có chọn file ảnh, tiến hành gọi API upload trước
      if (fileInput && fileInput.size > 0) {
        imageUrl = await uploadImageToLocal(fileInput);
      }

      // Chuẩn bị payload gửi tạo chiến dịch
      const payload = {
        org_email: orgEmail,
        title: title,
        description: description,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        image_url: imageUrl,
      };

      const res = await fetch("http://127.0.0.1:8000/api/v1/campaigns/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Lỗi tạo chiến dịch");
      }

      alert("Tạo chiến dịch thành công! Vui lòng chờ Admin duyệt.");
      setIsModalOpen(false);
      setPreviewImg(null);
      fetchData(); // Reload lại danh sách

    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý Preview ảnh khi chọn file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewImg(URL.createObjectURL(file));
    } else {
      setPreviewImg(null);
    }
  };

  return (
    <div className="space-y-6 p-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">🚩 Chiến dịch từ Tổ chức</h1>
        
        {/* Chỉ hiện nút Tạo khi user có tổ chức hợp lệ (Manager/Poster) hoặc là Admin */}
        {(myOrgs.length > 0 || user?.role === "ADMIN") && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-colors"
          >
            + Tạo Chiến dịch mới
          </button>
        )}
      </div>

      {/* DANH SÁCH CHIẾN DỊCH */}
      {isLoading ? (
        <p className="text-gray-500 animate-pulse text-center py-10">Đang tải dữ liệu chiến dịch...</p>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed">
           <p className="text-gray-500">Chưa có chiến dịch nào trên hệ thống.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <div 
              key={c.campaign_id} 
              onClick={() => router.push(`/campaigns/${c.campaign_id}`)}
              className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden cursor-pointer flex flex-col transition-all"
            >
              <div className="h-40 bg-gray-100 flex items-center justify-center border-b overflow-hidden">
                 {c.thumbnail_url || c.image_url ? (
                    <img src={c.thumbnail_url || c.image_url} alt={c.title} className="w-full h-full object-cover" />
                 ) : (
                    <span className="text-gray-400">Chưa có ảnh</span>
                 )}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                   <span className="text-[11px] bg-gray-100 text-gray-600 font-bold px-2 py-1 rounded-full truncate max-w-[150px]">
                     🏛️ {c.org_name || c.org_email}
                   </span>
                   <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                      c.approval === 'Approved' ? 'bg-green-100 text-green-700' :
                      c.approval === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      c.approval === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                   }`}>
                     {c.approval}
                   </span>
                </div>
                <h3 className="font-bold text-lg text-blue-600 line-clamp-2 mb-3">{c.title}</h3>
                
                <div className="mt-auto bg-gray-50 p-3 rounded-lg text-xs text-gray-600 space-y-1">
                  <p><b>Bắt đầu:</b> {c.start_date ? new Date(c.start_date).toLocaleDateString("vi-VN") : "N/A"}</p>
                  <p><b>Kết thúc:</b> {c.end_date ? new Date(c.end_date).toLocaleDateString("vi-VN") : "N/A"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL TẠO CHIẾN DỊCH */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl animate-fadeIn max-h-[90vh] flex flex-col">
            <div className="border-b px-6 py-4 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800">Khởi Tạo Chiến Dịch</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleCreateCampaign} className="p-6 overflow-y-auto space-y-5">
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Đại diện cho Tổ chức <span className="text-red-500">*</span></label>
                <select name="org_email" required className="w-full rounded-lg border px-4 py-2.5 outline-none focus:border-blue-500 bg-white">
                  <option value="">-- Chọn Tổ chức của bạn --</option>
                  {myOrgs.map(org => (
                    <option key={org.org_email} value={org.org_email}>{org.org_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tên Chiến Dịch <span className="text-red-500">*</span></label>
                <input name="title" required placeholder="VD: Quyên góp áo ấm..." className="w-full rounded-lg border px-4 py-2.5 outline-none focus:border-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Mô tả chi tiết <span className="text-red-500">*</span></label>
                <textarea name="description" required rows={3} placeholder="Mục đích, thông tin chi tiết..." className="w-full rounded-lg border px-4 py-2.5 outline-none focus:border-blue-500"></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Bắt đầu <span className="text-red-500">*</span></label>
                  <input type="datetime-local" name="start_date" required className="w-full rounded-lg border px-4 py-2.5 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Kết thúc <span className="text-red-500">*</span></label>
                  <input type="datetime-local" name="end_date" required className="w-full rounded-lg border px-4 py-2.5 outline-none focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Hình ảnh minh họa (Chọn từ máy)</label>
                <input type="file" name="image_file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                
                {previewImg && (
                   <div className="mt-4 p-3 bg-gray-50 border rounded-lg flex justify-center">
                      <img src={previewImg} alt="Preview" className="max-h-40 rounded shadow-sm object-contain" />
                   </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg bg-gray-100 px-6 py-2.5 font-medium text-gray-700 hover:bg-gray-200">
                  Hủy
                </button>
                <button type="submit" disabled={isSubmitting} className="rounded-lg bg-blue-600 px-6 py-2.5 font-bold text-white hover:bg-blue-700 disabled:bg-blue-400">
                  {isSubmitting ? "Đang xử lý..." : "Gửi Yêu Cầu Duyệt"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
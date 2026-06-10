"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Calendar, Tag, Image as ImageIcon } from "lucide-react";

export default function CampaignsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, role, user } = useAuthStore();
  
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [myOrgs, setMyOrgs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // THÊM STATE ADMIN

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  // Lấy org_email từ URL nếu bấm từ trang Profile sang
  const autoSelectOrg = searchParams.get("createForOrg");

  const fetchData = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      // KIỂM TRA QUYỀN ADMIN THẬT
      const userRes = await fetch("http://127.0.0.1:8000/api/v1/users/me", { headers: { Authorization: `Bearer ${token}` } });
      const userData = await userRes.json();
      const checkAdmin = String(userData.role).toUpperCase().includes("ADMIN");
      setIsAdmin(checkAdmin);

      // Fetch Campaigns
      const campRes = await fetch("http://127.0.0.1:8000/api/v1/campaigns", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (campRes.ok) setCampaigns(await campRes.json());

      // Fetch My Orgs nếu không phải Admin
      if (!checkAdmin) {
        const orgRes = await fetch("http://127.0.0.1:8000/api/v1/users/my-organizations", {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (orgRes.ok) {
            const orgData = await orgRes.json();
            setMyOrgs(orgData.filter((o: any) => o.my_permission === "Poster"));
        }
      }
    } catch (err) { console.error("Lỗi:", err); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    fetchData();
    if (autoSelectOrg) setIsModalOpen(true);
  }, [token, autoSelectOrg]);

  // Hành động Duyệt chiến dịch của Admin
  const handleReviewCampaign = async (id: number, action: "approve" | "reject", e: React.MouseEvent) => {
    e.stopPropagation(); 
    let reason = null;
    if (action === "reject") {
        reason = prompt("Nhập lý do từ chối chiến dịch này (Bắt buộc):");
        if (!reason) { alert("Phải nhập lý do từ chối!"); return; }
    }
    try {
        const res = await fetch(`http://127.0.0.1:8000/api/v1/admin/campaigns/${id}/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action: action, reject_reason: reason })
        });
        if (res.ok) { alert("Thao tác thành công!"); fetchData(); } else alert("Lỗi hệ thống!");
    } catch(e) { alert("Lỗi Server!"); }
  };

  // Upload Ảnh Local
  const uploadImageToLocal = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("http://127.0.0.1:8000/api/v1/upload/", { method: "POST", body: formData });
    const data = await res.json();
    if (res.ok && data.url) return data.url;
    throw new Error("Lỗi Upload ảnh!");
  };

  // Submit Tạo Campaign
  const handleCreateCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const fileInput = formData.get("image_file") as File;

    try {
      let imageUrl = "";
      if (fileInput && fileInput.size > 0) {
        imageUrl = await uploadImageToLocal(fileInput);
      }

      const payload = {
        org_email: formData.get("org_email"),
        title: formData.get("title"),
        description: formData.get("description"),
        start_date: new Date(formData.get("start_date") as string).toISOString(),
        end_date: new Date(formData.get("end_date") as string).toISOString(),
        image_url: imageUrl,
      };

      const res = await fetch("http://127.0.0.1:8000/api/v1/campaigns/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error((await res.json()).detail || "Lỗi tạo chiến dịch");
      
      alert("Tạo chiến dịch thành công! Chờ duyệt.");
      setIsModalOpen(false);
      setPreviewImg(null);
      fetchData();
      if (autoSelectOrg) router.replace("/user/campaigns"); 
    } catch (err: any) { alert(err.message); } 
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Tag className="text-blue-600"/> Chiến dịch</h1>
        {(myOrgs.length > 0) && (
          <button onClick={() => setIsModalOpen(true)} className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-5 py-2.5 rounded-lg font-bold shadow-sm transition">
            + Tạo Chiến dịch
          </button>
        )}
      </div>

      {isLoading ? ( <p className="text-center text-gray-500 py-10">Đang tải...</p> ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => {
            const isPrivileged = isAdmin || myOrgs.some(o => o.org_email === c.org_email);

            return (
              <div key={c.campaign_id} onClick={() => router.push(`/user/campaigns/${c.campaign_id}`)} className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-200 overflow-hidden cursor-pointer transition flex flex-col relative group">
                <div className="h-44 bg-gray-100 relative border-b border-gray-200 flex items-center justify-center">
                   {c.thumbnail_url ? <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-300" size={40}/>}
                   {isPrivileged && (
                     <span className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm ${
                        c.approval === 'Approved' ? 'bg-green-500 text-white' : c.approval === 'Rejected' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'
                     }`}>{c.approval}</span>
                   )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <span className="text-[11px] bg-blue-50 text-blue-700 font-bold px-2 py-1 rounded w-fit mb-2">ID: #{c.campaign_id}</span>
                  <h3 className="font-bold text-lg text-gray-900 line-clamp-2 leading-tight">{c.title}</h3>
                  <p className="text-sm font-medium text-gray-500 mt-1 mb-4">🏛️ {c.org_name}</p>
                  
                  <div className="mt-auto bg-gray-50 p-3 rounded-lg text-xs text-gray-600 space-y-1.5 border border-gray-100">
                    <p className="flex items-center gap-1.5"><Calendar size={14}/> <b>Bắt đầu:</b> {new Date(c.start_date).toLocaleDateString("vi-VN")}</p>
                    <p className="flex items-center gap-1.5"><Calendar size={14}/> <b>Kết thúc:</b> {new Date(c.end_date).toLocaleDateString("vi-VN")}</p>
                  </div>
                  
                  {/* BỔ SUNG: Nút Duyệt cho Admin */}
                  {isAdmin && (c.approval === 'Pending' || c.approval === 'Resending') && (
                     <div className="mt-3 border-t border-dashed pt-3 flex gap-2">
                        <button onClick={(e) => handleReviewCampaign(c.campaign_id, 'approve', e)} className="flex-1 bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700">Duyệt</button>
                        <button onClick={(e) => handleReviewCampaign(c.campaign_id, 'reject', e)} className="flex-1 bg-red-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-red-700">Từ chối</button>
                     </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tạo Chiến Dịch */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Khởi Tạo Chiến Dịch</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-800 text-2xl">&times;</button>
            </div>

            <form onSubmit={handleCreateCampaign} className="p-6 overflow-y-auto space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Đăng dưới danh nghĩa Tổ chức</label>
                <select name="org_email" required defaultValue={autoSelectOrg || ""} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 outline-none focus:border-blue-500 bg-white">
                  <option value="" disabled>-- Chọn Tổ chức (Bạn là Poster) --</option>
                  {myOrgs.map(org => (<option key={org.org_email} value={org.org_email}>{org.org_name}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tên Chiến Dịch</label>
                <input name="title" required placeholder="VD: Mùa hè xanh..." className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Mô tả</label>
                <textarea name="description" required rows={3} placeholder="Nội dung..." className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500"></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Ngày Bắt đầu</label>
                  <input type="datetime-local" name="start_date" required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Ngày Kết thúc</label>
                  <input type="datetime-local" name="end_date" required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 outline-none focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Hình ảnh Banner (Local)</label>
                <input type="file" name="image_file" accept="image/*" onChange={(e) => setPreviewImg(e.target.files?.[0] ? URL.createObjectURL(e.target.files[0]) : null)} className="w-full" />
                {previewImg && <img src={previewImg} className="mt-3 max-h-32 rounded-lg border object-cover shadow-sm" />}
              </div>

              <div className="border-t pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg bg-gray-100 px-6 py-2.5 font-bold text-gray-700 hover:bg-gray-200">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="rounded-lg bg-blue-600 px-6 py-2.5 font-bold text-white hover:bg-blue-700 disabled:bg-blue-400">
                  {isSubmitting ? "Đang xử lý..." : "Đăng Chiến Dịch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
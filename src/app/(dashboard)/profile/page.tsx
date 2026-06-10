"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import { useAuthStore } from "@/store/authStore";
import { User, Lock, Building2, ArrowLeft } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter(); 
  const { user, token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"info" | "password" | "orgs">("info");

  // State Tabs
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [passData, setPassData] = useState({ old_password: "", new_password: "", verify_new_password: "" });
  const [isAdmin, setIsAdmin] = useState(false); // BỔ SUNG STATE ADMIN

  // State Tổ chức
  const [myOrgs, setMyOrgs] = useState<any[]>([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);

  // State Chi tiết Tổ chức
  const [viewingOrg, setViewingOrg] = useState<string | null>(null);
  const [orgDetail, setOrgDetail] = useState<any>(null);
  const [isManager, setIsManager] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDescInput, setEditDescInput] = useState("");
  const [newMemEmail, setNewMemEmail] = useState("");

  // 1. Tải Profile
  useEffect(() => {
    if (!token) return;
    fetch("http://127.0.0.1:8000/api/v1/users/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => { 
          setName(data.name || ""); 
          setPhone(data.phone || ""); 
          // CẬP NHẬT KIỂM TRA ADMIN
          if (data.role && String(data.role).toUpperCase().includes("ADMIN")) {
              setIsAdmin(true);
          }
      })
      .catch(console.error);
  }, [token]);

  // 2. Tải danh sách Tổ chức
  const fetchOrgsList = () => {
    if (!token || isAdmin) return; // Không fetch nếu là Admin
    setIsLoadingOrgs(true);
    fetch("http://127.0.0.1:8000/api/v1/users/my-organizations", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setMyOrgs(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setIsLoadingOrgs(false));
  };

  useEffect(() => {
    if (activeTab === "orgs") fetchOrgsList();
  }, [activeTab, token, isAdmin]);

  // 3. Tải Chi tiết 1 Tổ chức
  const loadOrgDetail = async (orgEmail: string, permission: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/users/organizations/${orgEmail}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrgDetail(data);
        setViewingOrg(orgEmail);
        setIsManager(permission === "Manager");
        setEditDescInput(data.org_info.description || "");
      }
    } catch (e) {
      alert("Không thể tải chi tiết tổ chức");
    }
  };

  // 4. API Sửa Mô tả Tổ chức
  const handleSaveDescription = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/users/organizations/${viewingOrg}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ description: editDescInput })
      });
      if (res.ok) {
        alert("Đã cập nhật mô tả!");
        setIsEditingDesc(false);
        loadOrgDetail(viewingOrg!, "Manager");
      } else alert((await res.json()).detail);
    } catch (e) { alert("Lỗi kết nối"); }
  };

  // 5. API Thêm Thành Viên
  const handleAddMember = async () => {
    if (!newMemEmail) return alert("Vui lòng nhập Email!");
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/users/organizations/${viewingOrg}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_email: newMemEmail })
      });
      if (res.ok) {
        alert("Đã thêm thành viên thành công!");
        setNewMemEmail("");
        loadOrgDetail(viewingOrg!, "Manager");
      } else alert((await res.json()).detail);
    } catch (e) { alert("Lỗi kết nối"); }
  };

  // 6. API Đổi Quyền / Truyền ngôi Manager
  const handleChangeRole = async (memEmail: string, newRole: string) => {
    if (newRole === 'Manager' && !confirm(`CẢNH BÁO: Chuyển quyền Manager cho ${memEmail} sẽ khiến BẠN bị giáng cấp xuống Member. Bạn có chắc chắn không?`)) {
      loadOrgDetail(viewingOrg!, "Manager"); 
      return; 
    }

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/users/organizations/${viewingOrg}/members/${memEmail}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ permission: newRole })
      });
      if (res.ok) {
        alert((await res.json()).message);
        if (newRole === 'Manager') {
           setViewingOrg(null); 
           fetchOrgsList();
        } else {
           loadOrgDetail(viewingOrg!, "Manager"); 
        }
      } else alert((await res.json()).detail);
    } catch (e) { alert("Lỗi kết nối"); }
  };


  // --- API Cơ bản (Profile / Password) ---
  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/users/me", {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, phone }),
      });
      if (!res.ok) throw new Error("Lỗi cập nhật");
      alert("Cập nhật thông tin thành công!");
    } catch (err) { alert("Cập nhật thất bại."); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.new_password !== passData.verify_new_password) return alert("Mật khẩu xác nhận không khớp!");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/auth/change-password", {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(passData),
      });
      if (!res.ok) throw new Error((await res.json()).detail);
      alert("Đổi mật khẩu thành công!");
      setPassData({ old_password: "", new_password: "", verify_new_password: "" });
    } catch (err: any) { alert(err.message); }
  };


  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row">
      <aside className="h-fit w-full rounded-xl border border-gray-200 bg-white p-3 shadow-sm md:w-64">
        <button onClick={() => { setActiveTab("info"); setViewingOrg(null); }} className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${activeTab === "info" ? "bg-blue-50 font-bold text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
          <User size={18} /> Thông tự cá nhân
        </button>
        <button onClick={() => { setActiveTab("password"); setViewingOrg(null); }} className={`mt-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${activeTab === "password" ? "bg-blue-50 font-bold text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
          <Lock size={18} /> Đổi mật khẩu
        </button>
        
        {/* ĐÃ ẨN TAB NẾU LÀ ADMIN */}
        {!isAdmin && (
          <button onClick={() => setActiveTab("orgs")} className={`mt-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${activeTab === "orgs" ? "bg-blue-50 font-bold text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
            <Building2 size={18} /> Tổ chức (Orgs)
          </button>
        )}
      </aside>

      <main className="flex-1 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        
        {activeTab === "info" && (
          <div className="max-w-md animate-in fade-in">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h2>
            <form onSubmit={handleUpdateInfo} className="space-y-4">
              <div><label className="mb-1 block text-sm font-bold text-gray-700">Email</label><input type="email" value={user?.email || ""} disabled className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-4 py-2.5 text-gray-500" /></div>
              <div><label className="mb-1 block text-sm font-bold text-gray-700">Họ và tên</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập họ tên..." className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none" /></div>
              <div><label className="mb-1 block text-sm font-bold text-gray-700">Số điện thoại</label><input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Nhập số điện thoại..." className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none" /></div>
              <button type="submit" className="mt-4 rounded-lg bg-blue-600 px-6 py-2.5 font-bold text-white transition hover:bg-blue-700">Lưu thay đổi</button>
            </form>
          </div>
        )}

        {activeTab === "password" && (
          <div className="max-w-md animate-in fade-in">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Đổi mật khẩu</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <input type="password" placeholder="Mật khẩu cũ" required value={passData.old_password} onChange={(e) => setPassData({...passData, old_password: e.target.value})} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none" />
              <input type="password" placeholder="Mật khẩu mới" required value={passData.new_password} onChange={(e) => setPassData({...passData, new_password: e.target.value})} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none" />
              <input type="password" placeholder="Xác nhận mật khẩu mới" required value={passData.verify_new_password} onChange={(e) => setPassData({...passData, verify_new_password: e.target.value})} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none" />
              <button type="submit" className="mt-4 rounded-lg bg-yellow-500 px-6 py-2.5 font-bold text-gray-900 transition hover:bg-yellow-600">Cập nhật mật khẩu</button>
            </form>
          </div>
        )}

        {activeTab === "orgs" && !isAdmin && (
          <div className="animate-in fade-in">
            {!viewingOrg ? (
              <>
                <h2 className="mb-6 text-2xl font-bold text-gray-900">Các tổ chức của bạn</h2>
                {isLoadingOrgs ? ( <p className="text-gray-500 animate-pulse">Đang tải...</p> ) 
                : myOrgs.length === 0 ? ( <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-12 text-center text-gray-500">Bạn chưa tham gia Tổ chức nào trên hệ thống.</div>) 
                : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {myOrgs.map((org, idx) => (
                      <div key={idx} onClick={() => loadOrgDetail(org.org_email, org.my_permission)} className="cursor-pointer rounded-xl border border-gray-200 p-5 transition hover:border-blue-500 hover:shadow-md">
                        <h3 className="text-lg font-bold text-blue-700">{org.org_name}</h3>
                        <p className="mb-3 mt-1 text-sm text-gray-500">Email: {org.org_email}</p>
                        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
                          <span className="font-medium text-gray-600">Vai trò:</span>
                          <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${org.my_permission === 'Manager' ? 'bg-rose-100 text-rose-700' : org.my_permission === 'Poster' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>{org.my_permission}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
            orgDetail && (
              <div className="animate-in slide-in-from-right-4">
                <button onClick={() => setViewingOrg(null)} className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition"><ArrowLeft size={16}/> Quay lại danh sách</button>
                
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{orgDetail.org_info.org_name}</h2>
                  
                  {orgDetail.members.find((m: any) => m.email === user?.email)?.permission === "Poster" && (
                    <button 
                      onClick={() => router.push(`/user/campaigns?createForOrg=${orgDetail.org_info.org_email}`)}
                      className="rounded-lg bg-yellow-500 px-4 py-2 font-bold text-gray-900 hover:bg-yellow-600 shadow-sm transition"
                    >
                      + Đăng Campaign mới
                    </button>
                  )}
                </div>
                
                <div className="mb-8 rounded-xl bg-gray-50 p-5 border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">Mô tả tổ chức</h3>
                    {isManager && !isEditingDesc && <button onClick={() => setIsEditingDesc(true)} className="text-sm font-medium text-blue-600 hover:underline">✏️ Sửa mô tả</button>}
                  </div>
                  
                  {isEditingDesc ? (
                    <div className="space-y-3">
                      <textarea rows={3} value={editDescInput} onChange={(e) => setEditDescInput(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none"/>
                      <div className="flex gap-2">
                        <button onClick={handleSaveDescription} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">Lưu</button>
                        <button onClick={() => setIsEditingDesc(false)} className="rounded-md bg-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-300">Hủy</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 whitespace-pre-wrap">{orgDetail.org_info.description || "Chưa có mô tả."}</p>
                  )}
                </div>

                {isManager && (
                  <div className="mb-8 rounded-xl border-l-4 border-amber-400 bg-amber-50 p-5">
                    <h3 className="mb-3 font-semibold text-amber-900">Quyền Manager: Thêm thành viên</h3>
                    <div className="flex gap-3">
                      <input type="email" value={newMemEmail} onChange={(e) => setNewMemEmail(e.target.value)} placeholder="Nhập email sinh viên cần thêm..." className="flex-1 rounded-lg border border-amber-200 px-4 py-2.5 outline-none focus:border-amber-500" />
                      <button onClick={handleAddMember} className="rounded-lg bg-amber-500 px-6 py-2.5 font-bold text-white hover:bg-amber-600 transition">+ Thêm</button>
                    </div>
                  </div>
                )}

                <h3 className="mb-3 font-bold text-gray-900">Danh sách Thành viên ({orgDetail.members.length})</h3>
                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                  {orgDetail.members.map((m: any) => (
                    <div key={m.email} className="flex items-center justify-between border-b p-4 last:border-0 hover:bg-gray-50">
                      <div>
                        <p className="font-bold text-gray-800">{m.name} {m.email === user?.email && "(Bạn)"}</p>
                        <p className="text-sm text-gray-500">{m.email}</p>
                      </div>
                      
                      {isManager && m.email !== user?.email ? (
                        <select 
                          value={m.permission}
                          onChange={(e) => handleChangeRole(m.email, e.target.value)}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="Manager">Manager</option>
                          <option value="Poster">Poster</option>
                          <option value="Member">Member</option>
                        </select>
                      ) : (
                        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${m.permission === 'Manager' ? 'bg-rose-100 text-rose-700' : m.permission === 'Poster' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                          {m.permission}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
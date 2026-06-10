"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { UploadCloud, X as XIcon, Image as ImageIcon } from "lucide-react";

interface PostItem {
  post_id: number;
  title: string;
  description: string;
  thumbnail_url?: string;
  post_category: string;
  approval: string;
  availability: string;
  campaign_id?: number | null;
  reject_reason?: string;
  created_at: string;
}

interface StorageItem {
  product_id: number;
  product_name: string;
  product_category_id: number;
  product_quantity: number;
  product_price: number;
  product_location_id: number;
}

const approvalStyles: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Approved: "bg-emerald-100 text-emerald-800",
  Rejected: "bg-red-100 text-red-800",
  Resending: "bg-amber-100 text-amber-800"
};

const approvalLabels: Record<string, string> = {
  Pending: "Chờ phê duyệt",
  Approved: "Đã duyệt",
  Rejected: "Bị từ chối",
  Resending: "Đang gửi lại"
};

export default function MyPostsPage() {
  const { user, token } = useAuthStore();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [storageItems, setStorageItems] = useState<StorageItem[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // MẢNG CHỨA CÁC ID SẢN PHẨM ĐƯỢC CHỌN
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const selectedProductsDetails = storageItems.filter((item) =>
    selectedProductIds.includes(item.product_id)
  );

  // STATE QUẢN LÝ UPLOAD ẢNH
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  const refreshPostList = async () => {
    try {
      if (!token) return;
      const [postsRes, storageRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/v1/my-posts", {
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          }),
          fetch("http://127.0.0.1:8000/api/v1/storage", {
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          }),
      ]);

      if (postsRes.ok && storageRes.ok) {
         setPosts(await postsRes.json());
         setStorageItems(await storageRes.json());
      } else {
         setError("Không thể đồng bộ dữ liệu từ hệ thống.");
      }
    } catch (err) {
      console.error("Lỗi đồng bộ danh sách bài viết:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!token) {
           setError("Vui lòng đăng nhập để xem thông tin.");
           setIsLoading(false);
           return;
        }
        await refreshPostList();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // HÀM XỬ LÝ UPLOAD ẢNH THẬT
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImg(true);
    const formData = new FormData();
    formData.append("file", file); // Field name "file" khớp với chuẩn FastAPI UploadFile

    try {
      // Gọi API upload (Thay bằng endpoint thật của backend bạn nếu có tên khác)
      const res = await fetch("http://127.0.0.1:8000/api/v1/upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        alert("Có lỗi xảy ra khi tải ảnh lên server.");
        return;
      }

      const data = await res.json();
      // Server trả về { url: "..." } hoặc { file_url: "..." }
      setThumbnailUrl(data.url || data.file_url || data.image_url || "");
    } catch (err) {
      console.error("Lỗi upload ảnh:", err);
      alert("Lỗi kết nối khi tải ảnh.");
    } finally {
      setIsUploadingImg(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedProductIds.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm từ kho đồ!");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const campaignVal = formData.get("campaign_id");

    const formattedProducts = selectedProductIds.map((id) => ({
      product_id: id,
      product_quantity: 1, 
    }));

    const newPost = {
      title: String(formData.get("title")),
      post_category: String(formData.get("post_category")),
      description: String(formData.get("description")),
      thumbnail_url: thumbnailUrl, // Sử dụng URL ảnh đã upload thay vì text input
      campaign_id: campaignVal ? Number(campaignVal) : null,
      products: formattedProducts,
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/my-posts", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.detail?.[0]?.msg || errorData.detail || "Không thể xử lý bài đăng.");
        return;
      }

      alert("Đã tạo bài đăng và đính kèm vật phẩm thành công!");
      setIsAddModalOpen(false);
      setSelectedProductIds([]);
      setThumbnailUrl(""); // Reset ảnh
      refreshPostList(); 
    } catch (err: any) {
      alert("Lỗi kết nối, không thể gửi yêu cầu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <section className="flex flex-col md:flex-row items-center justify-between rounded-3xl border bg-white p-6 shadow-sm gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Bài đăng của tôi</h1>
          <p className="mt-2 text-gray-600">
            Xin chào, <span className="font-semibold text-blue-600">{user?.fullName || user?.email || "Người dùng"}</span>!
          </p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-full bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 shadow-sm"
        >
          + Tạo bài đăng mới
        </button>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-gray-500 animate-pulse font-medium">Đang tải danh sách bài đăng...</p>
          </div>
        ) : error ? (
          <div className="flex h-40 items-center justify-center text-red-500 font-medium bg-red-50 rounded-xl">
            <p>{error}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-500 mb-4 text-lg">Bạn chưa đăng tải bài viết nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">Mã</th>
                  <th className="px-6 py-4 font-semibold">Ảnh</th>
                  <th className="px-6 py-4 font-semibold">Tiêu đề bài đăng</th>
                  <th className="px-6 py-4 font-semibold">Danh mục</th>
                  <th className="px-6 py-4 font-semibold">Trạng thái</th>
                  <th className="px-6 py-4 font-semibold text-right">Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.post_id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">#{post.post_id}</td>
                    <td className="px-6 py-4">
                      {post.thumbnail_url ? (
                        <img src={post.thumbnail_url} alt="thumbnail" className="w-12 h-12 rounded-lg object-cover border" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg border flex items-center justify-center text-gray-400"><ImageIcon size={16}/></div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 max-w-xs truncate" title={post.title}>
                      <div>{post.title}</div>
                      {post.approval === "Rejected" && post.reject_reason && (
                        <span className="text-xs font-normal text-red-500 block mt-0.5">Lý do: {post.reject_reason}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-1.5 rounded uppercase tracking-wide">
                        {post.post_category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${approvalStyles[post.approval] || 'bg-gray-100'}`}>
                        {approvalLabels[post.approval] || post.approval}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500">{new Date(post.created_at).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* MODAL THÊM BÀI ĐĂNG */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 text-black">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-gray-800">Tạo bài đăng mới</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-red-500 transition"><XIcon/></button>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tiêu đề bài đăng</label>
                <input name="title" required placeholder="Thanh lý combo đồ dùng..." className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
              </div>

              {/* CHỌN SẢN PHẨM TỪ KHO */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                <label className="block text-sm font-semibold text-gray-700">🛒 Đính kèm vật phẩm từ kho</label>
                <select 
                  value=""
                  onChange={(e) => {
                     const id = Number(e.target.value);
                     if (id && !selectedProductIds.includes(id)) {
                        setSelectedProductIds((prev) => [...prev, id]);
                     }
                  }}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 bg-white outline-none focus:border-blue-500 font-medium"
                >
                  <option value="">-- Bấm vào đây để chọn vật phẩm --</option>
                  {storageItems.map((item) => (
                    <option key={item.product_id} value={item.product_id} disabled={selectedProductIds.includes(item.product_id)}>
                      #{item.product_id} - {item.product_name} {selectedProductIds.includes(item.product_id) ? "(Đã chọn)" : ""}
                    </option>
                  ))}
                </select>

                {selectedProductsDetails.length > 0 && (
                  <div className="flex flex-col gap-2 bg-white p-3 rounded-lg border border-slate-200 mt-2">
                    {selectedProductsDetails.map((item) => (
                      <div key={item.product_id} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded border border-slate-100">
                         <span className="text-sm font-semibold text-gray-700">{item.product_name}</span>
                         <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-blue-600">{Number(item.product_price).toLocaleString('vi-VN')} đ</span>
                            <button type="button" onClick={() => setSelectedProductIds(prev => prev.filter(id => id !== item.product_id))} className="text-red-400 hover:text-red-600 font-bold">&times;</button>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Loại bài đăng</label>
                  <select name="post_category" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 bg-white outline-none focus:border-blue-500">
                    <option value="Selling">Bán hàng</option>
                    <option value="Trading">Trao đổi</option>
                    <option value="Donating">Quyên góp</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mã chiến dịch (Optional)</label>
                  <input name="campaign_id" type="number" placeholder="Bỏ trống nếu đăng tự do" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-blue-500" />
                </div>
              </div>

              {/* TÍNH NĂNG UPLOAD ẢNH API MỚI */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hình ảnh bài đăng</label>
                <div className="flex items-center gap-4">
                   <div 
                     onClick={() => fileInputRef.current?.click()}
                     className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition ${isUploadingImg ? "bg-gray-100 border-gray-300" : thumbnailUrl ? "bg-white border-blue-200" : "bg-slate-50 border-slate-300 hover:bg-slate-100"}`}
                   >
                     {isUploadingImg ? (
                        <span className="text-sm text-gray-500 animate-pulse font-semibold">Đang tải lên hệ thống...</span>
                     ) : thumbnailUrl ? (
                        <div className="w-full h-full relative p-2">
                           <img src={thumbnailUrl} className="w-full h-full object-contain rounded-lg" alt="Preview"/>
                        </div>
                     ) : (
                        <>
                           <UploadCloud className="text-gray-400 mb-2" size={28}/>
                           <span className="text-xs text-gray-500 font-medium">Bấm để chọn file ảnh (.jpg, .png)</span>
                        </>
                     )}
                   </div>
                   <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload}/>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả nội dung</label>
                <textarea name="description" rows={3} required placeholder="Nhập thông tin chi tiết..." className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 resize-none" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-xl bg-gray-100 px-5 py-2.5 font-bold text-gray-600 hover:bg-gray-200">Hủy bỏ</button>
                <button type="submit" disabled={isSubmitting || isUploadingImg} className="rounded-xl bg-blue-600 px-6 py-2.5 font-bold text-white hover:bg-blue-700 disabled:bg-blue-400">
                  {isSubmitting ? "Đang xử lý..." : "Đăng bài ngay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";

// Cấu trúc dữ liệu bài đăng
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

// Cấu trúc dữ liệu sản phẩm lấy từ MyStorage
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
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [storageItems, setStorageItems] = useState<StorageItem[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // MẢNG CHỨA CÁC ID SẢN PHẨM ĐƯỢC CHỌN (Multi-select)
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  // Lọc lấy danh sách các Object sản phẩm tương ứng với mảng ID đã chọn
  const selectedProductsDetails = storageItems.filter((item) =>
    selectedProductIds.includes(item.product_id)
  );

  const refreshPostList = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const [postsRes, storageRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/v1/my-posts", {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch("http://127.0.0.1:8000/api/v1/storage", {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
        ]);

        if (!postsRes.ok || !storageRes.ok) {
          throw new Error("Không thể tải dữ liệu hệ thống.");
        }
    } catch (err) {
      console.error("Lỗi đồng bộ danh sách bài viết:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        refreshPostList();

        const token = localStorage.getItem("access_token");
        if (!token) return setError("Vui lòng đăng nhập để xem thông tin.");

        const [postsRes, storageRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/v1/my-posts", {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch("http://127.0.0.1:8000/api/v1/storage", {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
        ]);

        if (!postsRes.ok || !storageRes.ok) {
          throw new Error("Không thể tải dữ liệu hệ thống.");
        }

        const postsData = await postsRes.json();
        const storageData = await storageRes.json();
        console.log(postsData);
        setPosts(postsData);
        setStorageItems(storageData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Hàm xử lý khi chọn thêm một sản phẩm từ dropdown
  const handleSelectProduct = (productId: number) => {
    if (!productId) return;
    if (!selectedProductIds.includes(productId)) {
      setSelectedProductIds((prev) => [...prev, productId]);
    }
  };

  // Hàm xử lý gỡ bỏ sản phẩm khỏi danh sách chọn
  const handleRemoveProduct = (productId: number) => {
    setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
  };

  const handleCreatePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Ngăn chặn tạo bài đăng trống không có sản phẩm
    if (selectedProductIds.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm từ kho đồ!");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const campaignVal = formData.get("campaign_id");

    // 1. Định dạng mảng ID thành mảng Object đúng cấu trúc của bảng PostProducts
    const formattedProducts = selectedProductIds.map((id) => ({
      product_id: id,
      product_quantity: 1, // Mặc định số lượng là 1 theo thiết kế DB của bạn
    }));

    // 2. Gom tất cả thông tin lại thành 1 payload duy nhất
    const newPost = {
      title: String(formData.get("title")),
      post_category: String(formData.get("post_category")),
      description: String(formData.get("description")),
      thumbnail_url: String(formData.get("thumbnail_url")) || null,
      campaign_id: campaignVal ? Number(campaignVal) : null,
      products: formattedProducts, // Đưa vào mảng sản phẩm đính kèm
    };

    try {
      const token = localStorage.getItem("access_token");
      
      const res = await fetch("http://127.0.0.1:8000/api/v1/my-posts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPost), // Chuyển thành chuỗi JSON gửi đi
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Lỗi cấu trúc dữ liệu gửi lên:", errorData);
        throw new Error(errorData.detail?.[0]?.msg || errorData.detail || "Không thể xử lý bài đăng.");
      }

      const addedPost = await res.json();
      
      // Cập nhật lại danh sách hiển thị trên UI
      setPosts((prev) => [...prev, addedPost]);
      setIsAddModalOpen(false);
      setSelectedProductIds([]); // Dọn sạch danh sách đã chọn
      alert("Đã phân tách và lưu dữ liệu thành công vào hệ thống!");
      refreshPostList(); 
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

return (
    <div className="space-y-6 p-6 relative">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row items-center justify-between rounded-3xl border bg-white p-6 shadow-sm gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Bài đăng của tôi</h1>
          <p className="mt-2 text-gray-600">
            Xin chào, <span className="font-semibold text-blue-600">{user?.fullName || user?.email || "Người dùng"}</span>!
          </p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 shadow-sm"
        >
          + Tạo bài đăng mới
        </button>
      </section>

      {/* Data Section */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-gray-500 animate-pulse font-medium">Đang tải danh sách bài đăng...</p>
          </div>
        ) : error ? (
          <div className="flex h-40 items-center justify-center text-red-500 font-medium">
            <p>{error}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-500 mb-4 text-lg">Bạn chưa đăng tải bài viết nào.</p>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="rounded-lg bg-gray-100 px-6 py-2 font-medium text-gray-700 hover:bg-gray-200"
            >
              Tạo bài đăng đầu tiên
            </button>
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
                  <th className="px-6 py-4 font-semibold">Ngày tạo</th>
                  <th className="px-6 py-4 font-semibold text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.post_id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-500">#{post.post_id}</td>
                    <td className="px-6 py-4">
                      {post.thumbnail_url ? (
                        <img src={post.thumbnail_url} alt="thumbnail" className="w-12 h-12 rounded-lg object-cover border" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg border flex items-center justify-center text-xs text-gray-400">No pic</div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 max-w-xs truncate" title={post.title}>
                      <div>{post.title}</div>
                      {post.approval === "Rejected" && post.reject_reason && (
                        <span className="text-xs font-normal text-red-500 block mt-0.5">Lý do: {post.reject_reason}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-indigo-50 text-indigo-700 font-medium px-2 py-1 rounded">
                        {post.post_category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${approvalStyles[post.approval] || 'bg-gray-100'}`}>
                        {approvalLabels[post.approval] || post.approval}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{new Date(post.created_at).toLocaleDateString('vi-VN')}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                        Sửa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* MODAL THÊM BÀI ĐĂNG MỚI (HỖ TRỢ NHIỀU SẢN PHẨM) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 text-black">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-gray-800">Tạo bài đăng mới</h2>
              <button 
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setSelectedProductIds([]);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề bài đăng</label>
                <input 
                  name="title"
                  required
                  placeholder="Ví dụ: Thanh lý gói combo đồ dùng học tập cuối kỳ"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:border-blue-500" 
                />
              </div>

              {/* PHẦN CHỌN NHIỀU SẢN PHẨM TỪ KHO ĐỒ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn các sản phẩm từ kho của bạn</label>
                <select 
                  value=""
                  onChange={(e) => handleSelectProduct(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 bg-white outline-none focus:border-blue-500"
                >
                  <option value="">-- Bấm vào đây để chọn thêm sản phẩm --</option>
                  {storageItems.map((item) => {
                    const isSelected = selectedProductIds.includes(item.product_id);
                    return (
                      <option 
                        key={item.product_id} 
                        value={item.product_id}
                        disabled={isSelected} // Ngăn người dùng chọn trùng sản phẩm đã có trong list
                        className={isSelected ? "text-gray-300" : ""}
                      >
                        #{item.product_id} - {item.product_name} {isSelected ? "(Đã chọn)" : `(Tồn: ${item.product_quantity})`}
                      </option>
                    );
                  })}
                </select>

                {/* HIỂN THỊ CÁC BADGE/TAG SẢN PHẨM ĐÃ CHỌN ĐỂ HỦY NHANH */}
                {selectedProductIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedProductsDetails.map((item) => (
                      <span 
                        key={item.product_id}
                        className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 font-medium px-2.5 py-1 rounded-md text-xs border border-blue-200"
                      >
                        {item.product_name}
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(item.product_id)}
                          className="text-blue-400 hover:text-blue-600 font-bold ml-1 text-sm focus:outline-none"
                          title="Xóa khỏi bài viết"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* BOX HIỂN THỊ DANH SÁCH CHI TIẾT CÁC SẢN PHẨM ĐÃ CHỌN */}
              {selectedProductsDetails.length > 0 && (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3 animate-fadeIn text-xs">
                  <p className="font-bold text-sm text-slate-800 border-b pb-1.5 flex justify-between">
                    <span>Danh sách chi tiết ({selectedProductsDetails.length} sản phẩm):</span>
                    <span className="text-blue-600">
                      Tổng tiền: {selectedProductsDetails.reduce((sum, item) => sum + Number(item.product_price), 0).toLocaleString('vi-VN')} đ
                    </span>
                  </p>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {selectedProductsDetails.map((item, idx) => (
                      <div key={item.product_id} className="flex justify-between items-center bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                        <div>
                          <p className="font-semibold text-gray-900">{idx + 1}. {item.product_name} <span className="text-gray-400 font-normal">(#{item.product_id})</span></p>
                          <p className="text-gray-500">Số lượng hiện có: <span className="font-medium text-gray-800">{item.product_quantity}</span></p>
                        </div>
                        <span className="font-bold text-slate-700">{Number(item.product_price).toLocaleString('vi-VN')} đ</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại bài đăng</label>
                  <select 
                    name="post_category" 
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 bg-white outline-none focus:border-blue-500"
                  >
                    <option value="Selling">Bán hàng</option>
                    <option value="Trading">Trao đổi</option>
                    <option value="Donating">Quyên góp</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã chiến dịch (Nếu có)</label>
                  <input 
                    name="campaign_id"
                    type="number"
                    placeholder="Bỏ trống nếu đăng tự do"
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:border-blue-500" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link ảnh Thumbnail</label>
                <input 
                  name="thumbnail_url"
                  placeholder="Ví dụ: https://images.com/pic.jpg"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:border-blue-500" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả nội dung bài đăng</label>
                <textarea 
                  name="description"
                  rows={3}
                  required
                  placeholder="Nhập thông tin chi tiết, tình trạng các sản phẩm hoặc nội dung bài viết..."
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:border-blue-500" 
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-200 sticky bottom-0 bg-white">
                <button 
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setSelectedProductIds([]);
                  }}
                  className="rounded-lg bg-gray-100 px-5 py-2 font-medium text-gray-700 hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-blue-400"
                >
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
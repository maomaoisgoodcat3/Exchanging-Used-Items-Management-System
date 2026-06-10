"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Package, X as XIcon } from "lucide-react";

interface StorageItem {
  product_id: number;
  product_name: string;
  product_category_id: number;
  product_quantity: number;
  product_price: number;
  product_location_id: number;
}

export default function MyStoragePage() {
  const { user, token } = useAuthStore();
  const [items, setItems] = useState<StorageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchStorage = async () => {
      if (!token) {
        setError("Vui lòng đăng nhập để xem kho lưu trữ.");
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/storage", {
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        });

        if (!res.ok) {
           // TRÁNH SỬ DỤNG THROW ERROR Ở ĐÂY. Sử dụng setError.
           setError("Hiện tại không thể truy xuất dữ liệu từ kho lưu trữ.");
           return;
        }
        const data = await res.json();
        setItems(data);
      } catch (err: any) {
        setError("Lỗi kết nối tới máy chủ.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStorage();
  }, [token]);

  const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const newItem = {
      product_name: String(formData.get("product_name")),
      product_category_id: Number(formData.get("product_category_id")),
      product_quantity: Number(formData.get("product_quantity")),
      product_price: Number(formData.get("product_price")),
      location: String(formData.get("location")), 
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/storage", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.detail || "Lỗi khi thêm vật phẩm");
        return;
      }

      const addedItem = await res.json();
      setItems((prev) => [...prev, addedItem]);
      setIsAddModalOpen(false);
      alert("Đã thêm vật phẩm thành công!");
    } catch (err: any) {
      alert("Lỗi mạng, không thể gửi yêu cầu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <section className="flex flex-col md:flex-row items-center justify-between rounded-3xl border bg-white p-6 shadow-sm gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Kho đồ của tôi</h1>
          <p className="mt-2 text-gray-600">
            Xin chào, <span className="font-semibold text-blue-600">{user?.fullName || user?.email || "Người dùng"}</span>!
          </p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-full bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 shadow-sm"
        >
          + Thêm vật phẩm
        </button>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-gray-500 animate-pulse font-medium">Đang tải dữ liệu kho...</p>
          </div>
        ) : error ? (
          <div className="flex h-40 items-center justify-center text-red-500 font-medium bg-red-50 rounded-xl">
            <p>{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4"><Package size={64} className="text-gray-300"/></div>
            <p className="text-gray-500 mb-4 text-lg">Kho của bạn hiện đang trống.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">ID</th>
                  <th className="px-6 py-4 font-semibold">Tên vật phẩm</th>
                  <th className="px-6 py-4 font-semibold">Danh mục</th>
                  <th className="px-6 py-4 font-semibold">Số lượng</th>
                  <th className="px-6 py-4 font-semibold">Định giá</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.product_id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">#{item.product_id}</td>
                    <td className="px-6 py-4 font-bold text-blue-600">{item.product_name}</td>
                    <td className="px-6 py-4">
                       <span className="bg-gray-100 text-gray-600 font-bold px-2 py-1 rounded text-xs">Loại {item.product_category_id}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{item.product_quantity}</td>
                    <td className="px-6 py-4 text-emerald-600 font-bold">{Number(item.product_price).toLocaleString('vi-VN')} đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* MODAL THÊM VẬT PHẨM */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 text-black">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl animate-fadeIn">
            <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Thêm vật phẩm mới</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-red-500 transition"><XIcon/></button>
            </div>

            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên vật phẩm</label>
                <input name="product_name" required placeholder="Ví dụ: Sách Toán Cao Cấp" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Danh mục</label>
                  <select name="product_category_id" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 bg-white outline-none focus:border-blue-500">
                    <option value="1">Dụng cụ học tập</option>
                    <option value="2">Quần áo</option>
                    <option value="3">Đồ dùng</option>
                    <option value="4">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Số lượng</label>
                  <input name="product_quantity" type="number" min="1" defaultValue="1" required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Định giá (VNĐ)</label>
                <input name="product_price" type="number" min="0" defaultValue="0" required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vị trí lưu trữ (Kho)</label>
                <input name="location" required placeholder="Ví dụ: KTX Ngoại ngữ..." className="w-full rounded-xl border border-blue-200 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 bg-blue-50/30" />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-xl bg-gray-100 px-5 py-2.5 font-bold text-gray-600 hover:bg-gray-200">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="rounded-xl bg-blue-600 px-6 py-2.5 font-bold text-white hover:bg-blue-700 disabled:bg-blue-400">
                  {isSubmitting ? "Đang lưu..." : "Thêm vào kho"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
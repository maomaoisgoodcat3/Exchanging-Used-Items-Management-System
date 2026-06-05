"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";

interface StorageItem {
  product_id: number;
  product_name: string;
  product_category_id: number;
  product_quantity: number;
  product_price: number;
  product_location_id: number;
}

export default function MyStoragePage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<StorageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchStorage = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return setError("Vui lòng đăng nhập để xem kho lưu trữ.");

        const res = await fetch("http://127.0.0.1:8000/api/v1/storage", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("Không thể tải dữ liệu kho lưu trữ.");
        const data = await res.json();
        setItems(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStorage();
  }, []);

  const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const newItem = {
      product_name: String(formData.get("product_name")),
      product_category_id: Number(formData.get("product_category_id")),
      product_quantity: Number(formData.get("product_quantity")),
      product_price: Number(formData.get("product_price")),
      location: String(formData.get("location")), // Truyền text location lên server
    };

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://127.0.0.1:8000/api/v1/storage", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newItem),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Lỗi khi thêm vật phẩm");
      }

      const addedItem = await res.json();
      
      // Update UI ngay lập tức
      setItems((prev) => [...prev, addedItem]);
      setIsAddModalOpen(false);
      alert("Đã thêm vật phẩm thành công!");
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
          <h1 className="text-3xl font-bold text-slate-900">Kho lưu trữ của tôi</h1>
          <p className="mt-2 text-gray-600">
            Xin chào, <span className="font-semibold text-blue-600">{user?.fullName || user?.email || "Người dùng"}</span>!
          </p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 shadow-sm"
        >
          + Thêm vật phẩm
        </button>
      </section>

      {/* Data Section */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-gray-500 animate-pulse font-medium">Đang tải dữ liệu kho...</p>
          </div>
        ) : error ? (
          <div className="flex h-40 items-center justify-center text-red-500 font-medium">
            <p>{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500 mb-4 text-lg">Kho của bạn hiện đang trống.</p>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="rounded-lg bg-gray-100 px-6 py-2 font-medium text-gray-700 hover:bg-gray-200"
            >
              Thêm vật phẩm đầu tiên
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">ID</th>
                  <th className="px-6 py-4 font-semibold">Tên vật phẩm</th>
                  <th className="px-6 py-4 font-semibold">Mã danh mục</th>
                  <th className="px-6 py-4 font-semibold">Số lượng</th>
                  <th className="px-6 py-4 font-semibold">Định giá</th>
                  <th className="px-6 py-4 font-semibold text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.product_id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-500">#{item.product_id}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{item.product_name}</td>
                    <td className="px-6 py-4">{item.product_category_id}</td>
                    <td className="px-6 py-4 font-medium">{item.product_quantity}</td>
                    <td className="px-6 py-4 text-blue-600 font-semibold">{Number(item.product_price).toLocaleString('vi-VN')} đ</td>
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

      {/* MODAL THÊM VẬT PHẨM */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-fadeIn">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Thêm vật phẩm mới</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên vật phẩm</label>
                <input 
                  name="product_name"
                  required
                  placeholder="Ví dụ: Sách Toán Cao Cấp"
                  className="w-full rounded-lg border px-4 py-2 outline-none focus:border-blue-500" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                  <select 
                    name="product_category_id" 
                    className="w-full rounded-lg border px-4 py-2 bg-white outline-none focus:border-blue-500"
                  >
                    <option value="1">Dụng cụ học tập</option>
                    <option value="2">Quần áo</option>
                    <option value="3">Đồ dùng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                  <input 
                    name="product_quantity"
                    type="number"
                    min="1"
                    defaultValue="1"
                    required
                    className="w-full rounded-lg border px-4 py-2 outline-none focus:border-blue-500" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Định giá (VNĐ)</label>
                <input 
                  name="product_price"
                  type="number"
                  min="0"
                  defaultValue="0"
                  required
                  className="w-full rounded-lg border px-4 py-2 outline-none focus:border-blue-500" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí lưu trữ (Kho)</label>
                <input 
                  name="location"
                  required
                  placeholder="Ví dụ: Tủ sách cá nhân, Ngăn kéo số 2..."
                  className="w-full rounded-lg border px-4 py-2 outline-none focus:border-blue-500 bg-blue-50/30" 
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg bg-gray-100 px-5 py-2 font-medium text-gray-700 hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-blue-400"
                >
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
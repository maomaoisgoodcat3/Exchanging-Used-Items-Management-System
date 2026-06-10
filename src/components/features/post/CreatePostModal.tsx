"use client";

import { type FormEvent, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { savePost } from "@/services/postServices";
import type { Post } from "@/types/post";

type CreatePostModalProps = {
  isOpen: boolean;
  onClose: () => void;
  campaignId?: string;
  campaignName?: string;
  onPostCreated?: (post: Post) => void;
};

export default function CreatePostModal({
  isOpen,
  onClose,
  campaignId,
  campaignName,
  onPostCreated,
}: CreatePostModalProps) {
  const { user } = useAuthStore();
  const [formProducts, setFormProducts] = useState([{ id: 1, name: "", quantity: 1, price: 0 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddProductRow = () => {
    setFormProducts([...formProducts, { id: Date.now(), name: "", quantity: 1, price: 0 }]);
  };

  const handleRemoveProductRow = (idToRemove: number) => {
    setFormProducts(formProducts.filter((p) => p.id !== idToRemove));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      alert("Vui lòng đăng nhập.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);

    try {
      // 1. Chuẩn bị danh sách sản phẩm
      const products = formProducts.map((p) => ({
        product_id: 0, // Backend sẽ tự xử lý
        product_name: String(formData.get(`productName-${p.id}`) ?? ""),
        product_quantity: Number(formData.get(`quantity-${p.id}`) ?? 1),
        product_price: Number(formData.get(`price-${p.id}`) ?? 0),
        product_category_id: 1, 
      }));

      // 2. Tạo đối tượng Post khớp với Interface Post đã định nghĩa
      const newPost: Post = {
        post_id: 0, // Truyền số 0 cho số nguyên (INT)
        title: String(formData.get("title") ?? ""),
        post_category: String(formData.get("type") ?? "Selling") as any,
        description: String(formData.get("description") ?? ""),
        seller_email: user.email,
        campaign_id: campaignId ? parseInt(campaignId) : null,
        products: products,
        approval: "Pending", // Phải là string khớp với ENUM trong DB
      };

      // 3. Gửi lên server
      const result = await savePost(newPost);
      onPostCreated?.(result as any);
      alert("Đã gửi bài đăng thành công!");
      onClose();
    } catch (err) {
      alert("Lỗi khi tạo bài đăng. Kiểm tra lại console!");
      console.error("Chi tiết lỗi:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form className="relative flex h-[90vh] w-full max-w-3xl flex-col rounded-xl bg-white p-6 shadow-2xl" onSubmit={handleSubmit}>
        <button className="absolute right-5 top-4 z-20 text-3xl font-bold text-gray-400" onClick={onClose} type="button">&times;</button>
        <h2 className="mb-4 border-b pb-3 text-2xl font-bold text-gray-800">📝 Khởi tạo bài đăng mới</h2>

        <div className="flex-1 space-y-6 overflow-y-auto pr-2">
          {campaignId && (
            <div className="rounded-xl border bg-cyan-50 p-4">
              <p className="text-sm font-semibold text-cyan-800">Campaign: {campaignName} ({campaignId})</p>
            </div>
          )}

          <div className="space-y-4 rounded-lg border bg-gray-50 p-4">
            <h3 className="font-semibold text-gray-700">1. Thông tin chung</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input className="w-full rounded-lg border px-3 py-2" name="title" placeholder="Tiêu đề bài đăng" required />
              <select className="w-full rounded-lg border bg-white px-3 py-2" name="type">
                <option value="Selling">Mua bán</option>
                <option value="Trading">Trao đổi</option>
                <option value="Donating">Quyên góp</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border bg-gray-50 p-4">
            <h3 className="font-semibold text-gray-700">2. Mô tả</h3>
            <textarea className="w-full rounded-lg border px-3 py-2" name="description" rows={4} placeholder="Mô tả chi tiết..." />
          </div>

          <div className="space-y-4 rounded-lg border bg-gray-50 p-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-700">3. Vật phẩm</h3>
              <button className="rounded-md bg-blue-100 px-3 py-1 text-sm text-blue-700" onClick={handleAddProductRow} type="button">+ Thêm</button>
            </div>
            {formProducts.map((p) => (
              <div key={p.id} className="grid grid-cols-2 gap-2 border-b pb-2">
                <input className="rounded border px-2 py-1" name={`productName-${p.id}`} placeholder="Tên SP" required />
                <input className="rounded border px-2 py-1" name={`quantity-${p.id}`} type="number" placeholder="SL" />
                <input className="rounded border px-2 py-1 col-span-2" name={`price-${p.id}`} type="number" placeholder="Giá" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
          <button className="rounded-lg bg-gray-100 px-6 py-2.5" onClick={onClose} type="button">Hủy</button>
          <button className="rounded-lg bg-blue-600 px-6 py-2.5 font-bold text-white" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu duyệt"}
          </button>
        </div>
      </form>
    </div>
  );
}
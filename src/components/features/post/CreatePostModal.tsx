"use client";

import { type FormEvent, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { savePost } from "@/services/postServices";
import type { Post, PostType, ProductItem } from "@/types/post";

type CreatePostModalProps = {
  isOpen: boolean;
  onClose: () => void;
  campaignId?: string;
  campaignName?: string;
  onPostCreated?: (post: Post) => void;
};

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function CreatePostModal({
  isOpen,
  onClose,
  campaignId,
  campaignName,
  onPostCreated,
}: CreatePostModalProps) {
  const { user } = useAuth();
  const [formProducts, setFormProducts] = useState([{ id: 1, name: "", quantity: 1, price: 0 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddProductRow = () => {
    setFormProducts([...formProducts, { id: Date.now(), name: "", quantity: 1, price: 0 }]);
  };

  const handleRemoveProductRow = (idToRemove: number) => {
    setFormProducts(formProducts.filter((product) => product.id !== idToRemove));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      alert("Vui lòng đăng nhập bằng role user để tạo bài viết.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();

    if (!title) {
      alert("Bạn cần nhập tiêu đề bài đăng.");
      return;
    }

    setIsSubmitting(true);

    const images = await Promise.all(
      formData
        .getAll("images")
        .filter((file): file is File => file instanceof File && file.size > 0)
        .map(fileToDataUrl),
    );
    const firstProductId = formProducts[0]?.id;
    const products: ProductItem[] = formProducts.map((product, index) => ({
      id: `p-${Date.now()}-${index}`,
      name:
        String(formData.get(`productName-${product.id}`) ?? "").trim() ||
        `Vật phẩm ${index + 1}`,
      quantity: Number(formData.get(`quantity-${product.id}`) ?? 1),
      price: Number(formData.get(`price-${product.id}`) ?? 0),
    }));
    const placeholderImage = "https://placehold.co/600x400/e0f2fe/0f172a?text=UET+Marketplace";

    const createdPost: Post = {
      id: Date.now(),
      ownerId: user.id,
      title,
      type: String(formData.get("type") ?? "MUA_BAN") as PostType,
      category: firstProductId
        ? String(formData.get(`category-${firstProductId}`) ?? "Khác")
        : "Khác",
      condition: firstProductId
        ? String(formData.get(`condition-${firstProductId}`) ?? "Như mới")
        : "Như mới",
      location: "UET Marketplace",
      image: images[0] ?? placeholderImage,
      images: images.length > 0 ? images : [placeholderImage],
      description: String(formData.get("description") ?? ""),
      sellerName: user.fullName,
      sellerEmail: user.email,
      sellerPhone: user.organization?.leaderPhone,
      campaignId,
      campaignName,
      products,
      price: products.reduce((total, product) => total + product.price * product.quantity, 0),
      createdAt: new Date().toLocaleDateString("vi-VN"),
    };

    savePost(createdPost);
    onPostCreated?.(createdPost);
    setIsSubmitting(false);
    alert(
      campaignId
        ? `Đã lưu bài viết thuộc campaign ${campaignId}!`
        : "Đã lưu bài viết mới!",
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        className="relative flex h-[90vh] w-full max-w-3xl animate-fadeIn flex-col rounded-xl bg-white p-6 shadow-2xl"
        onSubmit={handleSubmit}
      >
        <button
          className="absolute right-5 top-4 z-20 text-3xl font-bold text-gray-400 transition-colors hover:text-red-500"
          onClick={onClose}
          type="button"
        >
          &times;
        </button>

        <h2 className="mb-4 border-b pb-3 text-2xl font-bold text-gray-800">
          📝 Khởi tạo bài đăng mới
        </h2>

        <div className="flex-1 space-y-6 overflow-y-auto pr-2">
          {campaignId && (
            <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-cyan-800">Bài viết thuộc campaign</p>
                  <p className="text-xs text-cyan-700">
                    Campaign ID được tự động điền khi bạn tạo bài từ trang chiến dịch.
                  </p>
                </div>
                <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-800">
                  Tham gia campaign
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Campaign ID</label>
                  <input
                    className="w-full rounded-lg border border-cyan-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                    name="campaignId"
                    readOnly
                    value={campaignId}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Tên campaign
                  </label>
                  <input
                    className="w-full rounded-lg border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-700"
                    name="campaignName"
                    readOnly
                    value={campaignName ?? ""}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 rounded-lg border bg-gray-50 p-4">
            <h3 className="font-semibold text-gray-700">1. Thông tin chung</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tiêu đề bài đăng <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  name="title"
                  placeholder="VD: Thanh lý sách giáo khoa..."
                  type="text"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Hình thức <span className="text-red-500">*</span>
                </label>
                <select className="w-full rounded-lg border bg-white px-3 py-2" name="type">
                  <option value="MUA_BAN">Mua bán</option>
                  <option value="TRAO_DOI">Trao đổi</option>
                  <option value="QUYEN_GOP">Quyên góp</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border bg-gray-50 p-4">
            <h3 className="font-semibold text-gray-700">2. Hình ảnh & Mô tả</h3>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tải ảnh lên</label>
              <input
                accept="image/*"
                className="w-full rounded-lg border bg-white px-3 py-2 file:mr-4 file:rounded-full file:bg-blue-50 file:px-4 file:py-2 file:text-blue-700 file:hover:bg-blue-200"
                multiple
                name="images"
                type="file"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Mô tả chi tiết
              </label>
              <textarea
                className="w-full rounded-lg border px-3 py-2"
                name="description"
                placeholder="Mô tả chi tiết..."
                rows={4}
              />
            </div>
          </div>

          <div className="space-y-4 rounded-lg border bg-gray-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-gray-700">3. Danh sách vật phẩm</h3>
              <button
                className="rounded-md bg-blue-100 px-3 py-1 text-sm text-blue-700 hover:bg-blue-200"
                onClick={handleAddProductRow}
                type="button"
              >
                + Thêm vật phẩm
              </button>
            </div>

            {formProducts.map((product, index) => (
              <div
                className="mb-5 flex flex-col gap-3 border-b border-gray-200 pb-5 last:border-0 last:pb-0"
                key={product.id}
              >
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Tên vật phẩm</label>
                    <input
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      name={`productName-${product.id}`}
                      placeholder={`Vật phẩm ${index + 1}`}
                      type="text"
                    />
                  </div>
                  {formProducts.length > 1 && (
                    <button
                      className="p-2 text-red-500 hover:bg-red-100"
                      onClick={() => handleRemoveProductRow(product.id)}
                      type="button"
                    >
                      🗑️
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Danh mục</label>
                    <select
                      className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                      name={`category-${product.id}`}
                    >
                      <option>Sách vở</option>
                      <option>Quần áo</option>
                      <option>Đồ dùng học tập</option>
                      <option>Khác</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tình trạng</label>
                    <select
                      className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                      name={`condition-${product.id}`}
                    >
                      <option>Mới 100%</option>
                      <option>Như mới</option>
                      <option>Sử dụng vừa phải</option>
                      <option>Sử dụng nhiều</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Số lượng</label>
                    <input
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      defaultValue="1"
                      name={`quantity-${product.id}`}
                      type="number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Giá (VNĐ)</label>
                    <input
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      defaultValue="0"
                      name={`price-${product.id}`}
                      type="number"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
          <button
            className="rounded-lg bg-gray-100 px-6 py-2.5 text-gray-700 hover:bg-gray-300"
            onClick={onClose}
            type="button"
          >
            Hủy bỏ
          </button>
          <button
            className="rounded-lg bg-blue-600 px-6 py-2.5 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Đang lưu..." : "Gửi yêu cầu duyệt"}
          </button>
        </div>
      </form>
    </div>
  );
}

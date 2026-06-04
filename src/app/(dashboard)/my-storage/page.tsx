"use client";

import { useAuthStore } from "@/store/authStore";

export default function MyStoragePage() {
  const { user } = useAuthStore();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Kho lưu trữ của tôi</h1>
      <div className="mt-6 rounded-xl bg-white p-6 shadow border">
        <p className="text-gray-600">Xin chào, {user?.fullName || user?.email || "Người dùng"}!</p>
        <p className="text-sm text-gray-500 mt-2">Khu vực này hiện đang được nâng cấp để kết nối với API thực tế...</p>
      </div>
    </div>
  );
}
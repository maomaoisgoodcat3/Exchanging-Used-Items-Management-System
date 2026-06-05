"use client";

import { useMemo } from "react";
import { useAuthStore } from "@/store/authStore"; // Dùng store thật

export default function NotificationsPage() {
  const { user } = useAuthStore();
  
  // Logic hiển thị thông báo thật từ API sẽ được thêm vào đây sau
  return (
    <div className="p-6">
      <h1 className="text-2xl text-black font-bold flex flex-col md:flex-row items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm gap-4">Thông báo</h1>
      <div className="mt-4 p-4 border border-slate-200 rounded-xl bg-white text-black">
        <p>Chào bạn{ user?.fullName}, khu vực thông báo đang được kết nối với hệ thống...</p>
      </div>
    </div>
  );
}
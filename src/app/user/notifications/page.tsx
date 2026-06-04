"use client";

import { useMemo } from "react";
import { useAuthStore } from "@/store/authStore"; // Dùng store thật

export default function NotificationsPage() {
  const { user } = useAuthStore();
  
  // Logic hiển thị thông báo thật từ API sẽ được thêm vào đây sau
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Thông báo</h1>
      <div className="mt-4 p-4 border rounded-xl bg-white">
        <p>Chào {user?.fullName}, khu vực thông báo đang được kết nối với hệ thống...</p>
      </div>
    </div>
  );
}
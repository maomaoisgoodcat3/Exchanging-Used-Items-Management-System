"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { authService } from "@/services/auth.service"; // Nhớ import đúng đường dẫn
import { useRouter } from "next/navigation";

interface CreateTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateTokenModal({ isOpen, onClose }: CreateTokenModalProps) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleResetPassword = async () => {
    if (!token || !newPassword || !verifyPassword) {
      return alert("Vui lòng điền đầy đủ thông tin!");
    }
    if (newPassword !== verifyPassword) {
      return alert("Mật khẩu xác nhận không khớp!");
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(token, newPassword);
      alert("Đổi mật khẩu thành công! Vui lòng đăng nhập lại bằng mật khẩu mới.");
      onClose();
      router.push("/login"); // Đẩy về trang đăng nhập
    } catch (error: any) {
      alert(error.message || "Token không hợp lệ hoặc đã hết hạn!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-8 py-6">
          <h2 className="text-xl font-semibold text-gray-900">Đặt Lại Mật Khẩu</h2>
          <button onClick={onClose} className="text-gray-500 transition hover:text-black">
            <X size={28} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 p-8">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Mã khôi phục (Token) <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Dán mã khôi phục lấy từ Terminal vào đây..."
              className="w-full rounded-lg border px-4 py-3 text-base outline-none focus:border-blue-500 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu mới <span className="text-red-500">*</span></label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Ít nhất 6 ký tự..."
              className="w-full rounded-lg border px-4 py-3 text-base outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Xác nhận mật khẩu mới <span className="text-red-500">*</span></label>
            <input
              type="password"
              value={verifyPassword}
              onChange={(e) => setVerifyPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới..."
              className="w-full rounded-lg border px-4 py-3 text-base outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-8 py-6 bg-gray-50 rounded-b-xl flex flex-col gap-3">
          <button
            onClick={handleResetPassword}
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 py-3 text-base font-bold text-white hover:bg-blue-700 disabled:bg-blue-400 transition"
          >
            {isLoading ? "Đang xử lý..." : "Xác Nhận Đổi Mật Khẩu"}
          </button>
          
          <button onClick={onClose} className="text-sm font-medium text-gray-500 hover:text-gray-700">
            Hủy thao tác
          </button>
        </div>
      </div>
    </div>
  );
}
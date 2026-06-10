"use client";

import { X } from "lucide-react";
import { useState } from "react";
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
    if (!token || !newPassword || !verifyPassword) return alert("Vui lòng điền đủ thông tin!");
    if (newPassword !== verifyPassword) return alert("Mật khẩu xác nhận không khớp!");

    setIsLoading(true);
    try {
      // TODO: Thay bằng hàm gọi API authService.resetPassword của bạn
      alert("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
      onClose();
      router.push("/login");
    } catch (error: any) {
      alert(error.message || "Lỗi xử lý!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-8 py-6">
          <h2 className="text-xl font-bold text-gray-900">Đặt Lại Mật Khẩu</h2>
          <button onClick={onClose} className="text-gray-400 transition hover:text-gray-800">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-5 p-8">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Mã khôi phục (Token)</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Dán mã khôi phục vào đây..."
              className="w-full rounded-lg border px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Ít nhất 6 ký tự..."
              className="w-full rounded-lg border px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={verifyPassword}
              onChange={(e) => setVerifyPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu..."
              className="w-full rounded-lg border px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="border-t bg-gray-50 px-8 py-6 rounded-b-2xl">
          <button
            onClick={handleResetPassword}
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 py-3 text-base font-bold text-white hover:bg-blue-700 disabled:bg-blue-400 transition"
          >
            {isLoading ? "Đang xử lý..." : "Xác Nhận Đổi Mật Khẩu"}
          </button>
        </div>
      </div>
    </div>
  );
}
"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import CreateTokenModal from "@/components/features/post/CreateTokenModal";
import { authService } from "@/services/auth.service"; // Nhớ import đúng đường dẫn service của bạn

export default function ForgotPasswordPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return alert("Vui lòng nhập email!");
    
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      alert("Đã gửi yêu cầu!\n\nCopy mã (Token) trong Terminal FastAPI và chọn 'Đã có token? Đặt lại mật khẩu' để tiếp tục.");
      // Tự động mở Modal nhập token lên cho user
      setIsModalOpen(true);
    } catch (error: any) {
      alert(error.message || "Đã xảy ra lỗi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-100 text-black">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h2 className="mt-2 text-xl font-semibold text-blue-900">
            Khôi phục mật khẩu
          </h2>
        </div>

        <form className="space-y-4" onSubmit={handleForgotSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium">Email đăng nhập</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn..."
              className="w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 py-3 text-white font-bold hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isLoading ? "Đang xử lý..." : "Gửi yêu cầu"}
          </button>

          <div className="flex justify-between items-center mt-4">
            <Link href="/login" className="text-sm text-blue-500 hover:underline">
              ← Trở về đăng nhập
            </Link>

            <span 
              onClick={() => setIsModalOpen(true)}
              className="text-sm text-blue-500 hover:underline cursor-pointer font-medium">
              Đã có token?
            </span>

            <CreateTokenModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
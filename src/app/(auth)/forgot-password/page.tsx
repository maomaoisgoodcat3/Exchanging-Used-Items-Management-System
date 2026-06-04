"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import CreateTokenModal from "@/components/features/post/CreateTokenModal";

export default function LoginPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-100">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          
          <h2 className="mt-2 text-xl font-semibold text-blue-900">
            Khôi phục mật khẩu
          </h2>

        </div>

        <form className="space-y-4"
            onSubmit={(e) => {
            e.preventDefault();

            alert(
              "Đã gửi yêu cầu!\n\nCopy mã (Token) trong Terminal và chọn 'Đã có token? Đặt lại mật khẩu' để tiếp tục."
            );
          }}
        >
          <div>
            <label className="mb-2 block text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              placeholder="Nhập email"
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-3 text-white hover:bg-blue-700"
          >
            Gửi yêu cầu
            
          </button>

          <div className="flex justify-between items-center mb-2">
            <Link
              href="/login"
              className="text-sm text-blue-500 hover:underline"
            >
              ← Back
            </Link>

            <span 
              onClick={() => setIsModalOpen(true)}
              className="text-sm text-blue-500 hover:underline cursor-pointer">
              Đã có token? Đặt lại mật khẩu
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
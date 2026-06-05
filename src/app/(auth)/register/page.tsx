"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      // Gọi service đăng ký
      await authService.register({
        user_email: data.user_email,
        user_name: data.user_name,
        phone: data.phone,
        password: data.password,
        verify_password: data.verify_password,
      });

      alert("Đăng ký thành công! Vui lòng đăng nhập.");
      router.push("/login");
    } catch (err: any) {
      alert(err.message || "Đăng ký thất bại, vui lòng kiểm tra lại thông tin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-100">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <p className="mt-2 text-xl font-semibold text-gray-800">
            Đăng ký tài khoản
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium">Email</label>
            <input
              name="user_email"
              type="email"
              placeholder="Nhập email"
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Họ và tên</label>
            <input
              name="user_name"
              type="text"
              placeholder="Nhập họ tên"
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Số điện thoại</label>
            <input
              name="phone"
              type="tel"
              placeholder="Nhập số điện thoại"
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Mật khẩu</label>
            <input
              name="password"
              type="password"
              placeholder="Nhập mật khẩu"
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Nhập lại mật khẩu</label>
            <input
              name="verify_password"
              type="password"
              placeholder="Nhập lại mật khẩu"
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 py-3 text-white hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isLoading ? "Đang xử lý..." : "Đăng ký"}
          </button>

          <Link
            href="/login"
            className="mb-2 block text-sm text-blue-500 hover:underline text-center"
          >
            ← Đã có tài khoản? Đăng nhập
          </Link>
        </form>
      </div>
    </div>
  );
}
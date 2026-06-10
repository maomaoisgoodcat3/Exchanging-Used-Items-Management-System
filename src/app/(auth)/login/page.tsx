"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
// Đã xóa import mock data cũ, dùng trực tiếp store thật
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/auth.service";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  
  // Thêm state để người dùng tự nhập Email & Password thật
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg("");
    setIsLoading(true);
    
    try {
      // 1. Gọi API đăng nhập thật tới FastAPI (cổng 8000)
      const data = await authService.login(email, password);
      console.log("Dữ liệu từ API:", data);
      
      // 2. Lưu Token và User vào Global Store & LocalStorage
      const loggedInUser = data.user || { email, role: "MEMBER" };
      login(data.access_token, loggedInUser);
      
      // 3. Điều hướng đúng layout theo role thật
      const role = loggedInUser.role?.toUpperCase();
      if (role === "ADMIN") {
        router.push("/admin/posts");
      } else {
        router.push("/user/posts");
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Sai email hoặc mật khẩu. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-100">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-600">
            Chào mừng bạn đến với
          </h1>
          <h2 className="mt-2 text-xl font-semibold text-gray-800">
            Nền tảng UET Marketplace
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Đăng nhập bằng tài khoản để tiếp tục
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          {errorMsg && (
            <div className="rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-600">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email đã đăng ký..."
              className="w-full rounded-lg border border-slate-200 bg-gray-50 p-3 outline-none text-black autofill:text-black focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Mật khẩu</label>
            <input
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu..."
              className="w-full rounded-lg border border-slate-200 bg-gray-50 p-3 outline-none text-black autofill:text-black focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full rounded-lg bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-800 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {isLoading ? "Đang xử lý..." : "Đăng nhập vào hệ thống"}
          </button>

          <div className="mt-4 flex justify-between text-sm font-medium text-blue-500">
            <Link href="/forgot-password" className="hover:underline">Quên mật khẩu?</Link>
            <Link href="/register" className="hover:underline">Đăng ký ngay</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("login clicked");

    // CHUYỂN TRANG
    router.push("/posts");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-100">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-600">
            Chào mừng bạn đến với
          </h1>

          <h2 className="mt-2 text-xl font-semibold text-gray-800">
            Nền tảng trao đổi đồ cũ Trường X
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Đăng nhập để tiếp tục sử dụng hệ thống
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="mb-2 block text-sm font-medium">Email</label>
            <input
              name="email"
              type="email"
              placeholder="Nhập email"
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Mật khẩu</label>
            <input
              name="password"
              type="password"
              placeholder="Nhập mật khẩu"
              className="w-full rounded-lg border p-3"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-3 text-white hover:bg-pink-700"
          >
            Đăng nhập
          </button>

          <div className="mt-4 flex justify-between text-sm text-blue-500">
            <Link href="/forgot-password">Quên mật khẩu?</Link>
            <Link href="/register">Đăng ký</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
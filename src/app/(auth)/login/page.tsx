"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { MOCK_ROLE_LABELS } from "@/mocks/user.mocks";
import type { UserRole } from "@/types/user";

const mockRoles: UserRole[] = ["STUDENT", "CLUB", "ADMIN"];

const getRoleHomePath = (role: UserRole) =>
  role === "ADMIN" ? "/admin/posts" : "/user/posts";

export default function LoginPage() {
  const router = useRouter();
  const { mockRole, setMockRole, hydrateMockUser } = useAuth();

  useEffect(() => {
    hydrateMockUser();
  }, [hydrateMockUser]);

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    router.push(getRoleHomePath(mockRole));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-100">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-600">
            Chào mừng bạn đến với
          </h1>

          <h2 className="mt-2 text-xl font-semibold text-gray-800">
            Nền tảng trao đổi đồ cũ UET
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Chọn role mock để vào đúng layout admin/user.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
            <p className="mb-2 text-sm font-medium text-blue-900">
              Role đăng nhập mock
            </p>
            <div className="grid grid-cols-3 gap-2">
              {mockRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setMockRole(role)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    mockRole === role
                      ? "bg-blue-600 text-white"
                      : "bg-white text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  {MOCK_ROLE_LABELS[role]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Email</label>
            <input
              name="email"
              type="email"
              value={`${mockRole.toLowerCase()}@uet.edu.vn`}
              readOnly
              className="w-full rounded-lg border bg-gray-50 p-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Mật khẩu</label>
            <input
              name="password"
              type="password"
              value="mock-password"
              readOnly
              className="w-full rounded-lg border bg-gray-50 p-3"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-3 text-white hover:bg-blue-800"
          >
            Đăng nhập vào {MOCK_ROLE_LABELS[mockRole]} layout
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

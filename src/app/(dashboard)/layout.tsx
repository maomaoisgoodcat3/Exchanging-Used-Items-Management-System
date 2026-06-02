"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { MOCK_ROLE_LABELS } from "@/mocks/user.mocks";
import type { UserRole } from "@/types/user";

const mockRoles: UserRole[] = ["STUDENT", "CLUB", "ADMIN"];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { user, mockRole, setMockRole, hydrateMockUser, logout } = useAuth();

  useEffect(() => {
    hydrateMockUser();
  }, [hydrateMockUser]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-blue-100">
      <header className="flex items-center justify-between bg-gray-100 px-6 py-4 shadow-md">
        <h1 className="text-xl font-semibold text-blue-800">
          Nền tảng trao đổi đồ cũ UET
        </h1>

        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2"
          >
            👤 {user?.fullName ?? "Mock user"}
            <span>▼</span>
          </button>

          {isOpen && (
            <div className="absolute right-0 z-50 mt-2 w-72 rounded-lg bg-white shadow-lg">
              <div className="border-b p-4">
                <p className="font-medium">{user?.fullName ?? "Mock user"}</p>
                <p className="text-sm text-gray-500">
                  {user?.email ?? "mock@uet.edu.vn"}
                </p>
                <p className="mt-1 text-xs font-semibold text-blue-600">
                  Role: {user ? MOCK_ROLE_LABELS[user.role] : MOCK_ROLE_LABELS[mockRole]}
                </p>
                {user?.organization && (
                  <p className="mt-1 text-xs text-gray-500">
                    {user.organization.name}
                  </p>
                )}
              </div>

              <div className="border-b p-3">
                <p className="mb-2 text-xs font-semibold uppercase text-gray-500">
                  Dev mock role
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {mockRoles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setMockRole(role)}
                      className={`rounded-md px-2 py-1.5 text-xs font-semibold transition ${
                        user?.role === role
                          ? "bg-blue-600 text-white"
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      }`}
                    >
                      {MOCK_ROLE_LABELS[role]}
                    </button>
                  ))}
                </div>
              </div>

              <button className="w-full px-4 py-3 text-left hover:bg-blue-100">
                Tài khoản
              </button>

              <button className="w-full px-4 py-3 text-left hover:bg-blue-100">
                Cài đặt
              </button>

              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 text-left hover:bg-blue-100"
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-0 flex h-screen w-48 flex-col bg-white px-6 py-10 shadow-md">
          <nav className="flex-1 space-y-3 text-md">
            <Link href="/posts" className="block transition hover:text-blue-600">
              📝 Posts
            </Link>
            {user?.role !== "ADMIN" && (
              <Link href="/campaigns" className="block transition hover:text-blue-600">
                🔖 Campaigns
              </Link>
            )}
            <Link href="/my-posts" className="block transition hover:text-blue-600">
              🗂️ My Posts
            </Link>
            <Link href="/my-orders" className="block transition hover:text-blue-600">
              🛍️ My orders
            </Link>
            <Link href="/notifications" className="block transition hover:text-blue-600">
              📮 Notifications
            </Link>
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

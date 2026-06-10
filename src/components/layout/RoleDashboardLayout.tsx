"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
// Import thẳng từ store thật mà chúng ta đã làm, bỏ qua hook cũ
import { useAuthStore } from "@/store/authStore"; 

type RoleScope = "admin" | "user";

type RoleDashboardLayoutProps = {
  children: React.ReactNode;
  scope?: RoleScope;
};

// Tạo Label thật thay vì import từ thư mục mocks
const ROLE_LABELS: Record<string, string> = {
  STUDENT: "Sinh viên",
  CLUB: "Câu lạc bộ",
  ADMIN: "Quản trị viên",
  MEMBER: "Thành viên",
};

const getRoleBasePath = (role?: string) => (role === "ADMIN" ? "/admin" : "/user");

export default function RoleDashboardLayout({
  children,
  scope,
}: RoleDashboardLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // Dùng state thật từ useAuthStore
  const { user, role, hydrateAuth, logout } = useAuthStore();

  // Chạy hàm khôi phục phiên đăng nhập thật
  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  const activeRole = role?.toUpperCase() || "MEMBER";
  const roleBasePath = getRoleBasePath(activeRole);
  const expectedScope: RoleScope = activeRole === "ADMIN" ? "admin" : "user";
  const isWrongRoleScope = Boolean(scope && scope !== expectedScope);

  const navItems = useMemo(() => {
    if (activeRole === "ADMIN") {
      return [
        { href: `${roleBasePath}/posts`, label: "Posts" },
        { href: `${roleBasePath}/campaigns`, label: "Campaigns" },
        { href: `${roleBasePath}/notifications`, label: "Moderation" },
      ];
    }

    return [
      { href: `${roleBasePath}/posts`, label: "Posts" },
      { href: `${roleBasePath}/my-posts`, label: "My Posts" },
      { href: `${roleBasePath}/my-storage`, label: "My Storage" },
      { href: `${roleBasePath}/campaigns`, label: "Campaigns" },
      { href: `${roleBasePath}/my-orders`, label: "My orders" },
      { href: `${roleBasePath}/notifications`, label: "Notifications" },
    ];
  }, [activeRole, roleBasePath]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-blue-100">
      <header className="flex items-center justify-between bg-gray-100 px-6 py-4 shadow-md">
        <div>
          <h1 className="text-xl font-semibold text-blue-800">
            Nền tảng trao đổi đồ cũ UET
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {scope ? `${scope} layout` : "shared dashboard layout"} · Role:{" "}
            {ROLE_LABELS[activeRole] || activeRole}
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-2 font-semibold text-blue-800"
          >
            👤 {user?.fullName ?? user?.email ?? "Người dùng"}
            <span>▼</span>
          </button>

          {isOpen && (
            <div className="absolute right-0 z-50 mt-2 w-72 rounded-lg bg-white shadow-lg">
              <div className="border-b p-4">
                <p className="font-medium text-black">{user?.fullName ?? "Người dùng"}</p>
                <p className="text-sm text-gray-500">
                  {user?.email ?? "Đang tải..."}
                </p>
                <p className="mt-1 text-xs font-semibold text-blue-600">
                  Role hiện tại: {ROLE_LABELS[activeRole] || activeRole}
                </p>
              </div>

              {/* Đã xóa khu vực "Chuyển role mock" vì hệ thống giờ dùng dữ liệu phân quyền thật từ API */}

              <Link 
                href={`${roleBasePath}/profile`} // Trả lại biến roleBasePath chuẩn của bạn
                onClick={() => setIsOpen(false)} 
                className="block w-full px-4 py-3 text-left hover:bg-blue-100 font-medium text-gray-700"
              >
                Cài đặt tài khoản
              </Link>

              <button
                onClick={handleLogout}
                className="w-full rounded-b-lg px-4 py-3 text-left font-medium text-rose-600 hover:bg-rose-100"
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-0 flex h-[calc(100vh-80px)] w-56 flex-col bg-white px-4 py-8 shadow-md">
          <nav className="flex-1 space-y-3 text-md">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-12 w-full items-center rounded-xl border px-4 py-3 text-left transition ${
                    isActive
                      ? "border-blue-200 bg-blue-100 font-semibold text-blue-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-800 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto p-6">
          {isWrongRoleScope && (
            <div className="mb-4 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
              Bạn đang ở layout `{scope}`, nhưng role hiện tại là{" "}
              {ROLE_LABELS[activeRole] || activeRole}. Hãy chuyển về đúng khu vực của mình:{" "}
              <Link className="font-semibold underline" href={`${roleBasePath}/posts`}>
                Đến {roleBasePath}
              </Link>
              .
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
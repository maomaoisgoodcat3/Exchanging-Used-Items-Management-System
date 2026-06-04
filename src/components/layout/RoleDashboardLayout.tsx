"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { MOCK_ROLE_LABELS } from "@/mocks/user.mocks";
import type { UserRole } from "@/types/user";

type RoleScope = "admin" | "user";

type RoleDashboardLayoutProps = {
  children: React.ReactNode;
  scope?: RoleScope;
};

const mockRoles: UserRole[] = ["STUDENT", "CLUB", "ADMIN"];

const getRoleBasePath = (role?: UserRole) => (role === "ADMIN" ? "/admin" : "/user");

export default function RoleDashboardLayout({
  children,
  scope,
}: RoleDashboardLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, mockRole, setMockRole, hydrateMockUser, logout } = useAuth();

  useEffect(() => {
    hydrateMockUser();
  }, [hydrateMockUser]);

  const activeRole = user?.role ?? mockRole;
  const roleBasePath = getRoleBasePath(activeRole);
  const expectedScope: RoleScope = activeRole === "ADMIN" ? "admin" : "user";
  const isWrongRoleScope = Boolean(scope && scope !== expectedScope);

  const navItems = useMemo(() => {
    if (activeRole === "ADMIN") {
      return [
        { href: `${roleBasePath}/posts`, label: "📝 Posts" },
        { href: `${roleBasePath}/campaigns`, label: "🔖 Campaigns" },
        { href: `${roleBasePath}/notifications`, label: "🛡️ Moderation" },
      ];
    }

    return [
      { href: `${roleBasePath}/posts`, label: "📝 Posts" },
      { href: `${roleBasePath}/my-posts`, label: "🗂️ My Posts" },
      { href: `${roleBasePath}/my-storage`, label: "🗄️ My Storage" },
      { href: `${roleBasePath}/campaigns`, label: "🔖 Campaigns" },
      { href: `${roleBasePath}/my-orders`, label: "🛍️ My orders" },
      { href: `${roleBasePath}/notifications`, label: "📮 Notifications" },
    ];
  }, [activeRole, roleBasePath]);

  const handleRoleChange = (role: UserRole) => {
    setMockRole(role);
    setIsOpen(false);
    router.push(`${getRoleBasePath(role)}/posts`);
  };

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
            {MOCK_ROLE_LABELS[activeRole]}
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-2"
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
                  Role hiện tại: {MOCK_ROLE_LABELS[activeRole]}
                </p>
                {user?.organization && (
                  <p className="mt-1 text-xs text-gray-500">
                    {user.organization.name}
                  </p>
                )}
              </div>

              <div className="border-b p-3">
                <p className="mb-2 text-xs font-semibold uppercase text-gray-500">
                  Chuyển role mock
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {mockRoles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleChange(role)}
                      className={`rounded-md px-2 py-1.5 text-xs font-semibold transition ${
                        activeRole === role
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
                Cài đặt tài khoản
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
        <aside className="sticky top-0 flex h-screen w-56 flex-col bg-white px-4 py-8 shadow-md">
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
              {MOCK_ROLE_LABELS[activeRole]}. Hãy chuyển role hoặc vào đúng khu{" "}
              <Link className="font-semibold underline" href={`${roleBasePath}/posts`}>
                {roleBasePath}
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

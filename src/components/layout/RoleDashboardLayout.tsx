"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/authStore"; 
import { User, LogOut, Settings, Package, Tag, ShoppingBag, Bell, LayoutDashboard, ChevronDown } from "lucide-react";

type RoleScope = "admin" | "user";

const ROLE_LABELS: Record<string, string> = {
  MEMBER: "Thành viên",
  ADMIN: "Quản trị viên",
};

const getRoleBasePath = (role: string) => (role === "ADMIN" ? "/admin" : "/user");

export default function RoleDashboardLayout({ children, scope }: { children: React.ReactNode; scope?: RoleScope }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // Kéo các hàm lưu trữ từ Store nguyên bản của bạn
  const { token, logout, hydrateAuth } = useAuthStore();
  const [liveUser, setLiveUser] = useState<any>(null);
  const [activeRole, setActiveRole] = useState<string>("MEMBER");
  
  // Kiểm soát luồng tải để chặn đứng việc nhảy trang bừa bãi khi reload
  const [isLoading, setIsLoading] = useState(true); 
  const [isHydrated, setIsHydrated] = useState(false);

  // Bước 1: Khôi phục Token từ localStorage ngay khi vừa ép tải lại trang
  useEffect(() => {
    hydrateAuth();
    setIsHydrated(true);
  }, [hydrateAuth]);

  // Bước 2: Đồng bộ thông tin quyền hạn thực tế sau khi đã nhận diện xong Token
  useEffect(() => {
    if (!isHydrated) return;

    // Đọc nhanh thông tin lưu trữ tạm thời từ bộ nhớ trình duyệt để set quyền đồng bộ ngay lập tức
    const storedUserStr = typeof window !== "undefined" ? window.localStorage.getItem("current_user") : null;
    if (storedUserStr) {
      try {
        const parsedUser = JSON.parse(storedUserStr);
        if (parsedUser?.role) {
          setActiveRole(String(parsedUser.role).toUpperCase().includes("ADMIN") ? "ADMIN" : "MEMBER");
        }
      } catch (e) {
        console.error("Lỗi đọc cấu trúc user:", e);
      }
    }

    // Nếu thực sự không tồn tại Token (Khách vãng lai chưa đăng nhập)
    if (!token) {
      setIsLoading(false);
      return;
    }
    
    // Nếu có Token, gọi API backend để chứng thực live data từ Database
    fetch("http://127.0.0.1:8000/api/v1/users/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (data) {
          setLiveUser(data);
          const userRole = String(data.role).toUpperCase();
          setActiveRole(userRole.includes("ADMIN") ? "ADMIN" : "MEMBER");
        }
      })
      .catch((err) => {
        console.error("Lỗi xác thực đồng bộ hệ thống:", err);
      })
      .finally(() => {
        setIsLoading(false); // Hoàn thành toàn bộ quy trình mới tắt màn hình chờ
      });
  }, [token, isHydrated]);

  const roleBasePath = getRoleBasePath(activeRole);
  const expectedScope: RoleScope = activeRole === "ADMIN" ? "admin" : "user";
  
  // Chỉ kích hoạt bộ lọc sai phân vùng khi đã nạp xong toàn bộ dữ liệu quyền thực tế
  const isWrongRoleScope = !isLoading && Boolean(scope && scope !== expectedScope);

  // Tự động chuyển hướng thông minh nếu cố tình đứng sai vị trí sau khi F5
  useEffect(() => {
    if (isWrongRoleScope) {
      router.replace(activeRole === "ADMIN" ? "/admin/dashboard" : "/user/posts");
    }
  }, [isWrongRoleScope, activeRole, router]);

  const navItems = useMemo(() => {
    if (activeRole === "ADMIN") {
      return [
        { href: `${roleBasePath}/dashboard`, label: "Bảng điều khiển", icon: <LayoutDashboard size={20} /> },
        { href: `${roleBasePath}/posts`, label: "Quản lý bài đăng", icon: <Package size={20} /> },
        { href: `${roleBasePath}/campaigns`, label: "Quản lý chiến dịch", icon: <Tag size={20} /> },
      ];
    }
    return [
      { href: `${roleBasePath}/posts`, label: "Chợ chung", icon: <LayoutDashboard size={20} /> },
      { href: `${roleBasePath}/my-posts`, label: "Bài đăng của tôi", icon: <Package size={20} /> },
      { href: `${roleBasePath}/my-storage`, label: "Kho đồ cá nhân", icon: <Package size={20} /> }, 
      { href: `${roleBasePath}/campaigns`, label: "Chiến dịch", icon: <Tag size={20} /> },
      { href: `${roleBasePath}/my-orders`, label: "Đơn hàng", icon: <ShoppingBag size={20} /> },
      { href: `${roleBasePath}/notifications`, label: "Thông báo", icon: <Bell size={20} /> },
    ];
  }, [activeRole, roleBasePath]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // MÀN HÌNH CHỜ ĐỒNG BỘ: Giữ chân người dùng tại đúng URL hiện tại, không cho render lỗi
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f8f9fa]">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-sm font-medium text-gray-500">Đang đồng bộ không gian làm việc...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <header className="flex h-16 items-center justify-between bg-white px-6 shadow-sm border-b">
        <div className="text-xl font-bold text-blue-600">UET Market</div>

        <div className="relative">
          {!token ? (
            <Link 
              href="/login" 
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 transition shadow-sm"
            >
              <User size={16} /> Đăng nhập
            </Link>
          ) : (
            <>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <User size={18} />
                <span>{liveUser?.name ?? liveUser?.email ?? "Người dùng"}</span>
                <ChevronDown size={16} />
              </button>

              {isOpen && (
                <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl bg-white shadow-lg border border-gray-100">
                  <div className="border-b border-gray-100 p-4 bg-gray-50 rounded-t-xl">
                    <p className="font-bold text-gray-900">{liveUser?.name ?? "Người dùng"}</p>
                    <p className="text-xs text-gray-500 truncate">{liveUser?.email}</p>
                    <span className={`mt-2 inline-block rounded px-2 py-1 text-[10px] font-bold uppercase ${
                      activeRole === "ADMIN" ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {ROLE_LABELS[activeRole]}
                    </span>
                  </div>
                  <div className="p-2">
                    <Link href={`${roleBasePath}/profile`} onClick={() => setIsOpen(false)} className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                      <Settings size={16} /> Cài đặt tài khoản
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 mt-1">
                      <LogOut size={16} /> Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        <aside className="w-64 bg-white border-r overflow-y-auto py-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 border-l-4 px-6 py-3 text-sm transition-all ${
                    isActive ? "border-blue-600 bg-blue-50 font-bold text-blue-700" : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
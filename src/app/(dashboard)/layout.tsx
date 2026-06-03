"use client"; // BẮT BUỘC phải mở ra vì có sử dụng onClick và hook

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Đưa hàm handleLogout vào bên trong Component
  const handleLogout = () => {
    localStorage.removeItem("token");
    // Sử dụng router.push thay vì window.location.href để chuyển trang mượt hơn, không bị chớp trắng màn hình
    router.push("/login"); 
  };

return (
  <div className="min-h-screen bg-blue-100">

    {/* Header */}
    <header className="bg-gray-100 shadow-md px-6 py-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold text-blue-800">
        Nền tảng trao đổi đồ cũ UET
      </h1>

    <div className="relative">
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="flex items-center gap-2 bg-blue-100 px-3 py-2 rounded-lg"
    >
      👤 Nguyễn Văn A
      <span>▼</span>
    </button>

    {isOpen && (
      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-50">
        <div className="p-4 border-b">
          <p className="font-medium">Nguyễn Văn A</p>
          <p className="text-sm text-gray-500">
            user@gmail.com
          </p>
        </div>

        <button className="w-full text-left px-4 py-3 hover:bg-blue-100">
          Cài đặt tài khoản
        </button>

        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-3 hover:bg-blue-100"
        >
          Đăng xuất
        </button>
      </div>
    )}
  </div>
    </header>

    {/* Body */}
    <div className="flex">

      {/* Sidebar */}
      <aside className="sticky top-0 w-48 bg-white px-6 py-10 shadow-md flex flex-col h-screen">
        <nav className="space-y-3 text-md flex-1">
          <Link href="/posts" className="block hover:text-blue-600 transition">
            📝 Posts
          </Link>
          <Link href="/my-posts" className="block hover:text-blue-600 transition">
            🗂️ My Posts
          </Link>
          <Link href="/my-storage" className="block hover:text-blue-600 transition">
            🗳️ My Storage
          </Link>
          <Link href="/campaigns" className="block hover:text-blue-600 transition">
            🔖 Campaigns
          </Link>
          
          <Link href="/my-orders" className="block hover:text-blue-600 transition">
            🛍️ My orders
          </Link>
          <Link href="/notifications" className="block hover:text-blue-600 transition">
            📮 Notifications
          </Link>
        </nav>
        
      </aside>

      {/* Content */}
      <main className="p-6 flex-1 overflow-y-auto">
        {children}
      </main>

    </div>
  </div>
)};
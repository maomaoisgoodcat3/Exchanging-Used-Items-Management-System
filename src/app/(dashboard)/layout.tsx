//"use client";

import Link from "next/link";
/*import { useRouter } from "next/navigation";

const router = useRouter();
const handleLogout = () => {
  router.push("/login");
};*/

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}
      <aside className="w-48 bg-white shadow-md p-4 flex flex-col h-screen">
        <h2 className="text-l font-bold text-blue-600 mb-6">
          Dashboard
        </h2>

        <nav className="space-y-3 text-m">
          <Link href="/posts" className="block hover:text-blue-600">
            Posts
          </Link>

          <Link href="/campaigns" className="block hover:text-blue-600">
            Campaigns
          </Link>

          <Link href="/my-posts" className="block hover:text-blue-600">
            My Posts
          </Link>

          <Link href="/transactions" className="block hover:text-blue-600">
            Transactions
          </Link>

          <Link href="/notifications" className="block hover:text-blue-600">
            Notifications
          </Link>
        </nav>

          {/* LOGOUT FIXED BOTTOM */}
          <div className="mt-auto">
            <Link
              href="/login"
              className="block w-full text-center bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
            >
            Đăng xuất
            </Link>
          </div>

      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col">

        {/* Header */}
        <header className="bg-white shadow px-6 py-4 flex justify-between">
          <h1 className="text-xl font-semibold">Nền tảng trao đổi đồ cũ Trường X</h1>

          <div className="text-sm text-gray-600">
            User: Guest
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {children}
        </main>

      </div>
    </div>
  );
}
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          
          <h2 className="mt-2 text-xl font-semibold text-blue-900">
            Đổi mật khẩu
          </h2>

        </div>

        <form className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              placeholder="Nhập email"
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Mật khẩu mới
            </label>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Nhập lại mật khẩu mới
            </label>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-3 text-white hover:bg-blue-700"
          >
            Lưu mật khẩu
          </button>

          <Link
          href="/login"
          className="mb-2 block text-sm text-blue-500 hover:underline"
          >
          ← Back
        </Link>
        
        </form>

        
      </div>
    </div>
  );
}
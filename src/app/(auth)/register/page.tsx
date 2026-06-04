import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-100">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">

          <p className="mt-2 text-xl font-semibold text-gray-800">
            Đăng ký để tiếp tục sử dụng hệ thống
          </p>
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
              Họ và tên
            </label>
            <input
              type="email"
              placeholder="Nhập họ tên"
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Số điện thoại
            </label>
            <input
              type="email"
              placeholder="Nhập số điện thoại"
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Mật khẩu
            </label>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Nhập lại mật khẩu
            </label>
            <input
              type="password"
              placeholder="Nhập lại mật khẩu"
              className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-3 text-white hover:bg-blue-700"
          >
            Đăng ký
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
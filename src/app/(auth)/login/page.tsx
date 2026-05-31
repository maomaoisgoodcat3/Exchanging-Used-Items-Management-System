export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
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
              Mật khẩu
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
            Đăng nhập
          </button>
        
        <div className="mt-4 flex justify-between text-sm">
            <a href="/forgot-password" className="text-blue-600 hover:underline">
            Quên mật khẩu?
            </a>

            <a href="/register" className="text-blue-600 hover:underline">
            Đăng ký
            </a>
        </div>

        </form>
      </div>
    </div>
  );
}
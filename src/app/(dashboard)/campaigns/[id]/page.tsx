"use client";

import { useRouter } from "next/navigation";

interface CampaignDetailPageProps {
  params: {
    id: string;
  };
}

const samplePosts = [
  { title: "Bài đăng 1", description: "Sản phẩm 1 tương thích chiến dịch.", status: "Mở" },
  { title: "Bài đăng 2", description: "Sản phẩm 2 còn mới, phù hợp quảng bá.", status: "Mở" },
  { title: "Bài đăng 3", description: "Bài đăng 3 đang chờ duyệt.", status: "Đã đóng" },
];

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const router = useRouter();

  return (
    <div className="space-y-6 rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Campaign ID: {params.id}</p>
          <h1 className="text-2xl font-semibold text-slate-900">Chi tiết chiến dịch</h1>
        </div>
        <button
          type="button"
          onClick={() => router.push("/campaigns")}
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Quay về Campaigns
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-3xl bg-slate-50 p-6">
          <img
            src="https://images.unsplash.com/photo-1496200186974-4293800e2c20?auto=format&fit=crop&w=900&q=80"
            alt="Campaign illustration"
            className="h-72 w-full rounded-3xl object-cover"
          />

          <div className="space-y-3">
            <p className="text-sm text-slate-500">Tên tổ chức</p>
            <h2 className="text-xl font-semibold text-slate-900">CLB Xanh UET</h2>
            <p className="text-sm leading-7 text-slate-600">
              Đây là trang chi tiết chiến dịch. Tại đây bạn có thể xem các thông tin chính của campaign và điều hướng đến các bài đăng liên quan.
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="space-y-2">
            <p className="text-sm text-slate-500">Ngày đăng bài</p>
            <p className="text-base font-semibold text-slate-900">12/05/2026</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-slate-500">Email leader</p>
            <p className="text-base font-semibold text-slate-900">lanh.leader@uet.edu.vn</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-slate-500">Số điện thoại leader</p>
            <p className="text-base font-semibold text-slate-900">0987 654 321</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-slate-500">Mô tả campaign</p>
            <p className="text-base leading-7 text-slate-700">
              Chiến dịch kêu gọi sinh viên hạn chế sử dụng đồ nhựa dùng một lần và tái chế đúng cách.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-slate-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Các bài đăng thuộc campaign</h2>
        <div className="mt-5 space-y-3">
          {samplePosts.map((post) => (
            <div key={post.title} className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{post.title}</p>
                  <p className="text-sm text-slate-500">{post.description}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {post.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

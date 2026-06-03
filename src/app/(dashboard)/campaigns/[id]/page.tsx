"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import CreatePostModal from "@/components/features/post/CreatePostModal";
import { useAuth } from "@/hooks/useAuth";

const campaignInfo = {
  organisationName: "CLB Xanh UET",
  createdAt: "12/05/2026",
  leaderEmail: "lanh.leader@uet.edu.vn",
  leaderPhone: "0987 654 321",
  description:
    "Chiến dịch kêu gọi sinh viên hạn chế sử dụng đồ nhựa dùng một lần và tái chế đúng cách.",
  image:
    "https://images.unsplash.com/photo-1496200186974-4293800e2c20?auto=format&fit=crop&w=900&q=80",
};

const samplePosts = [
  { title: "Bài đăng 1", description: "Sản phẩm 1 tương thích chiến dịch.", status: "Mở" },
  { title: "Bài đăng 2", description: "Sản phẩm 2 còn mới, phù hợp quảng bá.", status: "Mở" },
  { title: "Bài đăng 3", description: "Bài đăng 3 đang chờ duyệt.", status: "Đã đóng" },
];

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { user } = useAuth();
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [campaignPosts, setCampaignPosts] = useState(samplePosts);

  const canCreateCampaignPost = Boolean(user && user.role !== "ADMIN");

  return (
    <>
      <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Campaign ID: {id}</p>
            <h1 className="text-2xl font-semibold text-slate-900">Chi tiết chiến dịch</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            {canCreateCampaignPost && (
              <button
                className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-600"
                onClick={() => setIsCreatingPost(true)}
                type="button"
              >
                + Tham gia campaign
              </button>
            )}
            <button
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              onClick={() => router.push("/campaigns")}
              type="button"
            >
              Quay về Campaigns
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4 rounded-3xl bg-slate-50 p-6">
            <img
              alt="Campaign illustration"
              className="h-72 w-full rounded-3xl object-cover"
              src={campaignInfo.image}
            />

            <div className="space-y-3">
              <p className="text-sm text-slate-500">Tên tổ chức</p>
              <h2 className="text-xl font-semibold text-slate-900">
                {campaignInfo.organisationName}
              </h2>
              <p className="text-sm leading-7 text-slate-600">
                Đây là trang chi tiết chiến dịch. Tại đây bạn có thể xem các thông tin chính của
                campaign và điều hướng đến các bài đăng liên quan.
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Ngày đăng bài</p>
              <p className="text-base font-semibold text-slate-900">{campaignInfo.createdAt}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Email leader</p>
              <p className="text-base font-semibold text-slate-900">{campaignInfo.leaderEmail}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Số điện thoại leader</p>
              <p className="text-base font-semibold text-slate-900">{campaignInfo.leaderPhone}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Mô tả campaign</p>
              <p className="text-base leading-7 text-slate-700">{campaignInfo.description}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-slate-50 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Các bài đăng thuộc campaign
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                User có thể tạo bài viết mới và hệ thống sẽ tự điền Campaign ID.
              </p>
            </div>
            {canCreateCampaignPost && (
              <button
                className="inline-flex items-center justify-center rounded-full bg-cyan-100 px-5 py-2.5 text-sm font-bold text-cyan-800 transition hover:bg-cyan-200"
                onClick={() => setIsCreatingPost(true)}
                type="button"
              >
                + Tạo bài viết
              </button>
            )}
          </div>

          <div className="mt-5 space-y-3">
            {campaignPosts.map((post) => (
              <div className="rounded-3xl border border-slate-200 bg-white p-4" key={post.title}>
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

      <CreatePostModal
        campaignId={id}
        campaignName={campaignInfo.organisationName}
        isOpen={isCreatingPost}
        onClose={() => setIsCreatingPost(false)}
        onPostCreated={(post) =>
          setCampaignPosts((currentPosts) => [
            {
              description: post.description || "Bài viết vừa tạo đang chờ duyệt.",
              status: "Chờ duyệt",
              title: post.title,
            },
            ...currentPosts,
          ])
        }
      />
    </>
  );
}

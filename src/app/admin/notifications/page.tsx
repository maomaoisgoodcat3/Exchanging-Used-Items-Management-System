"use client";

import { useMemo, useState } from "react";

type ModerationStatus = "PENDING" | "APPROVED" | "REJECTED";

type ModerationPost = {
  id: string;
  title: string;
  author: string;
  email: string;
  category: string;
  categoryStyle: string;
  submittedAt: string;
  status: ModerationStatus;
  image: string;
};

const statusLabels: Record<ModerationStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

const statusStyles: Record<ModerationStatus, string> = {
  PENDING: "bg-orange-100 text-orange-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

const initialPosts: ModerationPost[] = [
  {
    id: "#P000125",
    title: "Bán xe đạp địa hình Giant ATX 660",
    author: "Nguyễn Minh Đức",
    email: "@minhduc98",
    category: "Đồ thể thao",
    categoryStyle: "bg-blue-100 text-blue-700",
    submittedAt: "06/04/2026 14:25",
    status: "PENDING",
    image: "linear-gradient(135deg, #d9f99d, #a3e635)",
  },
  {
    id: "#P000124",
    title: "Laptop Dell Inspiron 15 5515",
    author: "Phạm Quang Huy",
    email: "@quanghuy24",
    category: "Đồ điện tử",
    categoryStyle: "bg-purple-100 text-purple-700",
    submittedAt: "06/04/2026 14:18",
    status: "PENDING",
    image: "linear-gradient(135deg, #bae6fd, #64748b)",
  },
  {
    id: "#P000123",
    title: "Sách giáo trình Toán rời rạc",
    author: "Trần Thảo Vy",
    email: "@thaovy",
    category: "Sách vở",
    categoryStyle: "bg-emerald-100 text-emerald-700",
    submittedAt: "06/04/2026 14:05",
    status: "PENDING",
    image: "linear-gradient(135deg, #fed7aa, #f59e0b)",
  },
  {
    id: "#P000122",
    title: "Ghế xoay văn phòng IKEA",
    author: "Lê Hoàng Nam",
    email: "@nam.le",
    category: "Nội thất",
    categoryStyle: "bg-orange-100 text-orange-700",
    submittedAt: "06/04/2026 13:58",
    status: "PENDING",
    image: "linear-gradient(135deg, #d6d3d1, #78716c)",
  },
  {
    id: "#P000121",
    title: "Mũ bảo hiểm AGV K1",
    author: "Vũ Quốc Anh",
    email: "@qa.anh",
    category: "Đồ dùng khác",
    categoryStyle: "bg-slate-100 text-slate-700",
    submittedAt: "06/04/2026 13:45",
    status: "PENDING",
    image: "linear-gradient(135deg, #e2e8f0, #475569)",
  },
  {
    id: "#P000120",
    title: "Máy tính Casio fx-580VN X",
    author: "Đặng Hồng Sơn",
    email: "@hongson",
    category: "Đồ học tập",
    categoryStyle: "bg-cyan-100 text-cyan-700",
    submittedAt: "06/04/2026 13:34",
    status: "APPROVED",
    image: "linear-gradient(135deg, #dbeafe, #60a5fa)",
  },
];

export default function AdminNotificationsPage() {
  const [posts, setPosts] = useState(initialPosts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ModerationStatus | "ALL">("PENDING");

  const stats = useMemo(
    () => ({
      approved: posts.filter((post) => post.status === "APPROVED").length + 141,
      pending: posts.filter((post) => post.status === "PENDING").length + 13,
      rejected: posts.filter((post) => post.status === "REJECTED").length + 6,
    }),
    [posts],
  );

  const filteredPosts = useMemo(() => {
    const normalizedSearch = search.toLowerCase();

    return posts.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(normalizedSearch) ||
        post.author.toLowerCase().includes(normalizedSearch) ||
        post.id.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "ALL" || post.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [posts, search, statusFilter]);

  const updateStatus = (postId: string, status: ModerationStatus) => {
    setPosts((currentPosts) =>
      currentPosts.map((post) => (post.id === postId ? { ...post, status } : post)),
    );
  };

  const latestApproved = "06/04/2026 14:28 bởi Admin UET";
  const latestRejected = "06/04/2026 13:55 bởi Admin UET";

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Admin layout</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Moderation</h1>
        <p className="mt-1 text-sm text-slate-500">
          Khu vực duyệt và quản lý thông báo, bài đăng do người dùng gửi.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-400 text-xl text-white">
                ⏱
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Bài chờ duyệt</p>
                <p className="text-3xl font-bold text-slate-900">{stats.pending}</p>
                <p className="text-xs text-slate-500">Cần duyệt trong 24h</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-400 text-xl text-white">
                ✕
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Bài bị từ chối</p>
                <p className="text-3xl font-bold text-slate-900">{stats.rejected}</p>
                <p className="text-xs text-slate-500">Tổng số bài bị từ chối</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-xl text-white">
                ✓
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Bài đã duyệt</p>
                <p className="text-3xl font-bold text-slate-900">{stats.approved}</p>
                <p className="text-xs text-slate-500">Tổng số bài đã duyệt</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600 md:grid-cols-2">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              ✓
            </span>
            Duyệt gần nhất: {latestApproved}
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-700">
              ✕
            </span>
            Từ chối gần nhất: {latestRejected}
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-bold text-slate-900">📋 Danh sách bài chờ duyệt</h2>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <input
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm outline-none transition focus:border-blue-500 sm:w-80"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm kiếm tiêu đề, người đăng..."
                value={search}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>
            </div>

            <select
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500"
              onChange={(event) => setStatusFilter(event.target.value as ModerationStatus | "ALL")}
              value={statusFilter}
            >
              <option value="PENDING">Chờ duyệt</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="REJECTED">Từ chối</option>
              <option value="ALL">Tất cả</option>
            </select>

            <button
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              onClick={() => {
                setSearch("");
                setStatusFilter("PENDING");
              }}
              type="button"
            >
              ↻
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="hidden grid-cols-[110px_1.6fr_1.2fr_0.9fr_1fr_0.9fr_1.4fr] bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500 lg:grid">
            <span>Mã bài</span>
            <span>Tiêu đề bài đăng</span>
            <span>Người đăng</span>
            <span>Loại bài</span>
            <span>Thời gian gửi</span>
            <span>Trạng thái</span>
            <span className="text-center">Hành động</span>
          </div>

          <div className="divide-y divide-slate-200">
            {filteredPosts.map((post) => (
              <article
                className="grid gap-4 px-4 py-3 text-sm lg:grid-cols-[110px_1.6fr_1.2fr_0.9fr_1fr_0.9fr_1.4fr] lg:items-center"
                key={post.id}
              >
                <span className="font-semibold text-slate-600">{post.id}</span>

                <div className="flex min-w-0 items-center gap-3">
                  <div
                    aria-label={post.title}
                    className="h-12 w-14 shrink-0 rounded-md bg-cover bg-center"
                    role="img"
                    style={{ backgroundImage: post.image }}
                  />
                  <p className="truncate font-medium text-slate-800">{post.title}</p>
                </div>

                <div>
                  <p className="font-semibold text-slate-700">{post.author}</p>
                  <p className="text-xs text-slate-500">{post.email}</p>
                </div>

                <span
                  className={`w-fit rounded-md px-2.5 py-1 text-xs font-semibold ${post.categoryStyle}`}
                >
                  {post.category}
                </span>

                <div>
                  <p className="text-slate-700">{post.submittedAt}</p>
                  <p className="text-xs text-slate-500">5 phút trước</p>
                </div>

                <span
                  className={`w-fit rounded-md px-2.5 py-1 text-xs font-semibold ${
                    statusStyles[post.status]
                  }`}
                >
                  {statusLabels[post.status]}
                </span>

                <div className="flex flex-wrap justify-start gap-2 lg:justify-center">
                  <button
                    className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                    type="button"
                  >
                    👁 Xem chi tiết
                  </button>
                  <button
                    className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={post.status === "APPROVED"}
                    onClick={() => updateStatus(post.id, "APPROVED")}
                    type="button"
                  >
                    ✓ Duyệt
                  </button>
                  <button
                    className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={post.status === "REJECTED"}
                    onClick={() => updateStatus(post.id, "REJECTED")}
                    type="button"
                  >
                    ✕ Từ chối
                  </button>
                </div>
              </article>
            ))}

            {filteredPosts.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                Không có bài đăng phù hợp với bộ lọc hiện tại.
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div>
            Hiển thị <span className="font-semibold text-slate-700">{filteredPosts.length}</span>{" "}
            bài theo bộ lọc
          </div>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((page) => (
              <button
                className={`h-9 w-9 rounded-lg border text-sm font-semibold ${
                  page === 1
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
                key={page}
                type="button"
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

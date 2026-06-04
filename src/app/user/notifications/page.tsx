"use client";

import { useMemo } from "react";

import { useAuth } from "@/hooks/useAuth";

type NotificationStatus = "APPROVED" | "REJECTED" | "PENDING";

type UserNotification = {
  id: string;
  title: string;
  type: "Bài đăng" | "Chiến dịch";
  status: NotificationStatus;
  timestamp: string;
  reason?: string;
  icon: string;
  iconStyle: string;
};

const statusLabels: Record<NotificationStatus, string> = {
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  PENDING: "Đang chờ",
};

const statusStyles: Record<NotificationStatus, string> = {
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  PENDING: "bg-blue-100 text-blue-700",
};

const notifications: UserNotification[] = [
  {
    id: "N-001",
    title: "Sách giáo khoa cũ lớp 12",
    type: "Bài đăng",
    status: "APPROVED",
    timestamp: "Thời gian duyệt: 04/06/2026 - 09:30",
    icon: "📖",
    iconStyle: "bg-emerald-50 text-emerald-600 ring-emerald-200",
  },
  {
    id: "N-002",
    title: "Ghế xoay văn phòng",
    type: "Bài đăng",
    status: "REJECTED",
    timestamp: "Thời gian từ chối: 03/06/2026 - 14:10",
    reason: "Hình ảnh chưa rõ",
    icon: "🪑",
    iconStyle: "bg-red-50 text-red-500 ring-red-200",
  },
  {
    id: "N-003",
    title: "Laptop Dell Inspiron 15",
    type: "Bài đăng",
    status: "APPROVED",
    timestamp: "Thời gian duyệt: 02/06/2026 - 16:25",
    icon: "💻",
    iconStyle: "bg-emerald-50 text-emerald-600 ring-emerald-200",
  },
  {
    id: "N-004",
    title: "Áo khoác mùa đông",
    type: "Bài đăng",
    status: "REJECTED",
    timestamp: "Thời gian từ chối: 01/06/2026 - 11:05",
    reason: "Nội dung không phù hợp với quy định",
    icon: "👕",
    iconStyle: "bg-red-50 text-red-500 ring-red-200",
  },
  {
    id: "N-005",
    title: "Gây quỹ mùa đông",
    type: "Chiến dịch",
    status: "APPROVED",
    timestamp: "Thời gian duyệt: 31/05/2026 - 10:15",
    icon: "📣",
    iconStyle: "bg-emerald-50 text-emerald-600 ring-emerald-200",
  },
  {
    id: "N-006",
    title: "Bộ truyện tranh cũ",
    type: "Bài đăng",
    status: "PENDING",
    timestamp: "Thời gian gửi: 06/06/2026 - 08:45",
    icon: "🗃️",
    iconStyle: "bg-blue-50 text-blue-600 ring-blue-200",
  },
];

export default function UserNotificationsPage() {
  const { user } = useAuth();

  const stats = useMemo(
    () => ({
      approved: notifications.filter((notification) => notification.status === "APPROVED").length + 8,
      pending: notifications.filter((notification) => notification.status === "PENDING").length + 3,
      rejected: notifications.filter((notification) => notification.status === "REJECTED").length + 1,
    }),
    [],
  );

  const ownerLabel =
    user?.role === "CLUB"
      ? user.organization?.name ?? "tổ chức của bạn"
      : user?.fullName ?? "tài khoản của bạn";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section>
        <p className="text-sm font-medium text-slate-500">UET Marketplace</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Thông báo</h1>
        <p className="mt-2 text-sm text-slate-600">
          Theo dõi kết quả duyệt hoặc từ chối các bài đăng và chiến dịch của {ownerLabel} trên nền
          tảng.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-3xl text-emerald-600 ring-1 ring-emerald-100">
              ✓
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-600">Đã duyệt</p>
              <p className="text-3xl font-bold text-emerald-600">{stats.approved}</p>
              <p className="text-xs text-slate-500">Tổng số nội dung</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-3xl text-red-500 ring-1 ring-red-100">
              ×
            </div>
            <div>
              <p className="text-sm font-bold text-red-500">Bị từ chối</p>
              <p className="text-3xl font-bold text-red-500">{stats.rejected}</p>
              <p className="text-xs text-slate-500">Tổng số nội dung</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl text-blue-600 ring-1 ring-blue-100">
              ◷
            </div>
            <div>
              <p className="text-sm font-bold text-blue-600">Đang chờ</p>
              <p className="text-3xl font-bold text-blue-600">{stats.pending}</p>
              <p className="text-xs text-slate-500">Tổng số nội dung</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Danh sách thông báo</h2>

        <div className="mt-4 divide-y divide-slate-200">
          {notifications.map((notification) => (
            <article
              className="grid gap-4 py-4 md:grid-cols-[auto_1.4fr_auto_1.2fr_auto] md:items-center"
              key={notification.id}
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full text-xl ring-1 ${notification.iconStyle}`}
              >
                {notification.icon}
              </div>

              <div>
                <p className="font-semibold text-slate-900">
                  {notification.type}: {notification.title}
                </p>
                {notification.reason && (
                  <p className="mt-1 text-xs font-semibold italic text-red-500">
                    Lý do: {notification.reason}
                  </p>
                )}
              </div>

              <span
                className={`w-fit rounded-md px-3 py-1 text-xs font-bold ${
                  statusStyles[notification.status]
                }`}
              >
                {statusLabels[notification.status]}
              </span>

              <p className="text-sm text-slate-500">{notification.timestamp}</p>

              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-100 bg-white px-4 py-2 text-sm font-bold text-blue-600 transition hover:bg-blue-50"
                type="button"
              >
                Xem chi tiết <span>›</span>
              </button>
            </article>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-blue-200 text-blue-600">
            i
          </span>
          Thông báo được lưu trong 90 ngày. Bạn có thể xem lại chi tiết để biết thêm thông tin.
        </div>
      </section>
    </div>
  );
}

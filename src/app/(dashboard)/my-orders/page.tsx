"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../../../hooks/useAuth";
import { getOrders, saveOrders } from "../../../services/orderServices";
import type { Order, OrderStatus } from "../../../types/order";

const statusLabels: Record<OrderStatus, string> = {
  PROCESSING: "Đang xử lý",
  DELIVERING: "Đang giao",
  RECEIVED: "Đã nhận",
  CANCELLED: "Đã hủy",
};

const statusStyles: Record<OrderStatus, string> = {
  PROCESSING: "bg-yellow-100 text-yellow-800",
  DELIVERING: "bg-sky-100 text-sky-800",
  RECEIVED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-700",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(value);

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState("Layout");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);

      try {
        const data = await getOrders();
        setOrders(data);
      } catch (error) {
        console.error("Lỗi khi tải đơn hàng", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const myOrders = useMemo(() => {
    const normalizedSearch = search.toLowerCase();

    return orders.filter((order) => {
      const isOwner = user ? order.buyerId === user.id : false;
      const matchesSearch =
        order.title.toLowerCase().includes(normalizedSearch) ||
        order.sellerName.toLowerCase().includes(normalizedSearch) ||
        order.id.toLowerCase().includes(normalizedSearch) ||
        statusLabels[order.status].toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;

      return isOwner && matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter, user]);

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((currentOrders) => {
      const updatedOrders = currentOrders.map((order) =>
        order.id === orderId ? { ...order, status } : order,
      );

      saveOrders(updatedOrders);

      return updatedOrders;
    });
  };

  const trackedCount = user ? orders.filter((order) => order.buyerId === user.id).length : 0;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-500">UET Marketplace</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">My Orders</h1>
            <p className="mt-1 text-sm text-slate-500">
              Chỉ hiển thị đơn hàng của {user?.fullName ?? "tài khoản hiện tại"}.
            </p>
          </div>

          <button
            className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-500"
            onClick={() => alert(`Bạn đang theo dõi ${trackedCount} đơn hàng.`)}
            type="button"
          >
            + Theo dõi đơn hàng
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[auto_1fr] md:items-center">

          <select
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:bg-white"
            onChange={(event) => setStatusFilter(event.target.value as OrderStatus | "ALL")}
            value={statusFilter}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PROCESSING">Đang xử lý</option>
            <option value="DELIVERING">Đang giao</option>
            <option value="RECEIVED">Đã nhận</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>

          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>
            <input
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nhập từ khóa để tìm kiếm..."
              value={search}
            />
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-3xl bg-white p-12 text-center text-slate-500">
          Đang tải đơn hàng của bạn...
        </div>
      ) : (
        <section className="grid gap-5 xl:grid-cols-2">
          {myOrders.map((order, index) => (
            <article
              className="rounded-[26px] bg-white p-4 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md"
              key={order.id}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-bold text-slate-900">Đơn hàng {index + 1}</h2>
                <span
                  className={`rounded-full px-4 py-1 text-xs font-semibold ${
                    statusStyles[order.status]
                  }`}
                >
                  {statusLabels[order.status]}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-[96px_1fr]">
                <div
                  aria-label={order.title}
                  className="h-24 w-24 rounded-sm border border-slate-200 bg-cover bg-center shadow-inner"
                  role="img"
                  style={{ backgroundImage: order.image }}
                />

                <div className="min-w-0 space-y-3">
                  <div>
                    <p className="font-semibold text-slate-900">{order.title}</p>
                    <p className="mt-1 text-sm text-slate-600">Người bán: {order.sellerName}</p>
                  </div>

                  <div className="grid grid-cols-3 divide-x divide-slate-200 rounded-2xl bg-slate-50 py-3 text-center text-sm">
                    <div>
                      <p className="text-slate-500">Số lượng</p>
                      <p className="font-semibold text-slate-900">{order.quantity}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Tổng tiền</p>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(order.total)}đ
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Thanh toán</p>
                      <p className="font-semibold text-slate-900">{order.paymentMethod}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-3 text-sm text-slate-600">
                <span>🗓 Đặt ngày: {order.orderedAt}</span>
                <span className="hidden h-4 w-px bg-slate-300 sm:inline-block" />
                <span>Mã đơn: {order.id}</span>
              </div>

              <div className="mt-4 flex flex-wrap justify-end gap-3">
                <button
                  className="rounded-full bg-blue-100 px-6 py-2 text-sm font-medium text-slate-700 transition hover:bg-blue-200"
                  type="button"
                >
                  Chi tiết
                </button>
                <button
                  className="rounded-full bg-blue-100 px-6 py-2 text-sm font-medium text-slate-700 transition hover:bg-blue-200"
                  type="button"
                >
                  Liên hệ
                </button>
                {order.status === "PROCESSING" && (
                  <button
                    className="rounded-full bg-red-400 px-6 py-2 text-sm font-medium text-white transition hover:bg-red-500"
                    onClick={() => updateOrderStatus(order.id, "CANCELLED")}
                    type="button"
                  >
                    Hủy đơn
                  </button>
                )}
                {order.status === "DELIVERING" && (
                  <button
                    className="rounded-full bg-emerald-300 px-6 py-2 text-sm font-medium text-slate-800 transition hover:bg-emerald-400"
                    onClick={() => updateOrderStatus(order.id, "RECEIVED")}
                    type="button"
                  >
                    Xác nhận đã nhận
                  </button>
                )}
              </div>
            </article>
          ))}

          {myOrders.length === 0 && (
            <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
              Tài khoản này chưa có đơn hàng nào.
            </div>
          )}
        </section>
      )}
    </div>
  );
}

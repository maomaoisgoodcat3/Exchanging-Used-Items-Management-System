"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getOrders } from "@/services/orderServices";
import type { Order, OrderStatus } from "@/types/order";

const statusLabels: Record<OrderStatus, string> = {
  PROCESSING: "Đang xử lý",
  DELIVERING: "Đang giao",
  RECEIVED: "Đã nhận",
  CANCELLED: "Đã hủy",
};

const statusStyles: Record<OrderStatus, string> = {
  PROCESSING: "bg-yellow-100 text-yellow-800",
  DELIVERING: "bg-blue-100 text-blue-800",
  RECEIVED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-700",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState("Layout");
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

      return isOwner && matchesSearch;
    });
  }, [orders, search, user]);

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId ? { ...order, status } : order
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-500">UET Marketplace</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              My Orders
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Chỉ hiển thị đơn hàng của {user?.fullName ?? "tài khoản hiện tại"}.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-cyan-500"
          >
            + Theo dõi đơn hàng
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Bố cục", value: "Layout" },
              { label: "Bộ lọc", value: "Filter" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setActiveView(item.value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeView === item.value
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nhập từ khóa để tìm kiếm..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-3xl bg-white p-12 text-center text-slate-500">
          Đang tải đơn hàng của bạn...
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {myOrders.map((order, index) => (
            <article
              key={order.id}
              className="rounded-[26px] bg-white p-4 shadow-sm ring-1 ring-slate-100"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-semibold text-slate-900">
                  Đơn hàng {index + 1}
                </h2>
                <span
                  className={`rounded-full px-4 py-1 text-xs font-medium ${
                    statusStyles[order.status]
                  }`}
                >
                  {statusLabels[order.status]}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-[96px_1fr]">
                <div
                  className="h-24 w-24 rounded-sm border border-slate-200 bg-cover bg-center"
                  style={{ backgroundImage: order.image }}
                />

                <div className="min-w-0 space-y-3">
                  <div>
                    <p className="font-medium text-slate-900">{order.title}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Người bán: {order.sellerName}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 divide-x divide-slate-200 rounded-2xl bg-slate-50 py-3 text-center text-sm">
                    <div>
                      <p className="text-slate-500">Số lượng</p>
                      <p className="font-semibold text-slate-900">
                        {order.quantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Tổng tiền</p>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Thanh toán</p>
                      <p className="font-semibold text-slate-900">
                        {order.paymentMethod}
                      </p>
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
                  type="button"
                  className="rounded-full bg-blue-100 px-6 py-2 text-sm font-medium text-slate-700 transition hover:bg-blue-200"
                >
                  Chi tiết
                </button>
                <button
                  type="button"
                  className="rounded-full bg-blue-100 px-6 py-2 text-sm font-medium text-slate-700 transition hover:bg-blue-200"
                >
                  Liên hệ
                </button>
                {order.status === "PROCESSING" && (
                  <button
                    type="button"
                    onClick={() => updateOrderStatus(order.id, "CANCELLED")}
                    className="rounded-full bg-red-400 px-6 py-2 text-sm font-medium text-white transition hover:bg-red-500"
                  >
                    Hủy đơn
                  </button>
                )}
                {order.status === "DELIVERING" && (
                  <button
                    type="button"
                    onClick={() => updateOrderStatus(order.id, "RECEIVED")}
                    className="rounded-full bg-emerald-300 px-6 py-2 text-sm font-medium text-slate-800 transition hover:bg-emerald-400"
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
        </div>
      )}
    </div>
  );
}

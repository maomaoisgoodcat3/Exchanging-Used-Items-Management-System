"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { getOrders, saveOrders } from "@/services/orderServices";

// Map trạng thái từ DB sang Label hiển thị
const statusLabels: Record<string, string> = {
  Pending: "Đang xử lý",
  Accepted: "Đã xác nhận",
  Denied: "Đã từ chối",
  Deposited: "Đã thanh toán",
  Successful: "Thành công",
  Unsuccessful: "Thất bại",
};

const statusStyles: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Accepted: "bg-sky-100 text-sky-800",
  Deposited: "bg-emerald-100 text-emerald-800",
  Successful: "bg-emerald-100 text-emerald-800",
  Denied: "bg-red-100 text-red-700",
  Unsuccessful: "bg-red-100 text-red-700",
};

export default function MyOrdersPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const data = await getOrders();
        setOrders(data);
      } catch (error) {
        console.error("Lỗi tải đơn hàng:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const myOrders = useMemo(() => {
    if (!user) return [];
    
    return orders.filter((order) => {
      // Lọc theo email người yêu cầu (requester_email)
      const isOwner = order.requester_email === user.email;
      const matchesStatus = statusFilter === "ALL" || order.requester_status === statusFilter;
      const matchesSearch = order.transaction_id?.toString().includes(search);
      
      return isOwner && matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter, user]);

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-black">Bài đăng của tôi</h1>
        <div className="mt-6 flex gap-4">
          <select className="rounded-full border border-slate-200 px-4 py-2 text-black" onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">Tất cả</option>
            <option value="Pending">Đang xử lý</option>
            <option value="Successful">Thành công</option>
          </select>
          <input className="w-full rounded-full border border-slate-200 px-4 py-2 text-black" placeholder="Tìm mã đơn..." onChange={(e) => setSearch(e.target.value)} />
        </div>
      </section>

      {isLoading ? <div>Đang tải...</div> : (
        <section className="grid gap-5 xl:grid-cols-2">
          {myOrders.map((order) => (
            <article className="rounded-2xl bg-white p-4 shadow border" key={order.transaction_id}>
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold">Mã đơn: {order.transaction_id}</h2>
                <span className={`px-3 py-1 rounded-full text-xs ${statusStyles[order.requester_status]}`}>
                  {statusLabels[order.requester_status] || order.requester_status}
                </span>
              </div>
              <p className="text-sm">Ngày đặt: {new Date(order.transaction_date).toLocaleDateString()}</p>
              <p className="font-bold mt-2">Tổng phí: {order.service_fee.toLocaleString()}đ</p>
            </article>
          ))}
          {myOrders.length === 0 && <p className="text-gray-500">Chưa có đơn hàng nào.</p>}
        </section>
      )}
    </div>
  );
}
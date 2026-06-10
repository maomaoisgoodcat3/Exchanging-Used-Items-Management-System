"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/authStore";

const statusLabels: Record<string, string> = {
  Pending: "Đang xử lý",
  Accepted: "Đã xác nhận",
  Denied: "Đã từ chối",
  Deposited: "Đã thanh toán",
  Successful: "Thành công",
  Unsuccessful: "Thất bại",
};

const statusStyles: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Accepted: "bg-sky-100 text-sky-800 border-sky-200",
  Deposited: "bg-indigo-100 text-indigo-800 border-indigo-200",
  Successful: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Denied: "bg-red-100 text-red-700 border-red-200",
  Unsuccessful: "bg-red-100 text-red-700 border-red-200",
};

export default function MyOrdersPage() {
  const { user, token } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchOrdersSafely = async () => {
      if (!token) {
         setIsLoading(false);
         return;
      }
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/orders/", {
           headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
        });
        
        // TRÁNH SẬP WEB: Nếu lỗi API, trả về list rỗng
        if (!res.ok) {
           console.warn("Không thể kéo dữ liệu đơn hàng (Mã lỗi HTTP: " + res.status + ")");
           setOrders([]);
           return;
        }
        
        const data = await res.json();
        setOrders(data);
      } catch (error) {
        console.error("Lỗi kết nối tải đơn hàng:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrdersSafely();
  }, [token]);

  const myOrders = useMemo(() => {
    if (!user) return [];
    
    return orders.filter((order) => {
      const isOwner = order.requester_email === user.email;
      const matchesStatus = statusFilter === "ALL" || order.requester_status === statusFilter;
      const matchesSearch = order.transaction_id?.toString().includes(search);
      return isOwner && matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter, user]);

  return (
    <div className="space-y-6 relative">
      <section className="flex flex-col md:flex-row items-center justify-between rounded-3xl border bg-white p-6 shadow-sm gap-4">
        <div>
           <h1 className="text-3xl text-gray-900 font-bold">Đơn hàng của tôi</h1>
           <p className="mt-1 text-gray-500 text-sm">Theo dõi tiến trình các giao dịch đang diễn ra.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <select 
             className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-gray-700 outline-none focus:border-blue-500 bg-slate-50" 
             onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="Pending">Đang xử lý</option>
            <option value="Accepted">Đã xác nhận</option>
            <option value="Successful">Thành công</option>
          </select>
          <input 
             className="w-full md:w-48 rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
             placeholder="🔍 Tìm mã đơn..." 
             onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
      </section>

      {isLoading ? (
         <div className="text-center py-12 text-gray-500 animate-pulse font-medium">Đang tải lịch sử đơn hàng...</div>
      ) : (
        <section className="grid gap-6 xl:grid-cols-2">
          {myOrders.map((order) => (
            <article className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 hover:shadow-md transition" key={order.transaction_id}>
              <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-3">
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">Mã giao dịch: #{order.transaction_id}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Đặt lúc: {new Date(order.transaction_date).toLocaleString('vi-VN')}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border ${statusStyles[order.requester_status] || 'bg-gray-100 text-gray-600'}`}>
                  {statusLabels[order.requester_status] || order.requester_status}
                </span>
              </div>
              
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                 <span className="text-sm font-semibold text-gray-600">Tổng thanh toán:</span>
                 <p className="font-black text-blue-600 text-lg">{Number(order.service_fee || 0).toLocaleString('vi-VN')} đ</p>
              </div>
            </article>
          ))}
          {myOrders.length === 0 && (
             <div className="col-span-full py-16 text-center">
                <div className="text-5xl mb-4">🛍️</div>
                <p className="text-gray-500 font-medium">Bạn chưa thực hiện giao dịch nào khớp với bộ lọc.</p>
             </div>
          )}
        </section>
      )}
    </div>
  );
}
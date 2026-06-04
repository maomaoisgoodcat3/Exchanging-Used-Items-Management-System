import type { Order } from "../types/order";

const API_URL = "http://127.0.0.1:8000/api/v1";

// Hàm lấy token từ store thật
const getAuthHeaders = () => {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("access_token") : "";
  return { 
    "Authorization": `Bearer ${token}`, 
    "Content-Type": "application/json" 
  };
};

export async function getOrders(): Promise<Order[]> {
  const response = await fetch(`${API_URL}/transactions`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) throw new Error("Không thể tải đơn hàng từ hệ thống");
  return response.json();
}

export async function saveOrders(orders: Order[]) {
  // Logic cập nhật trạng thái đơn hàng nếu cần (ví dụ: PUT/PATCH)
  console.log("Cập nhật đơn hàng lên server...");
}
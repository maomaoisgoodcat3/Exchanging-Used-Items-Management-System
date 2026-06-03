import { mockOrders } from "@/mocks/order.mocks";
import type { Order } from "@/types/order";

export async function getOrders(): Promise<Order[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockOrders);
    }, 500);
  });
}

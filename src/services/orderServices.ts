import { mockOrders } from "../mocks/order.mocks";
import type { Order } from "../types/order";

const ORDERS_STORAGE_KEY = "uet-marketplace-orders";

const canUseStorage = () => typeof window !== "undefined";

const readStoredOrders = (): Order[] | null => {
  if (!canUseStorage()) return null;

  try {
    const rawOrders = window.localStorage.getItem(ORDERS_STORAGE_KEY);
    return rawOrders ? (JSON.parse(rawOrders) as Order[]) : null;
  } catch {
    return null;
  }
};

const writeStoredOrders = (orders: Order[]) => {
  if (!canUseStorage()) return;

  window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
};

export async function getOrders(): Promise<Order[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const storedOrders = readStoredOrders();

      if (storedOrders) {
        resolve(storedOrders);
        return;
      }

      writeStoredOrders(mockOrders);
      resolve(mockOrders);
    }, 500);
  });
}

export function saveOrders(orders: Order[]) {
  writeStoredOrders(orders);
}

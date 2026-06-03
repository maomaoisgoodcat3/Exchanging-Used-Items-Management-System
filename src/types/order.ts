export type OrderStatus = "PROCESSING" | "DELIVERING" | "RECEIVED" | "CANCELLED";

export type PaymentMethod = "Momo" | "COD" | "Ví UET";

export interface Order {
  id: string;
  buyerId: string;
  title: string;
  sellerName: string;
  quantity: number;
  total: number;
  paymentMethod: PaymentMethod;
  orderedAt: string;
  status: OrderStatus;
  image: string;
}

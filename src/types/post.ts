export type PostType = "Selling" | "Trading" | "Donating"; // Theo ENUM bảng Posts

export type PostStatus = "Pending" | "Approved" | "Resending" | "Rejected";

export type PostAvailability = "Open" | "Sold" | "Closed"; // Bổ sung enum cho tính trạng

export type ProductItem = {
  product_id: number; // Khớp với bảng Storage
  product_name: string;
  product_price: number;
  product_quantity: number;
};

export interface Post {
  post_id: number; // Khớp với PRIMARY KEY bảng Posts
  seller_email: string; // Khớp với cột seller_email
  campaign_id?: number | null;
  title: string;
  description?: string;
  thumbnail_url?: string; // Khớp chuẩn với backend và DB
  post_category: PostType; // Khớp chuẩn 100% thay vì post_type
  approval: PostStatus;
  availability?: PostAvailability; // Đã bổ sung
  reject_reason?: string;
  created_at?: string;
  products?: ProductItem[]; // Dữ liệu mảng object cho PostDetailRead
}
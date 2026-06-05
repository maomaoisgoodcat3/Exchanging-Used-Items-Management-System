export type PostType = "Selling" | "Trading" | "Donating"; // Theo ENUM bảng Posts

export type PostStatus = "Pending" | "Approved" | "Resending" | "Rejected";

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
  thumbnail_url?: string; // Thay cho image_post_url
  post_category: PostType;
  approval: PostStatus;
  created_at?: string;
  products?: ProductItem[]; // Dữ liệu từ bảng PostProducts liên kết qua Storage
}
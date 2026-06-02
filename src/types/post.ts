// Tệp: src/types/post.ts

export type PostType = "TRAO_DOI" | "MUA_BAN" | "QUYEN_GOP";

// 1. Thêm định nghĩa các trạng thái bài đăng
export type PostStatus = "CHỜ DUYỆT" | "ĐANG HIỂN THỊ" | "ĐÃ ẨN" | "ĐÃ BÁN";

export type ProductItem = {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
};

export type Post = {
  id: number;
  title: string;
  type: PostType;
  category: string;
  location: string;
  
  images?: string[]; 
  image?: string; 
  
  description?: string;
  condition?: string;
  
  sellerName: string;
  sellerEmail?: string;
  sellerPhone?: string;
  
  campaignId?: string;
  campaignName?: string;

  products?: ProductItem[];
  price?: number; 
  
  // ==========================================
  // 2. THÊM 2 TRƯỜNG NÀY VÀO ĐỂ HẾT LỖI
  // ==========================================
  status?: PostStatus; 
  createdAt?: string; 
};
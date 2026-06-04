import type { Post } from "@/types/post";

const API_URL = "http://127.0.0.1:8000/api/v1";

// Hàm lấy token từ localStorage để xác thực với Backend
const getAuthHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";
  return { 
    "Authorization": `Bearer ${token}`, 
    "Content-Type": "application/json" 
  };
};

// 1. Hàm lấy danh sách bài đăng
export async function getPosts(): Promise<Post[]> {
  const response = await fetch(`${API_URL}/posts`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Không thể tải danh sách bài đăng");
  }
  
  return response.json();
}

// 2. Hàm lưu bài đăng mới
export async function savePost(post: Post) {
  const response = await fetch(`${API_URL}/posts`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(post),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Lỗi khi lưu bài đăng");
  }
  
  return response.json();
}
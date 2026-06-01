// Tệp: src/services/postService.ts
import { mockPosts } from "@/mocks/post.mocks";
import type { Post } from "@/types/post";

export async function getPosts(): Promise<Post[]> {
  // Giả lập độ trễ mạng mất 1 giây (1000ms) khi gọi API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockPosts);
    }, 1000);
  });
}
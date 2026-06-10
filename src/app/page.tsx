import { redirect } from "next/navigation";

export default function Home() {
  // Tự động đá người dùng sang trang đăng nhập khi truy cập root
  redirect("/login");
}
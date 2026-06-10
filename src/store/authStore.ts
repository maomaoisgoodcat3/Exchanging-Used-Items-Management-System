"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware"; // Công cụ tự động lưu localStorage của Zustand
import type { User, UserRole } from "../types/user";

type AuthState = {
  user: User | null;
  token: string | null;
  role: UserRole | string;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  hydrateAuth: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: "MEMBER",
      
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      
      // Hàm đăng nhập thật: Cập nhật state (persist sẽ tự động lưu xuống localStorage)
      login: (token, user) => {
        const userRole = user.role ? String(user.role).toUpperCase() : "MEMBER";
        set({ token, user, role: userRole });
      },

      // Xóa sạch dữ liệu khi đăng xuất
      logout: () => {
        set({ user: null, token: null, role: "MEMBER" });
      },

      // Do persist đã tự động lo việc khôi phục dữ liệu từ localStorage, 
      // hàm này giữ lại dạng rỗng để các Component cũ (như RoleDashboardLayout) gọi không bị lỗi.
      hydrateAuth: () => {},
    }),
    {
      name: "auth-storage", // Tên key hệ thống sẽ dùng để lưu trong trình duyệt
    }
  )
);
"use client";

import { create } from "zustand";
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

const TOKEN_KEY = "access_token";
const USER_KEY = "current_user";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  role: "MEMBER",
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  
  // Hàm đăng nhập thật: Lưu token vào state và localStorage
  login: (token, user) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOKEN_KEY, token);
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    set({ token, user, role: user.role || "MEMBER" });
  },

  // Xóa sạch dữ liệu khi đăng xuất
  logout: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    }
    set({ user: null, token: null, role: "MEMBER" });
  },

  // Hàm khôi phục session khi refresh trang
  hydrateAuth: () => {
    if (typeof window !== "undefined") {
      const storedToken = window.localStorage.getItem(TOKEN_KEY);
      const storedUserStr = window.localStorage.getItem(USER_KEY);
      
      if (storedToken && storedUserStr) {
        try {
          const user = JSON.parse(storedUserStr);
          set({ token: storedToken, user, role: user.role || "MEMBER" });
        } catch (error) {
          console.error("Lỗi parse user data", error);
        }
      }
    }
  },
}));
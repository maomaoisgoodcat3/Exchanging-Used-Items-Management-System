"use client";

import { create } from "zustand";
import { DEFAULT_MOCK_ROLE, getMockUserByRole } from "../mocks/user.mocks";
import type { User, UserRole } from "../types/user";

type AuthState = {
  user: User | null;
  token: string | null;
  mockRole: UserRole;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setMockRole: (role: UserRole) => void;
  hydrateMockUser: () => void;
  logout: () => void;
};

const MOCK_ROLE_STORAGE_KEY = "mockRole";

const isUserRole = (value: unknown): value is UserRole =>
  value === "ADMIN" || value === "STUDENT" || value === "CLUB";

const getStoredMockRole = (): UserRole => {
  const storedRole = window.localStorage.getItem(MOCK_ROLE_STORAGE_KEY);
  return isUserRole(storedRole) ? storedRole : DEFAULT_MOCK_ROLE;
};

const getMockToken = (role: UserRole) => `mock-token-${role.toLowerCase()}`;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  mockRole: DEFAULT_MOCK_ROLE,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setMockRole: (role) => {
    const user = getMockUserByRole(role);

    window.localStorage.setItem(MOCK_ROLE_STORAGE_KEY, role);
    window.localStorage.setItem("token", getMockToken(role));

    set({
      user,
      token: getMockToken(role),
      mockRole: role,
    });
  },
  hydrateMockUser: () => {
    const role = getStoredMockRole();

    set({
      user: getMockUserByRole(role),
      token: getMockToken(role),
      mockRole: role,
    });
  },
  logout: () => {
    window.localStorage.removeItem("token");

    set({
      user: null,
      token: null,
    });
  },
}));

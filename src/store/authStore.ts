import { create } from "zustand";
import { DEFAULT_MOCK_ROLE, getMockUserByRole } from "@/mocks/user.mocks";
import { User, UserRole } from "../types/user";

const MOCK_ROLE_STORAGE_KEY = "mockRole";

const isUserRole = (value: string | null): value is UserRole =>
  value === "ADMIN" || value === "STUDENT" || value === "CLUB";

const getStoredMockRole = (): UserRole => {
  if (typeof window === "undefined") {
    return DEFAULT_MOCK_ROLE;
  }

  const storedRole = window.localStorage.getItem(MOCK_ROLE_STORAGE_KEY);
  return isUserRole(storedRole) ? storedRole : DEFAULT_MOCK_ROLE;
};

const getMockToken = (role: UserRole) => `mock-token-${role.toLowerCase()}`;

interface AuthState {
  user: User | null;
  token: string | null;
  mockRole: UserRole;

  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setMockRole: (role: UserRole) => void;
  hydrateMockUser: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  mockRole: DEFAULT_MOCK_ROLE,

  setUser: (user) => set({ user }),

  setToken: (token) => set({ token }),

  setMockRole: (role) => {
    const user = getMockUserByRole(role);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(MOCK_ROLE_STORAGE_KEY, role);
      window.localStorage.setItem("token", getMockToken(role));
    }

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

  logout: () =>
    {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("token");
      }

      set({
      user: null,
      token: null,
      });
    },
}));

import { useAuthStore } from "../store/authStore";

export const useAuth = () => {
  const {
    user,
    token,
    mockRole,
    setUser,
    setToken,
    setMockRole,
    hydrateMockUser,
    logout,
  } = useAuthStore();

  return {
    user,
    token,
    mockRole,
    setUser,
    setToken,
    setMockRole,
    hydrateMockUser,
    logout,
  };
};

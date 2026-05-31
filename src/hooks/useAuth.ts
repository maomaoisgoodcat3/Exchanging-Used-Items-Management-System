import { useAuthStore } from "../store/authStore";

export const useAuth = () => {
  const { user, token, setUser, setToken, logout } = useAuthStore();

  return {
    user,
    token,
    setUser,
    setToken,
    logout,
  };
};
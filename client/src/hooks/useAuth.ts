import { useAuthStore } from "../store/auth.store";
import * as authApi from "../services/api.service";

export const useAuth = () => {
  const { user, isAuthenticated, setUser, logout } = useAuthStore();

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    return res;
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ) => {
    const res = await authApi.register({ name, email, password });
    return res;
  };

  const getMe = async () => {
    if (!user) {
      await authApi.getMe();
    }
  };

  const handleLogout = () => {
    logout();
  };

  return {
    user,
    isAuthenticated,
    login,
    register,
    getMe,
    logout: handleLogout,
  };
};
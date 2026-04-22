import { useAuthStore } from "../store/auth.store";
import * as authApi from "../services/api.service";
import { connectSocket, disconnectSocket } from "../services/socket.service";

export const useAuth = () => {
  const { user, isAuthenticated, setUser, logout } = useAuthStore();

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });

    // api.service returns res.data = { success, message, data: user }
    const userData = res.data;

    setUser(userData);

    if (userData?.token) {
      connectSocket(userData.token);
    }

    return res;
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await authApi.register({ name, email, password });
    // api.service returns res.data = { success, message, data: user }
    const userData = res.data;
    setUser(userData);
    if (userData?.token) {
      connectSocket(userData.token);
    }
    return res;
  };

  const getMe = async () => {
    if (!user) {
      await authApi.getMe();
    }
  };

  const handleLogout = () => {
    disconnectSocket();
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

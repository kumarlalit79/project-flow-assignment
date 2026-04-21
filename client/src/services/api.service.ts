import { api } from "../lib/axios";
import { useAuthStore } from "../store/auth.store";

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export const login = async (payload: LoginPayload) => {
  const res = await api.post("/auth/login", payload);

  const data = res.data?.data;

  useAuthStore.getState().setUser(data);

  return res.data;
};

export const register = async (payload: RegisterPayload) => {
  const res = await api.post("/auth/register", payload);

  const data = res.data?.data;

  useAuthStore.getState().setUser(data);

  return res.data;
};

// Get current user
export const getMe = async () => {
  const res = await api.get("/auth/me");

  const data = res.data?.data;

  useAuthStore.getState().setUser(data);

  return res.data;
};

// Logout
export const logout = () => {
  useAuthStore.getState().logout();
};
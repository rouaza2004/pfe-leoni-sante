import { api } from "../api/api";

export const login = async (username, password) => {
  const res = await api.post("/auth/login/", { username, password });
  const { access, refresh } = res.data;

  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);

  try {
    const meRes = await api.get("/me/");
    const role = meRes.data?.role || "";
    const uname = meRes.data?.username || username;

    localStorage.setItem("role", role);
    localStorage.setItem("username", uname);

    return { role, username: uname };
  } catch {
    localStorage.setItem("role", "");
    localStorage.setItem("username", username);
    return { role: "", username };
  }
};

export const isAuthenticated = () => !!localStorage.getItem("access");
export const getUserRole = () => localStorage.getItem("role");
export const getUsername = () => localStorage.getItem("username");

export const logout = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("role");
  localStorage.removeItem("username");
};
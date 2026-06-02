import { api } from "@/api/api";

export const login = async (username, password) => {
  const res = await api.post("/auth/login/", { username, password });
  const data = res.data || {};

  console.log("LOGIN RESPONSE =", data);

  const access = data.access || "";
  const refresh = data.refresh || "";
  const role = data.role || "";
  const apiUsername = data.username || username;

  // âœ… Ù†Ø®Ø²Ù†Ùˆ Ø§Ù„ØµØ­ÙŠØ­
  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);
  localStorage.setItem("role", role);
  localStorage.setItem("username", apiUsername);

  try {
    const meRes = await api.get("/me/");
    const me = meRes.data || {};

    localStorage.setItem("username", me.username || apiUsername || username);
    localStorage.setItem("role", me.role || role || "");
    localStorage.setItem("permissions", JSON.stringify(me.permissions || []));
  } catch (error) {
    console.warn("GET /me/ failed:", error?.response?.status, error?.response?.data);
    localStorage.setItem("permissions", JSON.stringify([]));
  }

  return {
    access: localStorage.getItem("access") || access,
    refresh: localStorage.getItem("refresh") || refresh,
    role: localStorage.getItem("role") || role,
    username: localStorage.getItem("username") || apiUsername || username,
  };
};


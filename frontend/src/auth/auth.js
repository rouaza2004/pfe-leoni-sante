export const getAccessToken = () => localStorage.getItem("access") || "";
export const getRefreshToken = () => localStorage.getItem("refresh") || "";
export const getUserRole = () => localStorage.getItem("role") || "";
export const getUsername = () => localStorage.getItem("username") || "";

export const getUserPermissions = () => {
  try {
    const raw = localStorage.getItem("permissions");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const isAuthenticated = () => !!getAccessToken();

export const logout = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("role");
  localStorage.removeItem("permissions");
  localStorage.removeItem("username");
};
import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// ✅ Request interceptor: يضيف Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");

    // DEBUG (تنجم تنحيه بعد)
    console.log(
      "API Request:",
      config.method?.toUpperCase(),
      config.url,
      "token?",
      !!token
    );

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);
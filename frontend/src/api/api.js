import axios from "axios";
import { logout } from "@/auth/auth";

const BASE_URL = "http://127.0.0.1:8000/api";
let isRedirectingToLogin = false;

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json; charset=utf-8",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API ERROR =", error?.response?.status, error?.response?.data);

    if (error?.response?.status === 401) {
      logout();

      if (!isRedirectingToLogin && window.location.pathname !== "/login") {
        isRedirectingToLogin = true;
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  }
);

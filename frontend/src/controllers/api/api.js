import axios from "axios";
import { logout } from "@/controllers/auth/auth";
import { isAdminReadOnlyPath, isMutationMethod } from "@/controllers/auth/readOnlyAccess";

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
    const role = localStorage.getItem("role");
    const currentPath = window.location?.pathname || "";
    const method = config?.method || "get";

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (isAdminReadOnlyPath(currentPath, role) && isMutationMethod(method)) {
      const readOnlyError = new Error("Admin read-only mode blocks write operations on this page.");
      readOnlyError.code = "ERR_ADMIN_READ_ONLY";
      readOnlyError.config = config;
      readOnlyError.response = {
        status: 403,
        statusText: "Forbidden",
        data: { detail: "READ_ONLY_ADMIN" },
        headers: {},
        config,
      };

      return Promise.reject(
        readOnlyError
      );
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


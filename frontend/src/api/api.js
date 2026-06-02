import axios from "axios";
import { logout } from "@/auth/auth";
import { isAdminReadOnlyPath, isMutationMethod } from "@/auth/readOnlyAccess";

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
    const method = error?.config?.method?.toUpperCase?.() || "UNKNOWN";
    const url = error?.config?.url || "unknown-url";
    const status = error?.response?.status;
    const data = error?.response?.data;
    const code = error?.code || "NO_CODE";
    const message = error?.message || "Unknown network error";

    if (typeof status === "number") {
      console.error("API ERROR =", status, data, { method, url, code });
    } else {
      console.error("API NETWORK ERROR =", { method, url, code, message });
    }

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



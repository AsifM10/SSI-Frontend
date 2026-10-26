import axios from "axios";
import { clearSession } from "../utils/sessionManager";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://10.210.12.12:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
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
    const status = error.response?.status;
    const url = error.config?.url || "";

    if (status === 401 && !url.includes("/auth/login") && !url.includes("/auth/register")) {
      clearSession();
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default api;

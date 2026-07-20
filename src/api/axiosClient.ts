import axios from "axios";

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("landcore_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && window.location.pathname !== "/login") {
      localStorage.removeItem("landcore_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

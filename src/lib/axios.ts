import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sphere_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.includes("/auth/login") ||
                        error.config?.url?.includes("/auth/register");

    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem("sphere_token");
      localStorage.removeItem("sphere_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
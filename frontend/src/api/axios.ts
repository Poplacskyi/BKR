// src/api/axios.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://bkr-production.up.railway.app", // Адреса вашого бекенду
});

// Додаємо інтерцептор, який автоматично чіпляє токен до кожного запиту
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // або звідки ви берете токен
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;

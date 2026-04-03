import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

const getHttpFallbackMessage = (status) => {
  if (status === 400) {
    return "Проверьте введённые данные.";
  }
  if (status === 401) {
    return "Неверный логин или пароль.";
  }
  if (status === 403) {
    return "Доступ запрещён или введены неверные данные для этой роли.";
  }
  if (status === 404) {
    return "Сервис не найден.";
  }
  if (status >= 500) {
    return "Ошибка сервера. Попробуйте позже.";
  }
  return "Не удалось выполнить запрос.";
};

const getTransportErrorMessage = (error) => {
  if (error?.code === "ECONNABORTED") {
    return "Сервер отвечает слишком долго. Если backend на Render, он мог уснуть и сейчас просыпается.";
  }
  if (error?.message === "Network Error") {
    return "Не удалось подключиться к серверу. Проверьте VITE_API_URL, CORS и доступность backend.";
  }
  return null;
};

export const courseAPI = {
  getAll: () => api.get("/courses"),
  create: (data) => api.post("/courses", data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
};

export const teacherAPI = {
  getAll: () => api.get("/teachers"),
  create: (data) => api.post("/teachers", data),
  update: (id, data) => api.put(`/teachers/${id}`, data),
  delete: (id) => api.delete(`/teachers/${id}`),
};

export const roomAPI = {
  getAll: () => api.get("/rooms"),
  create: (data) => api.post("/rooms", data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
};

export const scheduleAPI = {
  getAll: () => api.get("/schedules"),
  create: (data) => api.post("/schedules", data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`),
  generate: (data) => api.post("/schedules/generate", data),
};

export const authAPI = {
  login: (email, password, role) =>
    api
      .post("/auth/login", { email, password, role })
      .then((response) => response.data),
  register: (email, password, displayName, role) =>
    api
      .post("/auth/register", {
        email,
        password,
        displayName,
        role,
      })
      .then((response) => response.data),
  logout: () => api.post("/auth/logout").then((response) => response.data),
};

export default {
  courseAPI,
  teacherAPI,
  roomAPI,
  scheduleAPI,
  authAPI,
};

// Add auth token interceptor
api.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        if (parsedUser.token) {
          config.headers.Authorization = `Bearer ${parsedUser.token}`;
        }
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const transportMessage = getTransportErrorMessage(error);
    const serverMessage = error?.response?.data?.error;
    const status = error?.response?.status;
    const message =
      transportMessage || serverMessage || getHttpFallbackMessage(status);
    return Promise.reject(new Error(message));
  },
);

/**
 * ===== ПЕРЕКЛЮЧЕНИЕ НА РЕАЛЬНЫЙ API =====
 *
 * Когда бэкенд будет готов, замените импорты на реальные API:
 *
 * import axios from 'axios';
 *
 * const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
 *
 * const api = axios.create({
 *   baseURL: API_BASE_URL,
 *   headers: {
 *     'Content-Type': 'application/json',
 *   },
 * });
 *
 * export const courseAPI = {
 *   getAll: () => api.get('/courses'),
 *   create: (data) => api.post('/courses', data),
 *   update: (id, data) => api.put(`/courses/${id}`, data),
 *   delete: (id) => api.delete(`/courses/${id}`),
 * };
 * ... и так далее для остальных
 */

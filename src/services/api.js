import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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
  login: (email, password) =>
    api.post("/auth/login", { email, password }).then((response) => response.data),
  register: (email, password, displayName, role) =>
    api
      .post("/auth/register", { email, password, displayName, role })
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

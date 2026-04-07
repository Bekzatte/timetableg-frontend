import axios from "axios";
import { getTranslation } from "../i18n/translations";

const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL?.trim();
  if (envUrl) {
    return envUrl;
  }

  const hostname = window.location.hostname;
  const isLocalHostname =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".local");

  if (isLocalHostname) {
    return "http://127.0.0.1:8000/api";
  }

  return null;
};

const API_BASE_URL = resolveApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL || undefined,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

const getCurrentLanguage = () => localStorage.getItem("language") || "ru";

const getLocalized = (key) => getTranslation(getCurrentLanguage(), key);

const ERROR_CODE_TRANSLATION_KEYS = {
  fill_required_fields: "errorFillRequiredFields",
  invalid_registration_role: "errorInvalidRegistrationRole",
  email_already_exists: "errorEmailAlreadyExists",
  invalid_role: "errorInvalidRole",
  invalid_credentials: "errorInvalidCredentials",
  role_mismatch: "errorRoleMismatch",
  teacher_email_domain_required: "errorTeacherEmailDomainRequired",
  teacher_account_email_domain_required: "errorTeacherAccountEmailDomainRequired",
  auth_required: "errorAuthRequired",
  invalid_token: "errorInvalidToken",
  invalid_json: "errorInvalidJson",
  database_error: "errorDatabase",
  internal_server_error: "errorInternalServer",
  schedule_generation_requires_data: "errorScheduleGenerationRequiresData",
  invalid_id: "errorInvalidId",
  record_not_found: "errorRecordNotFound",
  forbidden: "errorForbidden",
  not_found: "errorNotFound",
  bad_request: "errorBadRequest",
  method_not_allowed: "errorMethodNotAllowed",
  unsupported_collection: "errorBadRequest",
};

const RAW_ERROR_TRANSLATION_KEYS = {
  "Пользователь с таким email уже существует.": "errorEmailAlreadyExists",
  "Пользователь с таким email уже существует": "errorEmailAlreadyExists",
  "Для преподавателя нужен email, оканчивающийся на @kazatu.edu.kz.":
    "errorTeacherEmailDomainRequired",
  "Для преподавателя нужен email, оканчивающийся на @kazatu.edu.kz":
    "errorTeacherEmailDomainRequired",
  "Неверный email или пароль.": "errorInvalidCredentials",
  "Неверный email или пароль": "errorInvalidCredentials",
  "Этот аккаунт зарегистрирован с другой ролью.": "errorRoleMismatch",
  "Этот аккаунт зарегистрирован с другой ролью": "errorRoleMismatch",
  "У аккаунта преподавателя должен быть email @kazatu.edu.kz.":
    "errorTeacherAccountEmailDomainRequired",
  "У аккаунта преподавателя должен быть email @kazatu.edu.kz":
    "errorTeacherAccountEmailDomainRequired",
  "Требуется авторизация.": "errorAuthRequired",
  "Требуется авторизация": "errorAuthRequired",
  "Недействительный токен.": "errorInvalidToken",
  "Недействительный токен": "errorInvalidToken",
  "Недостаточно прав.": "errorForbidden",
  "Недостаточно прав": "errorForbidden",
  "Некорректный JSON.": "errorInvalidJson",
  "Некорректный JSON": "errorInvalidJson",
  "Запись не найдена.": "errorRecordNotFound",
  "Запись не найдена": "errorRecordNotFound",
  "ID должен быть числом.": "errorInvalidId",
  "ID должен быть числом": "errorInvalidId",
  "Для генерации расписания нужны курсы, преподаватели и аудитории.":
    "errorScheduleGenerationRequiresData",
  "Not found": "errorNotFound",
  "Method not allowed": "errorMethodNotAllowed",
};

const getHttpFallbackMessage = (status) => {
  if (status === 400) {
    return getLocalized("errorBadRequest");
  }
  if (status === 401) {
    return getLocalized("errorUnauthorized");
  }
  if (status === 403) {
    return getLocalized("errorForbidden");
  }
  if (status === 404) {
    return getLocalized("errorNotFound");
  }
  if (status >= 500) {
    return getLocalized("errorServer");
  }
  return getLocalized("errorUnknown");
};

const getTransportErrorMessage = (error) => {
  if (!API_BASE_URL) {
    return `VITE_API_URL is not configured for this deployment (${window.location.origin}).`;
  }
  if (error?.code === "ECONNABORTED") {
    return getLocalized("errorTimeout");
  }
  if (error?.message === "Network Error") {
    return getLocalized("errorNetwork");
  }
  return null;
};

const getApiErrorMessage = (payload, status) => {
  const errorCode = payload?.errorCode;
  const translationKey = errorCode ? ERROR_CODE_TRANSLATION_KEYS[errorCode] : null;
  const rawTranslationKey = payload?.error
    ? RAW_ERROR_TRANSLATION_KEYS[payload.error]
    : null;

  if (translationKey) {
    if (errorCode === "fill_required_fields" && payload?.details?.fields?.length) {
      return `${getLocalized(translationKey)}: ${payload.details.fields.join(", ")}`;
    }
    return getLocalized(translationKey);
  }

  if (rawTranslationKey) {
    return getLocalized(rawTranslationKey);
  }

  return payload?.error || getHttpFallbackMessage(status);
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

export const profileAPI = {
  getCurrent: () => api.get("/profile").then((response) => response.data),
  uploadAvatar: (avatarData) =>
    api.post("/profile/avatar", { avatarData }).then((response) => response.data),
};

export const importAPI = {
  importExcel: (fileName, fileContent) =>
    api
      .post("/import/excel", { fileName, fileContent })
      .then((response) => response.data),
  downloadTemplate: () =>
    api.get("/import/template", { responseType: "blob" }).then((response) => response.data),
};

export const adminAPI = {
  clearAllData: () => api.post("/admin/clear-all").then((response) => response.data),
  clearCollection: (collection) =>
    api.post(`/admin/clear/${collection}`).then((response) => response.data),
};

export default {
  courseAPI,
  teacherAPI,
  roomAPI,
  scheduleAPI,
  authAPI,
  profileAPI,
  importAPI,
  adminAPI,
};

// Add auth token interceptor
api.interceptors.request.use(
  (config) => {
    if (!API_BASE_URL) {
      return Promise.reject(
        new Error(
          `VITE_API_URL is not configured for this deployment (${window.location.origin}).`,
        ),
      );
    }

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
    const responseData = error?.response?.data;
    const status = error?.response?.status;
    const message =
      transportMessage || getApiErrorMessage(responseData, status);
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

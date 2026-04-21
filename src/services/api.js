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
const API_TIMEOUT_MS = 70000;

const api = axios.create({
  baseURL: API_BASE_URL || undefined,
  timeout: API_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
});

const getCurrentLanguage = () => localStorage.getItem("language") || "ru";

const getLocalized = (key) => getTranslation(getCurrentLanguage(), key);

const ERROR_PATTERN_TRANSLATORS = [
  {
    pattern: /^Для курса '(.+)' не найден преподаватель\.$/i,
    getMessage: (match) =>
      getLocalized("errorTeacherNotAssignedForCourse").replace("${course}", match[1]),
  },
  {
    pattern: /^Для группы '(.+)' не указан курс обучения\.$/i,
    getMessage: (match) =>
      getLocalized("errorStudyCourseMissingForGroup").replace("${group}", match[1]),
  },
  {
    pattern:
      /^Дисциплина '(.+)' предназначена для (\d+) курса, а группа '(.+)' указана как (\d+) курс\.$/i,
    getMessage: (match) =>
      getLocalized("errorCourseGroupStudyCourseMismatch")
        .replace("${course}", match[1])
        .replace("${courseYear}", match[2])
        .replace("${group}", match[3])
        .replace("${groupCourse}", match[4]),
  },
  {
    pattern: /^Преподаватель курса '(.+)' не поддерживает язык группы '(.+)'\.?$/i,
    getMessage: (match) =>
      getLocalized("errorTeacherDoesNotSupportGroupLanguage")
        .replace("${course}", match[1])
        .replace("${language}", match[2]),
  },
  {
    pattern: /^Для секции не найден курс с кодом '(.+)'\.$/i,
    getMessage: (match) =>
      getLocalized("errorImportSectionCourseNotFound").replace("${courseCode}", match[1]),
  },
  {
    pattern: /^Для секции не найдена группа '(.+)'\.$/i,
    getMessage: (match) =>
      getLocalized("errorImportSectionGroupNotFound").replace("${group}", match[1]),
  },
  {
    pattern: /^Слот уже занят заявкой преподавателя (.+)\.$/i,
    getMessage: (match) =>
      getLocalized("errorPreferenceSlotOccupied").replace("${teacher}", match[1]),
  },
];

const ERROR_CODE_TRANSLATION_KEYS = {
  fill_required_fields: "errorFillRequiredFields",
  invalid_registration_role: "errorInvalidRegistrationRole",
  email_already_exists: "errorEmailAlreadyExists",
  invalid_role: "errorInvalidRole",
  invalid_credentials: "errorInvalidCredentials",
  role_mismatch: "errorRoleMismatch",
  teacher_email_domain_required: "errorTeacherEmailDomainRequired",
  teacher_account_email_domain_required: "errorTeacherAccountEmailDomainRequired",
  teacher_claim_required: "errorTeacherClaimRequired",
  teacher_claim_already_completed: "errorTeacherClaimAlreadyCompleted",
  teacher_claim_email_mismatch: "errorTeacherClaimEmailMismatch",
  teacher_claim_code_invalid: "errorTeacherClaimCodeInvalid",
  teacher_claim_code_expired: "errorTeacherClaimCodeExpired",
  auth_required: "errorAuthRequired",
  invalid_token: "errorInvalidToken",
  invalid_json: "errorInvalidJson",
  database_error: "errorDatabase",
  internal_server_error: "errorInternalServer",
  optimizer_input_infeasible: "errorOptimizerInputInfeasible",
  optimizer_dependency_missing: "errorOptimizerDependencyMissing",
  iup_pdf_dependency_missing: "errorOptimizerDependencyMissing",
  optimizer_requires_teachers: "errorOptimizerRequiresTeachers",
  optimizer_requires_rooms: "errorOptimizerRequiresRooms",
  optimizer_requires_plan_items: "errorOptimizerRequiresPlanItems",
  optimizer_requires_slots: "errorOptimizerRequiresSlots",
  optimizer_no_solution: "errorOptimizerNoSolution",
  schedule_generation_requires_data: "errorScheduleGenerationRequiresData",
  invalid_time_slot: "errorInvalidTimeSlot",
  invalid_id: "errorInvalidId",
  invalid_teacher: "errorInvalidTeacher",
  invalid_room: "errorInvalidRoom",
  unknown_teacher: "errorUnknownTeacher",
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
  "Для импортированного преподавателя нужно подтвердить аккаунт через поиск и код.":
    "errorTeacherClaimRequired",
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
  "Для генерации расписания нужны секции, преподаватели, группы и аудитории.":
    "errorScheduleGenerationRequiresData",
  "Для оптимизатора нужно установить ortools: pip install ortools":
    "errorOptimizerDependencyMissing",
  "Выбрана некорректная группа": "errorInvalidGroupSelection",
  "Язык студента должен совпадать с языком обучения группы":
    "errorStudentLanguageMismatch",
  "Допустимы только изображения": "profileImageTypeError",
  "Изображение слишком большое": "profileImageSizeError",
  "Неподдерживаемая коллекция": "errorUnsupportedCollection",
  "Некорректный час предпочтения.": "errorPreferenceInvalidHour",
  "Некорректный час предпочтения": "errorPreferenceInvalidHour",
  "Некорректный день предпочтения.": "errorPreferenceInvalidDay",
  "Некорректный день предпочтения": "errorPreferenceInvalidDay",
  "Вы уже отправили запрос на этот слот.": "errorPreferenceAlreadySubmitted",
  "Вы уже отправили запрос на этот слот": "errorPreferenceAlreadySubmitted",
  "Некорректный статус заявки.": "errorPreferenceInvalidStatus",
  "Некорректный статус заявки": "errorPreferenceInvalidStatus",
  "Запрос преподавателя не найден.": "errorTeacherPreferenceRequestNotFound",
  "Запрос преподавателя не найден": "errorTeacherPreferenceRequestNotFound",
  "Задача генерации не найдена.": "errorGenerationJobNotFound",
  "Задача генерации не найдена": "errorGenerationJobNotFound",
  "Некорректное содержимое файла.": "errorImportInvalidContent",
  "Некорректное содержимое файла": "errorImportInvalidContent",
  "Расписание ещё не сгенерировано.": "errorScheduleNotGeneratedYet",
  "Расписание ещё не сгенерировано": "errorScheduleNotGeneratedYet",
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
    return getLocalized("errorApiUrlNotConfigured").replace(
      "${origin}",
      window.location.origin,
    );
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
  const patternTranslation = payload?.error
    ? ERROR_PATTERN_TRANSLATORS.find(({ pattern }) => pattern.test(payload.error))
    : null;

  if (translationKey) {
    if (errorCode === "fill_required_fields" && payload?.details?.fields?.length) {
      return `${getLocalized(translationKey)}: ${payload.details.fields.join(", ")}`;
    }
    if (
      errorCode === "schedule_generation_requires_data" &&
      payload?.details?.missing?.length
    ) {
      return `${getLocalized(translationKey)}: ${payload.details.missing.join(", ")}.`;
    }
    if (
      errorCode === "optimizer_input_infeasible" &&
      payload?.details?.issues?.length
    ) {
      const firstIssue = payload.details.issues[0];
      return firstIssue?.reason || getLocalized(translationKey);
    }
    return getLocalized(translationKey);
  }

  if (rawTranslationKey) {
    return getLocalized(rawTranslationKey);
  }

  if (patternTranslation && payload?.error) {
    const match = payload.error.match(patternTranslation.pattern);
    if (match) {
      return patternTranslation.getMessage(match);
    }
  }

  if (errorCode === "bad_request" && payload?.error) {
    return payload.error;
  }

  return payload?.error || getHttpFallbackMessage(status);
};

export const courseAPI = {
  getAll: () => api.get("/disciplines"),
  create: (data) => api.post("/disciplines", data),
  update: (id, data) => api.put(`/disciplines/${id}`, data),
  delete: (id) => api.delete(`/disciplines/${id}`),
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

export const groupAPI = {
  getAll: () => api.get("/groups"),
  getPublicList: () => api.get("/public/groups").then((response) => response.data),
  create: (data) => api.post("/groups", data),
  update: (id, data) => api.put(`/groups/${id}`, data),
  delete: (id) => api.delete(`/groups/${id}`),
};

export const sectionAPI = {
  getAll: () => api.get("/sections"),
  create: (data) => api.post("/sections", data),
  update: (id, data) => api.put(`/sections/${id}`, data),
};

export const scheduleAPI = {
  getAll: () => api.get("/schedules"),
  create: (data) => api.post("/schedules", data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`),
  generate: (data) => api.post("/schedules/generate", data).then((response) => response.data),
  getGenerationJob: (jobId) =>
    api.get(`/schedules/generate/${jobId}`).then((response) => response.data),
  exportExcel: () =>
    api.get("/export/schedule", { responseType: "blob" }).then((response) => response.data),
};

export const authAPI = {
  login: (email, password, role) =>
    api
      .post("/auth/login", { email, password, role })
      .then((response) => response.data),
  register: (
    email,
    password,
    displayName,
    role,
    phone,
    department,
    programmeName,
    groupId,
    subgroup,
    language,
    teachingLanguages,
  ) =>
    api
      .post("/auth/register", {
        email,
        password,
        displayName,
        role,
        phone,
        department,
        programmeName,
        groupId,
        subgroup,
        language,
        teachingLanguages,
      })
      .then((response) => response.data),
  logout: () => api.post("/auth/logout").then((response) => response.data),
};

export const teacherClaimAPI = {
  search: (query) =>
    api
      .get("/public/teachers/claim-search", { params: { q: query } })
      .then((response) => response.data),
  request: (teacherId, email = "") =>
    api
      .post("/auth/teacher-claim/request", { teacherId, email })
      .then((response) => response.data),
  confirm: (teacherId, code, password, email = "") =>
    api
      .post("/auth/teacher-claim/confirm", { teacherId, code, password, email })
      .then((response) => response.data),
};

export const profileAPI = {
  getCurrent: () => api.get("/profile").then((response) => response.data),
  uploadAvatar: (avatarData) =>
    api.post("/profile/avatar", { avatarData }).then((response) => response.data),
};

export const teacherPreferenceAPI = {
  getMine: () => api.get("/teacher-preferences/mine").then((response) => response.data),
  getAll: () => api.get("/teacher-preferences").then((response) => response.data),
  create: (data) => api.post("/teacher-preferences", data).then((response) => response.data),
  updateStatus: (id, data) =>
    api.put(`/teacher-preferences/${id}/status`, data).then((response) => response.data),
  deleteOne: (id) => api.delete(`/teacher-preferences/${id}`).then((response) => response.data),
  deleteAll: () => api.delete("/teacher-preferences").then((response) => response.data),
};

export const notificationsAPI = {
  getAll: () => api.get("/notifications").then((response) => response.data),
  markRead: (id) => api.put(`/notifications/${id}/read`).then((response) => response.data),
  markAllRead: () => api.post("/notifications/read-all").then((response) => response.data),
  deleteOne: (id) => api.delete(`/notifications/${id}`).then((response) => response.data),
  deleteAll: () => api.delete("/notifications").then((response) => response.data),
};

export const importAPI = {
  importExcel: (fileName, fileContent) =>
    api
      .post("/import/excel", { fileName, fileContent })
      .then((response) => response.data),
  previewRop: (fileName, fileContent) =>
    api
      .post("/import/rop/preview", { fileName, fileContent })
      .then((response) => response.data),
  importRop: (fileName, fileContent) =>
    api
      .post("/import/rop", { fileName, fileContent })
      .then((response) => response.data),
  previewIup: (fileName, fileContent) =>
    api
      .post("/import/iup/preview", { fileName, fileContent })
      .then((response) => response.data),
  importIup: (fileName, fileContent) =>
    api
      .post("/import/iup", { fileName, fileContent })
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
  groupAPI,
  sectionAPI,
  scheduleAPI,
  authAPI,
  teacherClaimAPI,
  profileAPI,
  teacherPreferenceAPI,
  importAPI,
  adminAPI,
};

// Add auth token interceptor
api.interceptors.request.use(
  (config) => {
    if (!API_BASE_URL) {
      return Promise.reject(
        new Error(
          getLocalized("errorApiUrlNotConfigured").replace(
            "${origin}",
            window.location.origin,
          ),
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

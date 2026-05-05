import { JOB_ERROR_CODE_TRANSLATION_KEYS } from "./constants";

const GROUP_LANGUAGE_UNSUPPORTED_PATTERN =
  /Преподаватель курса '(.+)' не поддерживает язык группы '(.+)'\.?/i;

const TEACHER_NOT_FOUND_PATTERN = /не найден преподаватель/i;

const GENERATION_REASON_TRANSLATION_KEYS = {
  "Для дисциплины не найдено подходящих аудиторий по типу, вместимости или PCCount.":
    "errorGenerationNoSuitableRoomsReason",
  "Недостаточно доступных временных слотов для заданных ограничений.":
    "errorGenerationInsufficientSlotsReason",
};

const formatPreflightIssue = (issue, t) => {
  const course = issue.courseCode
    ? `${issue.courseName || "-"} (${issue.courseCode})`
    : issue.courseName || "-";
  const group = issue.groupName || "-";
  const teacher = issue.teacherName || "-";
  const teacherLanguages = Array.isArray(issue.teacherLanguages)
    ? issue.teacherLanguages.join(", ")
    : issue.teacherLanguages || "-";

  if (issue.type === "teacher_language_mismatch") {
    return t("schedulePreflightTeacherLanguageMismatch")
      .replace("${course}", course)
      .replace("${group}", group)
      .replace("${teacher}", teacher)
      .replace("${groupLanguage}", issue.groupLanguage || "-")
      .replace("${teacherLanguages}", teacherLanguages);
  }

  if (issue.type === "teacher_missing") {
    return t("schedulePreflightTeacherMissing")
      .replace("${course}", course)
      .replace("${group}", group);
  }

  if (issue.type === "study_course_missing") {
    return t("schedulePreflightStudyCourseMissing")
      .replace("${course}", course)
      .replace("${group}", group);
  }

  if (issue.type === "study_course_mismatch") {
    return t("schedulePreflightStudyCourseMismatch")
      .replace("${course}", course)
      .replace("${group}", group)
      .replace("${courseYear}", issue.courseYear || "-")
      .replace("${groupCourse}", issue.groupStudyCourse || "-");
  }

  return issue.reason || t("errorBadRequest");
};

export const formatGenerationError = (job, t) => {
  const translationKey = job?.errorCode
    ? JOB_ERROR_CODE_TRANSLATION_KEYS[job.errorCode]
    : null;

  const issues = Array.isArray(job.details?.issues) ? job.details.issues : [];
  const preflightIssues = issues.filter((issue) => issue?.type);

  if (job.errorCode === "schedule_preflight_failed" || preflightIssues.length) {
    const error = new Error(t("schedulePreflightFailed"));
    error.items = preflightIssues.map((issue) => formatPreflightIssue(issue, t));

    return error;
  }

  const firstIssue = issues[0];

  if (firstIssue?.reason) {
    const reason = String(firstIssue.reason);
    const normalizedReason = reason.toLowerCase();
    const items = [t(GENERATION_REASON_TRANSLATION_KEYS[reason] || reason)];

    if (normalizedReason.includes("аудитор")) {
      items.push(t("errorGenerationRoomsAvailableHint"));
    }

    if (normalizedReason.includes("вместим")) {
      items.push(t("errorGenerationRoomCapacityHint"));
    }

    if (
      normalizedReason.includes("pccount") ||
      normalizedReason.includes("компьют")
    ) {
      items.push(t("errorGenerationComputersHint"));
    }

    if (
      normalizedReason.includes("временн") ||
      normalizedReason.includes("слотов")
    ) {
      items.push(t("errorGenerationSlotsHint"));
    }

    const error = new Error(t("errorGenerateSchedule"));
    error.items = items;

    return error;
  }

  if (job.details?.missing?.length) {
    const details = job.details.missing.map((item) => {
      const normalized = String(item).toLowerCase();

      if (normalized.includes("секции")) {
        return `${item}. ${t("errorGenerationMissingSectionsHint")}`;
      }

      if (normalized.includes("преподавател")) {
        return `${item}. ${t("errorGenerationMissingTeachersHint")}`;
      }

      if (normalized.includes("аудит")) {
        return `${item}. ${t("errorGenerationMissingRoomsHint")}`;
      }

      if (normalized.includes("групп")) {
        return `${item}. ${t("errorGenerationMissingGroupsHint")}`;
      }

      return item;
    });

    const error = new Error(t("errorScheduleGenerationRequiresData"));
    error.items = details;

    return error;
  }

  if (translationKey) {
    const error = new Error(t(translationKey));
    error.items = [];

    return error;
  }

  const rawError = String(job.error || t("errorUnknown"));
  const normalizedError = rawError.toLowerCase();
  const items = [];

  if (normalizedError.includes("не поддерживает язык группы")) {
    const match = rawError.match(GROUP_LANGUAGE_UNSUPPORTED_PATTERN);

    if (match) {
      items.push(
        t("errorTeacherDoesNotSupportGroupLanguage")
          .replace("${course}", match[1])
          .replace("${language}", match[2]),
      );
    } else {
      items.push(t("errorTeacherDoesNotSupportGroupLanguageFallback"));
    }

    items.push(t("errorTeacherDoesNotSupportGroupLanguageHint"));
  } else if (TEACHER_NOT_FOUND_PATTERN.test(normalizedError)) {
    items.push(t("errorTeacherNotAssigned"));
    items.push(t("errorTeacherNotAssignedHint"));
  } else {
    items.push(rawError);
  }

  const error = new Error(t("errorGenerateSchedule"));
  error.items = items;

  return error;
};

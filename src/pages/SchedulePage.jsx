import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  Download,
  Loader2,
  Plus,
  RotateCw,
  Sparkles,
} from "lucide-react";
import TimetableGrid from "../components/timetable/TimetableGrid";
import DataTable from "../components/ui/DataTable";
import Modal from "../components/ui/Modal";
import Form from "../components/ui/Form";
import {
  courseAPI,
  groupAPI,
  roomBlockAPI,
  roomAPI,
  scheduleAPI,
  sectionAPI,
  teacherAPI,
} from "../services/api";
import { useFetch } from "../hooks/useAPI";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";
import { useAutoDismiss } from "../hooks/useAutoDismiss";
import { formatLessonTimeRange, scheduleHours } from "../utils/timeSlots";

const WEEKDAY_OPTIONS = [
  { value: "monday", labelKey: "monday" },
  { value: "tuesday", labelKey: "tuesday" },
  { value: "wednesday", labelKey: "wednesday" },
  { value: "thursday", labelKey: "thursday" },
  { value: "friday", labelKey: "friday" },
];

const SCHEDULE_SEMESTER_OPTIONS = [
  { value: 1, labelKey: "fallScheduleSemester" },
  { value: 2, labelKey: "springScheduleSemester" },
];

const SCHEDULE_ALGORITHM_OPTIONS = [
  { value: "greedy", labelKey: "greedyAlgorithm" },
  { value: "cpsat", label: "CP-SAT" },
  { value: "hybrid", label: "CP-SAT + Greedy" },
];

const GENERATION_POLL_INTERVAL_MS = 10000;

const EMPTY_SCHEDULE_FILTERS = {
  group: "",
  teacher: "",
  room: "",
  day: "",
};

const createEmptyScheduleFiltersBySemester = () => ({
  1: { ...EMPTY_SCHEDULE_FILTERS },
  2: { ...EMPTY_SCHEDULE_FILTERS },
});

const JOB_ERROR_CODE_TRANSLATION_KEYS = {
  optimizer_dependency_missing: "errorOptimizerDependencyMissing",
  optimizer_requires_teachers: "errorOptimizerRequiresTeachers",
  optimizer_requires_rooms: "errorOptimizerRequiresRooms",
  optimizer_requires_plan_items: "errorOptimizerRequiresPlanItems",
  optimizer_requires_slots: "errorOptimizerRequiresSlots",
  optimizer_no_solution: "errorOptimizerNoSolution",
  invalid_time_slot: "errorInvalidTimeSlot",
  invalid_teacher: "errorInvalidTeacher",
  invalid_room: "errorInvalidRoom",
  unknown_teacher: "errorUnknownTeacher",
  schedule_generation_requires_data: "errorScheduleGenerationRequiresData",
};

const getWeekdayValue = (isoDate) => {
  if (!isoDate) {
    return "monday";
  }

  const jsDay = new Date(`${isoDate}T12:00:00`).getDay();
  const weekdayIndex = jsDay === 0 ? 6 : jsDay - 1;

  return WEEKDAY_OPTIONS[weekdayIndex]?.value || "monday";
};

const normalizeWeekdayValue = (value) => {
  const normalized = String(value || "").trim().toLowerCase();

  if (!normalized) {
    return "";
  }

  if (WEEKDAY_OPTIONS.some((item) => item.value === normalized)) {
    return normalized;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(normalized)) {
    return getWeekdayValue(normalized.slice(0, 10));
  }

  const weekdayAliases = {
    monday: "monday",
    tuesday: "tuesday",
    wednesday: "wednesday",
    thursday: "thursday",
    friday: "friday",
  };

  return weekdayAliases[normalized] || "";
};

const toIsoDateForWeekday = (weekday, year) => {
  const today = new Date();
  const anchor = new Date(year, today.getMonth(), today.getDate());
  const monday = new Date(anchor);

  monday.setDate(anchor.getDate() - ((anchor.getDay() + 6) % 7));

  const weekdayIndex = WEEKDAY_OPTIONS.findIndex(
    (item) => item.value === weekday,
  );

  monday.setDate(monday.getDate() + (weekdayIndex >= 0 ? weekdayIndex : 0));

  const month = `${monday.getMonth() + 1}`.padStart(2, "0");
  const day = `${monday.getDate()}`.padStart(2, "0");

  return `${monday.getFullYear()}-${month}-${day}`;
};

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

const formatGenerationError = (job, t) => {
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

const filterScheduleEntries = (entries, filters) =>
  entries.filter((entry) => {
    const matchesGroup = !filters.group || String(entry.group_id) === filters.group;
    const matchesTeacher = !filters.teacher || String(entry.teacher_id) === filters.teacher;
    const matchesRoom = !filters.room || String(entry.room_id) === filters.room;
    const matchesDay = !filters.day || getWeekdayValue(entry.day) === filters.day;

    return matchesGroup && matchesTeacher && matchesRoom && matchesDay;
  });

export const SchedulePage = () => {
  const { t, language } = useTranslation();
  const { isAdmin } = useAuth();

  const currentYear = new Date().getFullYear();

  const [schedule, setSchedule] = useState([]);
  const [scheduleSemester] = useState(1);
  const [scheduleYear] = useState(currentYear);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [resetSemester, setResetSemester] = useState(1);
  const [resetYear, setResetYear] = useState(currentYear);
  const [exportSemester, setExportSemester] = useState(1);
  const [exportYear, setExportYear] = useState(currentYear);
  const [exportLanguage, setExportLanguage] = useState(language || "ru");
  const [exportGroupId, setExportGroupId] = useState("");
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeGenerationJob, setActiveGenerationJob] = useState(null);
  const [isGenerationStatusOpen, setIsGenerationStatusOpen] = useState(false);
  const [isEntrySaving, setIsEntrySaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [pageError, setPageError] = useState("");
  const generationPollTimeoutRef = useRef(null);

  const [filtersBySemester, setFiltersBySemester] = useState(
    createEmptyScheduleFiltersBySemester,
  );
  const [draftFiltersBySemester, setDraftFiltersBySemester] = useState(
    createEmptyScheduleFiltersBySemester,
  );
  const [expandedSemesters, setExpandedSemesters] = useState({
    1: true,
    2: true,
  });

  const { data, execute } = useFetch(scheduleAPI.getAll);
  const { data: sectionsData, execute: executeSections } = useFetch(
    sectionAPI.getAll,
  );
  const { data: roomsData, execute: executeRooms } = useFetch(roomAPI.getAll);
  const { data: groupsData, execute: executeGroups } = useFetch(groupAPI.getAll);
  const { data: roomBlocksData, execute: executeRoomBlocks } = useFetch(
    roomBlockAPI.getAll,
  );
  const { data: coursesData, execute: executeCourses } = useFetch(
    courseAPI.getAll,
  );
  const { data: teachersData, execute: executeTeachers } = useFetch(
    teacherAPI.getAll,
  );

  useAutoDismiss(pageError, setPageError);

  const clearGenerationPollTimeout = () => {
    if (generationPollTimeoutRef.current) {
      window.clearTimeout(generationPollTimeoutRef.current);
      generationPollTimeoutRef.current = null;
    }
  };

  useEffect(
    () => () => {
      clearGenerationPollTimeout();
    },
    [],
  );

  useEffect(() => {
    if (data) {
      setSchedule(data);
    }
  }, [data]);

  useEffect(() => {
    execute({ year: scheduleYear });

    if (isAdmin) {
      executeSections();
      executeGroups();
      executeRooms();
      executeRoomBlocks();
      executeCourses();
      executeTeachers();
    }
  }, [
    execute,
    executeCourses,
    executeGroups,
    executeRoomBlocks,
    executeRooms,
    executeSections,
    executeTeachers,
    isAdmin,
    scheduleYear,
  ]);

  const sections = Array.isArray(sectionsData) ? sectionsData : [];
  const rooms = Array.isArray(roomsData) ? roomsData : [];
  const groups = Array.isArray(groupsData) ? groupsData : [];
  const roomBlocks = Array.isArray(roomBlocksData) ? roomBlocksData : [];
  const courses = Array.isArray(coursesData) ? coursesData : [];
  const teachers = Array.isArray(teachersData) ? teachersData : [];

  const hasAssignedTeacher =
    sections.some((section) => section.teacher_id) ||
    courses.some((course) => course.instructor_id);

  const isEntryFormBlocked =
    sections.length === 0 ||
    rooms.length === 0 ||
    courses.length === 0 ||
    teachers.length === 0 ||
    !hasAssignedTeacher;

  const entryFormHint =
    sections.length === 0
      ? t("scheduleEntriesNeedSectionsFirst")
      : rooms.length === 0
        ? t("scheduleEntriesNeedRoomsFirst")
        : courses.length === 0
          ? t("scheduleEntriesNeedCoursesFirst")
          : teachers.length === 0 || !hasAssignedTeacher
            ? t("scheduleEntriesNeedAssignedTeachers")
            : "";

  const schedulesBySemester = useMemo(
    () => ({
      1: schedule.filter((entry) => Number(entry.semester) === 1),
      2: schedule.filter((entry) => Number(entry.semester) === 2),
    }),
    [schedule],
  );

  const filteredSchedulesBySemester = useMemo(
    () => ({
      1: filterScheduleEntries(
        schedulesBySemester[1],
        filtersBySemester[1] || EMPTY_SCHEDULE_FILTERS,
      ),
      2: filterScheduleEntries(
        schedulesBySemester[2],
        filtersBySemester[2] || EMPTY_SCHEDULE_FILTERS,
      ),
    }),
    [schedulesBySemester, filtersBySemester],
  );

  const hasAnyScheduleForYear =
    schedulesBySemester[1].length > 0 || schedulesBySemester[2].length > 0;

  const hasActiveEntryFilters = (semester) => {
    const filters = filtersBySemester[semester] || EMPTY_SCHEDULE_FILTERS;
    return Boolean(filters.group || filters.teacher || filters.room || filters.day);
  };

  const exportGroupOptions = useMemo(
    () =>
      Array.from(
        new Map(
          schedule
            .filter(
              (entry) =>
                Number(entry.semester) === Number(exportSemester) &&
                Number(entry.year) === Number(exportYear) &&
                entry.group_id,
            )
            .map((entry) => [String(entry.group_id), entry.group_name]),
        ).entries(),
      ).sort((left, right) => String(left[1] || "").localeCompare(String(right[1] || ""))),
    [exportSemester, exportYear, schedule],
  );

  useEffect(() => {
    if (
      exportGroupId &&
      !exportGroupOptions.some(([groupId]) => String(groupId) === String(exportGroupId))
    ) {
      setExportGroupId("");
    }
  }, [exportGroupId, exportGroupOptions]);

  const updateDraftFilter = (semester, field, value) => {
    setDraftFiltersBySemester((current) => ({
      ...current,
      [semester]: {
        ...EMPTY_SCHEDULE_FILTERS,
        ...(current[semester] || {}),
        [field]: value,
      },
    }));
  };

  const applyFilters = (semester) => {
    setFiltersBySemester((current) => ({
      ...current,
      [semester]: {
        ...EMPTY_SCHEDULE_FILTERS,
        ...(draftFiltersBySemester[semester] || {}),
      },
    }));
  };

  const resetFilters = (semester) => {
    setDraftFiltersBySemester((current) => ({
      ...current,
      [semester]: { ...EMPTY_SCHEDULE_FILTERS },
    }));
    setFiltersBySemester((current) => ({
      ...current,
      [semester]: { ...EMPTY_SCHEDULE_FILTERS },
    }));
  };

  const toggleSemesterExpanded = (semester) => {
    setExpandedSemesters((current) => ({
      ...current,
      [semester]: !current[semester],
    }));
  };

  const waitForNextGenerationPoll = () =>
    new Promise((resolve) => {
      clearGenerationPollTimeout();

      generationPollTimeoutRef.current = window.setTimeout(() => {
        generationPollTimeoutRef.current = null;
        resolve();
      }, GENERATION_POLL_INTERVAL_MS);
    });

  const pollGenerationJob = async (jobId, metadata) => {
    try {
      const job = await scheduleAPI.getGenerationJob(jobId);

      if (job.status === "completed") {
        setActiveGenerationJob((current) => ({
          ...(current || metadata),
          ...metadata,
          jobId,
          status: "completed",
          result: job.result || null,
          error: null,
          items: [],
        }));
        setIsLoading(false);
        await refreshSchedule();
        return;
      }

      if (job.status === "failed") {
        const formattedError = formatGenerationError(job, t);
        setActiveGenerationJob((current) => ({
          ...(current || metadata),
          ...metadata,
          jobId,
          status: "failed",
          error: formattedError.message || t("errorGenerateSchedule"),
          items: Array.isArray(formattedError.items) ? formattedError.items : [],
        }));
        setGenerationError({
          title: t("errorGenerateSchedule"),
          message: formattedError.message || t("errorUnknown"),
          items: Array.isArray(formattedError.items) ? formattedError.items : [],
        });
        setIsLoading(false);
        return;
      }

      setActiveGenerationJob((current) => ({
        ...(current || metadata),
        ...metadata,
        jobId,
        status: job.status || "running",
        error: null,
      }));
      await waitForNextGenerationPoll();
      await pollGenerationJob(jobId, metadata);
    } catch (error) {
      console.error(t("errorGenerateSchedule"), error);
      setActiveGenerationJob((current) => ({
        ...(current || metadata),
        ...metadata,
        jobId,
        status: "running",
        error: error.message || t("errorUnknown"),
      }));
      await waitForNextGenerationPoll();
      await pollGenerationJob(jobId, metadata);
    }
  };

  const refreshSchedule = async () => {
    const nextSchedule = await execute({
      year: scheduleYear,
    });

    setSchedule(nextSchedule || []);

    return nextSchedule || [];
  };

  const handleGenerateSchedule = async (formData, setErrors) => {
    try {
      clearGenerationPollTimeout();
      setGenerationError(null);
      setPageError("");
      setIsGenerateOpen(false);
      setIsGenerationStatusOpen(true);
      setIsLoading(true);

      const job = await scheduleAPI.generate(formData);
      const metadata = {
        jobId: job.jobId,
        status: "running",
        semester: Number(formData.semester),
        year: Number(formData.year),
        algorithm: formData.algorithm,
        startedAt: Date.now(),
        error: null,
        items: [],
      };

      setActiveGenerationJob(metadata);
      pollGenerationJob(job.jobId, metadata);
    } catch (error) {
      console.error(t("errorGenerateSchedule"), error);
      setIsGenerationStatusOpen(false);

      setGenerationError({
        title: t("errorGenerateSchedule"),
        message: error.message || t("errorUnknown"),
        items: Array.isArray(error.items) ? error.items : [],
      });

      setErrors((prev) => ({
        ...prev,
        error: error.message,
      }));
      setIsLoading(false);
    }
  };

  const openResetScheduleModal = () => {
    const semesterWithSchedule =
      schedulesBySemester[1].length > 0
        ? 1
        : schedulesBySemester[2].length > 0
          ? 2
          : scheduleSemester;

    setResetSemester(semesterWithSchedule);
    setResetYear(scheduleYear);
    setIsResetModalOpen(true);
  };

  const handleResetSchedule = async () => {
    try {
      setIsResetting(true);
      setPageError("");

      await scheduleAPI.reset({
        semester: resetSemester,
        year: resetYear,
      });

      setSchedule((current) =>
        current.filter(
          (entry) =>
            Number(entry.semester) !== Number(resetSemester) ||
            Number(entry.year) !== Number(resetYear),
        ),
      );
      await refreshSchedule();
      setIsResetModalOpen(false);
    } catch (error) {
      console.error(t("errorResetSchedule"), error);
      setPageError(error.message || t("errorResetSchedule"));
    } finally {
      setIsResetting(false);
    }
  };

  const openExportScheduleModal = () => {
    setExportSemester(scheduleSemester);
    setExportYear(scheduleYear);
    setExportLanguage(language || "ru");
    setExportGroupId("");
    setIsExportModalOpen(true);
  };

  const handleExportSchedule = async () => {
    try {
      setIsExporting(true);
      setPageError("");

      const blob = await scheduleAPI.exportExcel({
        semester: exportSemester,
        year: exportYear,
        language: exportLanguage,
        ...(exportGroupId ? { group_id: exportGroupId } : {}),
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = exportGroupId
        ? `schedule-${exportYear}-semester-${exportSemester}-group-${exportGroupId}.xlsx`
        : `schedule-${exportYear}-semester-${exportSemester}.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);
      setIsExportModalOpen(false);
    } catch (error) {
      console.error(t("errorExportSchedule"), error);
      setPageError(error.message || t("errorExportSchedule"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddEntry = () => {
    setEditingEntry(null);
    setIsEntryModalOpen(true);
  };

  const handleEditEntry = (entry) => {
    setEditingEntry({
      ...entry,
      weekday: getWeekdayValue(entry.day),
    });

    setIsEntryModalOpen(true);
  };

  const handleDeleteEntry = async (entry) => {
    if (!window.confirm(t("confirmDeleteScheduleEntry"))) {
      return;
    }

    try {
      setPageError("");

      await scheduleAPI.delete(entry.id);
      await refreshSchedule();
    } catch (error) {
      console.error(t("errorDeleteScheduleEntry"), error);
      setPageError(error.message || t("errorDeleteScheduleEntry"));
    }
  };

  const getSelectedEntrySection = (formData) =>
    sections.find((section) => String(section.id) === String(formData.section_id));

  const getSelectedEntryCourse = (section) =>
    courses.find((course) => String(course.id) === String(section?.course_id));

  const getSelectedEntryGroup = (section) =>
    groups.find((group) => String(group.id) === String(section?.group_id));

  const hasGroupSlotConflict = (entry, selectedSection, subgroup) => {
    if (String(entry.group_id) !== String(selectedSection.group_id)) {
      return false;
    }

    const existingSubgroup = String(entry.subgroup || "").toUpperCase();
    const nextSubgroup = String(subgroup || "").toUpperCase();

    return !existingSubgroup || !nextSubgroup || existingSubgroup === nextSubgroup;
  };

  const isRoomBlockedAtSlot = (roomId, weekday, hour, semester, year) =>
    roomBlocks.some((block) => {
      if (String(block.room_id) !== String(roomId)) {
        return false;
      }

      const blockSemester = block.semester;
      const blockYear = block.year;

      if (
        blockSemester !== null &&
        blockSemester !== undefined &&
        blockSemester !== "" &&
        Number(blockSemester) !== Number(semester)
      ) {
        return false;
      }

      if (
        blockYear !== null &&
        blockYear !== undefined &&
        blockYear !== "" &&
        Number(blockYear) !== Number(year)
      ) {
        return false;
      }

      if (normalizeWeekdayValue(block.day) !== weekday) {
        return false;
      }

      const startHour = Number(block.start_hour);
      const endHour =
        block.end_hour !== null && block.end_hour !== undefined && block.end_hour !== ""
          ? Number(block.end_hour)
          : startHour + 1;

      return Number(hour) >= startHour && Number(hour) < endHour;
    });

  const isRoomCompatibleWithSection = (room, selectedSection) => {
    if (!room || !selectedSection || !Number(room.available ?? 1)) {
      return false;
    }

    const lessonType = String(selectedSection.lesson_type || "").toLowerCase();
    const roomType = String(room.type || "").toLowerCase();
    const selectedGroup = getSelectedEntryGroup(selectedSection);
    const studentCount = Number(selectedGroup?.student_count || 0);
    const capacity = Number(room.capacity || 0);

    if (studentCount && capacity && capacity < studentCount) {
      return false;
    }

    if (lessonType === "lecture" && roomType && roomType !== "lecture") {
      return false;
    }

    if (lessonType === "practical" && roomType && !["practical", "lecture"].includes(roomType)) {
      return false;
    }

    if (lessonType === "lab" && roomType && roomType !== "practical") {
      return false;
    }

    if (
      (lessonType === "lab" || Number(selectedSection.requires_computers || 0)) &&
      Number(room.computer_count || 0) < 10
    ) {
      return false;
    }

    return true;
  };

  const hasTeacherOrGroupConflictAtSlot = (formData, hour) => {
    const selectedSection = getSelectedEntrySection(formData);
    const selectedCourse = getSelectedEntryCourse(selectedSection);

    if (
      !selectedSection ||
      !formData.weekday ||
      !formData.semester ||
      !formData.year
    ) {
      return true;
    }

    const teacherId = selectedSection.teacher_id || selectedCourse?.instructor_id;
    const day = toIsoDateForWeekday(formData.weekday, Number(formData.year));
    const semester = Number(formData.semester);
    const year = Number(formData.year);

    return schedule.some((entry) => {
      if (editingEntry && String(entry.id) === String(editingEntry.id)) {
        return false;
      }

      if (
        Number(entry.semester) !== semester ||
        Number(entry.year) !== year ||
        entry.day !== day ||
        Number(entry.start_hour) !== Number(hour)
      ) {
        return false;
      }

      return (
        (teacherId && String(entry.teacher_id) === String(teacherId)) ||
        hasGroupSlotConflict(entry, selectedSection, formData.subgroup)
      );
    });
  };

  const isRoomAvailableAtSlot = (room, formData, hour) => {
    const selectedSection = getSelectedEntrySection(formData);

    if (
      !selectedSection ||
      !isRoomCompatibleWithSection(room, selectedSection) ||
      !formData.weekday ||
      !formData.semester ||
      !formData.year
    ) {
      return false;
    }

    const semester = Number(formData.semester);
    const year = Number(formData.year);
    const day = toIsoDateForWeekday(formData.weekday, year);

    if (isRoomBlockedAtSlot(room.id, formData.weekday, hour, semester, year)) {
      return false;
    }

    return !schedule.some((entry) => {
      if (editingEntry && String(entry.id) === String(editingEntry.id)) {
        return false;
      }

      return (
        Number(entry.semester) === semester &&
        Number(entry.year) === year &&
        entry.day === day &&
        Number(entry.start_hour) === Number(hour) &&
        String(entry.room_id) === String(room.id)
      );
    });
  };

  const getAvailableRoomOptions = (formData) => {
    if (
      !formData.section_id ||
      !formData.weekday ||
      !formData.start_hour ||
      !formData.semester ||
      !formData.year
    ) {
      return [];
    }

    return rooms
      .filter((room) => isRoomAvailableAtSlot(room, formData, Number(formData.start_hour)))
      .map((room) => {
        const details = [
          room.type ? t(room.type) : "",
          room.capacity ? `${room.capacity}` : "",
          Number(room.computer_count || 0) > 0 ? `PC ${room.computer_count}` : "",
        ].filter(Boolean);

        return {
          value: room.id,
          label: details.length ? `${room.number} (${details.join(", ")})` : room.number,
        };
      });
  };

  const getAvailableStartHourOptions = (formData) => {
    const selectedSection = getSelectedEntrySection(formData);

    if (
      !selectedSection ||
      !formData.weekday ||
      !formData.semester ||
      !formData.year
    ) {
      return [];
    }

    return scheduleHours
      .filter((hour) => {
        if (hasTeacherOrGroupConflictAtSlot(formData, hour)) {
          return false;
        }

        return rooms.some((room) => isRoomAvailableAtSlot(room, formData, hour));
      })
      .map((hour) => ({
        value: hour,
        label: formatLessonTimeRange(hour),
      }));
  };

  const getAvailableWeekdayOptions = (formData) => {
    if (
      !formData.section_id ||
      !formData.semester ||
      !formData.year
    ) {
      return [];
    }

    return WEEKDAY_OPTIONS.filter(
      (item) =>
        getAvailableStartHourOptions({
          ...formData,
          weekday: item.value,
        }).length > 0,
    ).map((item) => ({
      value: item.value,
      label: t(item.labelKey),
    }));
  };

  const handleEntrySubmit = async (formData, setErrors) => {
    const selectedSection = sections.find(
      (section) => String(section.id) === String(formData.section_id),
    );

    const selectedRoom = rooms.find(
      (room) => String(room.id) === String(formData.room_id),
    );

    const selectedCourse = courses.find(
      (course) => String(course.id) === String(selectedSection?.course_id),
    );

    if (!selectedSection || !selectedRoom || !selectedCourse) {
      setErrors((prev) => ({
        ...prev,
        error: t("errorBadRequest"),
      }));

      return;
    }

    try {
      setIsEntrySaving(true);

      const isSelectedSlotAvailable = getAvailableStartHourOptions(formData).some(
        (option) => String(option.value) === String(formData.start_hour),
      );
      const isSelectedRoomAvailable = getAvailableRoomOptions(formData).some(
        (option) => String(option.value) === String(formData.room_id),
      );

      if (!isSelectedSlotAvailable) {
        setErrors((prev) => ({
          ...prev,
          start_hour: t("selectOption"),
        }));
        return;
      }

      if (!isSelectedRoomAvailable) {
        setErrors((prev) => ({
          ...prev,
          room_id: t("selectRoom"),
        }));
        return;
      }

      const normalizedYear = Number(formData.year);

      const payload = {
        section_id: Number(selectedSection.id),
        course_id: Number(selectedSection.course_id),
        course_name: selectedSection.course_name,
        teacher_id: selectedSection.teacher_id
          ? Number(selectedSection.teacher_id)
          : selectedCourse.instructor_id
            ? Number(selectedCourse.instructor_id)
            : null,
        teacher_name:
          selectedSection.teacher_name || selectedCourse.instructor_name || "",
        room_id: Number(selectedRoom.id),
        room_number: selectedRoom.number,
        group_id: Number(selectedSection.group_id),
        group_name: selectedSection.group_name,
        subgroup: formData.subgroup || "",
        day: toIsoDateForWeekday(formData.weekday, normalizedYear),
        start_hour: Number(formData.start_hour),
        semester: Number(formData.semester),
        year: normalizedYear,
        algorithm: "manual",
      };

      if (!payload.teacher_id) {
        throw new Error(t("errorBadRequest"));
      }

      await (editingEntry
        ? scheduleAPI.update(editingEntry.id, payload)
        : scheduleAPI.create(payload));

      await refreshSchedule();

      setIsEntryModalOpen(false);
      setEditingEntry(null);
    } catch (error) {
      console.error(t("errorSaveScheduleEntry"), error);

      setErrors((prev) => ({
        ...prev,
        error: error.message,
      }));
    } finally {
      setIsEntrySaving(false);
    }
  };

  const formFields = [
    {
      name: "semester",
      label: t("scheduleSemester"),
      type: "select",
      placeholder: t("scheduleSemester"),
      options: SCHEDULE_SEMESTER_OPTIONS.map((item) => ({
        value: item.value,
        label: t(item.labelKey),
      })),
      required: true,
    },
    {
      name: "year",
      label: t("year"),
      type: "number",
      placeholder: "2026",
      required: true,
    },
    {
      name: "algorithm",
      label: t("algorithm"),
      type: "select",
      placeholder: t("algorithm"),
      options: SCHEDULE_ALGORITHM_OPTIONS.map((item) => ({
        value: item.value,
        label: item.label || t(item.labelKey),
      })),
      required: true,
    },
  ];

  const entryFields = [
    {
      name: "section_id",
      label: t("addSection"),
      type: "select",
      placeholder: t("selectSection"),
      options: sections.map((section) => ({
        value: section.id,
        label: `${section.course_name} - ${section.group_name}`,
      })),
      onChange: () => ({
        room_id: "",
        weekday: "",
        start_hour: "",
        subgroup: "",
      }),
      required: true,
    },
    {
      name: "selected_group",
      label: t("groupNumber"),
      type: "computed",
      render: (formData) => getSelectedEntrySection(formData)?.group_name || "-",
    },
    {
      name: "selected_lesson_type",
      label: t("lessonType"),
      type: "computed",
      render: (formData) => {
        const lessonType = getSelectedEntrySection(formData)?.lesson_type;
        return lessonType ? t(lessonType) : "-";
      },
    },
    {
      name: "subgroup",
      label: t("subgroupMode"),
      type: "select",
      placeholder: t("selectSubgroup"),
      options: [
        { value: "", label: t("none") },
        { value: "A", label: "A" },
        { value: "B", label: "B" },
      ],
      onChange: () => ({
        room_id: "",
        weekday: "",
        start_hour: "",
      }),
    },
    {
      name: "semester",
      label: t("semester"),
      type: "select",
      placeholder: t("semester"),
      options: SCHEDULE_SEMESTER_OPTIONS.map((item) => ({
        value: item.value,
        label: t(item.labelKey),
      })),
      onChange: () => ({
        room_id: "",
        weekday: "",
        start_hour: "",
      }),
      required: true,
    },
    {
      name: "year",
      label: t("year"),
      type: "number",
      placeholder: String(new Date().getFullYear()),
      onChange: () => ({
        room_id: "",
        weekday: "",
        start_hour: "",
      }),
      required: true,
    },
    {
      name: "weekday",
      label: t("day"),
      type: "select",
      placeholder: t("selectDay"),
      options: getAvailableWeekdayOptions,
      onChange: () => ({
        room_id: "",
        start_hour: "",
      }),
      disabled: (formData) =>
        !formData.section_id ||
        !formData.semester ||
        !formData.year ||
        getAvailableWeekdayOptions(formData).length === 0,
      required: true,
    },
    {
      name: "start_hour",
      label: t("startTime"),
      type: "select",
      placeholder: t("startTime"),
      options: getAvailableStartHourOptions,
      onChange: () => ({
        room_id: "",
      }),
      disabled: (formData) =>
        !formData.section_id ||
        !formData.weekday ||
        getAvailableStartHourOptions(formData).length === 0,
      required: true,
    },
    {
      name: "room_id",
      label: t("roomNumber"),
      type: "select",
      placeholder: t("selectRoom"),
      options: getAvailableRoomOptions,
      disabled: (formData) =>
        !formData.section_id ||
        !formData.weekday ||
        !formData.start_hour ||
        getAvailableRoomOptions(formData).length === 0,
      required: true,
    },
  ];

  const scheduleColumns = [
    {
      key: "course_name",
      label: t("courseName"),
    },
    {
      key: "group_name",
      label: t("groupNumber"),
      render: (value, row) => `${value}${row.subgroup ? ` • ${row.subgroup}` : ""}`,
    },
    {
      key: "teacher_name",
      label: t("teacherName"),
    },
    {
      key: "room_number",
      label: t("roomNumber"),
      render: (value, row) =>
        `${value}${
          row.room_programme_mismatch ? ` (${t("externalProgrammeRoom")})` : ""
        }${
          row.relocated_from_room_number
            ? ` • ${t("movedFromRoom")} ${row.relocated_from_room_number}`
            : ""
        }`,
    },
    {
      key: "day",
      label: t("day"),
      render: (value) => t(getWeekdayValue(value)),
    },
    {
      key: "start_hour",
      label: t("startTime"),
      render: (value) => formatLessonTimeRange(value),
    },
    {
      key: "semester",
      label: t("semester"),
    },
    {
      key: "year",
      label: t("year"),
    },
  ];

  const scheduleActionLabel = t("generateSchedule");
  const activeGenerationSemester = Number(activeGenerationJob?.semester || 0);
  const hasGeneratedScheduleForSemester = (semester) =>
    (schedulesBySemester[semester] || []).length > 0;
  const getSemesterGenerationStatus = (semester) => {
    if (activeGenerationJob && activeGenerationSemester === Number(semester)) {
      return activeGenerationJob.status || "running";
    }

    return hasGeneratedScheduleForSemester(semester) ? "completed" : "";
  };
  const getGenerationStatusLabel = (status) =>
    status === "completed"
      ? t("scheduleGenerationCompleted")
      : status === "failed"
        ? t("scheduleGenerationFailed")
        : t("scheduleGenerationInProgress");
  const generationStatusLabel = getGenerationStatusLabel(
    activeGenerationJob?.status || "running",
  );

  const renderGenerationStatusButton = (semester) => {
    const status = getSemesterGenerationStatus(semester);

    if (!status) {
      return null;
    }

    const Icon =
      status === "completed"
        ? BadgeCheck
        : status === "failed"
          ? AlertCircle
          : Sparkles;
    const className =
      status === "completed"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        : status === "failed"
          ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100";
    const label = getGenerationStatusLabel(status);

    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          if (
            !activeGenerationJob ||
            activeGenerationSemester !== Number(semester)
          ) {
            setActiveGenerationJob({
              semester,
              year: scheduleYear,
              status: "completed",
              result: {
                scheduleCount: (schedulesBySemester[semester] || []).length,
              },
              error: null,
              items: [],
            });
          }
          setIsGenerationStatusOpen(true);
        }}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-xs font-medium shadow-sm transition ${className}`}
        title={label}
        aria-label={label}
      >
        <Icon
          size={18}
          className={status === "completed" || status === "failed" ? "" : "animate-spin"}
        />
      </button>
    );
  };

  const renderFilterControls = (semester, semesterSchedule) => {
    const draftFilters = draftFiltersBySemester[semester] || EMPTY_SCHEDULE_FILTERS;

    return (
      <>
        <select
          value={draftFilters.group}
          onChange={(event) => updateDraftFilter(semester, "group", event.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
        >
          <option value="">
            {t("all")} {t("groups").toLowerCase()}
          </option>

          {Array.from(
            new Map(
              semesterSchedule
                .filter((entry) => entry.group_id)
                .map((entry) => [entry.group_id, entry.group_name]),
            ).entries(),
          ).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>

        <select
          value={draftFilters.teacher}
          onChange={(event) => updateDraftFilter(semester, "teacher", event.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
        >
          <option value="">
            {t("all")} {t("teachers").toLowerCase()}
          </option>

          {Array.from(
            new Map(
              semesterSchedule
                .filter((entry) => entry.teacher_id)
                .map((entry) => [entry.teacher_id, entry.teacher_name]),
            ).entries(),
          ).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>

        <select
          value={draftFilters.room}
          onChange={(event) => updateDraftFilter(semester, "room", event.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
        >
          <option value="">
            {t("all")} {t("rooms").toLowerCase()}
          </option>

          {Array.from(
            new Map(
              semesterSchedule
                .filter((entry) => entry.room_id)
                .map((entry) => [entry.room_id, entry.room_number]),
            ).entries(),
          ).map(([id, number]) => (
            <option key={id} value={id}>
              {number}
            </option>
          ))}
        </select>

        <select
          value={draftFilters.day}
          onChange={(event) => updateDraftFilter(semester, "day", event.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
        >
          <option value="">
            {t("all")} {t("day").toLowerCase()}
          </option>

          {WEEKDAY_OPTIONS.map((day) => (
            <option key={day.value} value={day.value}>
              {t(day.labelKey)}
            </option>
          ))}
        </select>
      </>
    );
  };

  return (
    <div className="relative w-full px-0 py-2 sm:py-4">
      {isGenerationStatusOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="w-[min(92vw,420px)] rounded-2xl border border-blue-100 bg-white px-6 py-5 text-center shadow-xl">
            {activeGenerationJob?.status === "completed" ? (
              <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
            ) : activeGenerationJob?.status === "failed" ? (
              <AlertCircle size={32} className="mx-auto text-red-600" />
            ) : (
              <Loader2
                size={32}
                className="mx-auto animate-spin text-[#014531]"
              />
            )}
            <p className="mt-3 text-sm font-semibold text-gray-900">
              {generationStatusLabel}
            </p>
            {activeGenerationJob ? (
              <p className="mt-1 text-xs text-gray-500">
                {t("semester")}: {activeGenerationJob.semester}. {t("year")}:{" "}
                {activeGenerationJob.year}. {t("algorithm")}:{" "}
                {activeGenerationJob.algorithm || "-"}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">{t("loading")}</p>
            )}
            {activeGenerationJob?.result?.scheduleCount !== undefined ? (
              <p className="mt-2 text-sm text-emerald-700">
                {t("scheduleEntries")}: {activeGenerationJob.result.scheduleCount}
              </p>
            ) : null}
            {activeGenerationJob?.error ? (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-left text-sm text-red-700">
                {activeGenerationJob.error}
              </div>
            ) : null}
            {activeGenerationJob?.items?.length ? (
              <ul className="mt-3 max-h-40 list-disc space-y-1 overflow-y-auto pl-5 text-left text-xs text-gray-700">
                {activeGenerationJob.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {activeGenerationJob?.status !== "completed" &&
            activeGenerationJob?.status !== "failed" ? (
              <p className="mt-3 text-xs text-gray-500">
                {t("scheduleGenerationBackgroundHint")}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => setIsGenerationStatusOpen(false)}
              className="mt-4 w-full rounded-md bg-[#014531] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#013726]"
            >
              {t("close")}
            </button>
          </div>
        </div>
      ) : null}

      <div
        data-testid="schedule-toolbar"
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {t("scheduleMgmt")}
        </h1>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
          {isAdmin ? (
            <>
              <button
                onClick={() => setIsGenerateOpen(true)}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                <RotateCw size={20} /> {scheduleActionLabel}
              </button>

              <button
                onClick={handleAddEntry}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 sm:w-auto"
              >
                <Plus size={20} /> {t("addScheduleEntry")}
              </button>

              {hasAnyScheduleForYear ? (
                <button
                  onClick={openExportScheduleModal}
                  disabled={isExporting || isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-[#014531] px-4 py-2 text-white transition hover:bg-[#02704e] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  <Download size={20} /> {t("exportSchedule")}
                </button>
              ) : null}

              <button
                onClick={openResetScheduleModal}
                disabled={isResetting || isLoading || !hasAnyScheduleForYear}
                className="w-full rounded-md bg-red-600 px-4 py-2 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {t("resetSchedule")}
              </button>
            </>
          ) : null}
        </div>
      </div>

      {pageError ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {pageError}
        </div>
      ) : null}

      <div className="space-y-6">
        {SCHEDULE_SEMESTER_OPTIONS.map((semesterOption) => {
          const semester = semesterOption.value;
          const semesterSchedule = schedulesBySemester[semester] || [];
          const filteredSemesterSchedule = filteredSchedulesBySemester[semester] || [];
          const isExpanded = expandedSemesters[semester] !== false;

          return (
            <section key={semester} className="rounded-lg bg-white p-4 shadow-md sm:p-6">
              <button
                type="button"
                onClick={() => toggleSemesterExpanded(semester)}
                className="flex w-full items-center justify-between gap-3 text-left"
                aria-expanded={isExpanded}
              >
                <span className="text-xl font-semibold text-gray-900">
                  {t(semesterOption.labelKey)}
                </span>
                <span className="flex items-center gap-3">
                  {renderGenerationStatusButton(semester)}
                  <ChevronDown
                    size={20}
                    className={`text-gray-500 transition ${isExpanded ? "rotate-180" : ""}`}
                  />
                </span>
              </button>

              {isExpanded ? (
                <div className="mt-4">
                  {semesterSchedule.length > 0 ? (
                    <TimetableGrid schedule={filteredSemesterSchedule} />
                  ) : (
                    <div className="py-12 text-center text-gray-500">
                      <RotateCw size={48} className="mx-auto mb-4 opacity-50" />
                      <p>{t("scheduleNotCreated")}</p>
                    </div>
                  )}

                  {isAdmin ? (
                    <div className="mt-6">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {t("manageScheduleEntries")}
                        </h3>
                      </div>

                      <DataTable
                        columns={scheduleColumns}
                        data={filteredSemesterSchedule}
                        onEdit={handleEditEntry}
                        onDelete={handleDeleteEntry}
                        isLoading={false}
                        enableSearch
                        hasActiveFilters={hasActiveEntryFilters(semester)}
                        filterDialogTitle={t("filter")}
                        onApplyFilters={() => applyFilters(semester)}
                        onResetFilters={() => resetFilters(semester)}
                        filterControls={renderFilterControls(semester, semesterSchedule)}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      <Modal
        isOpen={isGenerateOpen}
        onClose={() => {
          if (!isLoading) {
            setIsGenerateOpen(false);
          }
        }}
        title={scheduleActionLabel}
        size="md"
      >
        <div className="mb-4 rounded-md border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          <h3 className="font-semibold text-emerald-950">
            {t("scheduleGenerationInfoTitle")}
          </h3>
          <p className="mt-2">{t("scheduleGenerationInfoIntro")}</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>{t("scheduleGenerationGreedyInfo")}</li>
            <li>{t("scheduleGenerationCpSatInfo")}</li>
            <li>{t("scheduleGenerationHybridInfo")}</li>
          </ul>
          <p className="mt-3 font-medium">{t("scheduleGenerationInfoNote")}</p>
        </div>

        <Form
          fields={formFields}
          onSubmit={handleGenerateSchedule}
          resetKey="schedule-generate"
          submitText={t("generateSchedule")}
          isLoading={isLoading}
          initialValues={{
            semester: scheduleSemester,
            year: scheduleYear,
            algorithm: "greedy",
          }}
        />
      </Modal>

      <Modal
        isOpen={Boolean(generationError)}
        onClose={() => setGenerationError(null)}
        title={generationError?.title || t("errorGenerateSchedule")}
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {generationError?.message}
          </div>

          {generationError?.items?.length ? (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-900">
                {t("description")}
              </p>

              <ul className="list-disc space-y-2 pl-5 text-sm text-gray-700">
                {generationError.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setGenerationError(null)}
            className="w-full rounded-md bg-[#014531] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#013726]"
          >
            {t("close")}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isExportModalOpen}
        onClose={() => {
          if (!isExporting) {
            setIsExportModalOpen(false);
          }
        }}
        title={t("exportSchedule")}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("semester")}
            </label>
            <select
              value={exportSemester}
              onChange={(event) => setExportSemester(Number(event.target.value))}
              disabled={isExporting}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
            >
              {SCHEDULE_SEMESTER_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {t(item.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("year")}
            </label>
            <input
              type="number"
              value={exportYear}
              onChange={(event) => setExportYear(Number(event.target.value) || currentYear)}
              disabled={isExporting}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("exportLanguage")}
            </label>
            <select
              value={exportLanguage}
              onChange={(event) => setExportLanguage(event.target.value)}
              disabled={isExporting}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="ru">{t("languageRussian")}</option>
              <option value="kk">{t("languageKazakh")}</option>
              <option value="en">{t("languageEnglish")}</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("selectGroup")}
            </label>
            <select
              value={exportGroupId}
              onChange={(event) => setExportGroupId(event.target.value)}
              disabled={isExporting}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">
                {t("all")} {t("groups").toLowerCase()}
              </option>
              {exportGroupOptions.map(([groupId, groupName]) => (
                <option key={groupId} value={groupId}>
                  {groupName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setIsExportModalOpen(false)}
              disabled={isExporting}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={handleExportSchedule}
              disabled={isExporting}
              className="rounded-md bg-[#014531] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#02704e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isExporting ? t("loading") : t("exportSchedule")}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isResetModalOpen}
        onClose={() => {
          if (!isResetting) {
            setIsResetModalOpen(false);
          }
        }}
        title={t("resetSchedule")}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("semester")}
            </label>
            <select
              value={resetSemester}
              onChange={(event) => setResetSemester(Number(event.target.value))}
              disabled={isResetting}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
            >
              {SCHEDULE_SEMESTER_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {t(item.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("year")}
            </label>
            <input
              type="number"
              value={resetYear}
              onChange={(event) => setResetYear(Number(event.target.value) || currentYear)}
              disabled={isResetting}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>

          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {t("confirmResetSchedule")}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              disabled={isResetting}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={handleResetSchedule}
              disabled={isResetting}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isResetting ? t("loading") : t("resetSchedule")}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isEntryModalOpen}
        onClose={() => {
          if (!isLoading) {
            setIsEntryModalOpen(false);
          }
        }}
        title={editingEntry ? t("editScheduleEntry") : t("addScheduleEntry")}
        size="md"
      >
        <Form
          fields={entryFields}
          onSubmit={handleEntrySubmit}
          resetKey={
            editingEntry
              ? `schedule-entry-${editingEntry.id}`
              : "schedule-entry-new"
          }
          submitText={editingEntry ? t("save") : t("add")}
          isLoading={isEntrySaving}
          isSubmitDisabled={isEntryFormBlocked}
          submitHint={entryFormHint}
          initialValues={
            editingEntry
              ? {
                  ...editingEntry,
                  section_id: editingEntry.section_id || "",
                  room_id: editingEntry.room_id || "",
                  start_hour: editingEntry.start_hour || "",
                  semester: editingEntry.semester || 1,
                  year: editingEntry.year || new Date().getFullYear(),
                  subgroup: editingEntry.subgroup || "",
                  weekday: editingEntry.weekday || "monday",
                }
              : {
                  start_hour: "",
                  semester: scheduleSemester,
                  year: scheduleYear,
                  subgroup: "",
                  weekday: "",
                }
          }
        />
      </Modal>
    </div>
  );
};

export default SchedulePage;

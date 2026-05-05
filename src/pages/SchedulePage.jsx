import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildScheduleGenerationEventsUrl, scheduleAPI } from "../services/api";
import {
  useScheduleGenerationJobQuery,
  useSchedulePageQueries,
} from "../api/scheduleQueries";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";
import { useAutoDismiss } from "../hooks/useAutoDismiss";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import { useScheduleGenerationStore } from "../stores/scheduleGenerationStore";
import { formatLessonTimeRange } from "../utils/timeSlots";
import { formatGenerationError } from "../features/schedule/generationErrors";
import { GenerationStatusButton } from "../features/schedule/components/GenerationStatusButton";
import { GenerationStatusModal } from "../features/schedule/components/GenerationStatusModal";
import { GenerateScheduleModal } from "../features/schedule/components/GenerateScheduleModal";
import { GenerationErrorModal } from "../features/schedule/components/GenerationErrorModal";
import { ExportScheduleModal } from "../features/schedule/components/ExportScheduleModal";
import { ResetScheduleModal } from "../features/schedule/components/ResetScheduleModal";
import { ScheduleFilterControls } from "../features/schedule/components/ScheduleFilterControls";
import { ScheduleToolbar } from "../features/schedule/components/ScheduleToolbar";
import { ScheduleEntryModal } from "../features/schedule/components/ScheduleEntryModal";
import { ScheduleSemesterSection } from "../features/schedule/components/ScheduleSemesterSection";
import {
  getWeekdayValue,
  toIsoDateForWeekday,
} from "../features/schedule/dateUtils";
import { createScheduleEntryAvailability } from "../features/schedule/entryAvailability";
import { filterScheduleEntries } from "../features/schedule/scheduleFilters";
import {
  EMPTY_SCHEDULE_FILTERS,
  GENERATION_POLL_TIMEOUT_MS,
  SCHEDULE_ALGORITHM_OPTIONS,
  SCHEDULE_SEMESTER_OPTIONS,
  createEmptyScheduleFiltersBySemester,
} from "../features/schedule/constants";

export const SchedulePage = () => {
  const { t, language } = useTranslation();
  const { confirm, ConfirmDialog } = useConfirmDialog();
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
  const activeGenerationJob = useScheduleGenerationStore((state) => state.activeJob);
  const setActiveGenerationJob = useScheduleGenerationStore((state) => state.setActiveJob);
  const isGenerationStatusOpen = useScheduleGenerationStore((state) => state.isStatusOpen);
  const setIsGenerationStatusOpen = useScheduleGenerationStore(
    (state) => state.setStatusOpen,
  );
  const [isEntrySaving, setIsEntrySaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [pageError, setPageError] = useState("");
  const [isGenerationEventsConnected, setIsGenerationEventsConnected] =
    useState(false);
  const activeGenerationJobRef = useRef(null);
  const completedGenerationJobRef = useRef(null);

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

  const {
    schedulesQuery,
    sectionsQuery,
    roomsQuery,
    groupsQuery,
    roomBlocksQuery,
    coursesQuery,
    teachersQuery,
  } = useSchedulePageQueries(scheduleYear, isAdmin);
  const isActiveGenerationJobPolling =
    activeGenerationJob?.jobId &&
    !["completed", "failed"].includes(activeGenerationJob?.status);
  const generationJobQuery = useScheduleGenerationJobQuery(
    activeGenerationJob?.jobId,
    isActiveGenerationJobPolling && !isGenerationEventsConnected,
  );

  useAutoDismiss(pageError, setPageError);

  useEffect(() => {
    activeGenerationJobRef.current = activeGenerationJob;
  }, [activeGenerationJob]);

  useEffect(() => {
    if (schedulesQuery.data) {
      setSchedule(schedulesQuery.data);
    }
  }, [schedulesQuery.data]);

  const sections = Array.isArray(sectionsQuery.data) ? sectionsQuery.data : [];
  const rooms = Array.isArray(roomsQuery.data) ? roomsQuery.data : [];
  const groups = Array.isArray(groupsQuery.data) ? groupsQuery.data : [];
  const roomBlocks = Array.isArray(roomBlocksQuery.data) ? roomBlocksQuery.data : [];
  const courses = Array.isArray(coursesQuery.data) ? coursesQuery.data : [];
  const teachers = Array.isArray(teachersQuery.data) ? teachersQuery.data : [];

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

  const refreshSchedule = useCallback(async () => {
    const result = await schedulesQuery.refetch();
    const nextSchedule = result.data || [];

    setSchedule(nextSchedule || []);

    return nextSchedule || [];
  }, [schedulesQuery]);

  useEffect(() => {
    if (!isActiveGenerationJobPolling || !activeGenerationJob?.startedAt) {
      return;
    }

    if (
      Date.now() - Number(activeGenerationJob.startedAt) <=
      GENERATION_POLL_TIMEOUT_MS
    ) {
      return;
    }

    setActiveGenerationJob((current) => ({
      ...(current || activeGenerationJob),
      status: "failed",
      progress: null,
      error: t("scheduleGenerationPollingTimeout"),
      items: [],
    }));
    setIsLoading(false);
  }, [
    activeGenerationJob,
    isActiveGenerationJobPolling,
    setActiveGenerationJob,
    t,
  ]);

  useEffect(() => {
    if (!isActiveGenerationJobPolling || !activeGenerationJob?.jobId) {
      setIsGenerationEventsConnected(false);
      return undefined;
    }

    const eventsUrl = buildScheduleGenerationEventsUrl(activeGenerationJob.jobId);
    if (!eventsUrl) {
      setIsGenerationEventsConnected(false);
      return undefined;
    }

    const events = new EventSource(eventsUrl);
    events.onopen = () => setIsGenerationEventsConnected(true);
    events.onerror = () => {
      setIsGenerationEventsConnected(false);
      events.close();
    };
    events.addEventListener("status", (event) => {
      const job = JSON.parse(event.data || "{}");
      const currentJob = activeGenerationJobRef.current;

      if (job.status === "completed") {
        setActiveGenerationJob((current) => ({
          ...(current || currentJob),
          status: "completed",
          result: job.result || null,
          progress: job.progress || null,
          error: null,
          items: [],
        }));
        setIsLoading(false);

        if (completedGenerationJobRef.current !== job.jobId) {
          completedGenerationJobRef.current = job.jobId;
          refreshSchedule();
        }
        events.close();
        setIsGenerationEventsConnected(false);
        return;
      }

      if (job.status === "failed") {
        const formattedError = formatGenerationError(job, t);
        setActiveGenerationJob((current) => ({
          ...(current || currentJob),
          status: "failed",
          progress: job.progress || null,
          error: formattedError.message || t("errorGenerateSchedule"),
          items: Array.isArray(formattedError.items) ? formattedError.items : [],
        }));
        setGenerationError({
          title: t("errorGenerateSchedule"),
          message: formattedError.message || t("errorUnknown"),
          items: Array.isArray(formattedError.items) ? formattedError.items : [],
        });
        setIsLoading(false);
        events.close();
        setIsGenerationEventsConnected(false);
        return;
      }

      setActiveGenerationJob((current) => ({
        ...(current || currentJob),
        status: job.status || "running",
        progress: job.progress || null,
        error: null,
      }));
    });

    return () => {
      events.close();
      setIsGenerationEventsConnected(false);
    };
  }, [
    activeGenerationJob?.jobId,
    isActiveGenerationJobPolling,
    refreshSchedule,
    setActiveGenerationJob,
    t,
  ]);

  useEffect(() => {
    const job = generationJobQuery.data;

    if (!job || !activeGenerationJob?.jobId) {
      return;
    }

    if (job.status === "completed") {
      setActiveGenerationJob((current) => ({
        ...(current || activeGenerationJob),
        status: "completed",
        result: job.result || null,
        progress: job.progress || null,
        error: null,
        items: [],
      }));
      setIsLoading(false);

      if (completedGenerationJobRef.current !== job.jobId) {
        completedGenerationJobRef.current = job.jobId;
        refreshSchedule();
      }
      return;
    }

    if (job.status === "failed") {
      const formattedError = formatGenerationError(job, t);
      setActiveGenerationJob((current) => ({
        ...(current || activeGenerationJob),
        status: "failed",
        progress: job.progress || null,
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
      ...(current || activeGenerationJob),
      status: job.status || "running",
      progress: job.progress || null,
      error: null,
    }));
  }, [
    activeGenerationJob,
    generationJobQuery.data,
    refreshSchedule,
    setActiveGenerationJob,
    t,
  ]);

  useEffect(() => {
    if (!generationJobQuery.error || !isActiveGenerationJobPolling) {
      return;
    }

    console.error(t("errorGenerateSchedule"), generationJobQuery.error);
    setActiveGenerationJob((current) => ({
      ...(current || activeGenerationJob),
      status: "running",
      progress: null,
      error: generationJobQuery.error.message || t("errorUnknown"),
    }));
  }, [
    activeGenerationJob,
    generationJobQuery.error,
    isActiveGenerationJobPolling,
    setActiveGenerationJob,
    t,
  ]);

  const handleGenerateSchedule = async (formData, setErrors) => {
    try {
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
        progress: null,
        items: [],
      };

      setActiveGenerationJob(metadata);
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
    const confirmed = await confirm({
      message: t("confirmDeleteScheduleEntry"),
      confirmLabel: t("delete"),
    });
    if (!confirmed) {
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

  const {
    getAvailableRoomOptions,
    getAvailableStartHourOptions,
    getAvailableWeekdayOptions,
    getSelectedEntrySection,
  } = createScheduleEntryAvailability({
    sections,
    courses,
    groups,
    rooms,
    roomBlocks,
    schedule,
    editingEntry,
    t,
  });

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

    return (
      <GenerationStatusButton
        status={status}
        label={getGenerationStatusLabel(status)}
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
      />
    );
  };

  const renderFilterControls = (semester, semesterSchedule) => {
    return (
      <ScheduleFilterControls
        t={t}
        semester={semester}
        semesterSchedule={semesterSchedule}
        draftFilters={draftFiltersBySemester[semester]}
        onChange={updateDraftFilter}
      />
    );
  };

  return (
    <div className="relative w-full px-0 py-2 sm:py-4">
      <ConfirmDialog />
      {isGenerationStatusOpen ? (
        <GenerationStatusModal
          job={activeGenerationJob}
          label={generationStatusLabel}
          t={t}
          onClose={() => setIsGenerationStatusOpen(false)}
        />
      ) : null}

      <ScheduleToolbar
        t={t}
        isAdmin={isAdmin}
        isLoading={isLoading}
        isExporting={isExporting}
        isResetting={isResetting}
        hasAnyScheduleForYear={hasAnyScheduleForYear}
        scheduleActionLabel={scheduleActionLabel}
        onGenerate={() => setIsGenerateOpen(true)}
        onAddEntry={handleAddEntry}
        onExport={openExportScheduleModal}
        onReset={openResetScheduleModal}
      />

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
            <ScheduleSemesterSection
              key={semester}
              t={t}
              isAdmin={isAdmin}
              title={t(semesterOption.labelKey)}
              isExpanded={isExpanded}
              semesterSchedule={semesterSchedule}
              filteredSemesterSchedule={filteredSemesterSchedule}
              scheduleColumns={scheduleColumns}
              hasActiveFilters={hasActiveEntryFilters(semester)}
              filterControls={renderFilterControls(semester, semesterSchedule)}
              generationStatusButton={renderGenerationStatusButton(semester)}
              onToggleExpanded={() => toggleSemesterExpanded(semester)}
              onEditEntry={handleEditEntry}
              onDeleteEntry={handleDeleteEntry}
              onApplyFilters={() => applyFilters(semester)}
              onResetFilters={() => resetFilters(semester)}
            />
          );
        })}
      </div>

      <GenerateScheduleModal
        isOpen={isGenerateOpen}
        isLoading={isLoading}
        title={scheduleActionLabel}
        t={t}
        fields={formFields}
        initialValues={{
          semester: scheduleSemester,
          year: scheduleYear,
          algorithm: "greedy",
        }}
        onClose={() => setIsGenerateOpen(false)}
        onSubmit={handleGenerateSchedule}
      />

      <GenerationErrorModal
        error={generationError}
        t={t}
        onClose={() => setGenerationError(null)}
      />

      <ExportScheduleModal
        isOpen={isExportModalOpen}
        isExporting={isExporting}
        t={t}
        currentYear={currentYear}
        semester={exportSemester}
        year={exportYear}
        language={exportLanguage}
        groupId={exportGroupId}
        groupOptions={exportGroupOptions}
        onClose={() => setIsExportModalOpen(false)}
        onSemesterChange={setExportSemester}
        onYearChange={setExportYear}
        onLanguageChange={setExportLanguage}
        onGroupChange={setExportGroupId}
        onSubmit={handleExportSchedule}
      />

      <ResetScheduleModal
        isOpen={isResetModalOpen}
        isResetting={isResetting}
        t={t}
        currentYear={currentYear}
        semester={resetSemester}
        year={resetYear}
        onClose={() => setIsResetModalOpen(false)}
        onSemesterChange={setResetSemester}
        onYearChange={setResetYear}
        onSubmit={handleResetSchedule}
      />

      <ScheduleEntryModal
        isOpen={isEntryModalOpen}
        isLoading={isLoading}
        isSaving={isEntrySaving}
        isBlocked={isEntryFormBlocked}
        hint={entryFormHint}
        editingEntry={editingEntry}
        fields={entryFields}
        scheduleSemester={scheduleSemester}
        scheduleYear={scheduleYear}
        t={t}
        onClose={() => setIsEntryModalOpen(false)}
        onSubmit={handleEntrySubmit}
      />
    </div>
  );
};

export default SchedulePage;

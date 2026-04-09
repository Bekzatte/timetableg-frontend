import { useEffect, useMemo, useState } from "react";
import { Download, Plus, RotateCw } from "lucide-react";
import TimetableGrid from "../components/timetable/TimetableGrid";
import DataTable from "../components/ui/DataTable";
import Modal from "../components/ui/Modal";
import Form from "../components/ui/Form";
import {
  adminAPI,
  courseAPI,
  roomAPI,
  scheduleAPI,
  sectionAPI,
  teacherAPI,
} from "../services/api";
import { useFetch } from "../hooks/useAPI";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";
import { useAutoDismiss } from "../hooks/useAutoDismiss";

const WEEKDAY_OPTIONS = [
  { value: "monday", labelKey: "monday" },
  { value: "tuesday", labelKey: "tuesday" },
  { value: "wednesday", labelKey: "wednesday" },
  { value: "thursday", labelKey: "thursday" },
  { value: "friday", labelKey: "friday" },
];

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

const toIsoDateForWeekday = (weekday, year) => {
  const today = new Date();
  const anchor = new Date(year, today.getMonth(), today.getDate());
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - ((anchor.getDay() + 6) % 7));
  const weekdayIndex = WEEKDAY_OPTIONS.findIndex((item) => item.value === weekday);
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

const formatGenerationError = (job, t) => {
  const translationKey = job?.errorCode
    ? JOB_ERROR_CODE_TRANSLATION_KEYS[job.errorCode]
    : null;
  const firstIssue = job.details?.issues?.[0];
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
    if (normalizedReason.includes("pccount") || normalizedReason.includes("компьют")) {
      items.push(t("errorGenerationComputersHint"));
    }
    if (normalizedReason.includes("временн") || normalizedReason.includes("слотов")) {
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

export const SchedulePage = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEntrySaving, setIsEntrySaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [pageError, setPageError] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [draftGroupFilter, setDraftGroupFilter] = useState("");
  const [draftTeacherFilter, setDraftTeacherFilter] = useState("");
  const [draftRoomFilter, setDraftRoomFilter] = useState("");
  const [draftDayFilter, setDraftDayFilter] = useState("");
  const { data, execute } = useFetch(scheduleAPI.getAll);
  const { data: sectionsData, execute: executeSections } = useFetch(sectionAPI.getAll);
  const { data: roomsData, execute: executeRooms } = useFetch(roomAPI.getAll);
  const { data: coursesData, execute: executeCourses } = useFetch(courseAPI.getAll);
  const { data: teachersData, execute: executeTeachers } = useFetch(teacherAPI.getAll);
  useAutoDismiss(pageError, setPageError);

  useEffect(() => {
    if (data) {
      setSchedule(data);
    }
  }, [data]);

  useEffect(() => {
    execute();
    if (isAdmin) {
      executeSections();
      executeRooms();
      executeCourses();
      executeTeachers();
    }
  }, [execute, executeCourses, executeRooms, executeSections, executeTeachers, isAdmin]);

  const sections = Array.isArray(sectionsData) ? sectionsData : [];
  const rooms = Array.isArray(roomsData) ? roomsData : [];
  const courses = Array.isArray(coursesData) ? coursesData : [];
  const teachers = Array.isArray(teachersData) ? teachersData : [];
  const hasAssignedCourseTeacher = courses.some((course) => course.instructor_id);
  const isEntryFormBlocked =
    sections.length === 0 ||
    rooms.length === 0 ||
    courses.length === 0 ||
    teachers.length === 0 ||
    !hasAssignedCourseTeacher;
  const entryFormHint =
    sections.length === 0
      ? t("scheduleEntriesNeedSectionsFirst")
      : rooms.length === 0
        ? t("scheduleEntriesNeedRoomsFirst")
        : courses.length === 0
          ? t("scheduleEntriesNeedCoursesFirst")
          : teachers.length === 0 || !hasAssignedCourseTeacher
            ? t("scheduleEntriesNeedAssignedTeachers")
            : "";
  const filteredSchedule = useMemo(
    () =>
      schedule.filter((entry) => {
        const matchesGroup = !groupFilter || String(entry.group_id) === groupFilter;
        const matchesTeacher = !teacherFilter || String(entry.teacher_id) === teacherFilter;
        const matchesRoom = !roomFilter || String(entry.room_id) === roomFilter;
        const matchesDay = !dayFilter || getWeekdayValue(entry.day) === dayFilter;
        return matchesGroup && matchesTeacher && matchesRoom && matchesDay;
      }),
    [schedule, groupFilter, teacherFilter, roomFilter, dayFilter],
  );
  const hasActiveEntryFilters = Boolean(groupFilter || teacherFilter || roomFilter || dayFilter);

  const waitForGenerationJob = async (jobId) => {
    while (true) {
      const job = await scheduleAPI.getGenerationJob(jobId);
      if (job.status === "completed") {
        return job;
      }
      if (job.status === "failed") {
        throw formatGenerationError(job, t);
      }
      await new Promise((resolve) => window.setTimeout(resolve, 2500));
    }
  };

  const refreshSchedule = async () => {
    const nextSchedule = await execute();
    setSchedule(nextSchedule || []);
    return nextSchedule || [];
  };

  const handleGenerateSchedule = async (formData, setErrors) => {
    try {
      setGenerationError(null);
      setPageError("");
      setIsGenerateOpen(false);
      setIsLoading(true);
      const job = await scheduleAPI.generate(formData);
      await waitForGenerationJob(job.jobId);
      await refreshSchedule();
    } catch (error) {
      console.error(t("errorGenerateSchedule"), error);
      setGenerationError({
        title: t("errorGenerateSchedule"),
        message: error.message || t("errorUnknown"),
        items: Array.isArray(error.items) ? error.items : [],
      });
      setErrors((prev) => ({
        ...prev,
        error: error.message,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSchedule = async () => {
    if (!window.confirm(t("confirmResetSchedule"))) {
      return;
    }

    try {
      setIsResetting(true);
      setPageError("");
      await adminAPI.clearCollection("schedules");
      setSchedule([]);
      await execute();
    } catch (error) {
      console.error(t("errorResetSchedule"), error);
      setPageError(error.message || t("errorResetSchedule"));
    } finally {
      setIsResetting(false);
    }
  };

  const handleExportSchedule = async () => {
    try {
      setIsExporting(true);
      setPageError("");
      const blob = await scheduleAPI.exportExcel();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "schedule-export.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
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

  const handleEntrySubmit = async (formData, setErrors) => {
    const selectedSection = sections.find(
      (section) => String(section.id) === String(formData.section_id),
    );
    const selectedRoom = rooms.find((room) => String(room.id) === String(formData.room_id));
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
      const normalizedYear = Number(formData.year);
      const payload = {
        section_id: Number(selectedSection.id),
        course_id: Number(selectedSection.course_id),
        course_name: selectedSection.course_name,
        teacher_id: selectedCourse.instructor_id ? Number(selectedCourse.instructor_id) : null,
        teacher_name: selectedCourse.instructor_name || "",
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

      if (editingEntry) {
        await scheduleAPI.update(editingEntry.id, payload);
      } else {
        await scheduleAPI.create(payload);
      }

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
      label: t("semester"),
      type: "select",
      placeholder: t("semester"),
      options: [
        { value: 1, label: "1" },
        { value: 2, label: "2" },
      ],
      required: true,
    },
    {
      name: "year",
      label: t("year"),
      type: "number",
      placeholder: "2026",
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
      required: true,
    },
    {
      name: "room_id",
      label: t("roomNumber"),
      type: "select",
      placeholder: t("selectRoom"),
      options: rooms.map((room) => ({
        value: room.id,
        label: room.number,
      })),
      required: true,
    },
    {
      name: "weekday",
      label: t("day"),
      type: "select",
      placeholder: t("selectDay"),
      options: WEEKDAY_OPTIONS.map((item) => ({
        value: item.value,
        label: t(item.labelKey),
      })),
      required: true,
    },
    {
      name: "start_hour",
      label: t("startTime"),
      type: "select",
      placeholder: t("startTime"),
      options: Array.from({ length: 10 }, (_, index) => {
        const hour = index + 8;
        return {
          value: hour,
          label: `${hour}:00`,
        };
      }),
      required: true,
    },
    {
      name: "subgroup",
      label: t("subgroup"),
      type: "select",
      placeholder: t("selectSubgroup"),
      options: [
        { value: "", label: "-" },
        { value: "A", label: "A" },
        { value: "B", label: "B" },
      ],
    },
    {
      name: "semester",
      label: t("semester"),
      type: "select",
      placeholder: t("semester"),
      options: [
        { value: 1, label: "1" },
        { value: 2, label: "2" },
      ],
      required: true,
    },
    {
      name: "year",
      label: t("year"),
      type: "number",
      placeholder: String(new Date().getFullYear()),
      required: true,
    },
  ];

  const scheduleColumns = [
    { key: "course_name", label: t("courseName") },
    { key: "group_name", label: t("groupNumber"), render: (value, row) => `${value}${row.subgroup ? ` • ${row.subgroup}` : ""}` },
    { key: "teacher_name", label: t("teacherName") },
    { key: "room_number", label: t("roomNumber") },
    { key: "day", label: t("day"), render: (value) => t(getWeekdayValue(value)) },
    { key: "start_hour", label: t("startTime"), render: (value) => `${value}:00` },
    { key: "semester", label: t("semester") },
    { key: "year", label: t("year") },
  ];

  const scheduleActionLabel =
    schedule.length > 0 ? t("regenerateSchedule") : t("generateNewSchedule");
  const displayedScheduleCount = filteredSchedule.length;

  return (
    <div className="relative w-full px-0 py-2 sm:py-4">
      {isLoading ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="rounded-2xl border border-blue-100 bg-white px-6 py-5 text-center shadow-xl">
            <RotateCw size={28} className="mx-auto animate-spin text-[#014531]" />
            <p className="mt-3 text-sm font-medium text-gray-900">
              {t("scheduleGenerationInProgress")}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {t("loading")}
            </p>
          </div>
        </div>
      ) : null}
      <div className="flex justify-between items-center mb-6 gap-3 flex-wrap">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {t("scheduleMgmt")}
        </h1>
        {isAdmin && (
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 xl:w-auto xl:grid-cols-4">
            <button
              onClick={() => setIsGenerateOpen(true)}
              disabled={isLoading}
              className="flex min-w-0 items-center justify-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCw size={20} /> {scheduleActionLabel}
            </button>
            <button
              onClick={handleAddEntry}
              disabled={isLoading}
              className="flex min-w-0 items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Plus size={20} /> {t("addScheduleEntry")}
            </button>
            {schedule.length > 0 ? (
              <button
                onClick={handleExportSchedule}
                disabled={isExporting || isLoading}
                className="flex min-w-0 items-center justify-center gap-2 rounded-md bg-[#014531] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#02704e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download size={20} /> {isExporting ? t("loading") : t("exportSchedule")}
              </button>
            ) : null}
            <button
              onClick={handleResetSchedule}
              disabled={isResetting || isLoading || schedule.length === 0}
              className="min-w-0 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isResetting ? t("loading") : t("resetSchedule")}
            </button>
          </div>
        )}
      </div>

      {pageError ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {pageError}
        </div>
      ) : null}

      <div className="rounded-lg bg-white p-4 shadow-md sm:p-6">
        {schedule.length > 0 ? (
          <TimetableGrid schedule={schedule} />
        ) : (
          <div className="text-center py-12 text-gray-500">
            <RotateCw size={48} className="mx-auto mb-4 opacity-50" />
            <p>{t("scheduleNotCreated")}</p>
            {isAdmin ? (
              <button
                type="button"
                onClick={() => setIsGenerateOpen(true)}
                className="mx-auto mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
              >
                <RotateCw size={18} /> {scheduleActionLabel}
              </button>
            ) : null}
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="mt-6 rounded-lg bg-white p-4 shadow-md sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              {t("manageScheduleEntries")}
            </h2>
            <span className="text-sm text-gray-500">
              {displayedScheduleCount}/{schedule.length}
            </span>
          </div>
          <DataTable
            columns={scheduleColumns}
            data={filteredSchedule}
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntry}
            isLoading={false}
            enableSearch
            hasActiveFilters={hasActiveEntryFilters}
            filterDialogTitle={t("filter")}
            onApplyFilters={() => {
              setGroupFilter(draftGroupFilter);
              setTeacherFilter(draftTeacherFilter);
              setRoomFilter(draftRoomFilter);
              setDayFilter(draftDayFilter);
            }}
            onResetFilters={() => {
              setDraftGroupFilter("");
              setDraftTeacherFilter("");
              setDraftRoomFilter("");
              setDraftDayFilter("");
              setGroupFilter("");
              setTeacherFilter("");
              setRoomFilter("");
              setDayFilter("");
            }}
            filterControls={
              <>
                <select
                  value={draftGroupFilter}
                  onChange={(event) => setDraftGroupFilter(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                >
                  <option value="">{t("all")} {t("groups").toLowerCase()}</option>
                  {Array.from(
                    new Map(
                      schedule
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
                  value={draftTeacherFilter}
                  onChange={(event) => setDraftTeacherFilter(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                >
                  <option value="">{t("all")} {t("teachers").toLowerCase()}</option>
                  {Array.from(
                    new Map(
                      schedule
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
                  value={draftRoomFilter}
                  onChange={(event) => setDraftRoomFilter(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                >
                  <option value="">{t("all")} {t("rooms").toLowerCase()}</option>
                  {Array.from(
                    new Map(
                      schedule
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
                  value={draftDayFilter}
                  onChange={(event) => setDraftDayFilter(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                >
                  <option value="">{t("all")} {t("day").toLowerCase()}</option>
                  {WEEKDAY_OPTIONS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {t(day.labelKey)}
                    </option>
                  ))}
                </select>
              </>
            }
          />
        </div>
      )}

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
        <Form
          fields={formFields}
          onSubmit={handleGenerateSchedule}
          resetKey={`schedule-generate-${schedule.length > 0 ? "regenerate" : "new"}`}
          submitText={schedule.length > 0 ? t("regenerateSchedule") : t("generateSchedule")}
          isLoading={isLoading}
          initialValues={{ semester: 1, year: new Date().getFullYear() }}
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
          resetKey={editingEntry ? `schedule-entry-${editingEntry.id}` : "schedule-entry-new"}
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
                  start_hour: 8,
                  semester: 1,
                  year: new Date().getFullYear(),
                  subgroup: "",
                  weekday: "monday",
                }
          }
        />
      </Modal>
    </div>
  );
};

export default SchedulePage;

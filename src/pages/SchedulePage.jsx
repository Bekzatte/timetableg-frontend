import { useEffect, useState } from "react";
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
} from "../services/api";
import { useFetch } from "../hooks/useAPI";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";

const WEEKDAY_OPTIONS = [
  { value: "monday", labelKey: "monday" },
  { value: "tuesday", labelKey: "tuesday" },
  { value: "wednesday", labelKey: "wednesday" },
  { value: "thursday", labelKey: "thursday" },
  { value: "friday", labelKey: "friday" },
];

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
  const [generationMessage, setGenerationMessage] = useState("");
  const { data, execute } = useFetch(scheduleAPI.getAll);
  const { data: sectionsData, execute: executeSections } = useFetch(sectionAPI.getAll);
  const { data: roomsData, execute: executeRooms } = useFetch(roomAPI.getAll);
  const { data: coursesData, execute: executeCourses } = useFetch(courseAPI.getAll);

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
    }
  }, [execute, executeCourses, executeRooms, executeSections, isAdmin]);

  const sections = Array.isArray(sectionsData) ? sectionsData : [];
  const rooms = Array.isArray(roomsData) ? roomsData : [];
  const courses = Array.isArray(coursesData) ? coursesData : [];

  const waitForGenerationJob = async (jobId) => {
    while (true) {
      const job = await scheduleAPI.getGenerationJob(jobId);
      if (job.status === "completed") {
        return job;
      }
      if (job.status === "failed") {
        const firstIssue = job.details?.issues?.[0];
        throw new Error(
          firstIssue?.reason ||
            job.details?.missing?.join(", ") ||
            job.error ||
            t("errorUnknown"),
        );
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
      setIsLoading(true);
      setGenerationMessage(t("scheduleGenerationInProgress"));
      const job = await scheduleAPI.generate(formData);
      await waitForGenerationJob(job.jobId);
      await refreshSchedule();
      setGenerationMessage("");
      setIsGenerateOpen(false);
    } catch (error) {
      console.error(t("errorGenerateSchedule"), error);
      setGenerationMessage("");
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
      await adminAPI.clearCollection("schedules");
      setSchedule([]);
      await execute();
    } catch (error) {
      console.error(t("errorResetSchedule"), error);
    } finally {
      setIsResetting(false);
    }
  };

  const handleExportSchedule = async () => {
    try {
      setIsExporting(true);
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
      await scheduleAPI.delete(entry.id);
      await refreshSchedule();
    } catch (error) {
      console.error(t("errorDeleteScheduleEntry"), error);
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

  return (
    <div className="w-full px-0 py-2 sm:py-4">
      <div className="flex justify-between items-center mb-6 gap-3 flex-wrap">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {t("scheduleMgmt")}
        </h1>
        {isAdmin && (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-nowrap sm:items-center">
            <button
              onClick={handleAddEntry}
              className="flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Plus size={20} /> {t("addScheduleEntry")}
            </button>
            {schedule.length > 0 ? (
              <button
                onClick={handleExportSchedule}
                disabled={isExporting}
                className="flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#014531] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#02704e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download size={20} /> {isExporting ? t("loading") : t("exportSchedule")}
              </button>
            ) : null}
            <button
              onClick={handleResetSchedule}
              disabled={isResetting}
              className="whitespace-nowrap rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isResetting ? t("loading") : t("resetSchedule")}
            </button>
            <button
              onClick={() => setIsGenerateOpen(true)}
              className="flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700"
            >
              <RotateCw size={20} /> {scheduleActionLabel}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-white p-4 shadow-md sm:p-6">
        {schedule.length > 0 ? (
          <TimetableGrid schedule={schedule} />
        ) : (
          <div className="text-center py-12 text-gray-500">
            <RotateCw size={48} className="mx-auto mb-4 opacity-50" />
            <p>{t("scheduleNotCreated")}</p>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="mt-6 rounded-lg bg-white p-4 shadow-md sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              {t("manageScheduleEntries")}
            </h2>
            <span className="text-sm text-gray-500">{schedule.length}</span>
          </div>
          <DataTable
            columns={scheduleColumns}
            data={schedule}
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntry}
            isLoading={false}
          />
        </div>
      )}

      <Modal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        title={scheduleActionLabel}
        size="md"
      >
        {generationMessage ? (
          <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
            {generationMessage}
          </div>
        ) : null}
        <Form
          fields={formFields}
          onSubmit={handleGenerateSchedule}
          submitText={schedule.length > 0 ? t("regenerateSchedule") : t("generateSchedule")}
          isLoading={isLoading}
          initialValues={{ semester: 1, year: new Date().getFullYear() }}
        />
      </Modal>

      <Modal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        title={editingEntry ? t("editScheduleEntry") : t("addScheduleEntry")}
        size="md"
      >
        <Form
          fields={entryFields}
          onSubmit={handleEntrySubmit}
          submitText={editingEntry ? t("save") : t("add")}
          isLoading={isEntrySaving}
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

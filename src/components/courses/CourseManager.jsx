import { useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCourseComponentsQuery,
  useCoursesQuery,
  useTeachersQuery,
} from "../../api/collectionQueries";
import { queryKeys } from "../../api/queryKeys";
import DataTable from "../ui/DataTable";
import Modal from "../ui/Modal";
import { useAuth } from "../../hooks/useAuth";
import { adminAPI, courseAPI, courseComponentAPI, importAPI } from "../../services/api";
import { useGlobalLoader } from "../../hooks/useGlobalLoader";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { useTranslation } from "../../hooks/useTranslation";
import { EDUCATIONAL_PROGRAMME_GROUPS } from "../../constants/educationGroups";
import {
  PROGRAMMES,
  getCanonicalProgrammeName,
  getProgrammeLabel,
} from "../../constants/programmes";

const EDITABLE_LESSON_TYPES = ["lecture", "practical", "lab", "practice", "srop"];

const emptyCourseForm = {
  code: "",
  name: "",
  programme: "",
  cycle: "",
  component: "",
  credits: "",
  hours: "",
  year: "",
  semester: "",
  department: "",
};

const emptyComponentDrafts = () =>
  EDITABLE_LESSON_TYPES.map((lessonType) => ({
    lessonType,
    hours: "",
    teacherId: "",
  }));

export const CourseManager = () => {
  const { t, language } = useTranslation();
  const { withGlobalLoader } = useGlobalLoader();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const ropFileInputRef = useRef(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRopModalOpen, setIsRopModalOpen] = useState(false);
  const [isRopPreviewLoading, setIsRopPreviewLoading] = useState(false);
  const [isRopImporting, setIsRopImporting] = useState(false);
  const [ropPreview, setRopPreview] = useState(null);
  const [ropFile, setRopFile] = useState(null);
  const [ropFileContent, setRopFileContent] = useState("");
  const [ropError, setRopError] = useState("");
  const iupFileInputRef = useRef(null);
  const [isIupModalOpen, setIsIupModalOpen] = useState(false);
  const [isIupPreviewLoading, setIsIupPreviewLoading] = useState(false);
  const [isIupImporting, setIsIupImporting] = useState(false);
  const [iupPreview, setIupPreview] = useState(null);
  const [iupFile, setIupFile] = useState(null);
  const [iupFileContent, setIupFileContent] = useState("");
  const [iupError, setIupError] = useState("");
  const [activeCourseYear, setActiveCourseYear] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [draftDepartmentFilter, setDraftDepartmentFilter] = useState("");
  const [draftSemesterFilter, setDraftSemesterFilter] = useState("");
  const [courseFormData, setCourseFormData] = useState(emptyCourseForm);
  const [componentDrafts, setComponentDrafts] = useState(() => emptyComponentDrafts());
  const [courseFormErrors, setCourseFormErrors] = useState({});
  const coursesQuery = useCoursesQuery();
  const teachersQuery = useTeachersQuery();
  const courseComponentsQuery = useCourseComponentsQuery();

  const refreshImportedData = async () => {
    const results = await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.components }),
      coursesQuery.refetch(),
      teachersQuery.refetch(),
      courseComponentsQuery.refetch(),
    ]);
    const failed = results.filter((result) => result.status === "rejected");
    if (failed.length > 0) {
      console.warn("Some post-import refresh requests failed:", failed);
    }
  };

  const courses = useMemo(
    () => (Array.isArray(coursesQuery.data) ? coursesQuery.data : []),
    [coursesQuery.data],
  );
  const teachers = Array.isArray(teachersQuery.data) ? teachersQuery.data : [];
  const courseComponents = useMemo(
    () => (Array.isArray(courseComponentsQuery.data) ? courseComponentsQuery.data : []),
    [courseComponentsQuery.data],
  );
  const componentsByCourseId = useMemo(() => {
    const grouped = new Map();
    courseComponents.forEach((component) => {
      const key = String(component.course_id);
      grouped.set(key, [...(grouped.get(key) || []), component]);
    });
    return grouped;
  }, [courseComponents]);
  const coursesBySecondaryFilters = useMemo(
    () =>
      courses.filter((course) => {
        const matchesDepartment = !departmentFilter || course.department === departmentFilter;
        const matchesSemester = !semesterFilter || String(course.semester) === semesterFilter;
        return matchesDepartment && matchesSemester;
      }),
    [courses, departmentFilter, semesterFilter],
  );
  const courseYearTabs = useMemo(() => {
    const years = [...new Set(
      coursesBySecondaryFilters
        .map((course) => Number(course.year))
        .filter((year) => Number.isFinite(year) && year > 0),
    )].sort((left, right) => left - right);

    return [
      { value: "all", label: t("all"), count: coursesBySecondaryFilters.length },
      ...years.map((year) => ({
        value: String(year),
        label: `${year} ${t("studyCourse").toLowerCase()}`,
        count: coursesBySecondaryFilters.filter((course) => Number(course.year) === year).length,
      })),
    ];
  }, [coursesBySecondaryFilters, t]);
  const hasActiveFilters = Boolean(departmentFilter || semesterFilter);
  const filteredCourses = useMemo(
    () =>
      coursesBySecondaryFilters.filter((course) => {
        const matchesActiveYear =
          activeCourseYear === "all" || String(course.year) === activeCourseYear;
        return matchesActiveYear;
      }),
    [coursesBySecondaryFilters, activeCourseYear],
  );
  const filteredProgrammeGroupsCount = useMemo(
    () =>
      new Set(
        filteredCourses
          .map((course) => String(course.programme || "").trim())
          .filter(Boolean),
      ).size,
    [filteredCourses],
  );

  const lessonTypeLabels = {
    lecture: t("lecture"),
    practical: t("practical"),
    lab: t("lab"),
    practice: t("practice"),
    srop: t("srop"),
  };

  const buildComponentDrafts = (course) => {
    const existingComponents = componentsByCourseId.get(String(course.id)) || [];
    return EDITABLE_LESSON_TYPES.map((lessonType) => {
      const component = existingComponents.find((item) => item.lesson_type === lessonType);
      return {
        lessonType,
        hours: component?.hours ?? "",
        teacherId: component?.teacher_id ?? "",
      };
    });
  };

  const handleAddCourse = () => {
    setEditingCourse(null);
    setCourseFormData(emptyCourseForm);
    setComponentDrafts(emptyComponentDrafts());
    setCourseFormErrors({});
    setIsModalOpen(true);
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setCourseFormData({
      code: course.code || "",
      name: course.name || "",
      programme: course.programme || "",
      cycle: course.cycle || "",
      component: course.component || "",
      credits: course.credits || "",
      hours: course.hours || "",
      year: course.year || "",
      semester: course.semester || "",
      department: course.department || "",
    });
    setComponentDrafts(buildComponentDrafts(course));
    setCourseFormErrors({});
    setIsModalOpen(true);
  };

  const handleDeleteCourse = async (course) => {
    const confirmed = await confirm({
      message: `${t("deleteCourse")}?`,
      confirmLabel: t("delete"),
    });
    if (!confirmed) {
      return;
    }

    try {
      await withGlobalLoader(() => courseAPI.delete(course.id), {
        title: t("delete"),
        description: t("globalLoaderDeleteDescription"),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  };

  const handleClearCourses = async () => {
    const confirmed = await confirm({
      message: t("confirmClearCourses"),
      confirmLabel: t("delete"),
    });
    if (!confirmed) {
      return;
    }

    try {
      setIsClearing(true);
      await withGlobalLoader(() => adminAPI.clearCollection("courses"), {
        title: t("clearCourses"),
        description: t("globalLoaderClearDescription"),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
    } catch (error) {
      console.error("Error clearing courses:", error);
    } finally {
      setIsClearing(false);
    }
  };

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const handleRopFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    const isSupported = /\.(xls|xlsx)$/i.test(file.name);
    if (!isSupported) {
      setRopError(t("ropImportFileTypeError"));
      setIsRopModalOpen(true);
      return;
    }

    try {
      setRopError("");
      setRopPreview(null);
      setRopFile(file);
      setIsRopModalOpen(true);
      setIsRopPreviewLoading(true);
      const fileContent = await readFileAsDataUrl(file);
      setRopFileContent(fileContent);
      const preview = await importAPI.previewRop(file.name, fileContent);
      setRopPreview(preview);
    } catch (error) {
      setRopError(error.message);
    } finally {
      setIsRopPreviewLoading(false);
    }
  };

  const handleImportRop = async () => {
    if (!ropFile || !ropFileContent) {
      setRopError(t("ropImportSelectFileError"));
      return;
    }

    try {
      setRopError("");
      setIsRopImporting(true);
      await withGlobalLoader(() => importAPI.importRop(ropFile.name, ropFileContent), {
        title: t("ropImportConfirm"),
        description: t("globalLoaderImportDescription"),
      });
      setIsRopModalOpen(false);
      setRopPreview(null);
      setRopFile(null);
      setRopFileContent("");
      await refreshImportedData();
    } catch (error) {
      setRopError(error.message);
    } finally {
      setIsRopImporting(false);
    }
  };

  const handleIupFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    if (!/\.(pdf|xls|xlsx)$/i.test(file.name)) {
      setIupError(t("iupImportFileTypeError"));
      setIsIupModalOpen(true);
      return;
    }

    try {
      setIupError("");
      setIupPreview(null);
      setIupFile(file);
      setIsIupModalOpen(true);
      setIsIupPreviewLoading(true);
      const fileContent = await readFileAsDataUrl(file);
      setIupFileContent(fileContent);
      const preview = await importAPI.previewIup(file.name, fileContent);
      setIupPreview(preview);
    } catch (error) {
      setIupError(error.message);
    } finally {
      setIsIupPreviewLoading(false);
    }
  };

  const handleImportIup = async () => {
    if (!iupFile || !iupFileContent) {
      setIupError(t("iupImportSelectFileError"));
      return;
    }

    try {
      setIupError("");
      setIsIupImporting(true);
      await withGlobalLoader(() => importAPI.importIup(iupFile.name, iupFileContent), {
        title: t("iupImportConfirm"),
        description: t("globalLoaderImportDescription"),
      });
      setIsIupModalOpen(false);
      setIupPreview(null);
      setIupFile(null);
      setIupFileContent("");
      await refreshImportedData();
    } catch (error) {
      setIupError(error.message);
    } finally {
      setIsIupImporting(false);
    }
  };

  const updateCourseField = (fieldName, value) => {
    setCourseFormData((prev) => ({ ...prev, [fieldName]: value }));
    setCourseFormErrors((prev) => ({ ...prev, [fieldName]: "", error: "" }));
  };

  const updateComponentDraft = (lessonType, fieldName, value) => {
    setComponentDrafts((current) =>
      current.map((draft) =>
        draft.lessonType === lessonType ? { ...draft, [fieldName]: value } : draft,
      ),
    );
    setCourseFormErrors((prev) => ({ ...prev, components: "", error: "" }));
  };

  const validateCourseForm = () => {
    const nextErrors = {};
    ["code", "name", "programme", "credits", "hours", "year", "semester", "department"].forEach((fieldName) => {
      if (courseFormData[fieldName] === undefined || courseFormData[fieldName] === null || String(courseFormData[fieldName]).trim() === "") {
        nextErrors[fieldName] = t("fillAllFields");
      }
    });

    componentDrafts.forEach((draft) => {
      const hours = Number(draft.hours || 0);
      if (hours > 0 && draft.lessonType !== "srop" && !draft.teacherId) {
        nextErrors.components = t("fillAllFields");
      }
    });

    return nextErrors;
  };

  const saveCourseComponents = async (course) => {
    const existingComponents = editingCourse
      ? componentsByCourseId.get(String(editingCourse.id)) || []
      : [];
    await Promise.all(existingComponents.map((component) => courseComponentAPI.delete(component.id)));

    const componentPayloads = componentDrafts
      .map((draft) => ({
        ...draft,
        hours: Number(draft.hours || 0),
      }))
      .filter((draft) => draft.hours > 0)
      .map((draft) => {
        const teacher = teachers.find((item) => String(item.id) === String(draft.teacherId));
        return {
          course_id: course.id,
          course_code: course.code,
          course_name: course.name,
          programme: course.programme,
          study_year: course.year,
          academic_period: course.semester,
          semester: course.semester,
          lesson_type: draft.lessonType,
          hours: draft.hours,
          weekly_classes: Math.max(1, Math.round(draft.hours / 15)),
          teacher_id: teacher?.id || null,
          teacher_name: teacher?.name || "",
        };
      });

    await Promise.all(componentPayloads.map((payload) => courseComponentAPI.create(payload)));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateCourseForm();
    if (Object.keys(validationErrors).length > 0) {
      setCourseFormErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...courseFormData,
        credits: courseFormData.credits ? Number(courseFormData.credits) : null,
        hours: courseFormData.hours ? Number(courseFormData.hours) : null,
        year: Number(courseFormData.year),
        semester: Number(courseFormData.semester),
        instructor_id: null,
        instructor_name: "",
      };
      const response = await withGlobalLoader(
        () => (editingCourse ? courseAPI.update(editingCourse.id, payload) : courseAPI.create(payload)),
        {
          title: editingCourse ? t("save") : t("addCourse"),
          description: t("globalLoaderSaveDescription"),
        },
      );
      const savedCourse = response.data || response;
      await saveCourseComponents(savedCourse);
      await queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.courses.components });
      setIsModalOpen(false);
    } catch (error) {
      setCourseFormErrors((prev) => ({
        ...prev,
        error: error.message,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          {t("accessDenied")}
        </h2>
        <p className="text-gray-600 mt-2">{t("adminOnly")}</p>
      </div>
    );
  }

  const columns = [
    { key: "code", label: t("courseCode") },
    { key: "name", label: t("courseName") },
    { key: "programme", label: t("programmeName") },
    { key: "cycle", label: t("disciplineCycle") },
    { key: "component", label: t("disciplineComponent") },
    { key: "credits", label: t("credits") },
    { key: "hours", label: t("hours") },
    { key: "year", label: t("studyCourse") },
    { key: "semester", label: t("semester") },
    { key: "department", label: t("educationalProgrammeGroup") },
  ];

  const lessonTypeShortLabels = {
    lecture: "L",
    practical: "P",
    lab: "LAB",
    practice: "PR",
    srop: "SROP",
  };

  const renderCourseComponents = (course) => {
    const components = componentsByCourseId.get(String(course.id)) || [];
    if (!components.length) {
      return (
        <div className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-500">
          {t("noCourseComponents")}
        </div>
      );
    }

    return (
      <div className="overflow-auto rounded-md border border-gray-200 bg-white">
        <table className="min-w-[720px] w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">{t("courseName")}</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">{t("lessonType")}</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">{t("hours")}</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">{t("teacherName")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {components.map((component) => {
              const shortLabel = lessonTypeShortLabels[component.lesson_type] || component.lesson_type?.toUpperCase();
              return (
                <tr key={component.id} className="bg-white">
                  <td className="px-3 py-2 font-medium text-gray-900">
                    {course.name} ({shortLabel})
                  </td>
                  <td className="px-3 py-2 text-gray-700">{t(component.lesson_type || "lecture")}</td>
                  <td className="px-3 py-2 text-gray-700">{component.hours ?? "-"}</td>
                  <td className="px-3 py-2 text-gray-700">{component.teacher_name || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 w-full bg-white">
      <ConfirmDialog />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-sm font-medium text-blue-700">
            {t("coursesCount")}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {filteredCourses.length}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <p className="text-sm font-medium text-emerald-700">
            {t("totalEducationalProgrammeGroups")}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {filteredProgrammeGroupsCount}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {t("courseMgmt")}
        </h1>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <input
            ref={ropFileInputRef}
            type="file"
            accept=".xls,.xlsx"
            className="hidden"
            onChange={handleRopFileChange}
          />
          <input
            ref={iupFileInputRef}
            type="file"
            accept=".pdf,.xls,.xlsx"
            className="hidden"
            onChange={handleIupFileChange}
          />
          <button
            onClick={handleAddCourse}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition w-full sm:w-auto justify-center"
          >
            <Plus size={20} /> {t("addCourse")}
          </button>
          <button
            onClick={handleClearCourses}
            disabled={isClearing || courses.length === 0}
            className="w-full rounded-md bg-red-600 px-4 py-2 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {t("clearCourses")}
          </button>
        </div>
      </div>

      <div className="mb-5 overflow-x-auto">
        <div
          role="tablist"
          aria-label={t("studyCourse")}
          className="inline-flex min-w-full gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1 sm:min-w-0"
        >
          {courseYearTabs.map((tab) => {
            const isActive = activeCourseYear === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCourseYear(tab.value)}
                className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#014531] text-white shadow-sm"
                    : "text-gray-700 hover:bg-white"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    isActive ? "bg-white/20 text-white" : "bg-white text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredCourses}
        onEdit={handleEditCourse}
        onDelete={handleDeleteCourse}
        isLoading={coursesQuery.isLoading}
        enableSearch
        hasActiveFilters={hasActiveFilters}
        filterDialogTitle={t("filter")}
        renderExpandedRow={renderCourseComponents}
        getRowCanExpand={(course) => (componentsByCourseId.get(String(course.id)) || []).length > 0}
        onApplyFilters={() => {
          setDepartmentFilter(draftDepartmentFilter);
          setSemesterFilter(draftSemesterFilter);
        }}
        onResetFilters={() => {
          setDraftDepartmentFilter("");
          setDraftSemesterFilter("");
          setDepartmentFilter("");
          setSemesterFilter("");
        }}
        filterControls={
          <>
            <select
              value={draftDepartmentFilter}
              onChange={(event) => setDraftDepartmentFilter(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              <option value="">{t("all")} {t("educationalProgrammeGroup").toLowerCase()}</option>
              {EDUCATIONAL_PROGRAMME_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
            <select
              value={draftSemesterFilter}
              onChange={(event) => setDraftSemesterFilter(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              <option value="">{t("all")} {t("semester").toLowerCase()}</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
          </>
        }
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCourse ? t("editCourse") : t("addCourse")}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {courseFormErrors.error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {courseFormErrors.error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("courseCode")}<span className="text-red-500">*</span>
              <input
                type="text"
                value={courseFormData.code}
                onChange={(event) => updateCourseField("code", event.target.value)}
                placeholder={t("enterCourseCode")}
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${courseFormErrors.code ? "border-red-500" : "border-gray-300"}`}
              />
              {courseFormErrors.code ? <span className="mt-1 block text-sm text-red-600">{courseFormErrors.code}</span> : null}
            </label>

            <label className="block text-sm font-medium text-gray-700">
              {t("courseName")}<span className="text-red-500">*</span>
              <input
                type="text"
                value={courseFormData.name}
                onChange={(event) => updateCourseField("name", event.target.value)}
                placeholder={t("enterCourseName")}
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${courseFormErrors.name ? "border-red-500" : "border-gray-300"}`}
              />
              {courseFormErrors.name ? <span className="mt-1 block text-sm text-red-600">{courseFormErrors.name}</span> : null}
            </label>

            <label className="block text-sm font-medium text-gray-700">
              {t("programmeName")}<span className="text-red-500">*</span>
              <select
                value={courseFormData.programme}
                onChange={(event) => updateCourseField("programme", event.target.value)}
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${courseFormErrors.programme ? "border-red-500" : "border-gray-300"}`}
              >
                <option value="">{t("selectProgrammeName")}</option>
                {PROGRAMMES.map((programme) => (
                  <option key={getCanonicalProgrammeName(programme)} value={getCanonicalProgrammeName(programme)}>
                    {getProgrammeLabel(programme, language)}
                  </option>
                ))}
              </select>
              {courseFormErrors.programme ? <span className="mt-1 block text-sm text-red-600">{courseFormErrors.programme}</span> : null}
            </label>

            <label className="block text-sm font-medium text-gray-700">
              {t("disciplineCycle")}
              <input
                type="text"
                value={courseFormData.cycle}
                onChange={(event) => updateCourseField("cycle", event.target.value)}
                placeholder={t("enterDisciplineCycle")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="block text-sm font-medium text-gray-700">
              {t("disciplineComponent")}
              <select
                value={courseFormData.component}
                onChange={(event) => updateCourseField("component", event.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t("selectDisciplineComponent")}</option>
                {["ОК", "ВК", "КВ", "ЖК", "ТК"].map((component) => (
                  <option key={component} value={component}>{component}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-gray-700">
              {t("credits")}<span className="text-red-500">*</span>
              <input
                type="number"
                value={courseFormData.credits}
                onChange={(event) => updateCourseField("credits", event.target.value)}
                placeholder="5"
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${courseFormErrors.credits ? "border-red-500" : "border-gray-300"}`}
              />
              {courseFormErrors.credits ? <span className="mt-1 block text-sm text-red-600">{courseFormErrors.credits}</span> : null}
            </label>

            <label className="block text-sm font-medium text-gray-700">
              {t("hours")}<span className="text-red-500">*</span>
              <input
                type="number"
                value={courseFormData.hours}
                onChange={(event) => updateCourseField("hours", event.target.value)}
                placeholder="150"
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${courseFormErrors.hours ? "border-red-500" : "border-gray-300"}`}
              />
              {courseFormErrors.hours ? <span className="mt-1 block text-sm text-red-600">{courseFormErrors.hours}</span> : null}
            </label>

            <label className="block text-sm font-medium text-gray-700">
              {t("studyCourse")}<span className="text-red-500">*</span>
              <select
                value={courseFormData.year}
                onChange={(event) => updateCourseField("year", event.target.value)}
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${courseFormErrors.year ? "border-red-500" : "border-gray-300"}`}
              >
                <option value="">{t("selectStudyCourse")}</option>
                {[1, 2, 3, 4, 5, 6].map((course) => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
              {courseFormErrors.year ? <span className="mt-1 block text-sm text-red-600">{courseFormErrors.year}</span> : null}
            </label>

            <label className="block text-sm font-medium text-gray-700">
              {t("semester")}<span className="text-red-500">*</span>
              <input
                type="number"
                value={courseFormData.semester}
                onChange={(event) => updateCourseField("semester", event.target.value)}
                placeholder="1"
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${courseFormErrors.semester ? "border-red-500" : "border-gray-300"}`}
              />
              {courseFormErrors.semester ? <span className="mt-1 block text-sm text-red-600">{courseFormErrors.semester}</span> : null}
            </label>

            <label className="block text-sm font-medium text-gray-700">
              {t("educationalProgrammeGroup")}<span className="text-red-500">*</span>
              <select
                value={courseFormData.department}
                onChange={(event) => updateCourseField("department", event.target.value)}
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${courseFormErrors.department ? "border-red-500" : "border-gray-300"}`}
              >
                <option value="">{t("selectEducationalProgrammeGroup")}</option>
                {EDUCATIONAL_PROGRAMME_GROUPS.map((group) => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
              {courseFormErrors.department ? <span className="mt-1 block text-sm text-red-600">{courseFormErrors.department}</span> : null}
            </label>
          </div>

          <details open className="rounded-md border border-gray-200 bg-gray-50">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-900">
              {t("lessonType")} / {t("teacherName")}
            </summary>
            <div className="overflow-x-auto border-t border-gray-200 bg-white">
              <table className="min-w-[620px] w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">{t("lessonType")}</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">{t("hours")}</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">{t("teacherName")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {componentDrafts.map((draft) => (
                    <tr key={draft.lessonType}>
                      <td className="px-3 py-2 font-medium text-gray-900">{lessonTypeLabels[draft.lessonType] || draft.lessonType}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          value={draft.hours}
                          onChange={(event) => updateComponentDraft(draft.lessonType, "hours", event.target.value)}
                          className="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={draft.teacherId}
                          onChange={(event) => updateComponentDraft(draft.lessonType, "teacherId", event.target.value)}
                          disabled={teachersQuery.isLoading}
                          className="w-full min-w-[220px] rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                        >
                          <option value="">{teachersQuery.isLoading ? t("loading") : t("selectInstructor")}</option>
                          {teachers.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {courseFormErrors.components ? (
              <p className="px-4 py-2 text-sm text-red-600">{courseFormErrors.components}</p>
            ) : null}
          </details>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-blue-600 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {editingCourse ? t("save") : t("add")}
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={isRopModalOpen}
        onClose={() => {
          if (!isRopImporting) {
            setIsRopModalOpen(false);
          }
        }}
        title={t("ropImportTitle")}
      >
        <div className="space-y-4">
          {ropFile ? (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              <span className="font-semibold">{t("selectedFile")}:</span>{" "}
              {ropFile.name}
            </div>
          ) : null}

          {isRopPreviewLoading ? (
            <div className="py-8 text-center text-gray-500">{t("loading")}</div>
          ) : null}

          {ropError ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {ropError}
            </div>
          ) : null}

          {ropPreview ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs font-medium uppercase text-gray-500">
                    {t("programmeName")}
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {ropPreview.metadata?.programme || "-"}
                  </p>
                </div>
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs font-medium uppercase text-gray-500">
                    {t("studyCourse")}
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {ropPreview.metadata?.studyYear || "-"}
                  </p>
                </div>
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs font-medium uppercase text-gray-500">
                    {t("semester")}
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {ropPreview.metadata?.academicPeriods?.join(", ") || "-"}
                  </p>
                </div>
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs font-medium uppercase text-gray-500">
                    {t("courses")}
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {ropPreview.totals?.courses || 0}
                  </p>
                </div>
              </div>

              <div className="max-h-56 overflow-auto rounded-md border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">
                        {t("courseCode")}
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">
                        {t("courseName")}
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">
                        {t("credits")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {(ropPreview.courses || []).slice(0, 8).map((course) => (
                      <tr key={`${course.code}-${course.name}`}>
                        <td className="px-3 py-2 text-gray-700">{course.code}</td>
                        <td className="px-3 py-2 text-gray-900">{course.name}</td>
                        <td className="px-3 py-2 text-gray-700">{course.credits || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsRopModalOpen(false)}
                  disabled={isRopImporting}
                  className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  {t("cancel")}
                </button>
                  <button
                    type="button"
                    onClick={handleImportRop}
                    disabled={isRopImporting}
                    className="rounded-md bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                  {t("ropImportConfirm")}
                  </button>
              </div>
            </>
          ) : null}
        </div>
      </Modal>

      <Modal
        isOpen={isIupModalOpen}
        onClose={() => {
          if (!isIupImporting) {
            setIsIupModalOpen(false);
          }
        }}
        title={t("iupImportTitle")}
      >
        <div className="space-y-4">
          {iupFile ? (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              <span className="font-semibold">{t("selectedFile")}:</span>{" "}
              {iupFile.name}
            </div>
          ) : null}

          {isIupPreviewLoading ? (
            <div className="py-8 text-center text-gray-500">{t("loading")}</div>
          ) : null}

          {iupError ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {iupError}
            </div>
          ) : null}

          {iupPreview ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs font-medium uppercase text-gray-500">
                    {t("groupNumber")}
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {iupPreview.metadata?.groupName || "-"}
                  </p>
                </div>
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs font-medium uppercase text-gray-500">
                    {t("programmeName")}
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {iupPreview.metadata?.programme || "-"}
                  </p>
                </div>
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs font-medium uppercase text-gray-500">
                    {t("instructorsFound")}
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {iupPreview.totals?.teachers || 0}
                  </p>
                </div>
              </div>

              <div className="max-h-56 overflow-auto rounded-md border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">
                        {t("courseCode")}
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">
                        {t("courseName")}
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">
                        {t("instructor")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {(iupPreview.entries || [])
                      .filter((entry) => entry.lessonType !== "srop")
                      .slice(0, 10)
                      .map((entry, index) => (
                        <tr key={`${entry.courseCode}-${entry.lessonType}-${index}`}>
                          <td className="px-3 py-2 text-gray-700">{entry.courseCode}</td>
                          <td className="px-3 py-2 text-gray-900">{entry.courseName}</td>
                          <td className="px-3 py-2 text-gray-700">{entry.teacherName || "-"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsIupModalOpen(false)}
                  disabled={isIupImporting}
                  className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  {t("cancel")}
                </button>
                  <button
                    type="button"
                    onClick={handleImportIup}
                    disabled={isIupImporting}
                    className="rounded-md bg-slate-700 px-4 py-2 text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                  {t("iupImportConfirm")}
                  </button>
              </div>
            </>
          ) : null}
        </div>
      </Modal>
    </div>
  );
};

export default CourseManager;

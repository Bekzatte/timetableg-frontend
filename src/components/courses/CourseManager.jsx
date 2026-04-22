import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import DataTable from "../ui/DataTable";
import Modal from "../ui/Modal";
import Form from "../ui/Form";
import { useAuth } from "../../hooks/useAuth";
import { adminAPI, courseAPI, courseComponentAPI, importAPI, teacherAPI } from "../../services/api";
import { useFetch } from "../../hooks/useAPI";
import { useTranslation } from "../../hooks/useTranslation";
import { EDUCATIONAL_PROGRAMME_GROUPS } from "../../constants/educationalProgrammeGroups";
import {
  PROGRAMMES,
  getCanonicalProgrammeName,
  getProgrammeLabel,
} from "../../constants/programmes";

export const CourseManager = () => {
  const { t, language } = useTranslation();
  const { isAdmin } = useAuth();
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
  const { data, isLoading, execute } = useFetch(courseAPI.getAll);
  const {
    data: teachersData,
    isLoading: isTeachersLoading,
    execute: executeTeachers,
  } = useFetch(teacherAPI.getAll);
  const { data: courseComponentsData, execute: executeCourseComponents } = useFetch(courseComponentAPI.getAll);

  useEffect(() => {
    execute();
    executeTeachers();
    executeCourseComponents();
  }, [execute, executeTeachers, executeCourseComponents]);

  const courses = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const teachers = Array.isArray(teachersData) ? teachersData : [];
  const courseComponents = useMemo(
    () => (Array.isArray(courseComponentsData) ? courseComponentsData : []),
    [courseComponentsData],
  );
  const componentsByCourseId = useMemo(() => {
    const grouped = new Map();
    courseComponents.forEach((component) => {
      const key = String(component.course_id);
      grouped.set(key, [...(grouped.get(key) || []), component]);
    });
    return grouped;
  }, [courseComponents]);
  const courseYearTabs = useMemo(() => {
    const years = [...new Set(
      courses
        .map((course) => Number(course.year))
        .filter((year) => Number.isFinite(year) && year > 0),
    )].sort((left, right) => left - right);

    return [
      { value: "all", label: t("all"), count: courses.length },
      ...years.map((year) => ({
        value: String(year),
        label: `${year} ${t("studyCourse").toLowerCase()}`,
        count: courses.filter((course) => Number(course.year) === year).length,
      })),
    ];
  }, [courses, t]);
  const hasActiveFilters = Boolean(departmentFilter || semesterFilter);
  const filteredCourses = useMemo(
    () =>
      courses.filter((course) => {
        const matchesActiveYear = activeCourseYear === "all" || String(course.year) === activeCourseYear;
        const matchesDepartment = !departmentFilter || course.department === departmentFilter;
        const matchesSemester = !semesterFilter || String(course.semester) === semesterFilter;
        return matchesActiveYear && matchesDepartment && matchesSemester;
      }),
    [courses, activeCourseYear, departmentFilter, semesterFilter],
  );

  const handleAddCourse = () => {
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  const handleDeleteCourse = async (course) => {
    if (window.confirm(`${t("deleteCourse")}?`)) {
      try {
        await courseAPI.delete(course.id);
        await execute();
      } catch (error) {
        console.error("Error deleting course:", error);
      }
    }
  };

  const handleClearCourses = async () => {
    if (!window.confirm(t("confirmClearCourses"))) {
      return;
    }

    try {
      setIsClearing(true);
      await adminAPI.clearCollection("courses");
      await execute();
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
      await importAPI.importRop(ropFile.name, ropFileContent);
      await execute();
      await executeCourseComponents();
      setIsRopModalOpen(false);
      setRopPreview(null);
      setRopFile(null);
      setRopFileContent("");
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
      await importAPI.importIup(iupFile.name, iupFileContent);
      await execute();
      await executeTeachers();
      await executeCourseComponents();
      setIsIupModalOpen(false);
      setIupPreview(null);
      setIupFile(null);
      setIupFileContent("");
    } catch (error) {
      setIupError(error.message);
    } finally {
      setIsIupImporting(false);
    }
  };

  const handleSubmit = async (formData, setErrors) => {
    const selectedTeacher = teachers.find(
      (teacher) => String(teacher.id) === String(formData.instructor_id),
    );

    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        credits: formData.credits ? Number(formData.credits) : null,
        hours: formData.hours ? Number(formData.hours) : null,
        year: Number(formData.year),
        semester: Number(formData.semester),
        instructor_id: formData.instructor_id ? Number(formData.instructor_id) : null,
        instructor_name: selectedTeacher?.name || "",
      };
      if (editingCourse) {
        await courseAPI.update(editingCourse.id, payload);
      } else {
        await courseAPI.create(payload);
      }
      await execute();
      await executeCourseComponents();
      setIsModalOpen(false);
    } catch (error) {
      setErrors((prev) => ({
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
    { key: "instructor_name", label: t("instructor") },
  ];

  const lessonTypeShortLabels = {
    lecture: "L",
    practical: "P",
    lab: "LAB",
    practice: "PR",
    srop: "SROP",
    sro: "SRO",
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
              <th className="px-3 py-2 text-left font-semibold text-gray-700">{t("classesCount")}</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">{t("semester")}</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">{t("requiresComputers")}</th>
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
                  <td className="px-3 py-2 text-gray-700">{component.weekly_classes ?? "-"}</td>
                  <td className="px-3 py-2 text-gray-700">{component.academic_period || component.semester || "-"}</td>
                  <td className="px-3 py-2 text-gray-700">{component.requires_computers ? t("yes") : t("no")}</td>
                  <td className="px-3 py-2 text-gray-700">{component.teacher_name || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const formFields = [
    {
      name: "code",
      label: t("courseCode"),
      placeholder: t("enterCourseCode"),
      required: true,
    },
    {
      name: "name",
      label: t("courseName"),
      placeholder: t("enterCourseName"),
      required: true,
    },
    {
      name: "credits",
      label: t("credits"),
      type: "number",
      placeholder: "5",
      required: true,
    },
    {
      name: "hours",
      label: t("hours"),
      type: "number",
      placeholder: "150",
      required: true,
    },
    {
      name: "cycle",
      label: t("disciplineCycle"),
      placeholder: t("enterDisciplineCycle"),
    },
    {
      name: "component",
      label: t("disciplineComponent"),
      type: "select",
      placeholder: t("selectDisciplineComponent"),
      options: ["ОК", "ВК", "КВ", "ЖК", "ТК"].map((component) => ({
        value: component,
        label: component,
      })),
    },
    {
      name: "year",
      label: t("studyCourse"),
      type: "select",
      placeholder: t("selectStudyCourse"),
      options: [1, 2, 3, 4, 5, 6].map((course) => ({
        value: course,
        label: String(course),
      })),
      required: true,
    },
    {
      name: "semester",
      label: t("semester"),
      type: "number",
      placeholder: "1",
      required: true,
    },
    {
      name: "programme",
      label: t("programmeName"),
      type: "select",
      placeholder: t("selectProgrammeName"),
      options: PROGRAMMES.map((programme) => ({
        value: getCanonicalProgrammeName(programme),
        label: getProgrammeLabel(programme, language),
      })),
      required: true,
    },
    {
      name: "department",
      label: t("educationalProgrammeGroup"),
      type: "select",
      placeholder: t("selectEducationalProgrammeGroup"),
      options: EDUCATIONAL_PROGRAMME_GROUPS.map((group) => ({
        value: group,
        label: group,
      })),
      required: true,
    },
    {
      name: "instructor_id",
      label: t("instructor"),
      type: "select",
      placeholder: isTeachersLoading
        ? t("loading")
        : t("selectInstructor"),
      options: teachers.map((teacher) => ({
        value: teacher.id,
        label: teacher.name,
      })),
      required: true,
    },
  ];

  return (
    <div className="p-4 sm:p-6 w-full bg-white">
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-sm font-medium text-blue-700">
            {t("coursesCount")}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {courses.length}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <p className="text-sm font-medium text-emerald-700">
            {t("totalEducationalProgrammeGroups")}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {EDUCATIONAL_PROGRAMME_GROUPS.length}
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
            {isClearing ? t("loading") : t("clearCourses")}
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
        isLoading={isLoading}
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
      >
        <Form
          fields={formFields}
          onSubmit={handleSubmit}
          resetKey={editingCourse ? `course-${editingCourse.id}` : "course-new"}
          initialValues={
            editingCourse
              ? {
                  ...editingCourse,
                  credits: editingCourse.credits || "",
                  hours: editingCourse.hours || "",
                  cycle: editingCourse.cycle || "",
                  component: editingCourse.component || "",
                  year: editingCourse.year || "",
                  programme: editingCourse.programme || "",
                  instructor_id: editingCourse.instructor_id || "",
                }
              : {}
          }
          submitText={editingCourse ? t("save") : t("add")}
          isLoading={isSubmitting}
        />
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
                  {isRopImporting ? t("loading") : t("ropImportConfirm")}
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
                  {isIupImporting ? t("loading") : t("iupImportConfirm")}
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

import { useEffect, useMemo, useRef, useState } from "react";
import { FileSpreadsheet, FileText, Plus } from "lucide-react";
import DataTable from "../ui/DataTable";
import Modal from "../ui/Modal";
import Form from "../ui/Form";
import { useAuth } from "../../hooks/useAuth";
import { adminAPI, courseAPI, importAPI, teacherAPI } from "../../services/api";
import { useFetch } from "../../hooks/useAPI";
import { useTranslation } from "../../hooks/useTranslation";
import { DEPARTMENTS } from "../../constants/departments";
import { PROGRAMMES } from "../../constants/programmes";

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
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [draftDepartmentFilter, setDraftDepartmentFilter] = useState("");
  const [draftSemesterFilter, setDraftSemesterFilter] = useState("");
  const [draftCourseFilter, setDraftCourseFilter] = useState("");
  const { data, isLoading, execute } = useFetch(courseAPI.getAll);
  const {
    data: teachersData,
    isLoading: isTeachersLoading,
    execute: executeTeachers,
  } = useFetch(teacherAPI.getAll);

  useEffect(() => {
    execute();
    executeTeachers();
  }, [execute, executeTeachers]);

  const courses = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const teachers = Array.isArray(teachersData) ? teachersData : [];
  const hasActiveFilters = Boolean(departmentFilter || semesterFilter || courseFilter);
  const filteredCourses = useMemo(
    () =>
      courses.filter((course) => {
        const matchesDepartment = !departmentFilter || course.department === departmentFilter;
        const matchesSemester = !semesterFilter || String(course.semester) === semesterFilter;
        const matchesCourse = !courseFilter || String(course.year) === courseFilter;
        return matchesDepartment && matchesSemester && matchesCourse;
      }),
    [courses, departmentFilter, semesterFilter, courseFilter],
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

    if (!/\.pdf$/i.test(file.name)) {
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
        requires_computers: formData.requires_computers ? 1 : 0,
        instructor_name: selectedTeacher?.name || "",
      };
      if (editingCourse) {
        await courseAPI.update(editingCourse.id, payload);
      } else {
        await courseAPI.create(payload);
      }
      await execute();
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
    {
      key: "requires_computers",
      label: t("requiresComputers"),
      render: (value) => (value ? t("yes") : t("no")),
    },
    { key: "department", label: t("facultyInstitute") },
    { key: "instructor_name", label: t("instructor") },
  ];

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
        value: programme.labels.ru,
        label: programme.labels[language] || programme.labels.en,
      })),
      required: true,
    },
    {
      name: "department",
      label: t("facultyInstitute"),
      type: "select",
      placeholder: t("selectFacultyInstitute"),
      options: DEPARTMENTS.map((department) => ({
        value: department,
        label: department,
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
    {
      name: "requires_computers",
      label: t("requiresComputers"),
      type: "toggle",
      required: true,
      trueLabel: t("yes"),
      falseLabel: t("no"),
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
            {t("totalDepartments")}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {DEPARTMENTS.length}
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
            accept=".pdf"
            className="hidden"
            onChange={handleIupFileChange}
          />
          <button
            type="button"
            onClick={() => ropFileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-700 sm:w-auto"
          >
            <FileSpreadsheet size={20} /> {t("ropImportButton")}
          </button>
          <button
            type="button"
            onClick={() => iupFileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-700 px-4 py-2 text-white transition hover:bg-slate-800 sm:w-auto"
          >
            <FileText size={20} /> {t("iupImportButton")}
          </button>
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

      <DataTable
        columns={columns}
        data={filteredCourses}
        onEdit={handleEditCourse}
        onDelete={handleDeleteCourse}
        isLoading={isLoading}
        enableSearch
        hasActiveFilters={hasActiveFilters}
        filterDialogTitle={t("filter")}
        onApplyFilters={() => {
          setDepartmentFilter(draftDepartmentFilter);
          setSemesterFilter(draftSemesterFilter);
          setCourseFilter(draftCourseFilter);
        }}
        onResetFilters={() => {
          setDraftDepartmentFilter("");
          setDraftSemesterFilter("");
          setDraftCourseFilter("");
          setDepartmentFilter("");
          setSemesterFilter("");
          setCourseFilter("");
        }}
        filterControls={
          <>
            <select
              value={draftDepartmentFilter}
              onChange={(event) => setDraftDepartmentFilter(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              <option value="">{t("all")} {t("facultyInstitute").toLowerCase()}</option>
              {DEPARTMENTS.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
            <select
              value={draftCourseFilter}
              onChange={(event) => setDraftCourseFilter(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              <option value="">{t("all")} {t("studyCourse").toLowerCase()}</option>
              {[1, 2, 3, 4, 5, 6].map((course) => (
                <option key={course} value={course}>
                  {course}
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
                  requires_computers: editingCourse.requires_computers ? 1 : 0,
                }
              : { requires_computers: 0 }
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
              <span className="font-semibold">{t("excelImportSelectedFile")}:</span>{" "}
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
              <span className="font-semibold">{t("excelImportSelectedFile")}:</span>{" "}
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
                  <p className="text-xs font-medium uppercase text-gray-500">{t("student")}</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {iupPreview.metadata?.studentName || "-"}
                  </p>
                </div>
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

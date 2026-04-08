import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import DataTable from "../ui/DataTable";
import Modal from "../ui/Modal";
import Form from "../ui/Form";
import { useAuth } from "../../hooks/useAuth";
import { adminAPI, courseAPI, teacherAPI } from "../../services/api";
import { useFetch } from "../../hooks/useAPI";
import { useTranslation } from "../../hooks/useTranslation";
import { DEPARTMENTS } from "../../constants/departments";
import { PROGRAMMES } from "../../constants/programmes";

export const CourseManager = () => {
  const { t, language } = useTranslation();
  const { isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async (formData, setErrors) => {
    const selectedTeacher = teachers.find(
      (teacher) => String(teacher.id) === String(formData.instructor_id),
    );

    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
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
          <button
            onClick={handleAddCourse}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition w-full sm:w-auto justify-center"
          >
            <Plus size={20} /> {t("addCourse")}
          </button>
          <button
            onClick={handleClearCourses}
            disabled={isClearing}
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
              {[1, 2].map((semester) => (
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
    </div>
  );
};

export default CourseManager;

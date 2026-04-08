import { useEffect, useState } from "react";
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

  const courses = Array.isArray(data) ? data : [];
  const teachers = Array.isArray(teachersData) ? teachersData : [];

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
      const payload = {
        ...formData,
        instructor_id: formData.instructor_id ? Number(formData.instructor_id) : null,
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
    { key: "year", label: t("year") },
    { key: "semester", label: t("semester") },
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
      label: t("year"),
      type: "number",
      placeholder: String(new Date().getFullYear()),
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
        data={courses}
        onEdit={handleEditCourse}
        onDelete={handleDeleteCourse}
        isLoading={isLoading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCourse ? t("editCourse") : t("addCourse")}
      >
        <Form
          fields={formFields}
          onSubmit={handleSubmit}
          initialValues={
            editingCourse
              ? {
                  ...editingCourse,
                  year: editingCourse.year || "",
                  programme: editingCourse.programme || "",
                  instructor_id: editingCourse.instructor_id || "",
                }
              : {}
          }
          submitText={editingCourse ? t("save") : t("add")}
        />
      </Modal>
    </div>
  );
};

export default CourseManager;

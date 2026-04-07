import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import DataTable from "../ui/DataTable";
import Modal from "../ui/Modal";
import Form from "../ui/Form";
import { useAuth } from "../../hooks/useAuth";
import { adminAPI, courseAPI } from "../../services/api";
import { useFetch } from "../../hooks/useAPI";
import { useTranslation } from "../../hooks/useTranslation";

export const CourseManager = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [isClearing, setIsClearing] = useState(false);
  const { data, isLoading, execute } = useFetch(courseAPI.getAll);

  useEffect(() => {
    execute();
  }, [execute]);

  const courses = Array.isArray(data) ? data : [];

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
    try {
      if (editingCourse) {
        await courseAPI.update(editingCourse.id, formData);
      } else {
        await courseAPI.create(formData);
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
    { key: "name", label: t("courseName") },
    { key: "code", label: t("courseCode") },
    { key: "credits", label: t("credits") },
    { key: "hours", label: t("hours") },
  ];

  const formFields = [
    {
      name: "name",
      label: t("courseName"),
      placeholder: t("courseName"),
      required: true,
    },
    {
      name: "code",
      label: t("courseCode"),
      placeholder: "CS101",
      required: true,
    },
    {
      name: "credits",
      label: t("credits"),
      type: "number",
      placeholder: "3",
      required: true,
    },
    {
      name: "hours",
      label: t("hours"),
      type: "number",
      placeholder: "36",
      required: true,
    },
    { name: "description", label: t("description"), type: "textarea" },
  ];

  return (
    <div className="p-4 sm:p-6 w-full bg-white">
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
          initialValues={editingCourse || {}}
          submitText={editingCourse ? t("save") : t("add")}
        />
      </Modal>
    </div>
  );
};

export default CourseManager;

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import DataTable from "../ui/DataTable";
import Modal from "../ui/Modal";
import Form from "../ui/Form";
import { useAuth } from "../../hooks/useAuth";
import { teacherAPI } from "../../services/api";
import { useFetch } from "../../hooks/useAPI";
import { useTranslation } from "../../hooks/useTranslation";

export const TeacherManager = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const { data, isLoading, execute } = useFetch(teacherAPI.getAll);

  useEffect(() => {
    execute();
  }, [execute]);

  const teachers = Array.isArray(data) ? data : [];

  const handleAddTeacher = () => {
    setEditingTeacher(null);
    setIsModalOpen(true);
  };

  const handleEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
    setIsModalOpen(true);
  };

  const handleDeleteTeacher = async (teacher) => {
    if (
      window.confirm(t("confirmDeleteTeacher").replace("${name}", teacher.name))
    ) {
      try {
        await teacherAPI.delete(teacher.id);
        await execute();
      } catch (error) {
        console.error(t("errorDeleteTeacher"), error);
      }
    }
  };

  const handleSubmit = async (formData, setErrors) => {
    try {
      if (editingTeacher) {
        await teacherAPI.update(editingTeacher.id, formData);
      } else {
        await teacherAPI.create(formData);
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

  const columns = [
    { key: "name", label: t("fullName") },
    { key: "email", label: "Email" },
    { key: "phone", label: t("phone") },
    { key: "specialization", label: t("specialization") },
  ];

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

  const formFields = [
    {
      name: "name",
      label: t("fullName"),
      placeholder: t("enterTeacherName"),
      required: true,
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "email@example.com",
      required: true,
    },
    { name: "phone", label: t("phone"), placeholder: t("phonePlaceholder") },
    {
      name: "specialization",
      label: t("specialization"),
      placeholder: t("specializationPlaceholder"),
    },
    {
      name: "max_hours_per_week",
      label: t("maxHoursPerWeek"),
      type: "number",
      placeholder: "20",
    },
  ];

  return (
    <div className="p-6 bg-white">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("teacherMgmt")}</h1>
        <button
          onClick={handleAddTeacher}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition w-full sm:w-auto"
        >
          <Plus size={20} /> {t("addTeacher")}
        </button>
      </div>

      <DataTable
        columns={columns}
        data={teachers}
        onEdit={handleEditTeacher}
        onDelete={handleDeleteTeacher}
        isLoading={isLoading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? t("editTeacher") : t("addTeacher")}
      >
        <Form
          fields={formFields}
          onSubmit={handleSubmit}
          initialValues={editingTeacher || {}}
        />
      </Modal>
    </div>
  );
};

export default TeacherManager;

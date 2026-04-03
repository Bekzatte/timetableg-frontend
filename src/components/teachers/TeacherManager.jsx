import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import DataTable from "../ui/DataTable";
import Modal from "../ui/Modal";
import Form from "../ui/Form";
import { useAuth } from "../../contexts/AuthContext";
import { teacherAPI } from "../../services/api";
import { useFetch } from "../../hooks/useAPI";
import { useTranslation } from "../../hooks/useTranslation";

export const TeacherManager = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const { data, isLoading, execute } = useFetch(teacherAPI.getAll);

  useEffect(() => {
    if (data) {
      setTeachers(Array.isArray(data) ? [...data] : []);
    }
  }, [data]);

  useEffect(() => {
    execute();
  }, []);

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
        setTeachers(teachers.filter((t) => t.id !== teacher.id));
      } catch (error) {
        console.error(t("errorDeleteTeacher"), error);
      }
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingTeacher) {
        const response = await teacherAPI.update(editingTeacher.id, formData);
        setTeachers(
          teachers.map((t) =>
            t.id === editingTeacher.id
              ? response.data || { ...formData, id: editingTeacher.id }
              : t,
          ),
        );
      } else {
        const response = await teacherAPI.create(formData);
        setTeachers([...teachers, response.data || formData]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(t("errorSaveTeacher"), error);
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

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import DataTable from "../ui/DataTable";
import Modal from "../ui/Modal";
import Form from "../ui/Form";
import { useAuth } from "../../hooks/useAuth";
import { adminAPI, teacherAPI } from "../../services/api";
import { useFetch } from "../../hooks/useAPI";
import { useTranslation } from "../../hooks/useTranslation";
import { DEPARTMENTS } from "../../constants/departments";

export const TeacherManager = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [isClearing, setIsClearing] = useState(false);
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

  const handleClearTeachers = async () => {
    if (!window.confirm(t("confirmClearTeachers"))) {
      return;
    }

    try {
      setIsClearing(true);
      await adminAPI.clearCollection("teachers");
      await execute();
    } catch (error) {
      console.error("Error clearing teachers:", error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleSubmit = async (formData, setErrors) => {
    try {
      if (!String(formData.email || "").trim().toLowerCase().endsWith("@kazatu.edu.kz")) {
        setErrors((prev) => ({
          ...prev,
          error: t("errorTeacherEmailDomainRequired"),
        }));
        return;
      }

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
    { key: "specialization", label: t("facultyInstitute") },
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
      placeholder: "name@kazatu.edu.kz",
      required: true,
    },
    { name: "phone", label: t("phone"), placeholder: t("phonePlaceholder") },
    {
      name: "specialization",
      label: t("facultyInstitute"),
      type: "select",
      placeholder: t("selectFacultyInstitute"),
      required: true,
      options: DEPARTMENTS.map((department) => ({
        value: department,
        label: department,
      })),
    },
  ];

  return (
    <div className="p-6 bg-white">
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-sm font-medium text-blue-700">
            {t("totalInstructors")}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {teachers.length}
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

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("teacherMgmt")}</h1>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <button
            onClick={handleAddTeacher}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition w-full sm:w-auto"
          >
            <Plus size={20} /> {t("addTeacher")}
          </button>
          <button
            onClick={handleClearTeachers}
            disabled={isClearing}
            className="w-full rounded-md bg-red-600 px-4 py-2 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isClearing ? t("loading") : t("clearTeachers")}
          </button>
        </div>
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
          submitText={editingTeacher ? t("save") : t("add")}
        />
      </Modal>
    </div>
  );
};

export default TeacherManager;

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import DataTable from "../ui/DataTable";
import Modal from "../ui/Modal";
import Form from "../ui/Form";
import { useAuth } from "../../hooks/useAuth";
import { adminAPI, teacherAPI, teacherPreferenceAPI } from "../../services/api";
import { useFetch } from "../../hooks/useAPI";
import { useTranslation } from "../../hooks/useTranslation";
import { DEPARTMENTS } from "../../constants/departments";
import { STUDY_LANGUAGES } from "../../constants/languages";

export const TeacherManager = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [isClearing, setIsClearing] = useState(false);
  const { data, isLoading, execute } = useFetch(teacherAPI.getAll);
  const {
    data: preferenceRequestsData,
    isLoading: isPreferenceRequestsLoading,
    error: preferenceRequestsError,
    execute: executePreferenceRequests,
  } = useFetch(teacherPreferenceAPI.getAll);

  useEffect(() => {
    execute();
    executePreferenceRequests();
  }, [execute, executePreferenceRequests]);

  const teachers = Array.isArray(data) ? data : [];
  const preferenceRequests = Array.isArray(preferenceRequestsData) ? preferenceRequestsData : [];

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
        await teacherAPI.update(editingTeacher.id, {
          ...formData,
          teaching_languages: formData.teaching_languages || ["ru", "kk"],
        });
      } else {
        await teacherAPI.create({
          ...formData,
          teaching_languages: formData.teaching_languages || ["ru", "kk"],
        });
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

  const handleUpdateRequestStatus = async (request, status) => {
    try {
      await teacherPreferenceAPI.updateStatus(request.id, {
        status,
        admin_comment: "",
      });
      await executePreferenceRequests();
    } catch (error) {
      console.error(t("errorSaveTeacherPreference"), error);
    }
  };

  const columns = [
    { key: "name", label: t("fullName") },
    { key: "email", label: "Email" },
    { key: "phone", label: t("phone") },
    { key: "department", label: t("facultyInstitute") },
    {
      key: "teaching_languages",
      label: t("teachingLanguages"),
      render: (value) =>
        String(value || "ru,kk")
          .split(",")
          .filter(Boolean)
          .map((item) => t(item === "kk" ? "languageKazakh" : "languageRussian"))
          .join(", "),
    },
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
      name: "department",
      label: t("facultyInstitute"),
      type: "select",
      placeholder: t("selectFacultyInstitute"),
      required: true,
      options: DEPARTMENTS.map((department) => ({
        value: department,
        label: department,
      })),
    },
    {
      name: "teaching_languages",
      label: t("teachingLanguages"),
      type: "checkbox-group",
      options: STUDY_LANGUAGES.map((item) => ({
        value: item.value,
        label: t(item.labelKey),
      })),
      required: true,
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
        enableSearch
      />

      <div className="mt-8 rounded-2xl border border-amber-100 bg-amber-50/40 p-5">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t("teacherRequestsTitle")}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {t("teacherRequestsDescription")}
            </p>
          </div>
          <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-amber-700 shadow-sm">
            {preferenceRequests.length}
          </div>
        </div>

        {isPreferenceRequestsLoading ? (
          <div className="rounded-xl bg-white px-4 py-6 text-center text-gray-500">
            {t("loading")}
          </div>
        ) : preferenceRequestsError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-red-700">
            {preferenceRequestsError}
          </div>
        ) : preferenceRequests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-amber-200 bg-white px-4 py-6 text-center text-gray-500">
            {t("teacherRequestsEmpty")}
          </div>
        ) : (
          <div className="space-y-3">
            {preferenceRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-2xl border border-white bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-gray-900">
                      {request.teacher_name} • {t(request.preferred_day)} • {request.preferred_hour}:00
                    </p>
                    <p className="text-sm text-gray-600">{request.teacher_email}</p>
                    <p className="text-sm text-gray-600">
                      {request.note || t("teacherPreferenceNoNote")}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                        request.status === "approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : request.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {t(`teacherPreferenceStatus${request.status[0].toUpperCase()}${request.status.slice(1)}`)}
                    </span>
                    {request.status === "pending" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateRequestStatus(request, "approved")}
                          className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                        >
                          {t("approve")}
                        </button>
                        <button
                          onClick={() => handleUpdateRequestStatus(request, "rejected")}
                          className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                        >
                          {t("reject")}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? t("editTeacher") : t("addTeacher")}
      >
        <Form
          fields={formFields}
          onSubmit={handleSubmit}
          initialValues={
            editingTeacher
              ? {
                  ...editingTeacher,
                  teaching_languages: String(editingTeacher.teaching_languages || "ru,kk")
                    .split(",")
                    .filter(Boolean),
                }
              : { teaching_languages: ["ru", "kk"] }
          }
          submitText={editingTeacher ? t("save") : t("add")}
        />
      </Modal>
    </div>
  );
};

export default TeacherManager;

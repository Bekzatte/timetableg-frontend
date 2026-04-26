import { useEffect, useMemo, useState } from "react";
import { Bell, Plus, Trash2 } from "lucide-react";
import DataTable from "../ui/DataTable";
import Modal from "../ui/Modal";
import Form from "../ui/Form";
import { useAuth } from "../../hooks/useAuth";
import { adminAPI, teacherAPI, teacherPreferenceAPI } from "../../services/api";
import { useFetch } from "../../hooks/useAPI";
import { useTranslation } from "../../hooks/useTranslation";
import { STUDY_LANGUAGES } from "../../constants/languages";

export const TeacherManager = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingRequestId, setIsDeletingRequestId] = useState(null);
  const [isClearingRequests, setIsClearingRequests] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [draftSubjectFilter, setDraftSubjectFilter] = useState("");
  const [draftLanguageFilter, setDraftLanguageFilter] = useState("");
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

  const teachers = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const subjectOptions = useMemo(
    () =>
      Array.from(
        new Set(
          teachers.flatMap((teacher) =>
            Array.isArray(teacher.assigned_disciplines) ? teacher.assigned_disciplines : [],
          ),
        ),
      ).sort((left, right) => left.localeCompare(right, "ru")),
    [teachers],
  );
  const hasActiveFilters = Boolean(subjectFilter || languageFilter);
  const filteredTeachers = useMemo(
    () =>
      teachers.filter((teacher) => {
        const teacherDisciplines = Array.isArray(teacher.assigned_disciplines)
          ? teacher.assigned_disciplines
          : [];
        const matchesSubject =
          !subjectFilter || teacherDisciplines.includes(subjectFilter);
        const matchesLanguage =
          !languageFilter ||
          String(teacher.teaching_languages || "ru,kk")
            .split(",")
            .map((item) => item.trim())
            .includes(languageFilter);
        return matchesSubject && matchesLanguage;
      }),
    [teachers, subjectFilter, languageFilter],
  );
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
      setIsSubmitting(true);
      const normalizedEmail = String(formData.email || "").trim().toLowerCase();

      if (!normalizedEmail.endsWith("@kazatu.edu.kz")) {
        setErrors((prev) => ({
          ...prev,
          error: t("errorTeacherEmailDomainRequired"),
        }));
        return;
      }

      if (editingTeacher) {
        await teacherAPI.update(editingTeacher.id, {
          ...formData,
          email: normalizedEmail,
          teaching_languages: formData.teaching_languages || ["ru", "kk"],
        });
      } else {
        await teacherAPI.create({
          ...formData,
          email: normalizedEmail,
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
    } finally {
      setIsSubmitting(false);
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

  const handleDeleteRequest = async (request) => {
    if (!window.confirm(t("confirmDeleteTeacherRequest"))) {
      return;
    }

    try {
      setIsDeletingRequestId(request.id);
      await teacherPreferenceAPI.deleteOne(request.id);
      await executePreferenceRequests();
    } catch (error) {
      console.error(t("errorDeleteTeacherRequest"), error);
    } finally {
      setIsDeletingRequestId(null);
    }
  };

  const handleClearRequests = async () => {
    if (!window.confirm(t("confirmClearTeacherRequests"))) {
      return;
    }

    try {
      setIsClearingRequests(true);
      await teacherPreferenceAPI.deleteAll();
      await executePreferenceRequests();
    } catch (error) {
      console.error(t("errorDeleteTeacherRequest"), error);
    } finally {
      setIsClearingRequests(false);
    }
  };

  const columns = [
    { key: "name", label: t("fullName") },
    { key: "email", label: t("email") },
    { key: "phone", label: t("phone") },
    {
      key: "assigned_disciplines_text",
      label: t("assignedDisciplines"),
      render: (value) => value || "—",
    },
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
      label: t("email"),
      type: "email",
      placeholder: "name@kazatu.edu.kz",
      required: true,
    },
    { name: "phone", label: t("phone"), placeholder: t("phonePlaceholder"), required: true },
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
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
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
            {t("totalSubjects")}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {subjectOptions.length}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsRequestsModalOpen(true)}
          className="rounded-2xl border border-amber-100 bg-amber-50 p-5 text-left transition hover:bg-amber-100"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-amber-700">
                {t("teacherRequestsTitle")}
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {preferenceRequests.length}
              </p>
            </div>
            <Bell size={22} className="text-amber-700" />
          </div>
        </button>
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
            disabled={isClearing || teachers.length === 0}
            className="w-full rounded-md bg-red-600 px-4 py-2 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isClearing ? t("loading") : t("clearTeachers")}
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredTeachers}
        onEdit={handleEditTeacher}
        onDelete={handleDeleteTeacher}
        isLoading={isLoading}
        enableSearch
        hasActiveFilters={hasActiveFilters}
        filterDialogTitle={t("filter")}
        onApplyFilters={() => {
          setSubjectFilter(draftSubjectFilter);
          setLanguageFilter(draftLanguageFilter);
        }}
        onResetFilters={() => {
          setDraftSubjectFilter("");
          setDraftLanguageFilter("");
          setSubjectFilter("");
          setLanguageFilter("");
        }}
        filterControls={
          <>
            <select
              value={draftSubjectFilter}
              onChange={(event) => setDraftSubjectFilter(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              <option value="">{t("all")} {t("assignedDisciplines").toLowerCase()}</option>
              {subjectOptions.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            <select
              value={draftLanguageFilter}
              onChange={(event) => setDraftLanguageFilter(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              <option value="">{t("all")} {t("teachingLanguages").toLowerCase()}</option>
              {STUDY_LANGUAGES.map((language) => (
                <option key={language.value} value={language.value}>
                  {t(language.labelKey)}
                </option>
              ))}
            </select>
          </>
        }
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? t("editTeacher") : t("addTeacher")}
      >
        <Form
          fields={formFields}
          onSubmit={handleSubmit}
          resetKey={editingTeacher ? `teacher-${editingTeacher.id}` : "teacher-new"}
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
          isLoading={isSubmitting}
        />
      </Modal>

      <Modal
        isOpen={isRequestsModalOpen}
        onClose={() => setIsRequestsModalOpen(false)}
        title={t("teacherRequestsTitle")}
        size="md"
      >
        <div className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {t("teacherRequestsDescription")}
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
                {preferenceRequests.length}
              </div>
              <button
                type="button"
                onClick={handleClearRequests}
                disabled={isClearingRequests || preferenceRequests.length === 0}
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isClearingRequests ? t("loading") : t("clearTeacherRequests")}
              </button>
            </div>
          </div>

          {isPreferenceRequestsLoading ? (
            <div className="rounded-xl bg-gray-50 px-4 py-6 text-center text-gray-500">
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
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
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
                      <div className="flex items-center gap-2">
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
                        <button
                          type="button"
                          onClick={() => handleDeleteRequest(request)}
                          disabled={isDeletingRequestId === request.id}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label={t("delete")}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
      </Modal>
    </div>
  );
};

export default TeacherManager;

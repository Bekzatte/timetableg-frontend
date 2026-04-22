import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import DataTable from "../ui/DataTable";
import Modal from "../ui/Modal";
import Form from "../ui/Form";
import { useAuth } from "../../hooks/useAuth";
import { adminAPI, groupAPI } from "../../services/api";
import { useFetch } from "../../hooks/useAPI";
import { useTranslation } from "../../hooks/useTranslation";
import { STUDY_LANGUAGES } from "../../constants/languages";
import {
  PROGRAMMES,
  getCanonicalProgrammeName,
  getProgrammeLabel,
} from "../../constants/programmes";

export const GroupManager = () => {
  const { t, language } = useTranslation();
  const { isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [languageFilter, setLanguageFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [draftLanguageFilter, setDraftLanguageFilter] = useState("");
  const [draftCourseFilter, setDraftCourseFilter] = useState("");
  const { data, isLoading, execute } = useFetch(groupAPI.getAll);

  useEffect(() => {
    execute();
  }, [execute]);

  const groups = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const filteredGroups = useMemo(
    () =>
      groups.filter((group) => {
        const matchesLanguage = !languageFilter || group.language === languageFilter;
        const matchesCourse = !courseFilter || String(group.study_course) === courseFilter;
        return matchesLanguage && matchesCourse;
      }),
    [groups, languageFilter, courseFilter],
  );
  const totalStudents = groups.reduce(
    (sum, group) => sum + (Number(group.student_count) || 0),
    0,
  );
  const hasActiveFilters = Boolean(languageFilter || courseFilter);

  const handleSubmit = async (formData, setErrors) => {
    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        student_count: Number(formData.student_count),
        entry_year: formData.entry_year ? Number(formData.entry_year) : null,
        study_course: formData.study_course ? Number(formData.study_course) : null,
        has_subgroups: 0,
        language: formData.language || "ru",
        programme: formData.programme || "",
        specialty_code: formData.specialty_code || "",
      };
      if (editingGroup) {
        await groupAPI.update(editingGroup.id, payload);
      } else {
        await groupAPI.create(payload);
      }
      await execute();
      setIsModalOpen(false);
    } catch (error) {
      setErrors((prev) => ({ ...prev, error: error.message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearGroups = async () => {
    if (!window.confirm(t("confirmClearGroups"))) {
      return;
    }
    try {
      setIsClearing(true);
      await adminAPI.clearCollection("groups");
      await execute();
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteGroup = async (group) => {
    if (!window.confirm(`${t("delete")} "${group.name}"?`)) {
      return;
    }

    try {
      await groupAPI.delete(group.id);
      await execute();
    } catch (error) {
      console.error("Error deleting group:", error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm text-center">
        <h2 className="text-xl font-semibold text-gray-900">{t("accessDenied")}</h2>
        <p className="text-gray-600 mt-2">{t("adminOnly")}</p>
      </div>
    );
  }

  const columns = [
    { key: "name", label: t("groupNumber") },
    { key: "programme", label: t("programmeName") },
    { key: "specialty_code", label: t("specialtyCode") },
    { key: "student_count", label: t("studentCount") },
    { key: "entry_year", label: t("entryYear") },
    { key: "study_course", label: t("studyCourse") },
    {
      key: "language",
      label: t("studyLanguage"),
      render: (value) => t(value === "kk" ? "languageKazakh" : "languageRussian"),
    },
  ];

  const formFields = [
    {
      name: "name",
      label: t("groupNumber"),
      placeholder: "SE-23-01",
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
      name: "specialty_code",
      label: t("specialtyCode"),
      placeholder: "КИ / БИ / КИ СОПР",
      required: true,
    },
    {
      name: "student_count",
      label: t("studentCount"),
      type: "number",
      placeholder: "25",
      required: true,
    },
    {
      name: "entry_year",
      label: t("entryYear"),
      type: "number",
      placeholder: "2025",
    },
    {
      name: "study_course",
      label: t("studyCourse"),
      type: "select",
      placeholder: t("selectStudyCourse"),
      options: [1, 2, 3, 4, 5, 6].map((course) => ({
        value: course,
        label: String(course),
      })),
    },
    {
      name: "language",
      label: t("studyLanguage"),
      type: "select",
      placeholder: t("selectStudyLanguage"),
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
          <p className="text-sm font-medium text-blue-700">{t("groupsCount")}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{groups.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <p className="text-sm font-medium text-emerald-700">{t("studentsCount")}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{totalStudents}</p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("groups")}</h1>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <button
            onClick={() => {
              setEditingGroup(null);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 w-full sm:w-auto"
          >
            <Plus size={20} /> {t("addGroup")}
          </button>
          <button
            onClick={handleClearGroups}
            disabled={isClearing || groups.length === 0}
            className="w-full rounded-md bg-red-600 px-4 py-2 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isClearing ? t("loading") : t("clearGroups")}
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredGroups}
        isLoading={isLoading}
        onDelete={handleDeleteGroup}
        enableSearch
        hasActiveFilters={hasActiveFilters}
        filterDialogTitle={t("filter")}
        onApplyFilters={() => {
          setLanguageFilter(draftLanguageFilter);
          setCourseFilter(draftCourseFilter);
        }}
        onResetFilters={() => {
          setDraftLanguageFilter("");
          setDraftCourseFilter("");
          setLanguageFilter("");
          setCourseFilter("");
        }}
        filterControls={
          <>
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
              value={draftLanguageFilter}
              onChange={(event) => setDraftLanguageFilter(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              <option value="">{t("all")} {t("studyLanguage").toLowerCase()}</option>
              {STUDY_LANGUAGES.map((language) => (
                <option key={language.value} value={language.value}>
                  {t(language.labelKey)}
                </option>
              ))}
            </select>
          </>
        }
        onEdit={(group) => {
          setEditingGroup(group);
          setIsModalOpen(true);
        }}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGroup ? t("editGroup") : t("addGroup")}
      >
        <Form
          fields={formFields}
          onSubmit={handleSubmit}
          resetKey={editingGroup ? `group-${editingGroup.id}` : "group-new"}
          initialValues={{ language: "ru", ...(editingGroup || {}) }}
          submitText={editingGroup ? t("save") : t("add")}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
};

export default GroupManager;

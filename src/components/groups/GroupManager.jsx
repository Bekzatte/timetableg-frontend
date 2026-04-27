import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import DataTable from "../ui/DataTable";
import Modal from "../ui/Modal";
import Form from "../ui/Form";
import { useAuth } from "../../hooks/useAuth";
import { adminAPI, groupAPI } from "../../services/api";
import { useFetch } from "../../hooks/useAPI";
import { useGlobalLoader } from "../../hooks/useGlobalLoader";
import { useTranslation } from "../../hooks/useTranslation";
import { STUDY_LANGUAGES } from "../../constants/languages";
import {
  EDUCATION_GROUPS,
  PROGRAMME_CODE_TO_EDUCATION_GROUP,
  getEducationGroupLabel,
  getProgrammeOptionsByEducationGroup,
  getSpecialtyLabel,
} from "../../constants/educationGroups";

export const GroupManager = () => {
  const { t } = useTranslation();
  const { withGlobalLoader } = useGlobalLoader();
  const { isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [languageFilter, setLanguageFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [draftLanguageFilter, setDraftLanguageFilter] = useState("");
  const [draftCourseFilter, setDraftCourseFilter] = useState("");
  const { data, isLoading, execute, setData } = useFetch(groupAPI.getAll);

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
  const totalStudents = filteredGroups.reduce(
    (sum, group) => sum + (Number(group.student_count) || 0),
    0,
  );
  const hasActiveFilters = Boolean(languageFilter || courseFilter);

  const getModalSubgroupStatus = (group) => {
    if (group?.auto_has_subgroups || group?.has_subgroups) {
      return "ab";
    }
    return "auto";
  };

  const getEditingProgrammeValue = (group) => {
    if (!group) {
      return "";
    }
    if (EDUCATION_GROUPS.some((item) => item.value === group.programme)) {
      return group.programme;
    }
    if (group.specialty_code && PROGRAMME_CODE_TO_EDUCATION_GROUP[group.specialty_code]) {
      return PROGRAMME_CODE_TO_EDUCATION_GROUP[group.specialty_code];
    }
    const normalizedProgramme = String(group.programme || "").toLowerCase();
    const matchedGroup = EDUCATION_GROUPS.find((item) =>
      normalizedProgramme.includes(item.value),
    );
    return matchedGroup?.value || "";
  };

  const upsertGroup = (savedGroup) => {
    if (!savedGroup?.id) {
      return;
    }

    setData((currentData) => {
      const currentGroups = Array.isArray(currentData) ? currentData : [];
      const existingIndex = currentGroups.findIndex((group) => group.id === savedGroup.id);
      const normalizedGroup = {
        auto_has_subgroups: savedGroup.auto_has_subgroups ?? savedGroup.has_subgroups ?? 0,
        generated_subgroups: savedGroup.generated_subgroups || "",
        ...savedGroup,
      };

      if (existingIndex === -1) {
        return [...currentGroups, normalizedGroup];
      }

      const nextGroups = [...currentGroups];
      nextGroups[existingIndex] = {
        ...nextGroups[existingIndex],
        ...normalizedGroup,
      };
      return nextGroups;
    });
  };

  const handleSubmit = async (formData, setErrors) => {
    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name,
        student_count: Number(formData.student_count),
        language: formData.language || "ru",
        programme: formData.programme || "",
        specialty_code: formData.specialty_code || "",
        entry_year: formData.entry_year ? Number(formData.entry_year) : null,
        study_course: formData.study_course ? Number(formData.study_course) : null,
        has_subgroups: formData.subgroup_status === "ab" ? 1 : 0,
      };
      const savedGroup = await withGlobalLoader(
        () =>
          editingGroup
            ? groupAPI.update(editingGroup.id, payload)
            : groupAPI.create(payload),
        {
          title: editingGroup ? t("save") : t("addGroup"),
          description: t("globalLoaderSaveDescription"),
        },
      );

      upsertGroup(savedGroup);
      setIsModalOpen(false);

      if (editingGroup) {
        setEditingGroup(null);
      }

      execute().catch((refreshError) => {
        console.error("Error refreshing groups after save:", refreshError);
      });
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
      await withGlobalLoader(
        () => adminAPI.clearCollection("groups"),
        {
          title: t("clearGroups"),
          description: t("globalLoaderClearDescription"),
        },
      );
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
      await withGlobalLoader(
        () => groupAPI.delete(group.id),
        {
          title: t("delete"),
          description: t("globalLoaderDeleteDescription"),
        },
      );
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

  const renderAutoSubgroupStatus = (_value, row) => {
    if (row.auto_has_subgroups || row.has_subgroups) {
      return (
        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
          {`${t("subgroups")} A/B`}
        </span>
      );
    }

    return (
      <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
        {t("autoSubgroupsNotSplit")}
      </span>
    );
  };

  const columns = [
    { key: "name", label: t("groupNumber") },
    {
      key: "programme",
      label: t("educationalProgrammeGroup"),
      render: (value) => getEducationGroupLabel(value),
    },
    {
      key: "specialty_code",
      label: t("specialtyCode"),
      render: (value) => getSpecialtyLabel(value),
    },
    { key: "student_count", label: t("studentCount") },
    {
      key: "auto_has_subgroups",
      label: t("autoSubgroupsStatus"),
      render: renderAutoSubgroupStatus,
    },
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
      label: t("educationalProgrammeGroup"),
      type: "select",
      placeholder: t("selectEducationalProgrammeGroup"),
      options: EDUCATION_GROUPS.map((group) => ({
        value: group.value,
        label: group.label,
      })),
      onChange: () => ({ specialty_code: "" }),
      required: true,
    },
    {
      name: "specialty_code",
      label: t("specialtyCode"),
      type: "select",
      placeholder: t("selectSpecialty"),
      options: (formData) => getProgrammeOptionsByEducationGroup(formData.programme),
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
      name: "subgroup_status",
      label: t("autoSubgroupsStatus"),
      type: "select",
      placeholder: t("autoSubgroupsStatus"),
      options: [
        { value: "auto", label: t("auto") },
        { value: "ab", label: "A/B" },
      ],
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
          <p className="mt-2 text-3xl font-bold text-gray-900">{filteredGroups.length}</p>
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
            {t("clearGroups")}
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
          initialValues={{
            language: "ru",
            ...(editingGroup || {}),
            programme: editingGroup ? getEditingProgrammeValue(editingGroup) : "",
            subgroup_status: editingGroup ? getModalSubgroupStatus(editingGroup) : "auto",
          }}
          submitText={editingGroup ? t("save") : t("add")}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
};

export default GroupManager;

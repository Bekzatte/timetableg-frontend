import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import DataTable from "../ui/DataTable";
import Modal from "../ui/Modal";
import Form from "../ui/Form";
import { useAuth } from "../../hooks/useAuth";
import { adminAPI, groupAPI } from "../../services/api";
import { useFetch } from "../../hooks/useAPI";
import { useTranslation } from "../../hooks/useTranslation";
import { STUDY_LANGUAGES } from "../../constants/languages";

export const GroupManager = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [isClearing, setIsClearing] = useState(false);
  const { data, isLoading, execute } = useFetch(groupAPI.getAll);

  useEffect(() => {
    execute();
  }, [execute]);

  const groups = Array.isArray(data) ? data : [];
  const totalStudents = groups.reduce(
    (sum, group) => sum + (Number(group.student_count) || 0),
    0,
  );

  const handleSubmit = async (formData, setErrors) => {
    try {
      const payload = {
        ...formData,
        student_count: Number(formData.student_count),
        has_subgroups: formData.has_subgroups ? 1 : 0,
        language: formData.language || "ru",
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
    { key: "student_count", label: t("studentCount") },
    {
      key: "language",
      label: t("studyLanguage"),
      render: (value) => t(value === "kk" ? "languageKazakh" : "languageRussian"),
    },
    {
      key: "has_subgroups",
      label: t("subgroups"),
      render: (value) => (value ? "A / B" : t("no")),
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
      name: "student_count",
      label: t("studentCount"),
      type: "number",
      placeholder: "25",
      required: true,
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
    {
      name: "has_subgroups",
      label: t("subgroups"),
      type: "toggle",
      trueLabel: "A / B",
      falseLabel: t("no"),
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
            disabled={isClearing}
            className="w-full rounded-md bg-red-600 px-4 py-2 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isClearing ? t("loading") : t("clearGroups")}
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={groups}
        isLoading={isLoading}
        onDelete={handleDeleteGroup}
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
          initialValues={{ has_subgroups: 0, language: "ru", ...(editingGroup || {}) }}
          submitText={editingGroup ? t("save") : t("add")}
        />
      </Modal>
    </div>
  );
};

export default GroupManager;

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import DataTable from "../ui/DataTable";
import Modal from "../ui/Modal";
import Form from "../ui/Form";
import { useAuth } from "../../hooks/useAuth";
import { adminAPI, courseAPI, groupAPI, sectionAPI } from "../../services/api";
import { useFetch } from "../../hooks/useAPI";
import { useTranslation } from "../../hooks/useTranslation";

export const SectionManager = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lessonTypeFilter, setLessonTypeFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [draftLessonTypeFilter, setDraftLessonTypeFilter] = useState("");
  const [draftGroupFilter, setDraftGroupFilter] = useState("");
  const { data, isLoading, execute } = useFetch(sectionAPI.getAll);
  const {
    data: coursesData,
    isLoading: isCoursesLoading,
    execute: executeCourses,
  } = useFetch(courseAPI.getAll);
  const {
    data: groupsData,
    isLoading: isGroupsLoading,
    execute: executeGroups,
  } = useFetch(groupAPI.getAll);

  useEffect(() => {
    execute();
    executeCourses();
    executeGroups();
  }, [execute, executeCourses, executeGroups]);

  const sections = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const courses = Array.isArray(coursesData) ? coursesData : [];
  const groups = Array.isArray(groupsData) ? groupsData : [];
  const hasActiveFilters = Boolean(lessonTypeFilter || groupFilter);
  const isSectionFormBlocked = courses.length === 0 || groups.length === 0;
  const sectionFormHint =
    courses.length === 0
      ? t("sectionsNeedCoursesFirst")
      : groups.length === 0
        ? t("sectionsNeedGroupsFirst")
        : "";
  const filteredSections = useMemo(
    () =>
      sections.filter((section) => {
        const matchesLessonType = !lessonTypeFilter || section.lesson_type === lessonTypeFilter;
        const matchesGroup = !groupFilter || String(section.group_id) === groupFilter;
        return matchesLessonType && matchesGroup;
      }),
    [sections, lessonTypeFilter, groupFilter],
  );

  const handleAddSection = () => {
    setEditingSection(null);
    setIsModalOpen(true);
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    setIsModalOpen(true);
  };

  const handleClearSections = async () => {
    if (!window.confirm(t("confirmClearSections"))) {
      return;
    }

    try {
      setIsClearing(true);
      await adminAPI.clearCollection("sections");
      await execute();
    } finally {
      setIsClearing(false);
    }
  };

  const handleSubmit = async (formData, setErrors) => {
    const selectedCourse = courses.find(
      (course) => String(course.id) === String(formData.course_id),
    );
    const selectedGroup = groups.find(
      (group) => String(group.id) === String(formData.group_id),
    );

    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        course_id: Number(formData.course_id),
        group_id: Number(formData.group_id),
        course_name: selectedCourse?.name || "",
        group_name: selectedGroup?.name || "",
      };

      if (editingSection) {
        await sectionAPI.update(editingSection.id, payload);
      } else {
        await sectionAPI.create(payload);
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
    { key: "course_name", label: t("courseName") },
    { key: "group_name", label: t("groupNumber") },
    { key: "classes_count", label: t("classesCount") },
    { key: "lesson_type", label: t("lessonType"), render: (value) => t(value || "lecture") },
    {
      key: "requires_computers",
      label: t("requiresComputers"),
      render: (_value, section) => (section.lesson_type === "practical" || section.lesson_type === "lab" ? t("yes") : t("no")),
    },
    { key: "subgroup_mode", label: t("subgroupMode"), render: (value) => t(value || "auto") },
    { key: "subgroup_count", label: t("subgroupCount") },
  ];

  const formFields = [
    {
      name: "course_id",
      label: t("courseName"),
      type: "select",
      placeholder: isCoursesLoading ? t("loading") : t("selectCourse"),
      options: courses.map((course) => ({
        value: course.id,
        label: `${course.code || course.name} - ${course.name}`,
      })),
      required: true,
    },
    {
      name: "group_id",
      label: t("groupNumber"),
      type: "select",
      placeholder: isGroupsLoading ? t("loading") : t("selectGroup"),
      options: groups.map((group) => ({
        value: group.id,
        label: group.name,
      })),
      required: true,
    },
    {
      name: "classes_count",
      label: t("classesCount"),
      type: "number",
      placeholder: "1",
      required: true,
    },
    {
      name: "lesson_type",
      label: t("lessonType"),
      type: "select",
      placeholder: t("selectLessonType"),
      options: [
        { value: "lecture", label: t("lecture") },
        { value: "practical", label: t("practical") },
        { value: "lab", label: t("lab") },
      ],
      required: true,
    },
    {
      name: "subgroup_mode",
      label: t("subgroupMode"),
      type: "select",
      placeholder: t("selectSubgroupMode"),
      options: [
        { value: "auto", label: t("auto") },
        { value: "none", label: t("none") },
        { value: "forced", label: t("forced") },
      ],
    },
    {
      name: "subgroup_count",
      label: t("subgroupCount"),
      type: "number",
      placeholder: "2",
    },
  ];

  return (
    <div className="p-6 bg-white">
      <div className="mb-6 grid grid-cols-1 gap-4">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-sm font-medium text-blue-700">
            {t("sectionsCount")}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {sections.length}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {t("sections")}
        </h1>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <button
            onClick={handleAddSection}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition w-full sm:w-auto"
          >
            <Plus size={20} /> {t("addSection")}
          </button>
          <button
            onClick={handleClearSections}
            disabled={isClearing || sections.length === 0}
            className="w-full rounded-md bg-red-600 px-4 py-2 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isClearing ? t("loading") : t("clearSections")}
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredSections}
        onEdit={handleEditSection}
        isLoading={isLoading}
        enableSearch
        hasActiveFilters={hasActiveFilters}
        filterDialogTitle={t("filter")}
        onApplyFilters={() => {
          setLessonTypeFilter(draftLessonTypeFilter);
          setGroupFilter(draftGroupFilter);
        }}
        onResetFilters={() => {
          setDraftLessonTypeFilter("");
          setDraftGroupFilter("");
          setLessonTypeFilter("");
          setGroupFilter("");
        }}
        filterControls={
          <>
            <select
              value={draftLessonTypeFilter}
              onChange={(event) => setDraftLessonTypeFilter(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              <option value="">{t("all")} {t("lessonType").toLowerCase()}</option>
              <option value="lecture">{t("lecture")}</option>
              <option value="practical">{t("practical")}</option>
              <option value="lab">{t("lab")}</option>
            </select>
            <select
              value={draftGroupFilter}
              onChange={(event) => setDraftGroupFilter(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              <option value="">{t("all")} {t("groups").toLowerCase()}</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </>
        }
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSection ? t("editSection") : t("addSection")}
      >
        <Form
          fields={formFields}
          onSubmit={handleSubmit}
          resetKey={editingSection ? `section-${editingSection.id}` : "section-new"}
          isSubmitDisabled={isSectionFormBlocked}
          submitHint={sectionFormHint}
          initialValues={
            editingSection
              ? {
                  ...editingSection,
                  course_id: editingSection.course_id || "",
                  group_id: editingSection.group_id || "",
                  classes_count: editingSection.classes_count || 1,
                  lesson_type: editingSection.lesson_type || "lecture",
                  subgroup_mode: editingSection.subgroup_mode || "auto",
                  subgroup_count: editingSection.subgroup_count || 1,
                }
              : { classes_count: 1, lesson_type: "lecture", subgroup_mode: "auto", subgroup_count: 1 }
          }
          submitText={editingSection ? t("save") : t("add")}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
};

export default SectionManager;

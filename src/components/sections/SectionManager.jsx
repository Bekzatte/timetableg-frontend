import { useMemo, useState } from "react";
import { Eye, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCoursesQuery,
  useGroupsQuery,
  useSectionValidationReportQuery,
  useSectionsQuery,
  useTeachersQuery,
} from "../../api/collectionQueries";
import { queryKeys } from "../../api/queryKeys";
import DataTable from "../ui/DataTable";
import Modal from "../ui/Modal";
import Form from "../ui/Form";
import SectionDiagnostics from "./SectionDiagnostics";
import { useAuth } from "../../hooks/useAuth";
import { adminAPI, sectionAPI } from "../../services/api";
import { useGlobalLoader } from "../../hooks/useGlobalLoader";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { useTranslation } from "../../hooks/useTranslation";

export const SectionManager = () => {
  const { t } = useTranslation();
  const { withGlobalLoader } = useGlobalLoader();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingSections, setIsGeneratingSections] = useState(false);
  const [generateResult, setGenerateResult] = useState(null);
  const [generateError, setGenerateError] = useState("");
  const [previewResult, setPreviewResult] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [isPreviewingSections, setIsPreviewingSections] = useState(false);
  const [activeStudyCourse, setActiveStudyCourse] = useState("all");
  const [lessonTypeFilter, setLessonTypeFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [draftLessonTypeFilter, setDraftLessonTypeFilter] = useState("");
  const [draftGroupFilter, setDraftGroupFilter] = useState("");
  const sectionsQuery = useSectionsQuery();
  const coursesQuery = useCoursesQuery();
  const groupsQuery = useGroupsQuery();
  const teachersQuery = useTeachersQuery();
  const validationReportQuery = useSectionValidationReportQuery();
  const fetchValidationReport = () => validationReportQuery.refetch();

  const sections = useMemo(
    () => (Array.isArray(sectionsQuery.data) ? sectionsQuery.data : []),
    [sectionsQuery.data],
  );
  const courses = useMemo(
    () => (Array.isArray(coursesQuery.data) ? coursesQuery.data : []),
    [coursesQuery.data],
  );
  const groups = useMemo(
    () => (Array.isArray(groupsQuery.data) ? groupsQuery.data : []),
    [groupsQuery.data],
  );
  const teachers = useMemo(
    () => (Array.isArray(teachersQuery.data) ? teachersQuery.data : []),
    [teachersQuery.data],
  );
  const courseById = useMemo(
    () => new Map(courses.map((course) => [String(course.id), course])),
    [courses],
  );
  const sectionsBySecondaryFilters = useMemo(
    () =>
      sections.filter((section) => {
        const matchesLessonType =
          !lessonTypeFilter || section.lesson_type === lessonTypeFilter;
        const matchesGroup = !groupFilter || String(section.group_id) === groupFilter;
        return matchesLessonType && matchesGroup;
      }),
    [sections, lessonTypeFilter, groupFilter],
  );
  const studyCourseTabs = useMemo(() => {
    const years = [...new Set(
      sectionsBySecondaryFilters
        .map((section) => Number(courseById.get(String(section.course_id))?.year))
        .filter((year) => Number.isFinite(year) && year > 0),
    )].sort((left, right) => left - right);

    return [
      { value: "all", label: t("all"), count: sectionsBySecondaryFilters.length },
      ...years.map((year) => ({
        value: String(year),
        label: `${year} ${t("studyCourse").toLowerCase()}`,
        count: sectionsBySecondaryFilters.filter(
          (section) => Number(courseById.get(String(section.course_id))?.year) === year,
        ).length,
      })),
    ];
  }, [courseById, sectionsBySecondaryFilters, t]);
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
      sectionsBySecondaryFilters.filter((section) => {
        const sectionStudyCourse = String(courseById.get(String(section.course_id))?.year || "");
        return activeStudyCourse === "all" || sectionStudyCourse === activeStudyCourse;
      }),
    [sectionsBySecondaryFilters, courseById, activeStudyCourse],
  );
  const handleAddSection = () => {
    setEditingSection(null);
    setIsModalOpen(true);
  };

  const handlePreviewSections = async () => {
    try {
      setIsPreviewingSections(true);
      setPreviewError("");
      setPreviewResult(null);
      const result = await withGlobalLoader(
        () => sectionAPI.previewGenerateFromIup({ strict_mode: true }),
        {
          title: t("previewSections"),
          description: t("globalLoaderGenerateDescription"),
        },
      );
      setPreviewResult(result);
    } catch (error) {
      setPreviewError(error.message);
    } finally {
      setIsPreviewingSections(false);
    }
  };

  const handleGenerateSections = async () => {
    try {
      setIsGeneratingSections(true);
      setGenerateError("");
      setGenerateResult(null);
      const result = await withGlobalLoader(
        () => sectionAPI.generateFromIup({ strict_mode: true }),
        {
          title: t("generateSections"),
          description: t("globalLoaderGenerateDescription"),
        },
      );
      await queryClient.invalidateQueries({ queryKey: queryKeys.sections.all });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sections.validationReport,
      });
      setGenerateResult(result);
    } catch (error) {
      setGenerateError(error.message);
    } finally {
      setIsGeneratingSections(false);
    }
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    setIsModalOpen(true);
  };

  const handleClearSections = async () => {
    const confirmed = await confirm({
      message: t("confirmClearSections"),
      confirmLabel: t("delete"),
    });
    if (!confirmed) {
      return;
    }

    try {
      setIsClearing(true);
      await withGlobalLoader(() => adminAPI.clearCollection("sections"), {
        title: t("clearSections"),
        description: t("globalLoaderClearDescription"),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.sections.all });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sections.validationReport,
      });
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
    const selectedTeacher = teachers.find(
      (teacher) => String(teacher.id) === String(formData.teacher_id),
    );

    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        course_id: Number(formData.course_id),
        group_id: Number(formData.group_id),
        course_name: selectedCourse?.name || "",
        group_name: selectedGroup?.name || "",
        teacher_id: formData.teacher_id ? Number(formData.teacher_id) : null,
        teacher_name: selectedTeacher?.name || "",
      };

      await withGlobalLoader(
        () => (editingSection ? sectionAPI.update(editingSection.id, payload) : sectionAPI.create(payload)),
        {
          title: editingSection ? t("save") : t("addSection"),
          description: t("globalLoaderSaveDescription"),
        },
      );
      await queryClient.invalidateQueries({ queryKey: queryKeys.sections.all });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sections.validationReport,
      });
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
    { key: "teacher_name", label: t("teacherName"), render: (value) => value || "-" },
    {
      key: "requires_computers",
      label: t("requiresComputers"),
      render: (value, section) => (Number(value || 0) === 1 || section.lesson_type === "lab" ? t("yes") : t("no")),
    },
    { key: "subgroup_mode", label: t("subgroupMode"), render: (value) => t(value || "auto") },
    { key: "subgroup_count", label: t("subgroupCount") },
  ];

  const formFields = [
    {
      name: "course_id",
      label: t("courseName"),
      type: "select",
      placeholder: coursesQuery.isLoading ? t("loading") : t("selectCourse"),
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
      placeholder: groupsQuery.isLoading ? t("loading") : t("selectGroup"),
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
      name: "teacher_id",
      label: t("teacherName"),
      type: "select",
      placeholder: teachersQuery.isLoading ? t("loading") : t("autoTeacherFromIup"),
      options: [
        { value: "", label: t("autoTeacherFromIup") },
        ...teachers.map((teacher) => ({
          value: teacher.id,
          label: teacher.name,
        })),
      ],
    },
    {
      name: "requires_computers_preview",
      label: t("requiresComputers"),
      type: "computed",
      render: (formData) =>
        formData.lesson_type === "lab" ? t("yes") : t("no"),
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
      <ConfirmDialog />
      <div className="mb-6 grid grid-cols-1 gap-4">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-sm font-medium text-blue-700">
            {t("sectionsCount")}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {filteredSections.length}
          </p>
        </div>
      </div>

      <SectionDiagnostics
        report={validationReportQuery.data}
        error={validationReportQuery.error?.message || ""}
        isLoading={validationReportQuery.isLoading}
        sectionsCount={sections.length}
        onRefresh={fetchValidationReport}
      />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {t("sections")}
        </h1>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <button
            onClick={handlePreviewSections}
            disabled={isPreviewingSections}
            className="flex items-center justify-center gap-2 rounded-md border border-[#014531] bg-white px-4 py-2 text-[#014531] transition hover:bg-[#f4fbf7] disabled:cursor-not-allowed disabled:opacity-60 w-full sm:w-auto"
          >
            <Eye size={18} /> {t("previewSections")}
          </button>
          <button
            onClick={handleGenerateSections}
            disabled={isGeneratingSections}
            className="flex items-center justify-center gap-2 rounded-md bg-[#014531] px-4 py-2 text-white transition hover:bg-[#013726] w-full sm:w-auto"
          >
            {t("generateSectionsFromIup")}
          </button>
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
            {t("clearSections")}
          </button>
        </div>
      </div>

      {generateError ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {generateError}
        </div>
      ) : null}

      {previewError ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {previewError}
        </div>
      ) : null}

      {previewResult ? (
        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          <p className="font-semibold">{t("sectionsPreviewReady")}</p>
          <p className="mt-1">
            {t("wouldCreate")}: {previewResult.inserted || 0}. {t("wouldUpdate")}: {previewResult.updated || 0}.{" "}
            {t("skipped")}: {previewResult.skipped || 0}. {t("validationIssues")}: {previewResult.issues?.length || 0}.
          </p>
        </div>
      ) : null}

      {generateResult ? (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <p className="font-semibold">{t("sectionsGenerated")}</p>
          <p className="mt-1">
            {t("created")}: {generateResult.inserted || 0}. {t("updated")}: {generateResult.updated || 0}.
            {" "}
            {t("skipped")}: {generateResult.skipped || 0}.
          </p>
          {generateResult.missing?.groups || generateResult.missing?.components ? (
            <p className="mt-2 text-amber-700">
              {generateResult.missing?.groups ? t("sectionsGenerateNoGroups") : ""}
              {generateResult.missing?.groups && generateResult.missing?.components ? " " : ""}
              {generateResult.missing?.components ? t("sectionsGenerateNoComponents") : ""}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mb-5 overflow-x-auto">
        <div
          role="tablist"
          aria-label={t("studyCourse")}
          className="inline-flex min-w-full gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1 sm:min-w-0"
        >
          {studyCourseTabs.map((tab) => {
            const isActive = activeStudyCourse === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveStudyCourse(tab.value)}
                className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#014531] text-white shadow-sm"
                    : "text-gray-700 hover:bg-white"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  isActive ? "bg-white/20 text-white" : "bg-white text-gray-600"
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredSections}
        onEdit={handleEditSection}
        isLoading={sectionsQuery.isLoading}
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
                  teacher_id: editingSection.teacher_id || "",
                  subgroup_mode: editingSection.subgroup_mode || "auto",
                  subgroup_count: editingSection.subgroup_count || 1,
                }
              : { classes_count: 1, lesson_type: "lecture", teacher_id: "", subgroup_mode: "auto", subgroup_count: 1 }
          }
          submitText={editingSection ? t("save") : t("add")}
          isLoading={isSubmitting}
        />
      </Modal>

    </div>
  );
};

export default SectionManager;

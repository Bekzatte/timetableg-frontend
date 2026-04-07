import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import DataTable from "../ui/DataTable";
import Modal from "../ui/Modal";
import Form from "../ui/Form";
import { useAuth } from "../../hooks/useAuth";
import { courseAPI, groupAPI, sectionAPI } from "../../services/api";
import { useFetch } from "../../hooks/useAPI";
import { useTranslation } from "../../hooks/useTranslation";

export const SectionManager = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
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

  const sections = Array.isArray(data) ? data : [];
  const courses = Array.isArray(coursesData) ? coursesData : [];
  const groups = Array.isArray(groupsData) ? groupsData : [];

  const handleAddSection = () => {
    setEditingSection(null);
    setIsModalOpen(true);
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData, setErrors) => {
    const selectedCourse = courses.find(
      (course) => String(course.id) === String(formData.course_id),
    );
    const selectedGroup = groups.find(
      (group) => String(group.id) === String(formData.group_id),
    );

    try {
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
        <button
          onClick={handleAddSection}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition w-full sm:w-auto"
        >
          <Plus size={20} /> {t("addSection")}
        </button>
      </div>

      <DataTable
        columns={columns}
        data={sections}
        onEdit={handleEditSection}
        isLoading={isLoading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSection ? t("editSection") : t("addSection")}
      >
        <Form
          fields={formFields}
          onSubmit={handleSubmit}
          initialValues={
            editingSection
              ? {
                  ...editingSection,
                  course_id: editingSection.course_id || "",
                  group_id: editingSection.group_id || "",
                }
              : {}
          }
          submitText={editingSection ? t("save") : t("add")}
        />
      </Modal>
    </div>
  );
};

export default SectionManager;

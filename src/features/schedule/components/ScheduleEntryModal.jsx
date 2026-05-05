import Modal from "../../../components/ui/Modal";
import Form from "../../../components/ui/Form";

export const ScheduleEntryModal = ({
  isOpen,
  isLoading,
  isSaving,
  isBlocked,
  hint,
  editingEntry,
  fields,
  scheduleSemester,
  scheduleYear,
  t,
  onClose,
  onSubmit,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={() => {
      if (!isLoading) {
        onClose();
      }
    }}
    title={editingEntry ? t("editScheduleEntry") : t("addScheduleEntry")}
    size="md"
  >
    <Form
      fields={fields}
      onSubmit={onSubmit}
      resetKey={editingEntry ? `schedule-entry-${editingEntry.id}` : "schedule-entry-new"}
      submitText={editingEntry ? t("save") : t("add")}
      isLoading={isSaving}
      isSubmitDisabled={isBlocked}
      submitHint={hint}
      initialValues={
        editingEntry
          ? {
              ...editingEntry,
              section_id: editingEntry.section_id || "",
              room_id: editingEntry.room_id || "",
              start_hour: editingEntry.start_hour || "",
              semester: editingEntry.semester || 1,
              year: editingEntry.year || new Date().getFullYear(),
              subgroup: editingEntry.subgroup || "",
              weekday: editingEntry.weekday || "monday",
            }
          : {
              start_hour: "",
              semester: scheduleSemester,
              year: scheduleYear,
              subgroup: "",
              weekday: "",
            }
      }
    />
  </Modal>
);

import Modal from "../../../components/ui/Modal";
import Form from "../../../components/ui/Form";

export const GenerateScheduleModal = ({
  isOpen,
  isLoading,
  title,
  t,
  fields,
  initialValues,
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
    title={title}
    size="md"
  >
    <div className="mb-4 rounded-md border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
      <h3 className="font-semibold text-emerald-950">
        {t("scheduleGenerationInfoTitle")}
      </h3>
      <p className="mt-2">{t("scheduleGenerationInfoIntro")}</p>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        <li>{t("scheduleGenerationGreedyInfo")}</li>
        <li>{t("scheduleGenerationCpSatInfo")}</li>
        <li>{t("scheduleGenerationHybridInfo")}</li>
        <li>{t("scheduleGenerationCpSatFastInfo")}</li>
      </ul>
      <p className="mt-3 font-medium">{t("scheduleGenerationInfoNote")}</p>
    </div>

    <Form
      fields={fields}
      onSubmit={onSubmit}
      resetKey="schedule-generate"
      submitText={t("generateSchedule")}
      isLoading={isLoading}
      initialValues={initialValues}
    />
  </Modal>
);

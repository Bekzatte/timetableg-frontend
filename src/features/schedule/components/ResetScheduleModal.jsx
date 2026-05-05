import Modal from "../../../components/ui/Modal";
import { SCHEDULE_SEMESTER_OPTIONS } from "../constants";

export const ResetScheduleModal = ({
  isOpen,
  isResetting,
  t,
  currentYear,
  semester,
  year,
  onClose,
  onSemesterChange,
  onYearChange,
  onSubmit,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={() => {
      if (!isResetting) {
        onClose();
      }
    }}
    title={t("resetSchedule")}
    size="sm"
  >
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t("semester")}
        </label>
        <select
          value={semester}
          onChange={(event) => onSemesterChange(Number(event.target.value))}
          disabled={isResetting}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
        >
          {SCHEDULE_SEMESTER_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {t(item.labelKey)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t("year")}
        </label>
        <input
          type="number"
          value={year}
          onChange={(event) => onYearChange(Number(event.target.value) || currentYear)}
          disabled={isResetting}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
        />
      </div>

      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {t("confirmResetSchedule")}
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={isResetting}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("cancel")}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isResetting}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isResetting ? t("loading") : t("resetSchedule")}
        </button>
      </div>
    </div>
  </Modal>
);

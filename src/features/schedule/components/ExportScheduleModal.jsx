import Modal from "../../../components/ui/Modal";
import { SCHEDULE_SEMESTER_OPTIONS } from "../constants";

export const ExportScheduleModal = ({
  isOpen,
  isExporting,
  t,
  currentYear,
  semester,
  year,
  language,
  groupId,
  groupOptions,
  onClose,
  onSemesterChange,
  onYearChange,
  onLanguageChange,
  onGroupChange,
  onSubmit,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={() => {
      if (!isExporting) {
        onClose();
      }
    }}
    title={t("exportSchedule")}
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
          disabled={isExporting}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
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
          disabled={isExporting}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t("exportLanguage")}
        </label>
        <select
          value={language}
          onChange={(event) => onLanguageChange(event.target.value)}
          disabled={isExporting}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
        >
          <option value="ru">{t("languageRussian")}</option>
          <option value="kk">{t("languageKazakh")}</option>
          <option value="en">{t("languageEnglish")}</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t("selectGroup")}
        </label>
        <select
          value={groupId}
          onChange={(event) => onGroupChange(event.target.value)}
          disabled={isExporting}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
        >
          <option value="">
            {t("all")} {t("groups").toLowerCase()}
          </option>
          {groupOptions.map(([optionGroupId, groupName]) => (
            <option key={optionGroupId} value={optionGroupId}>
              {groupName}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={isExporting}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("cancel")}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isExporting}
          className="rounded-md bg-[#014531] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#02704e] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExporting ? t("loading") : t("exportSchedule")}
        </button>
      </div>
    </div>
  </Modal>
);

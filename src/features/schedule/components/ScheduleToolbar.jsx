import { Download, Plus, RotateCw } from "lucide-react";

export const ScheduleToolbar = ({
  t,
  isAdmin,
  isLoading,
  isExporting,
  isResetting,
  hasAnyScheduleForYear,
  scheduleActionLabel,
  onGenerate,
  onAddEntry,
  onExport,
  onReset,
}) => (
  <div
    data-testid="schedule-toolbar"
    className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
  >
    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
      {t("scheduleMgmt")}
    </h1>

    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
      {isAdmin ? (
        <>
          <button
            type="button"
            onClick={onGenerate}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <RotateCw size={20} /> {scheduleActionLabel}
          </button>

          <button
            type="button"
            onClick={onAddEntry}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 sm:w-auto"
          >
            <Plus size={20} /> {t("addScheduleEntry")}
          </button>

          {hasAnyScheduleForYear ? (
            <button
              type="button"
              onClick={onExport}
              disabled={isExporting || isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[#014531] px-4 py-2 text-white transition hover:bg-[#02704e] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <Download size={20} /> {t("exportSchedule")}
            </button>
          ) : null}

          <button
            type="button"
            onClick={onReset}
            disabled={isResetting || isLoading || !hasAnyScheduleForYear}
            className="w-full rounded-md bg-red-600 px-4 py-2 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {t("resetSchedule")}
          </button>
        </>
      ) : null}
    </div>
  </div>
);

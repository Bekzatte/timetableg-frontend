import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export const GenerationStatusModal = ({
  job,
  label,
  t,
  onClose,
}) => (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/70 backdrop-blur-sm">
    <div className="w-[min(92vw,420px)] rounded-2xl border border-blue-100 bg-white px-6 py-5 text-center shadow-xl">
      {job?.status === "completed" ? (
        <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
      ) : job?.status === "failed" ? (
        <AlertCircle size={32} className="mx-auto text-red-600" />
      ) : (
        <Loader2 size={32} className="mx-auto animate-spin text-[#014531]" />
      )}
      <p className="mt-3 text-sm font-semibold text-gray-900">{label}</p>
      {job ? (
        <p className="mt-1 text-xs text-gray-500">
          {t("semester")}: {job.semester}. {t("year")}: {job.year}.{" "}
          {t("algorithm")}: {job.algorithm || "-"}
        </p>
      ) : (
        <p className="mt-1 text-xs text-gray-500">{t("loading")}</p>
      )}
      {job?.result?.scheduleCount !== undefined ? (
        <p className="mt-2 text-sm text-emerald-700">
          {t("scheduleEntries")}: {job.result.scheduleCount}
        </p>
      ) : null}
      {job?.progress ? (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs text-amber-800">
          <p className="font-medium">{t("scheduleGenerationProgress")}</p>
          <p className="mt-1">
            {job.progress.currentBatch && job.progress.totalBatches
              ? `${t("batch")} ${job.progress.currentBatch}/${job.progress.totalBatches}`
              : job.progress.message || t("scheduleGenerationInProgress")}
          </p>
          {job.progress.batchSections !== undefined ||
          job.progress.batchPlanItems !== undefined ||
          job.progress.generatedItems !== undefined ? (
            <p className="mt-1 text-amber-700">
              {job.progress.batchSections !== undefined
                ? `${t("sections")}: ${job.progress.batchSections}. `
                : ""}
              {job.progress.batchPlanItems !== undefined
                ? `${t("planItems")}: ${job.progress.batchPlanItems}. `
                : ""}
              {job.progress.generatedItems !== undefined
                ? `${t("generated")}: ${job.progress.generatedItems}.`
                : ""}
            </p>
          ) : null}
          {job.progress.elapsedSeconds !== undefined ? (
            <p className="mt-1 text-amber-700">
              {t("elapsedSeconds")}: {job.progress.elapsedSeconds}
            </p>
          ) : null}
        </div>
      ) : null}
      {job?.error ? (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-left text-sm text-red-700">
          {job.error}
        </div>
      ) : null}
      {job?.items?.length ? (
        <ul className="mt-3 max-h-40 list-disc space-y-1 overflow-y-auto pl-5 text-left text-xs text-gray-700">
          {job.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {job?.status !== "completed" && job?.status !== "failed" ? (
        <p className="mt-3 text-xs text-gray-500">
          {t("scheduleGenerationBackgroundHint")}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full rounded-md bg-[#014531] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#013726]"
      >
        {t("close")}
      </button>
    </div>
  </div>
);

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Info,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";

export const SectionDiagnostics = ({
  report,
  error,
  isLoading,
  sectionsCount,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const [issueSeverityFilter, setIssueSeverityFilter] = useState("all");
  const issues = useMemo(
    () => (Array.isArray(report?.issues) ? report.issues : []),
    [report],
  );
  const summary = report?.summary || {};
  const qualityScore = useMemo(() => {
    const errors = Number(summary.errors || 0);
    const warnings = Number(summary.warnings || 0);
    const totalSections = Number(summary.sections ?? sectionsCount);
    if (totalSections === 0) {
      return 0;
    }
    return Math.max(0, Math.min(100, 100 - errors * 12 - warnings * 2));
  }, [sectionsCount, summary.errors, summary.sections, summary.warnings]);
  const qualityTone =
    qualityScore >= 90
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : qualityScore >= 70
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : "text-red-700 bg-red-50 border-red-200";

  const severityMeta = {
    error: {
      label: t("validationErrors"),
      icon: XCircle,
      className: "border-red-200 bg-red-50 text-red-700",
      dotClassName: "bg-red-500",
    },
    warning: {
      label: t("validationWarnings"),
      icon: AlertTriangle,
      className: "border-amber-200 bg-amber-50 text-amber-700",
      dotClassName: "bg-amber-500",
    },
    info: {
      label: t("validationInfo"),
      icon: Info,
      className: "border-blue-200 bg-blue-50 text-blue-700",
      dotClassName: "bg-blue-500",
    },
  };

  const issueCountsByCode = useMemo(() => {
    const counts = new Map();
    issues.forEach((issue) => {
      const code = issue.code || "unknown";
      counts.set(code, (counts.get(code) || 0) + 1);
    });
    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6);
  }, [issues]);

  const filteredIssues = useMemo(
    () =>
      issues
        .filter((issue) => issueSeverityFilter === "all" || issue.severity === issueSeverityFilter)
        .slice(0, 12),
    [issueSeverityFilter, issues],
  );

  return (
    <section className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-[#014531]" />
            <h2 className="text-lg font-semibold text-gray-900">
              {t("dataDiagnostics")}
            </h2>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {t("dataDiagnosticsDescription")}
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          {t("refresh")}
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className={`rounded-lg border p-4 ${qualityTone}`}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">{t("qualityScore")}</span>
            {qualityScore >= 90 ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          </div>
          <p className="mt-2 text-3xl font-bold">{qualityScore}%</p>
        </div>
        {[
          ["error", "errors"],
          ["warning", "warnings"],
          ["info", "info"],
        ].map(([severity, summaryKey]) => {
          const meta = severityMeta[severity];
          const Icon = meta.icon;
          return (
            <div key={severity} className={`rounded-lg border p-4 ${meta.className}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{meta.label}</span>
                <Icon size={18} />
              </div>
              <p className="mt-2 text-3xl font-bold">
                {Number(summary[summaryKey] || 0)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-900">
            {t("topIssues")}
          </h3>
          {issueCountsByCode.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {issueCountsByCode.map(([code, count]) => (
                <span
                  key={code}
                  className="inline-flex max-w-full items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700"
                >
                  <span className="truncate">{code}</span>
                  <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">
                    {count}
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">{t("noValidationIssues")}</p>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              {t("validationIssues")}
            </h3>
            <div className="inline-flex rounded-md border border-gray-200 bg-gray-50 p-1">
              {["all", "error", "warning", "info"].map((severity) => (
                <button
                  key={severity}
                  type="button"
                  onClick={() => setIssueSeverityFilter(severity)}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                    issueSeverityFilter === severity
                      ? "bg-[#014531] text-white"
                      : "text-gray-600 hover:bg-white"
                  }`}
                >
                  {severity === "all" ? t("all") : severityMeta[severity].label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
            {isLoading && !report ? (
              <p className="text-sm text-gray-500">{t("loading")}</p>
            ) : filteredIssues.length ? (
              filteredIssues.map((issue, index) => {
                const meta = severityMeta[issue.severity] || severityMeta.info;
                return (
                  <div
                    key={`${issue.code}-${index}`}
                    className="rounded-md border border-gray-200 bg-gray-50 p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${meta.dotClassName}`} />
                      <span className="text-xs font-semibold uppercase text-gray-500">
                        {issue.severity || "info"}
                      </span>
                      <span className="rounded bg-white px-2 py-0.5 text-xs font-medium text-gray-700">
                        {issue.code || "unknown"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-800">
                      {issue.message || t("validationIssue")}
                    </p>
                    <p className="mt-1 truncate text-xs text-gray-500">
                      {[issue.group_name, issue.course_code, issue.course_name, issue.lesson_type]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500">{t("noValidationIssues")}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SectionDiagnostics;

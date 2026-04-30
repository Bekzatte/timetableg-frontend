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
  const [issueSearchQuery, setIssueSearchQuery] = useState("");
  const [visibleIssueCount, setVisibleIssueCount] = useState(20);
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
    const checkedItems = Math.max(totalSections, errors + warnings, 1);
    const errorPenalty = (errors / checkedItems) * 100;
    const warningPenalty = (warnings / checkedItems) * 25;
    return Math.round(Math.max(0, Math.min(100, 100 - errorPenalty - warningPenalty)));
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
    () => {
      const normalizedQuery = issueSearchQuery.trim().toLowerCase();
      return issues.filter((issue) => {
        const matchesSeverity =
          issueSeverityFilter === "all" || issue.severity === issueSeverityFilter;
        if (!matchesSeverity) {
          return false;
        }
        if (!normalizedQuery) {
          return true;
        }
        return [
          issue.code,
          issue.message,
          issue.group_name,
          issue.course_code,
          issue.course_name,
          issue.lesson_type,
          issue.teacher_name,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));
      });
    },
    [issueSearchQuery, issueSeverityFilter, issues],
  );
  const visibleIssues = filteredIssues.slice(0, visibleIssueCount);
  const canShowMoreIssues = visibleIssueCount < filteredIssues.length;
  const resetVisibleIssues = () => setVisibleIssueCount(20);

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

        <div className="min-w-0 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              {t("validationIssues")}
            </h3>
            <div className="grid w-full min-w-0 grid-cols-2 gap-1 rounded-md border border-gray-200 bg-gray-50 p-1 sm:grid-cols-4 md:w-auto">
              {["all", "error", "warning", "info"].map((severity) => (
                <button
                  key={severity}
                  type="button"
                  onClick={() => {
                    setIssueSeverityFilter(severity);
                    resetVisibleIssues();
                  }}
                  className={`min-w-0 rounded px-2 py-1 text-xs font-medium transition ${
                    issueSeverityFilter === severity
                      ? "bg-[#014531] text-white"
                      : "text-gray-600 hover:bg-white"
                  }`}
                >
                  <span className="block truncate">
                    {severity === "all" ? t("all") : severityMeta[severity].label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="search"
              value={issueSearchQuery}
              onChange={(event) => {
                setIssueSearchQuery(event.target.value);
                resetVisibleIssues();
              }}
              placeholder={`${t("search")}...`}
              className="min-w-0 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#014531] focus:ring-2 focus:ring-[#014531]/20 sm:flex-1"
            />
            <span className="text-xs text-gray-500">
              {t("shown")}: {Math.min(visibleIssueCount, filteredIssues.length)} / {filteredIssues.length}
            </span>
          </div>

          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
            {isLoading && !report ? (
              <p className="text-sm text-gray-500">{t("loading")}</p>
            ) : visibleIssues.length ? (
              visibleIssues.map((issue, index) => {
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
          {canShowMoreIssues ? (
            <button
              type="button"
              onClick={() => setVisibleIssueCount((current) => current + 20)}
              className="mt-3 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              {t("showMore")}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default SectionDiagnostics;

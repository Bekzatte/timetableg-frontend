import { Fragment, useMemo, useState } from "react";
import { Trash2, Edit2, Filter, ChevronDown } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";
import Modal from "./Modal";

export const DataTable = ({
  columns,
  data,
  onEdit,
  onDelete,
  isLoading,
  title,
  enableSearch = false,
  filterControls = null,
  onApplyFilters = null,
  onResetFilters = null,
  hasActiveFilters = false,
  filterDialogTitle = null,
  renderExpandedRow = null,
  getRowCanExpand = null,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [expandedRowIds, setExpandedRowIds] = useState(() => new Set());
  const hasSearchQuery = searchQuery.trim().length > 0;
  const hasExpandableRows = typeof renderExpandedRow === "function";
  const actionsColSpan = (onEdit || onDelete) ? 1 : 0;
  const totalColSpan = columns.length + actionsColSpan + (hasExpandableRows ? 1 : 0);

  const getRowKey = (row, rowIndex) => String(row.id ?? rowIndex);
  const canExpandRow = (row) => hasExpandableRows && (getRowCanExpand ? getRowCanExpand(row) : true);
  const toggleRow = (row, rowIndex) => {
    const key = getRowKey(row, rowIndex);
    setExpandedRowIds((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const filteredData = useMemo(() => {
    if (!enableSearch) {
      return data;
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return data;
    }

    return data.filter((row) => {
      const values = columns.flatMap((col) => {
        const rawValue = row[col.key];
        const renderedValue = col.render ? col.render(rawValue, row) : rawValue;
        return [rawValue, renderedValue];
      });

      return values.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(normalizedQuery),
      );
    });
  }, [columns, data, enableSearch, searchQuery]);
  const isFilteredEmpty = data.length > 0 && filteredData.length === 0;
  const emptyStateMessage = isFilteredEmpty ? t("noResults") : t("noData");

  if (isLoading) {
    return <div className="p-4 text-center text-gray-600">{t("loading")}</div>;
  }

  return (
    <div className="w-full">
      {title && (
        <h2 className="text-xl font-bold mb-4 text-gray-900">{title}</h2>
      )}
      {enableSearch || filterControls ? (
        <div className="mb-4">
          {enableSearch ? (
            <div className="flex w-full items-stretch gap-2">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={`${t("search")}...`}
                className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#014531] focus:ring-2 focus:ring-[#014531]/20"
              />
              {filterControls ? (
                <button
                  type="button"
                  onClick={() => setIsFilterModalOpen(true)}
                  className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition ${
                    hasActiveFilters
                      ? "border-[#014531] bg-[#014531] text-white hover:bg-[#013726]"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Filter size={16} />
                  <span className="hidden sm:inline">{t("filter")}</span>
                </button>
              ) : null}
            </div>
          ) : (
            filterControls ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsFilterModalOpen(true)}
                  className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition ${
                    hasActiveFilters
                      ? "border-[#014531] bg-[#014531] text-white hover:bg-[#013726]"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Filter size={16} />
                  {t("filter")}
                </button>
              </div>
            ) : null
          )}
          {filterControls ? (
            <Modal
              isOpen={isFilterModalOpen}
              onClose={() => setIsFilterModalOpen(false)}
              title={filterDialogTitle || t("filter")}
              size="sm"
            >
              <div className="space-y-4">
                <div className="grid gap-3 [&>select]:w-full [&>select]:max-w-full [&>select]:truncate">
                  {filterControls}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (onResetFilters) {
                        onResetFilters();
                      }
                    }}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:w-auto"
                  >
                    {t("reset")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onApplyFilters) {
                        onApplyFilters();
                      }
                      setIsFilterModalOpen(false);
                    }}
                    className="w-full rounded-md bg-[#014531] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#013726] sm:w-auto"
                  >
                    {t("apply")}
                  </button>
                </div>
              </div>
            </Modal>
          ) : null}
        </div>
      ) : null}
      {data.length === 0 || filteredData.length === 0 ? (
        <div className="space-y-3 overflow-y-auto pr-1 md:hidden">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm text-center text-gray-500">
            <p>{emptyStateMessage}</p>
            {isFilteredEmpty && (hasSearchQuery || hasActiveFilters) ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  if (onResetFilters) {
                    onResetFilters();
                  }
                }}
                className="mt-3 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                {t("reset")}
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1 md:hidden">
          {filteredData.map((row, rowIndex) => (
            <div
              key={row.id ?? rowIndex}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              {hasExpandableRows ? (
                <button
                  type="button"
                  onClick={() => toggleRow(row, rowIndex)}
                  disabled={!canExpandRow(row)}
                  className="mb-3 inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronDown
                    size={16}
                    className={`transition ${expandedRowIds.has(getRowKey(row, rowIndex)) ? "rotate-180" : ""}`}
                  />
                  {t("details")}
                </button>
              ) : null}
              <div className="space-y-3">
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className="flex items-start justify-between gap-4 border-b border-gray-100 pb-2 last:border-b-0 last:pb-0"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {col.label}
                    </span>
                    <span className="min-w-0 text-right text-sm text-gray-900 break-words">
                      {col.render ? col.render(row[col.key], row) : row[col.key] || "-"}
                    </span>
                  </div>
                ))}
              </div>
              {(onEdit || onDelete) && (
                <div className="mt-4 flex gap-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(row)}
                      className="flex-1 rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                    >
                      {t("edit")}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(row)}
                      className="flex-1 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                    >
                      {t("delete")}
                    </button>
                  )}
                </div>
              )}
              {hasExpandableRows && expandedRowIds.has(getRowKey(row, rowIndex)) ? (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  {renderExpandedRow(row)}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
      <div className="hidden max-h-[65vh] overflow-auto rounded-lg border border-gray-200 shadow-md md:block">
        <table className="min-w-[860px] w-full border-collapse table-auto">
          <colgroup>
            {hasExpandableRows && <col style={{ width: "48px" }} />}
            {columns.map((_, i) => (
              <col key={`col-${i}`} />
            ))}
            {(onEdit || onDelete) && <col style={{ width: "140px" }} />}
          </colgroup>
          <thead>
            <tr className="sticky top-0 z-10 border-b border-gray-200 bg-blue-50">
              {hasExpandableRows && <th className="px-2 py-3" />}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700 overflow-hidden truncate"
                >
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  {t("edit")}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={totalColSpan}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  <div className="flex flex-col items-center gap-3">
                    <span>{emptyStateMessage}</span>
                    {isFilteredEmpty && (hasSearchQuery || hasActiveFilters) ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          if (onResetFilters) {
                            onResetFilters();
                          }
                        }}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        {t("reset")}
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((row, rowIndex) => {
                const rowKey = getRowKey(row, rowIndex);
                const isExpanded = expandedRowIds.has(rowKey);
                const isExpandable = canExpandRow(row);
                return (
                  <Fragment key={rowKey}>
                    <tr className="border-b border-gray-200 hover:bg-gray-50 transition">
                      {hasExpandableRows && (
                        <td className="px-2 py-3 text-center align-top">
                          <button
                            type="button"
                            onClick={() => toggleRow(row, rowIndex)}
                            disabled={!isExpandable}
                            className="rounded p-1.5 text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                            title={t("details")}
                          >
                            <ChevronDown
                              size={18}
                              className={`transition ${isExpanded ? "rotate-180" : ""}`}
                            />
                          </button>
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className="px-4 py-3 text-sm text-gray-900 align-top whitespace-normal break-words"
                        >
                          {col.render ? col.render(row[col.key], row) : (row[col.key] ?? "-")}
                        </td>
                      ))}
                      {(onEdit || onDelete) && (
                        <td className="px-3 py-3 text-sm text-center">
                          <div className="flex gap-2 justify-center">
                            {onEdit && (
                              <button
                                onClick={() => onEdit(row)}
                                className="p-1.5 rounded transition duration-200 hover:scale-110 text-blue-600 hover:bg-blue-50"
                                title={t("edit")}
                              >
                                <Edit2 size={18} />
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() => onDelete(row)}
                                className="p-1.5 rounded transition duration-200 hover:scale-110 text-red-600 hover:bg-red-50"
                                title={t("delete")}
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                    {hasExpandableRows && isExpanded ? (
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <td colSpan={totalColSpan} className="px-4 py-4">
                          {renderExpandedRow(row)}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;

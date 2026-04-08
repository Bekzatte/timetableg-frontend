import { useMemo, useState } from "react";
import { Trash2, Edit2 } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";

export const DataTable = ({
  columns,
  data,
  onEdit,
  onDelete,
  isLoading,
  title,
  enableSearch = false,
  filterControls = null,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

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

  if (isLoading) {
    return <div className="p-4 text-center text-gray-600">{t("loading")}</div>;
  }

  if (data.length === 0) {
    return <div className="p-4 text-center text-gray-500">{t("noData")}</div>;
  }

  return (
    <div className="w-full">
      {title && (
        <h2 className="text-xl font-bold mb-4 text-gray-900">{title}</h2>
      )}
      {enableSearch || filterControls ? (
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {enableSearch ? (
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={`${t("search")}...`}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#014531] focus:ring-2 focus:ring-[#014531]/20 lg:max-w-sm"
            />
          ) : (
            <div />
          )}
          {filterControls ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              {filterControls}
            </div>
          ) : null}
        </div>
      ) : null}
      {filteredData.length === 0 ? (
        <div className="p-4 text-center text-gray-500">{t("noData")}</div>
      ) : null}
      <div className={`${filteredData.length === 0 ? "hidden" : "max-h-[65vh]"} space-y-3 overflow-y-auto pr-1 md:hidden`}>
        {filteredData.map((row, rowIndex) => (
          <div
            key={row.id ?? rowIndex}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
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
          </div>
        ))}
      </div>
      <div className={`${filteredData.length === 0 ? "hidden" : ""} max-h-[65vh] overflow-auto rounded-lg border border-gray-200 shadow-md md:block`}>
        <table className="min-w-[860px] w-full border-collapse table-auto">
          <colgroup>
            {columns.map((_, i) => (
              <col key={`col-${i}`} />
            ))}
            {(onEdit || onDelete) && <col style={{ width: "140px" }} />}
          </colgroup>
          <thead>
            <tr className="sticky top-0 z-10 border-b border-gray-200 bg-blue-50">
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
            {filteredData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-gray-200 hover:bg-gray-50 transition"
              >
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;

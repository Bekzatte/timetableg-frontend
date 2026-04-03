import React, { useState } from "react";
import { Trash2, Edit2 } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";

export const DataTable = ({
  columns,
  data,
  onEdit,
  onDelete,
  isLoading,
  title,
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return <div className="p-4 text-center text-gray-600">{t("loading")}</div>;
  }

  return (
    <div className="w-full">
      {title && (
        <h2 className="text-xl font-bold mb-4 text-gray-900">{title}</h2>
      )}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-md">
        <table className="w-full border-collapse table-auto">
          <colgroup>
            {columns.map((_, i) => (
              <col key={`col-${i}`} />
            ))}
            {(onEdit || onDelete) && <col style={{ width: "140px" }} />}
          </colgroup>
          <thead>
            <tr className="bg-blue-50 border-b border-gray-200">
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
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-gray-200 hover:bg-gray-50 transition"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-3 text-sm text-gray-900 overflow-hidden truncate"
                  >
                    {row[col.key]}
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
      {data.length === 0 && (
        <div className="p-4 text-center text-gray-500">{t("noData")}</div>
      )}
    </div>
  );
};

export default DataTable;

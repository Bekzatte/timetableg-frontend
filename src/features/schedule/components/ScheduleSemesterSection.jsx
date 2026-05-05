import { ChevronDown, RotateCw } from "lucide-react";
import TimetableGrid from "./TimetableGrid";
import DataTable from "../../../components/ui/DataTable";

export const ScheduleSemesterSection = ({
  t,
  isAdmin,
  title,
  isExpanded,
  semesterSchedule,
  filteredSemesterSchedule,
  scheduleColumns,
  hasActiveFilters,
  filterControls,
  generationStatusButton,
  onToggleExpanded,
  onEditEntry,
  onDeleteEntry,
  onApplyFilters,
  onResetFilters,
}) => (
  <section className="rounded-lg bg-white p-4 shadow-md sm:p-6">
    <div className="flex w-full items-center justify-between gap-3">
      <span className="text-xl font-semibold text-gray-900">{title}</span>
      <span className="flex items-center gap-3">
        {generationStatusButton}
        <button
          type="button"
          onClick={onToggleExpanded}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100"
          aria-expanded={isExpanded}
          aria-label={title}
        >
          <ChevronDown
            size={20}
            className={`transition ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>
      </span>
    </div>

    {isExpanded ? (
      <div className="mt-4">
        {semesterSchedule.length > 0 ? (
          <TimetableGrid schedule={filteredSemesterSchedule} />
        ) : (
          <div className="py-12 text-center text-gray-500">
            <RotateCw size={48} className="mx-auto mb-4 opacity-50" />
            <p>{t("scheduleNotCreated")}</p>
          </div>
        )}

        {isAdmin ? (
          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("manageScheduleEntries")}
              </h3>
            </div>

            <DataTable
              columns={scheduleColumns}
              data={filteredSemesterSchedule}
              onEdit={onEditEntry}
              onDelete={onDeleteEntry}
              isLoading={false}
              enableSearch
              hasActiveFilters={hasActiveFilters}
              filterDialogTitle={t("filter")}
              onApplyFilters={onApplyFilters}
              onResetFilters={onResetFilters}
              filterControls={filterControls}
            />
          </div>
        ) : null}
      </div>
    ) : null}
  </section>
);

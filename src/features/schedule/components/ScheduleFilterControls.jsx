import { EMPTY_SCHEDULE_FILTERS, WEEKDAY_OPTIONS } from "../constants";

const uniqueOptions = (items, idKey, labelKey) =>
  Array.from(
    new Map(
      items
        .filter((entry) => entry[idKey])
        .map((entry) => [entry[idKey], entry[labelKey]]),
    ).entries(),
  );

export const ScheduleFilterControls = ({
  t,
  semester,
  semesterSchedule,
  draftFilters,
  onChange,
}) => {
  const filters = draftFilters || EMPTY_SCHEDULE_FILTERS;

  return (
    <>
      <select
        value={filters.group}
        onChange={(event) => onChange(semester, "group", event.target.value)}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
      >
        <option value="">
          {t("all")} {t("groups").toLowerCase()}
        </option>

        {uniqueOptions(semesterSchedule, "group_id", "group_name").map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>

      <select
        value={filters.teacher}
        onChange={(event) => onChange(semester, "teacher", event.target.value)}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
      >
        <option value="">
          {t("all")} {t("teachers").toLowerCase()}
        </option>

        {uniqueOptions(semesterSchedule, "teacher_id", "teacher_name").map(
          ([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ),
        )}
      </select>

      <select
        value={filters.room}
        onChange={(event) => onChange(semester, "room", event.target.value)}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
      >
        <option value="">
          {t("all")} {t("rooms").toLowerCase()}
        </option>

        {uniqueOptions(semesterSchedule, "room_id", "room_number").map(([id, number]) => (
          <option key={id} value={id}>
            {number}
          </option>
        ))}
      </select>

      <select
        value={filters.day}
        onChange={(event) => onChange(semester, "day", event.target.value)}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
      >
        <option value="">
          {t("all")} {t("day").toLowerCase()}
        </option>

        {WEEKDAY_OPTIONS.map((day) => (
          <option key={day.value} value={day.value}>
            {t(day.labelKey)}
          </option>
        ))}
      </select>
    </>
  );
};

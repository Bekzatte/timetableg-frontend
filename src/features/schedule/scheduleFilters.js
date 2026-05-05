import { getWeekdayValue } from "./dateUtils";

export const filterScheduleEntries = (entries, filters) =>
  entries.filter((entry) => {
    const matchesGroup = !filters.group || String(entry.group_id) === filters.group;
    const matchesTeacher =
      !filters.teacher || String(entry.teacher_id) === filters.teacher;
    const matchesRoom = !filters.room || String(entry.room_id) === filters.room;
    const matchesDay = !filters.day || getWeekdayValue(entry.day) === filters.day;

    return matchesGroup && matchesTeacher && matchesRoom && matchesDay;
  });

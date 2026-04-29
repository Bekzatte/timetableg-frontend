export const SCHEDULE_START_HOUR = 8;
export const SCHEDULE_END_HOUR = 19;
export const SCHEDULE_BOUNDARY_END_HOUR = 20;

export const scheduleHours = Array.from(
  { length: SCHEDULE_END_HOUR - SCHEDULE_START_HOUR + 1 },
  (_item, index) => SCHEDULE_START_HOUR + index,
);

export const scheduleBoundaryHours = Array.from(
  { length: SCHEDULE_BOUNDARY_END_HOUR - SCHEDULE_START_HOUR + 1 },
  (_item, index) => SCHEDULE_START_HOUR + index,
);

export const formatHour = (hour) => {
  if (hour === null || hour === undefined || hour === "") {
    return "";
  }
  return `${String(Number(hour)).padStart(2, "0")}:00`;
};

export const formatLessonTimeRange = (hour) => {
  if (hour === null || hour === undefined || hour === "") {
    return "";
  }
  const normalizedHour = Number(hour);
  return `${String(normalizedHour).padStart(2, "0")}:00-${String(normalizedHour).padStart(2, "0")}:50`;
};

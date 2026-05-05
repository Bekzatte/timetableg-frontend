import { WEEKDAY_OPTIONS } from "./constants";

export const getWeekdayValue = (isoDate) => {
  if (!isoDate) {
    return "monday";
  }

  const jsDay = new Date(`${isoDate}T12:00:00`).getDay();
  const weekdayIndex = jsDay === 0 ? 6 : jsDay - 1;

  return WEEKDAY_OPTIONS[weekdayIndex]?.value || "monday";
};

export const normalizeWeekdayValue = (value) => {
  const normalized = String(value || "").trim().toLowerCase();

  if (!normalized) {
    return "";
  }

  if (WEEKDAY_OPTIONS.some((item) => item.value === normalized)) {
    return normalized;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(normalized)) {
    return getWeekdayValue(normalized.slice(0, 10));
  }

  const weekdayAliases = {
    monday: "monday",
    tuesday: "tuesday",
    wednesday: "wednesday",
    thursday: "thursday",
    friday: "friday",
  };

  return weekdayAliases[normalized] || "";
};

export const toIsoDateForWeekday = (weekday, year) => {
  const today = new Date();
  const anchor = new Date(year, today.getMonth(), today.getDate());
  const monday = new Date(anchor);

  monday.setDate(anchor.getDate() - ((anchor.getDay() + 6) % 7));

  const weekdayIndex = WEEKDAY_OPTIONS.findIndex(
    (item) => item.value === weekday,
  );

  monday.setDate(monday.getDate() + (weekdayIndex >= 0 ? weekdayIndex : 0));

  const month = `${monday.getMonth() + 1}`.padStart(2, "0");
  const day = `${monday.getDate()}`.padStart(2, "0");

  return `${monday.getFullYear()}-${month}-${day}`;
};

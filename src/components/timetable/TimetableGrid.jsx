import React, { useState, useEffect } from "react";
import { format, addDays, startOfWeek } from "date-fns";
import { ru, enUS, kk } from "date-fns/locale";
import { useTranslation } from "../../hooks/useTranslation";

export const TimetableGrid = ({ schedule = [], week = new Date() }) => {
  const { t, language } = useTranslation();

  // Get locale for date-fns
  const localeMap = {
    ru: ru,
    en: enUS,
    kk: ru, // Use Russian locale for Kazakh as fallback
  };
  const locale = localeMap[language] || ru;

  // Days of week short names - use translated keys
  const days = [
    t("mondayShort"),
    t("tuesdayShort"),
    t("wednesdayShort"),
    t("thursdayShort"),
    t("fridayShort"),
    t("saturdayShort"),
  ];

  const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 8:00 - 17:00

  const startDate = startOfWeek(week, { weekStartsOn: 1 });

  const getScheduleItem = (day, hour) => {
    return schedule.find(
      (item) =>
        new Date(item.day).toDateString() ===
          new Date(addDays(startDate, day)).toDateString() &&
        item.start_hour === hour,
    );
  };

  return (
    <div className="w-full overflow-x-auto border rounded-lg bg-white border-gray-200">
      <table className="w-full border-collapse table-auto md:table-fixed">
        <colgroup>
          <col style={{ width: "120px" }} />
          {days.map((_, i) => (
            <col key={`col-${i}`} style={{ width: "auto" }} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b bg-gray-100 border-gray-200">
            <th className="px-4 py-2 text-left border-r font-semibold text-gray-900 border-gray-200 w-32">
              {t("time")}
            </th>
            {days.map((day, idx) => (
              <th
                key={day}
                className="px-3 py-2 text-center border-r font-semibold text-sm text-gray-900 border-gray-200"
              >
                <div className="truncate">{day}</div>
                <div className="text-xs text-gray-600">
                  {format(addDays(startDate, idx), "d MMM", { locale })}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hours.map((hour) => (
            <tr key={hour} className="border-b border-gray-200">
              <td className="px-4 py-2 border-r font-semibold text-sm text-center bg-gray-50 text-gray-900 border-gray-200 w-32 whitespace-nowrap">
                {hour}:00 - {hour}:50
              </td>
              {days.map((_, dayIdx) => {
                const item = getScheduleItem(dayIdx, hour);
                return (
                  <td
                    key={`${hour}-${dayIdx}`}
                    className="px-3 py-2 border-r text-sm min-h-12 align-top border-gray-200 overflow-hidden"
                  >
                    {item && (
                      <div className="p-2 rounded text-xs border-l-4 bg-blue-100 text-blue-900 border-blue-500">
                        <div className="font-semibold">{item.course_name}</div>
                        <div>{item.teacher_name}</div>
                        <div>{item.room_number}</div>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TimetableGrid;

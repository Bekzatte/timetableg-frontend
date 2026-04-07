import { useTranslation } from "../../hooks/useTranslation";

export const TimetableGrid = ({ schedule = [] }) => {
  const { t } = useTranslation();

  const days = [
    t("mondayShort"),
    t("tuesdayShort"),
    t("wednesdayShort"),
    t("thursdayShort"),
    t("fridayShort"),
  ];

  const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 8:00 - 17:00

  const getScheduleItem = (day, hour) => {
    const weekday = day + 1;
    return schedule.find(
      (item) =>
        new Date(item.day).getDay() === weekday && item.start_hour === hour,
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

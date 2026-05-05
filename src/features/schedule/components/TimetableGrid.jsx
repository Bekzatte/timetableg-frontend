import { useTranslation } from "../../../hooks/useTranslation";
import { formatLessonTimeRange, scheduleHours } from "../../../utils/timeSlots";

const LESSON_TYPE_STYLES = {
  lecture: "border-amber-500 bg-amber-100 text-amber-950",
  practical: "border-blue-500 bg-blue-100 text-blue-950",
  lab: "border-emerald-500 bg-emerald-100 text-emerald-950",
};

const getLessonTypeStyle = (lessonType) =>
  LESSON_TYPE_STYLES[String(lessonType || "").trim().toLowerCase()] ||
  "border-gray-400 bg-gray-100 text-gray-900";

export const TimetableGrid = ({ schedule = [] }) => {
  const { t } = useTranslation();

  const days = [
    t("mondayShort"),
    t("tuesdayShort"),
    t("wednesdayShort"),
    t("thursdayShort"),
    t("fridayShort"),
  ];

  const getScheduleItems = (day, hour) => {
    const weekday = day + 1;
    return schedule.filter(
      (item) =>
        new Date(`${item.day}T12:00:00`).getDay() === weekday &&
        Number(item.start_hour) === hour,
    );
  };

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-[860px] w-full border-collapse table-auto md:table-fixed">
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
            {days.map((day) => (
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
          {scheduleHours.map((hour) => (
            <tr key={hour} className="border-b border-gray-200">
              <td className="px-4 py-2 border-r font-semibold text-sm text-center bg-gray-50 text-gray-900 border-gray-200 w-32 whitespace-nowrap">
                {formatLessonTimeRange(hour)}
              </td>
              {days.map((_, dayIdx) => {
                const items = getScheduleItems(dayIdx, hour);
                return (
                  <td
                    key={`${hour}-${dayIdx}`}
                    className="min-h-12 overflow-hidden border-r border-gray-200 px-2 py-2 text-sm align-top sm:px-3"
                  >
                    <div className="space-y-2">
	                      {items.map((item) => (
	                        <div
	                          key={item.id}
	                          className={`rounded border-l-4 p-2 text-xs ${getLessonTypeStyle(item.lesson_type)}`}
	                        >
                          <div className="font-semibold">{item.course_name}</div>
                          <div>
                            {item.group_name}
                            {item.subgroup ? ` • ${item.subgroup}` : ""}
                          </div>
                          <div>{item.teacher_name}</div>
                          <div>
                            {item.room_number}
                            {item.room_programme_mismatch ? ` (${t("externalProgrammeRoom")})` : ""}
                          </div>
                          {item.relocated_from_room_number ? (
                            <div className="font-medium text-amber-800">
                              {t("movedFromRoom")} {item.relocated_from_room_number}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
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

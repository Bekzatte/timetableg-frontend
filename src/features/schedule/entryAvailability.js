import { formatLessonTimeRange, scheduleHours } from "../../utils/timeSlots";
import { WEEKDAY_OPTIONS } from "./constants";
import { normalizeWeekdayValue, toIsoDateForWeekday } from "./dateUtils";

export const createScheduleEntryAvailability = ({
  sections,
  courses,
  groups,
  rooms,
  roomBlocks,
  schedule,
  editingEntry,
  t,
}) => {
  const getSelectedEntrySection = (formData) =>
    sections.find((section) => String(section.id) === String(formData.section_id));

  const getSelectedEntryCourse = (section) =>
    courses.find((course) => String(course.id) === String(section?.course_id));

  const getSelectedEntryGroup = (section) =>
    groups.find((group) => String(group.id) === String(section?.group_id));

  const hasGroupSlotConflict = (entry, selectedSection, subgroup) => {
    if (String(entry.group_id) !== String(selectedSection.group_id)) {
      return false;
    }

    const existingSubgroup = String(entry.subgroup || "").toUpperCase();
    const nextSubgroup = String(subgroup || "").toUpperCase();

    return !existingSubgroup || !nextSubgroup || existingSubgroup === nextSubgroup;
  };

  const isRoomBlockedAtSlot = (roomId, weekday, hour, semester, year) =>
    roomBlocks.some((block) => {
      if (String(block.room_id) !== String(roomId)) {
        return false;
      }

      const blockSemester = block.semester;
      const blockYear = block.year;

      if (
        blockSemester !== null &&
        blockSemester !== undefined &&
        blockSemester !== "" &&
        Number(blockSemester) !== Number(semester)
      ) {
        return false;
      }

      if (
        blockYear !== null &&
        blockYear !== undefined &&
        blockYear !== "" &&
        Number(blockYear) !== Number(year)
      ) {
        return false;
      }

      if (normalizeWeekdayValue(block.day) !== weekday) {
        return false;
      }

      const startHour = Number(block.start_hour);
      const endHour =
        block.end_hour !== null && block.end_hour !== undefined && block.end_hour !== ""
          ? Number(block.end_hour)
          : startHour + 1;

      return Number(hour) >= startHour && Number(hour) < endHour;
    });

  const isRoomCompatibleWithSection = (room, selectedSection) => {
    if (!room || !selectedSection || !Number(room.available ?? 1)) {
      return false;
    }

    const lessonType = String(selectedSection.lesson_type || "").toLowerCase();
    const roomType = String(room.type || "").toLowerCase();
    const selectedGroup = getSelectedEntryGroup(selectedSection);
    const studentCount = Number(selectedGroup?.student_count || 0);
    const capacity = Number(room.capacity || 0);

    if (studentCount && capacity && capacity < studentCount) {
      return false;
    }

    if (lessonType === "lecture" && roomType && roomType !== "lecture") {
      return false;
    }

    if (lessonType === "practical" && roomType && !["practical", "lecture"].includes(roomType)) {
      return false;
    }

    if (lessonType === "lab" && roomType && roomType !== "practical") {
      return false;
    }

    if (
      (lessonType === "lab" || Number(selectedSection.requires_computers || 0)) &&
      Number(room.computer_count || 0) < 10
    ) {
      return false;
    }

    return true;
  };

  const hasTeacherOrGroupConflictAtSlot = (formData, hour) => {
    const selectedSection = getSelectedEntrySection(formData);
    const selectedCourse = getSelectedEntryCourse(selectedSection);

    if (
      !selectedSection ||
      !formData.weekday ||
      !formData.semester ||
      !formData.year
    ) {
      return true;
    }

    const teacherId = selectedSection.teacher_id || selectedCourse?.instructor_id;
    const day = toIsoDateForWeekday(formData.weekday, Number(formData.year));
    const semester = Number(formData.semester);
    const year = Number(formData.year);

    return schedule.some((entry) => {
      if (editingEntry && String(entry.id) === String(editingEntry.id)) {
        return false;
      }

      if (
        Number(entry.semester) !== semester ||
        Number(entry.year) !== year ||
        entry.day !== day ||
        Number(entry.start_hour) !== Number(hour)
      ) {
        return false;
      }

      return (
        (teacherId && String(entry.teacher_id) === String(teacherId)) ||
        hasGroupSlotConflict(entry, selectedSection, formData.subgroup)
      );
    });
  };

  const isRoomAvailableAtSlot = (room, formData, hour) => {
    const selectedSection = getSelectedEntrySection(formData);

    if (
      !selectedSection ||
      !isRoomCompatibleWithSection(room, selectedSection) ||
      !formData.weekday ||
      !formData.semester ||
      !formData.year
    ) {
      return false;
    }

    const semester = Number(formData.semester);
    const year = Number(formData.year);
    const day = toIsoDateForWeekday(formData.weekday, year);

    if (isRoomBlockedAtSlot(room.id, formData.weekday, hour, semester, year)) {
      return false;
    }

    return !schedule.some((entry) => {
      if (editingEntry && String(entry.id) === String(editingEntry.id)) {
        return false;
      }

      return (
        Number(entry.semester) === semester &&
        Number(entry.year) === year &&
        entry.day === day &&
        Number(entry.start_hour) === Number(hour) &&
        String(entry.room_id) === String(room.id)
      );
    });
  };

  const getAvailableRoomOptions = (formData) => {
    if (
      !formData.section_id ||
      !formData.weekday ||
      !formData.start_hour ||
      !formData.semester ||
      !formData.year
    ) {
      return [];
    }

    return rooms
      .filter((room) => isRoomAvailableAtSlot(room, formData, Number(formData.start_hour)))
      .map((room) => {
        const details = [
          room.type ? t(room.type) : "",
          room.capacity ? `${room.capacity}` : "",
          Number(room.computer_count || 0) > 0 ? `PC ${room.computer_count}` : "",
        ].filter(Boolean);

        return {
          value: room.id,
          label: details.length ? `${room.number} (${details.join(", ")})` : room.number,
        };
      });
  };

  const getAvailableStartHourOptions = (formData) => {
    const selectedSection = getSelectedEntrySection(formData);

    if (
      !selectedSection ||
      !formData.weekday ||
      !formData.semester ||
      !formData.year
    ) {
      return [];
    }

    return scheduleHours
      .filter((hour) => {
        if (hasTeacherOrGroupConflictAtSlot(formData, hour)) {
          return false;
        }

        return rooms.some((room) => isRoomAvailableAtSlot(room, formData, hour));
      })
      .map((hour) => ({
        value: hour,
        label: formatLessonTimeRange(hour),
      }));
  };

  const getAvailableWeekdayOptions = (formData) => {
    if (
      !formData.section_id ||
      !formData.semester ||
      !formData.year
    ) {
      return [];
    }

    return WEEKDAY_OPTIONS.filter(
      (item) =>
        getAvailableStartHourOptions({
          ...formData,
          weekday: item.value,
        }).length > 0,
    ).map((item) => ({
      value: item.value,
      label: t(item.labelKey),
    }));
  };

  return {
    getAvailableRoomOptions,
    getAvailableStartHourOptions,
    getAvailableWeekdayOptions,
    getSelectedEntryCourse,
    getSelectedEntrySection,
  };
};

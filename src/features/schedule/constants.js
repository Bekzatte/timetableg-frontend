export const WEEKDAY_OPTIONS = [
  { value: "monday", labelKey: "monday" },
  { value: "tuesday", labelKey: "tuesday" },
  { value: "wednesday", labelKey: "wednesday" },
  { value: "thursday", labelKey: "thursday" },
  { value: "friday", labelKey: "friday" },
];

export const SCHEDULE_SEMESTER_OPTIONS = [
  { value: 1, labelKey: "fallScheduleSemester" },
  { value: 2, labelKey: "springScheduleSemester" },
];

export const SCHEDULE_ALGORITHM_OPTIONS = [
  { value: "greedy", labelKey: "greedyAlgorithm" },
  { value: "cpsat", label: "CP-SAT" },
  { value: "hybrid", label: "CP-SAT + Greedy" },
  { value: "cpsat_fast", label: "CP-SAT (Fast)" },
];

export const GENERATION_POLL_INTERVAL_MS = 10000;
export const GENERATION_POLL_TIMEOUT_MS = 15 * 60 * 1000;

export const EMPTY_SCHEDULE_FILTERS = {
  group: "",
  teacher: "",
  room: "",
  day: "",
};

export const createEmptyScheduleFiltersBySemester = () => ({
  1: { ...EMPTY_SCHEDULE_FILTERS },
  2: { ...EMPTY_SCHEDULE_FILTERS },
});

export const JOB_ERROR_CODE_TRANSLATION_KEYS = {
  optimizer_dependency_missing: "errorOptimizerDependencyMissing",
  optimizer_requires_teachers: "errorOptimizerRequiresTeachers",
  optimizer_requires_rooms: "errorOptimizerRequiresRooms",
  optimizer_requires_plan_items: "errorOptimizerRequiresPlanItems",
  optimizer_requires_slots: "errorOptimizerRequiresSlots",
  optimizer_no_solution: "errorOptimizerNoSolution",
  invalid_time_slot: "errorInvalidTimeSlot",
  invalid_teacher: "errorInvalidTeacher",
  invalid_room: "errorInvalidRoom",
  unknown_teacher: "errorUnknownTeacher",
  schedule_generation_requires_data: "errorScheduleGenerationRequiresData",
};

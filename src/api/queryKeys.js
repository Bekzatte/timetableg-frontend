export const queryKeys = {
  schedules: {
    list: (params = {}) => ["schedules", params],
    generationJob: (jobId) => ["schedules", "generation-job", jobId],
  },
  sections: {
    all: ["sections"],
    validationReport: ["sections", "validation-report"],
  },
  rooms: {
    all: ["rooms"],
    blocks: ["room-blocks"],
  },
  groups: {
    all: ["groups"],
  },
  courses: {
    all: ["courses"],
    components: ["course-components"],
  },
  teachers: {
    all: ["teachers"],
    preferenceRequests: ["teacher-preferences"],
  },
  notifications: {
    all: (user) => [
      "notifications",
      user?.role || "guest",
      user?.id || user?.email || "",
    ],
  },
};

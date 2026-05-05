import {
  courseAPI,
  groupAPI,
  roomAPI,
  roomBlockAPI,
  scheduleAPI,
  sectionAPI,
  teacherAPI,
} from "../services/api";
import { useServerQuery } from "../hooks/useServerData";
import { GENERATION_POLL_INTERVAL_MS } from "../features/schedule/constants";
import { queryKeys } from "./queryKeys";

const isGenerationJobFinished = (job) =>
  job?.status === "completed" || job?.status === "failed";

export const useSchedulePageQueries = (year, isAdmin) => {
  const schedulesQuery = useServerQuery(
    queryKeys.schedules.list({ year }),
    () => scheduleAPI.getAll({ year }),
  );

  const sectionsQuery = useServerQuery(
    queryKeys.sections.all,
    sectionAPI.getAll,
    { enabled: isAdmin },
  );
  const roomsQuery = useServerQuery(queryKeys.rooms.all, roomAPI.getAll, {
    enabled: isAdmin,
  });
  const groupsQuery = useServerQuery(queryKeys.groups.all, groupAPI.getAll, {
    enabled: isAdmin,
  });
  const roomBlocksQuery = useServerQuery(
    queryKeys.rooms.blocks,
    roomBlockAPI.getAll,
    { enabled: isAdmin },
  );
  const coursesQuery = useServerQuery(queryKeys.courses.all, courseAPI.getAll, {
    enabled: isAdmin,
  });
  const teachersQuery = useServerQuery(
    queryKeys.teachers.all,
    teacherAPI.getAll,
    { enabled: isAdmin },
  );

  return {
    schedulesQuery,
    sectionsQuery,
    roomsQuery,
    groupsQuery,
    roomBlocksQuery,
    coursesQuery,
    teachersQuery,
  };
};

export const useScheduleGenerationJobQuery = (jobId, enabled) =>
  useServerQuery(
    queryKeys.schedules.generationJob(jobId),
    () => scheduleAPI.getGenerationJob(jobId),
    {
      enabled: Boolean(enabled && jobId),
      refetchInterval: (query) =>
        isGenerationJobFinished(query.state.data)
          ? false
          : GENERATION_POLL_INTERVAL_MS,
    },
  );

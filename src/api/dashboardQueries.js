import {
  courseAPI,
  courseComponentAPI,
  groupAPI,
  roomAPI,
  scheduleAPI,
  sectionAPI,
  teacherAPI,
} from "../services/api";
import { useServerQuery } from "../hooks/useServerData";
import { queryKeys } from "./queryKeys";

export const dashboardQueryKeys = [
  queryKeys.courses.all,
  queryKeys.courses.components,
  queryKeys.teachers.all,
  queryKeys.rooms.all,
  queryKeys.groups.all,
  queryKeys.sections.all,
  queryKeys.schedules.list({}),
];

export const useDashboardQueries = () => {
  const coursesQuery = useServerQuery(queryKeys.courses.all, courseAPI.getAll);
  const courseComponentsQuery = useServerQuery(
    queryKeys.courses.components,
    courseComponentAPI.getAll,
  );
  const teachersQuery = useServerQuery(queryKeys.teachers.all, teacherAPI.getAll);
  const roomsQuery = useServerQuery(queryKeys.rooms.all, roomAPI.getAll);
  const groupsQuery = useServerQuery(queryKeys.groups.all, groupAPI.getAll);
  const sectionsQuery = useServerQuery(queryKeys.sections.all, sectionAPI.getAll);
  const schedulesQuery = useServerQuery(
    queryKeys.schedules.list({}),
    () => scheduleAPI.getAll({}),
  );

  return {
    coursesQuery,
    courseComponentsQuery,
    teachersQuery,
    roomsQuery,
    groupsQuery,
    sectionsQuery,
    schedulesQuery,
  };
};

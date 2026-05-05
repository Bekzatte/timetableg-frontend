import {
  courseAPI,
  courseComponentAPI,
  groupAPI,
  roomAPI,
  roomBlockAPI,
  sectionAPI,
  teacherAPI,
  teacherPreferenceAPI,
} from "../services/api";
import { useServerQuery } from "../hooks/useServerData";
import { queryKeys } from "./queryKeys";

export const useGroupsQuery = () =>
  useServerQuery(queryKeys.groups.all, groupAPI.getAll);

export const useCoursesQuery = () =>
  useServerQuery(queryKeys.courses.all, courseAPI.getAll);

export const useCourseComponentsQuery = () =>
  useServerQuery(queryKeys.courses.components, courseComponentAPI.getAll);

export const useRoomsQuery = () =>
  useServerQuery(queryKeys.rooms.all, roomAPI.getAll);

export const useRoomBlocksQuery = () =>
  useServerQuery(queryKeys.rooms.blocks, roomBlockAPI.getAll);

export const useTeachersQuery = () =>
  useServerQuery(queryKeys.teachers.all, teacherAPI.getAll);

export const useTeacherPreferenceRequestsQuery = () =>
  useServerQuery(queryKeys.teachers.preferenceRequests, teacherPreferenceAPI.getAll);

export const useSectionsQuery = () =>
  useServerQuery(queryKeys.sections.all, sectionAPI.getAll);

export const useSectionValidationReportQuery = () =>
  useServerQuery(
    queryKeys.sections.validationReport,
    sectionAPI.getValidationReport,
  );

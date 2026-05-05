import { teacherPreferenceAPI } from "../services/api";
import { useServerQuery } from "../hooks/useServerData";

export const profileQueryKeys = {
  teacherPreferencesMine: ["teacher-preferences", "mine"],
};

export const useTeacherPreferenceQuery = (enabled) =>
  useServerQuery(
    profileQueryKeys.teacherPreferencesMine,
    teacherPreferenceAPI.getMine,
    { enabled },
  );

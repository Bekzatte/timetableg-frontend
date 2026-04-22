import { useEffect, useState } from "react";
import { authAPI, profileAPI } from "../services/api";
import { useAutoDismiss } from "../hooks/useAutoDismiss";
import { ROLES } from "../constants/roles";
import { getTranslation } from "../i18n/translations";
import { AuthContext } from "./AuthContextValue";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useAutoDismiss(error, setError, 5000, null);

  const persistUser = (nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      sessionStorage.setItem("user", JSON.stringify(nextUser));
      localStorage.removeItem("user");
      return;
    }
    sessionStorage.removeItem("user");
    localStorage.removeItem("user");
  };

  // Session storage keeps the bearer token out of long-lived browser storage.
  useEffect(() => {
    const storedUser = sessionStorage.getItem("user") || localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        profileAPI
          .getCurrent()
          .then((profile) => {
            persistUser({ ...parsedUser, ...profile });
          })
          .catch((err) => {
            console.error("Error refreshing profile:", err);
            persistUser(null);
          })
          .finally(() => {
            setIsReady(true);
          });
      } catch (e) {
        console.error("Error loading user from browser storage:", e);
        persistUser(null);
        setIsReady(true);
      }
      return;
    }
    setIsReady(true);
  }, []);

  const getErrorMessage = (err, fallback) =>
    err?.response?.data?.error || err?.message || fallback;
  const getLocalized = (key) =>
    getTranslation(localStorage.getItem("language") || "ru", key);

  const login = async (email, password, role = ROLES.STUDENT) => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await authAPI.login(email, password, role);
      const userWithRole = { ...userData, role: userData.role || role };
      persistUser(userWithRole);
      return userWithRole;
    } catch (err) {
      const errorMsg = getErrorMessage(err, getLocalized("errorLoginFallback"));
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email,
    password,
    displayName,
    role = ROLES.STUDENT,
    phone = "",
    department = "",
    programmeName = "",
    groupId = "",
    subgroup = "",
    language = "",
    teachingLanguages = [],
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await authAPI.register(
        email,
        password,
        displayName,
        role,
        phone,
        department,
        programmeName,
        groupId,
        subgroup,
        language,
        teachingLanguages,
      );
      persistUser(userData);
      return userData;
    } catch (err) {
      const errorMsg = getErrorMessage(err, getLocalized("errorRegisterFallback"));
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authAPI.logout().catch((err) => {
      console.error("Logout request failed:", err);
    });
    persistUser(null);
    setError(null);
  };

  const refreshProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await profileAPI.getCurrent();
      const nextUser = { ...user, ...profile };
      persistUser(nextUser);
      return nextUser;
    } catch (err) {
      const errorMsg = getErrorMessage(err, getLocalized("errorProfileLoadFallback"));
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadAvatar = async (avatarData) => {
    setIsLoading(true);
    setError(null);
    try {
      const nextUser = await profileAPI.uploadAvatar(avatarData);
      persistUser(nextUser);
      return nextUser;
    } catch (err) {
      const errorMsg = getErrorMessage(err, getLocalized("errorAvatarUploadFallback"));
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    isReady,
    error,
    isAdmin: user?.role === ROLES.ADMIN,
    isTeacher: user?.role === ROLES.TEACHER,
    isStudent: user?.role === ROLES.STUDENT,
    login,
    register,
    logout,
    refreshProfile,
    uploadAvatar,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

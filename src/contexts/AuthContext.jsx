import { useEffect, useState } from "react";
import { authAPI, profileAPI } from "../services/api";
import { useAutoDismiss } from "../hooks/useAutoDismiss";
import { useGlobalLoader } from "../hooks/useGlobalLoader";
import { ROLES } from "../constants/roles";
import { getTranslation } from "../i18n/translations";
import { getStoredUser, setStoredUser } from "../services/browserSession";
import { AuthContext } from "./AuthContextValue";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const { withGlobalLoader } = useGlobalLoader();

  useAutoDismiss(error, setError, 5000, null);

  const persistUser = (nextUser) => {
    setUser(nextUser);
    setStoredUser(nextUser);
  };

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      profileAPI
        .getCurrent()
        .then((profile) => {
          persistUser({ ...storedUser, ...profile });
        })
        .catch((err) => {
          console.error("Error refreshing profile:", err);
          persistUser(null);
        })
        .finally(() => {
          setIsReady(true);
        });
      return;
    }

    setIsReady(true);
  }, []);

  useEffect(() => {
    const onStorageInvalidated = () => {
      if (getStoredUser()) {
        return;
      }

      setUser(null);
      setError(null);
    };

    window.addEventListener("auth:session-cleared", onStorageInvalidated);
    return () => window.removeEventListener("auth:session-cleared", onStorageInvalidated);
  }, []);

  const getErrorMessage = (err, fallback) =>
    err?.response?.data?.error || err?.message || fallback;
  const getLocalized = (key) =>
    getTranslation(localStorage.getItem("language") || "ru", key);

  const login = async (email, password, role = ROLES.STUDENT) => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await withGlobalLoader(
        () => authAPI.login(email, password, role),
        {
          title: getLocalized("login"),
          description: getLocalized("globalLoaderAuthDescription"),
        },
      );
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
      const userData = await withGlobalLoader(
        () =>
          authAPI.register(
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
          ),
        {
          title: getLocalized("register"),
          description: getLocalized("globalLoaderAuthDescription"),
        },
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
      const profile = await withGlobalLoader(
        () => profileAPI.getCurrent(),
        {
          title: getLocalized("profile"),
          description: getLocalized("globalLoaderProfileDescription"),
        },
      );
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
      const nextUser = await withGlobalLoader(
        () => profileAPI.uploadAvatar(avatarData),
        {
          title: getLocalized("profile"),
          description: getLocalized("globalLoaderAvatarDescription"),
        },
      );
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

import { useEffect, useState } from "react";
import { authAPI, profileAPI } from "../services/api";
import { ROLES } from "../constants/roles";
import { AuthContext } from "./AuthContextValue";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const persistUser = (nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem("user", JSON.stringify(nextUser));
      return;
    }
    localStorage.removeItem("user");
  };

  // Загрузить данные из localStorage при инициализации
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
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
          });
      } catch (e) {
        console.error("Error loading user from localStorage:", e);
      }
    }
  }, []);

  const getErrorMessage = (err, fallback) =>
    err?.response?.data?.error || err?.message || fallback;

  const login = async (email, password, role = ROLES.STUDENT) => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await authAPI.login(email, password, role);
      const userWithRole = { ...userData, role: userData.role || role };
      persistUser(userWithRole);
      return userWithRole;
    } catch (err) {
      const errorMsg = getErrorMessage(err, "Ошибка при входе");
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
    department = "",
    programmeName = "",
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await authAPI.register(
        email,
        password,
        displayName,
        role,
        department,
        programmeName,
      );
      persistUser(userData);
      return userData;
    } catch (err) {
      const errorMsg = getErrorMessage(err, "Ошибка при регистрации");
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
      const errorMsg = getErrorMessage(err, "Ошибка при загрузке профиля");
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
      const errorMsg = getErrorMessage(err, "Ошибка при загрузке фото");
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
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

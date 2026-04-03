import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export const ROLES = {
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Загрузить данные из localStorage при инициализации
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error loading user from localStorage:", e);
      }
    }
  }, []);

  const getErrorMessage = (err, fallback) =>
    err?.response?.data?.error || err?.message || fallback;

  const login = async (
    email,
    password,
    role = ROLES.STUDENT,
    teacherCode = "",
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await authAPI.login(email, password, role, teacherCode);
      const userWithRole = { ...userData, role: userData.role || role };
      setUser(userWithRole);
      localStorage.setItem("user", JSON.stringify(userWithRole));
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
    teacherCode = "",
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await authAPI.register(
        email,
        password,
        displayName,
        role,
        teacherCode,
      );
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
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
    setUser(null);
    localStorage.removeItem("user");
    setError(null);
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { ROLES, useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../hooks/useTranslation";

export const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuth();
  const [selectedRole, setSelectedRole] = React.useState(ROLES.STUDENT);
  const [displayName, setDisplayName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [localError, setLocalError] = React.useState("");

  const roleOptions = [
    { value: ROLES.STUDENT, label: t("student") },
    { value: ROLES.TEACHER, label: t("teacher") },
  ];

  const handleRegister = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!displayName || !email || !password || !confirmPassword) {
      setLocalError(t("fillAllFields"));
      return;
    }

    if (password !== confirmPassword) {
      setLocalError(t("passwordsNotMatch"));
      return;
    }

    if (password.length < 6) {
      setLocalError(t("passwordTooShort"));
      return;
    }

    try {
      await register(email, password, displayName, selectedRole);
      navigate("/");
    } catch (err) {
      setLocalError(err.message);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">
          {t("register")}
        </h1>

        {(localError || error) && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
            {localError || error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <p className="block text-sm font-medium mb-2 text-gray-700">
              {t("registerAs")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {roleOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedRole(option.value)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                    selectedRole === option.value
                      ? "border-[#014531] bg-[#014531] text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-[#014531]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">{t("adminRegistrationDisabled")}</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              {t("fullName")}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("enterFullName")}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              {t("email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@university.kz"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              {t("password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              {t("confirmPassword")}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {selectedRole === ROLES.TEACHER && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {t("teacherEmailHint")}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#014531] hover:bg-[#02704e] disabled:opacity-50 text-white px-4 py-2 rounded-md transition font-medium cursor-pointer"
          >
            {isLoading ? t("loading") : t("register")}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-gray-600 text-sm">
            {t("alreadyHaveAccount")}{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {t("loginHere")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

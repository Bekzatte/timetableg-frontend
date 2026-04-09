import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ROLES } from "../constants/roles";
import { useAuth } from "../hooks/useAuth";
import { useAutoDismiss } from "../hooks/useAutoDismiss";
import { useTranslation } from "../hooks/useTranslation";

export const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();
  const [selectedRole, setSelectedRole] = useState(ROLES.STUDENT);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  useAutoDismiss(localError, setLocalError);

  const roleOptions = [
    { value: ROLES.ADMIN, label: t("adminLogin") },
    { value: ROLES.TEACHER, label: t("teacher") },
    { value: ROLES.STUDENT, label: t("student") },
  ];
  const emailPlaceholder =
    selectedRole === ROLES.TEACHER || selectedRole === ROLES.ADMIN
      ? "name@kazatu.edu.kz"
      : "name@example.com";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!email || !password) {
      setLocalError(t("fillAllFields"));
      return;
    }

    try {
      const nextUser = await login(email.trim().toLowerCase(), password, selectedRole);
      navigate(nextUser?.role === ROLES.ADMIN ? "/" : "/schedule");
    } catch (err) {
      setLocalError(err.message);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">{t("login")}</h1>

        {(localError || error) && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
            {localError || error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <p className="block text-sm font-medium mb-2 text-gray-700">
              {t("loginAs")}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              {t("email")}
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={emailPlaceholder}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              {t("password")}
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#014531] hover:bg-[#02704e] disabled:opacity-50 text-white px-4 py-2 rounded-md transition font-medium cursor-pointer"
          >
            {isLoading ? t("loading") : t("login")}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-gray-600 text-sm">
            {t("noAccount")}{" "}
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {t("registerHere")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

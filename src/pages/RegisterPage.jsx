import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ROLES } from "../constants/roles";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";
import { DEPARTMENTS } from "../constants/departments";
import { PROGRAMMES } from "../constants/programmes";
import { groupAPI } from "../services/api";
import { STUDY_LANGUAGES } from "../constants/languages";

export const RegisterPage = () => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuth();
  const [selectedRole, setSelectedRole] = useState(ROLES.STUDENT);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [programmeName, setProgrammeName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [subgroup, setSubgroup] = useState("");
  const [studentLanguage, setStudentLanguage] = useState("");
  const [groups, setGroups] = useState([]);
  const [localError, setLocalError] = useState("");

  const roleOptions = [
    { value: ROLES.STUDENT, label: t("student") },
    { value: ROLES.TEACHER, label: t("teacher") },
  ];
  const emailPlaceholder =
    selectedRole === ROLES.TEACHER ? "name@kazatu.edu.kz" : "name@example.com";
  const selectedGroup = groups.find(
    (group) => String(group.id) === String(groupId),
  );
  const requiresSubgroup = Boolean(selectedGroup?.has_subgroups);

  useEffect(() => {
    groupAPI
      .getPublicList()
      .then((response) => {
        setGroups(Array.isArray(response) ? response : []);
      })
      .catch(() => {
        setGroups([]);
      });
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!displayName || !email || !password || !confirmPassword) {
      setLocalError(t("fillAllFields"));
      return;
    }

    if (
      selectedRole === ROLES.STUDENT &&
      (!department || !programmeName || !groupId || !studentLanguage)
    ) {
      setLocalError(t("fillAllFields"));
      return;
    }

    if (selectedRole === ROLES.STUDENT && requiresSubgroup && !subgroup) {
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
      await register(
        email,
        password,
        displayName,
        selectedRole,
        department,
        programmeName,
        groupId,
        subgroup,
        studentLanguage,
        selectedRole === ROLES.TEACHER ? ["ru", "kk"] : [],
      );
      navigate("/");
    } catch (err) {
      setLocalError(err.message);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-md">
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
                  onClick={() => {
                    setSelectedRole(option.value);
                    if (option.value !== ROLES.STUDENT) {
                      setDepartment("");
                      setProgrammeName("");
                      setGroupId("");
                      setSubgroup("");
                      setStudentLanguage("");
                    }
                  }}
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
              placeholder={emailPlaceholder}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {selectedRole === ROLES.STUDENT && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  {t("facultyInstitute")}
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">{t("selectFacultyInstitute")}</option>
                  {DEPARTMENTS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  {t("programmeName")}
                </label>
                <select
                  value={programmeName}
                  onChange={(e) => setProgrammeName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">{t("selectProgrammeName")}</option>
                  {PROGRAMMES.map((programme) => (
                    <option key={programme.value} value={programme.labels.ru}>
                      {programme.labels[language] || programme.labels.en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  {t("studyLanguage")}
                </label>
                <select
                  value={studentLanguage}
                  onChange={(e) => setStudentLanguage(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">{t("selectStudyLanguage")}</option>
                  {STUDY_LANGUAGES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {t(item.labelKey)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  {t("groupNumber")}
                </label>
                <select
                  value={groupId}
                  onChange={(e) => {
                    const nextGroupId = e.target.value;
                    const nextGroup = groups.find(
                      (group) => String(group.id) === String(nextGroupId),
                    );
                    setGroupId(nextGroupId);
                    setStudentLanguage(nextGroup?.language || "");
                    if (!nextGroup?.has_subgroups) {
                      setSubgroup("");
                    }
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">{t("selectGroup")}</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} • {t(group.language === "kk" ? "languageKazakh" : "languageRussian")}
                    </option>
                  ))}
                </select>
              </div>

              {requiresSubgroup ? (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    {t("subgroup")}
                  </label>
                  <select
                    value={subgroup}
                    onChange={(e) => setSubgroup(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">{t("selectSubgroup")}</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                  </select>
                </div>
              ) : null}
            </>
          )}

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

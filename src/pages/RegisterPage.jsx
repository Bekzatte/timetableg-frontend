import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ROLES } from "../constants/roles";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";
import { DEPARTMENTS } from "../constants/departments";
import { PROGRAMMES } from "../constants/programmes";
import { useAutoDismiss } from "../hooks/useAutoDismiss";
import { groupAPI, teacherClaimAPI } from "../services/api";
import { STUDY_LANGUAGES } from "../constants/languages";

const TEACHER_REGISTRATION_MODES = {
  CLAIM: "claim",
  MANUAL: "manual",
};

export const RegisterPage = () => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const { register, login, isLoading, error } = useAuth();
  const [selectedRole, setSelectedRole] = useState(ROLES.STUDENT);
  const [teacherRegistrationMode, setTeacherRegistrationMode] = useState(
    TEACHER_REGISTRATION_MODES.CLAIM,
  );
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [programmeName, setProgrammeName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [subgroup, setSubgroup] = useState("");
  const [studentLanguage, setStudentLanguage] = useState("");
  const [teacherLanguages, setTeacherLanguages] = useState([]);
  const [groups, setGroups] = useState([]);
  const [localError, setLocalError] = useState("");
  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");
  const [teacherSearchResults, setTeacherSearchResults] = useState([]);
  const [hasTeacherSearchAttempt, setHasTeacherSearchAttempt] = useState(false);
  const [selectedTeacherAccount, setSelectedTeacherAccount] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [claimDebugCode, setClaimDebugCode] = useState("");
  const [isSearchingTeachers, setIsSearchingTeachers] = useState(false);
  const [isRequestingClaimCode, setIsRequestingClaimCode] = useState(false);
  const [isConfirmingClaim, setIsConfirmingClaim] = useState(false);
  const teacherSearchRequestRef = useRef(0);

  useAutoDismiss(localError, setLocalError);

  const roleOptions = [
    { value: ROLES.STUDENT, label: t("student") },
    { value: ROLES.TEACHER, label: t("teacher") },
  ];
  const selectedGroup = groups.find((group) => String(group.id) === String(groupId));
  const requiresSubgroup = Boolean(selectedGroup?.has_subgroups);
  const isTeacherClaimMode =
    selectedRole === ROLES.TEACHER &&
    teacherRegistrationMode === TEACHER_REGISTRATION_MODES.CLAIM;
  const isSubmittingClaim = isConfirmingClaim || isLoading;
  const emailPlaceholder =
    selectedRole === ROLES.TEACHER ? "name@kazatu.edu.kz" : "name@example.com";

  const toggleTeacherLanguage = (nextLanguage) => {
    setTeacherLanguages((current) =>
      current.includes(nextLanguage)
        ? current.filter((item) => item !== nextLanguage)
        : [...current, nextLanguage],
    );
  };

  const resetTeacherClaimState = () => {
    setTeacherSearchQuery("");
    setTeacherSearchResults([]);
    setHasTeacherSearchAttempt(false);
    setSelectedTeacherAccount(null);
    setVerificationCode("");
    setClaimDebugCode("");
  };

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

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setLocalError("");
    setPassword("");
    setConfirmPassword("");

    if (role !== ROLES.STUDENT) {
      setProgrammeName("");
      setGroupId("");
      setSubgroup("");
      setStudentLanguage("");
    }

    if (role !== ROLES.TEACHER) {
      setTeacherLanguages([]);
      resetTeacherClaimState();
      setTeacherRegistrationMode(TEACHER_REGISTRATION_MODES.CLAIM);
    }

    if (role === ROLES.TEACHER) {
      setDisplayName("");
      setEmail("");
      setDepartment("");
      return;
    }

    setDisplayName("");
    setEmail("");
    setDepartment("");
  };

  const handleTeacherRegistrationModeChange = (mode) => {
    setTeacherRegistrationMode(mode);
    setLocalError("");
    setPassword("");
    setConfirmPassword("");
    resetTeacherClaimState();

    if (mode === TEACHER_REGISTRATION_MODES.MANUAL) {
      setDisplayName("");
      setEmail("");
      setDepartment("");
      setTeacherLanguages([]);
    }
  };

  const searchTeachers = useCallback(async (query) => {
    setLocalError("");

    if (query.length < 2) {
      setTeacherSearchResults([]);
      setHasTeacherSearchAttempt(false);
      return;
    }

    try {
      const requestId = teacherSearchRequestRef.current + 1;
      teacherSearchRequestRef.current = requestId;
      setIsSearchingTeachers(true);
      setHasTeacherSearchAttempt(true);
      const results = await teacherClaimAPI.search(query);
      if (teacherSearchRequestRef.current !== requestId) {
        return;
      }
      const nextResults = Array.isArray(results) ? results : [];
      setTeacherSearchResults(nextResults);
      setSelectedTeacherAccount((current) =>
        current && nextResults.some((item) => item.id === current.id) ? current : null,
      );
      setVerificationCode("");
      setClaimDebugCode("");
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setIsSearchingTeachers(false);
    }
  }, []);

  const handleTeacherSearch = async () => {
    await searchTeachers(teacherSearchQuery.trim());
  };

  useEffect(() => {
    if (!isTeacherClaimMode) {
      return;
    }

    const query = teacherSearchQuery.trim();
    if (query.length < 2) {
      setTeacherSearchResults([]);
      setHasTeacherSearchAttempt(false);
      setIsSearchingTeachers(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      searchTeachers(query);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [isTeacherClaimMode, searchTeachers, teacherSearchQuery]);

  const handleTeacherAccountSelect = (teacherAccount) => {
    setSelectedTeacherAccount(teacherAccount);
    setDisplayName(teacherAccount.name || "");
    setEmail("");
    setDepartment("");
    setTeacherLanguages(
      String(teacherAccount.teachingLanguages || "ru,kk")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    );
    setVerificationCode("");
    setClaimDebugCode("");
    setLocalError("");
  };

  const handleRequestClaimCode = async () => {
    if (!selectedTeacherAccount) {
      setLocalError(t("fillAllFields"));
      return;
    }

    try {
      setIsRequestingClaimCode(true);
      setLocalError("");
      const result = await teacherClaimAPI.request(
        selectedTeacherAccount.id,
        selectedTeacherAccount.email,
      );
      setClaimDebugCode(result.debugCode || "");
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setIsRequestingClaimCode(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (isTeacherClaimMode) {
      if (!selectedTeacherAccount || !verificationCode || !password || !confirmPassword) {
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
        setIsConfirmingClaim(true);
        await teacherClaimAPI.confirm(
          selectedTeacherAccount.id,
          selectedTeacherAccount.email,
          verificationCode,
          password,
        );
        await login(selectedTeacherAccount.email, password, ROLES.TEACHER);
        navigate("/schedule");
      } catch (err) {
        setLocalError(err.message);
      } finally {
        setIsConfirmingClaim(false);
      }
      return;
    }

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

    if (
      selectedRole === ROLES.TEACHER &&
      (!department || teacherLanguages.length === 0)
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
      const nextUser = await register(
        email.trim().toLowerCase(),
        password,
        displayName,
        selectedRole,
        department,
        programmeName,
        groupId,
        subgroup,
        studentLanguage,
        selectedRole === ROLES.TEACHER ? teacherLanguages : [],
      );
      navigate(nextUser?.role === ROLES.ADMIN ? "/" : "/schedule");
    } catch (err) {
      setLocalError(err.message);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">{t("register")}</h1>

        {(localError || error) && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {localError || error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <p className="block text-sm font-medium mb-2 text-gray-700">{t("registerAs")}</p>
            <div className="grid grid-cols-2 gap-2">
              {roleOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleRoleChange(option.value)}
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

          {selectedRole === ROLES.TEACHER ? (
            <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">{t("teacher")}</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleTeacherRegistrationModeChange(TEACHER_REGISTRATION_MODES.CLAIM)
                    }
                    className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                      teacherRegistrationMode === TEACHER_REGISTRATION_MODES.CLAIM
                        ? "border-[#014531] bg-[#014531] text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:border-[#014531]"
                    }`}
                  >
                    {t("claimImportedTeacher")}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleTeacherRegistrationModeChange(TEACHER_REGISTRATION_MODES.MANUAL)
                    }
                    className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                      teacherRegistrationMode === TEACHER_REGISTRATION_MODES.MANUAL
                        ? "border-[#014531] bg-[#014531] text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:border-[#014531]"
                    }`}
                  >
                    {t("manualTeacherRegistration")}
                  </button>
                </div>
              </div>

              {isTeacherClaimMode ? (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {t("teacherClaimSearchLabel")}
                    </label>
                    <p className="mb-2 text-xs text-gray-500">{t("teacherClaimSearchHelp")}</p>
                    <div className="flex gap-2">
                      <input
                        type="search"
                        value={teacherSearchQuery}
                        onChange={(e) => setTeacherSearchQuery(e.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            handleTeacherSearch();
                          }
                        }}
                        placeholder={t("teacherClaimSearchPlaceholder")}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleTeacherSearch}
                        disabled={isSearchingTeachers}
                        className="shrink-0 rounded-md bg-[#014531] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#02704e] disabled:opacity-60"
                      >
                        {isSearchingTeachers ? t("loading") : t("teacherClaimSearchAction")}
                      </button>
                    </div>
                  </div>

                  {teacherSearchResults.length > 0 ? (
                    <div className="space-y-2">
                      {teacherSearchResults.map((teacherAccount) => (
                        <button
                          key={teacherAccount.id}
                          type="button"
                          onClick={() => handleTeacherAccountSelect(teacherAccount)}
                          className={`w-full rounded-md border px-3 py-3 text-left transition ${
                            selectedTeacherAccount?.id === teacherAccount.id
                              ? "border-[#014531] bg-[#f4fbf7]"
                              : "border-gray-300 bg-white hover:border-[#014531]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-gray-900">{teacherAccount.name}</p>
                              <p className="text-sm text-gray-600">{teacherAccount.maskedEmail}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : hasTeacherSearchAttempt && !isSearchingTeachers ? (
                    <div className="rounded-md border border-gray-200 bg-white px-3 py-3 text-sm text-gray-600">
                      {t("teacherClaimSearchEmpty")}
                    </div>
                  ) : null}

                  {selectedTeacherAccount ? (
                    <div className="space-y-3 rounded-md border border-emerald-200 bg-emerald-50 p-4">
                      <div>
                        <p className="text-sm font-medium text-emerald-900">
                          {t("teacherClaimSelectedAccount")}
                        </p>
                        <p className="mt-1 text-sm text-emerald-800">
                          {selectedTeacherAccount.name}
                        </p>
                        <p className="text-sm text-emerald-800">
                          {selectedTeacherAccount.maskedEmail}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleRequestClaimCode}
                        disabled={isRequestingClaimCode}
                        className="w-full rounded-md border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60"
                      >
                        {isRequestingClaimCode ? t("loading") : t("teacherClaimRequestCode")}
                      </button>

                      <p className="text-xs text-emerald-800">{t("teacherClaimVerificationHint")}</p>

                      {claimDebugCode ? (
                        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                          <p>
                            {t("teacherClaimCodeSentHint")}{" "}
                            <span className="font-medium">{selectedTeacherAccount.maskedEmail}</span>
                          </p>
                          {t("teacherClaimDevCode")}:{" "}
                          <span className="font-semibold">{claimDebugCode}</span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {t("teacherClaimCodeLabel")}
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder={t("teacherClaimCodePlaceholder")}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          {(selectedRole !== ROLES.TEACHER ||
            teacherRegistrationMode === TEACHER_REGISTRATION_MODES.MANUAL) && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  {t("fullName")}
                </label>
                <input
                  type="text"
                  autoComplete="name"
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
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={emailPlaceholder}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

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
                      {group.name} •{" "}
                      {t(group.language === "kk" ? "languageKazakh" : "languageRussian")} •{" "}
                      {t("studyCourse")} {group.study_course ?? "-"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  {t("studyLanguage")}
                </label>
                <div className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  {selectedGroup
                    ? t(selectedGroup.language === "kk" ? "languageKazakh" : "languageRussian")
                    : t("selectGroup")}
                </div>
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

          {selectedRole === ROLES.TEACHER &&
          teacherRegistrationMode === TEACHER_REGISTRATION_MODES.MANUAL ? (
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
                <p className="block text-sm font-medium mb-2 text-gray-700">
                  {t("teachingLanguages")}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {STUDY_LANGUAGES.map((item) => (
                    <label
                      key={item.value}
                      className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={teacherLanguages.includes(item.value)}
                        onChange={() => toggleTeacherLanguage(item.value)}
                        className="h-4 w-4 rounded border-gray-300 text-[#014531] focus:ring-[#014531]"
                      />
                      <span>{t(item.labelKey)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {t("teacherEmailHint")}
              </p>
            </>
          ) : null}

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              {t("password")}
            </label>
            <input
              type="password"
              autoComplete="new-password"
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
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || isConfirmingClaim}
            className="w-full cursor-pointer rounded-md bg-[#014531] px-4 py-2 font-medium text-white transition hover:bg-[#02704e] disabled:opacity-50"
          >
            {isSubmittingClaim
              ? t("loading")
              : isTeacherClaimMode
                ? t("teacherClaimConfirmAction")
                : t("register")}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-gray-600 text-sm">
            {t("alreadyHaveAccount")}{" "}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              {t("loginHere")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

import { useRef, useState } from "react";
import { teacherPreferenceAPI } from "../services/api";
import { useTeacherPreferenceQuery } from "../api/profileQueries";
import { useAuth } from "../hooks/useAuth";
import { useAutoDismiss } from "../hooks/useAutoDismiss";
import { useGlobalLoader } from "../hooks/useGlobalLoader";
import { useTranslation } from "../hooks/useTranslation";
import { formatLessonTimeRange, scheduleHours } from "../utils/timeSlots";

const MAX_FILE_SIZE = 1024 * 1024;

const getInitials = (displayName = "") =>
  displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

const infoLabelClass =
  "text-[11px] uppercase tracking-[0.16em] text-gray-500 max-[420px]:tracking-[0.1em]";
const infoValueClass =
  "mt-2 text-base font-semibold text-gray-900 break-words max-[420px]:text-[15px]";

export default function ProfilePage() {
  const { t } = useTranslation();
  const { withGlobalLoader } = useGlobalLoader();
  const { user, uploadAvatar, isLoading } = useAuth();
  const [localError, setLocalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [preferenceForm, setPreferenceForm] = useState({
    preferred_day: "monday",
    preferred_hour: "8",
    note: "",
  });
  const [preferenceError, setPreferenceError] = useState("");
  const [preferenceSuccess, setPreferenceSuccess] = useState("");
  const [isSubmittingPreference, setIsSubmittingPreference] = useState(false);
  const fileInputRef = useRef(null);
  const preferenceQuery = useTeacherPreferenceQuery(user?.role === "teacher");

  useAutoDismiss(localError, setLocalError);
  useAutoDismiss(successMessage, setSuccessMessage);
  useAutoDismiss(preferenceError, setPreferenceError);
  useAutoDismiss(preferenceSuccess, setPreferenceSuccess);

  const preferenceLoadError = preferenceQuery.error?.message || "";
  const preferenceRequests = Array.isArray(preferenceQuery.data)
    ? preferenceQuery.data
    : [];

  const handlePreferenceChange = (event) => {
    const { name, value } = event.target;
    setPreferenceForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setLocalError("");
    setSuccessMessage("");

    if (!file.type.startsWith("image/")) {
      setLocalError(t("profileImageTypeError"));
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setLocalError(t("profileImageSizeError"));
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== "string") {
        setLocalError(t("profileImageReadError"));
        return;
      }

      try {
        await uploadAvatar(reader.result);
        setSuccessMessage(t("profileAvatarUpdated"));
      } catch (error) {
        setLocalError(error.message);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.onerror = () => {
      setLocalError(t("profileImageReadError"));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPreference = async (event) => {
    event.preventDefault();
    setPreferenceError("");
    setPreferenceSuccess("");

    try {
      setIsSubmittingPreference(true);
      await withGlobalLoader(
        () =>
          teacherPreferenceAPI.create({
            preferred_day: preferenceForm.preferred_day,
            preferred_hour: Number(preferenceForm.preferred_hour),
            note: preferenceForm.note.trim(),
          }),
        {
          title: t("teacherPreferenceSubmit"),
          description: t("globalLoaderSaveDescription"),
        },
      );
      setPreferenceForm({
        preferred_day: "monday",
        preferred_hour: "8",
        note: "",
      });
      setPreferenceSuccess(t("teacherPreferenceSubmitted"));
      await preferenceQuery.refetch();
    } catch (error) {
      setPreferenceError(error.message);
    } finally {
      setIsSubmittingPreference(false);
    }
  };

  return (
    <div className="min-h-[70vh]">
      <div className="mx-auto max-w-[1240px] overflow-hidden rounded-[24px] border border-green-100 bg-gradient-to-br from-white via-[#f4fbf7] to-[#eef7f1] shadow-[0_24px_80px_rgba(1,69,49,0.12)] max-[420px]:mx-0 sm:rounded-[32px]">
        <div className="bg-[#014531] px-4 py-7 text-white max-[420px]:px-3 max-[420px]:py-6 sm:px-8 sm:py-10 lg:px-10">
          <p className="text-sm uppercase tracking-[0.3em] text-yellow-300">
            {t("profile")}
          </p>
          <h1 className="mt-3 text-[28px] leading-tight font-bold max-[420px]:text-2xl sm:text-4xl">
            {t("profileWelcome")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-green-50 break-words sm:text-base">
            {t("profileDescription")}
          </p>
        </div>

        <div className="grid gap-4 px-3 py-4 max-[420px]:px-2.5 max-[420px]:py-3 sm:gap-6 sm:px-8 sm:py-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-10">
          <section className="rounded-[24px] bg-[#0b5d43] p-4 text-white shadow-lg max-[420px]:p-3.5 sm:rounded-[28px] sm:p-6">
            <div className="flex flex-col items-center text-center">
              {user?.avatarData ? (
                <img
                  src={user.avatarData}
                  alt={user.displayName}
                  className="h-28 w-28 rounded-full border-4 border-yellow-300 object-cover shadow-xl max-[420px]:h-24 max-[420px]:w-24 sm:h-36 sm:w-36"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-yellow-300 bg-white/10 text-3xl font-bold text-yellow-300 shadow-xl max-[420px]:h-24 max-[420px]:w-24 sm:h-36 sm:w-36 sm:text-4xl">
                  {getInitials(user?.displayName)}
                </div>
              )}

              <h2 className="mt-4 text-center text-xl leading-tight font-semibold break-words max-[420px]:text-lg sm:mt-5 sm:text-2xl">
                {user?.displayName}
              </h2>
              <p className="mt-1 max-w-full break-all text-sm text-green-100">
                {user?.email}
              </p>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-green-50">
                {t("profileUploadPhoto")}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-3 block w-full max-w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white file:mr-2 file:mb-2 file:rounded-lg file:border-0 file:bg-yellow-300 file:px-3 file:py-2 file:font-semibold file:text-[#014531] max-[420px]:text-xs"
              />
              <p className="mt-3 break-words text-xs text-green-100">
                {t("profileUploadHint")}
              </p>
            </div>
          </section>

          <section className="space-y-4">
            {localError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {localError}
              </div>
            ) : null}
            {successMessage ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            <div className="rounded-[24px] border border-green-100 bg-white p-4 shadow-sm max-[420px]:p-3.5 sm:rounded-[28px] sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 max-[420px]:text-base sm:text-xl">
                {t("profileInfo")}
              </h3>
              <p className="mt-2 break-words text-sm text-gray-600">
                {t("profileReadonly")}
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="min-w-0 rounded-2xl bg-[#f4fbf7] p-4 max-[420px]:p-3">
                  <p className={infoLabelClass}>
                    {t("fullName")}
                  </p>
                  <p className={infoValueClass}>
                    {user?.displayName}
                  </p>
                </div>
                <div className="min-w-0 rounded-2xl bg-[#f4fbf7] p-4 max-[420px]:p-3">
                  <p className={infoLabelClass}>
                    {t("email")}
                  </p>
                  <p className={`${infoValueClass} break-all`}>
                    {user?.email}
                  </p>
                </div>
                {user?.phone ? (
                  <div className="min-w-0 rounded-2xl bg-[#f4fbf7] p-4 max-[420px]:p-3">
                    <p className={infoLabelClass}>
                      {t("phone")}
                    </p>
                    <p className={infoValueClass}>
                      {user.phone}
                    </p>
                  </div>
                ) : null}
                {user?.role === "teacher" && user?.assignedDisciplinesText ? (
                  <div className="min-w-0 rounded-2xl bg-[#f4fbf7] p-4 max-[420px]:p-3">
                    <p className={infoLabelClass}>
                      {t("assignedDisciplines")}
                    </p>
                    <p className={infoValueClass}>
                      {user.assignedDisciplinesText}
                    </p>
                  </div>
                ) : null}
                {user?.role !== "teacher" && user?.department ? (
                  <div className="min-w-0 rounded-2xl bg-[#f4fbf7] p-4 max-[420px]:p-3">
                    <p className={infoLabelClass}>
                      {user?.role === "student" ? t("educationalProgrammeGroup") : t("facultyInstitute")}
                    </p>
                    <p className={infoValueClass}>
                      {user.department}
                    </p>
                  </div>
                ) : null}
                {user?.programmeName ? (
                  <div className="min-w-0 rounded-2xl bg-[#f4fbf7] p-4 max-[420px]:p-3">
                    <p className={infoLabelClass}>
                      {user?.role === "student" ? t("specialtyCode") : t("programmeName")}
                    </p>
                    <p className={infoValueClass}>
                      {user.programmeName}
                    </p>
                  </div>
                ) : null}
                {user?.groupName ? (
                  <div className="min-w-0 rounded-2xl bg-[#f4fbf7] p-4 max-[420px]:p-3">
                    <p className={infoLabelClass}>
                      {t("groupNumber")}
                    </p>
                    <p className={infoValueClass}>
                      {user.groupName}
                    </p>
                  </div>
                ) : null}
                {user?.subgroup ? (
                  <div className="min-w-0 rounded-2xl bg-[#f4fbf7] p-4 max-[420px]:p-3">
                    <p className={infoLabelClass}>
                      {t("subgroup")}
                    </p>
                    <p className={infoValueClass}>
                      {user.subgroup}
                    </p>
                  </div>
                ) : null}
                {user?.language ? (
                  <div className="min-w-0 rounded-2xl bg-[#f4fbf7] p-4 max-[420px]:p-3">
                    <p className={infoLabelClass}>
                      {t("studyLanguage")}
                    </p>
                    <p className={infoValueClass}>
                      {t(user.language === "kk" ? "languageKazakh" : "languageRussian")}
                    </p>
                  </div>
                ) : null}
                {user?.teachingLanguages ? (
                  <div className="min-w-0 rounded-2xl bg-[#f4fbf7] p-4 max-[420px]:p-3">
                    <p className={infoLabelClass}>
                      {t("teachingLanguages")}
                    </p>
                    <p className={infoValueClass}>
                      {String(user.teachingLanguages)
                        .split(",")
                        .filter(Boolean)
                        .map((item) => t(item === "kk" ? "languageKazakh" : "languageRussian"))
                        .join(", ")}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[24px] border border-dashed border-green-200 bg-white/80 p-4 max-[420px]:p-3.5 sm:rounded-[28px] sm:p-6">
              <p className="break-words text-sm text-gray-600">
                {isLoading ? t("loading") : t("profileNoEditNotice")}
              </p>
            </div>

            {user?.role === "teacher" ? (
              <div className="rounded-[24px] border border-amber-100 bg-white p-4 shadow-sm max-[420px]:p-3.5 sm:rounded-[28px] sm:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-semibold text-gray-900 max-[420px]:text-base sm:text-xl">
                      {t("teacherPreferencesTitle")}
                    </h3>
                    <p className="mt-2 break-words text-sm text-gray-600">
                      {t("teacherPreferencesDescription")}
                    </p>
                  </div>
                  <div className="w-fit rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
                    {preferenceRequests.length}
                  </div>
                </div>

                {preferenceError ? (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {preferenceError}
                  </div>
                ) : null}
                {!preferenceError && preferenceLoadError ? (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {preferenceLoadError}
                  </div>
                ) : null}
                {preferenceSuccess ? (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {preferenceSuccess}
                  </div>
                ) : null}

                <form
                  onSubmit={handleSubmitPreference}
                  className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_1.5fr_auto]"
                >
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {t("day")}
                    </label>
                    <select
                      name="preferred_day"
                      value={preferenceForm.preferred_day}
                      onChange={handlePreferenceChange}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900"
                    >
                      {["monday", "tuesday", "wednesday", "thursday", "friday"].map((day) => (
                        <option key={day} value={day}>
                          {t(day)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {t("startTime")}
                    </label>
                    <select
                      name="preferred_hour"
                      value={preferenceForm.preferred_hour}
                      onChange={handlePreferenceChange}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900"
                    >
                      {scheduleHours.map((hour) => (
                        <option key={hour} value={hour}>
                          {formatLessonTimeRange(hour)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {t("teacherPreferenceNote")}
                    </label>
                    <input
                      type="text"
                      name="note"
                      value={preferenceForm.note}
                      onChange={handlePreferenceChange}
                      placeholder={t("teacherPreferenceNotePlaceholder")}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingPreference}
                    className="rounded-xl bg-[#014531] px-4 py-2 text-white transition hover:bg-[#026646] disabled:cursor-not-allowed disabled:opacity-60 max-[420px]:w-full"
                  >
                    {t("teacherPreferenceSubmit")}
                  </button>
                </form>

                <div className="mt-6 space-y-3">
                  {preferenceRequests.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                      {t("teacherPreferencesEmpty")}
                    </div>
                  ) : (
                    preferenceRequests.map((request) => (
                      <div
                        key={request.id}
                        className="rounded-2xl border border-gray-200 bg-[#f8fbf9] p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="break-words text-base font-semibold text-gray-900">
                              {t(request.preferred_day)} • {formatLessonTimeRange(request.preferred_hour)}
                            </p>
                            <p className="mt-1 break-words text-sm text-gray-600">
                              {request.note || t("teacherPreferenceNoNote")}
                            </p>
                            {request.admin_comment ? (
                              <p className="mt-2 break-words text-sm text-amber-700">
                                {t("teacherPreferenceAdminComment")}: {request.admin_comment}
                              </p>
                            ) : null}
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                              request.status === "approved"
                                ? "bg-emerald-100 text-emerald-700"
                                : request.status === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {t(`teacherPreferenceStatus${request.status[0].toUpperCase()}${request.status.slice(1)}`)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { teacherPreferenceAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";
import { useFetch } from "../hooks/useAPI";

const MAX_FILE_SIZE = 1024 * 1024;

const getInitials = (displayName = "") =>
  displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

export default function ProfilePage() {
  const { t } = useTranslation();
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
  const { data: preferenceData, execute: executePreferences } = useFetch(
    teacherPreferenceAPI.getMine,
  );

  useEffect(() => {
    if (user?.role === "teacher") {
      executePreferences().catch(() => {});
    }
  }, [executePreferences, user?.role]);

  const preferenceRequests = Array.isArray(preferenceData) ? preferenceData : [];

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
      await teacherPreferenceAPI.create({
        preferred_day: preferenceForm.preferred_day,
        preferred_hour: Number(preferenceForm.preferred_hour),
        note: preferenceForm.note.trim(),
      });
      setPreferenceForm({
        preferred_day: "monday",
        preferred_hour: "8",
        note: "",
      });
      setPreferenceSuccess(t("teacherPreferenceSubmitted"));
      await executePreferences();
    } catch (error) {
      setPreferenceError(error.message);
    } finally {
      setIsSubmittingPreference(false);
    }
  };

  return (
    <div className="min-h-[70vh]">
      <div className="mx-auto max-w-[1240px] overflow-hidden rounded-[28px] border border-green-100 bg-gradient-to-br from-white via-[#f4fbf7] to-[#eef7f1] shadow-[0_24px_80px_rgba(1,69,49,0.12)] sm:rounded-[32px]">
        <div className="bg-[#014531] px-5 py-8 text-white sm:px-8 sm:py-10 lg:px-10">
          <p className="text-sm uppercase tracking-[0.3em] text-yellow-300">
            {t("profile")}
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            {t("profileWelcome")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-green-50 sm:text-base">
            {t("profileDescription")}
          </p>
        </div>

        <div className="grid gap-6 px-4 py-5 sm:px-8 sm:py-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-10">
          <section className="rounded-[28px] bg-[#0b5d43] p-6 text-white shadow-lg">
            <div className="flex flex-col items-center text-center">
              {user?.avatarData ? (
                <img
                  src={user.avatarData}
                  alt={user.displayName}
                  className="h-36 w-36 rounded-full border-4 border-yellow-300 object-cover shadow-xl"
                />
              ) : (
                <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-yellow-300 bg-white/10 text-4xl font-bold text-yellow-300 shadow-xl">
                  {getInitials(user?.displayName)}
                </div>
              )}

              <h2 className="mt-5 text-2xl font-semibold">{user?.displayName}</h2>
              <p className="mt-1 text-sm text-green-100">{user?.email}</p>
              <span className="mt-4 rounded-full bg-yellow-300 px-4 py-1 text-sm font-semibold text-[#014531]">
                {t(user?.role)}
              </span>
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
                className="mt-3 block w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white file:mr-3 file:rounded-lg file:border-0 file:bg-yellow-300 file:px-3 file:py-2 file:font-semibold file:text-[#014531]"
              />
              <p className="mt-3 text-xs text-green-100">
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

            <div className="rounded-[28px] border border-green-100 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900">
                {t("profileInfo")}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {t("profileReadonly")}
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#f4fbf7] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    {t("fullName")}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-gray-900">
                    {user?.displayName}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#f4fbf7] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    {t("email")}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-gray-900">
                    {user?.email}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#f4fbf7] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    {t("selectRole")}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-gray-900">
                    {t(user?.role)}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#f4fbf7] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    ID
                  </p>
                  <p className="mt-2 text-lg font-semibold text-gray-900">
                    {user?.id}
                  </p>
                </div>
                {user?.department ? (
                  <div className="rounded-2xl bg-[#f4fbf7] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                      {t("facultyInstitute")}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-gray-900">
                      {user.department}
                    </p>
                  </div>
                ) : null}
                {user?.programmeName ? (
                  <div className="rounded-2xl bg-[#f4fbf7] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                      {t("programmeName")}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-gray-900">
                      {user.programmeName}
                    </p>
                  </div>
                ) : null}
                {user?.groupName ? (
                  <div className="rounded-2xl bg-[#f4fbf7] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                      {t("groupNumber")}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-gray-900">
                      {user.groupName}
                    </p>
                  </div>
                ) : null}
                {user?.subgroup ? (
                  <div className="rounded-2xl bg-[#f4fbf7] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                      {t("subgroup")}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-gray-900">
                      {user.subgroup}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[28px] border border-dashed border-green-200 bg-white/80 p-6">
              <p className="text-sm text-gray-600">
                {isLoading ? t("loading") : t("profileNoEditNotice")}
              </p>
            </div>

            {user?.role === "teacher" ? (
              <div className="rounded-[28px] border border-amber-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {t("teacherPreferencesTitle")}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600">
                      {t("teacherPreferencesDescription")}
                    </p>
                  </div>
                  <div className="rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
                    {preferenceRequests.length}
                  </div>
                </div>

                {preferenceError ? (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {preferenceError}
                  </div>
                ) : null}
                {preferenceSuccess ? (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {preferenceSuccess}
                  </div>
                ) : null}

                <form onSubmit={handleSubmitPreference} className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_1.5fr_auto]">
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
                      {Array.from({ length: 10 }, (_, index) => `${index + 8}`).map((hour) => (
                        <option key={hour} value={hour}>
                          {hour}:00
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
                    className="rounded-xl bg-[#014531] px-4 py-2 text-white transition hover:bg-[#026646] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmittingPreference ? t("loading") : t("teacherPreferenceSubmit")}
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
                          <div>
                            <p className="text-base font-semibold text-gray-900">
                              {t(request.preferred_day)} • {request.preferred_hour}:00
                            </p>
                            <p className="mt-1 text-sm text-gray-600">
                              {request.note || t("teacherPreferenceNoNote")}
                            </p>
                            {request.admin_comment ? (
                              <p className="mt-2 text-sm text-amber-700">
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

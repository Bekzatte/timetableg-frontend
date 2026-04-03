import React, { useState, useEffect } from "react";
import { Plus, RotateCw } from "lucide-react";
import TimetableGrid from "../components/timetable/TimetableGrid";
import Modal from "../components/ui/Modal";
import Form from "../components/ui/Form";
import { scheduleAPI } from "../services/api";
import { useFetch } from "../hooks/useAPI";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../hooks/useTranslation";

export const SchedulePage = () => {
  const { t } = useTranslation();
  const { isAdmin, isTeacher } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isPreferenceOpen, setIsPreferenceOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrefLoading, setIsPrefLoading] = useState(false);
  const [preferenceResult, setPreferenceResult] = useState(null);
  const {
    data,
    isLoading: dataLoading,
    execute,
  } = useFetch(scheduleAPI.getAll);

  useEffect(() => {
    if (data) {
      setSchedule(data);
    }
  }, [data]);

  useEffect(() => {
    execute();
  }, []);

  const handleGenerateSchedule = async (formData, setErrors) => {
    try {
      setIsLoading(true);
      const response = await scheduleAPI.generate(formData);
      setSchedule(response.data || []);
      setIsGenerateOpen(false);
    } catch (error) {
      console.error(t("errorGenerateSchedule"), error);
      setErrors((prev) => ({
        ...prev,
        error: error.response?.data?.error || error.message,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceSubmit = async (formData, setErrors) => {
    try {
      setIsPrefLoading(true);
      // Здесь могла бы быть вызвана реальная API: scheduleAPI.submitPreferences
      // Пока работает имитация отправки
      await new Promise((resolve) => setTimeout(resolve, 500));
      setPreferenceResult(formData);
      setIsPreferenceOpen(false);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        error: error.message || t("error"),
      }));
    } finally {
      setIsPrefLoading(false);
    }
  };

  const formFields = [
    {
      name: "semester",
      label: t("semester"),
      type: "number",
      placeholder: "1",
      required: true,
    },
    {
      name: "year",
      label: t("year"),
      type: "number",
      placeholder: "2026",
      required: true,
    },
    {
      name: "algorithm",
      label: t("algorithm"),
      type: "select",
      options: [
        { value: "greedy", label: t("greedyAlgorithm") },
        { value: "genetic", label: t("geneticAlgorithm") },
        { value: "simulated_annealing", label: t("simulatedAnnealing") },
      ],
    },
  ];

  return (
    <div className="w-full px-6 py-6 sm:py-8">
      <div className="flex justify-between items-center mb-6 gap-3 flex-wrap">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("scheduleMgmt")}
        </h1>
        <div className="flex gap-2 flex-wrap">
          {isAdmin && (
            <button
              onClick={() => setIsGenerateOpen(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
            >
              <RotateCw size={20} /> {t("generateNewSchedule")}
            </button>
          )}
          {isTeacher && (
            <button
              onClick={() => setIsPreferenceOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              <Plus size={20} /> {t("submitPreference")}
            </button>
          )}
        </div>
      </div>

      <div className="rounded-lg shadow-md p-6 bg-white">
        {isTeacher && preferenceResult && (
          <div className="mb-4 p-3 border border-blue-200 rounded bg-blue-50 text-blue-900">
            <h3 className="font-semibold">{t("lastSubmittedPreferences")}</h3>
            <pre className="text-xs whitespace-pre-wrap mt-1">
              {JSON.stringify(preferenceResult, null, 2)}
            </pre>
          </div>
        )}

        {schedule.length > 0 ? (
          <TimetableGrid schedule={schedule} />
        ) : (
          <div className="text-center py-12 text-gray-500">
            <RotateCw size={48} className="mx-auto mb-4 opacity-50" />
            <p>{t("scheduleNotCreated")}</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        title={t("generateNewSchedule")}
      >
        <Form
          fields={formFields}
          onSubmit={handleGenerateSchedule}
          submitText={t("generateSchedule")}
          isLoading={isLoading}
        />
      </Modal>

      <Modal
        isOpen={isPreferenceOpen}
        onClose={() => setIsPreferenceOpen(false)}
        title={t("submitPreference")}
      >
        <Form
          fields={[
            {
              name: "preferred_days",
              label: t("preferredDays"),
              type: "textarea",
              placeholder: t("preferredDaysPlaceholder"),
              required: true,
            },
            {
              name: "notes",
              label: t("notes"),
              type: "textarea",
              placeholder: t("preferenceNotesPlaceholder"),
            },
          ]}
          onSubmit={handlePreferenceSubmit}
          submitText={t("submit")}
          isLoading={isPrefLoading}
        />
      </Modal>
    </div>
  );
};

export default SchedulePage;

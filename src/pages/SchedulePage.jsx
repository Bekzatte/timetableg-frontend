import { useEffect, useState } from "react";
import { RotateCw } from "lucide-react";
import TimetableGrid from "../components/timetable/TimetableGrid";
import Modal from "../components/ui/Modal";
import Form from "../components/ui/Form";
import { scheduleAPI } from "../services/api";
import { useFetch } from "../hooks/useAPI";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";

export const SchedulePage = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { data, execute } = useFetch(scheduleAPI.getAll);

  useEffect(() => {
    if (data) {
      setSchedule(data);
    }
  }, [data]);

  useEffect(() => {
    execute();
  }, [execute]);

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

  const formFields = [
    {
      name: "semester",
      label: t("semester"),
      type: "select",
      placeholder: t("semester"),
      options: [
        { value: 1, label: "1" },
        { value: 2, label: "2" },
      ],
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {t("scheduleMgmt")}
        </h1>
        {isAdmin && (
          <button
            onClick={() => setIsGenerateOpen(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
          >
            <RotateCw size={20} /> {t("generateNewSchedule")}
          </button>
        )}
      </div>

      <div className="rounded-lg shadow-md p-6 bg-white">
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
    </div>
  );
};

export default SchedulePage;

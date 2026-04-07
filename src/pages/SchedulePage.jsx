import { useEffect, useState } from "react";
import { Download, RotateCw } from "lucide-react";
import TimetableGrid from "../components/timetable/TimetableGrid";
import Modal from "../components/ui/Modal";
import Form from "../components/ui/Form";
import { adminAPI, scheduleAPI } from "../services/api";
import { useFetch } from "../hooks/useAPI";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";

export const SchedulePage = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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

  const handleResetSchedule = async () => {
    if (!window.confirm(t("confirmResetSchedule"))) {
      return;
    }

    try {
      setIsResetting(true);
      await adminAPI.clearCollection("schedules");
      setSchedule([]);
      await execute();
    } catch (error) {
      console.error(t("errorResetSchedule"), error);
    } finally {
      setIsResetting(false);
    }
  };

  const handleExportSchedule = async () => {
    try {
      setIsExporting(true);
      const blob = await scheduleAPI.exportExcel();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "schedule-export.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error(t("errorExportSchedule"), error);
    } finally {
      setIsExporting(false);
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
    <div className="w-full px-0 py-2 sm:py-4">
      <div className="flex justify-between items-center mb-6 gap-3 flex-wrap">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {t("scheduleMgmt")}
        </h1>
        {isAdmin && (
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            {schedule.length > 0 ? (
              <button
                onClick={handleExportSchedule}
                disabled={isExporting}
                className="flex items-center justify-center gap-2 rounded-md bg-[#014531] px-4 py-2 text-white transition hover:bg-[#02704e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download size={20} /> {isExporting ? t("loading") : t("exportSchedule")}
              </button>
            ) : null}
            <button
              onClick={handleResetSchedule}
              disabled={isResetting}
              className="rounded-md bg-red-600 px-4 py-2 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isResetting ? t("loading") : t("resetSchedule")}
            </button>
            <button
              onClick={() => setIsGenerateOpen(true)}
              className="flex items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
            >
              <RotateCw size={20} /> {t("generateNewSchedule")}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-white p-4 shadow-md sm:p-6">
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
        size="lg"
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

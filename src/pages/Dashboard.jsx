import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Users, Home, Zap } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";
import {
  adminAPI,
  courseAPI,
  importAPI,
  roomAPI,
  scheduleAPI,
  sectionAPI,
  teacherAPI,
} from "../services/api";
import { useFetch } from "../hooks/useAPI";

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });

export const Dashboard = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState(null);
  const { data: coursesData, execute: executeCourses } = useFetch(courseAPI.getAll);
  const { data: teachersData, execute: executeTeachers } = useFetch(teacherAPI.getAll);
  const { data: roomsData, execute: executeRooms } = useFetch(roomAPI.getAll);
  const { data: sectionsData, execute: executeSections } = useFetch(sectionAPI.getAll);
  const { data: schedulesData, execute: executeSchedules } = useFetch(scheduleAPI.getAll);
  const actionButtonClass =
    "inline-flex h-[46px] w-full items-center justify-center rounded-md px-4 text-sm text-center font-medium transition disabled:cursor-not-allowed disabled:opacity-60";
  const outlineActionButtonClass = `${actionButtonClass} border border-[#014531] text-[#014531] hover:bg-[#f4fbf7]`;
  const solidActionButtonClass = `${actionButtonClass} bg-[#014531] text-white hover:bg-[#02704e]`;
  const dangerActionButtonClass = `${actionButtonClass} bg-red-600 text-white hover:bg-red-700`;
  const courses = Array.isArray(coursesData) ? coursesData : [];
  const teachers = Array.isArray(teachersData) ? teachersData : [];
  const rooms = Array.isArray(roomsData) ? roomsData : [];
  const sections = Array.isArray(sectionsData) ? sectionsData : [];
  const schedules = Array.isArray(schedulesData) ? schedulesData : [];

  useEffect(() => {
    executeCourses();
    executeTeachers();
    executeRooms();
    executeSections();
    executeSchedules();
  }, [
    executeCourses,
    executeTeachers,
    executeRooms,
    executeSections,
    executeSchedules,
  ]);

  const features = [
    {
      title: t("courseMgmt"),
      description: t("addCourse"),
      icon: BookOpen,
      link: "/courses",
      count: courses.length,
      bgClass: "from-blue-100 to-blue-50",
      iconBgClass: "bg-blue-100",
      textClass: "text-blue-700",
      color: "blue",
    },
    {
      title: t("teacherMgmt"),
      description: t("addTeacher"),
      icon: Users,
      link: "/teachers",
      count: teachers.length,
      bgClass: "from-green-100 to-green-50",
      iconBgClass: "bg-green-100",
      textClass: "text-green-700",
      color: "green",
    },
    {
      title: t("roomMgmt"),
      description: t("addRoom"),
      icon: Home,
      link: "/rooms",
      count: rooms.length,
      bgClass: "from-purple-100 to-purple-50",
      iconBgClass: "bg-purple-100",
      textClass: "text-purple-700",
      color: "purple",
    },
    {
      title: t("sections"),
      description: t("addSection"),
      icon: BookOpen,
      link: "/sections",
      count: sections.length,
      bgClass: "from-amber-100 to-amber-50",
      iconBgClass: "bg-amber-100",
      textClass: "text-amber-700",
      color: "amber",
    },
    {
      title: t("scheduleMgmt"),
      description: isAdmin ? t("generateSchedule") : t("viewSchedule"),
      icon: Zap,
      link: "/schedule",
      bgClass: "from-orange-100 to-orange-50",
      iconBgClass: "bg-orange-100",
      textClass: "text-orange-700",
      color: "orange",
    },
  ];

  const handleImport = async () => {
    if (!importFile) {
      setImportError(t("importSelectFileError"));
      return;
    }

    if (!importFile.name.toLowerCase().endsWith(".xlsx")) {
      setImportError(t("importFileTypeError"));
      return;
    }

    setIsImporting(true);
    setImportError("");
    setImportResult(null);

    try {
      const fileContent = await readFileAsDataUrl(importFile);
      const result = await importAPI.importExcel(importFile.name, fileContent);
      await Promise.all([
        executeCourses(),
        executeTeachers(),
        executeRooms(),
        executeSections(),
        executeSchedules(),
      ]);
      setImportResult(result);
      setImportFile(null);
    } catch (error) {
      setImportError(error.message || t("errorUnknown"));
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    setImportError("");

    try {
      const blob = await importAPI.downloadTemplate();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "timetable-import-template.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      setImportError(error.message || t("errorUnknown"));
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleClearAllData = async () => {
    if (!window.confirm(t("confirmClearAllData"))) {
      return;
    }

    setIsClearingAll(true);
    setImportError("");
    setImportResult(null);

    try {
      await adminAPI.clearAllData();
      await Promise.all([
        executeCourses(),
        executeTeachers(),
        executeRooms(),
        executeSections(),
        executeSchedules(),
      ]);
      setImportResult({
        totals: { inserted: 0, updated: 0 },
        summary: {
          courses: { inserted: 0, updated: 0 },
          teachers: { inserted: 0, updated: 0 },
          rooms: { inserted: 0, updated: 0 },
        },
        cleared: true,
      });
    } catch (error) {
      setImportError(error.message || t("errorUnknown"));
    } finally {
      setIsClearingAll(false);
    }
  };

  return (
    <div className="w-full from-blue-50 to-indigo-100">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-900">
          {t("dashboard")}
        </h1>
        <p className="text-gray-600 text-sm sm:text-base mb-8">
          {t("welcome")} • {t("subtitle")}
        </p>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 sm:gap-6 mb-8">
          {features.map((feature) => {
            const IconComponent = feature.icon;

            return (
              <Link
                key={feature.link}
                to={feature.link}
                className="no-underline h-full"
              >
                <div
                  className={`${feature.bgClass} relative rounded-lg shadow-lg hover:shadow-2xl transition-all duration-1000 transform hover:-translate-y-1 p-4 sm:p-6 text-left sm:text-center cursor-pointer border border-white h-full flex flex-row sm:flex-col items-start sm:items-center justify-start sm:justify-center gap-4 sm:gap-0 min-h-[132px] sm:min-h-60`}
                >
                  {typeof feature.count === "number" ? (
                    <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-900 shadow-sm sm:right-4 sm:top-4">
                      {feature.count}
                    </div>
                  ) : null}
                  <div
                    className={`${feature.iconBgClass} shrink-0 w-12 sm:w-14 h-12 sm:h-14 rounded-full flex items-center justify-center sm:mb-4 sm:mx-auto`}
                  >
                    <IconComponent
                      className={`${feature.textClass} w-6 sm:w-7 h-6 sm:h-7`}
                    />
                  </div>
                  <div className="min-w-0 flex-1 w-full">
                    <h2 className="text-base sm:text-lg font-semibold mb-2 text-gray-900 break-words leading-tight w-full">
                      {feature.title}
                    </h2>
                    <p className="text-gray-700 text-xs sm:text-sm break-words leading-relaxed w-full">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-8 border">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">
            {t("dashboard")}
          </h2>
          <p className="text-gray-700 mb-4">{t("subtitle")}</p>
          <ul className="list-disc list-inside space-y-2 ml-2 text-gray-700">
            <li className="text-sm sm:text-base">{t("courseMgmt")}</li>
            <li className="text-sm sm:text-base">{t("teacherMgmt")}</li>
            <li className="text-sm sm:text-base">{t("roomMgmt")}</li>
            <li className="text-sm sm:text-base">{t("scheduleMgmt")}</li>
          </ul>
        </div>

        {isAdmin ? (
          <div className="mt-8 rounded-lg border bg-white p-4 shadow-md sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {t("excelImportTitle")}
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  {t("excelImportDescription")}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-[#f4fbf7] p-4 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">
                {t("excelImportSheetFormat")}
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>{t("excelImportCoursesColumns")}</li>
                <li>{t("excelImportTeachersColumns")}</li>
                <li>{t("excelImportRoomsColumns")}</li>
              </ul>
            </div>

            <div className="mt-6 space-y-3">
              <input
                type="file"
                accept=".xlsx"
                onChange={(event) => setImportFile(event.target.files?.[0] || null)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-[#014531] file:px-3 file:py-2 file:font-medium file:text-white"
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={isDownloadingTemplate}
                  className={
                    isDownloadingTemplate
                      ? solidActionButtonClass
                      : outlineActionButtonClass
                  }
                >
                  {isDownloadingTemplate ? t("loading") : t("excelTemplateButton")}
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={isImporting}
                  className={solidActionButtonClass}
                >
                  {isImporting ? t("loading") : t("excelImportButton")}
                </button>
                <button
                  type="button"
                  onClick={handleClearAllData}
                  disabled={isClearingAll}
                  className={dangerActionButtonClass}
                >
                  {isClearingAll ? t("loading") : t("clearAllData")}
                </button>
              </div>
            </div>

            {importFile ? (
              <p className="mt-3 text-sm text-gray-600">
                {t("excelImportSelectedFile")}: <span className="font-medium">{importFile.name}</span>
              </p>
            ) : null}

            {importError ? (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {importError}
              </div>
            ) : null}

            {importResult ? (
              importResult.cleared ? (
                <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                  <p className="font-semibold">{t("clearAllDataSuccess")}</p>
                </div>
              ) : (
                <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                  <p className="font-semibold">{t("excelImportSuccess")}</p>
                  <p className="mt-1">
                    {t("excelImportTotals")} {importResult.totals.inserted} / {importResult.totals.updated}
                  </p>
                  <ul className="mt-3 list-disc space-y-1 pl-5">
                    <li>
                      Courses: +{importResult.summary.courses.inserted}, ~{importResult.summary.courses.updated}
                    </li>
                    <li>
                      Teachers: +{importResult.summary.teachers.inserted}, ~{importResult.summary.teachers.updated}
                    </li>
                    <li>
                      Rooms: +{importResult.summary.rooms.inserted}, ~{importResult.summary.rooms.updated}
                    </li>
                  </ul>
                </div>
              )
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Dashboard;

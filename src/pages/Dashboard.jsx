import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, FileSpreadsheet, FileText, Users, Home, Zap, UsersRound } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useAutoDismiss } from "../hooks/useAutoDismiss";
import { useTranslation } from "../hooks/useTranslation";
import {
  adminAPI,
  courseAPI,
  importAPI,
  groupAPI,
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
    reader.onerror = () => reject(new Error("file_read_error"));
    reader.readAsDataURL(file);
  });

export const Dashboard = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const ropFileInputRef = useRef(null);
  const iupFileInputRef = useRef(null);
  const [isRopImporting, setIsRopImporting] = useState(false);
  const [isIupImporting, setIsIupImporting] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState(null);
  useAutoDismiss(importError, setImportError);
  useAutoDismiss(importResult, setImportResult, 5000, null);
  const { data: coursesData, execute: executeCourses } = useFetch(courseAPI.getAll);
  const { data: teachersData, execute: executeTeachers } = useFetch(teacherAPI.getAll);
  const { data: roomsData, execute: executeRooms } = useFetch(roomAPI.getAll);
  const { data: groupsData, execute: executeGroups } = useFetch(groupAPI.getAll);
  const { data: sectionsData, execute: executeSections } = useFetch(sectionAPI.getAll);
  const { execute: executeSchedules } = useFetch(scheduleAPI.getAll);
  const actionButtonClass =
    "inline-flex h-[46px] w-full items-center justify-center rounded-md px-4 text-sm text-center font-medium transition disabled:cursor-not-allowed disabled:opacity-60";
  const solidActionButtonClass = `${actionButtonClass} bg-[#014531] text-white hover:bg-[#02704e]`;
  const dangerActionButtonClass = `${actionButtonClass} bg-red-600 text-white hover:bg-red-700`;
  const courses = Array.isArray(coursesData) ? coursesData : [];
  const teachers = Array.isArray(teachersData) ? teachersData : [];
  const rooms = Array.isArray(roomsData) ? roomsData : [];
  const groups = Array.isArray(groupsData) ? groupsData : [];
  const sections = Array.isArray(sectionsData) ? sectionsData : [];
  const totalManagedRecords =
    courses.length + teachers.length + rooms.length + groups.length + sections.length;

  useEffect(() => {
    executeCourses();
    executeTeachers();
    executeRooms();
    executeGroups();
    executeSections();
    executeSchedules();
  }, [
    executeCourses,
    executeTeachers,
    executeRooms,
    executeGroups,
    executeSections,
    executeSchedules,
  ]);

  const features = [
    {
      title: t("courseMgmt"),
      description: t("addCourse"),
      icon: BookOpen,
      link: "/disciplines",
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
      title: t("groups"),
      description: t("addGroup"),
      icon: UsersRound,
      link: "/groups",
      count: groups.length,
      bgClass: "from-cyan-100 to-cyan-50",
      iconBgClass: "bg-cyan-100",
      textClass: "text-cyan-700",
      color: "cyan",
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

  const refreshManagedData = async () => {
    await Promise.all([
      executeCourses(),
      executeTeachers(),
      executeRooms(),
      executeGroups(),
      executeSections(),
      executeSchedules(),
    ]);
  };

  const handleRopFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (!/\.(xls|xlsx)$/i.test(file.name)) {
      setImportError(t("ropImportFileTypeError"));
      return;
    }

    setIsRopImporting(true);
    setImportError("");
    setImportResult(null);

    try {
      const fileContent = await readFileAsDataUrl(file);
      const result = await importAPI.importRop(file.name, fileContent);
      await refreshManagedData();
      setImportResult({
        title: t("ropImportSuccess"),
        details: `${result?.totals?.courses || 0} ${t("courses").toLowerCase()}`,
      });
    } catch (error) {
      setImportError(error.message === "file_read_error" ? t("errorFileRead") : error.message || t("errorUnknown"));
    } finally {
      setIsRopImporting(false);
    }
  };

  const handleIupFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (!/\.(pdf|xls|xlsx)$/i.test(file.name)) {
      setImportError(t("iupImportFileTypeError"));
      return;
    }

    setIsIupImporting(true);
    setImportError("");
    setImportResult(null);

    try {
      const fileContent = await readFileAsDataUrl(file);
      const result = await importAPI.importIup(file.name, fileContent);
      await refreshManagedData();
      setImportResult({
        title: t("iupImportSuccess"),
        details: `${result?.totals?.lessonEntries || 0} ${t("lessonEntries").toLowerCase()}`,
      });
    } catch (error) {
      setImportError(error.message === "file_read_error" ? t("errorFileRead") : error.message || t("errorUnknown"));
    } finally {
      setIsIupImporting(false);
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
      await refreshManagedData();
      setImportResult({
        title: t("clearAllDataSuccess"),
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
      <div className="mx-auto w-full max-w-[1440px] px-0 py-2 sm:py-4">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-900">
          {t("dashboard")}
        </h1>
        <p className="text-gray-600 text-sm sm:text-base mb-8">
          {t("welcome")} • {t("subtitle")}
        </p>

        {/* Feature Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          {features.map((feature) => {
            const IconComponent = feature.icon;

            return (
              <Link
                key={feature.link}
                to={feature.link}
                className="no-underline h-full"
              >
                <div
                  className={`${feature.bgClass} relative flex h-full min-h-[132px] cursor-pointer flex-row items-start justify-start gap-4 rounded-lg border border-white p-4 text-left shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl sm:min-h-[220px] sm:flex-col sm:items-center sm:justify-center sm:gap-0 sm:p-6 sm:text-center`}
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

        {isAdmin ? (
          <div className="mt-8 rounded-lg border bg-white p-4 shadow-md sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {t("academicImportTitle")}
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  {t("academicImportDescription")}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <input
                ref={ropFileInputRef}
                type="file"
                accept=".xls,.xlsx"
                onChange={handleRopFileChange}
                className="hidden"
              />
              <input
                ref={iupFileInputRef}
                type="file"
                accept=".pdf,.xls,.xlsx"
                onChange={handleIupFileChange}
                className="hidden"
              />

              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                    <FileSpreadsheet size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{t("ropImportButton")}</h3>
                    <p className="text-sm text-gray-600">{t("ropImportFormats")}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => ropFileInputRef.current?.click()}
                  disabled={isRopImporting}
                  className={solidActionButtonClass}
                >
                  {isRopImporting ? t("loading") : t("ropImportButton")}
                </button>
                 <p className="mt-4 text-sm text-gray-700">{t("ropImportGuide")}</p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-200 text-slate-700">
                    <FileText size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{t("iupImportButton")}</h3>
                    <p className="text-sm text-gray-600">{t("iupImportFormats")}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => iupFileInputRef.current?.click()}
                  disabled={isIupImporting}
                  className={solidActionButtonClass}
                >
                  {isIupImporting ? t("loading") : t("iupImportButton")}
                </button>
                <p className="mt-4 text-sm text-gray-700">{t("iupImportGuide")}</p>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-[#f4fbf7] p-4 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">{t("importReferenceTitle")}</p>
              <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
                <div>
                  <p className="font-medium text-gray-900">{t("importReferenceRopTitle")}</p>
                  <p className="mt-1">{t("importReferenceRopText")}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{t("importReferenceIupTitle")}</p>
                  <p className="mt-1">{t("importReferenceIupText")}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{t("importReferenceFlowTitle")}</p>
                  <p className="mt-1">{t("importReferenceFlowText")}</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleClearAllData}
                disabled={isClearingAll || totalManagedRecords === 0}
                className={dangerActionButtonClass}
              >
                {isClearingAll ? t("loading") : t("clearAllData")}
              </button>
            </div>

            {importError ? (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {importError}
              </div>
            ) : null}

            {importResult ? (
              <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                <p className="font-semibold">{importResult.title}</p>
                {importResult.details ? <p className="mt-1">{importResult.details}</p> : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Dashboard;

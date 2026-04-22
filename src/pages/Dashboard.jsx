import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, FileSpreadsheet, FileText, Users, Home, Zap, UsersRound } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useAutoDismiss } from "../hooks/useAutoDismiss";
import { useTranslation } from "../hooks/useTranslation";
import Modal from "../components/ui/Modal";
import {
  adminAPI,
  courseAPI,
  courseComponentAPI,
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
  const [isRopPreviewLoading, setIsRopPreviewLoading] = useState(false);
  const [isIupPreviewLoading, setIsIupPreviewLoading] = useState(false);
  const [isRopModalOpen, setIsRopModalOpen] = useState(false);
  const [isIupModalOpen, setIsIupModalOpen] = useState(false);
  const [ropPreview, setRopPreview] = useState(null);
  const [iupPreview, setIupPreview] = useState(null);
  const [ropFile, setRopFile] = useState(null);
  const [iupFile, setIupFile] = useState(null);
  const [ropFileContent, setRopFileContent] = useState("");
  const [iupFileContent, setIupFileContent] = useState("");
  const [createMissingIupCourses, setCreateMissingIupCourses] = useState(false);
  const [ropError, setRopError] = useState("");
  const [iupError, setIupError] = useState("");
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState(null);
  useAutoDismiss(importError, setImportError);
  useAutoDismiss(importResult, setImportResult, 30000, null);
  const { data: coursesData, execute: executeCourses } = useFetch(courseAPI.getAll);
  const { data: courseComponentsData, execute: executeCourseComponents } =
    useFetch(courseComponentAPI.getAll);
  const { data: teachersData, execute: executeTeachers } = useFetch(teacherAPI.getAll);
  const { data: roomsData, execute: executeRooms } = useFetch(roomAPI.getAll);
  const { data: groupsData, execute: executeGroups } = useFetch(groupAPI.getAll);
  const { data: sectionsData, execute: executeSections } = useFetch(sectionAPI.getAll);
  const { execute: executeSchedules } = useFetch(scheduleAPI.getAll);
  const actionButtonClass =
    "inline-flex h-[46px] w-full items-center justify-center rounded-md px-4 text-sm text-center font-medium transition disabled:cursor-not-allowed disabled:opacity-60";
  const solidActionButtonClass = `${actionButtonClass} bg-[#014531] text-white hover:bg-[#02704e]`;
  const slateActionButtonClass = `${actionButtonClass} bg-slate-600 text-white hover:bg-slate-700`;
  const dangerActionButtonClass = `${actionButtonClass} bg-red-600 text-white hover:bg-red-700`;
  const courses = Array.isArray(coursesData) ? coursesData : [];
  const courseComponents = Array.isArray(courseComponentsData) ? courseComponentsData : [];
  const teachers = Array.isArray(teachersData) ? teachersData : [];
  const rooms = Array.isArray(roomsData) ? roomsData : [];
  const groups = Array.isArray(groupsData) ? groupsData : [];
  const sections = Array.isArray(sectionsData) ? sectionsData : [];
  const totalManagedRecords =
    courses.length +
    courseComponents.length +
    teachers.length +
    rooms.length +
    groups.length +
    sections.length;

  useEffect(() => {
    executeCourses();
    executeCourseComponents();
    executeTeachers();
    executeRooms();
    executeGroups();
    executeSections();
    executeSchedules();
  }, [
    executeCourses,
    executeCourseComponents,
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
      executeCourseComponents(),
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

    setImportError("");
    setImportResult(null);
    setRopError("");
    setRopPreview(null);
    setRopFile(file);
    setIsRopModalOpen(true);
    setIsRopPreviewLoading(true);

    try {
      const fileContent = await readFileAsDataUrl(file);
      setRopFileContent(fileContent);
      const preview = await importAPI.previewRop(file.name, fileContent);
      setRopPreview(preview);
    } catch (error) {
      setRopError(error.message === "file_read_error" ? t("errorFileRead") : error.message || t("errorUnknown"));
    } finally {
      setIsRopPreviewLoading(false);
    }
  };

  const handleImportRop = async () => {
    if (!ropFile || !ropFileContent) {
      setRopError(t("ropImportSelectFileError"));
      return;
    }

    setIsRopImporting(true);
    setRopError("");
    setImportError("");
    setImportResult(null);

    try {
      const result = await importAPI.importRop(ropFile.name, ropFileContent);
      await refreshManagedData();
      setIsRopModalOpen(false);
      setRopPreview(null);
      setRopFile(null);
      setRopFileContent("");
      setImportResult({
        title: t("ropImportSuccess"),
        details: `${t("importCoursesAdded")}: ${result?.totals?.inserted || 0}. ${t("importCoursesAlreadyExist")}: ${result?.totals?.updated || 0}.`,
        courseLists: {
          inserted: result?.courseLists?.inserted || [],
          existing: result?.courseLists?.existing || [],
        },
      });
    } catch (error) {
      setRopError(error.message || t("errorUnknown"));
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

    setImportError("");
    setImportResult(null);
    setIupError("");
    setIupPreview(null);
    setIupFile(file);
    setIsIupModalOpen(true);
    setIsIupPreviewLoading(true);

    try {
      const fileContent = await readFileAsDataUrl(file);
      setIupFileContent(fileContent);
      const preview = await importAPI.previewIup(file.name, fileContent);
      setIupPreview(preview);
      setCreateMissingIupCourses(false);
    } catch (error) {
      setIupError(error.message === "file_read_error" ? t("errorFileRead") : error.message || t("errorUnknown"));
    } finally {
      setIsIupPreviewLoading(false);
    }
  };

  const handleImportIup = async () => {
    if (!iupFile || !iupFileContent) {
      setIupError(t("iupImportSelectFileError"));
      return;
    }

    setIsIupImporting(true);
    setIupError("");
    setImportError("");
    setImportResult(null);

    try {
      const result = await importAPI.importIup(iupFile.name, iupFileContent, {
        createMissingCourses: createMissingIupCourses,
      });
      await refreshManagedData();
      setIsIupModalOpen(false);
      setIupPreview(null);
      setIupFile(null);
      setIupFileContent("");
      setCreateMissingIupCourses(false);
      setImportResult({
        title: t("iupImportSuccess"),
        details: `${result?.totals?.lessonEntries || 0} ${t("iupEntriesSaved")}`,
        type: "iup",
        courseLists: {
          inserted: result?.stats?.courseLists?.inserted || [],
          existing: result?.stats?.courseLists?.existing || [],
          missing: result?.stats?.courseLists?.missing || [],
        },
      });
    } catch (error) {
      setIupError(error.message || t("errorUnknown"));
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

  const formatCourseItem = (course) => {
    const code = course.code ? `${course.code} - ` : "";
    const semester = course.semester ? ` (${t("semester")}: ${course.semester})` : "";
    return `${code}${course.name || "-"}${semester}`;
  };

  const renderCourseList = (title, items) => {
    if (!items?.length) {
      return null;
    }

    return (
      <div className="mt-3">
        <p className="font-medium text-emerald-900">
          {title}: {items.length}
        </p>
        <ul className="mt-2 max-h-40 list-disc space-y-1 overflow-auto pl-5 text-emerald-800">
          {items.map((course, index) => (
            <li key={`${course.code}-${course.name}-${course.semester}-${index}`}>
              {formatCourseItem(course)}
            </li>
          ))}
        </ul>
      </div>
    );
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
                  disabled={isRopPreviewLoading || isRopImporting}
                  className={solidActionButtonClass}
                >
                  {isRopPreviewLoading || isRopImporting ? t("loading") : t("ropImportButton")}
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
                  disabled={isIupPreviewLoading || isIupImporting}
                  className={slateActionButtonClass}
                >
                  {isIupPreviewLoading || isIupImporting ? t("loading") : t("iupImportButton")}
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
                {renderCourseList(t("importCoursesAdded"), importResult.courseLists?.inserted)}
                {renderCourseList(
                  importResult.type === "iup" ? t("iupCoursesMatched") : t("importCoursesAlreadyExist"),
                  importResult.courseLists?.existing,
                )}
                {renderCourseList(
                  importResult.type === "iup" ? t("iupCoursesMissing") : t("importCoursesMissing"),
                  importResult.courseLists?.missing,
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        <Modal
          isOpen={isRopModalOpen}
          onClose={() => {
            if (!isRopImporting) {
              setIsRopModalOpen(false);
            }
          }}
          title={t("ropImportTitle")}
          size="lg"
        >
          <div className="space-y-4">
            {ropFile ? (
              <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                <span className="font-semibold">{t("selectedFile")}:</span>{" "}
                {ropFile.name}
              </div>
            ) : null}

            {isRopPreviewLoading ? (
              <div className="py-8 text-center text-gray-500">{t("loading")}</div>
            ) : null}

            {ropError ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {ropError}
              </div>
            ) : null}

            {ropPreview ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-md border border-gray-200 p-3">
                    <p className="text-xs font-medium uppercase text-gray-500">
                      {t("programmeName")}
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {ropPreview.metadata?.programme || "-"}
                    </p>
                  </div>
                  <div className="rounded-md border border-gray-200 p-3">
                    <p className="text-xs font-medium uppercase text-gray-500">
                      {t("studyCourse")}
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {ropPreview.metadata?.studyYear || "-"}
                    </p>
                  </div>
                  <div className="rounded-md border border-gray-200 p-3">
                    <p className="text-xs font-medium uppercase text-gray-500">
                      {t("semester")}
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {ropPreview.metadata?.academicPeriods?.join(", ") || "-"}
                    </p>
                  </div>
                  <div className="rounded-md border border-gray-200 p-3">
                    <p className="text-xs font-medium uppercase text-gray-500">
                      {t("courses")}
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {ropPreview.totals?.courses || 0}
                    </p>
                  </div>
                </div>

                <div className="max-h-56 overflow-auto rounded-md border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          {t("courseCode")}
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          {t("courseName")}
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          {t("credits")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {(ropPreview.courses || []).slice(0, 8).map((course) => (
                        <tr key={`${course.code}-${course.name}`}>
                          <td className="px-3 py-2 text-gray-700">{course.code}</td>
                          <td className="px-3 py-2 text-gray-900">{course.name}</td>
                          <td className="px-3 py-2 text-gray-700">{course.credits || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsRopModalOpen(false)}
                    disabled={isRopImporting}
                    className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={handleImportRop}
                    disabled={isRopImporting}
                    className="rounded-md bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {isRopImporting ? t("loading") : t("ropImportConfirm")}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </Modal>

        <Modal
          isOpen={isIupModalOpen}
          onClose={() => {
            if (!isIupImporting) {
              setIsIupModalOpen(false);
            }
          }}
          title={t("iupImportTitle")}
          size="lg"
        >
          <div className="space-y-4">
            {iupFile ? (
              <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                <span className="font-semibold">{t("selectedFile")}:</span>{" "}
                {iupFile.name}
              </div>
            ) : null}

            {isIupPreviewLoading ? (
              <div className="py-8 text-center text-gray-500">{t("loading")}</div>
            ) : null}

            {iupError ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {iupError}
              </div>
            ) : null}

            {iupPreview ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-md border border-gray-200 p-3">
                    <p className="text-xs font-medium uppercase text-gray-500">
                      {t("groupNumber")}
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {iupPreview.metadata?.groupName || "-"}
                    </p>
                  </div>
                  <div className="rounded-md border border-gray-200 p-3">
                    <p className="text-xs font-medium uppercase text-gray-500">
                      {t("programmeName")}
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {iupPreview.metadata?.programme || "-"}
                    </p>
                  </div>
                  <div className="rounded-md border border-gray-200 p-3">
                    <p className="text-xs font-medium uppercase text-gray-500">
                      {t("instructorsFound")}
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {iupPreview.totals?.teachers || 0}
                    </p>
                  </div>
                  <div className="rounded-md border border-gray-200 p-3">
                    <p className="text-xs font-medium uppercase text-gray-500">
                      {t("lessonEntries")}
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {iupPreview.totals?.lessonEntries || iupPreview.entries?.length || 0}
                    </p>
                  </div>
                </div>

                <div className="max-h-56 overflow-auto rounded-md border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          {t("courseCode")}
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          {t("courseName")}
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          {t("instructor")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {(iupPreview.entries || [])
                        .filter((entry) => entry.lessonType !== "srop")
                        .slice(0, 10)
                        .map((entry, index) => (
                          <tr key={`${entry.courseCode}-${entry.lessonType}-${index}`}>
                            <td className="px-3 py-2 text-gray-700">{entry.courseCode}</td>
                            <td className="px-3 py-2 text-gray-900">{entry.courseName}</td>
                            <td className="px-3 py-2 text-gray-700">{entry.teacherName || "-"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {iupPreview.courseLists?.missing?.length ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <p className="font-semibold">{t("iupMissingCoursesWarning")}</p>
                    <ul className="mt-2 max-h-28 list-disc overflow-auto pl-5">
                      {iupPreview.courseLists.missing.slice(0, 8).map((course, index) => (
                        <li key={`${course.code}-${course.semester}-${index}`}>
                          {course.code} - {course.name} ({t("semester")}: {course.semester || "-"})
                        </li>
                      ))}
                    </ul>
                    <label className="mt-3 flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={createMissingIupCourses}
                        onChange={(event) => setCreateMissingIupCourses(event.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-700 focus:ring-amber-600"
                      />
                      <span>{t("iupCreateMissingCourses")}</span>
                    </label>
                  </div>
                ) : null}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsIupModalOpen(false)}
                    disabled={isIupImporting}
                    className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={handleImportIup}
                    disabled={isIupImporting}
                    className="rounded-md bg-slate-700 px-4 py-2 text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {isIupImporting ? t("loading") : t("iupImportConfirm")}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Dashboard;

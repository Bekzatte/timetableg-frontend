import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Users, Home, Zap } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../hooks/useTranslation";

export const Dashboard = () => {
  const { t } = useTranslation();
  const { isAdmin, isTeacher, isStudent } = useAuth();

  const features = [
    {
      title: t("courseMgmt"),
      description: t("addCourse"),
      icon: BookOpen,
      link: "/courses",
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
      bgClass: "from-purple-100 to-purple-50",
      iconBgClass: "bg-purple-100",
      textClass: "text-purple-700",
      color: "purple",
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {features.map((feature) => {
            const IconComponent = feature.icon;

            return (
              <Link
                key={feature.link}
                to={feature.link}
                className="no-underline h-full"
              >
                <div
                  className={`${feature.bgClass} rounded-lg shadow-lg hover:shadow-2xl transition-all duration-1000 transform hover:-translate-y-1 p-4 sm:p-6 text-left sm:text-center cursor-pointer border border-white h-full flex flex-col items-start sm:items-center justify-start sm:justify-center min-h-[180px] sm:min-h-60`}
                >
                  <div
                    className={`${feature.iconBgClass} w-12 sm:w-14 h-12 sm:h-14 rounded-full flex items-center justify-center mb-4 sm:mx-auto`}
                  >
                    <IconComponent
                      className={`${feature.textClass} w-6 sm:w-7 h-6 sm:h-7`}
                    />
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold mb-2 text-gray-900 break-words w-full">
                    {feature.title}
                  </h2>
                  <p className="text-gray-700 text-xs sm:text-sm break-words w-full">
                    {feature.description}
                  </p>
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
      </div>
    </div>
  );
};

export default Dashboard;

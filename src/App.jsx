import { useEffect, useRef, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import { Menu, X } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import CoursesPage from "./pages/CoursesPage";
import TeachersPage from "./pages/TeachersPage";
import RoomsPage from "./pages/RoomsPage";
import SectionsPage from "./pages/SectionsPage";
import SchedulePage from "./pages/SchedulePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import { useLanguage } from "./hooks/useLanguage";
import { useTranslation } from "./hooks/useTranslation";
import { ROLES } from "./constants/roles";
import { useAuth } from "./hooks/useAuth";
import "./index.css";

const getInitials = (displayName = "") =>
  displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

const RequireAuth = ({ children, allowedRoles = [] }) => {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="py-20 text-center text-red-600">
        <p className="text-xl font-semibold mb-2">{t("accessDenied")}</p>
        <p>{t("accessDeniedDescription")}</p>
      </div>
    );
  }

  return children;
};

const RoleHome = () => {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/schedule" replace />;
  }

  return <Dashboard />;
};

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const desktopProfileMenuRef = useRef(null);
  const mobileProfileMenuRef = useRef(null);
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const { user, isAdmin, logout } = useAuth();
  const homePath = user && !isAdmin ? "/schedule" : "/";
  const navItems = isAdmin
    ? [
        { label: t("home"), path: "/" },
        { label: t("courses"), path: "/courses" },
        { label: t("teachers"), path: "/teachers" },
        { label: t("rooms"), path: "/rooms" },
        { label: t("sections"), path: "/sections" },
        { label: t("schedule"), path: "/schedule" },
      ]
    : user
      ? [{ label: t("schedule"), path: "/schedule" }]
      : [];

  const languages = [
    { code: "kk", name: "ҚАЗ" },
    { code: "ru", name: "РУС" },
    { code: "en", name: "ENG" },
  ];
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        desktopProfileMenuRef.current &&
        desktopProfileMenuRef.current.contains(event.target)
      ) {
        return;
      }

      if (
        mobileProfileMenuRef.current &&
        mobileProfileMenuRef.current.contains(event.target)
      ) {
        return;
      }

      setProfileMenuOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-white">
        {/* Header */}
        <header className="bg-[#014531] shadow-xl border-b border-green-900">
          <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
            {/* Logo */}
            <Link
              to={homePath}
              className="hidden lg:flex items-center gap-2 text-2xl font-bold text-white hover:opacity-80 transition"
            >
              <img
                src="https://kazatu.edu.kz/img/logo_official.svg"
                alt="KazATU Logo"
                className="h-8 sm:h-10 w-auto"
              />
              <span>{t("title")}</span>
            </Link>

            <div className="flex min-w-0 items-center lg:hidden">
              {user ? (
                <div
                  ref={mobileProfileMenuRef}
                  className="relative flex items-center"
                >
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((prev) => !prev)}
                    className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-yellow-300 bg-white/10 transition"
                    aria-label={t("profile")}
                  >
                    {user.avatarData ? (
                      <img
                        src={user.avatarData}
                        alt={user.displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-yellow-300">
                        {getInitials(user.displayName)}
                      </span>
                    )}
                  </button>

                  {profileMenuOpen ? (
                    <div className="absolute left-0 top-[calc(100%+10px)] z-50 min-w-44 overflow-hidden rounded-2xl border border-green-900/20 bg-white shadow-2xl">
                      <Link
                        to="/profile"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setMenuOpen(false);
                        }}
                        className="block px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-[#f4fbf7]"
                      >
                        {t("profile")}
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setProfileMenuOpen(false);
                          setMenuOpen(false);
                        }}
                        className="block w-full px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        {t("logout")}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="w-10" />
              )}
            </div>

            {/* Desktop menu */}
            <div className="hidden lg:flex gap-6 xl:gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="text-white hover:text-yellow-300 transition font-medium relative group text-sm"
                >
                  {item.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-300 group-hover:w-full transition-all duration-300"></span>
                </Link>
              ))}
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
              {/* Language Selector - Desktop */}
              <div className="hidden sm:flex items-center gap-0.5 bg-white bg-opacity-10 rounded-xl p-0.5">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition duration-200 text-xs whitespace-nowrap ${
                      language === lang.code
                        ? "bg-yellow-400 text-black shadow-md scale-105"
                        : "text-black hover:bg-white hover:bg-opacity-20"
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>

              {/* Auth Buttons - Desktop */}
              {user ? (
                <div
                  ref={desktopProfileMenuRef}
                  className="relative hidden items-center lg:flex"
                >
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((prev) => !prev)}
                    className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-yellow-300 bg-white/10 transition hover:scale-105"
                    aria-label={t("profile")}
                  >
                    {user.avatarData ? (
                      <img
                        src={user.avatarData}
                        alt={user.displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-yellow-300">
                        {getInitials(user.displayName)}
                      </span>
                    )}
                  </button>

                  {profileMenuOpen ? (
                    <div className="absolute right-0 top-[calc(100%+10px)] z-50 min-w-44 overflow-hidden rounded-2xl border border-green-900/20 bg-white shadow-2xl">
                      <Link
                        to="/profile"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setMenuOpen(false);
                        }}
                        className="block px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-[#f4fbf7]"
                      >
                        {t("profile")}
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setProfileMenuOpen(false);
                          setMenuOpen(false);
                        }}
                        className="block w-full px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        {t("logout")}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 rounded-2xl border-[0.4px] border-white bg-[#014531] text-white text-[14px] whitespace-nowrap hover:scale-105 transition"
                  >
                    {t("login")}
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 py-1.5 rounded-2xl border-[0.4px] border-white bg-[#014531] text-white text-[14px] whitespace-nowrap hover:scale-105 transition"
                  >
                    {t("register")}
                  </Link>
                </div>
              )}

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="rounded-full p-2 text-white transition hover:bg-white/10 lg:hidden"
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </nav>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="lg:hidden bg-[#014531] border-t border-green-900">
              <div className="px-4 py-3 space-y-2 max-h-80 overflow-y-auto">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="block text-white hover:text-yellow-300 transition py-2 px-3 font-medium rounded"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}

                {/* Mobile Language Selector */}
                <div className="flex gap-2 pt-3 mt-3 border-t border-green-900">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setMenuOpen(false);
                      }}
                      className={`flex-1 px-2 py-2 rounded text-xs font-semibold transition duration-200 ${
                        language === lang.code
                          ? "bg-yellow-400 text-black shadow-md"
                          : "bg-white text-black hover:bg-yellow-400"
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>

                <div className="pt-3 mt-3 border-t border-green-900 space-y-2">
                  {user ? null : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setMenuOpen(false)}
                        className="w-full inline-flex justify-center bg-[#014531] border border-white text-white py-2 rounded-md"
                      >
                        {t("login")}
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setMenuOpen(false)}
                        className="w-full inline-flex justify-center bg-[#014531] border border-white text-white py-2 rounded-md"
                      >
                        {t("register")}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Main content */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
                  path="/"
              element={
                <RequireAuth
                  allowedRoles={[ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]}
                >
                  <RoleHome />
                </RequireAuth>
              }
            />
            <Route
              path="/courses"
              element={
                <RequireAuth allowedRoles={[ROLES.ADMIN]}>
                  <CoursesPage />
                </RequireAuth>
              }
            />
            <Route
              path="/teachers"
              element={
                <RequireAuth allowedRoles={[ROLES.ADMIN]}>
                  <TeachersPage />
                </RequireAuth>
              }
            />
            <Route
              path="/rooms"
              element={
                <RequireAuth allowedRoles={[ROLES.ADMIN]}>
                  <RoomsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/sections"
              element={
                <RequireAuth allowedRoles={[ROLES.ADMIN]}>
                  <SectionsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/schedule"
              element={
                <RequireAuth
                  allowedRoles={[ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]}
                >
                  <SchedulePage />
                </RequireAuth>
              }
            />
            <Route
              path="/profile"
              element={
                <RequireAuth
                  allowedRoles={[ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]}
                >
                  <ProfilePage />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-[#014531] text-white py-6 sm:py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-5 flex justify-center lg:hidden">
              <Link
                to={homePath}
                className="flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-3 text-white transition hover:opacity-80"
              >
                <img
                  src="https://kazatu.edu.kz/img/logo_official.svg"
                  alt="KazATU Logo"
                  className="h-10 w-auto"
                />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-6">
              {/* About */}
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-bold text-yellow-300 mb-2 sm:mb-3">
                  {t("title")}
                </h3>
                <p className="text-gray-200">{t("subtitle")}</p>
              </div>

              {/* Quick Links */}
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-bold text-yellow-300 mb-2 sm:mb-3">
                  {t("navigate")}
                </h3>
                <ul className="space-y-1 sm:space-y-2">
                  {navItems.map((item) => (
                    <li key={`footer-${item.path}`}>
                      <Link
                        to={item.path}
                        className="text-sm sm:text-base text-gray-200 hover:text-yellow-300 transition"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Language Info */}
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-bold text-yellow-300 mb-2 sm:mb-3">
                  {t("language")}
                </h3>
                <p className="text-sm sm:text-base mb-2 sm:mb-3 text-gray-200">
                  {languages.find((l) => l.code === language)?.name}
                </p>
                <div className="flex gap-2 justify-center">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm transition font-semibold ${
                        language === lang.code
                          ? "bg-yellow-400 text-black"
                          : "bg-white bg-opacity-10 text-black hover:bg-opacity-20"
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-green-900 pt-4 sm:pt-6 text-center text-gray-300">
              <p className="text-xs sm:text-sm">{t("copyright")}</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

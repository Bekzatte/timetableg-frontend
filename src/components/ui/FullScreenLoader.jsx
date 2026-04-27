import { RotateCw } from "lucide-react";
import { useGlobalLoader } from "../../hooks/useGlobalLoader";
import { useTranslation } from "../../hooks/useTranslation";

export const FullScreenLoader = () => {
  const { activeLoader, isBlocking } = useGlobalLoader();
  const { t } = useTranslation();

  if (!isBlocking || !activeLoader) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-sm">
      <div className="rounded-2xl border border-blue-100 bg-white px-6 py-5 text-center shadow-xl">
        <RotateCw size={28} className="mx-auto animate-spin text-[#014531]" />

        <p className="mt-3 text-sm font-medium text-gray-900">
          {activeLoader.title || t("scheduleGenerationInProgress")}
        </p>

        <p className="mt-1 text-xs text-gray-500">
          {activeLoader.description || t("loading")}
        </p>
      </div>
    </div>
  );
};

export default FullScreenLoader;
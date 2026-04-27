import { LoaderCircle, Sparkles } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";
import { useGlobalLoader } from "../../hooks/useGlobalLoader";

export const FullScreenLoader = () => {
  const { t } = useTranslation();
  const { activeLoader, isBlocking } = useGlobalLoader();

  if (!isBlocking || !activeLoader) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#014531]/55 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md overflow-hidden rounded-[32px] border border-white/20 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.18),_transparent_45%),linear-gradient(135deg,_rgba(1,69,49,0.96),_rgba(7,89,68,0.94))] p-8 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-yellow-200/80">
              {t("loading")}
            </p>
            <h2 className="mt-3 text-2xl font-bold leading-tight">
              {activeLoader.title || t("loading")}
            </h2>
            <p className="mt-3 text-sm text-green-50/80">
              {activeLoader.description || t("globalLoaderDefaultDescription")}
            </p>
          </div>
          <div className="rounded-full border border-white/15 bg-white/10 p-3 text-yellow-200">
            <Sparkles size={18} />
          </div>
        </div>

        <div className="mt-8 flex items-center gap-4 rounded-3xl border border-white/10 bg-white/10 px-5 py-4">
          <LoaderCircle size={30} className="animate-spin text-yellow-300" />
          <div className="flex-1">
            <div className="flex gap-2">
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-yellow-300 [animation-delay:-0.2s]" />
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-yellow-200 [animation-delay:-0.1s]" />
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-white" />
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-yellow-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullScreenLoader;

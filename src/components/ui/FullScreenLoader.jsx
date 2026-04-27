import { LoaderCircle } from "lucide-react";
import { useGlobalLoader } from "../../hooks/useGlobalLoader";

export const FullScreenLoader = () => {
  const { activeLoader, isBlocking } = useGlobalLoader();

  if (!isBlocking || !activeLoader) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-[2px]">
      <div className="flex w-full max-w-[320px] flex-col items-center rounded-2xl border border-white/20 bg-white px-7 py-6 text-center shadow-xl">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <LoaderCircle className="h-8 w-8 animate-spin text-emerald-700" />
        </div>

        <h2 className="text-base font-semibold text-slate-900">
          {activeLoader.title || "Загрузка..."}
        </h2>

        <p className="mt-1 text-sm leading-5 text-slate-500">
          {activeLoader.description || "Пожалуйста, подождите"}
        </p>
      </div>
    </div>
  );
};

export default FullScreenLoader;
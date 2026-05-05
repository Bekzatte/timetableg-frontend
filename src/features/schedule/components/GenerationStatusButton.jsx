import { AlertCircle, BadgeCheck, Sparkles } from "lucide-react";

export const GenerationStatusButton = ({ status, label, onClick }) => {
  if (!status) {
    return null;
  }

  const Icon =
    status === "completed" ? BadgeCheck : status === "failed" ? AlertCircle : Sparkles;
  const className =
    status === "completed"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      : status === "failed"
        ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
        : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-xs font-medium shadow-sm transition ${className}`}
      title={label}
      aria-label={label}
    >
      <Icon
        size={18}
        className={status === "completed" || status === "failed" ? "" : "animate-spin"}
      />
    </button>
  );
};

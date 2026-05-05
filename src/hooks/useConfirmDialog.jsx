import { useCallback, useRef, useState } from "react";
import Modal from "../components/ui/Modal";
import { useTranslation } from "./useTranslation";

export const useConfirmDialog = () => {
  const { t } = useTranslation();
  const resolverRef = useRef(null);
  const [state, setState] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "",
    cancelLabel: "",
    tone: "danger",
  });

  const close = useCallback((result) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setState((current) => ({ ...current, isOpen: false }));
  }, []);

  const confirm = useCallback(
    (options = {}) =>
      new Promise((resolve) => {
        resolverRef.current = resolve;
        setState({
          isOpen: true,
          title: options.title || t("confirmAction"),
          message: options.message || "",
          confirmLabel: options.confirmLabel || t("confirm"),
          cancelLabel: options.cancelLabel || t("cancel"),
          tone: options.tone || "danger",
        });
      }),
    [t],
  );

  const ConfirmDialog = useCallback(
    () => (
      <Modal
        isOpen={state.isOpen}
        onClose={() => close(false)}
        title={state.title}
        size="sm"
      >
        <div className="space-y-4">
          {state.message ? (
            <p className="text-sm leading-6 text-gray-700">{state.message}</p>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => close(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              {state.cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => close(true)}
              className={`rounded-md px-4 py-2 text-sm font-medium text-white transition ${
                state.tone === "danger"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-[#014531] hover:bg-[#013726]"
              }`}
            >
              {state.confirmLabel}
            </button>
          </div>
        </div>
      </Modal>
    ),
    [close, state],
  );

  return { confirm, ConfirmDialog };
};

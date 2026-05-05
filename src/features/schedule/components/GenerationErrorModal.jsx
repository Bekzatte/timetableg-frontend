import Modal from "../../../components/ui/Modal";

export const GenerationErrorModal = ({ error, t, onClose }) => (
  <Modal
    isOpen={Boolean(error)}
    onClose={onClose}
    title={error?.title || t("errorGenerateSchedule")}
    size="md"
  >
    <div className="space-y-4">
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error?.message}
      </div>

      {error?.items?.length ? (
        <div>
          <p className="mb-2 text-sm font-medium text-gray-900">
            {t("description")}
          </p>

          <ul className="list-disc space-y-2 pl-5 text-sm text-gray-700">
            {error.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-md bg-[#014531] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#013726]"
      >
        {t("close")}
      </button>
    </div>
  </Modal>
);

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import DataTable from "../ui/DataTable";
import Modal from "../ui/Modal";
import Form from "../ui/Form";
import { useAuth } from "../../hooks/useAuth";
import { adminAPI, roomAPI, roomBlockAPI } from "../../services/api";
import { useFetch } from "../../hooks/useAPI";
import { useGlobalLoader } from "../../hooks/useGlobalLoader";
import { useTranslation } from "../../hooks/useTranslation";
import {
  PROGRAMMES,
  getCanonicalProgrammeName,
  getProgrammeLabel,
} from "../../constants/programmes";

export const RoomManager = () => {
  const { t, language } = useTranslation();
  const { withGlobalLoader } = useGlobalLoader();
  const { isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBlocksModalOpen, setIsBlocksModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);
  const [blockFormError, setBlockFormError] = useState("");
  const [blockFormData, setBlockFormData] = useState({
    day: "Monday",
    start_hour: 8,
    end_hour: 10,
    reason: "",
  });
  const [programmeFilter, setProgrammeFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [draftProgrammeFilter, setDraftProgrammeFilter] = useState("");
  const [draftTypeFilter, setDraftTypeFilter] = useState("");
  const [draftAvailabilityFilter, setDraftAvailabilityFilter] = useState("");
  const { data, isLoading, execute } = useFetch(roomAPI.getAll);
  const {
    data: roomBlocksData,
    isLoading: isRoomBlocksLoading,
    execute: executeRoomBlocks,
  } = useFetch(roomBlockAPI.getAll);

  useEffect(() => {
    execute();
    executeRoomBlocks();
  }, [execute, executeRoomBlocks]);

  const rooms = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const roomBlocks = useMemo(() => (Array.isArray(roomBlocksData) ? roomBlocksData : []), [roomBlocksData]);
  const selectedRoomBlocks = useMemo(
    () =>
      roomBlocks.filter((block) => Number(block.room_id) === Number(selectedRoom?.id)),
    [roomBlocks, selectedRoom],
  );
  const weekdayOptions = useMemo(
    () => [
      { value: "Monday", label: t("monday") },
      { value: "Tuesday", label: t("tuesday") },
      { value: "Wednesday", label: t("wednesday") },
      { value: "Thursday", label: t("thursday") },
      { value: "Friday", label: t("friday") },
    ],
    [t],
  );
  const hourOptions = useMemo(
    () => Array.from({ length: 11 }, (_item, index) => 8 + index),
    [],
  );
  const filteredRooms = useMemo(
    () =>
      rooms.filter((room) => {
        const matchesProgramme = !programmeFilter || room.programme === programmeFilter;
        const matchesType = !typeFilter || room.type === typeFilter;
        const matchesAvailability =
          !availabilityFilter || String(Number(Boolean(room.available))) === availabilityFilter;
        return matchesProgramme && matchesType && matchesAvailability;
      }),
    [rooms, programmeFilter, typeFilter, availabilityFilter],
  );
  const availableRoomsCount = filteredRooms.filter((room) => room.available).length;
  const totalSeatsCount = filteredRooms.reduce(
    (sum, room) => sum + (Number(room.capacity) || 0),
    0,
  );
  const hasActiveFilters = Boolean(programmeFilter || typeFilter || availabilityFilter);
  const roomTypeLabelMap = useMemo(
    () => ({
      lecture: t("lectureHall"),
      practical: t("practicalRoom"),
    }),
    [t],
  );

  const handleAddRoom = () => {
    setEditingRoom(null);
    setIsModalOpen(true);
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setIsModalOpen(true);
  };

  const handleManageBlocks = (room) => {
    setSelectedRoom(room);
    setBlockFormError("");
    setBlockFormData({
      day: "Monday",
      start_hour: 8,
      end_hour: 10,
      reason: "",
    });
    setIsBlocksModalOpen(true);
  };

  const handleDeleteRoom = async (room) => {
    if (
      window.confirm(t("confirmDeleteRoom").replace("${number}", room.number))
    ) {
      try {
        await withGlobalLoader(() => roomAPI.delete(room.id), {
          title: t("delete"),
          description: t("globalLoaderDeleteDescription"),
        });
        await execute();
      } catch (error) {
        console.error(t("errorDeleteRoom"), error);
      }
    }
  };

  const handleClearRooms = async () => {
    if (!window.confirm(t("confirmClearRooms"))) {
      return;
    }

    try {
      setIsClearing(true);
      await withGlobalLoader(() => adminAPI.clearCollection("rooms"), {
        title: t("clearRooms"),
        description: t("globalLoaderClearDescription"),
      });
      await execute();
    } catch (error) {
      console.error("Error clearing rooms:", error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleSubmit = async (formData, setErrors) => {
    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        available: formData.available ? 1 : 0,
      };
      await withGlobalLoader(
        () => (editingRoom ? roomAPI.update(editingRoom.id, payload) : roomAPI.create(payload)),
        {
          title: editingRoom ? t("save") : t("addRoom"),
          description: t("globalLoaderSaveDescription"),
        },
      );
      await execute();
      setIsModalOpen(false);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        error: error.message,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlockSubmit = async (event) => {
    event.preventDefault();
    if (!selectedRoom) {
      return;
    }
    try {
      setIsSubmittingBlock(true);
      setBlockFormError("");
      await withGlobalLoader(
        () =>
          roomBlockAPI.create({
            room_id: selectedRoom.id,
            day: blockFormData.day,
            start_hour: Number(blockFormData.start_hour),
            end_hour: Number(blockFormData.end_hour),
            reason: blockFormData.reason,
          }),
        {
          title: t("add"),
          description: t("globalLoaderSaveDescription"),
        },
      );
      await executeRoomBlocks();
      setBlockFormData((current) => ({
        ...current,
        reason: "",
      }));
    } catch (error) {
      setBlockFormError(error.message);
    } finally {
      setIsSubmittingBlock(false);
    }
  };

  const handleDeleteBlock = async (block) => {
    if (!window.confirm(t("confirmDeleteRoomBlock"))) {
      return;
    }
    await withGlobalLoader(() => roomBlockAPI.delete(block.id), {
      title: t("delete"),
      description: t("globalLoaderDeleteDescription"),
    });
    await executeRoomBlocks();
  };

  if (!isAdmin) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          {t("accessDenied")}
        </h2>
        <p className="text-gray-600 mt-2">{t("adminOnly")}</p>
      </div>
    );
  }

  const columns = [
    { key: "number", label: t("roomNumberHeader") },
    { key: "capacity", label: t("capacity") },
    { key: "computer_count", label: t("computerCount") },
    { key: "programme", label: t("faculty") },
    {
      key: "type",
      label: t("type"),
      render: (value) => roomTypeLabelMap[value] || value || "—",
    },
    {
      key: "available",
      label: t("available"),
      render: (value) => (value ? t("yes") : t("no")),
    },
    {
      key: "room_blocks",
      label: t("roomBlocks"),
      render: (_value, row) => (
        <button
          type="button"
          onClick={() => handleManageBlocks(row)}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          {t("manageRoomBlocks")}
        </button>
      ),
    },
  ];

  const formFields = [
    {
      name: "number",
      label: t("roomNumber"),
      placeholder: "101",
      required: true,
    },
    {
      name: "capacity",
      label: t("capacity"),
      type: "number",
      placeholder: "30",
      required: true,
    },
    {
      name: "type",
      label: t("roomType"),
      type: "select",
      options: [
        { value: "lecture", label: t("lectureHall") },
        { value: "practical", label: t("practicalRoom") },
      ],
      required: true,
    },
    {
      name: "programme",
      label: t("faculty"),
      type: "select",
      placeholder: t("selectFaculty"),
      options: PROGRAMMES.map((programme) => ({
        value: getCanonicalProgrammeName(programme),
        label: getProgrammeLabel(programme, language),
      })),
      required: true,
    },
    {
      name: "computer_count",
      label: t("computerCount"),
      type: "number",
      placeholder: "0",
      required: true,
    },
    {
      name: "available",
      label: t("available"),
      type: "toggle",
      required: true,
      trueLabel: t("yes"),
      falseLabel: t("no"),
    },
    {
      name: "equipment",
      label: t("equipment"),
      type: "textarea",
      placeholder: t("equipmentPlaceholder"),
    },
  ];

  return (
    <div className="p-6 bg-white">
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-sm font-medium text-blue-700">
            {t("roomsCount")}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {filteredRooms.length}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <p className="text-sm font-medium text-emerald-700">
            {t("availableRooms")}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {availableRoomsCount}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
          <p className="text-sm font-medium text-amber-700">
            {t("totalSeats")}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {totalSeatsCount}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("roomMgmt")}</h1>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <button
            onClick={handleAddRoom}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition w-full sm:w-auto"
          >
            <Plus size={20} /> {t("addRoom")}
          </button>
          <button
            onClick={handleClearRooms}
            disabled={isClearing || rooms.length === 0}
            className="w-full rounded-md bg-red-600 px-4 py-2 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {t("clearRooms")}
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredRooms}
        onEdit={handleEditRoom}
        onDelete={handleDeleteRoom}
        isLoading={isLoading}
        enableSearch
        hasActiveFilters={hasActiveFilters}
        filterDialogTitle={t("filter")}
        onApplyFilters={() => {
          setProgrammeFilter(draftProgrammeFilter);
          setTypeFilter(draftTypeFilter);
          setAvailabilityFilter(draftAvailabilityFilter);
        }}
        onResetFilters={() => {
          setDraftProgrammeFilter("");
          setDraftTypeFilter("");
          setDraftAvailabilityFilter("");
          setProgrammeFilter("");
          setTypeFilter("");
          setAvailabilityFilter("");
        }}
        filterControls={
          <>
            <select
              value={draftProgrammeFilter}
              onChange={(event) => setDraftProgrammeFilter(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              <option value="">{t("all")} {t("faculty").toLowerCase()}</option>
              {PROGRAMMES.map((programme) => {
                const value = getCanonicalProgrammeName(programme);
                return (
                  <option key={value} value={value}>
                    {getProgrammeLabel(programme, language)}
                  </option>
                );
              })}
            </select>
            <select
              value={draftTypeFilter}
              onChange={(event) => setDraftTypeFilter(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              <option value="">{t("all")} {t("roomType").toLowerCase()}</option>
              <option value="lecture">{t("lectureHall")}</option>
              <option value="practical">{t("practicalRoom")}</option>
            </select>
            <select
              value={draftAvailabilityFilter}
              onChange={(event) => setDraftAvailabilityFilter(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              <option value="">{t("all")} {t("available").toLowerCase()}</option>
              <option value="1">{t("yes")}</option>
              <option value="0">{t("no")}</option>
            </select>
          </>
        }
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? t("editRoom") : t("addRoom")}
      >
        <Form
          fields={formFields}
          onSubmit={handleSubmit}
          resetKey={editingRoom ? `room-${editingRoom.id}` : "room-new"}
          initialValues={editingRoom ? { ...editingRoom } : { computer_count: 0, available: 1 }}
          submitText={editingRoom ? t("save") : t("add")}
          isLoading={isSubmitting}
        />
      </Modal>

      <Modal
        isOpen={isBlocksModalOpen}
        onClose={() => setIsBlocksModalOpen(false)}
        title={`${t("roomBlocks")}${selectedRoom ? ` • ${selectedRoom.number}` : ""}`}
        size="md"
      >
        <div className="space-y-5">
          <form onSubmit={handleBlockSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t("day")}
                </label>
                <select
                  value={blockFormData.day}
                  onChange={(event) =>
                    setBlockFormData((current) => ({ ...current, day: event.target.value }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                >
                  {weekdayOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t("blockReason")}
                </label>
                <input
                  type="text"
                  value={blockFormData.reason}
                  onChange={(event) =>
                    setBlockFormData((current) => ({ ...current, reason: event.target.value }))
                  }
                  placeholder={t("blockReasonPlaceholder")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t("fromHour")}
                </label>
                <select
                  value={blockFormData.start_hour}
                  onChange={(event) =>
                    setBlockFormData((current) => ({ ...current, start_hour: Number(event.target.value) }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                >
                  {hourOptions.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}:00
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t("toHour")}
                </label>
                <select
                  value={blockFormData.end_hour}
                  onChange={(event) =>
                    setBlockFormData((current) => ({ ...current, end_hour: Number(event.target.value) }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                >
                  {hourOptions
                    .filter((hour) => hour > Number(blockFormData.start_hour))
                    .concat(Number(blockFormData.start_hour) + 1 > hourOptions[hourOptions.length - 1]
                      ? [Number(blockFormData.start_hour) + 1]
                      : [])
                    .map((hour) => (
                      <option key={hour} value={hour}>
                        {hour}:00
                      </option>
                    ))}
                </select>
              </div>
            </div>
            {blockFormError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {blockFormError}
              </div>
            ) : null}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingBlock}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {t("add")}
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {isRoomBlocksLoading ? (
              <div className="rounded-xl bg-gray-50 px-4 py-6 text-center text-gray-500">
                {t("loading")}
              </div>
            ) : selectedRoomBlocks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-gray-500">
                {t("noRoomBlocks")}
              </div>
            ) : (
              selectedRoomBlocks.map((block) => (
                <div
                  key={block.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {t(String(block.day || "").toLowerCase()) || block.day} • {block.start_hour}:00 - {block.end_hour}:00
                    </p>
                    <p className="text-sm text-gray-600">
                      {block.reason || "—"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteBlock(block)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 text-red-600 transition hover:bg-red-50"
                    aria-label={t("delete")}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RoomManager;

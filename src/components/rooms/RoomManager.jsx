import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import DataTable from "../ui/DataTable";
import Modal from "../ui/Modal";
import Form from "../ui/Form";
import { useAuth } from "../../hooks/useAuth";
import { adminAPI, roomAPI } from "../../services/api";
import { useFetch } from "../../hooks/useAPI";
import { useTranslation } from "../../hooks/useTranslation";
import { DEPARTMENTS } from "../../constants/departments";

export const RoomManager = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [isClearing, setIsClearing] = useState(false);
  const { data, isLoading, execute } = useFetch(roomAPI.getAll);

  useEffect(() => {
    execute();
  }, [execute]);

  const rooms = Array.isArray(data) ? data : [];
  const availableRoomsCount = rooms.filter((room) => room.available).length;

  const handleAddRoom = () => {
    setEditingRoom(null);
    setIsModalOpen(true);
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setIsModalOpen(true);
  };

  const handleDeleteRoom = async (room) => {
    if (
      window.confirm(t("confirmDeleteRoom").replace("${number}", room.number))
    ) {
      try {
        await roomAPI.delete(room.id);
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
      await adminAPI.clearCollection("rooms");
      await execute();
    } catch (error) {
      console.error("Error clearing rooms:", error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleSubmit = async (formData, setErrors) => {
    try {
      const payload = {
        ...formData,
        available: formData.available ? 1 : 0,
      };
      if (editingRoom) {
        await roomAPI.update(editingRoom.id, payload);
      } else {
        await roomAPI.create(payload);
      }
      await execute();
      setIsModalOpen(false);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        error: error.message,
      }));
    }
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
    { key: "department", label: t("facultyInstitute") },
    { key: "type", label: t("type") },
    {
      key: "available",
      label: t("available"),
      render: (value) => (value ? t("yes") : t("no")),
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
      name: "building",
      label: t("building"),
      placeholder: t("mainBuildingPlaceholder"),
    },
    {
      name: "type",
      label: t("roomType"),
      type: "select",
      options: [
        { value: "lecture", label: t("lectureHall") },
        { value: "practical", label: t("practicalRoom") },
        { value: "lab", label: t("labHall") },
      ],
    },
    {
      name: "department",
      label: t("facultyInstitute"),
      type: "select",
      placeholder: t("selectFacultyInstitute"),
      options: DEPARTMENTS.map((department) => ({
        value: department,
        label: department,
      })),
      required: true,
    },
    {
      name: "available",
      label: t("available"),
      type: "toggle",
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
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-sm font-medium text-blue-700">
            {t("roomsCount")}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {rooms.length}
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
            disabled={isClearing}
            className="w-full rounded-md bg-red-600 px-4 py-2 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isClearing ? t("loading") : t("clearRooms")}
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rooms}
        onEdit={handleEditRoom}
        onDelete={handleDeleteRoom}
        isLoading={isLoading}
        enableSearch
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? t("editRoom") : t("addRoom")}
      >
        <Form
          fields={formFields}
          onSubmit={handleSubmit}
          initialValues={{
            available: 1,
            ...(editingRoom || {}),
          }}
          submitText={editingRoom ? t("save") : t("add")}
        />
      </Modal>
    </div>
  );
};

export default RoomManager;

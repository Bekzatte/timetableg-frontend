import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import DataTable from "../ui/DataTable";
import Modal from "../ui/Modal";
import Form from "../ui/Form";
import { useAuth } from "../../hooks/useAuth";
import { roomAPI } from "../../services/api";
import { useFetch } from "../../hooks/useAPI";
import { useTranslation } from "../../hooks/useTranslation";

export const RoomManager = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const { data, isLoading, execute } = useFetch(roomAPI.getAll);

  useEffect(() => {
    execute();
  }, [execute]);

  const rooms = Array.isArray(data) ? data : [];

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

  const handleSubmit = async (formData, setErrors) => {
    try {
      if (editingRoom) {
        await roomAPI.update(editingRoom.id, formData);
      } else {
        await roomAPI.create(formData);
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
    { key: "building", label: t("building") },
    { key: "type", label: t("type") },
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
        { value: "lab", label: t("lab") },
        { value: "seminar", label: t("seminar") },
      ],
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("roomMgmt")}</h1>
        <button
          onClick={handleAddRoom}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition w-full sm:w-auto"
        >
          <Plus size={20} /> {t("addRoom")}
        </button>
      </div>

      <DataTable
        columns={columns}
        data={rooms}
        onEdit={handleEditRoom}
        onDelete={handleDeleteRoom}
        isLoading={isLoading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? t("editRoom") : t("addRoom")}
      >
        <Form
          fields={formFields}
          onSubmit={handleSubmit}
          initialValues={editingRoom || {}}
        />
      </Modal>
    </div>
  );
};

export default RoomManager;

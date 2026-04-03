import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import DataTable from "../ui/DataTable";
import Modal from "../ui/Modal";
import Form from "../ui/Form";
import { useAuth } from "../../contexts/AuthContext";
import { roomAPI } from "../../services/api";
import { useFetch } from "../../hooks/useAPI";
import { useTranslation } from "../../hooks/useTranslation";

export const RoomManager = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const { data, isLoading, execute } = useFetch(roomAPI.getAll);

  useEffect(() => {
    if (data) {
      setRooms(Array.isArray(data) ? [...data] : []);
    }
  }, [data]);

  useEffect(() => {
    execute();
  }, []);

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
        setRooms(rooms.filter((r) => r.id !== room.id));
      } catch (error) {
        console.error(t("errorDeleteRoom"), error);
      }
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingRoom) {
        const response = await roomAPI.update(editingRoom.id, formData);
        setRooms(
          rooms.map((r) =>
            r.id === editingRoom.id
              ? response.data || { ...formData, id: editingRoom.id }
              : r,
          ),
        );
      } else {
        const response = await roomAPI.create(formData);
        setRooms([...rooms, response.data || formData]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(t("errorSaveRoom"), error);
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t("roomMgmt")}</h1>
        <button
          onClick={handleAddRoom}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
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

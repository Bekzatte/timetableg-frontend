import { useContext } from "react";
import { NotificationsContext } from "../contexts/NotificationsContextValue";

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === null) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return context;
};

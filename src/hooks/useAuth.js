import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContextValue";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

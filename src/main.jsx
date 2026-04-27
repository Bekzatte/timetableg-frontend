import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { GlobalLoaderProvider } from "./contexts/GlobalLoaderContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LanguageProvider>
      <GlobalLoaderProvider>
        <AuthProvider>
          <NotificationsProvider>
            <App />
          </NotificationsProvider>
        </AuthProvider>
      </GlobalLoaderProvider>
    </LanguageProvider>
  </StrictMode>,
);

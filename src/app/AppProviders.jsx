import { lazy, Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../contexts/AuthContext";
import { GlobalLoaderProvider } from "../contexts/GlobalLoaderContext";
import { LanguageProvider } from "../contexts/LanguageContext";
import { NotificationsProvider } from "../contexts/NotificationsContext";
import { queryClient } from "./queryClient";

const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-query-devtools").then((module) => ({
        default: module.ReactQueryDevtools,
      })),
    )
  : null;

export const AppProviders = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <GlobalLoaderProvider>
        <AuthProvider>
          <NotificationsProvider>{children}</NotificationsProvider>
        </AuthProvider>
      </GlobalLoaderProvider>
    </LanguageProvider>
    {ReactQueryDevtools ? (
      <Suspense fallback={null}>
        <ReactQueryDevtools initialIsOpen={false} />
      </Suspense>
    ) : null}
  </QueryClientProvider>
);

import * as Sentry from "@sentry/react";

export const initMonitoring = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();

  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.1),
  });
};

export const captureAppError = (error, context = {}) => {
  if (!import.meta.env.VITE_SENTRY_DSN?.trim()) {
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
};

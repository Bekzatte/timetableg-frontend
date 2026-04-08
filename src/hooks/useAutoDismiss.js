import { useEffect } from "react";

export const useAutoDismiss = (value, clearValue, delay = 5000) => {
  useEffect(() => {
    if (!value) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      clearValue("");
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [clearValue, delay, value]);
};

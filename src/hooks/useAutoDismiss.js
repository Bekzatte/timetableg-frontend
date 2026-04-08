import { useEffect } from "react";

export const useAutoDismiss = (value, clearValue, delay = 5000, emptyValue = "") => {
  useEffect(() => {
    if (!value) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      clearValue(emptyValue);
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [clearValue, delay, emptyValue, value]);
};

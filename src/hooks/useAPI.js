import { useState, useCallback } from "react";

export const useFetch = (asyncFunction) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...params) => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await asyncFunction(...params);
        const normalizedData =
          response && typeof response === "object" && "data" in response
            ? response.data
            : response;
        setData(normalizedData);
        return normalizedData;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [asyncFunction],
  );

  return { data, isLoading, error, execute, setData };
};

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
        setData(response.data);
        return response.data;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [asyncFunction],
  );

  return { data, isLoading, error, execute };
};

export const useAsync = (asyncFunction, immediate = true) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await asyncFunction();
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [asyncFunction]);

  if (immediate) {
    execute();
  }

  return { data, isLoading, error, execute };
};

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const normalizeResponse = (response) =>
  response && typeof response === "object" && "data" in response
    ? response.data
    : response;

export const useServerQuery = (queryKey, queryFn, options = {}) =>
  useQuery({
    queryKey,
    queryFn: async () => normalizeResponse(await queryFn()),
    ...options,
  });

export const useServerMutation = (mutationFn, options = {}) => {
  const queryClient = useQueryClient();
  const { invalidate = [], onSuccess, ...mutationOptions } = options;

  return useMutation({
    mutationFn: async (...params) => normalizeResponse(await mutationFn(...params)),
    ...mutationOptions,
    onSuccess: async (data, variables, context) => {
      await Promise.all(
        invalidate.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );

      if (onSuccess) {
        await onSuccess(data, variables, context);
      }
    },
  });
};

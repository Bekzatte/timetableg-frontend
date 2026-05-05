import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useScheduleGenerationStore = create(
  persist(
    (set) => ({
      activeJob: null,
      isStatusOpen: false,
      setActiveJob: (job) =>
        set((state) => ({
          activeJob: typeof job === "function" ? job(state.activeJob) : job,
        })),
      mergeActiveJob: (updates) =>
        set((state) => ({
          activeJob: {
            ...(state.activeJob || {}),
            ...updates,
          },
        })),
      openStatus: () => set({ isStatusOpen: true }),
      closeStatus: () => set({ isStatusOpen: false }),
      setStatusOpen: (isStatusOpen) => set({ isStatusOpen }),
      clearActiveJob: () => set({ activeJob: null, isStatusOpen: false }),
    }),
    {
      name: "timetableg-schedule-generation",
      partialize: (state) => ({
        activeJob: state.activeJob,
      }),
    },
  ),
);

import { createContext } from "react";

export const GlobalLoaderContext = createContext({
  activeLoader: null,
  isBlocking: false,
  showLoader: () => () => {},
  withGlobalLoader: async (task) => task(),
});

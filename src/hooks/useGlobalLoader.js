import { useContext } from "react";
import { GlobalLoaderContext } from "../contexts/GlobalLoaderContextValue";

export const useGlobalLoader = () => useContext(GlobalLoaderContext);

import { useLanguage } from "./useLanguage";
import { getTranslation } from "../i18n/translations";

export const useTranslation = () => {
  const { language } = useLanguage();

  const t = (key) => {
    return getTranslation(language, key);
  };

  return { t, language };
};

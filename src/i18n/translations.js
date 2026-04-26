import en from "./languages/en";
import kk from "./languages/kk";
import ru from "./languages/ru";

export const translations = {
  kk,
  ru,
  en,
};

export const getTranslation = (language, key) => {
  return translations[language]?.[key] || translations.en[key] || key;
};

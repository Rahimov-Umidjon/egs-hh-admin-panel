import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

import uz from "./locales/uz.json"
import uzCyrl from "./locales/uz-Cyrl.json"
import ru from "./locales/ru.json"
import en from "./locales/en.json"

export const SUPPORTED_LANGUAGES = ["uz", "uz-Cyrl", "ru", "en"] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const LANGUAGE_STORAGE_KEY = "app_language"

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      uz: { translation: uz },
      "uz-Cyrl": { translation: uzCyrl },
      ru: { translation: ru },
      en: { translation: en },
    },

    // Foydalanuvchi hali til tanlamagan bo'lsa, doim shu til ko'rsatiladi.
    fallbackLng: "uz",
    lng: undefined, // localStorage/navigator orqali aniqlansin, aks holda fallbackLng ("uz") ishlatiladi

    supportedLngs: [...SUPPORTED_LANGUAGES],
    nonExplicitSupportedLngs: false,

    detection: {
      // Avval localStorage'ga qaraladi (login/register'da tanlangan til
      // shu yerdan admin panelga ham o'tadi), keyin brauzer tiliga.
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
    },

    interpolation: {
      escapeValue: false, // React allaqachon XSS'dan himoyalaydi
    },

    react: {
      useSuspense: false,
    },
  })

export default i18n
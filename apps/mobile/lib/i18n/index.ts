import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import en from "./locales/en.json";

export const resources = { en: { translation: en } } as const;

// ponytail: en only for now; add locale files + keys here when needed.
i18next.use(initReactI18next).init({
	resources,
	lng: getLocales()[0]?.languageCode ?? "en",
	fallbackLng: "en",
	interpolation: { escapeValue: false },
});

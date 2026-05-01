import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import 'intl-pluralrules';

import en from '../locales/en.json';
import he from '../locales/he.json';

const LANGUAGE_STORAGE_KEY = '@zoomi_language';

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }

      const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'he';
      const supportedLanguages = ['he', 'en'];
      const languageToUse = supportedLanguages.includes(deviceLanguage)
        ? deviceLanguage
        : 'he';

      callback(languageToUse);
    } catch (error) {
      console.error('Error detecting language:', error);
      callback('he');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
      console.error('Error caching language:', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: { translation: en },
      he: { translation: he },
    },
    fallbackLng: 'he',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;

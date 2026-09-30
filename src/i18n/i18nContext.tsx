import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { LanguageCode, LanguageInfo, Translations } from './types';
import { translations, AVAILABLE_LANGUAGES } from './locales';

interface I18nContextType {
  currentLanguage: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: (path: string, fallback?: string) => string;
  trans: Translations;
  availableLanguages: LanguageInfo[];
  currentLanguageInfo: LanguageInfo;
}

const STORAGE_KEY = 'prism_app_language';
const DEFAULT_LANGUAGE: LanguageCode = 'en';

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<LanguageCode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
        if (saved && translations[saved]) {
          return saved;
        }
        // Check browser language
        const browserLang = navigator.language?.slice(0, 2)?.toLowerCase();
        if (browserLang && (browserLang in translations)) {
          return browserLang as LanguageCode;
        }
      } catch (e) {
        console.warn('[I18n] Error reading language from storage:', e);
      }
    }
    return DEFAULT_LANGUAGE;
  });

  const setLanguage = (code: LanguageCode) => {
    if (!translations[code]) return;
    setCurrentLanguageState(code);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, code);
        document.documentElement.lang = code;
      } catch (e) {
        console.warn('[I18n] Error saving language to storage:', e);
      }
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = currentLanguage;
    }
  }, [currentLanguage]);

  const trans = useMemo(() => {
    return translations[currentLanguage] || translations.en;
  }, [currentLanguage]);

  const currentLanguageInfo = useMemo(() => {
    return AVAILABLE_LANGUAGES.find(l => l.code === currentLanguage) || AVAILABLE_LANGUAGES[0];
  }, [currentLanguage]);

  /**
   * Helper function to resolve dot-notated paths, e.g. 'nav.plantOverview' or 'health.nominal'
   */
  const t = (path: string, fallback?: string): string => {
    const keys = path.split('.');
    let current: any = trans;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English if translation is missing in current language
        let enCurrent: any = translations.en;
        for (const enKey of keys) {
          if (enCurrent && typeof enCurrent === 'object' && enKey in enCurrent) {
            enCurrent = enCurrent[enKey];
          } else {
            return fallback || path;
          }
        }
        return typeof enCurrent === 'string' ? enCurrent : (fallback || path);
      }
    }
    return typeof current === 'string' ? current : (fallback || path);
  };

  return (
    <I18nContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        t,
        trans,
        availableLanguages: AVAILABLE_LANGUAGES,
        currentLanguageInfo
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

import { LanguageCode, LanguageInfo, Translations } from '../types';
import { en } from './en';
import { de } from './de';
import { ja } from './ja';
import { es } from './es';
import { zh } from './zh';
import { fr } from './fr';

export const translations: Record<LanguageCode, Translations> = {
  en,
  de,
  ja,
  es,
  zh,
  fr,
};

export const AVAILABLE_LANGUAGES: LanguageInfo[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English (US/UK)',
    flag: '🇺🇸',
    hub: 'Global Standard · ISO/IEEE'
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    hub: 'Industrie 4.0 · DIN / VDI'
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    hub: 'Kaizen / TPS · モノづくり'
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    hub: 'Manufactura y Automotriz'
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '简体中文',
    flag: '🇨🇳',
    hub: '智能制造 · 工业物联网'
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    hub: 'Usine 4.0 · Aéronautique'
  }
];

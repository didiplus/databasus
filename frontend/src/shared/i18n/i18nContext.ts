import { createContext } from 'react';

import type en from './locales/en';

export type Locale = 'en' | 'zh';
export type Dictionary = typeof en;

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const I18nContext = createContext<I18nContextValue | undefined>(undefined);
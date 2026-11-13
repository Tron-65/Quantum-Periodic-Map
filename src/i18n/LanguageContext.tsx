import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import {
  BLOCK_META_AR,
  ELEMENT_NAMES_AR,
  FAMILY_META_AR,
  getAnomalyNoteAr,
  getChemicalBehaviorAr,
  STANDARD_STATE_AR,
} from '../data/elementsAr';
import {
  ChemicalElement,
  ChemicalFamily,
  OrbitalBlock,
  StandardState,
} from '../types/element';
import { BLOCK_META, FAMILY_META } from '../utils/quantum';

export type Language = 'en' | 'ar';

interface LanguageContextValue {
  lang: Language;
  isAr: boolean;
  dir: 'ltr' | 'rtl';
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  getElementName: (el: ChemicalElement) => string;
  getElementBehavior: (el: ChemicalElement) => string;
  getElementAnomaly: (el: ChemicalElement) => string | undefined;
  getBlockName: (block: OrbitalBlock) => string;
  getBlockDesc: (block: OrbitalBlock) => string;
  getFamilyLabel: (family: ChemicalFamily) => string;
  getStateLabel: (state: StandardState) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = window.localStorage.getItem('qpm-lang');
      if (saved === 'ar' || saved === 'en') return saved;
    } catch {
      // Ignore storage access errors in restricted frames
    }
    return 'en';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try {
      window.localStorage.setItem('qpm-lang', lang);
    } catch {
      // Ignore storage errors
    }
  }, [lang]);

  const isAr = lang === 'ar';

  const value: LanguageContextValue = {
    lang,
    isAr,
    dir: isAr ? 'rtl' : 'ltr',
    setLang,
    toggleLang: () => setLang((prev) => (prev === 'en' ? 'ar' : 'en')),
    getElementName: (el) => (isAr ? ELEMENT_NAMES_AR[el.z] ?? el.name : el.name),
    getElementBehavior: (el) => (isAr ? getChemicalBehaviorAr(el) : el.chemicalBehavior),
    getElementAnomaly: (el) => (isAr ? getAnomalyNoteAr(el) : el.anomalyNote),
    getBlockName: (block) => (isAr ? BLOCK_META_AR[block].name : BLOCK_META[block].name),
    getBlockDesc: (block) =>
      isAr ? BLOCK_META_AR[block].description : BLOCK_META[block].description,
    getFamilyLabel: (family) => (isAr ? FAMILY_META_AR[family] : FAMILY_META[family].label),
    getStateLabel: (state) => (isAr ? STANDARD_STATE_AR[state] : state),
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}

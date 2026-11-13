import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ELEMENTS, ELEMENTS_BY_Z } from '../data/elements';
import { ELEMENT_NAMES_AR } from '../data/elementsAr';
import { useLanguage } from '../i18n/LanguageContext';
import { ChemicalElement } from '../types/element';
import { BLOCK_META } from '../utils/quantum';

interface ElementSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectElement: (el: ChemicalElement) => void;
}

const QUICK_PICKS = [6, 26, 8, 24, 64, 79]; // C, Fe, O, Cr, Gd, Au

export function ElementSearchModal({
  isOpen,
  onClose,
  onSelectElement,
}: ElementSearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { isAr, getElementName } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [isOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ELEMENTS.slice(0, 18);
    return ELEMENTS.filter((el) => {
      const nameAr = ELEMENT_NAMES_AR[el.z] ?? '';
      return (
        el.name.toLowerCase().includes(q) ||
        nameAr.includes(query.trim()) ||
        el.symbol.toLowerCase().includes(q) ||
        String(el.z) === q ||
        el.quantumAddress.toLowerCase().includes(q) ||
        el.differentiatingOrbital.toLowerCase().includes(q)
      );
    }).slice(0, 24);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? 'البحث عن عناصر الخريطة الدورية الكمومية' : 'Search Quantum Periodic Map elements'}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isAr
                ? 'ابحث بالاسم أو الرمز أو العدد الذري أو العنوان الكمومي (مثل حديد، Fe، 26، 3d)...'
                : 'Search by element, symbol, Z, or quantum address (e.g. Fe, 26, 3d, P2)...'
            }
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق البحث' : 'Close search'}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Quick Picks */}
        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-900/50">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mr-1">
            {isAr ? 'عناصر مميزة:' : 'Featured:'}
          </span>
          {QUICK_PICKS.map((z) => {
            const el = ELEMENTS_BY_Z.get(z);
            if (!el) return null;
            return (
              <button
                key={z}
                type="button"
                onClick={() => {
                  onSelectElement(el);
                  onClose();
                }}
                className="px-2 py-0.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-400 cursor-pointer"
              >
                {el.symbol} ({el.z})
              </button>
            );
          })}
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/70">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {isAr
                ? `لا توجد عناصر تطابق «${query}».`
                : `No elements match “${query}”.`}
            </div>
          ) : (
            results.map((el) => {
              const blockMeta = BLOCK_META[el.block];
              return (
                <button
                  key={el.z}
                  type="button"
                  onClick={() => {
                    onSelectElement(el);
                    onClose();
                  }}
                  className="w-full px-4 py-2.5 flex items-center justify-between gap-4 text-start hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: blockMeta.hex }}
                      aria-hidden="true"
                    />
                    <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 w-7 shrink-0">
                      {el.z}
                    </span>
                    <span className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 w-7 shrink-0">
                      {el.symbol}
                    </span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {getElementName(el)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                      {el.condensedConfig}
                    </span>
                    <span
                      className="font-mono text-xs font-semibold"
                      style={{ color: blockMeta.hex }}
                    >
                      {el.quantumAddress}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

import { Search } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface TopBarProps {
  onOpenSearch: () => void;
}

export function TopBar({ onOpenSearch }: TopBarProps) {
  const { isAr } = useLanguage();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0B0E17]/95">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Title */}
        <a
          href="#top"
          className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0"
        >
          {isAr ? 'الخريطة الدورية الكمومية' : 'Quantum Periodic Map'}
        </a>

        {/* Zone 2: Concise single-line nav links */}
        <nav
          aria-label={isAr ? 'الأقسام الرئيسية' : 'Primary sections'}
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400"
        >
          <a
            href="#quantum-stage"
            className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            {isAr ? 'الخريطة الدورية' : 'Periodic Map'}
          </a>
          <a
            href="#quantum-inspector"
            className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            {isAr ? 'العنوان الكمومي' : 'Quantum Address'}
          </a>
          <a
            href="#atomic-shell-studio"
            className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            {isAr ? 'النظام الشمسي وبور' : 'Solar & Bohr'}
          </a>
          <a
            href="#quantum-trends"
            className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            {isAr ? 'راسم الاتجاهات' : 'Trend Plotter'}
          </a>
          <a
            href="#orbital-principles"
            className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            {isAr ? 'البنية المدارية' : 'Architecture'}
          </a>
        </nav>

        {/* Zone 3: Primary Search CTA */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenSearch}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Search className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isAr ? 'ابحث عن عنصر' : 'Find Element'}</span>
            <kbd className="hidden sm:inline-block font-mono text-[10px] opacity-75 ml-0.5">
              ⌘K
            </kbd>
          </button>
        </div>
      </div>
    </header>
  );
}

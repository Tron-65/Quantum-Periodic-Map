import { Box, GitCompare, Languages, Layers, Moon, Orbit, Sun, TrendingUp } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { ChemicalFamily, ColorOverlayMode, ViewMode } from '../types/element';
import { FAMILY_META } from '../utils/quantum';

interface WorkspaceToolbarProps {
  viewMode: ViewMode;
  onChangeView: (mode: ViewMode) => void;
  overlay: ColorOverlayMode;
  onChangeOverlay: (overlay: ColorOverlayMode) => void;
  familyFilter: ChemicalFamily | 'all';
  onChangeFamilyFilter: (family: ChemicalFamily | 'all') => void;
  compareMode: boolean;
  onToggleCompare: () => void;
  isDark: boolean;
  onToggleDark: () => void;
}

export function WorkspaceToolbar({
  viewMode,
  onChangeView,
  overlay,
  onChangeOverlay,
  familyFilter,
  onChangeFamilyFilter,
  compareMode,
  onToggleCompare,
  isDark,
  onToggleDark,
}: WorkspaceToolbarProps) {
  const { isAr, toggleLang, getFamilyLabel } = useLanguage();

  const viewTabs: Array<{ id: ViewMode; label: string; icon: typeof Layers }> = [
    { id: 'continuous', label: isAr ? 'الخريطة المتصلة 32 عموداً' : 'Continuous 32-Col', icon: Layers },
    { id: 'staircase', label: isAr ? 'المدرج المداري' : 'Orbital Staircase', icon: TrendingUp },
    { id: 'radial', label: isAr ? 'النواة الشعاعية' : 'Radial Core', icon: Orbit },
    { id: 'solar', label: isAr ? 'النظام الشمسي' : 'Solar System', icon: Sun },
    { id: 'phase3d', label: isAr ? 'فضاء الطور ثلاثي الأبعاد' : '3D Phase-Space', icon: Box },
  ];

  const overlayOptions: Array<{ id: ColorOverlayMode; label: string }> = [
    { id: 'block', label: isAr ? 'فئات المدارات (s·f·d·p)' : 'Orbital Blocks (s·f·d·p)' },
    { id: 'family', label: isAr ? 'العائلات الكيميائية' : 'Chemical Neighborhoods' },
    { id: 'electronegativity', label: isAr ? 'حقل الكهرسلبية' : 'Electronegativity Field' },
    { id: 'radius', label: isAr ? 'حقل نصف القطر الذري' : 'Atomic Radius Field' },
    { id: 'ionization', label: isAr ? 'حقل طاقة التأين' : 'Ionization Energy Field' },
    { id: 'metallic', label: isAr ? 'الصفة الفلزية' : 'Metallic Character' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-slate-800 rounded-lg">
      {/* View Mode Segmented Tabs */}
      <div
        role="tablist"
        aria-label={isAr ? 'أوضاع عرض الخريطة الدورية الكمومية' : 'Quantum Periodic Map projection views'}
        className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-md overflow-x-auto max-w-full"
      >
        {viewTabs.map((tab) => {
          const Icon = tab.icon;
          const active = viewMode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChangeView(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600 ${
                active
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Field Overlay, Neighborhood Filter, Language & Theme Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1.5">
          <label
            htmlFor="overlay-select"
            className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap"
          >
            {isAr ? 'الحقل:' : 'Field:'}
          </label>
          <select
            id="overlay-select"
            value={overlay}
            onChange={(e) => onChangeOverlay(e.target.value as ColorOverlayMode)}
            className="text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-md px-2.5 py-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            {overlayOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label
            htmlFor="family-select"
            className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap"
          >
            {isAr ? 'الفئة:' : 'Region:'}
          </label>
          <select
            id="family-select"
            value={familyFilter}
            onChange={(e) => onChangeFamilyFilter(e.target.value as ChemicalFamily | 'all')}
            className="text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-md px-2.5 py-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <option value="all">{isAr ? 'جميع العناصر (118)' : 'All 118 Elements'}</option>
            {(Object.keys(FAMILY_META) as ChemicalFamily[]).map((fam) => (
              <option key={fam} value={fam}>
                {getFamilyLabel(fam)}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onToggleCompare}
          aria-pressed={compareMode}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600 ${
            compareMode
              ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <GitCompare className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{isAr ? 'مقارنة' : 'Compare'}</span>
        </button>

        <button
          type="button"
          onClick={toggleLang}
          aria-label={isAr ? 'Switch language to English' : 'تبديل اللغة إلى العربية'}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <Languages className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <span>{isAr ? 'English' : 'العربية'}</span>
        </button>

        <button
          type="button"
          onClick={onToggleDark}
          aria-label={
            isDark
              ? isAr
                ? 'التبديل إلى الوضع النهاري'
                : 'Switch to Light Lab Theme'
              : isAr
                ? 'التبديل إلى الوضع الداكن'
                : 'Switch to Dark Observatory Theme'
          }
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>{isAr ? 'المختبر المضيء' : 'Lab Light'}</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
              <span>{isAr ? 'المرصد الداكن' : 'Observatory Dark'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

import { useLanguage } from '../i18n/LanguageContext';
import { ChemicalFamily, ColorOverlayMode, OrbitalBlock } from '../types/element';
import { BLOCK_META, FAMILY_META } from '../utils/quantum';

interface PropertyLegendProps {
  overlay: ColorOverlayMode;
  familyFilter: ChemicalFamily | 'all';
  onChangeFamilyFilter: (family: ChemicalFamily | 'all') => void;
}

export function PropertyLegend({
  overlay,
  familyFilter,
  onChangeFamilyFilter,
}: PropertyLegendProps) {
  const { isAr, getBlockName, getFamilyLabel } = useLanguage();

  if (overlay === 'block') {
    const blocks: OrbitalBlock[] = ['s', 'f', 'd', 'p'];
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          {blocks.map((b) => {
            const meta = BLOCK_META[b];
            return (
              <div key={b} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-xs shrink-0"
                  style={{ backgroundColor: meta.hex }}
                  aria-hidden="true"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {getBlockName(b)}
                </span>
                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  ({b}¹–{b}
                  {meta.capacity === 2 ? '²' : meta.capacity === 6 ? '⁶' : meta.capacity === 10 ? '¹⁰' : '¹⁴'})
                </span>
              </div>
            );
          })}
        </div>
        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
          {isAr
            ? 'المحور الأفقي = امتلاء تحت-الغلاف النشط · المحور الرأسي = الغلاف الرئيسي n'
            : 'Horizontal axis = active subshell population · Vertical axis = principal shell n'}
        </span>
      </div>
    );
  }

  if (overlay === 'family') {
    const families = Object.keys(FAMILY_META) as ChemicalFamily[];
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {families.map((fam) => {
          const meta = FAMILY_META[fam];
          const isSelected = familyFilter === fam;
          return (
            <button
              key={fam}
              type="button"
              onClick={() => onChangeFamilyFilter(isSelected ? 'all' : fam)}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] font-medium transition-colors cursor-pointer ${
                isSelected
                  ? 'border-slate-900 dark:border-slate-100 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600'
              }`}
            >
              <span
                className="w-2 h-2 rounded-xs shrink-0"
                style={{ backgroundColor: meta.hex }}
                aria-hidden="true"
              />
              <span>{getFamilyLabel(fam)}</span>
            </button>
          );
        })}
      </div>
    );
  }

  const gradientMeta: Record<
    Exclude<ColorOverlayMode, 'block' | 'family'>,
    { title: string; minLabel: string; maxLabel: string; gradientCss: string; note: string }
  > = {
    electronegativity: {
      title: isAr ? 'كهرسلبية باولنغ' : 'Pauling Electronegativity',
      minLabel: '0.70 (Fr)',
      maxLabel: '3.98 (F)',
      gradientCss: 'linear-gradient(90deg, #2563EB 0%, #0D9488 35%, #F59E0B 72%, #DC2626 100%)',
      note: isAr
        ? 'تزداد قطرياً باتجاه الفلور (2p⁵)؛ يشير الرمادي إلى الغلاف المغلق أو غير المقاس.'
        : 'Increases diagonally toward Fluorine (2p⁵); gray indicates closed-shell or unmeasured.',
    },
    radius: {
      title: isAr ? 'نصف القطر الذري' : 'Atomic Radius',
      minLabel: '31 pm (He)',
      maxLabel: '348 pm (Fr)',
      gradientCss: 'linear-gradient(90deg, #0EA5E9 0%, #6366F1 50%, #D97706 100%)',
      note: isAr
        ? 'يتمدد نزولاً عبر الأغلفة الرئيسية (n) وينكمش عبر تحت-الأغلفة مع ارتفاع Z_eff.'
        : 'Expands down principal shells (n) and contracts across active subshells as Z_eff rises.',
    },
    ionization: {
      title: isAr ? 'طاقة التأين الأولى' : 'First Ionization Energy',
      minLabel: '3.89 eV (Cs)',
      maxLabel: '24.59 eV (He)',
      gradientCss: 'linear-gradient(90deg, #D97706 0%, #0D9488 35%, #2563EB 70%, #7C3AED 100%)',
      note: isAr
        ? 'تبلغ ذروتها عند الأغلفة المغلقة (He, Ne, Ar) وتنخفض عند إلكترونات التكافؤ القلوية s¹.'
        : 'Peaks at closed shells (He, Ne, Ar) and dips across alkali s¹ valence electrons.',
    },
    metallic: {
      title: isAr ? 'الصفة الفلزية' : 'Metallic Character',
      minLabel: isAr ? '0% لافلز (He/F)' : '0% Nonmetal (He/F)',
      maxLabel: isAr ? '99% فلز قوي (Fr/Cs)' : '99% Strong Metal (Fr/Cs)',
      gradientCss: 'linear-gradient(90deg, #7C3AED 0%, #0D9488 50%, #2563EB 100%)',
      note: isAr
        ? 'تتدرج قطرياً من فلزات الفئة s الموجبة كهربياً إلى لافلزات الفئة p المؤكسِدة.'
        : 'Transitions diagonally from electropositive s-block metals to oxidizing p-block nonmetals.',
    },
  };

  const info = gradientMeta[overlay];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
      <div className="flex items-center gap-3">
        <span className="font-semibold text-slate-800 dark:text-slate-200">{info.title}</span>
        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
          {info.minLabel}
        </span>
        <div
          className="w-36 sm:w-48 h-2.5 rounded-xs border border-slate-300/60 dark:border-slate-700"
          style={{ background: info.gradientCss }}
          aria-hidden="true"
        />
        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
          {info.maxLabel}
        </span>
      </div>
      <span className="text-[11px] text-slate-500 dark:text-slate-400">{info.note}</span>
    </div>
  );
}

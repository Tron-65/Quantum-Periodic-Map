import { ELEMENTS_BY_Z } from '../data/elements';
import { useLanguage } from '../i18n/LanguageContext';
import { ChemicalElement, OrbitalBlock } from '../types/element';
import { BLOCK_META } from '../utils/quantum';

interface ConceptReferenceSectionProps {
  onSelectElement: (el: ChemicalElement) => void;
}

const COMPARISON_ROWS = [
  {
    conceptEn: 'Periodicity & shell recurrence',
    conceptAr: 'الدورية وتكرار الأغلفة',
    conventional: 4,
    qpm: 5,
    noteEn: 'Explicitly anchors every row to principal shell n = 1..7',
    noteAr: 'يربط كل صف صراحةً بغلاف الطاقة الرئيسي n = 1..7',
  },
  {
    conceptEn: 'Electron configuration visibility',
    conceptAr: 'وضوح التوزيع الإلكتروني',
    conventional: 3,
    qpm: 5,
    noteEn: 'Subshell population (s¹, d⁶, p⁴) defines the horizontal axis',
    noteAr: 'إشغال المدارات الفرعية (s¹, d⁶, p⁴) يحدد المحور الأفقي مباشرة',
  },
  {
    conceptEn: 's / f / d / p block continuity',
    conceptAr: 'استمرارية فئات s / f / d / p',
    conventional: 4,
    qpm: 5,
    noteEn: 'Eliminates artificial gap between Mg and Al; maps real filling order',
    noteAr: 'يزيل الفجوة المصطنعة بين Mg وAl ويمثّل تسلسل الامتلاء الفعلي',
  },
  {
    conceptEn: 'Transition-metal d-electron band',
    conceptAr: 'نطاق إلكترونات d للفلزات الانتقالية',
    conventional: 4,
    qpm: 5,
    noteEn: 'Displays d¹ → d¹⁰ oxidation, spin, and catalytic progression directly',
    noteAr: 'يعرض تدرّج الأكسدة والمغزل والتحفيز من d¹ إلى d¹⁰ بشكل مباشر',
  },
  {
    conceptEn: 'Lanthanide & actinide integration',
    conceptAr: 'دمج اللانثانيدات والأكتينيدات',
    conventional: 2,
    qpm: 5,
    noteEn: 'Keeps 4f¹–4f¹⁴ and 5f¹–5f¹⁴ inside Periods 6 & 7 without detachment',
    noteAr: 'يبقي مدارات 4f¹–4f¹⁴ و5f¹–5f¹⁴ مدمجة داخل الدورتين 6 و7 دون فصل',
  },
  {
    conceptEn: 'Atomic property trends',
    conceptAr: 'تدرّج الخواص الذرية',
    conventional: 4,
    qpm: 5,
    noteEn: 'Overlays electronegativity, radius, ionization, and metallicity fields',
    noteAr: 'يسقط حقول السالبية ونصف القطر والتأين والصفة الفلزية فوق البنية الكمومية',
  },
  {
    conceptEn: 'Chemical family neighborhoods',
    conceptAr: 'تجاور العائلات الكيميائية',
    conventional: 5,
    qpm: 5,
    noteEn: 'Preserves vertical valence alignment (e.g. O · S · Se · Te · Po)',
    noteAr: 'يحافظ على المحاذاة الرأسية للتكافؤ (مثل O · S · Se · Te · Po)',
  },
  {
    conceptEn: 'Teaching quantum structure',
    conceptAr: 'تدريس البنية الكمومية',
    conventional: 3,
    qpm: 5,
    noteEn: 'Replaces arbitrary group numbers with physical Quantum Addresses',
    noteAr: 'يستبدل أرقام المجموعات التقليدية بعناوين كمومية فيزيائية دالة',
  },
  {
    conceptEn: 'Interactive multi-axis exploration',
    conceptAr: 'استكشاف تفاعلي متعدد المحاور',
    conventional: 3,
    qpm: 5,
    noteEn: 'Unifies 32-col grid, Madelung staircase, radial core, and 3D phase-space',
    noteAr: 'يوحّد شبكة 32 عموداً وسلّم مادلونغ والنواة الشعاعية وفضاء الطور ثلاثي الأبعاد',
  },
];

const BLOCK_EXAMPLES: Array<{
  block: OrbitalBlock;
  sampleZ: number;
  sampleTitleEn: string;
  sampleTitleAr: string;
}> = [
  { block: 's', sampleZ: 11, sampleTitleEn: 'Sodium · P3 – s1 – V1', sampleTitleAr: 'الصوديوم · P3 – s1 – V1' },
  { block: 'f', sampleZ: 64, sampleTitleEn: 'Gadolinium · P6 – f7 – 5d¹6s²', sampleTitleAr: 'الغادولينيوم · P6 – f7 – 5d¹6s²' },
  { block: 'd', sampleZ: 26, sampleTitleEn: 'Iron · P4 – d6 – 4s²', sampleTitleAr: 'الحديد · P4 – d6 – 4s²' },
  { block: 'p', sampleZ: 6, sampleTitleEn: 'Carbon · P2 – p2 – V4', sampleTitleAr: 'الكربون · P2 – p2 – V4' },
];

export function ConceptReferenceSection({ onSelectElement }: ConceptReferenceSectionProps) {
  const { isAr, getBlockName, getBlockDesc } = useLanguage();

  return (
    <div className="space-y-10 pt-4">
      {/* Section 1: Orbital Architecture & Quantum Address */}
      <section
        id="orbital-principles"
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
      >
        <div className="lg:col-span-7 bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-5">
          <div className="space-y-1.5">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">
              {isAr ? '01. المعمارية المدارية من المبادئ الأولى' : '01. First-Principles Orbital Architecture'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isAr ? (
                <>
                  بدلاً من عزل اللانثانيدات والأكتينيدات في هامش منفصل، ترتّب الخريطة الدورية الكمومية العناصر وفق تسلسل امتلاء المدارات الفعلي (<span className="font-mono">s → f → d → p</span>) بحيث تقيس الخطوات الأفقية إشغال الإلكترونات مباشرة.
                </>
              ) : (
                <>
                  Rather than splitting lanthanides and actinides into a footnote, the Quantum Periodic Map aligns elements in exact subshell-filling order (<span className="font-mono">s → f → d → p</span>) so horizontal steps measure electron occupancy directly.
                </>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BLOCK_EXAMPLES.map(({ block, sampleZ, sampleTitleEn, sampleTitleAr }) => {
              const meta = BLOCK_META[block];
              const sampleEl = ELEMENTS_BY_Z.get(sampleZ);
              return (
                <div
                  key={block}
                  className="p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-xs shrink-0"
                          style={{ backgroundColor: meta.hex }}
                          aria-hidden="true"
                        />
                        {getBlockName(block)}
                      </span>
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        {isAr ? `${meta.capacity} أعمدة` : `${meta.capacity} columns`}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      {getBlockDesc(block)}
                    </p>
                  </div>
                  {sampleEl && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectElement(sampleEl);
                        document
                          .getElementById('quantum-inspector')
                          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }}
                      className="text-start font-mono text-xs font-semibold hover:underline cursor-pointer"
                      style={{ color: meta.hex }}
                    >
                      {isAr ? `معاينة ${sampleTitleAr} ←` : `Inspect ${sampleTitleEn} →`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quantum Address Anatomy */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-slate-800 rounded-lg p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-2">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">
              {isAr ? '02. تفكيك بنية العنوان الكمومي' : '02. Decoding the Quantum Address'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isAr
                ? 'بدلاً من أرقام المجموعات الغامضة (مثل «المجموعة 14» أو «المجموعة 8»)، يحمل كل عنصر عنواناً كمومياً بنيوياً يشفّر عمق الغلاف والمدار النشط وعدد إلكترونات التكافؤ.'
                : 'Instead of opaque group numbers (like “Group 14” or “Group 8”), every element carries a structural quantum address encoding shell depth, active orbital, and valence count.'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                  {isAr ? 'الكربون (C · Z = 6)' : 'Carbon (C · Z = 6)'}
                </span>
                <span className="font-mono text-sm font-semibold text-violet-600 dark:text-violet-400">
                  P2 – p2 – V4
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                <div>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">P2</span> ·{' '}
                  {isAr ? 'غلاف الدورة 2' : 'Period 2 shell'}
                </div>
                <div>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">p2</span> ·{' '}
                  {isAr ? 'المدار الفرعي النشط 2p²' : '2p² active subshell'}
                </div>
                <div>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">V4</span> ·{' '}
                  {isAr ? '4 إلكترونات تكافؤ' : '4 valence e⁻'}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                  {isAr ? 'الحديد (Fe · Z = 26)' : 'Iron (Fe · Z = 26)'}
                </span>
                <span className="font-mono text-sm font-semibold text-teal-600 dark:text-teal-400">
                  P4 – d6 – 4s²
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                <div>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">P4</span> ·{' '}
                  {isAr ? 'غلاف الدورة 4' : 'Period 4 shell'}
                </div>
                <div>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">d6</span> ·{' '}
                  {isAr ? 'نطاق 3d⁶ المداري' : '3d⁶ orbital band'}
                </div>
                <div>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">4s²</span> ·{' '}
                  {isAr ? 'زوج s الخارجي' : 'outer s-pair'}
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isAr ? (
              <>
                ينبع السلوك الكيميائي مباشرة: <span className="font-mono">P2–p2–V4</span> يكوّن أربع روابط تساهمية موجّهة، بينما يفسّر <span className="font-mono">P4–d6–4s²</span> حالات الأكسدة Fe²⁺/Fe³⁺ والمغناطيسية.
              </>
            ) : (
              <>
                Chemistry follows directly: <span className="font-mono">P2–p2–V4</span> forms four directional covalent bonds, while <span className="font-mono">P4–d6–4s²</span> explains Fe²⁺/Fe³⁺ redox states and magnetic spin alignment.
              </>
            )}
          </p>
        </div>
      </section>

      {/* Section 2: Conventional Table vs. Quantum Periodic Map Comparison */}
      <section
        id="model-comparison"
        className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">
            {isAr
              ? '03. الجدول التقليدي ذو الـ 18 عموداً مقابل الخريطة الدورية الكمومية'
              : '03. Conventional 18-Column Table vs. Quantum Periodic Map'}
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {isAr
              ? 'مقارنة بنيوية من المبادئ الأولى للتوزيع الإلكتروني'
              : 'Structural comparison from electron-configuration first principles'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-2.5 pe-4 text-start">{isAr ? 'المفهوم' : 'Concept'}</th>
                <th className="py-2.5 px-4 whitespace-nowrap text-start">
                  {isAr ? 'الجدول التقليدي' : 'Conventional Table'}
                </th>
                <th className="py-2.5 px-4 whitespace-nowrap text-start">
                  {isAr ? 'الخريطة الدورية الكمومية' : 'Quantum Periodic Map'}
                </th>
                <th className="py-2.5 ps-4 text-start">
                  {isAr ? 'الأساس المعماري' : 'Architectural Rationale'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.conceptEn}>
                  <td className="py-2.5 pe-4 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {isAr ? row.conceptAr : row.conceptEn}
                  </td>
                  <td dir="ltr" className="py-2.5 px-4 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap text-start">
                    {'★'.repeat(row.conventional)}
                    {'☆'.repeat(5 - row.conventional)} ({row.conventional}/5)
                  </td>
                  <td dir="ltr" className="py-2.5 px-4 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap text-start">
                    {'★'.repeat(row.qpm)} ({row.qpm}/5)
                  </td>
                  <td className="py-2.5 ps-4 text-xs text-slate-600 dark:text-slate-400">
                    {isAr ? row.noteAr : row.noteEn}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

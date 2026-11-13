import { ELEMENTS_BY_Z } from '../data/elements';
import { ChemicalElement, OrbitalBlock } from '../types/element';
import { BLOCK_META } from '../utils/quantum';

interface ConceptReferenceSectionProps {
  onSelectElement: (el: ChemicalElement) => void;
}

const COMPARISON_ROWS = [
  { concept: 'Periodicity & shell recurrence', conventional: 4, qpm: 5, note: 'Explicitly anchors every row to principal shell n = 1..7' },
  { concept: 'Electron configuration visibility', conventional: 3, qpm: 5, note: 'Subshell population (s¹, d⁶, p⁴) defines the horizontal axis' },
  { concept: 's / f / d / p block continuity', conventional: 4, qpm: 5, note: 'Eliminates artificial gap between Mg and Al; maps real filling order' },
  { concept: 'Transition-metal d-electron band', conventional: 4, qpm: 5, note: 'Displays d¹ → d¹⁰ oxidation, spin, and catalytic progression directly' },
  { concept: 'Lanthanide & actinide integration', conventional: 2, qpm: 5, note: 'Keeps 4f¹–4f¹⁴ and 5f¹–5f¹⁴ inside Periods 6 & 7 without detachment' },
  { concept: 'Atomic property trends', conventional: 4, qpm: 5, note: 'Overlays electronegativity, radius, ionization, and metallicity fields' },
  { concept: 'Chemical family neighborhoods', conventional: 5, qpm: 5, note: 'Preserves vertical valence alignment (e.g. O · S · Se · Te · Po)' },
  { concept: 'Teaching quantum structure', conventional: 3, qpm: 5, note: 'Replaces arbitrary group numbers with physical Quantum Addresses' },
  { concept: 'Interactive multi-axis exploration', conventional: 3, qpm: 5, note: 'Unifies 32-col grid, Madelung staircase, radial core, and 3D phase-space' },
];

const BLOCK_EXAMPLES: Array<{ block: OrbitalBlock; sampleZ: number; sampleTitle: string }> = [
  { block: 's', sampleZ: 11, sampleTitle: 'Sodium · P3 – s1 – V1' },
  { block: 'f', sampleZ: 64, sampleTitle: 'Gadolinium · P6 – f7 – 5d¹6s²' },
  { block: 'd', sampleZ: 26, sampleTitle: 'Iron · P4 – d6 – 4s²' },
  { block: 'p', sampleZ: 6, sampleTitle: 'Carbon · P2 – p2 – V4' },
];

export function ConceptReferenceSection({ onSelectElement }: ConceptReferenceSectionProps) {
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
              01. First-Principles Orbital Architecture
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Rather than splitting lanthanides and actinides into a footnote, the Quantum Periodic Map aligns elements in exact subshell-filling order (<span className="font-mono">s → f → d → p</span>) so horizontal steps measure electron occupancy directly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BLOCK_EXAMPLES.map(({ block, sampleZ, sampleTitle }) => {
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
                        {meta.name}
                      </span>
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        {meta.capacity} columns
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      {meta.description}
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
                      className="text-left font-mono text-xs font-semibold hover:underline cursor-pointer"
                      style={{ color: meta.hex }}
                    >
                      Inspect {sampleTitle} →
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
              02. Decoding the Quantum Address
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Instead of opaque group numbers (like &ldquo;Group 14&rdquo; or &ldquo;Group 8&rdquo;), every element carries a structural quantum address encoding shell depth, active orbital, and valence count.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                  Carbon (C · Z = 6)
                </span>
                <span className="font-mono text-sm font-semibold text-violet-600 dark:text-violet-400">
                  P2 – p2 – V4
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400 pt-1">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">P2</span> · Period 2 shell
                </div>
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">p2</span> · 2p² active subshell
                </div>
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">V4</span> · 4 valence e⁻
                </div>
              </div>
            </div>

            <div className="p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                  Iron (Fe · Z = 26)
                </span>
                <span className="font-mono text-sm font-semibold text-teal-600 dark:text-teal-400">
                  P4 – d6 – 4s²
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400 pt-1">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">P4</span> · Period 4 shell
                </div>
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">d6</span> · 3d⁶ orbital band
                </div>
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">4s²</span> · outer s-pair
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Chemistry follows directly: <span className="font-mono">P2–p2–V4</span> forms four directional covalent bonds, while <span className="font-mono">P4–d6–4s²</span> explains Fe²⁺/Fe³⁺ redox states and magnetic spin alignment.
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
            03. Conventional 18-Column Table vs. Quantum Periodic Map
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Structural comparison from electron-configuration first principles
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-2.5 pr-4">Concept</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Conventional Table</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Quantum Periodic Map</th>
                <th className="py-2.5 pl-4">Architectural Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.concept}>
                  <td className="py-2.5 pr-4 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {row.concept}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {'★'.repeat(row.conventional)}
                    {'☆'.repeat(5 - row.conventional)} ({row.conventional}/5)
                  </td>
                  <td className="py-2.5 px-4 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                    {'★'.repeat(row.qpm)} ({row.qpm}/5)
                  </td>
                  <td className="py-2.5 pl-4 text-xs text-slate-600 dark:text-slate-400">
                    {row.note}
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

import { ArrowLeftRight, CircleDot, GitCompare, Orbit } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ELEMENTS, ELEMENTS_BY_Z } from '../data/elements';
import { ChemicalElement } from '../types/element';
import { BLOCK_META } from '../utils/quantum';
import { BohrShellDiagram, getShellSummaries } from './BohrShellDiagram';
import { SolarSystemView } from './SolarSystemView';

interface AtomicComparisonStudioProps {
  selectedElement: ChemicalElement;
  compareElement: ChemicalElement;
  compareMode: boolean;
  activeSlot: 'A' | 'B';
  onToggleCompareMode: () => void;
  onChangeActiveSlot: (slot: 'A' | 'B') => void;
  onSelectElementA: (el: ChemicalElement) => void;
  onSelectElementB: (el: ChemicalElement) => void;
  onSwapElements: () => void;
  isDark: boolean;
}

const COMPARE_PRESETS: Array<{ label: string; zA: number; zB: number }> = [
  { label: 'C vs Si', zA: 6, zB: 14 },
  { label: 'N vs O', zA: 7, zB: 8 },
  { label: 'Fe vs Cu', zA: 26, zB: 29 },
  { label: 'Zr vs Hf', zA: 40, zB: 72 },
  { label: 'Na vs Cl', zA: 11, zB: 17 },
];

function formatDelta(valA: number | null, valB: number | null, unit: string, decimals = 2): string {
  if (valA === null || valB === null) return '—';
  const diff = valB - valA;
  const sign = diff > 0 ? '+' : diff < 0 ? '−' : '';
  const abs = Math.abs(diff).toFixed(decimals);
  return `${sign}${abs}${unit ? ` ${unit}` : ''}`;
}

export function AtomicComparisonStudio({
  selectedElement,
  compareElement,
  compareMode,
  activeSlot,
  onToggleCompareMode,
  onChangeActiveSlot,
  onSelectElementA,
  onSelectElementB,
  onSwapElements,
  isDark,
}: AtomicComparisonStudioProps) {
  const [syncAnimate, setSyncAnimate] = useState(true);
  const [focusedShellN, setFocusedShellN] = useState<number | null>(null);
  const [atomRepresentation, setAtomRepresentation] = useState<'solar' | 'bohr'>('solar');

  useEffect(() => {
    setFocusedShellN((prev) => (prev !== null && prev > selectedElement.period ? null : prev));
  }, [selectedElement.period, selectedElement.z]);

  const shellsA = getShellSummaries(selectedElement);
  const shellsB = getShellSummaries(compareElement);

  const selectRepresentation = (mode: 'solar' | 'bohr') => {
    setAtomRepresentation(mode);
    if (compareMode) {
      onToggleCompareMode();
    }
  };

  return (
    <section
      id="atomic-shell-studio"
      aria-label="Atomic Orbital Representation and Element Comparison"
      className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-slate-800 rounded-lg p-5 sm:p-6 space-y-5"
    >
      {/* Studio Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-0.5">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">
            {compareMode
              ? 'Bohr Shell & Quantum Comparison Mode'
              : atomRepresentation === 'solar'
                ? '3D Solar-System Atomic Orrery'
                : 'Dynamic Bohr Shell Architecture'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {compareMode
              ? 'Compare shell occupancy, quantum addresses, and periodic deltas side by side. Click any element on the map to update the armed slot.'
              : atomRepresentation === 'solar'
                ? `Keplerian 3D orbital model of ${selectedElement.name} with a ${selectedElement.z}-proton nucleon core and ${selectedElement.period} principal electron shells colored by s, f, d, p subshell.`
                : `Principal shell occupation for ${selectedElement.name} (n = 1..${selectedElement.period}), with electrons color-coded by s, f, d, p subshell.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 3D Solar System vs 2D Bohr Switcher */}
          <div
            role="tablist"
            aria-label="Atomic model representation"
            className="inline-flex items-center rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-0.5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={!compareMode && atomRepresentation === 'solar'}
              onClick={() => selectRepresentation('solar')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-sm transition-colors cursor-pointer whitespace-nowrap ${
                !compareMode && atomRepresentation === 'solar'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Orbit className="w-3.5 h-3.5" aria-hidden="true" />
              <span>3D Solar System</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!compareMode && atomRepresentation === 'bohr'}
              onClick={() => selectRepresentation('bohr')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-sm transition-colors cursor-pointer whitespace-nowrap ${
                !compareMode && atomRepresentation === 'bohr'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CircleDot className="w-3.5 h-3.5" aria-hidden="true" />
              <span>2D Bohr Rings</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleCompareMode}
            aria-pressed={compareMode}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border transition-colors cursor-pointer whitespace-nowrap ${
              compareMode
                ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{compareMode ? 'Exit Compare Mode' : 'Compare Elements'}</span>
          </button>
        </div>
      </div>

      {/* Single-Element Atomic Representation View */}
      {!compareMode && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className={atomRepresentation === 'solar' ? 'lg:col-span-7' : 'lg:col-span-5'}>
            {atomRepresentation === 'solar' ? (
              <SolarSystemView
                element={selectedElement}
                focusedShellN={focusedShellN}
                onFocusShell={setFocusedShellN}
              />
            ) : (
              <BohrShellDiagram
                element={selectedElement}
                isDark={isDark}
                animateProp={syncAnimate}
                onToggleAnimate={() => setSyncAnimate((v) => !v)}
                focusedShellN={focusedShellN}
                onFocusShell={setFocusedShellN}
              />
            )}
          </div>

          <div className={atomRepresentation === 'solar' ? 'lg:col-span-5 space-y-4' : 'lg:col-span-7 space-y-4'}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Principal Energy Level Occupation (n = 1..7)
              </h3>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                Active Period P{selectedElement.period} · {selectedElement.z} Total e⁻
              </span>
            </div>

            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => {
                const shell = shellsA.find((s) => s.n === n);
                const maxCap = 2 * n * n;
                const count = shell?.totalElectrons ?? 0;
                const isValenceLevel = n === selectedElement.period;
                const isFocused = focusedShellN === n;
                const pct = (count / maxCap) * 100;

                return (
                  <button
                    key={n}
                    type="button"
                    disabled={count === 0}
                    onClick={() => setFocusedShellN(isFocused ? null : n)}
                    className={`w-full text-left px-3 py-2 rounded border text-xs transition-colors ${
                      count > 0 ? 'cursor-pointer' : 'cursor-default'
                    } ${
                      isFocused
                        ? 'border-blue-600 dark:border-blue-400 bg-blue-50/60 dark:bg-blue-950/30'
                        : isValenceLevel
                          ? 'border-slate-400 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/70'
                          : count > 0
                            ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 hover:border-slate-400 dark:hover:border-slate-600'
                            : 'border-slate-100 dark:border-slate-800/40 opacity-45'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 w-10">
                          n = {n}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {isValenceLevel
                            ? 'Outer Valence Shell'
                            : shell?.containsDifferentiating
                              ? `Inner Active (${selectedElement.differentiatingOrbital})`
                              : count > 0
                                ? 'Inner Core Shell'
                                : 'Unoccupied'}
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {count} / {maxCap} e⁻
                      </span>
                    </div>

                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                      {shell?.electronsByBlock.map((sub) => (
                        <div
                          key={sub.subshell}
                          style={{
                            width: `${(sub.count / maxCap) * 100}%`,
                            backgroundColor: BLOCK_META[sub.block].hex,
                          }}
                          title={`${sub.subshell}: ${sub.count} e⁻`}
                        />
                      ))}
                      {pct === 0 && <div className="w-0" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {selectedElement.block === 'd' || selectedElement.block === 'f' ? (
                <>
                  Notice how <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedElement.name}</span> adds its differentiating <span className="font-mono">{selectedElement.differentiatingConfig}</span> electron to an inner shell while <span className="font-mono">n = {selectedElement.period}</span> serves as the outer boundary—explaining why transition and rare-earth series retain similar outer radii across consecutive elements.
                </>
              ) : (
                <>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedElement.name}</span> places its differentiating <span className="font-mono">{selectedElement.differentiatingConfig}</span> electron directly in its outermost principal shell (<span className="font-mono">n = {selectedElement.period}</span>), driving strong period-wise trends in radius and reactivity.
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Mode */}
      {compareMode && (
        <div className="space-y-5">
          {/* Comparison Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex flex-wrap items-center gap-2">
              {/* Slot A */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onChangeActiveSlot('A')}
                  className={`px-2 py-1 text-[11px] font-mono font-semibold rounded border cursor-pointer ${
                    activeSlot === 'A'
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Target A {activeSlot === 'A' ? '(Armed)' : ''}
                </button>
                <select
                  aria-label="Select Element A for comparison"
                  value={selectedElement.z}
                  onChange={(e) => {
                    const el = ELEMENTS_BY_Z.get(Number(e.target.value));
                    if (el) onSelectElementA(el);
                  }}
                  className="text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-slate-100 cursor-pointer"
                >
                  {ELEMENTS.map((el) => (
                    <option key={el.z} value={el.z}>
                      {el.z}. {el.name} ({el.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={onSwapElements}
                aria-label="Swap comparison elements A and B"
                className="p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              {/* Slot B */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onChangeActiveSlot('B')}
                  className={`px-2 py-1 text-[11px] font-mono font-semibold rounded border cursor-pointer ${
                    activeSlot === 'B'
                      ? 'border-teal-600 bg-teal-600 text-white'
                      : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Target B {activeSlot === 'B' ? '(Armed)' : ''}
                </button>
                <select
                  aria-label="Select Element B for comparison"
                  value={compareElement.z}
                  onChange={(e) => {
                    const el = ELEMENTS_BY_Z.get(Number(e.target.value));
                    if (el) onSelectElementB(el);
                  }}
                  className="text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-slate-100 cursor-pointer"
                >
                  {ELEMENTS.map((el) => (
                    <option key={el.z} value={el.z}>
                      {el.z}. {el.name} ({el.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Pairs:</span>
              {COMPARE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    const a = ELEMENTS_BY_Z.get(preset.zA);
                    const b = ELEMENTS_BY_Z.get(preset.zB);
                    if (a) onSelectElementA(a);
                    if (b) onSelectElementB(b);
                  }}
                  className="px-2 py-0.5 font-mono text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-400 cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dual Bohr Diagrams + Property Delta Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Element A Bohr */}
            <div className="lg:col-span-3 p-3 rounded-md border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                  A: {selectedElement.name} ({selectedElement.symbol})
                </span>
                <span
                  className="font-mono text-xs font-semibold"
                  style={{ color: BLOCK_META[selectedElement.block].hex }}
                >
                  {selectedElement.quantumAddress}
                </span>
              </div>
              <BohrShellDiagram
                element={selectedElement}
                isDark={isDark}
                compact
                animateProp={syncAnimate}
                onToggleAnimate={() => setSyncAnimate((v) => !v)}
              />
            </div>

            {/* Central Comparison Delta Matrix */}
            <div className="lg:col-span-6 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="py-2 pr-3 font-semibold">Quantum / Property Metric</th>
                    <th className="py-2 px-3 font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {selectedElement.symbol} (Z={selectedElement.z})
                    </th>
                    <th className="py-2 px-3 font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {compareElement.symbol} (Z={compareElement.z})
                    </th>
                    <th className="py-2 pl-3 font-mono font-semibold text-right">
                      Δ (B − A)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-mono">
                  <tr>
                    <td className="py-2 pr-3 font-sans text-slate-600 dark:text-slate-400">
                      Quantum Address
                    </td>
                    <td className="py-2 px-3" style={{ color: BLOCK_META[selectedElement.block].hex }}>
                      {selectedElement.quantumAddress}
                    </td>
                    <td className="py-2 px-3" style={{ color: BLOCK_META[compareElement.block].hex }}>
                      {compareElement.quantumAddress}
                    </td>
                    <td className="py-2 pl-3 text-right text-slate-500 dark:text-slate-400">
                      {selectedElement.block === compareElement.block ? 'Same block' : `${selectedElement.block} → ${compareElement.block}`}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-sans text-slate-600 dark:text-slate-400">
                      Differentiating Orbital
                    </td>
                    <td className="py-2 px-3 text-slate-900 dark:text-slate-100">
                      {selectedElement.differentiatingConfig}
                    </td>
                    <td className="py-2 px-3 text-slate-900 dark:text-slate-100">
                      {compareElement.differentiatingConfig}
                    </td>
                    <td className="py-2 pl-3 text-right text-slate-500 dark:text-slate-400">
                      {formatDelta(selectedElement.valenceElectrons, compareElement.valenceElectrons, 'val e⁻', 0)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-sans text-slate-600 dark:text-slate-400">
                      Shell Occupation
                    </td>
                    <td className="py-2 px-3 text-slate-800 dark:text-slate-200">
                      {shellsA.map((s) => s.totalElectrons).join('·')}
                    </td>
                    <td className="py-2 px-3 text-slate-800 dark:text-slate-200">
                      {shellsB.map((s) => s.totalElectrons).join('·')}
                    </td>
                    <td className="py-2 pl-3 text-right text-slate-500 dark:text-slate-400">
                      {formatDelta(selectedElement.period, compareElement.period, 'shells', 0)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-sans text-slate-600 dark:text-slate-400">
                      Atomic Radius
                    </td>
                    <td className="py-2 px-3 text-slate-900 dark:text-slate-100">
                      {selectedElement.atomicRadius} pm
                    </td>
                    <td className="py-2 px-3 text-slate-900 dark:text-slate-100">
                      {compareElement.atomicRadius} pm
                    </td>
                    <td className="py-2 pl-3 text-right font-semibold text-amber-600 dark:text-amber-400">
                      {formatDelta(selectedElement.atomicRadius, compareElement.atomicRadius, 'pm', 0)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-sans text-slate-600 dark:text-slate-400">
                      First Ionization Energy
                    </td>
                    <td className="py-2 px-3 text-slate-900 dark:text-slate-100">
                      {selectedElement.ionizationEnergy.toFixed(2)} eV
                    </td>
                    <td className="py-2 px-3 text-slate-900 dark:text-slate-100">
                      {compareElement.ionizationEnergy.toFixed(2)} eV
                    </td>
                    <td className="py-2 pl-3 text-right font-semibold text-blue-600 dark:text-blue-400">
                      {formatDelta(selectedElement.ionizationEnergy, compareElement.ionizationEnergy, 'eV', 2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-sans text-slate-600 dark:text-slate-400">
                      Electronegativity (Pauling)
                    </td>
                    <td className="py-2 px-3 text-slate-900 dark:text-slate-100">
                      {selectedElement.electronegativity !== null
                        ? selectedElement.electronegativity.toFixed(2)
                        : 'N/A'}
                    </td>
                    <td className="py-2 px-3 text-slate-900 dark:text-slate-100">
                      {compareElement.electronegativity !== null
                        ? compareElement.electronegativity.toFixed(2)
                        : 'N/A'}
                    </td>
                    <td className="py-2 pl-3 text-right font-semibold text-rose-600 dark:text-rose-400">
                      {formatDelta(selectedElement.electronegativity, compareElement.electronegativity, '', 2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-sans text-slate-600 dark:text-slate-400">
                      Metallic Character
                    </td>
                    <td className="py-2 px-3 text-slate-900 dark:text-slate-100">
                      {selectedElement.metallicCharacter}%
                    </td>
                    <td className="py-2 px-3 text-slate-900 dark:text-slate-100">
                      {compareElement.metallicCharacter}%
                    </td>
                    <td className="py-2 pl-3 text-right font-semibold text-teal-600 dark:text-teal-400">
                      {formatDelta(selectedElement.metallicCharacter, compareElement.metallicCharacter, '%', 0)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-sans text-slate-600 dark:text-slate-400">
                      Stable Isotopes
                    </td>
                    <td className="py-2 px-3 text-slate-900 dark:text-slate-100">
                      {selectedElement.stableIsotopesCount}
                    </td>
                    <td className="py-2 px-3 text-slate-900 dark:text-slate-100">
                      {compareElement.stableIsotopesCount}
                    </td>
                    <td className="py-2 pl-3 text-right text-slate-500 dark:text-slate-400">
                      {formatDelta(selectedElement.stableIsotopesCount, compareElement.stableIsotopesCount, '', 0)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {selectedElement.symbol}:{' '}
                  </span>
                  {selectedElement.chemicalBehavior}
                </p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {compareElement.symbol}:{' '}
                  </span>
                  {compareElement.chemicalBehavior}
                </p>
              </div>
            </div>

            {/* Element B Bohr */}
            <div className="lg:col-span-3 p-3 rounded-md border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                  B: {compareElement.name} ({compareElement.symbol})
                </span>
                <span
                  className="font-mono text-xs font-semibold"
                  style={{ color: BLOCK_META[compareElement.block].hex }}
                >
                  {compareElement.quantumAddress}
                </span>
              </div>
              <BohrShellDiagram
                element={compareElement}
                isDark={isDark}
                compact
                animateProp={syncAnimate}
                onToggleAnimate={() => setSyncAnimate((v) => !v)}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

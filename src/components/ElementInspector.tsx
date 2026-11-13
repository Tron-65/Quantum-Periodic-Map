import { ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { ELEMENTS_BY_Z } from '../data/elements';
import { ChemicalElement } from '../types/element';
import {
  BLOCK_META,
  buildOrbitalBoxes,
  FAMILY_META,
  getSubshellNeighbors,
  getValenceFamilyNeighbors,
  parseSubshells,
} from '../utils/quantum';

interface ElementInspectorProps {
  element: ChemicalElement;
  onSelectElement: (el: ChemicalElement) => void;
}

export function ElementInspector({ element, onSelectElement }: ElementInspectorProps) {
  const blockMeta = BLOCK_META[element.block];
  const familyMeta = FAMILY_META[element.family];
  const subshells = parseSubshells(element.fullConfig);
  // Show the outer/valence subshells (last 3–4 subshells so the diagram stays crisp and readable)
  const visibleSubshells = subshells.slice(-4);

  const subshellNeighbors = getSubshellNeighbors(element);
  const verticalNeighbors = getValenceFamilyNeighbors(element);

  const prevZ = ELEMENTS_BY_Z.get(element.z - 1) ?? null;
  const nextZ = ELEMENTS_BY_Z.get(element.z + 1) ?? null;

  const characterLabel =
    element.metallicCharacter >= 60
      ? 'Metallic'
      : element.metallicCharacter >= 30
        ? 'Metalloid / Transitional'
        : 'Nonmetallic';

  return (
    <section
      id="quantum-inspector"
      aria-label="Quantum Element Inspector"
      className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-slate-800 rounded-lg p-5 sm:p-6"
    >
      {/* Top Quick Header Row with Z-1 / Z+1 Stepping */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-baseline gap-3">
          <span
            className="w-3 h-3 rounded-xs self-center shrink-0"
            style={{ backgroundColor: blockMeta.hex }}
            aria-hidden="true"
          />
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50">
            {element.name}
          </h2>
          <span className="font-mono text-sm font-semibold text-slate-500 dark:text-slate-400">
            {element.symbol} · Z = {element.z}
          </span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
            |
          </span>
          <span className="font-mono text-sm font-semibold" style={{ color: blockMeta.hex }}>
            {element.quantumAddress}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!prevZ}
            onClick={() => prevZ && onSelectElement(prevZ)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-3 h-3" aria-hidden="true" />
            <span>{prevZ ? `${prevZ.z} ${prevZ.symbol}` : 'Start'}</span>
          </button>
          <button
            type="button"
            disabled={!nextZ}
            onClick={() => nextZ && onSelectElement(nextZ)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <span>{nextZ ? `${nextZ.z} ${nextZ.symbol}` : 'End'}</span>
            <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* 3-Column Analytical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5">
        {/* Column 1: Quantum Address & Causal Orbital Chemistry (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-start gap-4">
            {/* Standard Element Cell Preview */}
            <div
              className="w-24 h-28 rounded-md border-2 p-2 flex flex-col justify-between shrink-0 bg-slate-50 dark:bg-slate-900"
              style={{ borderColor: blockMeta.hex }}
            >
              <div className="flex items-center justify-between font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <span>{element.z}</span>
                <span>{element.valenceElectrons}e⁻</span>
              </div>
              <div className="text-center">
                <div className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50 leading-none">
                  {element.symbol}
                </div>
                <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                  {element.name}
                </div>
              </div>
              <div
                className="font-mono text-[11px] font-semibold text-center"
                style={{ color: blockMeta.hex }}
              >
                {element.differentiatingConfig}
              </div>
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Period {element.period} · {blockMeta.name} · {familyMeta.label}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Mass {element.atomicMass} u · {element.standardState} at 298 K
              </div>
              <div className="pt-1">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Condensed Configuration
                </div>
                <div className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {element.condensedConfig}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Valence Architecture
                </div>
                <div className="font-mono text-xs text-slate-700 dark:text-slate-300">
                  {element.valenceStructure} ({element.valenceElectrons} valence e⁻)
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Why {element.name} behaves this way
            </h3>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {element.chemicalBehavior}
            </p>
            {element.anomalyNote && (
              <div className="flex items-start gap-2 pt-1 text-xs text-amber-700 dark:text-amber-300">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{element.anomalyNote}</span>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Spin-Paired Orbital Box Diagram & Chemical Neighbors (4 cols) */}
        <div className="lg:col-span-4 space-y-4 lg:border-x lg:border-slate-200 dark:lg:border-slate-800 lg:px-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Outer Orbital Spin Architecture
              </h3>
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                Hund&apos;s Rule
              </span>
            </div>

            <div className="space-y-2.5">
              {visibleSubshells.map((sub) => {
                const boxes = buildOrbitalBoxes(sub.orbitals, sub.electrons);
                const isDiff = sub.subshell === element.differentiatingOrbital;
                return (
                  <div key={sub.subshell} className="flex items-center gap-3">
                    <span
                      className={`w-8 font-mono text-xs font-semibold shrink-0 ${
                        isDiff
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {sub.subshell}
                    </span>
                    <div className="flex flex-wrap items-center gap-1">
                      {boxes.map((box, i) => (
                        <div
                          key={i}
                          className={`w-6 h-6 rounded-xs border flex items-center justify-center font-mono text-[11px] leading-none ${
                            isDiff
                              ? 'border-slate-400 dark:border-slate-500 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-400'
                          }`}
                          title={`${sub.subshell} orbital ${i + 1}`}
                        >
                          {box.up && box.down ? '↑↓' : box.up ? '↑' : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate" title={element.fullConfig}>
              Full: {element.fullConfig}
            </div>
          </div>

          {/* Chemical Neighborhood Connections */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
            <div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                Same-Subshell Sequence (Period {element.period}, {element.block}-block)
              </div>
              <div className="flex flex-wrap gap-1">
                {subshellNeighbors.row.map((n) => (
                  <button
                    key={n.z}
                    type="button"
                    onClick={() => onSelectElement(n)}
                    className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors cursor-pointer ${
                      n.z === element.z
                        ? 'border-slate-900 dark:border-slate-100 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {n.symbol}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                Same Valence Column ({element.subshellLabel} across shells)
              </div>
              <div className="flex flex-wrap gap-1">
                {verticalNeighbors.map((n) => (
                  <button
                    key={n.z}
                    type="button"
                    onClick={() => onSelectElement(n)}
                    className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors cursor-pointer ${
                      n.z === element.z
                        ? 'border-slate-900 dark:border-slate-100 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {n.symbol}
                    <span className="opacity-60 ml-0.5 text-[9px]">P{n.period}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Calibrated Property Fields & Oxidation States (4 cols) */}
        <div className="lg:col-span-4 space-y-3.5">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            Chemical Property Coordinates
          </h3>

          {/* Electronegativity */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">Electronegativity (Pauling)</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {element.electronegativity !== null ? element.electronegativity.toFixed(2) : 'N/A'}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-rose-600 dark:bg-rose-500 transition-all duration-200"
                style={{
                  width:
                    element.electronegativity !== null
                      ? `${(element.electronegativity / 3.98) * 100}%`
                      : '0%',
                }}
              />
            </div>
          </div>

          {/* First Ionization Energy */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">First Ionization Energy</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {element.ionizationEnergy.toFixed(2)} eV
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all duration-200"
                style={{ width: `${(element.ionizationEnergy / 24.59) * 100}%` }}
              />
            </div>
          </div>

          {/* Atomic Radius */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">Atomic Radius</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {element.atomicRadius} pm
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-600 dark:bg-amber-500 transition-all duration-200"
                style={{ width: `${(element.atomicRadius / 348) * 100}%` }}
              />
            </div>
          </div>

          {/* Metallic Character */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">
                Metallic Character ({characterLabel})
              </span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {element.metallicCharacter}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-teal-600 dark:bg-teal-500 transition-all duration-200"
                style={{ width: `${element.metallicCharacter}%` }}
              />
            </div>
          </div>

          {/* Oxidation States */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Primary Oxidation States
            </span>
            <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
              {element.oxidationStates
                .map((s) => (s > 0 ? `+${s}` : `${s}`))
                .join(' · ')}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Strip: Stable Isotopes & Natural Abundance */}
      <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            Stable Isotopes &amp; Natural Terrestrial Abundance
          </h3>
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
            {element.stableIsotopesCount === 0
              ? '0 stable isotopes · Radioactive / Synthetic'
              : element.stableIsotopesCount === 1
                ? '1 stable isotope (Monoisotopic)'
                : `${element.stableIsotopesCount} stable isotopes`}
          </span>
        </div>

        {/* Proportional Natural Abundance Bar (for elements with measured terrestrial abundance) */}
        {element.isotopes.some((iso) => iso.abundance !== null && iso.abundance > 0) && (
          <div
            className="h-2 w-full rounded-xs overflow-hidden flex bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
            role="img"
            aria-label={`Natural abundance distribution for ${element.name}`}
          >
            {element.isotopes
              .filter((iso) => iso.abundance !== null && iso.abundance > 0)
              .map((iso, idx) => {
                const palette = [
                  '#2563EB',
                  '#0D9488',
                  '#7C3AED',
                  '#D97706',
                  '#0284C7',
                  '#4F46E5',
                  '#059669',
                  '#64748B',
                  '#475569',
                  '#334155',
                ];
                return (
                  <div
                    key={iso.massNumber}
                    style={{
                      width: `${Math.max(iso.abundance ?? 0, 0.5)}%`,
                      backgroundColor: palette[idx % palette.length],
                    }}
                    title={`${iso.massNumber}${element.symbol}: ${iso.abundance}%`}
                  />
                );
              })}
          </div>
        )}

        {/* Tabular Isotope Cards (hairline border, unboxed typography) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {element.isotopes.map((iso) => (
            <div
              key={iso.massNumber}
              className="px-2.5 py-2 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col justify-between gap-1"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                  <sup className="text-[10px] mr-0.5">{iso.massNumber}</sup>
                  {element.symbol}
                </span>
                <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {iso.abundance !== null
                    ? iso.abundance >= 1
                      ? `${iso.abundance.toFixed(2)}%`
                      : `${iso.abundance}%`
                    : 'Synthetic'}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                {iso.stable ? 'Stable' : `t₁/₂ ${iso.halfLife ?? 'unstable'}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

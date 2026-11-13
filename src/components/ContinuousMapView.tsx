import { useMemo } from 'react';
import { ELEMENTS } from '../data/elements';
import { ChemicalElement, ChemicalFamily, ColorOverlayMode, OrbitalBlock } from '../types/element';
import { BLOCK_META, FAMILY_META, getElementCellTheme } from '../utils/quantum';

interface ContinuousMapViewProps {
  selectedElement: ChemicalElement;
  onSelectElement: (el: ChemicalElement) => void;
  overlay: ColorOverlayMode;
  familyFilter: ChemicalFamily | 'all';
  isDark: boolean;
}

const SUBSHELL_COLUMNS: Array<{
  col: number;
  block: OrbitalBlock;
  slot: number;
  label: string;
}> = [
  { col: 1, block: 's', slot: 1, label: 's¹' },
  { col: 2, block: 's', slot: 2, label: 's²' },
  ...Array.from({ length: 14 }, (_, i) => ({
    col: 3 + i,
    block: 'f' as OrbitalBlock,
    slot: i + 1,
    label: `f${['¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '¹⁰', '¹¹', '¹²', '¹³', '¹⁴'][i]}`,
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    col: 17 + i,
    block: 'd' as OrbitalBlock,
    slot: i + 1,
    label: `d${['¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '¹⁰'][i]}`,
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    col: 27 + i,
    block: 'p' as OrbitalBlock,
    slot: i + 1,
    label: `p${['¹', '²', '³', '⁴', '⁵', '⁶'][i]}`,
  })),
];

const PERIOD_SHELLS = [
  { period: 1, label: 'n=1', activeDesc: '1s' },
  { period: 2, label: 'n=2', activeDesc: '2s · 2p' },
  { period: 3, label: 'n=3', activeDesc: '3s · 3p' },
  { period: 4, label: 'n=4', activeDesc: '4s · 3d · 4p' },
  { period: 5, label: 'n=5', activeDesc: '5s · 4d · 5p' },
  { period: 6, label: 'n=6', activeDesc: '6s · 4f · 5d · 6p' },
  { period: 7, label: 'n=7', activeDesc: '7s · 5f · 6d · 7p' },
];

export function ContinuousMapView({
  selectedElement,
  onSelectElement,
  overlay,
  familyFilter,
  isDark,
}: ContinuousMapViewProps) {
  const cellLookup = useMemo(() => {
    const map = new Map<string, ChemicalElement>();
    for (const el of ELEMENTS) {
      map.set(`${el.period}-${el.col32}`, el);
    }
    return map;
  }, []);

  return (
    <div className="w-full overflow-x-auto qpm-scroll pb-2">
      <div className="min-w-[1280px]">
        {/* Block Region Headers */}
        <div
          className="grid gap-0.5 mb-1"
          style={{ gridTemplateColumns: '48px repeat(32, minmax(36px, 1fr))' }}
        >
          <div className="flex items-end justify-center pb-1 text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500">
            Shell
          </div>
          <div className="col-span-2 px-1.5 py-1 rounded-t border border-b-0 border-blue-200 dark:border-blue-800/70 bg-blue-50/70 dark:bg-blue-950/30 text-center">
            <span className="text-[10px] font-display font-semibold text-blue-700 dark:text-blue-300">
              s-Block
            </span>
          </div>
          <div className="col-span-14 px-2 py-1 rounded-t border border-b-0 border-amber-200 dark:border-amber-800/70 bg-amber-50/70 dark:bg-amber-950/30 flex items-center justify-between">
            <span className="text-[10px] font-display font-semibold text-amber-700 dark:text-amber-300">
              f-Block Integrated (Lanthanides 4f · Actinides 5f)
            </span>
            <span className="text-[10px] font-mono text-amber-700/80 dark:text-amber-300/80">
              14 inner f-orbitals in sequence
            </span>
          </div>
          <div className="col-span-10 px-2 py-1 rounded-t border border-b-0 border-teal-200 dark:border-teal-800/70 bg-teal-50/70 dark:bg-teal-950/30 flex items-center justify-between">
            <span className="text-[10px] font-display font-semibold text-teal-700 dark:text-teal-300">
              d-Block Transition Band
            </span>
            <span className="text-[10px] font-mono text-teal-700/80 dark:text-teal-300/80">
              d¹ → d¹⁰
            </span>
          </div>
          <div className="col-span-6 px-2 py-1 rounded-t border border-b-0 border-violet-200 dark:border-violet-800/70 bg-violet-50/70 dark:bg-violet-950/30 flex items-center justify-between">
            <span className="text-[10px] font-display font-semibold text-violet-700 dark:text-violet-300">
              p-Block
            </span>
            <span className="text-[10px] font-mono text-violet-700/80 dark:text-violet-300/80">
              p¹ → p⁶
            </span>
          </div>
        </div>

        {/* Subshell Electron Population Headers */}
        <div
          className="grid gap-0.5 mb-1.5"
          style={{ gridTemplateColumns: '48px repeat(32, minmax(36px, 1fr))' }}
        >
          <div className="text-center text-[10px] font-mono text-slate-400 dark:text-slate-500 self-center">
            e⁻
          </div>
          {SUBSHELL_COLUMNS.map((col) => {
            const isActiveCol =
              selectedElement.block === col.block && selectedElement.blockSlot === col.slot;
            return (
              <div
                key={col.col}
                className={`text-center py-0.5 rounded-xs text-[10px] font-mono font-medium transition-colors ${
                  isActiveCol
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-900/60'
                }`}
              >
                {col.label}
              </div>
            );
          })}
        </div>

        {/* Period Rows (n = 1..7) */}
        <div className="space-y-1">
          {PERIOD_SHELLS.map(({ period, label, activeDesc }) => (
            <div
              key={period}
              className="grid gap-0.5 items-stretch"
              style={{ gridTemplateColumns: '48px repeat(32, minmax(36px, 1fr))' }}
            >
              {/* Period label */}
              <div
                className={`flex flex-col items-center justify-center rounded border px-1 py-1 text-center ${
                  selectedElement.period === period
                    ? 'border-slate-900 dark:border-slate-200 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-400'
                }`}
                title={`Period ${period}: ${activeDesc}`}
              >
                <span className="font-mono text-[11px] font-semibold leading-none">{label}</span>
                <span className="text-[8px] font-mono opacity-75 mt-1 leading-none">
                  P{period}
                </span>
              </div>

              {/* 32 Subshell Columns */}
              {SUBSHELL_COLUMNS.map((col) => {
                const el = cellLookup.get(`${period}-${col.col}`);
                if (!el) {
                  return (
                    <div
                      key={`${period}-${col.col}`}
                      className="h-[58px] flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <div className="w-full h-px bg-slate-200/70 dark:bg-slate-800/70" />
                    </div>
                  );
                }

                const isSelected = el.z === selectedElement.z;
                const isSameSubshellRow =
                  el.period === selectedElement.period &&
                  el.block === selectedElement.block &&
                  !isSelected;
                const isSameValenceCol =
                  el.block === selectedElement.block &&
                  el.blockSlot === selectedElement.blockSlot &&
                  !isSelected;
                const isDimmed =
                  familyFilter !== 'all' && el.family !== familyFilter;

                const theme = getElementCellTheme(el, overlay, isDark);
                const blockStyle = BLOCK_META[el.block];
                const familyStyle = FAMILY_META[el.family];

                const staticClasses =
                  overlay === 'block'
                    ? `${blockStyle.bgClass} ${blockStyle.borderClass}`
                    : overlay === 'family'
                      ? `${familyStyle.bgClass} ${familyStyle.borderClass}`
                      : '';

                return (
                  <button
                    key={el.z}
                    type="button"
                    onClick={() => onSelectElement(el)}
                    aria-label={`${el.name}, atomic number ${el.z}, ${el.quantumAddress}`}
                    aria-pressed={isSelected}
                    style={
                      overlay !== 'block' && overlay !== 'family'
                        ? {
                            backgroundColor: theme.backgroundColor,
                            borderColor: theme.borderColor,
                          }
                        : undefined
                    }
                    className={`group relative h-[58px] rounded-[4px] border px-1 py-0.5 flex flex-col justify-between text-left transition-transform duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600 ${staticClasses} ${
                      isSelected
                        ? 'ring-2 ring-slate-900 dark:ring-white scale-[1.08] z-20 shadow-md'
                        : isSameSubshellRow || isSameValenceCol
                          ? 'ring-1 ring-slate-700/60 dark:ring-slate-300/60 z-10'
                          : 'hover:scale-[1.06] hover:z-10 hover:border-slate-500 dark:hover:border-slate-300'
                    } ${isDimmed ? 'opacity-20' : 'opacity-100'}`}
                    title={`${el.name} (${el.symbol}) · Z=${el.z} · ${el.condensedConfig} · ${el.quantumAddress}`}
                  >
                    {/* Top: Atomic Number + Valence Electrons */}
                    <div className="w-full flex items-center justify-between leading-none">
                      <span className="font-mono text-[9px] font-semibold text-slate-700 dark:text-slate-300">
                        {el.z}
                      </span>
                      <span className="font-mono text-[8px] text-slate-500 dark:text-slate-400">
                        {el.valenceElectrons}e⁻
                      </span>
                    </div>

                    {/* Center: Symbol + Name */}
                    <div className="w-full text-center leading-tight my-auto">
                      <div className="font-display text-[13px] font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-none">
                        {el.symbol}
                      </div>
                      <div className="text-[7.5px] font-medium text-slate-600 dark:text-slate-400 truncate mt-0.5 leading-none">
                        {el.name}
                      </div>
                    </div>

                    {/* Bottom: Differentiating Orbital */}
                    <div className="w-full flex items-center justify-center leading-none">
                      <span
                        className={`font-mono text-[8.5px] font-medium leading-none ${
                          overlay === 'block'
                            ? blockStyle.textClass
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {el.differentiatingConfig}
                      </span>
                      {el.anomalyNote && (
                        <span
                          className="ml-0.5 text-[8px] font-mono text-amber-600 dark:text-amber-400"
                          title={el.anomalyNote}
                        >
                          *
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer note explaining integrated continuity & anomalies */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span>
            Each cell encodes atomic number (Z), symbol &amp; name, differentiating orbital, and valence electron count simultaneously.
          </span>
          <span className="font-mono">
            * indicates ground-state Aufbau exchange or relativistic subshell shift
          </span>
        </div>
      </div>
    </div>
  );
}

import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ELEMENTS_BY_Z } from '../data/elements';
import { ChemicalElement, ChemicalFamily, ColorOverlayMode } from '../types/element';
import { BLOCK_META, FAMILY_META, getElementCellTheme, MADELUNG_STEPS } from '../utils/quantum';

interface OrbitalStaircaseViewProps {
  selectedElement: ChemicalElement;
  onSelectElement: (el: ChemicalElement) => void;
  overlay: ColorOverlayMode;
  familyFilter: ChemicalFamily | 'all';
  isDark: boolean;
}

export function OrbitalStaircaseView({
  selectedElement,
  onSelectElement,
  overlay,
  familyFilter,
  isDark,
}: OrbitalStaircaseViewProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      const nextZ = selectedElement.z >= 118 ? 1 : selectedElement.z + 1;
      const nextEl = ELEMENTS_BY_Z.get(nextZ);
      if (nextEl) onSelectElement(nextEl);
      if (nextZ >= 118) setIsPlaying(false);
    }, 320);
    return () => window.clearInterval(timer);
  }, [isPlaying, selectedElement.z, onSelectElement]);

  // Display highest energy step at the top, lowest (1s) at the bottom like an ascending energy staircase
  const ascendingSteps = [...MADELUNG_STEPS].reverse();

  // Horizontal offset per block so s -> f -> d -> p staircase geometry reads naturally from left to right as energy rises
  const getStepIndentPx = (nPlusL: number, block: string) => {
    const base = (nPlusL - 1) * 44;
    const subOffset = block === 's' ? 0 : block === 'p' ? 28 : block === 'd' ? 16 : 8;
    return base + subOffset;
  };

  return (
    <div className="space-y-4">
      {/* Interactive Aufbau Stepper Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Step Aufbau</span>
              </>
            )}
          </button>

          <button
            type="button"
            aria-label="Previous atomic number"
            onClick={() => {
              setIsPlaying(false);
              const prev = ELEMENTS_BY_Z.get(Math.max(1, selectedElement.z - 1));
              if (prev) onSelectElement(prev);
            }}
            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
          >
            <SkipBack className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-label="Next atomic number"
            onClick={() => {
              setIsPlaying(false);
              const next = ELEMENTS_BY_Z.get(Math.min(118, selectedElement.z + 1));
              if (next) onSelectElement(next);
            }}
            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-label="Reset to Hydrogen Z=1"
            onClick={() => {
              setIsPlaying(false);
              const h = ELEMENTS_BY_Z.get(1);
              if (h) onSelectElement(h);
            }}
            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 min-w-[220px] max-w-md flex items-center gap-3">
          <label
            htmlFor="aufbau-z-slider"
            className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap"
          >
            Z = {selectedElement.z}
          </label>
          <input
            id="aufbau-z-slider"
            type="range"
            min={1}
            max={118}
            value={selectedElement.z}
            onChange={(e) => {
              setIsPlaying(false);
              const el = ELEMENTS_BY_Z.get(Number(e.target.value));
              if (el) onSelectElement(el);
            }}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {selectedElement.symbol} ({selectedElement.differentiatingConfig})
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
          Vertical axis: Subshell Energy (n + l Madelung order)
        </div>
      </div>

      {/* Ascending Staircase Canvas */}
      <div className="overflow-x-auto qpm-scroll pb-2">
        <div className="min-w-[920px] relative pl-10 pr-4 py-2 space-y-1.5">
          {/* Vertical Energy Axis Indicator */}
          <div
            aria-hidden="true"
            className="absolute left-3 top-4 bottom-4 w-px bg-slate-300 dark:bg-slate-700 flex flex-col justify-between items-center"
          >
            <span className="-translate-y-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-[#0D111A] px-1">
              High E
            </span>
            <span className="translate-y-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-[#0D111A] px-1">
              1s
            </span>
          </div>

          {ascendingSteps.map((step) => {
            const blockMeta = BLOCK_META[step.block];
            const isActiveStep = selectedElement.differentiatingOrbital === step.id;
            const indent = getStepIndentPx(step.nPlusL, step.block);

            return (
              <div
                key={step.id}
                className="flex items-center gap-2"
                style={{ paddingLeft: `${indent}px` }}
              >
                {/* Step Label */}
                <div
                  className={`w-20 shrink-0 px-2 py-1.5 rounded border text-right font-mono text-xs flex items-center justify-between ${
                    isActiveStep
                      ? 'border-slate-900 dark:border-slate-100 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="text-[10px] opacity-70">n+l={step.nPlusL}</span>
                  <span>{step.label}</span>
                </div>

                {/* Subshell Element Cells */}
                <div className="flex items-center gap-1">
                  {step.elements.map((el) => {
                    const isSelected = el.z === selectedElement.z;
                    const isFilled = el.z <= selectedElement.z;
                    const isDimmedByFilter =
                      familyFilter !== 'all' && el.family !== familyFilter;

                    const theme = getElementCellTheme(el, overlay, isDark);
                    const familyStyle = FAMILY_META[el.family];

                    const staticClasses =
                      overlay === 'block'
                        ? `${blockMeta.bgClass} ${blockMeta.borderClass}`
                        : overlay === 'family'
                          ? `${familyStyle.bgClass} ${familyStyle.borderClass}`
                          : '';

                    return (
                      <button
                        key={el.z}
                        type="button"
                        onClick={() => {
                          setIsPlaying(false);
                          onSelectElement(el);
                        }}
                        style={
                          overlay !== 'block' && overlay !== 'family'
                            ? {
                                backgroundColor: theme.backgroundColor,
                                borderColor: theme.borderColor,
                              }
                            : undefined
                        }
                        className={`w-[54px] h-[50px] rounded border px-1.5 py-1 flex flex-col justify-between text-left transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600 ${staticClasses} ${
                          isSelected
                            ? 'ring-2 ring-slate-900 dark:ring-white scale-105 z-10 shadow-md'
                            : 'hover:scale-105 hover:z-10'
                        } ${
                          isDimmedByFilter
                            ? 'opacity-20'
                            : isFilled
                              ? 'opacity-100'
                              : 'opacity-55 hover:opacity-95'
                        }`}
                        title={`${el.name} (${el.symbol}) · ${el.quantumAddress}`}
                      >
                        <div className="flex items-center justify-between leading-none">
                          <span className="font-mono text-[9px] text-slate-600 dark:text-slate-300">
                            {el.z}
                          </span>
                          <span className="font-mono text-[8.5px] text-slate-500 dark:text-slate-400">
                            {el.subshellLabel}
                          </span>
                        </div>
                        <div className="font-display text-xs font-bold text-slate-900 dark:text-slate-100 leading-none text-center">
                          {el.symbol}
                        </div>
                        <div className="font-mono text-[8px] text-slate-600 dark:text-slate-400 leading-none text-center truncate">
                          {el.valenceElectrons}e⁻
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

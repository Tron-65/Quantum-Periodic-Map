import { Box, Globe2, Layers, Orbit, Pause, Play, Sparkles } from 'lucide-react';
import { type CSSProperties, useId, useMemo, useState } from 'react';
import { ELEMENTS } from '../data/elements';
import { useLanguage } from '../i18n/LanguageContext';
import {
  ChemicalElement,
  ChemicalFamily,
  ColorOverlayMode,
  OrbitalBlock,
} from '../types/element';
import { BLOCK_META, getElementHexColor } from '../utils/quantum';
import { getShellSummaries } from './BohrShellDiagram';
import { SolarSystemAtom } from './SolarSystemAtom';

export type SolarEngine = '3d' | 'svg';
type SvgLayerMode = 'hybrid' | 'discrete' | 'clouds';
type PeriodicSolarSubView = 'all-elements' | 'atom-svg' | 'atom-3d';

interface SolarSystemViewProps {
  element: ChemicalElement;
  /** 'periodic' renders all 118 elements orbiting the central core; 'atom' focuses on one element's shells */
  mode?: 'periodic' | 'atom';
  onSelectElement?: (el: ChemicalElement) => void;
  overlay?: ColorOverlayMode;
  familyFilter?: ChemicalFamily | 'all';
  isDark?: boolean;
  focusedShellN?: number | null;
  onFocusShell?: (n: number | null) => void;
  compact?: boolean;
  engineProp?: SolarEngine;
  onChangeEngine?: (engine: SolarEngine) => void;
}

const SHELL_LETTERS = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];

// Concentric radii for the 7 principal shells in the 118-element periodic solar system (820x820 viewBox)
const PERIODIC_RING_RADII = [76, 114, 154, 200, 248, 304, 362] as const;

// Deterministic deep-space starfield for SVG solar canvases
const ATOM_STARS: Array<{ cx: number; cy: number; r: number; o: number }> = Array.from(
  { length: 48 },
  (_, i) => ({
    cx: Math.round(((i * 97 + 31) % 508) + 6),
    cy: Math.round(((i * 61 + 19) % 428) + 6),
    r: i % 5 === 0 ? 1.3 : 0.8,
    o: 0.22 + (i % 4) * 0.14,
  })
);

const PERIODIC_STARS: Array<{ cx: number; cy: number; r: number; o: number }> = Array.from(
  { length: 76 },
  (_, i) => ({
    cx: Math.round(((i * 137 + 43) % 800) + 10),
    cy: Math.round(((i * 89 + 29) % 800) + 10),
    r: i % 6 === 0 ? 1.4 : 0.85,
    o: 0.18 + (i % 5) * 0.12,
  })
);

/**
 * Orbital period (seconds at 1x speed) scaled by shell proximity n (1..7).
 * Inner shells close to the nucleus revolve much faster than outer valence shells.
 */
function getPeriodicShellPeriodSec(n: number, speed: number): number {
  return (8 + Math.pow(n, 1.38) * 3.6) / speed;
}

export function SolarSystemView({
  element,
  mode = 'atom',
  onSelectElement,
  overlay = 'block',
  familyFilter = 'all',
  focusedShellN: controlledFocusedShellN,
  onFocusShell: controlledOnFocusShell,
  compact = false,
  engineProp,
  onChangeEngine,
}: SolarSystemViewProps) {
  const { isAr, getElementName, getBlockName } = useLanguage();
  const rawUid = useId();
  const uid = rawUid.replace(/:/g, '');

  const [internalEngine, setInternalEngine] = useState<SolarEngine>('3d');
  const [periodicSubView, setPeriodicSubView] =
    useState<PeriodicSolarSubView>('all-elements');
  const [internalFocusedN, setInternalFocusedN] = useState<number | null>(null);
  const [hoveredEl, setHoveredEl] = useState<ChemicalElement | null>(null);
  const [svgMode, setSvgMode] = useState<SvgLayerMode>('hybrid');
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<0.5 | 1 | 2>(1);

  const focusedShellN =
    controlledFocusedShellN !== undefined ? controlledFocusedShellN : internalFocusedN;
  const onFocusShell = controlledOnFocusShell ?? setInternalFocusedN;

  const engine = engineProp ?? internalEngine;
  const setEngine = onChangeEngine ?? setInternalEngine;

  const shells = useMemo(() => getShellSummaries(element), [element]);
  const blockHex = BLOCK_META[element.block].hex;

  // Group all 118 elements by principal shell / period (1..7) sorted in subshell-filling order
  const periodicShells = useMemo(() => {
    return [1, 2, 3, 4, 5, 6, 7].map((n) => {
      const members = ELEMENTS.filter((el) => el.period === n).sort(
        (a, b) => a.col32 - b.col32
      );
      const r = PERIODIC_RING_RADII[n - 1];
      // Stagger initial angular phase per shell for balanced visual spacing
      const phaseOffsetRad = (n * 0.48) % (Math.PI * 2);
      const items = members.map((el, idx) => {
        const angle = (idx / Math.max(members.length, 1)) * Math.PI * 2 + phaseOffsetRad;
        return {
          el,
          px: Math.cos(angle) * r,
          py: Math.sin(angle) * r,
        };
      });
      const basePeriodSec = getPeriodicShellPeriodSec(n, 1);
      const speedRatio = getPeriodicShellPeriodSec(1, 1) / basePeriodSec;
      return {
        n,
        shellLetter: SHELL_LETTERS[n - 1],
        r,
        members,
        items,
        basePeriodSec,
        speedRatio,
      };
    });
  }, []);

  const activePeriodicEl = hoveredEl ?? element;
  const activePeriodicHex = getElementHexColor(activePeriodicEl, overlay);

  const cxAtom = 260;
  const cyAtom = 220;
  const totalShells = Math.max(shells.length, 1);
  const minR = 52;
  const maxR = Math.min(182, 52 + (totalShells - 1) * 23);

  const showPeriodicAllElements =
    mode === 'periodic' && periodicSubView === 'all-elements';
  const showAtom3D =
    (mode === 'atom' && engine === '3d') ||
    (mode === 'periodic' && periodicSubView === 'atom-3d');
  const showAtomSvg =
    (mode === 'atom' && engine === 'svg') ||
    (mode === 'periodic' && periodicSubView === 'atom-svg');

  return (
    <div className="space-y-3">
      {/* Top Engine / Scope Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {mode === 'periodic' ? (
          <div
            role="tablist"
            aria-label={isAr ? 'نطاق عرض النظام الشمسي' : 'Solar system visualization scope'}
            className="inline-flex items-center rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-0.5 overflow-x-auto max-w-full"
          >
            <button
              type="button"
              role="tab"
              aria-selected={periodicSubView === 'all-elements'}
              onClick={() => setPeriodicSubView('all-elements')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                periodicSubView === 'all-elements'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'جميع العناصر (118)' : 'All 118 Elements'}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={periodicSubView === 'atom-svg'}
              onClick={() => setPeriodicSubView('atom-svg')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                periodicSubView === 'atom-svg'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Orbit className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {isAr
                  ? `مسارات إلكترونات ${element.symbol}`
                  : `${element.symbol} Electron Orbits`}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={periodicSubView === 'atom-3d'}
              onClick={() => setPeriodicSubView('atom-3d')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                periodicSubView === 'atom-3d'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'نموذج 3D تفاعلي' : '3D Atom Orrery'}</span>
            </button>
          </div>
        ) : (
          <div
            role="tablist"
            aria-label={isAr ? 'محرك العرض الشمسي للذرة' : 'Solar system visualization engine'}
            className="inline-flex items-center rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-0.5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={engine === '3d'}
              onClick={() => setEngine('3d')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-sm transition-colors cursor-pointer whitespace-nowrap ${
                engine === '3d'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'مدارات تفاعلية 3D' : '3D Interactive Orbits'}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={engine === 'svg'}
              onClick={() => setEngine('svg')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-sm transition-colors cursor-pointer whitespace-nowrap ${
                engine === 'svg'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'مدارات وسحب SVG' : 'SVG Orbits & Clouds'}</span>
            </button>
          </div>
        )}

        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {showPeriodicAllElements
            ? isAr
              ? 'تدور جميع العناصر الـ 118 حول النواة عبر 7 مدارات، وتزداد السرعة المدارية كلما اقترب الغلاف من النواة'
              : 'All 118 elements orbit the nucleus across 7 shells; CSS keyframe orbital velocity scales inversely with shell distance'
            : showAtom3D
              ? isAr
                ? 'نموذج WebGL ثلاثي الأبعاد · اسحب للتدوير ومرّر للتكبير'
                : 'WebGL 3D Orrery · Drag to rotate, scroll to zoom'
              : isAr
                ? 'مسارات كيبلر المتحركة وسحب الاحتمال الإلكترونية بتقنية SVG + CSS'
                : 'Animated SVG + CSS Keplerian Paths & Probability Clouds'}
        </span>
      </div>

      {/* ALL 118 ELEMENTS PERIODIC SOLAR SYSTEM ORRERY */}
      {showPeriodicAllElements && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Left/Main 8 cols: Animated CSS Keyframe 118-Element Solar System */}
          <div className="lg:col-span-8 rounded-lg border border-slate-800 bg-[#060913] overflow-hidden flex flex-col">
            {/* Stage Controls Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border-b border-slate-800 bg-[#0B101E]">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200">
                <span className="font-semibold">
                  {isAr ? 'النظام الشمسي الدوري (118 عنصراً)' : 'Periodic Solar System (118 Elements)'}
                </span>
                <span className="text-slate-500" aria-hidden="true">
                  ·
                </span>
                <span className="font-mono text-amber-400">
                  {activePeriodicEl.symbol} (Z={activePeriodicEl.z})
                </span>
                <span className="font-mono" style={{ color: activePeriodicHex }}>
                  {activePeriodicEl.quantumAddress}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-100 text-slate-900 hover:bg-white cursor-pointer whitespace-nowrap"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3 h-3" aria-hidden="true" />
                      <span>{isAr ? 'إيقاف' : 'Pause'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" aria-hidden="true" />
                      <span>{isAr ? 'مدار' : 'Orbit'}</span>
                    </>
                  )}
                </button>

                <div
                  dir="ltr"
                  className="inline-flex items-center rounded border border-slate-700 overflow-hidden text-[10px] font-mono"
                >
                  {([0.5, 1, 2] as const).map((sp) => (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => setSpeed(sp)}
                      className={`px-2 py-1 cursor-pointer ${
                        speed === sp
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {sp}×
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Cosmic Orbital Canvas */}
            <div dir="ltr" className="relative flex-1 flex items-center justify-center p-2">
              <svg
                viewBox="0 0 820 820"
                role="img"
                aria-label={
                  isAr
                    ? 'عرض النظام الشمسي لجميع العناصر الـ 118 عبر 7 أغلفة مدارية بسرعات تتناسب مع القرب من النواة'
                    : 'Solar system visualization of all 118 periodic elements across 7 concentric orbital shells with CSS keyframe speeds scaled by shell proximity'
                }
                className="w-full max-w-[740px] h-auto select-none block"
              >
                <defs>
                  <radialGradient id={`qpm-periodic-sun-${uid}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FEF9C3" stopOpacity="1" />
                    <stop offset="46%" stopColor="#F59E0B" stopOpacity="0.95" />
                    <stop offset="82%" stopColor={activePeriodicHex} stopOpacity="0.55" />
                    <stop offset="100%" stopColor={activePeriodicHex} stopOpacity="0" />
                  </radialGradient>

                  <radialGradient id={`qpm-periodic-halo-${uid}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.38" />
                    <stop offset="55%" stopColor={activePeriodicHex} stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#060913" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Deep-Space Stars */}
                <g aria-hidden="true">
                  {PERIODIC_STARS.map((s, idx) => (
                    <circle
                      key={idx}
                      cx={s.cx}
                      cy={s.cy}
                      r={s.r}
                      fill="#CBD5E1"
                      opacity={s.o}
                    />
                  ))}
                </g>

                {/* Solar Corona Glow */}
                <circle
                  cx={410}
                  cy={410}
                  r={72}
                  fill={`url(#qpm-periodic-halo-${uid})`}
                  className="qpm-solar-corona"
                  style={{
                    transformOrigin: '410px 410px',
                    animationPlayState: isPlaying ? 'running' : 'paused',
                  }}
                />

                {/* 7 Principal Orbital Shell Rings (n = 1..7) */}
                {periodicShells.map((shell) => {
                  const isFocused = focusedShellN === shell.n;
                  const isSelectedShell = activePeriodicEl.period === shell.n;
                  const isDimmedShell = focusedShellN !== null && focusedShellN !== shell.n;
                  const orbitDurationSec = getPeriodicShellPeriodSec(shell.n, speed);

                  const orbitStyle: CSSProperties = {
                    '--orbit-duration': `${orbitDurationSec.toFixed(2)}s`,
                    transformOrigin: '0px 0px',
                    animationPlayState: isPlaying ? 'running' : 'paused',
                  } as CSSProperties;

                  const ringStroke = isFocused
                    ? '#38BDF8'
                    : isSelectedShell
                      ? '#94A3B8'
                      : '#334155';

                  return (
                    <g key={shell.n} opacity={isDimmedShell ? 0.22 : 1}>
                      {/* Orbit Track Ring */}
                      <circle
                        cx={410}
                        cy={410}
                        r={shell.r}
                        fill="none"
                        stroke={ringStroke}
                        strokeWidth={isFocused ? 1.8 : isSelectedShell ? 1.25 : 0.9}
                        strokeDasharray={shell.n % 2 === 0 ? '5 4' : undefined}
                        strokeOpacity={isFocused ? 0.9 : isSelectedShell ? 0.72 : 0.52}
                        onClick={() => onFocusShell(isFocused ? null : shell.n)}
                        className="cursor-pointer"
                      />

                      {/* Static Shell Proximity Index Tag on 12 o'clock */}
                      <text
                        x={410}
                        y={410 - shell.r - 4}
                        textAnchor="middle"
                        fontSize="8.5"
                        fontFamily="IBM Plex Mono, monospace"
                        fill={isFocused ? '#38BDF8' : isSelectedShell ? '#E2E8F0' : '#64748B'}
                        fontWeight={isFocused || isSelectedShell ? 700 : 500}
                        className="pointer-events-none"
                      >
                        n={shell.n} ({shell.shellLetter}) · {orbitDurationSec.toFixed(1)}s
                      </text>

                      {/* Rotating Orbiting Elements Group (CSS Keyframe Transform) */}
                      <g transform="translate(410, 410)">
                        <g className="qpm-orbit-cw" style={orbitStyle}>
                          {shell.items.map(({ el, px, py }) => {
                            const isSelected = el.z === element.z;
                            const isHovered = hoveredEl?.z === el.z;
                            const isDimmedEl =
                              familyFilter !== 'all' && el.family !== familyFilter;
                            const hex = getElementHexColor(el, overlay);
                            const nodeR = shell.n >= 6 ? 10.2 : shell.n >= 4 ? 11.5 : 13;

                            return (
                              <g
                                key={el.z}
                                transform={`translate(${px}, ${py})`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectElement?.(el);
                                }}
                                onMouseEnter={() => setHoveredEl(el)}
                                onMouseLeave={() => setHoveredEl(null)}
                                className="cursor-pointer"
                                opacity={isDimmedEl ? 0.16 : 1}
                              >
                                {/* Counter-rotating inner group keeps symbols upright while orbiting */}
                                <g className="qpm-counter-cw" style={orbitStyle}>
                                  {(isSelected || isHovered) && (
                                    <circle
                                      r={nodeR + 4}
                                      fill="none"
                                      stroke={isSelected ? '#FFFFFF' : '#38BDF8'}
                                      strokeWidth={1.6}
                                    />
                                  )}
                                  <circle
                                    r={nodeR}
                                    fill={isSelected ? hex : '#0B101E'}
                                    stroke={hex}
                                    strokeWidth={isSelected ? 2 : 1.5}
                                  />
                                  <text
                                    y={0.5}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fontSize={shell.n >= 6 ? '7.8' : '8.8'}
                                    fontWeight="700"
                                    fontFamily="Plus Jakarta Sans, sans-serif"
                                    fill={isSelected ? '#FFFFFF' : '#F1F5F9'}
                                    className="pointer-events-none"
                                  >
                                    {el.symbol}
                                  </text>
                                </g>
                              </g>
                            );
                          })}
                        </g>
                      </g>
                    </g>
                  );
                })}

                {/* Central Nucleus Sun */}
                <g
                  onClick={() => onFocusShell(null)}
                  className="cursor-pointer"
                >
                  <circle cx={410} cy={410} r={46} fill={`url(#qpm-periodic-sun-${uid})`} />
                  <circle
                    cx={410}
                    cy={410}
                    r={33}
                    fill="#0B101E"
                    stroke="#F59E0B"
                    strokeWidth={1.6}
                  />
                  <text
                    x={410}
                    y={399}
                    textAnchor="middle"
                    fontSize="8"
                    fontFamily="IBM Plex Mono, monospace"
                    fontWeight="600"
                    fill="#FCD34D"
                  >
                    {isAr ? 'النواة' : 'NUCLEUS'}
                  </text>
                  <text
                    x={410}
                    y={413}
                    textAnchor="middle"
                    fontSize="12.5"
                    fontWeight="700"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                    fill="#FFFFFF"
                  >
                    {activePeriodicEl.symbol} · Z={activePeriodicEl.z}
                  </text>
                  <text
                    x={410}
                    y={426}
                    textAnchor="middle"
                    fontSize="8"
                    fontFamily="IBM Plex Mono, monospace"
                    fill={activePeriodicHex}
                  >
                    {activePeriodicEl.quantumAddress}
                  </text>
                </g>
              </svg>

              {/* Quick Shell Isolation Overlay */}
              <div className="absolute bottom-2.5 right-3 flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => onFocusShell(null)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded border cursor-pointer ${
                    focusedShellN === null
                      ? 'border-slate-100 bg-slate-100 text-slate-900 font-semibold'
                      : 'border-slate-700 bg-[#0B101E]/95 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {isAr ? 'الكل' : 'All'}
                </button>
                {periodicShells.map((s) => (
                  <button
                    key={s.n}
                    type="button"
                    onClick={() => onFocusShell(focusedShellN === s.n ? null : s.n)}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded border cursor-pointer ${
                      focusedShellN === s.n
                        ? 'border-blue-500 bg-blue-600 text-white font-semibold'
                        : 'border-slate-700 bg-[#0B101E]/95 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    n={s.n}
                  </button>
                ))}
              </div>
            </div>

            {/* Block Color Key Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 border-t border-slate-800 bg-[#0B101E] text-[11px] text-slate-400">
              <div className="flex flex-wrap items-center gap-3">
                {(['s', 'f', 'd', 'p'] as OrbitalBlock[]).map((blk) => (
                  <span key={blk} className="inline-flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: BLOCK_META[blk].hex }}
                    />
                    <span>{getBlockName(blk)}</span>
                  </span>
                ))}
              </div>
              <span className="text-slate-400">
                {isAr
                  ? 'انقر على أي عنصر أو مدار لعزل المستوى الرئيسي n'
                  : 'Click any planet or orbit ring to inspect element or isolate shell n'}
              </span>
            </div>
          </div>

          {/* Right 4 cols: Shell Proximity Speed & Telemetry Deck */}
          <aside className="lg:col-span-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0B101E] p-4 flex flex-col justify-between gap-4">
            {/* Active / Hovered Element Card */}
            <div className="space-y-3">
              <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {isAr ? 'العنصر المداري النشط' : 'ACTIVE ORBITAL ELEMENT'}
                  </div>
                  <div className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">
                    {getElementName(activePeriodicEl)} ({activePeriodicEl.symbol})
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-mono">Z = {activePeriodicEl.z}</span>
                    {' · '}
                    <span className="font-mono" style={{ color: activePeriodicHex }}>
                      {activePeriodicEl.quantumAddress}
                    </span>
                    {' · '}
                    <span className="font-mono">{activePeriodicEl.differentiatingConfig}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPeriodicSubView('atom-svg')}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {isAr ? 'إلكترونات الذرة ←' : 'Electron Paths →'}
                </button>
              </div>

              {/* 7-Shell Proximity Velocity Matrix */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {isAr ? 'السرعة المدارية حسب القرب من النواة' : 'Orbital Speed by Shell Proximity'}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {isAr ? 'الأقرب أسرع' : 'Inner = Fastest'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {periodicShells.map((shell) => {
                    const isFocused = focusedShellN === shell.n;
                    const isActivePeriod = activePeriodicEl.period === shell.n;
                    const periodSec = getPeriodicShellPeriodSec(shell.n, speed);
                    const speedPct = Math.round(shell.speedRatio * 100);

                    return (
                      <button
                        key={shell.n}
                        type="button"
                        onClick={() => onFocusShell(isFocused ? null : shell.n)}
                        className={`w-full text-start px-2.5 py-1.5 rounded border text-xs transition-colors cursor-pointer ${
                          isFocused
                            ? 'border-blue-600 dark:border-blue-400 bg-blue-50/70 dark:bg-blue-950/35'
                            : isActivePeriod
                              ? 'border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-900/80'
                              : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 font-mono">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            n={shell.n} ({shell.shellLetter})
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {isAr ? `${shell.members.length} عنصراً` : `${shell.members.length} el`}
                          </span>
                          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                            {periodSec.toFixed(1)}s · {speedPct}% v
                          </span>
                        </div>
                        <div
                          dir="ltr"
                          className="mt-1 h-1 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden"
                        >
                          <div
                            className="h-full rounded-full bg-blue-600 dark:bg-sky-400"
                            style={{ width: `${speedPct}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-2 border-t border-slate-200 dark:border-slate-800">
              {isAr ? (
                <>
                  تحاكي هذه الحركة الميكانيكا المدارية: تدور عناصر الغلاف الداخلي <span className="font-mono">n=1 (H, He)</span> أسرع بأكثر من 5 أضعاف من عناصر الغلاف السابع <span className="font-mono">n=7 (Fr..Og)</span> الأبعد عن النواة.
                </>
              ) : (
                <>
                  Just like inner planets orbiting closer to the Sun, inner-shell elements in{' '}
                  <span className="font-mono">n=1 (H, He)</span> revolve over 5× faster via CSS{' '}
                  <span className="font-mono">@keyframes</span> than outer Period 7 elements in{' '}
                  <span className="font-mono">n=7 (Fr..Og)</span>.
                </>
              )}
            </p>
          </aside>
        </div>
      )}

      {/* 3D Interactive Orbits Mode */}
      {showAtom3D && (
        <SolarSystemAtom
          element={element}
          focusedShellN={focusedShellN}
          onFocusShell={onFocusShell}
          compact={compact}
        />
      )}

      {/* Animated SVG & CSS Solar System Orrery Mode (Selected Element's Electron Paths) */}
      {showAtomSvg && (
        <div className="rounded-lg border border-slate-800 bg-[#060913] overflow-hidden">
          {/* SVG Stage Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border-b border-slate-800 bg-[#0B101E]">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200">
              <span className="font-mono text-amber-400 font-semibold">
                {element.z}p⁺ {isAr ? 'شمس النواة' : 'Sun'}
              </span>
              <span className="font-semibold">
                {getElementName(element)} ({element.symbol})
              </span>
              <span className="font-mono" style={{ color: blockHex }}>
                {element.quantumAddress}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* Layer style: Combined / Discrete Orbits / Electron Clouds */}
              <div className="inline-flex items-center rounded border border-slate-700 bg-slate-900 p-0.5 text-[11px]">
                {(
                  [
                    { id: 'hybrid', label: isAr ? 'المدارات + السحب' : 'Orbits + Clouds', icon: Layers },
                    { id: 'discrete', label: isAr ? 'مدارات محددة' : 'Discrete Orbits', icon: Orbit },
                    { id: 'clouds', label: isAr ? 'السحب الإلكترونية' : 'Electron Clouds', icon: Sparkles },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  const active = svgMode === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSvgMode(item.id)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3 h-3" aria-hidden="true" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded bg-slate-100 text-slate-900 hover:bg-white cursor-pointer whitespace-nowrap"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3 h-3" aria-hidden="true" />
                    <span>{isAr ? 'إيقاف' : 'Pause'}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" aria-hidden="true" />
                    <span>{isAr ? 'مدار' : 'Orbit'}</span>
                  </>
                )}
              </button>

              <div
                dir="ltr"
                className="inline-flex items-center rounded border border-slate-700 overflow-hidden text-[10px] font-mono"
              >
                {([0.5, 1, 2] as const).map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => setSpeed(sp)}
                    className={`px-1.5 py-1 cursor-pointer ${
                      speed === sp
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {sp}×
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Animated SVG Solar System Canvas */}
          <div dir="ltr" className="relative">
            <svg
              viewBox="0 0 520 440"
              role="img"
              aria-label={
                isAr
                  ? `تمثيل النظام الشمسي لعنصر ${getElementName(element)} يوضح النواة كشمس و${shells.length} أغلفة إلكترونية مدارية`
                  : `Solar system visualization of ${element.name} showing the nucleus as the sun and ${shells.length} orbiting electron shells`
              }
              className={`w-full ${compact ? 'h-[320px] sm:h-[340px]' : 'h-[390px] sm:h-[415px]'} select-none block`}
            >
              <defs>
                {/* Solar Nucleus Radial Glow */}
                <radialGradient id={`qpm-solar-core-${uid}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FEF9C3" stopOpacity="1" />
                  <stop offset="42%" stopColor="#F59E0B" stopOpacity="0.96" />
                  <stop offset="78%" stopColor={blockHex} stopOpacity="0.6" />
                  <stop offset="100%" stopColor={blockHex} stopOpacity="0" />
                </radialGradient>

                <radialGradient id={`qpm-solar-halo-${uid}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.45" />
                  <stop offset="55%" stopColor={blockHex} stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#060913" stopOpacity="0" />
                </radialGradient>

                {/* Subshell Electron Cloud Band Gradients */}
                {(['s', 'f', 'd', 'p'] as const).map((blk) => (
                  <radialGradient
                    key={blk}
                    id={`qpm-cloud-${blk}-${uid}`}
                    cx="50%"
                    cy="50%"
                    r="50%"
                  >
                    <stop offset="68%" stopColor={BLOCK_META[blk].hex} stopOpacity="0" />
                    <stop offset="86%" stopColor={BLOCK_META[blk].hex} stopOpacity="0.24" />
                    <stop offset="100%" stopColor={BLOCK_META[blk].hex} stopOpacity="0" />
                  </radialGradient>
                ))}
              </defs>

              {/* Deep-Space Backdrop Stars */}
              <g aria-hidden="true">
                {ATOM_STARS.map((s, idx) => (
                  <circle
                    key={idx}
                    cx={s.cx}
                    cy={s.cy}
                    r={s.r}
                    fill="#CBD5E1"
                    opacity={s.o}
                  />
                ))}
              </g>

              {/* Outer Solar Halo */}
              <circle
                cx={cxAtom}
                cy={cyAtom}
                r={58}
                fill={`url(#qpm-solar-halo-${uid})`}
                className="qpm-solar-corona"
                style={{
                  transformOrigin: `${cxAtom}px ${cyAtom}px`,
                  animationPlayState: isPlaying ? 'running' : 'paused',
                }}
              />

              {/* Principal Shells (n = 1..period): Electron Clouds + Discrete Orbital Paths */}
              {shells.map((shell) => {
                const t = totalShells === 1 ? 0 : (shell.n - 1) / (totalShells - 1);
                const r = totalShells === 1 ? 94 : minR + t * (maxR - minR);
                const isFocused = focusedShellN === shell.n;
                const isDimmed = focusedShellN !== null && focusedShellN !== shell.n;
                const isOuter = shell.n === element.period;
                const dominantBlock =
                  shell.electronsByBlock[shell.electronsByBlock.length - 1]?.block ??
                  element.block;
                const orbitColor = isFocused
                  ? blockHex
                  : isOuter
                    ? '#94A3B8'
                    : '#475569';

                // Keplerian period scales directly with shell proximity n
                const orbitDurationSec = (3.8 + Math.pow(shell.n, 1.35) * 2.3) / speed;
                const cloudDurationSec = (4.2 + shell.n * 0.6) / speed;
                const orbitClass = shell.n % 2 === 0 ? 'qpm-orbit-ccw' : 'qpm-orbit-cw';

                const orbitStyle: CSSProperties = {
                  '--orbit-duration': `${orbitDurationSec.toFixed(2)}s`,
                  transformOrigin: '0px 0px',
                  animationPlayState: isPlaying ? 'running' : 'paused',
                } as CSSProperties;

                const cloudStyle: CSSProperties = {
                  '--cloud-duration': `${cloudDurationSec.toFixed(2)}s`,
                  transformOrigin: `${cxAtom}px ${cyAtom}px`,
                  animationPlayState: isPlaying ? 'running' : 'paused',
                } as CSSProperties;

                const showCloudBand = svgMode === 'clouds' || svgMode === 'hybrid';
                const showDiscretePath = svgMode === 'discrete' || svgMode === 'hybrid';

                return (
                  <g
                    key={shell.n}
                    onClick={() => onFocusShell(isFocused ? null : shell.n)}
                    className="cursor-pointer"
                    opacity={isDimmed ? 0.22 : 1}
                  >
                    {/* Electron Cloud Radial Probability Shell */}
                    {showCloudBand && (
                      <g className="qpm-cloud-ring" style={cloudStyle}>
                        <circle
                          cx={cxAtom}
                          cy={cyAtom}
                          r={r + 13}
                          fill={`url(#qpm-cloud-${dominantBlock}-${uid})`}
                        />
                        <circle
                          cx={cxAtom}
                          cy={cyAtom}
                          r={r}
                          fill="none"
                          stroke={BLOCK_META[dominantBlock].hex}
                          strokeWidth={svgMode === 'clouds' ? 9 : 5}
                          strokeOpacity={isFocused ? 0.28 : 0.14}
                          strokeDasharray={shell.n % 2 === 0 ? '6 5' : '10 6'}
                        />
                      </g>
                    )}

                    {/* Discrete Keplerian Orbital Track */}
                    {showDiscretePath && (
                      <circle
                        cx={cxAtom}
                        cy={cyAtom}
                        r={r}
                        fill="none"
                        stroke={orbitColor}
                        strokeWidth={isFocused ? 2 : isOuter ? 1.4 : 1}
                        strokeDasharray={
                          shell.containsDifferentiating && !isFocused ? '4 3' : undefined
                        }
                        strokeOpacity={isFocused ? 0.95 : isOuter ? 0.72 : 0.5}
                      />
                    )}

                    {/* Shell Tag on North Pole */}
                    <text
                      x={cxAtom}
                      y={cyAtom - r - 5}
                      textAnchor="middle"
                      fontSize="9"
                      fontFamily="IBM Plex Mono, monospace"
                      fill={isFocused ? '#F8FAFC' : '#94A3B8'}
                      fontWeight={isFocused ? 700 : 500}
                    >
                      n={shell.n} ({shell.totalElectrons}e⁻ · {orbitDurationSec.toFixed(1)}s)
                    </text>

                    {/* Orbiting Electron Planets */}
                    {showDiscretePath && (
                      <g transform={`translate(${cxAtom}, ${cyAtom})`}>
                        <g className={orbitClass} style={orbitStyle}>
                          {shell.dots.map((dot, idx) => {
                            const angle = (idx / Math.max(shell.dots.length, 1)) * Math.PI * 2;
                            const ex = Math.cos(angle) * r;
                            const ey = Math.sin(angle) * r;
                            const eColor = BLOCK_META[dot.block].hex;
                            return (
                              <g key={`${shell.n}-${idx}`}>
                                <circle
                                  cx={ex}
                                  cy={ey}
                                  r={isFocused ? 6.2 : 4.8}
                                  fill={eColor}
                                  fillOpacity={0.28}
                                />
                                <circle
                                  cx={ex}
                                  cy={ey}
                                  r={isFocused ? 3.8 : 3.1}
                                  fill={eColor}
                                  stroke="#060913"
                                  strokeWidth={0.9}
                                />
                              </g>
                            );
                          })}
                        </g>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Central Solar Nucleus ("Sun") */}
              <g onClick={() => onFocusShell(null)} className="cursor-pointer">
                <circle cx={cxAtom} cy={cyAtom} r={34} fill={`url(#qpm-solar-core-${uid})`} />
                <circle
                  cx={cxAtom}
                  cy={cyAtom}
                  r={21}
                  fill="#F59E0B"
                  stroke="#FEF3C7"
                  strokeWidth={1.2}
                />
                <text
                  x={cxAtom}
                  y={cyAtom - 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="13"
                  fontWeight="700"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                  fill="#0B101E"
                >
                  {element.symbol}
                </text>
                <text
                  x={cxAtom}
                  y={cyAtom + 11}
                  textAnchor="middle"
                  fontSize="8.5"
                  fontWeight="600"
                  fontFamily="IBM Plex Mono, monospace"
                  fill="#451A03"
                >
                  {element.z}p⁺
                </text>
              </g>
            </svg>

            {/* Quick Shell Focus Overlay Buttons */}
            <div className="absolute bottom-2.5 right-3 flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => onFocusShell(null)}
                className={`px-2 py-0.5 text-[10px] font-mono rounded border cursor-pointer ${
                  focusedShellN === null
                    ? 'border-slate-100 bg-slate-100 text-slate-900 font-semibold'
                    : 'border-slate-700 bg-[#0B101E]/95 text-slate-300 hover:border-slate-500'
                }`}
              >
                {isAr ? 'الكل' : 'All'}
              </button>
              {shells.map((s) => (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => onFocusShell(focusedShellN === s.n ? null : s.n)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded border cursor-pointer ${
                    focusedShellN === s.n
                      ? 'border-blue-500 bg-blue-600 text-white font-semibold'
                      : 'border-slate-700 bg-[#0B101E]/95 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  n={s.n}
                </button>
              ))}
            </div>
          </div>

          {/* Subshell Color Key Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 border-t border-slate-800 bg-[#0B101E] text-[11px] text-slate-400">
            <div className="flex flex-wrap items-center gap-3">
              {(['s', 'f', 'd', 'p'] as const).map((blk) => (
                <span key={blk} className="inline-flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: BLOCK_META[blk].hex }}
                  />
                  <span>{isAr ? `المدار ${blk}` : `${blk}-orbital`}</span>
                </span>
              ))}
            </div>
            <span className="text-slate-400">
              {isAr
                ? 'انقر على أي حلقة مدارية لعزل المستوى الرئيسي n'
                : 'Click any orbit ring to isolate principal level n'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

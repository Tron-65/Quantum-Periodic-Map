import { Pause, Play } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ChemicalElement, OrbitalBlock } from '../types/element';
import { BLOCK_META, parseSubshells } from '../utils/quantum';

interface BohrShellDiagramProps {
  element: ChemicalElement;
  isDark: boolean;
  compact?: boolean;
  /** Controlled orbital animation state (used to sync comparison mode) */
  animateProp?: boolean;
  onToggleAnimate?: () => void;
  /** Optional controlled focused shell n (1..7) */
  focusedShellN?: number | null;
  onFocusShell?: (n: number | null) => void;
}

export interface ShellSummary {
  n: number;
  shellLetter: string;
  totalElectrons: number;
  maxCapacity: number;
  electronsByBlock: Array<{ block: OrbitalBlock; subshell: string; count: number }>;
  dots: Array<{ block: OrbitalBlock; subshell: string }>;
  containsDifferentiating: boolean;
}

const SHELL_LETTERS = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];

export function getShellSummaries(element: ChemicalElement): ShellSummary[] {
  const parsed = parseSubshells(element.fullConfig);
  const maxN = Math.max(element.period, ...parsed.map((p) => p.n));
  const map = new Map<number, ShellSummary>();

  for (let n = 1; n <= maxN; n++) {
    map.set(n, {
      n,
      shellLetter: SHELL_LETTERS[n - 1] ?? `n${n}`,
      totalElectrons: 0,
      maxCapacity: 2 * n * n,
      electronsByBlock: [],
      dots: [],
      containsDifferentiating: false,
    });
  }

  for (const sub of parsed) {
    const shell = map.get(sub.n);
    if (!shell) continue;
    shell.totalElectrons += sub.electrons;
    if (sub.subshell === element.differentiatingOrbital) {
      shell.containsDifferentiating = true;
    }
    shell.electronsByBlock.push({
      block: sub.block,
      subshell: sub.subshell,
      count: sub.electrons,
    });
    for (let i = 0; i < sub.electrons; i++) {
      shell.dots.push({ block: sub.block, subshell: sub.subshell });
    }
  }

  return Array.from(map.values()).filter((s) => s.totalElectrons > 0 || s.n <= element.period);
}

export function BohrShellDiagram({
  element,
  isDark,
  compact = false,
  animateProp,
  onToggleAnimate,
  focusedShellN: controlledShellN,
  onFocusShell,
}: BohrShellDiagramProps) {
  const [internalAnimate, setInternalAnimate] = useState(true);
  const [internalSelectedN, setInternalSelectedN] = useState<number | null>(null);
  const [hoveredShellN, setHoveredShellN] = useState<number | null>(null);
  const [speedMultiplier, setSpeedMultiplier] = useState<0.5 | 1 | 2>(1);
  const [phase, setPhase] = useState(0);

  const isAnimating = animateProp !== undefined ? animateProp : internalAnimate;
  const toggleAnimate =
    onToggleAnimate ?? (() => setInternalAnimate((prev) => !prev));

  const lockedShellN = controlledShellN !== undefined ? controlledShellN : internalSelectedN;
  const setLockedShellN = onFocusShell ?? setInternalSelectedN;

  // Reset locked shell if new element has fewer shells
  useEffect(() => {
    if (lockedShellN !== null && lockedShellN > element.period) {
      setLockedShellN(null);
    }
  }, [element.period, lockedShellN, setLockedShellN]);

  // Smooth orbital motion respecting prefers-reduced-motion
  useEffect(() => {
    if (!isAnimating) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    let rafId = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setPhase((p) => (p + dt * 0.55 * speedMultiplier) % (Math.PI * 200));
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isAnimating, speedMultiplier]);

  const shells = useMemo(() => getShellSummaries(element), [element]);
  const blockMeta = BLOCK_META[element.block];

  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const minRingR = 38;
  const maxRingR = 148;
  const totalRings = Math.max(shells.length, 1);

  const getRingRadius = (n: number) => {
    if (totalRings === 1) return 78;
    const t = (n - 1) / (totalRings - 1);
    return minRingR + t * (maxRingR - minRingR);
  };

  const highlightedN = hoveredShellN ?? lockedShellN;
  const activeShellInfo =
    shells.find((s) => s.n === highlightedN) ??
    shells.find((s) => s.containsDifferentiating) ??
    shells[shells.length - 1];

  return (
    <div className="flex flex-col gap-3">
      {/* Top Controls: Shell Vector + Speed + Play/Pause */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-mono text-slate-600 dark:text-slate-400">
          Shells ({shells.map((s) => s.totalElectrons).join(' · ')})
        </div>

        <div className="flex items-center gap-1.5">
          {!compact && (
            <div className="flex items-center rounded border border-slate-200 dark:border-slate-700 overflow-hidden text-[10px] font-mono">
              {([0.5, 1, 2] as const).map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => setSpeedMultiplier(sp)}
                  className={`px-1.5 py-0.5 cursor-pointer transition-colors ${
                    speedMultiplier === sp
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {sp}×
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={toggleAnimate}
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            {isAnimating ? (
              <>
                <Pause className="w-3 h-3" aria-hidden="true" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3" aria-hidden="true" />
                <span>Animate</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive SVG Bohr Shell Model */}
      <div className={`w-full mx-auto ${compact ? 'max-w-[270px]' : 'max-w-[330px]'}`}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-auto select-none"
          role="img"
          aria-label={`Bohr-style shell occupation diagram for ${element.name}, principal energy level n=${element.period}`}
        >
          {/* Principal Energy Rings */}
          {shells.map((shell) => {
            const r = getRingRadius(shell.n);
            const isActive = highlightedN === shell.n;
            const isDimmed = highlightedN !== null && highlightedN !== shell.n;
            const isValenceShell = shell.n === element.period;

            const ringColor = isActive
              ? blockMeta.hex
              : isValenceShell
                ? isDark
                  ? '#64748B'
                  : '#94A3B8'
                : isDark
                  ? '#1E293B'
                  : '#CBD5E1';

            return (
              <g
                key={shell.n}
                onMouseEnter={() => setHoveredShellN(shell.n)}
                onMouseLeave={() => setHoveredShellN(null)}
                onClick={() =>
                  setLockedShellN(lockedShellN === shell.n ? null : shell.n)
                }
                className="cursor-pointer"
                style={{ opacity: isDimmed ? 0.35 : 1 }}
              >
                {/* Invisible wider hit ring for effortless hover/click */}
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="transparent" strokeWidth={14} />
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={ringColor}
                  strokeWidth={isActive ? 2.2 : isValenceShell ? 1.5 : 1}
                  strokeDasharray={isValenceShell || isActive ? undefined : '3 3'}
                />

                {/* Shell index label along 45 deg top-right */}
                <text
                  x={cx + r * 0.707}
                  y={cy - r * 0.707 - 4}
                  textAnchor="middle"
                  className="font-mono text-[9px] font-semibold"
                  fill={isActive ? blockMeta.hex : isDark ? '#64748B' : '#94A3B8'}
                >
                  n={shell.n}
                </text>

                {/* Electron markers colored by orbital subshell */}
                {shell.dots.map((dot, idx) => {
                  const count = shell.dots.length;
                  const dir = shell.n % 2 === 0 ? -1 : 1;
                  const speedFactor = 1 / (0.65 + shell.n * 0.35);
                  const angle =
                    (idx / Math.max(count, 1)) * Math.PI * 2 -
                    Math.PI / 2 +
                    dir * phase * speedFactor;
                  const ex = cx + r * Math.cos(angle);
                  const ey = cy + r * Math.sin(angle);
                  const dotHex = BLOCK_META[dot.block].hex;
                  const isDiffDot = dot.subshell === element.differentiatingOrbital;

                  return (
                    <circle
                      key={`${shell.n}-${idx}`}
                      cx={ex}
                      cy={ey}
                      r={
                        isActive
                          ? 4.6
                          : isDiffDot
                            ? compact
                              ? 3.8
                              : 4.2
                            : compact
                              ? 3.2
                              : 3.6
                      }
                      fill={dotHex}
                      stroke={isDark ? '#0D111A' : '#FFFFFF'}
                      strokeWidth={1}
                    >
                      <title>{`${dot.subshell} electron (n=${shell.n}, ${shell.shellLetter}-shell)`}</title>
                    </circle>
                  );
                })}
              </g>
            );
          })}

          {/* Nucleus Core */}
          <g
            onClick={() => setLockedShellN(null)}
            className="cursor-pointer"
          >
            <circle
              cx={cx}
              cy={cy}
              r={22}
              fill={isDark ? '#0F172A' : '#FFFFFF'}
              stroke={blockMeta.hex}
              strokeWidth={2}
            />
            <text
              x={cx}
              y={cy - 2}
              textAnchor="middle"
              dominantBaseline="middle"
              className="font-display text-[13px] font-bold"
              fill={isDark ? '#F8FAFC' : '#0F172A'}
            >
              {element.symbol}
            </text>
            <text
              x={cx}
              y={cy + 11}
              textAnchor="middle"
              dominantBaseline="middle"
              className="font-mono text-[8.5px]"
              fill={isDark ? '#94A3B8' : '#64748B'}
            >
              {element.z}p⁺
            </text>
          </g>
        </svg>
      </div>

      {/* Clickable Principal Shell Selector Buttons (touch & keyboard accessible) */}
      <div className="flex flex-wrap items-center justify-center gap-1">
        {shells.map((shell) => {
          const isSelected = lockedShellN === shell.n;
          return (
            <button
              key={shell.n}
              type="button"
              onClick={() => setLockedShellN(isSelected ? null : shell.n)}
              onMouseEnter={() => setHoveredShellN(shell.n)}
              onMouseLeave={() => setHoveredShellN(null)}
              className={`px-2 py-0.5 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
                isSelected
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 font-semibold'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-slate-400'
              }`}
              title={`Inspect shell n=${shell.n} (${shell.shellLetter}-shell)`}
            >
              n={shell.n} ({shell.totalElectrons})
            </button>
          );
        })}
      </div>

      {/* Active / Hovered Shell Occupation Breakdown */}
      {activeShellInfo && (
        <div className="px-3 py-2 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 text-xs space-y-1">
          <div className="flex items-center justify-between font-mono">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              n = {activeShellInfo.n} ({activeShellInfo.shellLetter}-shell)
              {activeShellInfo.n === element.period ? ' · Outer' : ''}
              {activeShellInfo.containsDifferentiating ? ' · Active' : ''}
            </span>
            <span className="text-slate-600 dark:text-slate-300">
              {activeShellInfo.totalElectrons} / {activeShellInfo.maxCapacity} e⁻
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-500 dark:text-slate-400">
            {activeShellInfo.electronsByBlock.map((part) => (
              <span key={part.subshell} className="inline-flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-xs"
                  style={{ backgroundColor: BLOCK_META[part.block].hex }}
                  aria-hidden="true"
                />
                <span>
                  {part.subshell}
                  <sup>{part.count}</sup>
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

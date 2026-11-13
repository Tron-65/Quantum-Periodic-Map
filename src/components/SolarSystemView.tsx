import { Box, Layers, Orbit, Pause, Play, Sparkles } from 'lucide-react';
import { type CSSProperties, useMemo, useState } from 'react';
import { ChemicalElement } from '../types/element';
import { BLOCK_META } from '../utils/quantum';
import { getShellSummaries } from './BohrShellDiagram';
import { SolarSystemAtom } from './SolarSystemAtom';

interface SolarSystemViewProps {
  element: ChemicalElement;
  focusedShellN: number | null;
  onFocusShell: (n: number | null) => void;
}

type SolarEngine = '3d' | 'svg';
type SvgLayerMode = 'hybrid' | 'discrete' | 'clouds';

const STARS: Array<{ cx: number; cy: number; r: number; o: number }> = Array.from(
  { length: 48 },
  (_, i) => ({
    cx: Math.round(((i * 97 + 31) % 508) + 6),
    cy: Math.round(((i * 61 + 19) % 428) + 6),
    r: i % 5 === 0 ? 1.3 : 0.8,
    o: 0.22 + (i % 4) * 0.14,
  })
);

export function SolarSystemView({
  element,
  focusedShellN,
  onFocusShell,
}: SolarSystemViewProps) {
  const [engine, setEngine] = useState<SolarEngine>('3d');
  const [svgMode, setSvgMode] = useState<SvgLayerMode>('hybrid');
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<0.5 | 1 | 2>(1);

  const shells = useMemo(() => getShellSummaries(element), [element]);
  const blockHex = BLOCK_META[element.block].hex;

  const cx = 260;
  const cy = 220;
  const totalShells = Math.max(shells.length, 1);
  const minR = 52;
  const maxR = Math.min(182, 52 + (totalShells - 1) * 23);

  return (
    <div className="space-y-3">
      {/* Top Engine Switcher: 3D Interactive Orbits vs Animated SVG Orbits & Electron Clouds */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          role="tablist"
          aria-label="Solar system visualization engine"
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
            <span>3D Interactive Orbits</span>
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
            <span>SVG Orbits &amp; Clouds</span>
          </button>
        </div>

        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
          {engine === '3d'
            ? 'WebGL 3D Orrery · Drag to rotate, scroll to zoom'
            : 'Animated SVG + CSS Keplerian Paths & Probability Clouds'}
        </span>
      </div>

      {/* 3D Interactive Orbits Mode */}
      {engine === '3d' && (
        <SolarSystemAtom
          element={element}
          focusedShellN={focusedShellN}
          onFocusShell={onFocusShell}
        />
      )}

      {/* Animated SVG & CSS Solar System Orrery Mode */}
      {engine === 'svg' && (
        <div className="rounded-lg border border-slate-800 bg-[#060913] overflow-hidden">
          {/* SVG Stage Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border-b border-slate-800 bg-[#0B101E]">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200">
              <span className="font-mono text-amber-400 font-semibold">{element.z}p⁺ Sun</span>
              <span className="font-semibold">
                {element.name} ({element.symbol})
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
                    { id: 'hybrid', label: 'Orbits + Clouds', icon: Layers },
                    { id: 'discrete', label: 'Discrete Orbits', icon: Orbit },
                    { id: 'clouds', label: 'Electron Clouds', icon: Sparkles },
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
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" aria-hidden="true" />
                    <span>Orbit</span>
                  </>
                )}
              </button>

              <div className="inline-flex items-center rounded border border-slate-700 overflow-hidden text-[10px] font-mono">
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
          <div className="relative">
            <svg
              viewBox="0 0 520 440"
              role="img"
              aria-label={`Solar system visualization of ${element.name} showing the nucleus as the sun and ${shells.length} orbiting electron shells`}
              className="w-full h-[390px] sm:h-[415px] select-none block"
            >
              <defs>
                {/* Solar Nucleus Radial Glow */}
                <radialGradient id="qpm-solar-core" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FEF9C3" stopOpacity="1" />
                  <stop offset="42%" stopColor="#F59E0B" stopOpacity="0.96" />
                  <stop offset="78%" stopColor={blockHex} stopOpacity="0.6" />
                  <stop offset="100%" stopColor={blockHex} stopOpacity="0" />
                </radialGradient>

                <radialGradient id="qpm-solar-halo" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.45" />
                  <stop offset="55%" stopColor={blockHex} stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#060913" stopOpacity="0" />
                </radialGradient>

                {/* Subshell Electron Cloud Band Gradients */}
                {(['s', 'f', 'd', 'p'] as const).map((blk) => (
                  <radialGradient
                    key={blk}
                    id={`qpm-cloud-${blk}`}
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
                {STARS.map((s, idx) => (
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
                cx={cx}
                cy={cy}
                r={58}
                fill="url(#qpm-solar-halo)"
                className="qpm-solar-corona"
                style={{
                  transformOrigin: `${cx}px ${cy}px`,
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

                // Keplerian period increases with principal shell radius
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
                  transformOrigin: `${cx}px ${cy}px`,
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
                          cx={cx}
                          cy={cy}
                          r={r + 13}
                          fill={`url(#qpm-cloud-${dominantBlock})`}
                        />
                        <circle
                          cx={cx}
                          cy={cy}
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
                        cx={cx}
                        cy={cy}
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
                      x={cx}
                      y={cy - r - 5}
                      textAnchor="middle"
                      fontSize="9"
                      fontFamily="IBM Plex Mono, monospace"
                      fill={isFocused ? '#F8FAFC' : '#94A3B8'}
                      fontWeight={isFocused ? 700 : 500}
                    >
                      n={shell.n} ({shell.totalElectrons}e⁻)
                    </text>

                    {/* Orbiting Electron Planets */}
                    {showDiscretePath && (
                      <g transform={`translate(${cx}, ${cy})`}>
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
              <g
                onClick={() => onFocusShell(null)}
                className="cursor-pointer"
              >
                <circle cx={cx} cy={cy} r={34} fill="url(#qpm-solar-core)" />
                <circle
                  cx={cx}
                  cy={cy}
                  r={21}
                  fill="#F59E0B"
                  stroke="#FEF3C7"
                  strokeWidth={1.2}
                />
                <text
                  x={cx}
                  y={cy - 1}
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
                  x={cx}
                  y={cy + 11}
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
                All
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
                <span key={blk} className="inline-flex items-center gap-1.5 font-mono">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: BLOCK_META[blk].hex }}
                  />
                  <span>{blk}-orbital</span>
                </span>
              ))}
            </div>
            <span className="font-mono text-slate-400">
              Click any orbit ring to isolate principal level n
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

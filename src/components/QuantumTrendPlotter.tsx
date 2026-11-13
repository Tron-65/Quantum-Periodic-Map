import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ELEMENTS } from '../data/elements';
import { ChemicalElement, OrbitalBlock } from '../types/element';
import { BLOCK_META, getValenceFamilyNeighbors } from '../utils/quantum';

interface QuantumTrendPlotterProps {
  selectedElement: ChemicalElement;
  onSelectElement: (el: ChemicalElement) => void;
  isDark: boolean;
}

type TrendMetric = 'ionization' | 'electronegativity';
type TrendScope = 'period' | 'group';

interface ChartDatum {
  key: string;
  label: string;
  subLabel: string;
  z: number;
  symbol: string;
  name: string;
  block: OrbitalBlock;
  quantumAddress: string;
  differentiatingConfig: string;
  valenceElectrons: number;
  value: number | null;
  deltaFromPrev: number | null;
  element: ChemicalElement;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDatum }>;
  metric: TrendMetric;
}

function TrendTooltip({ active, payload, metric }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload;
  const blockMeta = BLOCK_META[item.block];

  const deltaLabel =
    item.deltaFromPrev !== null
      ? `${item.deltaFromPrev > 0 ? '+' : item.deltaFromPrev < 0 ? '−' : ''}${Math.abs(
          item.deltaFromPrev
        ).toFixed(2)}${metric === 'ionization' ? ' eV' : ''}`
      : null;

  return (
    <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-slate-700 rounded-md px-3.5 py-2.5 shadow-md text-xs min-w-[215px]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-display font-bold text-slate-900 dark:text-slate-100">
          <span
            className="w-2 h-2 rounded-xs shrink-0"
            style={{ backgroundColor: blockMeta.hex }}
            aria-hidden="true"
          />
          <span>
            {item.name} ({item.symbol})
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
          Z={item.z}
        </span>
      </div>

      <div className="font-mono text-[11px] mt-1 flex items-center justify-between gap-2" style={{ color: blockMeta.hex }}>
        <span>{item.quantumAddress}</span>
        <span>
          {item.differentiatingConfig} · {item.valenceElectrons}e⁻
        </span>
      </div>

      <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-1 font-mono">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
            {metric === 'ionization' ? '1st Ionization' : 'Electronegativity'}
          </span>
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            {item.value !== null
              ? metric === 'ionization'
                ? `${item.value.toFixed(2)} eV`
                : `${item.value.toFixed(2)} χ`
              : 'Undefined'}
          </span>
        </div>

        {metric === 'ionization' && item.value !== null && (
          <div className="flex items-baseline justify-between gap-3 text-[10px] text-slate-500 dark:text-slate-400">
            <span className="font-sans">Molar Equivalent</span>
            <span>{Math.round(item.value * 96.485).toLocaleString()} kJ/mol</span>
          </div>
        )}

        {deltaLabel && (
          <div className="flex items-baseline justify-between gap-3 text-[10px]">
            <span className="font-sans text-slate-500 dark:text-slate-400">Step Δ</span>
            <span
              className={
                item.deltaFromPrev! > 0
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : item.deltaFromPrev! < 0
                    ? 'text-rose-600 dark:text-rose-400 font-semibold'
                    : 'text-slate-500'
              }
            >
              {deltaLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function getQuantumInsight(
  metric: TrendMetric,
  scope: TrendScope,
  selected: ChemicalElement
): string {
  if (scope === 'period') {
    if (metric === 'ionization') {
      if (selected.period === 1) {
        return 'Period 1 fills only the 1s orbital: Helium’s unshielded 1s² pair experiences doubled nuclear charge, producing the highest ionization energy of all elements (24.59 eV).';
      }
      if (selected.period === 2 || selected.period === 3) {
        return `Across Period ${selected.period}, rising Z_eff drives ionization energy upward, punctuated by two quantum kinks: a drop at s² → p¹ (new higher-energy p subshell) and at p³ → p⁴ (spin-pairing repulsion in a half-filled p orbital).`;
      }
      if (selected.period === 4 || selected.period === 5) {
        return `Across Period ${selected.period}, the d¹–d¹⁰ transition band forms a nearly flat ionization plateau because inner (n−1)d electrons shield outer ns² electrons effectively before p-block ionization climbs sharply.`;
      }
      return `Across Period ${selected.period}, filling 14 inner f-electrons (f¹–f¹⁴) barely alters outer s² ionization energy while lanthanide/actinide contraction gradually tightens the subsequent 5d/6d band.`;
    }
    // Electronegativity across period
    if (selected.period <= 3) {
      return `Across Period ${selected.period}, electronegativity climbs monotonically from the electropositive s¹ alkali metal to the p⁵ halogen as valence nuclear attraction increases within the same principal shell.`;
    }
    return `Across Period ${selected.period}, electronegativity rises modestly across the d-block plateau (with subtle exchange dips at half-filled d⁵), then steepens sharply across the p¹–p⁵ orbitals.`;
  }

  // Group scope
  if (metric === 'ionization') {
    return `Moving down the ${selected.subshellLabel} valence sequence (n = 1..7), each added principal shell places the active orbital farther from the nucleus and increases core shielding—lowering ionization energy, except where 4f/5d relativistic contraction stabilizes Period 6–7 shells.`;
  }
  return `Moving down the ${selected.subshellLabel} valence sequence, larger atomic radii and heavier inner-shell screening generally reduce Pauling electronegativity, though d-block and lanthanide contractions cause slight Period 5–6 reversals (e.g., Au, Pb).`;
}

export function QuantumTrendPlotter({
  selectedElement,
  onSelectElement,
  isDark,
}: QuantumTrendPlotterProps) {
  const [metric, setMetric] = useState<TrendMetric>('ionization');
  const [scope, setScope] = useState<TrendScope>('period');

  const seriesElements = useMemo(() => {
    if (scope === 'period') {
      return ELEMENTS.filter((el) => el.period === selectedElement.period).sort(
        (a, b) => a.col32 - b.col32
      );
    }
    return getValenceFamilyNeighbors(selectedElement);
  }, [scope, selectedElement]);

  const chartData: ChartDatum[] = useMemo(() => {
    return seriesElements.map((el, idx) => {
      const value = metric === 'ionization' ? el.ionizationEnergy : el.electronegativity;
      const prevEl = idx > 0 ? seriesElements[idx - 1] : null;
      const prevValue =
        prevEl !== null
          ? metric === 'ionization'
            ? prevEl.ionizationEnergy
            : prevEl.electronegativity
          : null;
      const deltaFromPrev =
        value !== null && prevValue !== null ? value - prevValue : null;

      return {
        key: `${el.z}`,
        label: scope === 'period' ? el.symbol : `${el.symbol} (P${el.period})`,
        subLabel: el.subshellLabel,
        z: el.z,
        symbol: el.symbol,
        name: el.name,
        block: el.block,
        quantumAddress: el.quantumAddress,
        differentiatingConfig: el.differentiatingConfig,
        valenceElectrons: el.valenceElectrons,
        value,
        deltaFromPrev,
        element: el,
      };
    });
  }, [seriesElements, scope, metric]);

  const blockSpans = useMemo(() => {
    if (scope !== 'period' || chartData.length === 0) return [];
    const spans: Array<{ block: OrbitalBlock; x1: string; x2: string }> = [];
    let currentBlock: OrbitalBlock = chartData[0].block;
    let startLabel = chartData[0].label;

    for (let i = 1; i < chartData.length; i++) {
      if (chartData[i].block !== currentBlock) {
        spans.push({
          block: currentBlock,
          x1: startLabel,
          x2: chartData[i - 1].label,
        });
        currentBlock = chartData[i].block;
        startLabel = chartData[i].label;
      }
    }
    spans.push({
      block: currentBlock,
      x1: startLabel,
      x2: chartData[chartData.length - 1].label,
    });
    return spans;
  }, [scope, chartData]);

  const selectedPoint = chartData.find((d) => d.z === selectedElement.z);
  const hasAnyValues = chartData.some((d) => d.value !== null);

  const gridStroke = isDark ? '#1E293B' : '#E2E8F0';
  const axisTickColor = isDark ? '#94A3B8' : '#64748B';
  const lineStroke = isDark ? '#38BDF8' : '#0284C7';

  return (
    <section
      id="quantum-trends"
      aria-label="Quantum Periodic Trend Plotter"
      className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-slate-800 rounded-lg p-5 sm:p-6 space-y-4"
    >
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-0.5">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">
            Quantum Trend Plotter
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {scope === 'period'
              ? `Period ${selectedElement.period} subshell progression (${seriesElements.length} elements · s → f → d → p)`
              : `Valence column ${selectedElement.subshellLabel} across principal shells (${seriesElements.length} elements)`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Metric Segmented Switch */}
          <div
            role="group"
            aria-label="Trend property"
            className="flex items-center gap-1 p-1 rounded-md bg-slate-100 dark:bg-slate-900"
          >
            <button
              type="button"
              onClick={() => setMetric('ionization')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap cursor-pointer ${
                metric === 'ionization'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Ionization Energy (eV)
            </button>
            <button
              type="button"
              onClick={() => setMetric('electronegativity')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap cursor-pointer ${
                metric === 'electronegativity'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Electronegativity (Pauling)
            </button>
          </div>

          {/* Axis Scope Segmented Switch */}
          <div
            role="group"
            aria-label="Trend axis scope"
            className="flex items-center gap-1 p-1 rounded-md bg-slate-100 dark:bg-slate-900"
          >
            <button
              type="button"
              onClick={() => setScope('period')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap cursor-pointer ${
                scope === 'period'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Period P{selectedElement.period}
            </button>
            <button
              type="button"
              onClick={() => setScope('group')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap cursor-pointer ${
                scope === 'group'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Group {selectedElement.subshellLabel}
            </button>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      {!hasAnyValues ? (
        <div className="h-[260px] flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 px-4 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
            Pauling electronegativity values are not experimentally defined for any elements in this{' '}
            <span className="font-mono">{selectedElement.subshellLabel}</span> series.
          </p>
          <button
            type="button"
            onClick={() => setMetric('ionization')}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 cursor-pointer"
          >
            Plot Ionization Energy (eV) Instead
          </button>
        </div>
      ) : (
        <div className="w-full h-[270px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 22, right: 18, left: 4, bottom: 10 }}
              onClick={(state) => {
                const idx = Number(state?.activeTooltipIndex);
                if (!Number.isNaN(idx) && chartData[idx]) {
                  onSelectElement(chartData[idx].element);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />

              {/* Orbital block background bands in Period mode */}
              {blockSpans.map((span) => (
                <ReferenceArea
                  key={`${span.block}-${span.x1}`}
                  x1={span.x1}
                  x2={span.x2}
                  fill={BLOCK_META[span.block].hex}
                  fillOpacity={isDark ? 0.1 : 0.06}
                  label={{
                    value: `${span.block}-block`,
                    position: 'insideTopLeft',
                    fill: BLOCK_META[span.block].hex,
                    fontSize: 10,
                    fontFamily: 'IBM Plex Mono, monospace',
                    fontWeight: 600,
                  }}
                />
              ))}

              <XAxis
                dataKey="label"
                tick={{ fill: axisTickColor, fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}
                axisLine={{ stroke: gridStroke }}
                tickLine={false}
                interval={chartData.length > 20 ? 1 : 0}
              />

              <YAxis
                tick={{ fill: axisTickColor, fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}
                axisLine={false}
                tickLine={false}
                width={46}
                domain={metric === 'ionization' ? [0, 'auto'] : [0, 4.2]}
                tickFormatter={(v: number) => (metric === 'ionization' ? `${v}` : v.toFixed(1))}
                label={{
                  value: metric === 'ionization' ? 'eV' : 'χ (Pauling)',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 10,
                  fill: axisTickColor,
                  fontSize: 10,
                  fontFamily: 'IBM Plex Mono, monospace',
                }}
              />

              <Tooltip
                trigger="hover"
                isAnimationActive={false}
                allowEscapeViewBox={{ x: false, y: true }}
                wrapperStyle={{ pointerEvents: 'none', zIndex: 20 }}
                content={<TrendTooltip metric={metric} />}
                cursor={{ stroke: isDark ? '#475569' : '#94A3B8', strokeDasharray: '3 3' }}
              />

              {selectedPoint && (
                <ReferenceLine
                  x={selectedPoint.label}
                  stroke={BLOCK_META[selectedElement.block].hex}
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                />
              )}

              <Line
                type="monotone"
                dataKey="value"
                stroke={lineStroke}
                strokeWidth={2}
                connectNulls={false}
                isAnimationActive={false}
                dot={(dotProps) => {
                  const { cx, cy, payload } = dotProps as {
                    cx?: number;
                    cy?: number;
                    payload?: ChartDatum;
                  };
                  if (cx === undefined || cy === undefined || !payload || payload.value === null) {
                    return <g key={`empty-${payload?.z ?? Math.random()}`} />;
                  }
                  const isSelected = payload.z === selectedElement.z;
                  const fillHex = BLOCK_META[payload.block].hex;
                  return (
                    <g
                      key={payload.z}
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectElement(payload.element);
                      }}
                    >
                      {isSelected && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={8}
                          fill="none"
                          stroke={isDark ? '#FFFFFF' : '#0F172A'}
                          strokeWidth={2}
                        />
                      )}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isSelected ? 5 : 4}
                        fill={fillHex}
                        stroke={isDark ? '#0D111A' : '#FFFFFF'}
                        strokeWidth={1.5}
                      />
                    </g>
                  );
                }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Explicit Quantum Trend Explanation Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
          <span className="font-semibold text-slate-900 dark:text-slate-100">Quantum Trend: </span>
          {getQuantumInsight(metric, scope, selectedElement)}
        </p>
        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
          Click any node on the curve to inspect
        </span>
      </div>
    </section>
  );
}

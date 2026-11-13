import { useMemo, useState } from 'react';
import { ELEMENTS } from '../data/elements';
import { useLanguage } from '../i18n/LanguageContext';
import { ChemicalElement, ChemicalFamily, ColorOverlayMode, OrbitalBlock } from '../types/element';
import { BLOCK_META, getElementHexColor } from '../utils/quantum';

interface RadialCoreViewProps {
  selectedElement: ChemicalElement;
  onSelectElement: (el: ChemicalElement) => void;
  overlay: ColorOverlayMode;
  familyFilter: ChemicalFamily | 'all';
  isDark: boolean;
}

const CENTER = 460;
const INNER_RADIUS = 72;
const RING_STEP = 53;

/**
 * Angular sector layout (degrees, 0 = top / 12 o'clock, clockwise):
 * - p-Block (6 slots): top sector (-32° to +32°)
 * - d-Block (10 slots): right sector (+52° to +132°)
 * - f-Block (14 slots): bottom sector (+148° to +268°) -> wait: let's distribute cleanly around 360°!
 *   Let's allocate proportional + comfortable spacing:
 *   - p-Block (6 cols): -34° to +34° (top)
 *   - d-Block (10 cols): +52° to +142° (right)
 *   - f-Block (14 cols): +158° to +268° (bottom / bottom-left)
 *   - s-Block (2 cols): +288° to +308° (left)
 *   Wait: let's check symmetry:
 *   Top: p-block (6) -> -32° to +32° (64° span, ~12.8° per step)
 *   Right: d-block (10) -> +54° to +144° (90° span, 10° per step)
 *   Bottom: f-block (14) -> +162° to +266° (104° span, 8° per step)
 *   Left: s-block (2) -> +288° to +306° (18° span, 18° per step) -> or +285° to +305°
 */
function getAngleDeg(block: OrbitalBlock, slot: number): number {
  switch (block) {
    case 'p': {
      // 6 slots: -32° .. +32°
      const t = (slot - 1) / 5;
      return -32 + t * 64;
    }
    case 'd': {
      // 10 slots: +52° .. +142°
      const t = (slot - 1) / 9;
      return 52 + t * 90;
    }
    case 'f': {
      // 14 slots: +160° .. +264°
      const t = (slot - 1) / 13;
      return 160 + t * 104;
    }
    case 's': {
      // 2 slots: +286° .. +308°
      return slot === 1 ? 286 : 308;
    }
  }
}

function polarToCartesian(radius: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

function describeArc(radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(radius, endAngle);
  const end = polarToCartesian(radius, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export function RadialCoreView({
  selectedElement,
  onSelectElement,
  overlay,
  familyFilter,
  isDark,
}: RadialCoreViewProps) {
  const [hoveredEl, setHoveredEl] = useState<ChemicalElement | null>(null);
  const { isAr } = useLanguage();

  const nodes = useMemo(() => {
    return ELEMENTS.map((el) => {
      const radius = INNER_RADIUS + el.period * RING_STEP;
      const angle = getAngleDeg(el.block, el.blockSlot);
      const pos = polarToCartesian(radius, angle);
      return { el, radius, angle, x: pos.x, y: pos.y };
    });
  }, []);

  const sectorHeaders: Array<{ block: OrbitalBlock; label: string; angle: number; radius: number }> = [
    { block: 'p', label: isAr ? 'فئة p (p¹–p⁶)' : 'p-BLOCK (p¹–p⁶)', angle: 0, radius: INNER_RADIUS + 7 * RING_STEP + 38 },
    { block: 'd', label: isAr ? 'فئة d (d¹–d¹⁰)' : 'd-BLOCK (d¹–d¹⁰)', angle: 97, radius: INNER_RADIUS + 7 * RING_STEP + 38 },
    { block: 'f', label: isAr ? 'فئة f (f¹–f¹⁴)' : 'f-BLOCK (f¹–f¹⁴)', angle: 212, radius: INNER_RADIUS + 7 * RING_STEP + 38 },
    { block: 's', label: isAr ? 'فئة s (s¹–s²)' : 's-BLOCK (s¹–s²)', angle: 297, radius: INNER_RADIUS + 7 * RING_STEP + 38 },
  ];

  const activeEl = hoveredEl ?? selectedElement;

  return (
    <div className="relative flex flex-col items-center">
      <div className="w-full max-w-[820px] mx-auto">
        <svg
          viewBox="0 0 920 920"
          className="w-full h-auto select-none"
          role="img"
          aria-label="Radial Quantum Core periodic map with 7 concentric principal shells and 4 orbital block sectors"
        >
          {/* Concentric Principal Shell Rings (n = 1..7) */}
          {[1, 2, 3, 4, 5, 6, 7].map((n) => {
            const r = INNER_RADIUS + n * RING_STEP;
            const isSelectedRing = selectedElement.period === n;
            return (
              <g key={n}>
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={r}
                  fill="none"
                  stroke={
                    isSelectedRing
                      ? isDark
                        ? '#94A3B8'
                        : '#334155'
                      : isDark
                        ? '#1E293B'
                        : '#E2E8F0'
                  }
                  strokeWidth={isSelectedRing ? 1.5 : 1}
                  strokeDasharray={isSelectedRing ? undefined : '3 4'}
                />
                {/* Shell n label along gap at 322 deg */}
                {(() => {
                  const pt = polarToCartesian(r, 326);
                  return (
                    <text
                      x={pt.x}
                      y={pt.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="font-mono text-[11px] font-semibold"
                      fill={isSelectedRing ? (isDark ? '#F8FAFC' : '#0F172A') : isDark ? '#64748B' : '#94A3B8'}
                    >
                      n={n}
                    </text>
                  );
                })()}
              </g>
            );
          })}

          {/* Sector Outer Arcs & Labels */}
          {sectorHeaders.map((sec) => {
            const meta = BLOCK_META[sec.block];
            const arcRange: Record<OrbitalBlock, [number, number]> = {
              p: [-34, 34],
              d: [50, 144],
              f: [158, 266],
              s: [284, 310],
            };
            const [a0, a1] = arcRange[sec.block];
            const labelPt = polarToCartesian(sec.radius, sec.angle);

            return (
              <g key={sec.block}>
                <path
                  d={describeArc(INNER_RADIUS + 7 * RING_STEP + 18, a0, a1)}
                  fill="none"
                  stroke={meta.hex}
                  strokeWidth={2.5}
                  strokeOpacity={0.75}
                />
                <text
                  x={labelPt.x}
                  y={labelPt.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-display text-[12px] font-bold tracking-wide"
                  fill={meta.hex}
                >
                  {sec.label}
                </text>
              </g>
            );
          })}

          {/* Radial Valence Family Spokes */}
          {nodes
            .filter((n) => n.el.block === selectedElement.block && n.el.blockSlot === selectedElement.blockSlot)
            .slice(0, 1)
            .map((refNode) => {
              const outerPt = polarToCartesian(INNER_RADIUS + 7 * RING_STEP + 10, refNode.angle);
              const innerPt = polarToCartesian(INNER_RADIUS, refNode.angle);
              return (
                <line
                  key="active-spoke"
                  x1={innerPt.x}
                  y1={innerPt.y}
                  x2={outerPt.x}
                  y2={outerPt.y}
                  stroke={BLOCK_META[selectedElement.block].hex}
                  strokeWidth={1.75}
                  strokeOpacity={0.55}
                />
              );
            })}

          {/* Central Quantum Core */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={INNER_RADIUS - 12}
            fill={isDark ? '#0F172A' : '#FFFFFF'}
            stroke={isDark ? '#334155' : '#CBD5E1'}
            strokeWidth={1.5}
          />
          <text
            x={CENTER}
            y={CENTER - 14}
            textAnchor="middle"
            className="font-mono text-[10px] font-semibold tracking-widest"
            fill={isDark ? '#94A3B8' : '#64748B'}
          >
            {isAr ? 'نواة الأغلفة' : 'SHELL CORE'}
          </text>
          <text
            x={CENTER}
            y={CENTER + 6}
            textAnchor="middle"
            className="font-display text-[18px] font-bold"
            fill={isDark ? '#F8FAFC' : '#0F172A'}
          >
            {activeEl.symbol} · Z={activeEl.z}
          </text>
          <text
            x={CENTER}
            y={CENTER + 24}
            textAnchor="middle"
            className="font-mono text-[10px]"
            fill={BLOCK_META[activeEl.block].hex}
          >
            {activeEl.quantumAddress}
          </text>

          {/* 118 Element Nodes */}
          {nodes.map(({ el, x, y }) => {
            const isSelected = el.z === selectedElement.z;
            const isSameFamily =
              el.block === selectedElement.block &&
              el.blockSlot === selectedElement.blockSlot &&
              !isSelected;
            const isDimmed = familyFilter !== 'all' && el.family !== familyFilter;
            const hex = getElementHexColor(el, overlay);
            const nodeR = el.block === 'f' ? 12.5 : 14.5;

            return (
              <g
                key={el.z}
                transform={`translate(${x}, ${y})`}
                onClick={() => onSelectElement(el)}
                onMouseEnter={() => setHoveredEl(el)}
                onMouseLeave={() => setHoveredEl(null)}
                className="cursor-pointer"
                style={{ opacity: isDimmed ? 0.2 : 1 }}
              >
                {isSelected && (
                  <circle
                    r={nodeR + 4.5}
                    fill="none"
                    stroke={isDark ? '#FFFFFF' : '#0F172A'}
                    strokeWidth={2}
                  />
                )}
                {isSameFamily && (
                  <circle
                    r={nodeR + 2.5}
                    fill="none"
                    stroke={hex}
                    strokeWidth={1.25}
                    strokeDasharray="2 2"
                  />
                )}
                <circle
                  r={nodeR}
                  fill={isSelected ? hex : isDark ? '#111827' : '#FFFFFF'}
                  stroke={hex}
                  strokeWidth={isSelected ? 2 : 1.5}
                />
                <text
                  y={1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-display text-[9.5px] font-bold pointer-events-none"
                  fill={isSelected ? '#FFFFFF' : isDark ? '#F1F5F9' : '#0F172A'}
                >
                  {el.symbol}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-xl">
        {isAr ? (
          <>
            تتبع الحلقات المتحدة المركز أغلفة الطاقة الرئيسية (<span className="font-mono">n = 1..7</span>) من المركز نحو الخارج، بينما تصطف المحاور الشعاعية للعناصر ذات عدد إلكترونات التكافؤ نفسه.
          </>
        ) : (
          <>
            Concentric rings trace principal energy shells (<span className="font-mono">n = 1..7</span>) from the filled core outward, while radial spokes align elements with identical valence subshell populations.
          </>
        )}
      </p>
    </div>
  );
}

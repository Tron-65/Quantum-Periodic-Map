import { ELEMENTS } from '../data/elements';
import {
  ChemicalElement,
  ChemicalFamily,
  ColorOverlayMode,
  OrbitalBlock,
  SubshellFill,
} from '../types/element';

const SUPERSCRIPT_MAP: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
};

function decodeSuperscript(str: string): number {
  const digits = str
    .split('')
    .map((ch) => SUPERSCRIPT_MAP[ch] ?? ch)
    .join('');
  return parseInt(digits, 10) || 0;
}

const ORBITAL_CAP: Record<OrbitalBlock, { capacity: number; orbitals: number; l: number }> = {
  s: { capacity: 2, orbitals: 1, l: 0 },
  p: { capacity: 6, orbitals: 3, l: 1 },
  d: { capacity: 10, orbitals: 5, l: 2 },
  f: { capacity: 14, orbitals: 7, l: 3 },
};

export function parseSubshells(fullConfig: string): SubshellFill[] {
  const tokens = fullConfig.trim().split(/\s+/);
  return tokens
    .map((token): SubshellFill | null => {
      const match = token.match(/^(\d)([spdf])(.+)$/);
      if (!match) return null;
      const n = parseInt(match[1], 10);
      const block = match[2] as OrbitalBlock;
      const electrons = decodeSuperscript(match[3]);
      const meta = ORBITAL_CAP[block];
      return {
        subshell: `${n}${block}`,
        n,
        l: meta.l,
        block,
        capacity: meta.capacity,
        electrons,
        orbitals: meta.orbitals,
      };
    })
    .filter((x): x is SubshellFill => x !== null);
}

/** Returns Hund's rule box occupancy: array of { up: boolean; down: boolean } */
export function buildOrbitalBoxes(
  orbitals: number,
  electrons: number
): Array<{ up: boolean; down: boolean }> {
  const boxes = Array.from({ length: orbitals }, () => ({ up: false, down: false }));
  let remaining = Math.min(electrons, orbitals * 2);
  for (let i = 0; i < orbitals && remaining > 0; i++) {
    boxes[i].up = true;
    remaining--;
  }
  for (let i = 0; i < orbitals && remaining > 0; i++) {
    boxes[i].down = true;
    remaining--;
  }
  return boxes;
}

export const BLOCK_META: Record<
  OrbitalBlock,
  {
    name: string;
    short: string;
    hex: string;
    bgClass: string;
    borderClass: string;
    textClass: string;
    dotClass: string;
    capacity: number;
    description: string;
  }
> = {
  s: {
    name: 's-Block',
    short: 's',
    hex: '#2563EB',
    bgClass: 'bg-blue-50/90 dark:bg-blue-950/45',
    borderClass: 'border-blue-300/90 dark:border-blue-700/70',
    textClass: 'text-blue-700 dark:text-blue-300',
    dotClass: 'bg-blue-600 dark:bg-blue-400',
    capacity: 2,
    description: 'Spherical outer s¹–s² valence shells; low-barrier ionization and strong metallic reactivity.',
  },
  f: {
    name: 'f-Block',
    short: 'f',
    hex: '#D97706',
    bgClass: 'bg-amber-50/90 dark:bg-amber-950/40',
    borderClass: 'border-amber-300/90 dark:border-amber-700/70',
    textClass: 'text-amber-700 dark:text-amber-300',
    dotClass: 'bg-amber-600 dark:bg-amber-400',
    capacity: 14,
    description: 'Inner 4f/5f orbitals buried beneath outer shells; drives f-contraction and magnetic anisotropy.',
  },
  d: {
    name: 'd-Block',
    short: 'd',
    hex: '#0D9488',
    bgClass: 'bg-teal-50/90 dark:bg-teal-950/45',
    borderClass: 'border-teal-300/90 dark:border-teal-700/70',
    textClass: 'text-teal-700 dark:text-teal-300',
    dotClass: 'bg-teal-600 dark:bg-teal-400',
    capacity: 10,
    description: 'd¹–d¹⁰ transition band; partially filled d-states govern variable oxidation, color, and catalysis.',
  },
  p: {
    name: 'p-Block',
    short: 'p',
    hex: '#7C3AED',
    bgClass: 'bg-violet-50/90 dark:bg-violet-950/45',
    borderClass: 'border-violet-300/90 dark:border-violet-700/70',
    textClass: 'text-violet-700 dark:text-violet-300',
    dotClass: 'bg-violet-600 dark:bg-violet-400',
    capacity: 6,
    description: 'Directional p¹–p⁶ orbitals spanning metalloids, covalent frameworks, halogens, and closed octets.',
  },
};

export const FAMILY_META: Record<
  ChemicalFamily,
  {
    label: string;
    hex: string;
    bgClass: string;
    borderClass: string;
    textClass: string;
  }
> = {
  alkali: {
    label: 'Alkali Metals',
    hex: '#DC2626',
    bgClass: 'bg-red-50/90 dark:bg-red-950/45',
    borderClass: 'border-red-300 dark:border-red-800/80',
    textClass: 'text-red-700 dark:text-red-300',
  },
  'alkaline-earth': {
    label: 'Alkaline Earths',
    hex: '#EA580C',
    bgClass: 'bg-orange-50/90 dark:bg-orange-950/45',
    borderClass: 'border-orange-300 dark:border-orange-800/80',
    textClass: 'text-orange-700 dark:text-orange-300',
  },
  transition: {
    label: 'Transition Metals',
    hex: '#0D9488',
    bgClass: 'bg-teal-50/90 dark:bg-teal-950/45',
    borderClass: 'border-teal-300 dark:border-teal-800/80',
    textClass: 'text-teal-700 dark:text-teal-300',
  },
  lanthanide: {
    label: 'Lanthanides',
    hex: '#D97706',
    bgClass: 'bg-amber-50/90 dark:bg-amber-950/45',
    borderClass: 'border-amber-300 dark:border-amber-800/80',
    textClass: 'text-amber-700 dark:text-amber-300',
  },
  actinide: {
    label: 'Actinides',
    hex: '#CA8A04',
    bgClass: 'bg-yellow-50/90 dark:bg-yellow-950/45',
    borderClass: 'border-yellow-300 dark:border-yellow-800/80',
    textClass: 'text-yellow-800 dark:text-yellow-300',
  },
  'post-transition': {
    label: 'Post-Transition',
    hex: '#2563EB',
    bgClass: 'bg-blue-50/90 dark:bg-blue-950/45',
    borderClass: 'border-blue-300 dark:border-blue-800/80',
    textClass: 'text-blue-700 dark:text-blue-300',
  },
  metalloid: {
    label: 'Metalloids',
    hex: '#4F46E5',
    bgClass: 'bg-indigo-50/90 dark:bg-indigo-950/45',
    borderClass: 'border-indigo-300 dark:border-indigo-800/80',
    textClass: 'text-indigo-700 dark:text-indigo-300',
  },
  'reactive-nonmetal': {
    label: 'Reactive Nonmetals',
    hex: '#0284C7',
    bgClass: 'bg-sky-50/90 dark:bg-sky-950/45',
    borderClass: 'border-sky-300 dark:border-sky-800/80',
    textClass: 'text-sky-700 dark:text-sky-300',
  },
  chalcogen: {
    label: 'Chalcogens',
    hex: '#7C3AED',
    bgClass: 'bg-violet-50/90 dark:bg-violet-950/45',
    borderClass: 'border-violet-300 dark:border-violet-800/80',
    textClass: 'text-violet-700 dark:text-violet-300',
  },
  halogen: {
    label: 'Halogens',
    hex: '#DB2777',
    bgClass: 'bg-pink-50/90 dark:bg-pink-950/45',
    borderClass: 'border-pink-300 dark:border-pink-800/80',
    textClass: 'text-pink-700 dark:text-pink-300',
  },
  'noble-gas': {
    label: 'Noble Gases',
    hex: '#475569',
    bgClass: 'bg-slate-100 dark:bg-slate-800/70',
    borderClass: 'border-slate-300 dark:border-slate-600',
    textClass: 'text-slate-700 dark:text-slate-200',
  },
};

function lerpColor(c1: [number, number, number], c2: [number, number, number], t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * clamped);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * clamped);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * clamped);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b
    .toString(16)
    .padStart(2, '0')}`;
}

function multiStopGradient(stops: Array<[number, number, number]>, t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  if (stops.length === 1) return lerpColor(stops[0], stops[0], 0);
  const scaled = clamped * (stops.length - 1);
  const idx = Math.min(stops.length - 2, Math.floor(scaled));
  const localT = scaled - idx;
  return lerpColor(stops[idx], stops[idx + 1], localT);
}

/** Returns calibrated hex color for 3D / Canvas / SVG rendering */
export function getElementHexColor(
  el: ChemicalElement,
  overlay: ColorOverlayMode
): string {
  switch (overlay) {
    case 'block':
      return BLOCK_META[el.block].hex;
    case 'family':
      return FAMILY_META[el.family].hex;
    case 'electronegativity': {
      if (el.electronegativity === null) return '#64748B';
      const t = (el.electronegativity - 0.7) / (3.98 - 0.7);
      return multiStopGradient(
        [
          [37, 99, 235],   // low EN: cool cobalt
          [13, 148, 136],  // mid EN: teal
          [245, 158, 11],  // high EN: amber
          [220, 38, 38],   // peak EN (F): crimson
        ],
        t
      );
    }
    case 'radius': {
      const t = (el.atomicRadius - 31) / (348 - 31);
      return multiStopGradient(
        [
          [14, 165, 233],  // compact radius
          [99, 102, 241],  // medium
          [217, 119, 6],   // large
        ],
        t
      );
    }
    case 'ionization': {
      const t = (el.ionizationEnergy - 3.89) / (24.59 - 3.89);
      return multiStopGradient(
        [
          [217, 119, 6],   // low IE (alkali)
          [13, 148, 136],  // mid IE
          [37, 99, 235],   // high IE
          [124, 58, 237],  // peak IE (He, Ne)
        ],
        t
      );
    }
    case 'metallic': {
      // 0 = pure nonmetal (violet/amber), 100 = strong alkali metal (steel-cobalt)
      const t = el.metallicCharacter / 100;
      return multiStopGradient(
        [
          [124, 58, 237],  // nonmetal
          [13, 148, 136],  // metalloid / transition
          [37, 99, 235],   // strong metal
        ],
        t
      );
    }
  }
}

/** Returns subtle tinted cell styling for the 2D continuous & staircase grids */
export function getElementCellTheme(
  el: ChemicalElement,
  overlay: ColorOverlayMode,
  isDark: boolean
): { backgroundColor?: string; borderColor?: string; accentHex: string; isMutedData?: boolean } {
  const accentHex = getElementHexColor(el, overlay);
  if (overlay === 'block' || overlay === 'family') {
    return { accentHex };
  }
  if (overlay === 'electronegativity' && el.electronegativity === null) {
    return {
      accentHex: '#64748B',
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(241, 245, 249, 0.8)',
      borderColor: isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(203, 213, 225, 0.9)',
      isMutedData: true,
    };
  }
  // Convert hex to subtle alpha background + crisp border
  const r = parseInt(accentHex.slice(1, 3), 16);
  const g = parseInt(accentHex.slice(3, 5), 16);
  const b = parseInt(accentHex.slice(5, 7), 16);
  return {
    accentHex,
    backgroundColor: isDark ? `rgba(${r}, ${g}, ${b}, 0.24)` : `rgba(${r}, ${g}, ${b}, 0.14)`,
    borderColor: isDark ? `rgba(${r}, ${g}, ${b}, 0.55)` : `rgba(${r}, ${g}, ${b}, 0.42)`,
  };
}

export function getSubshellNeighbors(el: ChemicalElement): {
  row: ChemicalElement[];
  prev: ChemicalElement | null;
  next: ChemicalElement | null;
} {
  const row = ELEMENTS.filter(
    (item) => item.period === el.period && item.block === el.block
  ).sort((a, b) => a.blockSlot - b.blockSlot);
  const idx = row.findIndex((item) => item.z === el.z);
  return {
    row,
    prev: idx > 0 ? row[idx - 1] : null,
    next: idx >= 0 && idx < row.length - 1 ? row[idx + 1] : null,
  };
}

export function getValenceFamilyNeighbors(el: ChemicalElement): ChemicalElement[] {
  return ELEMENTS.filter(
    (item) => item.block === el.block && item.blockSlot === el.blockSlot
  ).sort((a, b) => a.period - b.period);
}

export interface MadelungStep {
  id: string;
  label: string;
  n: number;
  block: OrbitalBlock;
  capacity: number;
  nPlusL: number;
  elements: ChemicalElement[];
}

const RAW_MADELUNG_STEPS: Array<Omit<MadelungStep, 'elements'>> = [
  { id: '1s', label: '1s', n: 1, block: 's', capacity: 2, nPlusL: 1 },
  { id: '2s', label: '2s', n: 2, block: 's', capacity: 2, nPlusL: 2 },
  { id: '2p', label: '2p', n: 2, block: 'p', capacity: 6, nPlusL: 3 },
  { id: '3s', label: '3s', n: 3, block: 's', capacity: 2, nPlusL: 3 },
  { id: '3p', label: '3p', n: 3, block: 'p', capacity: 6, nPlusL: 4 },
  { id: '4s', label: '4s', n: 4, block: 's', capacity: 2, nPlusL: 4 },
  { id: '3d', label: '3d', n: 3, block: 'd', capacity: 10, nPlusL: 5 },
  { id: '4p', label: '4p', n: 4, block: 'p', capacity: 6, nPlusL: 5 },
  { id: '5s', label: '5s', n: 5, block: 's', capacity: 2, nPlusL: 5 },
  { id: '4d', label: '4d', n: 4, block: 'd', capacity: 10, nPlusL: 6 },
  { id: '5p', label: '5p', n: 5, block: 'p', capacity: 6, nPlusL: 6 },
  { id: '6s', label: '6s', n: 6, block: 's', capacity: 2, nPlusL: 6 },
  { id: '4f', label: '4f', n: 4, block: 'f', capacity: 14, nPlusL: 7 },
  { id: '5d', label: '5d', n: 5, block: 'd', capacity: 10, nPlusL: 7 },
  { id: '6p', label: '6p', n: 6, block: 'p', capacity: 6, nPlusL: 7 },
  { id: '7s', label: '7s', n: 7, block: 's', capacity: 2, nPlusL: 7 },
  { id: '5f', label: '5f', n: 5, block: 'f', capacity: 14, nPlusL: 8 },
  { id: '6d', label: '6d', n: 6, block: 'd', capacity: 10, nPlusL: 8 },
  { id: '7p', label: '7p', n: 7, block: 'p', capacity: 6, nPlusL: 8 },
];

export const MADELUNG_STEPS: MadelungStep[] = RAW_MADELUNG_STEPS.map((step) => ({
  ...step,
  elements: ELEMENTS.filter((el) => el.differentiatingOrbital === step.id).sort(
    (a, b) => a.blockSlot - b.blockSlot
  ),
}));

export type OrbitalBlock = 's' | 'f' | 'd' | 'p';

export type ChemicalFamily =
  | 'alkali'
  | 'alkaline-earth'
  | 'transition'
  | 'lanthanide'
  | 'actinide'
  | 'post-transition'
  | 'metalloid'
  | 'reactive-nonmetal'
  | 'chalcogen'
  | 'halogen'
  | 'noble-gas';

export type ViewMode = 'continuous' | 'staircase' | 'radial' | 'phase3d';

export type ColorOverlayMode =
  | 'block'
  | 'family'
  | 'electronegativity'
  | 'radius'
  | 'ionization'
  | 'metallic';

export type StandardState = 'Solid' | 'Liquid' | 'Gas';

export interface IsotopeEntry {
  massNumber: number;
  /** Terrestrial natural abundance percentage (0..100), or null if synthetic/trace */
  abundance: number | null;
  /** True for observationally stable nuclides */
  stable: boolean;
  /** Optional half-life note for primordial or synthetic radioisotopes */
  halfLife?: string;
}

export interface ChemicalElement {
  z: number;
  symbol: string;
  name: string;
  atomicMass: string;
  period: number; // 1..7
  block: OrbitalBlock;
  /** Differentiating subshell label, e.g., "2p", "3d", "4f" */
  differentiatingOrbital: string;
  /** Short differentiating term shown on cell, e.g., "2p²", "3d⁶" */
  differentiatingConfig: string;
  /** Column index in the continuous 32-column s -> f -> d -> p map (1..32) */
  col32: number;
  /** Slot within the active block: s(1..2), f(1..14), d(1..10), p(1..6) */
  blockSlot: number;
  /** Idealized or ground-state subshell electron label (e.g., "p²", "d⁶", "f⁷") */
  subshellLabel: string;
  fullConfig: string;
  condensedConfig: string;
  valenceElectrons: number;
  valenceStructure: string;
  quantumAddress: string;
  family: ChemicalFamily;
  /** 0 (pure nonmetal) to 100 (strong alkali metal) */
  metallicCharacter: number;
  electronegativity: number | null; // Pauling scale
  ionizationEnergy: number; // eV (first ionization energy)
  atomicRadius: number; // pm (empirical/calculated covalent or van der Waals radius)
  oxidationStates: number[];
  standardState: StandardState;
  chemicalBehavior: string;
  anomalyNote?: string;
  stableIsotopesCount: number;
  isotopes: IsotopeEntry[];
}

export interface SubshellFill {
  subshell: string;
  n: number;
  l: number; // 0=s, 1=p, 2=d, 3=f
  block: OrbitalBlock;
  capacity: number; // 2, 6, 10, 14
  electrons: number;
  orbitals: number; // 1, 3, 5, 7 boxes
}

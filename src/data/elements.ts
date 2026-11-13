import { ChemicalElement, ChemicalFamily, OrbitalBlock, StandardState } from '../types/element';
import { ISOTOPES_BY_Z } from './isotopes';

type RawElementTuple = [
  z: number,
  symbol: string,
  name: string,
  atomicMass: string,
  period: number,
  block: OrbitalBlock,
  blockSlot: number,
  diffOrbital: string,
  diffConfig: string,
  condensedConfig: string,
  valenceElectrons: number,
  valenceStructure: string,
  quantumAddress: string,
  family: ChemicalFamily,
  metallicCharacter: number,
  electronegativity: number | null,
  ionizationEnergy: number,
  atomicRadius: number,
  oxidationStates: number[],
  standardState: StandardState,
  chemicalBehavior: string,
  anomalyNote?: string,
];

const NOBLE_CORE_EXPANSIONS: Record<string, string> = {
  '[He]': '1s²',
  '[Ne]': '1s² 2s² 2p⁶',
  '[Ar]': '1s² 2s² 2p⁶ 3s² 3p⁶',
  '[Kr]': '1s² 2s² 2p⁶ 3s² 3p⁶ 3d¹⁰ 4s² 4p⁶',
  '[Xe]': '1s² 2s² 2p⁶ 3s² 3p⁶ 3d¹⁰ 4s² 4p⁶ 4d¹⁰ 5s² 5p⁶',
  '[Rn]': '1s² 2s² 2p⁶ 3s² 3p⁶ 3d¹⁰ 4s² 4p⁶ 4d¹⁰ 4f¹⁴ 5s² 5p⁶ 5d¹⁰ 6s² 6p⁶',
};

function expandConfig(condensed: string): string {
  for (const [core, expansion] of Object.entries(NOBLE_CORE_EXPANSIONS)) {
    if (condensed.startsWith(core)) {
      const tail = condensed.slice(core.length).trim();
      return tail ? `${expansion} ${tail}` : expansion;
    }
  }
  return condensed;
}

function getCol32(block: OrbitalBlock, slot: number): number {
  switch (block) {
    case 's':
      return slot; // 1..2
    case 'f':
      return 2 + slot; // 3..16
    case 'd':
      return 16 + slot; // 17..26
    case 'p':
      return 26 + slot; // 27..32
  }
}

const SUPERSCRIPTS: Record<number, string> = {
  1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷',
  8: '⁸', 9: '⁹', 10: '¹⁰', 11: '¹¹', 12: '¹²', 13: '¹³', 14: '¹⁴',
};

const RAW_ELEMENTS: RawElementTuple[] = [
  // Period 1
  [1, 'H', 'Hydrogen', '1.008', 1, 's', 1, '1s', '1s¹', '1s¹', 1, '1s¹', 'P1 – s1 – V1', 'reactive-nonmetal', 8, 2.20, 13.60, 53, [-1, 1], 'Gas', 'A single half-filled 1s orbital drives covalent sharing or H⁺/H⁻ ion formation.'],
  [2, 'He', 'Helium', '4.0026', 1, 's', 2, '1s', '1s²', '1s²', 2, '1s²', 'P1 – s2 – Closed', 'noble-gas', 0, null, 24.59, 31, [0], 'Gas', 'Completed 1s² shell with extreme effective nuclear charge resists all electron transfer.'],

  // Period 2
  [3, 'Li', 'Lithium', '6.94', 2, 's', 1, '2s', '2s¹', '[He] 2s¹', 1, '2s¹', 'P2 – s1 – V1', 'alkali', 88, 0.98, 5.39, 167, [1], 'Solid', 'One loosely held 2s¹ electron outside a compact [He] core readily ionizes to Li⁺.'],
  [4, 'Be', 'Beryllium', '9.0122', 2, 's', 2, '2s', '2s²', '[He] 2s²', 2, '2s²', 'P2 – s2 – V2', 'alkaline-earth', 74, 1.57, 9.32, 112, [2], 'Solid', 'Small radius and paired 2s² electrons favor covalent network bonding over ionic salts.'],
  [5, 'B', 'Boron', '10.81', 2, 'p', 1, '2p', '2p¹', '[He] 2s² 2p¹', 3, '2s² 2p¹', 'P2 – p1 – V3', 'metalloid', 42, 2.04, 8.30, 87, [3], 'Solid', 'Three valence electrons with an empty 2p orbital produce electron-deficient 3-center bonds.'],
  [6, 'C', 'Carbon', '12.011', 2, 'p', 2, '2p', '2p²', '[He] 2s² 2p²', 4, '2s² 2p²', 'P2 – p2 – V4', 'reactive-nonmetal', 14, 2.55, 11.26, 67, [-4, -2, 2, 4], 'Solid', 'Four half-capacity valence orbitals (sp³ / sp²) enable stable chains, rings, and π bonds.'],
  [7, 'N', 'Nitrogen', '14.007', 2, 'p', 3, '2p', '2p³', '[He] 2s² 2p³', 5, '2s² 2p³', 'P2 – p3 – V5', 'reactive-nonmetal', 7, 3.04, 14.53, 56, [-3, 2, 3, 4, 5], 'Gas', 'Half-filled 2p³ subshell yields high ionization energy and ultra-strong N≡N triple bonds.'],
  [8, 'O', 'Oxygen', '15.999', 2, 'p', 4, '2p', '2p⁴', '[He] 2s² 2p⁴', 6, '2s² 2p⁴', 'P2 – p4 – V6', 'chalcogen', 4, 3.44, 13.62, 48, [-2, -1], 'Gas', 'Two unpaired 2p electrons and intense nuclear pull make O a powerful 2-electron oxidizer.'],
  [9, 'F', 'Fluorine', '18.998', 2, 'p', 5, '2p', '2p⁵', '[He] 2s² 2p⁵', 7, '2s² 2p⁵', 'P2 – p5 – V7', 'halogen', 1, 3.98, 17.42, 42, [-1], 'Gas', 'One electron short of a [Ne] octet with minimal shielding produces peak electronegativity.'],
  [10, 'Ne', 'Neon', '20.180', 2, 'p', 6, '2p', '2p⁶', '[He] 2s² 2p⁶', 8, '2s² 2p⁶', 'P2 – p6 – Closed', 'noble-gas', 0, null, 21.56, 38, [0], 'Gas', 'Closed 2s²2p⁶ shell leaves zero low-energy orbitals accessible for chemical bonding.'],

  // Period 3
  [11, 'Na', 'Sodium', '22.990', 3, 's', 1, '3s', '3s¹', '[Ne] 3s¹', 1, '3s¹', 'P3 – s1 – V1', 'alkali', 91, 0.93, 5.14, 190, [1], 'Solid', 'Shielded 3s¹ electron detaches easily, driving vigorous reduction reactions to Na⁺.'],
  [12, 'Mg', 'Magnesium', '24.305', 3, 's', 2, '3s', '3s²', '[Ne] 3s²', 2, '3s²', 'P3 – s2 – V2', 'alkaline-earth', 82, 1.31, 7.65, 145, [2], 'Solid', 'Two 3s² electrons ionize cleanly to form a compact, high-charge-density Mg²⁺ cation.'],
  [13, 'Al', 'Aluminum', '26.982', 3, 'p', 1, '3p', '3p¹', '[Ne] 3s² 3p¹', 3, '3s² 3p¹', 'P3 – p1 – V3', 'post-transition', 72, 1.61, 5.99, 118, [3], 'Solid', 'Three valence electrons give metallic conductivity with amphoteric oxide chemistry.'],
  [14, 'Si', 'Silicon', '28.085', 3, 'p', 2, '3p', '3p²', '[Ne] 3s² 3p²', 4, '3s² 3p²', 'P3 – p2 – V4', 'metalloid', 46, 1.90, 8.15, 111, [-4, 4], 'Solid', 'Larger 3p orbitals weaken Si=Si π overlap, favoring tetrahedral Si–O–Si networks.'],
  [15, 'P', 'Phosphorus', '30.974', 3, 'p', 3, '3p', '3p³', '[Ne] 3s² 3p³', 5, '3s² 3p³', 'P3 – p3 – V5', 'reactive-nonmetal', 18, 2.19, 10.49, 98, [-3, 3, 5], 'Solid', 'Half-filled 3p³ plus accessible hypervalent bonding supports +3 and +5 oxyanions.'],
  [16, 'S', 'Sulfur', '32.06', 3, 'p', 4, '3p', '3p⁴', '[Ne] 3s² 3p⁴', 6, '3s² 3p⁴', 'P3 – p4 – V6', 'chalcogen', 12, 2.58, 10.36, 88, [-2, 2, 4, 6], 'Solid', 'Two 3p vacancies plus catenation create S₈ rings and oxidation states from −2 to +6.'],
  [17, 'Cl', 'Chlorine', '35.45', 3, 'p', 5, '3p', '3p⁵', '[Ne] 3s² 3p⁵', 7, '3s² 3p⁵', 'P3 – p5 – V7', 'halogen', 5, 3.16, 12.97, 79, [-1, 1, 3, 5, 7], 'Gas', 'High electron affinity in 3p⁵ drives strong halide formation and oxoacids up to +7.'],
  [18, 'Ar', 'Argon', '39.948', 3, 'p', 6, '3p', '3p⁶', '[Ne] 3s² 3p⁶', 8, '3s² 3p⁶', 'P3 – p6 – Closed', 'noble-gas', 0, null, 15.76, 71, [0], 'Gas', 'Filled 3s²3p⁶ valence shell makes Argon chemically inert under normal conditions.'],

  // Period 4
  [19, 'K', 'Potassium', '39.098', 4, 's', 1, '4s', '4s¹', '[Ar] 4s¹', 1, '4s¹', 'P4 – s1 – V1', 'alkali', 94, 0.82, 4.34, 243, [1], 'Solid', 'Distant 4s¹ orbital experiences heavy core shielding, making K a potent reducing metal.'],
  [20, 'Ca', 'Calcium', '40.078', 4, 's', 2, '4s', '4s²', '[Ar] 4s²', 2, '4s²', 'P4 – s2 – V2', 'alkaline-earth', 86, 1.00, 6.11, 194, [2], 'Solid', 'Loses both 4s² electrons rapidly to yield stable noble-gas-core Ca²⁺ ions.'],
  [21, 'Sc', 'Scandium', '44.956', 4, 'd', 1, '3d', '3d¹', '[Ar] 3d¹ 4s²', 3, '3d¹ 4s²', 'P4 – d1 – 4s²', 'transition', 78, 1.36, 6.56, 184, [3], 'Solid', 'First 3d electron joins 4s²; all three readily ionize to give exclusively +3 chemistry.'],
  [22, 'Ti', 'Titanium', '47.867', 4, 'd', 2, '3d', '3d²', '[Ar] 3d² 4s²', 4, '3d² 4s²', 'P4 – d2 – 4s²', 'transition', 77, 1.54, 6.83, 176, [2, 3, 4], 'Solid', 'Compact d²s² bonding builds strong metallic lattices and passivating TiO₂ (+4) layers.'],
  [23, 'V', 'Vanadium', '50.942', 4, 'd', 3, '3d', '3d³', '[Ar] 3d³ 4s²', 5, '3d³ 4s²', 'P4 – d3 – 4s²', 'transition', 76, 1.63, 6.75, 171, [2, 3, 4, 5], 'Solid', 'Five accessible d³s² electrons span vivid aqueous oxidation states (+2, +3, +4, +5).'],
  [24, 'Cr', 'Chromium', '51.996', 4, 'd', 4, '3d', '3d⁵', '[Ar] 3d⁵ 4s¹', 6, '3d⁵ 4s¹', 'P4 – d5 – 4s¹', 'transition', 75, 1.66, 6.77, 166, [2, 3, 6], 'Solid', 'Exchange stabilization promotes a 4s electron into half-filled 3d⁵, yielding Cr(III) and Cr(VI).', 'Aufbau exchange anomaly: 3d⁵ 4s¹ favored over 3d⁴ 4s² for half-shell spin exchange.'],
  [25, 'Mn', 'Manganese', '54.938', 4, 'd', 5, '3d', '3d⁵', '[Ar] 3d⁵ 4s²', 7, '3d⁵ 4s²', 'P4 – d5 – 4s²', 'transition', 74, 1.55, 7.43, 161, [2, 4, 7], 'Solid', 'Half-filled 3d⁵ resists ionization, stabilizing Mn²⁺ while allowing states up to MnO₄⁻ (+7).'],
  [26, 'Fe', 'Iron', '55.845', 4, 'd', 6, '3d', '3d⁶', '[Ar] 3d⁶ 4s²', 8, '3d⁶ 4s²', 'P4 – d6 – 4s²', 'transition', 74, 1.83, 7.90, 156, [2, 3], 'Solid', 'Paired/unpaired 3d⁶ electrons allow reversible Fe²⁺/Fe³⁺ redox and strong ferromagnetism.'],
  [27, 'Co', 'Cobalt', '58.933', 4, 'd', 7, '3d', '3d⁷', '[Ar] 3d⁷ 4s²', 9, '3d⁷ 4s²', 'P4 – d7 – 4s²', 'transition', 73, 1.88, 7.88, 152, [2, 3], 'Solid', 'Spin-state flexibility in 3d⁷ makes Co²⁺/Co³⁺ central to coordination complexes and catalysis.'],
  [28, 'Ni', 'Nickel', '58.693', 4, 'd', 8, '3d', '3d⁸', '[Ar] 3d⁸ 4s²', 10, '3d⁸ 4s²', 'P4 – d8 – 4s²', 'transition', 72, 1.91, 7.64, 149, [2], 'Solid', 'Eight 3d electrons stabilize square-planar and octahedral Ni(II) catalytic centers.'],
  [29, 'Cu', 'Copper', '63.546', 4, 'd', 9, '3d', '3d¹⁰', '[Ar] 3d¹⁰ 4s¹', 11, '3d¹⁰ 4s¹', 'P4 – d10 – 4s¹', 'transition', 73, 1.90, 7.73, 145, [1, 2], 'Solid', 'Completed 3d¹⁰ core plus mobile 4s¹ electron yields exceptional conductivity and Cu⁺/Cu²⁺.', 'Aufbau anomaly: 3d¹⁰ 4s¹ favored over 3d⁹ 4s² to complete the 3d subshell.'],
  [30, 'Zn', 'Zinc', '65.38', 4, 'd', 10, '3d', '3d¹⁰', '[Ar] 3d¹⁰ 4s²', 12, '3d¹⁰ 4s²', 'P4 – d10 – 4s²', 'transition', 70, 1.65, 9.39, 142, [2], 'Solid', 'Closed 3d¹⁰ shell acts core-like; only the two 4s² electrons participate to form diamagnetic Zn²⁺.'],
  [31, 'Ga', 'Gallium', '69.723', 4, 'p', 1, '4p', '4p¹', '[Ar] 3d¹⁰ 4s² 4p¹', 3, '4s² 4p¹', 'P4 – p1 – V3', 'post-transition', 64, 1.81, 6.00, 136, [3], 'Solid', 'Poor shielding by 3d¹⁰ pulls 4s² tight (d-block contraction), leaving 4p¹ exposed.'],
  [32, 'Ge', 'Germanium', '72.630', 4, 'p', 2, '4p', '4p²', '[Ar] 3d¹⁰ 4s² 4p²', 4, '4s² 4p²', 'P4 – p2 – V4', 'metalloid', 48, 2.01, 7.90, 125, [2, 4], 'Solid', 'Four tetrahedral 4s²4p² orbitals yield diamond-lattice semiconductor band structure.'],
  [33, 'As', 'Arsenic', '74.922', 4, 'p', 3, '4p', '4p³', '[Ar] 3d¹⁰ 4s² 4p³', 5, '4s² 4p³', 'P4 – p3 – V5', 'metalloid', 38, 2.18, 9.79, 114, [-3, 3, 5], 'Solid', 'Half-filled 4p³ subshell bridges metallic and covalent pnictogen chemistry (+3/+5).'],
  [34, 'Se', 'Selenium', '78.971', 4, 'p', 4, '4p', '4p⁴', '[Ar] 3d¹⁰ 4s² 4p⁴', 6, '4s² 4p⁴', 'P4 – p4 – V6', 'chalcogen', 20, 2.55, 9.75, 103, [-2, 4, 6], 'Solid', 'Narrower HOMO–LUMO gap in 4p⁴ gives photoconductive chains and −2/+4/+6 states.'],
  [35, 'Br', 'Bromine', '79.904', 4, 'p', 5, '4p', '4p⁵', '[Ar] 3d¹⁰ 4s² 4p⁵', 7, '4s² 4p⁵', 'P4 – p5 – V7', 'halogen', 7, 2.96, 11.81, 94, [-1, 1, 5], 'Liquid', 'Polarizable 4p⁵ valence shell strengthens dispersion forces, making Br₂ a volatile liquid.'],
  [36, 'Kr', 'Krypton', '83.798', 4, 'p', 6, '4p', '4p⁶', '[Ar] 3d¹⁰ 4s² 4p⁶', 8, '4s² 4p⁶', 'P4 – p6 – Closed', 'noble-gas', 0, 3.00, 14.00, 88, [0, 2], 'Gas', 'Closed 4p⁶ octet resists reaction except with extreme oxidizers like F₂ (KrF₂).'],

  // Period 5
  [37, 'Rb', 'Rubidium', '85.468', 5, 's', 1, '5s', '5s¹', '[Kr] 5s¹', 1, '5s¹', 'P5 – s1 – V1', 'alkali', 96, 0.82, 4.18, 265, [1], 'Solid', 'Large 5s¹ orbital ionizes at low energy, producing explosive reactions with water.'],
  [38, 'Sr', 'Strontium', '87.62', 5, 's', 2, '5s', '5s²', '[Kr] 5s²', 2, '5s²', 'P5 – s2 – V2', 'alkaline-earth', 89, 0.95, 5.69, 219, [2], 'Solid', 'Two outer 5s² electrons give strongly basic SrO and predominantly ionic Sr²⁺ salts.'],
  [39, 'Y', 'Yttrium', '88.906', 5, 'd', 1, '4d', '4d¹', '[Kr] 4d¹ 5s²', 3, '4d¹ 5s²', 'P5 – d1 – 4d¹5s²', 'transition', 80, 1.22, 6.22, 212, [3], 'Solid', 'Single 4d¹ plus 5s² produces trivalent Y³⁺ chemistry closely paralleling heavy lanthanides.'],
  [40, 'Zr', 'Zirconium', '91.224', 5, 'd', 2, '4d', '4d²', '[Kr] 4d² 5s²', 4, '4d² 5s²', 'P5 – d2 – 5s²', 'transition', 78, 1.33, 6.63, 206, [4], 'Solid', 'Diffuse 4d² orbitals strongly stabilize the +4 oxidation state in refractory ZrO₂ ceramics.'],
  [41, 'Nb', 'Niobium', '92.906', 5, 'd', 3, '4d', '4d⁴', '[Kr] 4d⁴ 5s¹', 5, '4d⁴ 5s¹', 'P5 – d4 – 5s¹', 'transition', 76, 1.60, 6.76, 198, [5], 'Solid', 'Radial 4d expansion promotes a 5s electron into 4d⁴, favoring +5 clusters and superconductivity.', 'Aufbau anomaly: 4d⁴ 5s¹ favored over 4d³ 5s² due to reduced 5s–4d repulsion.'],
  [42, 'Mo', 'Molybdenum', '95.95', 5, 'd', 4, '4d', '4d⁵', '[Kr] 4d⁵ 5s¹', 6, '4d⁵ 5s¹', 'P5 – d5 – 5s¹', 'transition', 75, 2.16, 7.09, 190, [4, 6], 'Solid', 'Half-filled 4d⁵ + 5s¹ supports strong metal–metal quadruple bonds and +6 molybdate enzymes.', 'Aufbau exchange anomaly: 4d⁵ 5s¹ favored over 4d⁴ 5s².'],
  [43, 'Tc', 'Technetium', '(98)', 5, 'd', 5, '4d', '4d⁵', '[Kr] 4d⁵ 5s²', 7, '4d⁵ 5s²', 'P5 – d5 – 5s²', 'transition', 74, 1.90, 7.28, 183, [4, 7], 'Solid', 'No stable isotopes exist; 4d⁵5s² forms stable pertechnetate (+7) used in nuclear imaging.'],
  [44, 'Ru', 'Ruthenium', '101.07', 5, 'd', 6, '4d', '4d⁷', '[Kr] 4d⁷ 5s¹', 8, '4d⁷ 5s¹', 'P5 – d7 – 5s¹', 'transition', 74, 2.20, 7.36, 178, [3, 4, 8], 'Solid', 'Eight valence electrons across 4d⁷5s¹ enable oxidation states from 0 to +8 in catalysis.', 'Aufbau anomaly: 4d⁷ 5s¹ favored over 4d⁶ 5s².'],
  [45, 'Rh', 'Rhodium', '102.91', 5, 'd', 7, '4d', '4d⁸', '[Kr] 4d⁸ 5s¹', 9, '4d⁸ 5s¹', 'P5 – d8 – 5s¹', 'transition', 74, 2.28, 7.46, 173, [3], 'Solid', 'Low-spin 4d⁸5s¹ resists oxidation and excels at hydrogenation and three-way catalysis.', 'Aufbau anomaly: 4d⁸ 5s¹ favored over 4d⁷ 5s².'],
  [46, 'Pd', 'Palladium', '106.42', 5, 'd', 8, '4d', '4d¹⁰', '[Kr] 4d¹⁰', 10, '4d¹⁰', 'P5 – d10 – 5s⁰', 'transition', 74, 2.20, 8.34, 169, [0, 2, 4], 'Solid', 'Unique closed 4d¹⁰ ground state enables reversible Pd(0)/Pd(II) cross-coupling chemistry.', 'Aufbau anomaly: both 5s electrons shift into 4d¹⁰ (4d¹⁰ 5s⁰).'],
  [47, 'Ag', 'Silver', '107.87', 5, 'd', 9, '4d', '4d¹⁰', '[Kr] 4d¹⁰ 5s¹', 11, '4d¹⁰ 5s¹', 'P5 – d10 – 5s¹', 'transition', 75, 1.93, 7.58, 165, [1], 'Solid', 'Filled 4d¹⁰ leaves a single free-electron 5s¹ band, giving the highest electrical conductivity.', 'Aufbau anomaly: 4d¹⁰ 5s¹ favored over 4d⁹ 5s².'],
  [48, 'Cd', 'Cadmium', '112.41', 5, 'd', 10, '4d', '4d¹⁰', '[Kr] 4d¹⁰ 5s²', 12, '4d¹⁰ 5s²', 'P5 – d10 – 5s²', 'transition', 71, 1.69, 8.99, 161, [2], 'Solid', 'Complete 4d¹⁰ subshell restricts chemistry strictly to divalent Cd²⁺ complexes.'],
  [49, 'In', 'Indium', '114.82', 5, 'p', 1, '5p', '5p¹', '[Kr] 4d¹⁰ 5s² 5p¹', 3, '5s² 5p¹', 'P5 – p1 – V3', 'post-transition', 68, 1.78, 5.79, 156, [1, 3], 'Solid', 'Soft post-transition metal; 5p¹ ionizes readily while inert-pair 5s² stabilizes In⁺.'],
  [50, 'Sn', 'Tin', '118.71', 5, 'p', 2, '5p', '5p²', '[Kr] 4d¹⁰ 5s² 5p²', 4, '5s² 5p²', 'P5 – p2 – V4', 'post-transition', 60, 1.96, 7.34, 145, [2, 4], 'Solid', 'Relativistic 5s² stabilization makes both Sn(II) and Sn(IV) common across metal/semiconductor allotropes.'],
  [51, 'Sb', 'Antimony', '121.76', 5, 'p', 3, '5p', '5p³', '[Kr] 4d¹⁰ 5s² 5p³', 5, '5s² 5p³', 'P5 – p3 – V5', 'metalloid', 45, 2.05, 8.61, 133, [-3, 3, 5], 'Solid', 'Half-filled 5p³ subshell yields brittle metalloid sheets and +3/+5 halides.'],
  [52, 'Te', 'Tellurium', '127.60', 5, 'p', 4, '5p', '5p⁴', '[Kr] 4d¹⁰ 5s² 5p⁴', 6, '5s² 5p⁴', 'P5 – p4 – V6', 'metalloid', 36, 2.10, 9.01, 123, [-2, 4, 6], 'Solid', 'Diffuse 5p⁴ orbitals give narrow-bandgap semiconductor helices and chalcogenide behavior.'],
  [53, 'I', 'Iodine', '126.90', 5, 'p', 5, '5p', '5p⁵', '[Kr] 4d¹⁰ 5s² 5p⁵', 7, '5s² 5p⁵', 'P5 – p5 – V7', 'halogen', 14, 2.66, 10.45, 115, [-1, 1, 5, 7], 'Solid', 'Large, polarizable 5p⁵ cloud forms crystalline I₂ and readily accepts hypervalent ligands.'],
  [54, 'Xe', 'Xenon', '131.29', 5, 'p', 6, '5p', '5p⁶', '[Kr] 4d¹⁰ 5s² 5p⁶', 8, '5s² 5p⁶', 'P5 – p6 – Closed', 'noble-gas', 0, 2.60, 12.13, 108, [0, 2, 4, 6], 'Gas', 'Lower ionization energy of outer 5p⁶ allows fluorides and oxides (XeF₂, XeF₄, XeO₃).'],

  // Period 6
  [55, 'Cs', 'Cesium', '132.91', 6, 's', 1, '6s', '6s¹', '[Xe] 6s¹', 1, '6s¹', 'P6 – s1 – V1', 'alkali', 98, 0.79, 3.89, 298, [1], 'Solid', 'Lowest ionization energy among stable elements makes 6s¹ instantaneously ionizable.'],
  [56, 'Ba', 'Barium', '137.33', 6, 's', 2, '6s', '6s²', '[Xe] 6s²', 2, '6s²', 'P6 – s2 – V2', 'alkaline-earth', 91, 0.89, 5.21, 253, [2], 'Solid', 'Two weakly bound 6s² electrons drive reactive electropositive Ba²⁺ chemistry.'],
  [57, 'La', 'Lanthanum', '138.91', 6, 'd', 1, '5d', '5d¹', '[Xe] 5d¹ 6s²', 3, '5d¹ 6s²', 'P6 – d1 – 6s²', 'lanthanide', 84, 1.10, 5.58, 195, [3], 'Solid', 'Opens the 5d subshell before 4f contracts, establishing the prototype +3 lanthanide ion.'],
  [58, 'Ce', 'Cerium', '140.12', 6, 'f', 1, '4f', '4f¹', '[Xe] 4f¹ 5d¹ 6s²', 4, '4f¹ 5d¹ 6s²', 'P6 – f1 – 6s²', 'lanthanide', 83, 1.12, 5.54, 185, [3, 4], 'Solid', 'First 4f¹ electron remains close in energy to 5d/6s, enabling strong +4 oxidizing Ce(IV).', 'Ground state retains 5d¹ alongside 4f¹.'],
  [59, 'Pr', 'Praseodymium', '140.91', 6, 'f', 2, '4f', '4f³', '[Xe] 4f³ 6s²', 5, '4f³ 6s²', 'P6 – f3 – 6s²', 'lanthanide', 83, 1.13, 5.47, 247, [3], 'Solid', 'Core-like 4f³ electrons stay shielded inside 5s²5p⁶, yielding signature +3 magnetic ions.', '5d electron drops into 4f³ 6s².'],
  [60, 'Nd', 'Neodymium', '144.24', 6, 'f', 3, '4f', '4f⁴', '[Xe] 4f⁴ 6s²', 6, '4f⁴ 6s²', 'P6 – f4 – 6s²', 'lanthanide', 83, 1.14, 5.53, 206, [3], 'Solid', 'Unpaired inner 4f⁴ spins create extreme magnetic anisotropy in Nd₂Fe₁₄B permanent magnets.'],
  [61, 'Pm', 'Promethium', '(145)', 6, 'f', 4, '4f', '4f⁵', '[Xe] 4f⁵ 6s²', 7, '4f⁵ 6s²', 'P6 – f5 – 6s²', 'lanthanide', 83, 1.13, 5.58, 205, [3], 'Solid', 'Radioactive 4f⁵ lanthanide whose outer 6s² shell mirrors neighboring +3 rare earths.'],
  [62, 'Sm', 'Samarium', '150.36', 6, 'f', 5, '4f', '4f⁶', '[Xe] 4f⁶ 6s²', 8, '4f⁶ 6s²', 'P6 – f6 – 6s²', 'lanthanide', 83, 1.17, 5.64, 238, [2, 3], 'Solid', 'Proximity to half-filled 4f⁷ stabilizes Sm²⁺ as a selective single-electron reductant.'],
  [63, 'Eu', 'Europium', '151.96', 6, 'f', 6, '4f', '4f⁷', '[Xe] 4f⁷ 6s²', 9, '4f⁷ 6s²', 'P6 – f7 – 6s²', 'lanthanide', 84, 1.20, 5.67, 231, [2, 3], 'Solid', 'Half-filled 4f⁷ stabilizes divalent Eu²⁺, causing larger atomic radius and bright phosphors.'],
  [64, 'Gd', 'Gadolinium', '157.25', 6, 'f', 7, '4f', '4f⁷', '[Xe] 4f⁷ 5d¹ 6s²', 10, '4f⁷ 5d¹ 6s²', 'P6 – f7 – 5d¹6s²', 'lanthanide', 83, 1.20, 6.15, 233, [3], 'Solid', 'Seven parallel 4f⁷ spins yield maximum paramagnetic moment used in MRI contrast agents.', 'Ground state places the 8th electron in 5d¹ to preserve symmetric 4f⁷.'],
  [65, 'Tb', 'Terbium', '158.93', 6, 'f', 8, '4f', '4f⁹', '[Xe] 4f⁹ 6s²', 11, '4f⁹ 6s²', 'P6 – f9 – 6s²', 'lanthanide', 83, 1.20, 5.86, 225, [3], 'Solid', '4f⁹ configuration produces sharp green luminescence and strong magnetostriction.'],
  [66, 'Dy', 'Dysprosium', '162.50', 6, 'f', 9, '4f', '4f¹⁰', '[Xe] 4f¹⁰ 6s²', 12, '4f¹⁰ 6s²', 'P6 – f10 – 6s²', 'lanthanide', 83, 1.22, 5.94, 228, [3], 'Solid', 'High orbital angular momentum in 4f¹⁰ resists demagnetization at elevated temperatures.'],
  [67, 'Ho', 'Holmium', '164.93', 6, 'f', 10, '4f', '4f¹¹', '[Xe] 4f¹¹ 6s²', 13, '4f¹¹ 6s²', 'P6 – f11 – 6s²', 'lanthanide', 83, 1.23, 6.02, 226, [3], 'Solid', '4f¹¹ coupling produces the highest magnetic moment of any naturally occurring element.'],
  [68, 'Er', 'Erbium', '167.26', 6, 'f', 11, '4f', '4f¹²', '[Xe] 4f¹² 6s²', 14, '4f¹² 6s²', 'P6 – f12 – 6s²', 'lanthanide', 83, 1.24, 6.11, 226, [3], 'Solid', 'Protected 4f¹² electronic transitions amplify 1550 nm optical signals in fiber networks.'],
  [69, 'Tm', 'Thulium', '168.93', 6, 'f', 12, '4f', '4f¹³', '[Xe] 4f¹³ 6s²', 15, '4f¹³ 6s²', 'P6 – f13 – 6s²', 'lanthanide', 83, 1.25, 6.18, 222, [3], 'Solid', 'Single 4f hole in 4f¹³ yields narrow infrared laser emissions and consistent +3 chemistry.'],
  [70, 'Yb', 'Ytterbium', '173.05', 6, 'f', 13, '4f', '4f¹⁴', '[Xe] 4f¹⁴ 6s²', 16, '4f¹⁴ 6s²', 'P6 – f14 – 6s²', 'lanthanide', 84, 1.10, 6.25, 222, [2, 3], 'Solid', 'Completed 4f¹⁴ shell stabilizes Yb²⁺ alongside Yb³⁺, causing a metallic radius expansion.'],
  [71, 'Lu', 'Lutetium', '174.97', 6, 'f', 14, '4f', '4f¹⁴', '[Xe] 4f¹⁴ 5d¹ 6s²', 3, '5d¹ 6s²', 'P6 – f14 – 5d¹6s²', 'lanthanide', 82, 1.27, 5.43, 217, [3], 'Solid', 'Closed 4f¹⁴ core places the final electron into 5d¹, completing lanthanide contraction.'],
  [72, 'Hf', 'Hafnium', '178.49', 6, 'd', 2, '5d', '5d²', '[Xe] 4f¹⁴ 5d² 6s²', 4, '5d² 6s²', 'P6 – d2 – 6s²', 'transition', 78, 1.30, 6.83, 208, [4], 'Solid', 'Lanthanide contraction makes Hf almost identical in size and +4 chemistry to Zirconium.'],
  [73, 'Ta', 'Tantalum', '180.95', 6, 'd', 3, '5d', '5d³', '[Xe] 4f¹⁴ 5d³ 6s²', 5, '5d³ 6s²', 'P6 – d3 – 6s²', 'transition', 77, 1.50, 7.55, 200, [5], 'Solid', 'Relativistically expanded 5d³ orbitals form ultra-refractory Ta₂O₅ passive films.'],
  [74, 'W', 'Tungsten', '183.84', 6, 'd', 4, '5d', '5d⁴', '[Xe] 4f¹⁴ 5d⁴ 6s²', 6, '5d⁴ 6s²', 'P6 – d4 – 6s²', 'transition', 76, 2.36, 7.86, 193, [4, 6], 'Solid', 'Strong 5d–5d metallic bonding produces the highest melting point of all pure metals (3422 °C).'],
  [75, 'Re', 'Rhenium', '186.21', 6, 'd', 5, '5d', '5d⁵', '[Xe] 4f¹⁴ 5d⁵ 6s²', 7, '5d⁵ 6s²', 'P6 – d5 – 6s²', 'transition', 75, 1.90, 7.83, 188, [4, 7], 'Solid', 'Half-filled 5d⁵ gives rich oxidation states (−1 to +7) and extreme high-temperature creep resistance.'],
  [76, 'Os', 'Osmium', '190.23', 6, 'd', 6, '5d', '5d⁶', '[Xe] 4f¹⁴ 5d⁶ 6s²', 8, '5d⁶ 6s²', 'P6 – d6 – 6s²', 'transition', 74, 2.20, 8.44, 185, [4, 8], 'Solid', 'Compact, high-Z 5d⁶ nucleus yields the highest density and volatile tetroxide OsO₄ (+8).'],
  [77, 'Ir', 'Iridium', '192.22', 6, 'd', 7, '5d', '5d⁷', '[Xe] 4f¹⁴ 5d⁷ 6s²', 9, '5d⁷ 6s²', 'P6 – d7 – 6s²', 'transition', 74, 2.20, 8.97, 180, [3, 4], 'Solid', 'Tightly bound 5d⁷ lattice makes Iridium the most corrosion-resistant metal known.'],
  [78, 'Pt', 'Platinum', '195.08', 6, 'd', 8, '5d', '5d⁹', '[Xe] 4f¹⁴ 5d⁹ 6s¹', 10, '5d⁹ 6s¹', 'P6 – d9 – 6s¹', 'transition', 74, 2.28, 8.96, 177, [2, 4], 'Solid', 'Relativistic 6s contraction favors 5d⁹6s¹, driving square-planar Pt(II)/Pt(IV) catalysis.', 'Aufbau anomaly: 5d⁹ 6s¹ favored over 5d⁸ 6s².'],
  [79, 'Au', 'Gold', '196.97', 6, 'd', 9, '5d', '5d¹⁰', '[Xe] 4f¹⁴ 5d¹⁰ 6s¹', 11, '5d¹⁰ 6s¹', 'P6 – d10 – 6s¹', 'transition', 75, 2.54, 9.23, 174, [1, 3], 'Solid', 'Relativistic 6s contraction shrinks the 5d–6s gap, creating gold color and noble resistance.', 'Aufbau anomaly: 5d¹⁰ 6s¹ favored over 5d⁹ 6s².'],
  [80, 'Hg', 'Mercury', '200.59', 6, 'd', 10, '5d', '5d¹⁰', '[Xe] 4f¹⁴ 5d¹⁰ 6s²', 12, '5d¹⁰ 6s²', 'P6 – d10 – 6s²', 'transition', 70, 2.00, 10.44, 171, [1, 2], 'Liquid', 'Relativistic stabilization contracts 6s², weakening Hg–Hg bonds so Mercury is liquid at 25 °C.'],
  [81, 'Tl', 'Thallium', '204.38', 6, 'p', 1, '6p', '6p¹', '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹', 3, '6s² 6p¹', 'P6 – p1 – V3', 'post-transition', 68, 1.62, 6.11, 156, [1, 3], 'Solid', 'Strong 6s² inert-pair effect makes monovalent Tl⁺ far more stable than Tl³⁺.'],
  [82, 'Pb', 'Lead', '207.2', 6, 'p', 2, '6p', '6p²', '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²', 4, '6s² 6p²', 'P6 – p2 – V4', 'post-transition', 65, 2.33, 7.42, 154, [2, 4], 'Solid', 'Relativistic 6s² stabilization favors Pb(II) while Pb(IV) acts as a strong oxidizer.'],
  [83, 'Bi', 'Bismuth', '208.98', 6, 'p', 3, '6p', '6p³', '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³', 5, '6s² 6p³', 'P6 – p3 – V5', 'post-transition', 58, 2.02, 7.29, 143, [3, 5], 'Solid', 'Inert 6s² pair isolates the 6p³ electrons, stabilizing Bi(III) and strong diamagnetism.'],
  [84, 'Po', 'Polonium', '(209)', 6, 'p', 4, '6p', '6p⁴', '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴', 6, '6s² 6p⁴', 'P6 – p4 – V6', 'post-transition', 54, 2.00, 8.42, 135, [2, 4], 'Solid', 'Spin-orbit splitting in 6p⁴ produces a simple cubic metallic lattice with +2/+4 states.'],
  [85, 'At', 'Astatine', '(210)', 6, 'p', 5, '6p', '6p⁵', '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵', 7, '6s² 6p⁵', 'P6 – p5 – V7', 'metalloid', 32, 2.20, 9.32, 127, [-1, 1], 'Solid', 'Heavy relativistic 6p⁵ halogen exhibits pronounced metalloid and cationic At⁺ behavior.'],
  [86, 'Rn', 'Radon', '(222)', 6, 'p', 6, '6p', '6p⁶', '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶', 8, '6s² 6p⁶', 'P6 – p6 – Closed', 'noble-gas', 0, 2.20, 10.75, 120, [0, 2], 'Gas', 'Dense radioactive noble gas; lower 6p⁶ ionization energy permits reactive RnF₂.'],

  // Period 7
  [87, 'Fr', 'Francium', '(223)', 7, 's', 1, '7s', '7s¹', '[Rn] 7s¹', 1, '7s¹', 'P7 – s1 – V1', 'alkali', 99, 0.70, 4.07, 348, [1], 'Solid', 'Relativistic 7s¹ contraction slightly raises ionization energy above Cs while staying ultra-alkali.'],
  [88, 'Ra', 'Radium', '(226)', 7, 's', 2, '7s', '7s²', '[Rn] 7s²', 2, '7s²', 'P7 – s2 – V2', 'alkaline-earth', 92, 0.90, 5.28, 283, [2], 'Solid', 'Two 7s² valence electrons drive classic alkaline-earth Ra²⁺ ionic chemistry.'],
  [89, 'Ac', 'Actinium', '(227)', 7, 'd', 1, '6d', '6d¹', '[Rn] 6d¹ 7s²', 3, '6d¹ 7s²', 'P7 – d1 – 7s²', 'actinide', 85, 1.10, 5.17, 195, [3], 'Solid', 'Opens 6d¹ before 5f filling begins, yielding purely trivalent Ac³⁺ chemistry.'],
  [90, 'Th', 'Thorium', '232.04', 7, 'f', 1, '5f', '6d²', '[Rn] 6d² 7s²', 4, '6d² 7s²', 'P7 – f1 – 6d²7s²', 'actinide', 84, 1.30, 6.31, 180, [4], 'Solid', '5f orbital still lies above 6d in energy at Z=90, creating tetravalent Th⁴⁺ chemistry.', 'Aufbau anomaly: ground state is 6d² 7s² with 5f empty.'],
  [91, 'Pa', 'Protactinium', '231.04', 7, 'f', 2, '5f', '5f²', '[Rn] 5f² 6d¹ 7s²', 5, '5f² 6d¹ 7s²', 'P7 – f2 – 6d¹7s²', 'actinide', 84, 1.50, 5.89, 180, [4, 5], 'Solid', 'Near-degenerate 5f² and 6d¹ orbitals participate together in covalent +5 bonding.', 'Ground state retains 6d¹ alongside 5f².'],
  [92, 'U', 'Uranium', '238.03', 7, 'f', 3, '5f', '5f³', '[Rn] 5f³ 6d¹ 7s²', 6, '5f³ 6d¹ 7s²', 'P7 – f3 – 6d¹7s²', 'actinide', 83, 1.38, 6.19, 175, [3, 4, 5, 6], 'Solid', 'Radially extended 5f³ orbitals bond covalently, enabling +3 to +6 states like UO₂²⁺.', 'Ground state retains 6d¹ alongside 5f³.'],
  [93, 'Np', 'Neptunium', '(237)', 7, 'f', 4, '5f', '5f⁴', '[Rn] 5f⁴ 6d¹ 7s²', 7, '5f⁴ 6d¹ 7s²', 'P7 – f4 – 6d¹7s²', 'actinide', 83, 1.36, 6.27, 175, [3, 4, 5, 6, 7], 'Solid', 'Delocalized 5f⁴/6d¹ valence band reaches the +7 oxidation state in aqueous solution.', 'Ground state retains 6d¹ alongside 5f⁴.'],
  [94, 'Pu', 'Plutonium', '(244)', 7, 'f', 5, '5f', '5f⁶', '[Rn] 5f⁶ 7s²', 8, '5f⁶ 7s²', 'P7 – f6 – 7s²', 'actinide', 83, 1.28, 6.03, 175, [3, 4, 5, 6], 'Solid', '5f electrons sit right at the bonding/localized boundary, yielding six complex allotropes.', '6d electron shifts into 5f⁶ 7s².'],
  [95, 'Am', 'Americium', '(243)', 7, 'f', 6, '5f', '5f⁷', '[Rn] 5f⁷ 7s²', 9, '5f⁷ 7s²', 'P7 – f7 – 7s²', 'actinide', 83, 1.13, 5.97, 175, [3, 4, 5, 6], 'Solid', 'Half-filled 5f⁷ starts contracting inward, shifting chemistry toward lanthanide-like +3.'],
  [96, 'Cm', 'Curium', '(247)', 7, 'f', 7, '5f', '5f⁷', '[Rn] 5f⁷ 6d¹ 7s²', 10, '5f⁷ 6d¹ 7s²', 'P7 – f7 – 6d¹7s²', 'actinide', 83, 1.28, 5.99, 176, [3], 'Solid', 'Symmetric half-filled 5f⁷ core favors stable trivalent Cm³⁺ like Gadolinium.', 'Ground state places the 8th valence electron in 6d¹ to keep 5f⁷ symmetric.'],
  [97, 'Bk', 'Berkelium', '(247)', 7, 'f', 8, '5f', '5f⁹', '[Rn] 5f⁹ 7s²', 11, '5f⁹ 7s²', 'P7 – f9 – 7s²', 'actinide', 83, 1.30, 6.20, 176, [3, 4], 'Solid', '5f⁹ orbitals become more core-like, stabilizing +3 with accessible Bk⁴⁺ oxidizer.'],
  [98, 'Cf', 'Californium', '(251)', 7, 'f', 9, '5f', '5f¹⁰', '[Rn] 5f¹⁰ 7s²', 12, '5f¹⁰ 7s²', 'P7 – f10 – 7s²', 'actinide', 83, 1.30, 6.28, 176, [3], 'Solid', 'Contracted 5f¹⁰ shell produces strongly localized +3 actinide behavior.'],
  [99, 'Es', 'Einsteinium', '(252)', 7, 'f', 10, '5f', '5f¹¹', '[Rn] 5f¹¹ 7s²', 13, '5f¹¹ 7s²', 'P7 – f11 – 7s²', 'actinide', 83, 1.30, 6.42, 176, [3], 'Solid', '5f¹¹ contraction increases divalent tendency while retaining dominant Es³⁺ chemistry.'],
  [100, 'Fm', 'Fermium', '(257)', 7, 'f', 11, '5f', '5f¹²', '[Rn] 5f¹² 7s²', 14, '5f¹² 7s²', 'P7 – f12 – 7s²', 'actinide', 83, 1.30, 6.50, 176, [3], 'Solid', 'Late 5f¹² filling exhibits stable +3 ions alongside detectable divalent Fm²⁺ in reduction.'],
  [101, 'Md', 'Mendelevium', '(258)', 7, 'f', 12, '5f', '5f¹³', '[Rn] 5f¹³ 7s²', 15, '5f¹³ 7s²', 'P7 – f13 – 7s²', 'actinide', 83, 1.30, 6.58, 176, [2, 3], 'Solid', 'One hole from 5f¹⁴ stability makes Md²⁺ unusually easy to form in aqueous solution.'],
  [102, 'No', 'Nobelium', '(259)', 7, 'f', 13, '5f', '5f¹⁴', '[Rn] 5f¹⁴ 7s²', 16, '5f¹⁴ 7s²', 'P7 – f14 – 7s²', 'actinide', 83, 1.30, 6.65, 176, [2, 3], 'Solid', 'Completed 5f¹⁴ subshell makes divalent No²⁺ more stable than No³⁺ in water.'],
  [103, 'Lr', 'Lawrencium', '(266)', 7, 'f', 14, '5f', '5f¹⁴', '[Rn] 5f¹⁴ 7s² 7p¹', 3, '7s² 7p¹', 'P7 – f14 – 7p¹', 'actinide', 82, 1.30, 4.90, 176, [3], 'Solid', 'Relativistic spin-orbit effects drop 7p¹ below 6d¹, while chemical valence remains +3.', 'Relativistic anomaly: ground state is 5f¹⁴ 7s² 7p¹ rather than 6d¹.'],
  [104, 'Rf', 'Rutherfordium', '(267)', 7, 'd', 2, '6d', '6d²', '[Rn] 5f¹⁴ 6d² 7s²', 4, '6d² 7s²', 'P7 – d2 – 7s²', 'transition', 78, null, 6.01, 157, [4], 'Solid', 'Predicted Group-4-like +4 halide chemistry driven by relativistic 6d²7s² orbitals.'],
  [105, 'Db', 'Dubnium', '(268)', 7, 'd', 3, '6d', '6d³', '[Rn] 5f¹⁴ 6d³ 7s²', 5, '6d³ 7s²', 'P7 – d3 – 7s²', 'transition', 77, null, 6.89, 149, [5], 'Solid', '6d³7s² valence mimics Nb/Ta pentavalent halide and oxyhalide complexes.'],
  [106, 'Sg', 'Seaborgium', '(269)', 7, 'd', 4, '6d', '6d⁴', '[Rn] 5f¹⁴ 6d⁴ 7s²', 6, '6d⁴ 7s²', 'P7 – d4 – 7s²', 'transition', 76, null, 7.85, 143, [6], 'Solid', 'Forms volatile hexacarbonyl Sg(CO)₆ and oxyhalides consistent with 6d⁴7s² hexavalence.'],
  [107, 'Bh', 'Bohrium', '(270)', 7, 'd', 5, '6d', '6d⁵', '[Rn] 5f¹⁴ 6d⁵ 7s²', 7, '6d⁵ 7s²', 'P7 – d5 – 7s²', 'transition', 75, null, 7.70, 141, [7], 'Solid', 'Half-filled 6d⁵ forms volatile oxychloride BhO₃Cl analogous to Rhenium (+7).'],
  [108, 'Hs', 'Hassium', '(277)', 7, 'd', 6, '6d', '6d⁶', '[Rn] 5f¹⁴ 6d⁶ 7s²', 8, '6d⁶ 7s²', 'P7 – d6 – 7s²', 'transition', 74, null, 7.60, 134, [8], 'Solid', '6d⁶7s² forms volatile tetroxide HsO₄ (+8), confirming homology with Osmium.'],
  [109, 'Mt', 'Meitnerium', '(278)', 7, 'd', 7, '6d', '6d⁷', '[Rn] 5f¹⁴ 6d⁷ 7s²', 9, '6d⁷ 7s²', 'P7 – d7 – 7s²', 'transition', 74, null, 8.30, 129, [3], 'Solid', 'Predicted noble 6d⁷7s² transition metal parallel to Iridium with +3/+1 states.'],
  [110, 'Ds', 'Darmstadtium', '(281)', 7, 'd', 8, '6d', '6d⁸', '[Rn] 5f¹⁴ 6d⁸ 7s²', 10, '6d⁸ 7s²', 'P7 – d8 – 7s²', 'transition', 74, null, 9.60, 128, [2, 4], 'Solid', 'Relativistic 7s² contraction retains 6d⁸7s² configuration unlike Pt (5d⁹6s¹).'],
  [111, 'Rg', 'Roentgenium', '(282)', 7, 'd', 9, '6d', '6d⁹', '[Rn] 5f¹⁴ 6d⁹ 7s²', 11, '6d⁹ 7s²', 'P7 – d9 – 7s²', 'transition', 74, null, 10.60, 121, [3], 'Solid', 'Strong relativistic contraction stabilizes Rg(III) and leaves 7s² unpromoted (6d⁹7s²).'],
  [112, 'Cn', 'Copernicium', '(285)', 7, 'd', 10, '6d', '6d¹⁰', '[Rn] 5f¹⁴ 6d¹⁰ 7s²', 12, '6d¹⁰ 7s²', 'P7 – d10 – 7s²', 'transition', 66, null, 11.97, 122, [2], 'Liquid', 'Extreme 7s² relativistic contraction makes Cn volatile and almost noble-gas-like in weak bonding.'],
  [113, 'Nh', 'Nihonium', '(286)', 7, 'p', 1, '7p', '7p¹', '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹', 3, '7s² 7p¹', 'P7 – p1 – V3', 'post-transition', 64, null, 7.31, 136, [1], 'Solid', 'Spin-orbit splitting divides 7p into 7p₁/₂ and 7p₃/₂, favoring monovalent Nh⁺.'],
  [114, 'Fl', 'Flerovium', '(289)', 7, 'p', 2, '7p', '7p²', '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²', 4, '7s² 7p²', 'P7 – p2 – V4', 'post-transition', 52, null, 8.54, 143, [2], 'Solid', 'Closed 7p₁/₂² subshell induces quasi-closed-shell volatility despite Group 14 placement.'],
  [115, 'Mc', 'Moscovium', '(290)', 7, 'p', 3, '7p', '7p³', '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³', 5, '7s² 7p³', 'P7 – p3 – V5', 'post-transition', 56, null, 5.58, 162, [1, 3], 'Solid', 'Single electron in 7p₃/₂ above 7p₁/₂² favors low-ionization Mc⁺ (+1) chemistry.'],
  [116, 'Lv', 'Livermorium', '(293)', 7, 'p', 4, '7p', '7p⁴', '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴', 6, '7s² 7p⁴', 'P7 – p4 – V6', 'post-transition', 50, null, 6.80, 175, [2], 'Solid', 'Spin-orbit split 7p⁴ favors divalent metallic Lv²⁺ over higher chalcogen states.'],
  [117, 'Ts', 'Tennessine', '(294)', 7, 'p', 5, '7p', '7p⁵', '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵', 7, '7s² 7p⁵', 'P7 – p5 – V7', 'metalloid', 40, null, 7.70, 165, [1, 3], 'Solid', 'Relativistic 7p⁵ destabilization suppresses Ts⁻ formation, giving metalloid +1/+3 character.'],
  [118, 'Og', 'Oganesson', '(294)', 7, 'p', 6, '7p', '7p⁶', '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶', 8, '7s² 7p⁶', 'P7 – p6 – Closed', 'noble-gas', 15, null, 8.91, 157, [0, 2], 'Solid', 'Spin-orbit broadening blurs the 7p⁶ shell gap, predicting polarizable solid behavior.'],
];

export const ELEMENTS: ChemicalElement[] = RAW_ELEMENTS.map((row) => {
  const [
    z,
    symbol,
    name,
    atomicMass,
    period,
    block,
    blockSlot,
    differentiatingOrbital,
    differentiatingConfig,
    condensedConfig,
    valenceElectrons,
    valenceStructure,
    quantumAddress,
    family,
    metallicCharacter,
    electronegativity,
    ionizationEnergy,
    atomicRadius,
    oxidationStates,
    standardState,
    chemicalBehavior,
    anomalyNote,
  ] = row;

  const isotopes = ISOTOPES_BY_Z[z] ?? [];
  const stableIsotopesCount = isotopes.filter((iso) => iso.stable).length;

  return {
    z,
    symbol,
    name,
    atomicMass,
    period,
    block,
    blockSlot,
    col32: getCol32(block, blockSlot),
    subshellLabel: `${block}${SUPERSCRIPTS[blockSlot] ?? blockSlot}`,
    differentiatingOrbital,
    differentiatingConfig,
    fullConfig: expandConfig(condensedConfig),
    condensedConfig,
    valenceElectrons,
    valenceStructure,
    quantumAddress,
    family,
    metallicCharacter,
    electronegativity,
    ionizationEnergy,
    atomicRadius,
    oxidationStates,
    standardState,
    chemicalBehavior,
    anomalyNote,
    stableIsotopesCount,
    isotopes,
  };
});

export const ELEMENTS_BY_Z = new Map<number, ChemicalElement>(
  ELEMENTS.map((el) => [el.z, el])
);

import { useEffect, useState } from 'react';
import { AtomicComparisonStudio } from './components/AtomicComparisonStudio';
import { ConceptReferenceSection } from './components/ConceptReferenceSection';
import { ContinuousMapView } from './components/ContinuousMapView';
import { ElementInspector } from './components/ElementInspector';
import { ElementSearchModal } from './components/ElementSearchModal';
import { OrbitalStaircaseView } from './components/OrbitalStaircaseView';
import { PhaseSpace3DView } from './components/PhaseSpace3DView';
import { PropertyLegend } from './components/PropertyLegend';
import { QuantumTrendPlotter } from './components/QuantumTrendPlotter';
import { RadialCoreView } from './components/RadialCoreView';
import { TopBar } from './components/TopBar';
import { WorkspaceToolbar } from './components/WorkspaceToolbar';
import { ELEMENTS_BY_Z } from './data/elements';
import { ChemicalElement, ChemicalFamily, ColorOverlayMode, ViewMode } from './types/element';

const DEFAULT_ELEMENT = ELEMENTS_BY_Z.get(6)!; // Carbon (Z = 6, P2 – p2 – V4)
const DEFAULT_COMPARE = ELEMENTS_BY_Z.get(14)!; // Silicon (Z = 14, P3 – p2 – V4)

export default function App() {
  const [selectedElement, setSelectedElement] = useState<ChemicalElement>(DEFAULT_ELEMENT);
  const [compareElement, setCompareElement] = useState<ChemicalElement>(DEFAULT_COMPARE);
  const [compareMode, setCompareMode] = useState(false);
  const [activeCompareSlot, setActiveCompareSlot] = useState<'A' | 'B'>('B');
  const [viewMode, setViewMode] = useState<ViewMode>('continuous');
  const [overlay, setOverlay] = useState<ColorOverlayMode>('block');
  const [familyFilter, setFamilyFilter] = useState<ChemicalFamily | 'all'>('all');
  const [isDark, setIsDark] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleElementSelect = (el: ChemicalElement) => {
    if (compareMode && activeCompareSlot === 'B') {
      setCompareElement(el);
    } else {
      setSelectedElement(el);
    }
  };

  const handleToggleCompareMode = () => {
    setCompareMode((prev) => {
      const next = !prev;
      if (next) {
        setActiveCompareSlot('B');
      }
      return next;
    });
  };

  const handleSwapComparison = () => {
    setSelectedElement(compareElement);
    setCompareElement(selectedElement);
  };

  // Sync Tailwind v4 .dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Global Cmd+K / Ctrl+K shortcut for element search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div id="top" className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#07090E] text-slate-900 dark:text-slate-100">
      <TopBar onOpenSearch={() => setSearchOpen(true)} />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Compact Scientific Intro Strip */}
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1 max-w-3xl">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 [text-wrap:balance]">
              Organized by atomic orbital filling, not arbitrary columns
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              All 118 elements arranged across continuous <span className="font-mono">s → f → d → p</span> subshells, principal energy levels (<span className="font-mono">n = 1..7</span>), and chemical property fields.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>Jump to:</span>
            {[
              { z: 6, label: 'C (P2–p2)' },
              { z: 26, label: 'Fe (P4–d6)' },
              { z: 8, label: 'O (P2–p4)' },
              { z: 64, label: 'Gd (P6–f7)' },
              { z: 79, label: 'Au (P6–d10)' },
            ].map((item) => {
              const el = ELEMENTS_BY_Z.get(item.z);
              if (!el) return null;
              const active = selectedElement.z === item.z;
              return (
                <button
                  key={item.z}
                  type="button"
                  onClick={() => setSelectedElement(el)}
                  className={`font-mono transition-colors cursor-pointer ${
                    active
                      ? 'font-semibold text-blue-600 dark:text-blue-400 underline underline-offset-4'
                      : 'hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Workspace Mode, Field Overlay, Neighborhood Filter & Theme Toolbar */}
        <WorkspaceToolbar
          viewMode={viewMode}
          onChangeView={setViewMode}
          overlay={overlay}
          onChangeOverlay={setOverlay}
          familyFilter={familyFilter}
          onChangeFamilyFilter={setFamilyFilter}
          compareMode={compareMode}
          onToggleCompare={handleToggleCompareMode}
          isDark={isDark}
          onToggleDark={() => setIsDark((d) => !d)}
        />

        {compareMode && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D111A] text-xs">
            <div className="flex flex-wrap items-center gap-2 font-mono">
              <span className="font-sans font-semibold text-slate-800 dark:text-slate-200">
                Comparison Mode:
              </span>
              <span className="text-blue-600 dark:text-blue-400">
                A = {selectedElement.symbol} ({selectedElement.z})
              </span>
              <span className="text-slate-400">vs</span>
              <span className="text-teal-600 dark:text-teal-400">
                B = {compareElement.symbol} ({compareElement.z})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">Map clicks update:</span>
              <button
                type="button"
                onClick={() => setActiveCompareSlot('A')}
                className={`px-2 py-0.5 font-mono rounded border cursor-pointer ${
                  activeCompareSlot === 'A'
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Target A
              </button>
              <button
                type="button"
                onClick={() => setActiveCompareSlot('B')}
                className={`px-2 py-0.5 font-mono rounded border cursor-pointer ${
                  activeCompareSlot === 'B'
                    ? 'border-teal-600 bg-teal-600 text-white'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Target B
              </button>
              <a
                href="#atomic-shell-studio"
                className="ml-1 font-semibold text-slate-900 dark:text-slate-100 underline underline-offset-4"
              >
                View Matrix ↓
              </a>
            </div>
          </div>
        )}

        {/* Primary Interactive Map Viewport */}
        <section
          id="quantum-stage"
          aria-label="Quantum Periodic Map Interactive Stage"
          className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-slate-800 rounded-lg p-4 sm:p-5 space-y-4"
        >
          <PropertyLegend
            overlay={overlay}
            familyFilter={familyFilter}
            onChangeFamilyFilter={setFamilyFilter}
          />

          <div className="pt-1 border-t border-slate-100 dark:border-slate-800/80">
            {viewMode === 'continuous' && (
              <ContinuousMapView
                selectedElement={compareMode && activeCompareSlot === 'B' ? compareElement : selectedElement}
                onSelectElement={handleElementSelect}
                overlay={overlay}
                familyFilter={familyFilter}
                isDark={isDark}
              />
            )}

            {viewMode === 'staircase' && (
              <OrbitalStaircaseView
                selectedElement={compareMode && activeCompareSlot === 'B' ? compareElement : selectedElement}
                onSelectElement={handleElementSelect}
                overlay={overlay}
                familyFilter={familyFilter}
                isDark={isDark}
              />
            )}

            {viewMode === 'radial' && (
              <RadialCoreView
                selectedElement={compareMode && activeCompareSlot === 'B' ? compareElement : selectedElement}
                onSelectElement={handleElementSelect}
                overlay={overlay}
                familyFilter={familyFilter}
                isDark={isDark}
              />
            )}

            {viewMode === 'phase3d' && (
              <PhaseSpace3DView
                selectedElement={compareMode && activeCompareSlot === 'B' ? compareElement : selectedElement}
                onSelectElement={handleElementSelect}
                overlay={overlay}
                familyFilter={familyFilter}
                isDark={isDark}
              />
            )}
          </div>
        </section>

        {/* Detailed Quantum Address & Orbital Causality Inspector */}
        <ElementInspector
          element={selectedElement}
          onSelectElement={setSelectedElement}
        />

        {/* Dynamic Bohr-Style Shell Diagram & Side-by-Side Comparison Studio */}
        <AtomicComparisonStudio
          selectedElement={selectedElement}
          compareElement={compareElement}
          compareMode={compareMode}
          activeSlot={activeCompareSlot}
          onToggleCompareMode={handleToggleCompareMode}
          onChangeActiveSlot={setActiveCompareSlot}
          onSelectElementA={setSelectedElement}
          onSelectElementB={setCompareElement}
          onSwapElements={handleSwapComparison}
          isDark={isDark}
        />

        {/* Recharts Ionization Energy & Electronegativity Quantum Trend Plotter */}
        <QuantumTrendPlotter
          selectedElement={selectedElement}
          onSelectElement={setSelectedElement}
          isDark={isDark}
        />

        {/* First-Principles Reference & Conventional Comparison */}
        <ConceptReferenceSection onSelectElement={setSelectedElement} />
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0E17] mt-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>Quantum Periodic Map · 118-Element Orbital Architecture</span>
          <span className="font-mono">
            Sequence: Electron Configuration → Periodicity → Chemical Properties
          </span>
        </div>
      </footer>

      <ElementSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectElement={handleElementSelect}
      />
    </div>
  );
}

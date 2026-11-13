import { Box, GitCompare, Layers, Moon, Orbit, Sun, TrendingUp } from 'lucide-react';
import { ChemicalFamily, ColorOverlayMode, ViewMode } from '../types/element';
import { FAMILY_META } from '../utils/quantum';

interface WorkspaceToolbarProps {
  viewMode: ViewMode;
  onChangeView: (mode: ViewMode) => void;
  overlay: ColorOverlayMode;
  onChangeOverlay: (overlay: ColorOverlayMode) => void;
  familyFilter: ChemicalFamily | 'all';
  onChangeFamilyFilter: (family: ChemicalFamily | 'all') => void;
  compareMode: boolean;
  onToggleCompare: () => void;
  isDark: boolean;
  onToggleDark: () => void;
}

const VIEW_TABS: Array<{ id: ViewMode; label: string; icon: typeof Layers }> = [
  { id: 'continuous', label: 'Continuous 32-Col', icon: Layers },
  { id: 'staircase', label: 'Orbital Staircase', icon: TrendingUp },
  { id: 'radial', label: 'Radial Core', icon: Orbit },
  { id: 'phase3d', label: '3D Phase-Space', icon: Box },
];

const OVERLAY_OPTIONS: Array<{ id: ColorOverlayMode; label: string }> = [
  { id: 'block', label: 'Orbital Blocks (s·f·d·p)' },
  { id: 'family', label: 'Chemical Neighborhoods' },
  { id: 'electronegativity', label: 'Electronegativity Field' },
  { id: 'radius', label: 'Atomic Radius Field' },
  { id: 'ionization', label: 'Ionization Energy Field' },
  { id: 'metallic', label: 'Metallic Character' },
];

export function WorkspaceToolbar({
  viewMode,
  onChangeView,
  overlay,
  onChangeOverlay,
  familyFilter,
  onChangeFamilyFilter,
  compareMode,
  onToggleCompare,
  isDark,
  onToggleDark,
}: WorkspaceToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-slate-800 rounded-lg">
      {/* View Mode Segmented Tabs */}
      <div
        role="tablist"
        aria-label="Quantum Periodic Map projection views"
        className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-md overflow-x-auto max-w-full"
      >
        {VIEW_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = viewMode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChangeView(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600 ${
                active
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Field Overlay, Neighborhood Filter & Theme Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1.5">
          <label
            htmlFor="overlay-select"
            className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap"
          >
            Field:
          </label>
          <select
            id="overlay-select"
            value={overlay}
            onChange={(e) => onChangeOverlay(e.target.value as ColorOverlayMode)}
            className="text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-md px-2.5 py-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            {OVERLAY_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label
            htmlFor="family-select"
            className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap"
          >
            Region:
          </label>
          <select
            id="family-select"
            value={familyFilter}
            onChange={(e) => onChangeFamilyFilter(e.target.value as ChemicalFamily | 'all')}
            className="text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-md px-2.5 py-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <option value="all">All 118 Elements</option>
            {(Object.keys(FAMILY_META) as ChemicalFamily[]).map((fam) => (
              <option key={fam} value={fam}>
                {FAMILY_META[fam].label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onToggleCompare}
          aria-pressed={compareMode}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600 ${
            compareMode
              ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <GitCompare className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Compare</span>
        </button>

        <button
          type="button"
          onClick={onToggleDark}
          aria-label={isDark ? 'Switch to Light Lab Theme' : 'Switch to Dark Observatory Theme'}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>Lab Light</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
              <span>Observatory Dark</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

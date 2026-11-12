import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Scissors,
  Sprout,
  ShieldAlert,
  Download,
  Search,
  CheckCircle2,
  Droplets,
  X,
  Sun,
  MapPin,
  Calendar,
  Edit3,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  RHS_PLANT_CATALOG,
  RhsCatalogPlant,
  PLANT_CATEGORY_DEFINITIONS,
  resolvePlantGroupCategory,
  getPlantMonthlyCareStatus,
  PlantMonthlyCareStatus,
  calculatePlantHealthScore,
  PlantHealthAssessment
} from '../utils/rhsPlantCatalog';
import {
  getDynamicRiskMitigation,
  generateHadstonMasterGuideMarkdown
} from '../utils/hadstonMasterGuide';
import PlantThumbnailWithModal from './PlantThumbnailWithModal';

export interface MasterGuidePlantInventoryItem {
  id: string;
  name: string;
  commonName?: string;
  botanicalName?: string;
  category?: string;
  rhsRating: string;
  location: string;
  growthStage: string;
  vulnerabilities: string[];
  photoUrl?: string;
  rhsUrl?: string;
  isAgm?: boolean;
  isPollinatorFriendly?: boolean;
  soilAndSun?: string;
  feedWindowUk?: string;
  feedTypeNpk?: string;
  feedFrequencyDosage?: string;
  pruneMonthsUk?: string;
  pruneType?: string;
  pruneTechnique?: string;
  pruneAvoid?: string;
  overwinteringProtocol?: string;
  idDisambiguationNote?: string;
}

export interface MasterGuidePlantCareLogEntry {
  lastFed?: string;
  lastPruned?: string;
  lastProtected?: string;
  notes?: string;
}

interface HadstonMasterGuidePanelProps {
  locationName?: string;
  rhsHardinessZone?: string;
  plantInventory?: MasterGuidePlantInventoryItem[];
  plantHealthMap?: Map<string, PlantHealthAssessment>;
  plantMonthlyCareMap?: Map<string, PlantMonthlyCareStatus>;
  plantCareLogs?: Record<string, MasterGuidePlantCareLogEntry>;
  currentUkMonthIdx?: number;
  weatherAlerts?: any[];
  hazardSummary?: any;
  focusedPlantId?: string | null;
  onClearFocusedPlant?: () => void;
  onAddSingleCatalogPlant: (plant: RhsCatalogPlant) => void;
  onEditGardenPlant?: (plant: MasterGuidePlantInventoryItem) => void;
  onRecordPlantCareAction?: (
    plantKey: string,
    actionType: 'lastFed' | 'lastPruned' | 'lastProtected'
  ) => void;
  onUpdatePlantPersonalNote?: (plantKey: string, notes: string) => void;
}

interface UnifiedGuidePlantEntry {
  key: string;
  displayName: string;
  botanicalName?: string;
  category: string;
  rhsRating: string;
  photoRef?: number;
  photoUrl?: string;
  rhsUrl?: string;
  inGarden: boolean;
  gardenPlant?: MasterGuidePlantInventoryItem;
  catalogPlant?: RhsCatalogPlant;
  location: string;
  growthStage: string;
  vulnerabilities: string[];
  soilAndSun: string;
  feedWindowUk: string;
  feedTypeNpk: string;
  feedFrequencyDosage: string;
  pruneMonthsUk: string;
  pruneType: string;
  pruneTechnique: string;
  pruneAvoid: string;
  overwinteringProtocol: string;
  idDisambiguationNote?: string;
  careLogKey: string;
  health: PlantHealthAssessment;
  monthlyCare: PlantMonthlyCareStatus;
}

function cleanDisplayPlantName(name: string): string {
  return name.replace(/^#\d+\s+/, '').trim();
}

export default function HadstonMasterGuidePanel({
  locationName,
  rhsHardinessZone = 'H4–H5',
  plantInventory = [],
  plantHealthMap,
  plantMonthlyCareMap,
  plantCareLogs = {},
  currentUkMonthIdx = new Date().getMonth(),
  weatherAlerts = [],
  hazardSummary = {},
  focusedPlantId,
  onClearFocusedPlant,
  onAddSingleCatalogPlant,
  onEditGardenPlant,
  onRecordPlantCareAction,
  onUpdatePlantPersonalNote
}: HadstonMasterGuidePanelProps) {
  const [plantFilterQuery, setPlantFilterQuery] = useState<string>('');
  const [scopeFilter, setScopeFilter] = useState<'MY_GARDEN' | 'DUE_THIS_MONTH'>('MY_GARDEN');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [rhsFilter, setRhsFilter] = useState<'ALL' | 'TENDER_H1_H4' | 'HARDY_H5_H7'>('ALL');
  const [expandedPlantKeys, setExpandedPlantKeys] = useState<Record<string, boolean>>({});
  const [expandedHealthKeys, setExpandedHealthKeys] = useState<Record<string, boolean>>({});
  const [showRegionalRules, setShowRegionalRules] = useState<boolean>(false);

  // Build guide entries exclusively from the plants selected in the user's My Garden Plants (plantInventory)
  const unifiedPlants = useMemo<UnifiedGuidePlantEntry[]>(() => {
    const catalogById = new Map<string, RhsCatalogPlant>();
    const catalogByLowerName = new Map<string, RhsCatalogPlant>();

    for (const cp of RHS_PLANT_CATALOG) {
      catalogById.set(cp.catalogId.toLowerCase(), cp);
      catalogByLowerName.set(cp.name.toLowerCase(), cp);
      catalogByLowerName.set(cp.commonName.toLowerCase(), cp);
      if (cp.botanicalName) {
        catalogByLowerName.set(cp.botanicalName.toLowerCase(), cp);
      }
    }

    const entries: UnifiedGuidePlantEntry[] = [];

    for (const gp of plantInventory) {
      const cleanedLower = cleanDisplayPlantName(gp.name).toLowerCase();
      const matchedCatalog =
        catalogById.get(gp.id.toLowerCase()) ||
        catalogByLowerName.get(cleanedLower) ||
        catalogByLowerName.get(gp.name.toLowerCase()) ||
        (gp.commonName ? catalogByLowerName.get(gp.commonName.toLowerCase()) : undefined) ||
        (gp.botanicalName ? catalogByLowerName.get(gp.botanicalName.toLowerCase()) : undefined);

      const careLogKey = matchedCatalog ? matchedCatalog.catalogId : gp.id;
      const careLog = plantCareLogs[gp.id] || plantCareLogs[careLogKey];

      const effectiveGrowthStage =
        gp.growthStage || matchedCatalog?.defaultOctGrowthStage || 'Established';
      const effectiveLocation =
        gp.location || matchedCatalog?.recommendedLocation || 'Main Garden Border';
      const effectiveRhs = gp.rhsRating || matchedCatalog?.rhsRating || 'H4';
      const effectiveVulnerabilities =
        gp.vulnerabilities && gp.vulnerabilities.length > 0
          ? gp.vulnerabilities
          : matchedCatalog?.vulnerabilities || [];

      const health =
        plantHealthMap?.get(gp.id) ||
        calculatePlantHealthScore(
          {
            id: gp.id,
            name: gp.name,
            rhsRating: effectiveRhs,
            growthStage: effectiveGrowthStage,
            vulnerabilities: effectiveVulnerabilities
          },
          {
            weatherAlerts,
            hazardSummary,
            careLog
          }
        );

      const monthlyCare =
        plantMonthlyCareMap?.get(gp.id) ||
        getPlantMonthlyCareStatus(
          {
            id: gp.id,
            name: gp.name,
            rhsRating: effectiveRhs,
            feedWindowUk: gp.feedWindowUk || matchedCatalog?.feedWindowUk,
            pruneMonthsUk: gp.pruneMonthsUk || matchedCatalog?.pruneMonthsUk
          },
          currentUkMonthIdx
        );

      entries.push({
        key: gp.id,
        displayName: gp.commonName || cleanDisplayPlantName(gp.name),
        botanicalName: gp.botanicalName || matchedCatalog?.botanicalName,
        category: gp.category || resolvePlantGroupCategory(gp),
        rhsRating: effectiveRhs,
        photoRef: matchedCatalog?.photoRef,
        photoUrl: gp.photoUrl || matchedCatalog?.photoUrl,
        rhsUrl: gp.rhsUrl || matchedCatalog?.rhsUrl,
        inGarden: true,
        gardenPlant: gp,
        catalogPlant: matchedCatalog,
        location: effectiveLocation,
        growthStage: effectiveGrowthStage,
        vulnerabilities: effectiveVulnerabilities,
        soilAndSun:
          gp.soilAndSun ||
          matchedCatalog?.soilAndSun ||
          'Moist, well-drained fertile garden loam amended with organic compost.',
        feedWindowUk: gp.feedWindowUk || matchedCatalog?.feedWindowUk || 'March to July',
        feedTypeNpk:
          gp.feedTypeNpk ||
          matchedCatalog?.feedTypeNpk ||
          'Balanced slow-release organic fertiliser or liquid seaweed feed',
        feedFrequencyDosage:
          gp.feedFrequencyDosage ||
          matchedCatalog?.feedFrequencyDosage ||
          'Apply in spring as active growth begins; avoid high-nitrogen feeds after July.',
        pruneMonthsUk:
          gp.pruneMonthsUk || matchedCatalog?.pruneMonthsUk || 'Late winter or after flowering',
        pruneType: gp.pruneType || matchedCatalog?.pruneType || 'Routine Maintenance',
        pruneTechnique:
          gp.pruneTechnique ||
          matchedCatalog?.pruneTechnique ||
          'Remove dead, damaged, or crossing stems and lightly shape.',
        pruneAvoid:
          gp.pruneAvoid ||
          matchedCatalog?.pruneAvoid ||
          'Avoid heavy pruning during hard frost.',
        overwinteringProtocol:
          gp.overwinteringProtocol ||
          matchedCatalog?.overwinteringProtocol ||
          'Mulch root zone with 5cm composted bark before winter frost and ensure free drainage.',
        idDisambiguationNote: gp.idDisambiguationNote || matchedCatalog?.idDisambiguationNote,
        careLogKey: gp.id,
        health,
        monthlyCare
      });
    }

    return entries.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [
    plantInventory,
    plantHealthMap,
    plantMonthlyCareMap,
    plantCareLogs,
    currentUkMonthIdx,
    weatherAlerts,
    hazardSummary
  ]);

  // If navigated from a specific plant on the My Plants tab, focus & expand it
  useEffect(() => {
    if (!focusedPlantId) return;
    setExpandedPlantKeys((prev) => ({ ...prev, [focusedPlantId]: true }));
    onClearFocusedPlant?.();
  }, [focusedPlantId, onClearFocusedPlant]);

  const dueThisMonthCount = useMemo(
    () => unifiedPlants.filter((p) => p.inGarden && p.monthlyCare.isDueThisMonth).length,
    [unifiedPlants]
  );

  const filteredEntries = useMemo(() => {
    const q = plantFilterQuery.trim().toLowerCase();
    return unifiedPlants.filter((entry) => {
      if (!entry.inGarden) return false;
      if (scopeFilter === 'DUE_THIS_MONTH' && !entry.monthlyCare.isDueThisMonth) return false;
      if (categoryFilter !== 'ALL' && entry.category !== categoryFilter) return false;
      if (
        rhsFilter === 'TENDER_H1_H4' &&
        !['H1a', 'H1b', 'H1c', 'H2', 'H3', 'H4'].includes(entry.rhsRating)
      ) {
        return false;
      }
      if (rhsFilter === 'HARDY_H5_H7' && !['H5', 'H6', 'H7'].includes(entry.rhsRating)) {
        return false;
      }
      if (!q) return true;
      return (
        entry.displayName.toLowerCase().includes(q) ||
        (entry.botanicalName && entry.botanicalName.toLowerCase().includes(q)) ||
        entry.soilAndSun.toLowerCase().includes(q) ||
        entry.pruneMonthsUk.toLowerCase().includes(q) ||
        entry.feedWindowUk.toLowerCase().includes(q) ||
        entry.location.toLowerCase().includes(q) ||
        entry.rhsRating.toLowerCase() === q
      );
    });
  }, [unifiedPlants, plantFilterQuery, scopeFilter, categoryFilter, rhsFilter]);

  const togglePlantExpanded = (key: string) => {
    setExpandedPlantKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleHealthFactors = (key: string) => {
    setExpandedHealthKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDownloadMarkdown = () => {
    try {
      const md = generateHadstonMasterGuideMarkdown(
        locationName || 'My Garden Plot',
        plantInventory
      );
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'master-horticulturist-garden-guide.md');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[HadstonMasterGuidePanel] Markdown export failed:', err);
    }
  };

  return (
    <section
      data-testid="hadston-master-guide-panel"
      aria-label="Master Horticulturist Guide"
      className="space-y-4"
    >
      {/* Header & Unified Search / Filter Bar (Sync button removed) */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                Master Horticulturist Guide
              </span>
              <span className="text-xs text-slate-500">
                · {locationName || 'Your Garden Plot'} (RHS {rhsHardinessZone})
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              Unified Plant Care, Health &amp; Botanical Reference ({plantInventory.length}{' '}
              {plantInventory.length === 1 ? 'Plant' : 'Plants'})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete plant health scores, growth stages, feeding, pruning, winter care, and personal care logs for your garden plants.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadMarkdown}
              className="min-h-[36px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-stone-100 hover:bg-stone-200 text-slate-800 border border-stone-300 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-700 shrink-0" />
              <span>Export Guide (.md)</span>
            </button>
          </div>
        </div>

        {/* Search Input & Scope Filters */}
        <div className="pt-2 border-t border-stone-100 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                data-testid="master-guide-search-input"
                value={plantFilterQuery}
                onChange={(e) => setPlantFilterQuery(e.target.value)}
                placeholder="Search my garden plants by name, botanical name, soil pH, feeding, or pruning month..."
                className="w-full min-h-[38px] pl-9 pr-8 py-1.5 text-xs sm:text-sm rounded-xl bg-stone-50 border border-stone-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-700"
              />
              {plantFilterQuery && (
                <button
                  type="button"
                  onClick={() => setPlantFilterQuery('')}
                  aria-label="Clear filter"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                data-testid="guide-scope-my-garden"
                onClick={() => setScopeFilter('MY_GARDEN')}
                aria-pressed={scopeFilter === 'MY_GARDEN'}
                className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold border transition whitespace-nowrap shrink-0 cursor-pointer ${
                  scopeFilter === 'MY_GARDEN'
                    ? 'bg-emerald-800 text-white border-emerald-800'
                    : 'bg-white text-slate-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                In My Garden ({plantInventory.length})
              </button>

              <button
                type="button"
                data-testid="filter-due-this-month-button"
                onClick={() =>
                  setScopeFilter((prev) =>
                    prev === 'DUE_THIS_MONTH' ? 'MY_GARDEN' : 'DUE_THIS_MONTH'
                  )
                }
                aria-pressed={scopeFilter === 'DUE_THIS_MONTH'}
                className={`min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition whitespace-nowrap shrink-0 cursor-pointer ${
                  scopeFilter === 'DUE_THIS_MONTH'
                    ? 'bg-emerald-800 text-white border-emerald-800'
                    : 'bg-emerald-50/80 text-emerald-950 border-emerald-200 hover:bg-emerald-100/80'
                }`}
              >
                <Calendar className="w-3 h-3 shrink-0" />
                <span>Due This Month ({dueThisMonthCount})</span>
              </button>
            </div>
          </div>

          {/* Category & Hardiness Filter Row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'ALL', label: 'All Categories' },
                ...PLANT_CATEGORY_DEFINITIONS.map((c) => ({ id: c.id, label: c.label }))
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition whitespace-nowrap cursor-pointer ${
                    categoryFilter === cat.id
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                      : 'bg-white text-slate-600 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'ALL', label: 'All RHS Zones' },
                { id: 'TENDER_H1_H4', label: 'Tender / Borderline (H1–H4)' },
                { id: 'HARDY_H5_H7', label: 'Hardy (H5–H7)' }
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setRhsFilter(pill.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition whitespace-nowrap cursor-pointer ${
                    rhsFilter === pill.id
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-white text-slate-600 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Unified Plant Reference & Care Cards (Each plant shown ONCE with zero duplication) */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white border border-stone-200/90 rounded-2xl p-6 text-center text-xs sm:text-sm text-slate-500 space-y-2">
          <p className="font-semibold text-slate-700">
            {plantInventory.length === 0
              ? 'You have not added any plants to My Garden Plants yet.'
              : 'No plants in your garden match your current filter.'}
          </p>
          {plantInventory.length === 0 ? (
            <p className="text-xs text-slate-500">
              Use the live RHS Plant Finder on the Plants tab to add plants to your garden and view their care profiles here.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => {
                setScopeFilter('MY_GARDEN');
                setCategoryFilter('ALL');
                setRhsFilter('ALL');
                setPlantFilterQuery('');
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-800 text-white hover:bg-emerald-700 transition cursor-pointer"
            >
              Show All {plantInventory.length} Plants In My Garden
            </button>
          )}
        </div>
      ) : (
        <div data-testid="master-guide-unified-plants" className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredEntries.map((entry) => {
            const isExpanded = Boolean(expandedPlantKeys[entry.key]);
            const isHealthOpen = Boolean(expandedHealthKeys[entry.key]);
            const isTender = ['H1a', 'H1b', 'H1c', 'H2', 'H3'].includes(entry.rhsRating);
            const careLog = plantCareLogs[entry.careLogKey];
            const hasCareLog = Boolean(
              careLog &&
                (careLog.lastFed ||
                  careLog.lastPruned ||
                  careLog.lastProtected ||
                  (careLog.notes && careLog.notes.trim() !== ''))
            );

            return (
              <div
                key={entry.key}
                data-testid={`master-guide-plant-card-${entry.key}`}
                className="bg-white border border-stone-200/90 hover:border-emerald-600/60 rounded-2xl p-4 shadow-xs transition flex flex-col justify-between gap-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <PlantThumbnailWithModal
                        plantId={entry.key}
                        plantName={entry.displayName}
                        photoRef={entry.photoRef}
                        photoUrl={entry.photoUrl}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                            {entry.displayName}
                          </h3>
                          {entry.inGarden && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-900">
                              In My Garden ✓
                            </span>
                          )}
                          {entry.rhsUrl && (
                            <a
                              href={entry.rhsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-1.5 py-0.5 rounded-md bg-stone-100 hover:bg-emerald-50 border border-stone-200 text-[10px] font-semibold text-emerald-800 transition"
                            >
                              rhs.org.uk ↗
                            </a>
                          )}
                        </div>
                        {entry.botanicalName && (
                          <p className="text-xs italic text-slate-500 truncate">
                            {entry.botanicalName}
                          </p>
                        )}

                        {/* Unified Status Badges: Health Score, RHS Rating, Due This Month, Care Logged */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <button
                            type="button"
                            data-testid={`plant-health-indicator-${entry.key}`}
                            aria-expanded={isHealthOpen}
                            aria-label={`Health score ${entry.health.score}% ${entry.health.label} for ${entry.displayName} — tap to view contributing factors`}
                            onClick={() => toggleHealthFactors(entry.key)}
                            className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-md border tabular-nums transition cursor-pointer ${
                              entry.health.status === 'THRIVING'
                                ? 'bg-emerald-50/90 hover:bg-emerald-100/90 text-emerald-950 border-emerald-200'
                                : entry.health.status === 'WATCH'
                                ? 'bg-amber-50/90 hover:bg-amber-100/90 text-amber-950 border-amber-200'
                                : 'bg-rose-50/90 hover:bg-rose-100/90 text-rose-950 border-rose-200'
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                entry.health.status === 'THRIVING'
                                  ? 'bg-emerald-500'
                                  : entry.health.status === 'WATCH'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                            <span>
                              {entry.health.score}% {entry.health.label}
                            </span>
                            {isHealthOpen ? (
                              <ChevronUp className="w-3 h-3 opacity-75 shrink-0" />
                            ) : (
                              <ChevronDown className="w-3 h-3 opacity-75 shrink-0" />
                            )}
                          </button>

                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                              isTender
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : 'bg-stone-50 text-slate-700 border-stone-200'
                            }`}
                          >
                            RHS {entry.rhsRating}
                          </span>

                          {entry.monthlyCare.isDueThisMonth && (
                            <span
                              data-testid={`plant-due-badge-${entry.key}`}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                entry.monthlyCare.pruneDue
                                  ? 'bg-amber-100/90 text-amber-950 border-amber-300'
                                  : entry.monthlyCare.feedDue
                                  ? 'bg-emerald-100/90 text-emerald-950 border-emerald-300'
                                  : 'bg-sky-100/90 text-sky-950 border-sky-300'
                              }`}
                            >
                              {entry.monthlyCare.badgeLabel}
                            </span>
                          )}

                          {hasCareLog && (
                            <span
                              data-testid={`plant-care-logged-badge-${entry.key}`}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-200/80 text-slate-800"
                            >
                              Care Logged ✓
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Add to Garden or Edit Garden Plant Button */}
                    <div className="flex items-center gap-1 shrink-0">
                      {entry.inGarden && entry.gardenPlant && onEditGardenPlant ? (
                        <button
                          type="button"
                          onClick={() => onEditGardenPlant(entry.gardenPlant!)}
                          aria-label={`Edit ${entry.displayName}`}
                          title="Edit growth stage, border location, or hardiness"
                          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-stone-100 transition cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      ) : entry.catalogPlant ? (
                        <button
                          type="button"
                          onClick={() => onAddSingleCatalogPlant(entry.catalogPlant!)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition cursor-pointer"
                        >
                          + Add
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Growth Stage, Plot Position & Active Weather Alerts Summary */}
                  <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-1 border-t border-stone-100">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                      <span>{entry.location}</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span data-testid={`plant-growth-stage-${entry.key}`}>
                      Stage: <strong className="font-semibold text-slate-800">{entry.growthStage}</strong>
                    </span>
                    {entry.health.activeAlertCount > 0 && (
                      <span className="text-amber-800 font-semibold">
                        · {entry.health.activeAlertCount} weather{' '}
                        {entry.health.activeAlertCount === 1 ? 'alert' : 'alerts'} active
                      </span>
                    )}
                  </div>

                  {/* Expandable Contributing Health Factors Breakdown */}
                  {isHealthOpen && (
                    <div
                      data-testid={`plant-health-factors-${entry.key}`}
                      className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/90 space-y-1.5 text-[11px]"
                    >
                      <div className="flex items-center justify-between gap-2 pb-1 border-b border-stone-200/70">
                        <span className="font-bold text-slate-800">
                          Contributing Health Factors ({entry.health.score}%)
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleHealthFactors(entry.key)}
                          className="text-slate-500 hover:text-slate-800 font-semibold px-1 cursor-pointer"
                        >
                          Hide
                        </button>
                      </div>
                      <ul className="space-y-1">
                        {entry.health.factorItems.map((factor, fIdx) => (
                          <li
                            key={fIdx}
                            className="flex items-start justify-between gap-2 text-slate-700"
                          >
                            <span className="leading-snug">{factor.label}</span>
                            <span
                              className={`font-semibold tabular-nums shrink-0 px-1.5 py-0.5 rounded ${
                                factor.tone === 'CRITICAL'
                                  ? 'bg-rose-50 text-rose-800'
                                  : factor.tone === 'WARNING'
                                  ? 'bg-amber-50 text-amber-900'
                                  : factor.tone === 'POSITIVE'
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : 'bg-white text-slate-700'
                              }`}
                            >
                              {factor.impact}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Expandable Complete Care Playbook & Personal Care Log (Deduplicated) */}
                  {isExpanded && (
                    <div
                      data-testid={`plant-full-guide-${entry.key}`}
                      className="pt-2.5 border-t border-stone-200/80 space-y-2.5 text-xs leading-relaxed"
                    >
                      <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1">
                        <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          <Sun className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          Soil pH, Sun &amp; Vulnerabilities
                        </span>
                        <p className="text-slate-800">{entry.soilAndSun}</p>
                        {entry.vulnerabilities.length > 0 && (
                          <p className="text-[11px] text-slate-600">
                            <strong className="text-slate-800">Watch for:</strong>{' '}
                            {entry.vulnerabilities.join(' · ')}
                          </p>
                        )}
                        {entry.idDisambiguationNote && (
                          <p className="text-[11px] text-amber-900 bg-amber-50/70 px-2 py-1 rounded-lg border border-amber-200/70 mt-1">
                            <strong>ID Note:</strong> {entry.idDisambiguationNote}
                          </p>
                        )}
                      </div>

                      <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-950">
                            <Droplets className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            Feed &amp; NPK Strategy
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-900">
                            {entry.feedWindowUk}
                          </span>
                        </div>
                        <p className="text-slate-800">
                          <strong>Formula:</strong> {entry.feedTypeNpk}
                        </p>
                        <p className="text-slate-700">
                          <strong>Dosage:</strong> {entry.feedFrequencyDosage}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-950">
                            <Scissors className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            Pruning ({entry.pruneType})
                          </span>
                          <span className="text-[11px] font-semibold text-amber-900">
                            {entry.pruneMonthsUk}
                          </span>
                        </div>
                        <p className="text-slate-800">{entry.pruneTechnique}</p>
                        <p className="text-rose-900 text-[11px]">
                          <strong>Avoid:</strong> {entry.pruneAvoid}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-sky-50/50 border border-sky-200/80 space-y-1">
                        <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-sky-950">
                          <ShieldAlert className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                          Winter Overwintering Protocol
                        </span>
                        <p className="text-slate-800">{entry.overwinteringProtocol}</p>
                      </div>

                      {/* Personal Care Log & Notes */}
                      {(onRecordPlantCareAction || onUpdatePlantPersonalNote) && (
                        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <strong className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                              Personal Care Log &amp; Notes
                            </strong>
                            <span className="text-[10px] text-slate-500">Saved on this device</span>
                          </div>

                          {onRecordPlantCareAction && (
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                data-testid={`log-fed-today-btn-${entry.key}`}
                                onClick={() => onRecordPlantCareAction(entry.careLogKey, 'lastFed')}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition cursor-pointer"
                              >
                                + Fed Today
                              </button>
                              <button
                                type="button"
                                data-testid={`log-pruned-today-btn-${entry.key}`}
                                onClick={() =>
                                  onRecordPlantCareAction(entry.careLogKey, 'lastPruned')
                                }
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-700 hover:bg-amber-600 text-white transition cursor-pointer"
                              >
                                + Pruned Today
                              </button>
                              <button
                                type="button"
                                data-testid={`log-protected-today-btn-${entry.key}`}
                                onClick={() =>
                                  onRecordPlantCareAction(entry.careLogKey, 'lastProtected')
                                }
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-sky-800 hover:bg-sky-700 text-white transition cursor-pointer"
                              >
                                + Protected Today
                              </button>
                            </div>
                          )}

                          {(careLog?.lastFed || careLog?.lastPruned || careLog?.lastProtected) && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-stone-200">
                              {careLog?.lastFed && (
                                <div>
                                  <span className="font-semibold text-emerald-900">Fed:</span>{' '}
                                  {careLog.lastFed}
                                </div>
                              )}
                              {careLog?.lastPruned && (
                                <div>
                                  <span className="font-semibold text-amber-900">Pruned:</span>{' '}
                                  {careLog.lastPruned}
                                </div>
                              )}
                              {careLog?.lastProtected && (
                                <div>
                                  <span className="font-semibold text-sky-900">Protected:</span>{' '}
                                  {careLog.lastProtected}
                                </div>
                              )}
                            </div>
                          )}

                          {onUpdatePlantPersonalNote && (
                            <textarea
                              rows={2}
                              placeholder="Add personal garden notes for this plant..."
                              value={careLog?.notes || ''}
                              onChange={(e) =>
                                onUpdatePlantPersonalNote(entry.careLogKey, e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white border border-stone-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-700"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    data-testid={`toggle-plant-guide-${entry.key}`}
                    onClick={() => togglePlantExpanded(entry.key)}
                    aria-expanded={isExpanded}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 cursor-pointer"
                  >
                    <span>
                      {isExpanded
                        ? 'Hide Care & Log'
                        : `Feed (${entry.feedWindowUk}) · Prune (${entry.pruneMonthsUk}) · Care Log`}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Non-Plant-Specific Regional Heavy Clay & Microclimate Reference */}
      <div className="bg-white border border-stone-200/90 rounded-2xl shadow-xs overflow-hidden">
        <button
          type="button"
          data-testid="guide-tab-regional-rules"
          onClick={() => setShowRegionalRules((prev) => !prev)}
          aria-expanded={showRegionalRules}
          className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-stone-50/80 transition cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldAlert className="w-4 h-4 text-emerald-700 shrink-0" />
            <div className="min-w-0">
              <span className="text-sm sm:text-base font-bold text-slate-900 block truncate">
                Regional Heavy Clay &amp; Microclimate Rules
              </span>
              <span className="text-xs text-slate-500 block truncate">
                General soil temperature feeding thresholds and winter clay risk mitigation
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 shrink-0">
            <span>{showRegionalRules ? 'Hide' : 'View'}</span>
            {showRegionalRules ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </span>
        </button>

        {showRegionalRules && (
          <div className="border-t border-stone-100 p-4 space-y-3 bg-stone-50/40">
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 text-xs sm:text-sm text-emerald-950 leading-relaxed">
              <strong className="font-bold">Seasonal Feeding Rule:</strong> Begin granular slow-release feeding in late March as 6cm clay temperatures pass <span className="font-mono font-semibold">7°C</span>, and stop all high-nitrogen feeds by <strong className="font-semibold">31 July</strong> so new wood ripens before autumn frosts.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {getDynamicRiskMitigation(plantInventory).map((risk) => (
                <div
                  key={risk.id}
                  className="p-3.5 rounded-xl bg-white border border-stone-200/90 space-y-1.5"
                >
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{risk.hazardTitle}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {risk.hadstonMicroclimateTrigger}
                  </p>
                  {risk.affectedPlants.length > 0 && (
                    <p className="text-[11px] font-semibold text-emerald-900">
                      Selected garden plants at risk: {risk.affectedPlants.join(', ')}
                    </p>
                  )}
                  <ul className="space-y-1 text-xs text-slate-700 leading-relaxed list-disc pl-4">
                    {risk.actionableSteps.map((step, sIdx) => (
                      <li key={sIdx}>{step}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Scissors,
  Sprout,
  ShieldAlert,
  Download,
  Search,
  CheckCircle2,
  Droplets,
  Sparkles,
  Info,
  X,
  Sun,
  MapPin,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  HADSTON_GARDEN_COLLECTION_32,
  RhsCatalogPlant
} from '../utils/rhsPlantCatalog';
import {
  HADSTON_LOCAL_RISK_MITIGATION,
  generateHadstonMasterGuideMarkdown
} from '../utils/hadstonMasterGuide';
import PlantThumbnailWithModal from './PlantThumbnailWithModal';

interface HadstonMasterGuidePanelProps {
  locationName?: string;
  rhsHardinessZone?: string;
  plantInventory?: Array<{
    id: string;
    name: string;
    rhsRating: string;
    location: string;
    growthStage: string;
    vulnerabilities: string[];
  }>;
  onLoadAllHadston32?: () => void;
  onAddSingleCatalogPlant: (plant: RhsCatalogPlant) => void;
}

type GuideSectionId =
  | 'SEC1_INVENTORY'
  | 'SEC3_NUTRITION'
  | 'SEC4_PRUNING'
  | 'SEC5_CLIMATE_RISK';

export default function HadstonMasterGuidePanel({
  locationName,
  rhsHardinessZone = 'H4–H5',
  plantInventory = [],
  onLoadAllHadston32,
  onAddSingleCatalogPlant
}: HadstonMasterGuidePanelProps) {
  // Collapsible chapters: collapsed by default so the guide tab feels calm & minimalist
  const [openSections, setOpenSections] = useState<Record<GuideSectionId, boolean>>({
    SEC1_INVENTORY: false,
    SEC3_NUTRITION: false,
    SEC4_PRUNING: false,
    SEC5_CLIMATE_RISK: false
  });
  const [plantFilterQuery, setPlantFilterQuery] = useState<string>('');
  const [rhsFilter, setRhsFilter] = useState<string>('ALL');
  const [loadFeedback, setLoadFeedback] = useState<string | null>(null);
  const [selectedPlantDossier, setSelectedPlantDossier] = useState<RhsCatalogPlant | null>(null);
  const [showDisambiguationNotes, setShowDisambiguationNotes] = useState<boolean>(false);

  const toggleSection = (sectionId: GuideSectionId) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const filteredHadstonPlants = useMemo(() => {
    const q = plantFilterQuery.trim().toLowerCase();
    return HADSTON_GARDEN_COLLECTION_32.filter((p) => {
      if (rhsFilter === 'TENDER_H3_H4' && !['H3', 'H4'].includes(p.rhsRating)) return false;
      if (rhsFilter === 'HARDY_H5_H7' && !['H5', 'H6', 'H7'].includes(p.rhsRating)) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.commonName.toLowerCase().includes(q) ||
        (p.botanicalName && p.botanicalName.toLowerCase().includes(q)) ||
        `#${p.photoRef}` === q ||
        String(p.photoRef) === q ||
        (p.soilAndSun && p.soilAndSun.toLowerCase().includes(q)) ||
        (p.pruneMonthsUk && p.pruneMonthsUk.toLowerCase().includes(q))
      );
    });
  }, [plantFilterQuery, rhsFilter]);

  const isSearchingGuide = plantFilterQuery.trim() !== '' || rhsFilter !== 'ALL';

  const handleDownloadMarkdown = () => {
    try {
      const md = generateHadstonMasterGuideMarkdown(locationName || 'My Garden Plot');
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

  const handleLoadAllClick = () => {
    onLoadAllHadston32?.();
    setLoadFeedback('All 32 garden plants (#1–#32) are loaded in your active garden plot.');
    setTimeout(() => setLoadFeedback(null), 4500);
  };

  const activePlotKeySet = useMemo(() => {
    const set = new Set<string>();
    for (const p of plantInventory) {
      if (p.id) set.add(p.id.toLowerCase());
      if (p.name) {
        const lower = p.name.toLowerCase();
        set.add(lower);
        const refMatch = lower.match(/^#(\d+)\b/);
        if (refMatch) {
          set.add(`hadston-${String(refMatch[1]).padStart(2, '0')}`);
        }
      }
    }
    return set;
  }, [plantInventory]);

  const isPlantInActivePlot = (item: RhsCatalogPlant) => {
    if (activePlotKeySet.has(item.catalogId.toLowerCase())) return true;
    if (activePlotKeySet.has(item.name.toLowerCase())) return true;
    if (activePlotKeySet.has(item.commonName.toLowerCase())) return true;
    return plantInventory.some(
      (p) =>
        p.name.toLowerCase().includes(item.commonName.toLowerCase()) ||
        p.name.toLowerCase().includes(item.name.toLowerCase())
    );
  };

  return (
    <section
      data-testid="hadston-master-guide-panel"
      aria-label="Master Horticulturist Guide"
      className="space-y-4"
    >
      {/* Compact Editorial Header Card */}
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
              32-Plant Botanical Playbook
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tap any chapter below to expand its reference cards, or search across all 32 plants.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              data-testid="load-hadston-32-button"
              onClick={handleLoadAllClick}
              className="min-h-[36px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white shadow-2xs transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Sync All 32</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadMarkdown}
              className="min-h-[36px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-stone-100 hover:bg-stone-200 text-slate-800 border border-stone-300 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-700 shrink-0" />
              <span>Export (.md)</span>
            </button>
          </div>
        </div>

        {loadFeedback && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-medium">{loadFeedback}</span>
          </div>
        )}

        {/* Compact Search & Hardiness Filter Bar */}
        <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={plantFilterQuery}
              onChange={(e) => setPlantFilterQuery(e.target.value)}
              placeholder="Search 32 plants by name, #ref (e.g. #16), pH, or pruning month..."
              className="w-full min-h-[38px] pl-9 pr-8 py-1.5 text-xs sm:text-sm rounded-xl bg-stone-50 border border-stone-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-700"
            />
            {plantFilterQuery && (
              <button
                type="button"
                onClick={() => setPlantFilterQuery('')}
                aria-label="Clear filter"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'ALL', label: `All (${HADSTON_GARDEN_COLLECTION_32.length})` },
              { id: 'TENDER_H3_H4', label: 'Tender (H3–H4)' },
              { id: 'HARDY_H5_H7', label: 'Hardy (H5–H7)' }
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setRhsFilter(pill.id)}
                className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold border transition whitespace-nowrap shrink-0 cursor-pointer ${
                  rhsFilter === pill.id
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : 'bg-white text-slate-600 border-stone-200 hover:bg-stone-50'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* =====================================================================
          4 COLLAPSIBLE ACCORDION CHAPTERS (Minimalist Progressive Disclosure)
      ===================================================================== */}
      <div data-testid="master-guide-section-tabs" className="space-y-3">
        {/* CHAPTER 1: PLANT INVENTORY & IDENTIFICATION SUMMARY */}
        <div className="bg-white border border-stone-200/90 rounded-2xl shadow-xs overflow-hidden">
          <button
            type="button"
            data-testid="guide-tab-SEC1_INVENTORY"
            onClick={() => toggleSection('SEC1_INVENTORY')}
            aria-expanded={openSections.SEC1_INVENTORY || isSearchingGuide}
            className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-stone-50/80 transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Sprout className="w-4 h-4 text-emerald-700 shrink-0" />
              <div className="min-w-0">
                <span className="text-sm sm:text-base font-bold text-slate-900 block truncate">
                  1. Plant Inventory &amp; Identification ({filteredHadstonPlants.length})
                </span>
                <span className="text-xs text-slate-500 block truncate">
                  Botanical names, soil pH, sun aspect, and diagnostic notes
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 shrink-0">
              <span>{openSections.SEC1_INVENTORY || isSearchingGuide ? 'Hide' : 'View'}</span>
              {openSections.SEC1_INVENTORY || isSearchingGuide ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </span>
          </button>

          {(openSections.SEC1_INVENTORY || isSearchingGuide) && (
            <div data-testid="guide-section-1" className="border-t border-stone-100 p-4 space-y-4 bg-stone-50/40">
              {/* Collapsible Identification Notes */}
              <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Info className="w-4 h-4 text-amber-700 shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-amber-950 truncate">
                      Botanical ID Notes (#3 Fuchsia, #5/#14/#22 Roses, #24/#28 Hydrangeas &amp; #29 Clematis)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDisambiguationNotes((prev) => !prev)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-amber-900 border border-amber-300 hover:bg-amber-100/50 transition shrink-0 cursor-pointer"
                  >
                    {showDisambiguationNotes ? 'Hide Notes' : 'Read ID Notes'}
                  </button>
                </div>

                {showDisambiguationNotes && (
                  <div className="mt-3 pt-3 border-t border-amber-200/80 grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-amber-950 leading-relaxed">
                    {HADSTON_GARDEN_COLLECTION_32.filter((p) => p.idDisambiguationNote).map((p) => (
                      <div key={p.catalogId} className="p-2.5 rounded-xl bg-white border border-amber-200/70">
                        <strong className="font-bold text-slate-900">
                          #{p.photoRef} {p.commonName}:
                        </strong>{' '}
                        <span className="text-slate-700">{p.idDisambiguationNote}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredHadstonPlants.map((plant) => {
                  const inPlot = isPlantInActivePlot(plant);
                  const isBorderline = ['H3', 'H4'].includes(plant.rhsRating);
                  return (
                    <div
                      key={plant.catalogId}
                      className="bg-white border border-stone-200/90 hover:border-emerald-600/60 rounded-xl p-4 shadow-2xs transition flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <PlantThumbnailWithModal
                              plantId={plant.catalogId}
                              plantName={plant.commonName}
                              photoRef={plant.photoRef}
                              size="md"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] font-mono font-bold text-emerald-900">
                                  #{plant.photoRef}
                                </span>
                                <span className="text-xs italic text-slate-500 truncate">
                                  {plant.botanicalName}
                                </span>
                              </div>
                              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug mt-0.5">
                                {plant.commonName}
                              </h3>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0 ${
                              isBorderline
                                ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                : 'bg-stone-100 text-slate-700 border border-stone-200'
                            }`}
                          >
                            RHS {plant.rhsRating}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-stone-100">
                          <strong className="font-semibold text-slate-800">Soil &amp; Sun:</strong>{' '}
                          {plant.soilAndSun}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPlantDossier(plant)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-600 cursor-pointer"
                        >
                          <span>Full Care Card</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={inPlot}
                          onClick={() => onAddSingleCatalogPlant(plant)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            inPlot
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default'
                              : 'bg-emerald-800 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {inPlot ? 'In Plot ✓' : '+ Add'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* CHAPTER 2: SPECIALIZED FEED & NUTRITION STRATEGY */}
        <div className="bg-white border border-stone-200/90 rounded-2xl shadow-xs overflow-hidden">
          <button
            type="button"
            data-testid="guide-tab-SEC3_NUTRITION"
            onClick={() => toggleSection('SEC3_NUTRITION')}
            aria-expanded={openSections.SEC3_NUTRITION}
            className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-stone-50/80 transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Droplets className="w-4 h-4 text-emerald-700 shrink-0" />
              <div className="min-w-0">
                <span className="text-sm sm:text-base font-bold text-slate-900 block truncate">
                  2. Feed &amp; NPK Nutrition Strategy
                </span>
                <span className="text-xs text-slate-500 block truncate">
                  Specific NPK formulations, UK feeding windows, and clay dosages
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 shrink-0">
              <span>{openSections.SEC3_NUTRITION ? 'Hide' : 'View'}</span>
              {openSections.SEC3_NUTRITION ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </span>
          </button>

          {openSections.SEC3_NUTRITION && (
            <div data-testid="guide-section-3" className="border-t border-stone-100 p-4 space-y-3 bg-stone-50/40">
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 text-xs sm:text-sm text-emerald-950 leading-relaxed">
                <strong className="font-bold">Seasonal Feeding Rule:</strong> Begin granular slow-release feeding in late March as 6cm clay temperatures pass <span className="font-mono font-semibold">7°C</span>, and stop all high-nitrogen feeds by <strong className="font-semibold">31 July</strong> so new wood ripens before autumn frosts.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredHadstonPlants.map((plant) => (
                  <div
                    key={plant.catalogId}
                    className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2">
                      <div>
                        <span className="text-xs font-mono font-bold text-emerald-800">
                          #{plant.photoRef}
                        </span>{' '}
                        <h4 className="inline text-sm sm:text-base font-bold text-slate-900">
                          {plant.commonName}
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] font-semibold shrink-0">
                        {plant.feedWindowUk}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
                      <p>
                        <strong className="font-semibold text-slate-900">Feed &amp; NPK:</strong>{' '}
                        {plant.feedTypeNpk}
                      </p>
                      <p>
                        <strong className="font-semibold text-slate-900">Dosage:</strong>{' '}
                        {plant.feedFrequencyDosage}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CHAPTER 3: PRECISION PRUNING & SHAPING PLAYBOOK */}
        <div className="bg-white border border-stone-200/90 rounded-2xl shadow-xs overflow-hidden">
          <button
            type="button"
            data-testid="guide-tab-SEC4_PRUNING"
            onClick={() => toggleSection('SEC4_PRUNING')}
            aria-expanded={openSections.SEC4_PRUNING}
            className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-stone-50/80 transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Scissors className="w-4 h-4 text-amber-700 shrink-0" />
              <div className="min-w-0">
                <span className="text-sm sm:text-base font-bold text-slate-900 block truncate">
                  3. Precision Pruning &amp; Shaping Playbook
                </span>
                <span className="text-xs text-slate-500 block truncate">
                  Exact UK pruning months, step-by-step cuts, and mistakes to avoid
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 shrink-0">
              <span>{openSections.SEC4_PRUNING ? 'Hide' : 'View'}</span>
              {openSections.SEC4_PRUNING ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </span>
          </button>

          {openSections.SEC4_PRUNING && (
            <div data-testid="guide-section-4" className="border-t border-stone-100 p-4 bg-stone-50/40">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredHadstonPlants.map((plant) => (
                  <div
                    key={plant.catalogId}
                    className="bg-white border border-stone-200/90 rounded-xl p-4 shadow-2xs space-y-2"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-stone-100 pb-2">
                      <div>
                        <span className="text-xs font-mono font-bold text-emerald-800">
                          #{plant.photoRef}
                        </span>{' '}
                        <h4 className="inline text-sm sm:text-base font-bold text-slate-900">
                          {plant.commonName}
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-semibold">
                        {plant.pruneMonthsUk}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs leading-relaxed">
                      <p className="text-slate-800">
                        <strong className="font-semibold text-slate-900">Technique:</strong>{' '}
                        {plant.pruneTechnique}
                      </p>
                      <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200/80 text-rose-950">
                        <strong className="font-semibold">Avoid:</strong> {plant.pruneAvoid}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CHAPTER 4: CLIMATE & WINTER OVERWINTERING PROTOCOL */}
        <div className="bg-white border border-stone-200/90 rounded-2xl shadow-xs overflow-hidden">
          <button
            type="button"
            data-testid="guide-tab-SEC5_CLIMATE_RISK"
            onClick={() => toggleSection('SEC5_CLIMATE_RISK')}
            aria-expanded={openSections.SEC5_CLIMATE_RISK}
            className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-stone-50/80 transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <ShieldAlert className="w-4 h-4 text-sky-700 shrink-0" />
              <div className="min-w-0">
                <span className="text-sm sm:text-base font-bold text-slate-900 block truncate">
                  4. Frost, Wind-Rock &amp; Overwintering Guide
                </span>
                <span className="text-xs text-slate-500 block truncate">
                  Regional heavy clay risk mitigation and plant-by-plant winter care
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 shrink-0">
              <span>{openSections.SEC5_CLIMATE_RISK ? 'Hide' : 'View'}</span>
              {openSections.SEC5_CLIMATE_RISK ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </span>
          </button>

          {openSections.SEC5_CLIMATE_RISK && (
            <div data-testid="guide-section-5" className="border-t border-stone-100 p-4 space-y-4 bg-stone-50/40">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {HADSTON_LOCAL_RISK_MITIGATION.map((risk) => (
                  <div
                    key={risk.id}
                    className="p-3.5 rounded-xl bg-white border border-stone-200/90 space-y-1.5"
                  >
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{risk.hazardTitle}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {risk.hadstonMicroclimateTrigger}
                    </p>
                    <ul className="space-y-1 text-xs text-slate-700 leading-relaxed list-disc pl-4">
                      {risk.actionableSteps.map((step, sIdx) => (
                        <li key={sIdx}>{step}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredHadstonPlants.map((plant) => {
                  const isTenderOrBorderline = ['H3', 'H4'].includes(plant.rhsRating);
                  return (
                    <div
                      key={plant.catalogId}
                      className={`rounded-xl p-4 border shadow-2xs space-y-1.5 ${
                        isTenderOrBorderline
                          ? 'bg-amber-50/40 border-amber-200'
                          : 'bg-white border-stone-200/90'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-emerald-800">
                            #{plant.photoRef}
                          </span>
                          <h4 className="text-sm sm:text-base font-bold text-slate-900">
                            {plant.commonName}
                          </h4>
                        </div>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            isTenderOrBorderline
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-50 text-emerald-900'
                          }`}
                        >
                          RHS {plant.rhsRating}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        <strong className="font-semibold text-slate-900">Winter Care:</strong>{' '}
                        {plant.overwinteringProtocol}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          PLANT CARE DOSSIER MODAL (Clean, Full-Readability Single Plant View)
      ===================================================================== */}
      {selectedPlantDossier && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Care guide for ${selectedPlantDossier.name}`}
          className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
          onClick={() => setSelectedPlantDossier(null)}
        >
          <div
            className="bg-white border-t sm:border border-stone-200 rounded-t-3xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-xl space-y-5 sm:my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1.5 bg-stone-300 rounded-full mx-auto -mt-1.5 mb-2 sm:hidden" />
            <div className="flex items-start justify-between gap-3 border-b border-stone-200 pb-4">
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <PlantThumbnailWithModal
                  plantId={selectedPlantDossier.catalogId}
                  plantName={selectedPlantDossier.commonName}
                  photoRef={selectedPlantDossier.photoRef}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-mono font-bold text-emerald-900">
                      Photo Ref #{selectedPlantDossier.photoRef}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-stone-100 text-slate-800 text-xs font-bold">
                      RHS {selectedPlantDossier.rhsRating}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1.5">
                    {selectedPlantDossier.commonName}
                  </h3>
                  <p className="text-xs sm:text-sm italic text-slate-500">
                    {selectedPlantDossier.botanicalName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPlantDossier(null)}
                aria-label="Close plant care card"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm leading-relaxed">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    <Sun className="w-3.5 h-3.5 text-amber-600" />
                    Soil pH &amp; Sun Requirement
                  </span>
                  <p className="text-slate-900 font-medium">{selectedPlantDossier.soilAndSun}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    Ideal Plot Position
                  </span>
                  <p className="text-slate-900 font-medium">
                    {selectedPlantDossier.recommendedLocation}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
                <span className="block text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Feed &amp; Nutrition Strategy ({selectedPlantDossier.feedWindowUk})
                </span>
                <p className="text-slate-900">
                  <strong>Feed Type:</strong> {selectedPlantDossier.feedTypeNpk}
                </p>
                <p className="text-slate-800">
                  <strong>Schedule:</strong> {selectedPlantDossier.feedFrequencyDosage}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1.5">
                <span className="block text-xs font-bold uppercase tracking-wider text-amber-950">
                  Precision Pruning Playbook ({selectedPlantDossier.pruneMonthsUk})
                </span>
                <p className="text-slate-900">
                  <strong>Technique ({selectedPlantDossier.pruneType}):</strong>{' '}
                  {selectedPlantDossier.pruneTechnique}
                </p>
                <p className="text-rose-900">
                  <strong>Avoid:</strong> {selectedPlantDossier.pruneAvoid}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200 space-y-1">
                <span className="block text-xs font-bold uppercase tracking-wider text-sky-950">
                  Winter Overwintering Protocol
                </span>
                <p className="text-slate-900">{selectedPlantDossier.overwinteringProtocol}</p>
              </div>

              {selectedPlantDossier.idDisambiguationNote && (
                <div className="p-3.5 rounded-xl bg-stone-100 border border-stone-300 text-xs text-slate-700">
                  <strong className="text-slate-900">Botanical Diagnostic Note:</strong>{' '}
                  {selectedPlantDossier.idDisambiguationNote}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setSelectedPlantDossier(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

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
  ChevronRight
} from 'lucide-react';
import {
  HADSTON_GARDEN_COLLECTION_32,
  RhsCatalogPlant
} from '../utils/rhsPlantCatalog';
import {
  HADSTON_LOCAL_RISK_MITIGATION,
  generateHadstonMasterGuideMarkdown
} from '../utils/hadstonMasterGuide';

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
  onLoadAllHadston32: () => void;
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
  const [activeSection, setActiveSection] = useState<GuideSectionId>('SEC1_INVENTORY');
  const [plantFilterQuery, setPlantFilterQuery] = useState<string>('');
  const [rhsFilter, setRhsFilter] = useState<string>('ALL');
  const [loadFeedback, setLoadFeedback] = useState<string | null>(null);
  const [selectedPlantDossier, setSelectedPlantDossier] = useState<RhsCatalogPlant | null>(null);
  const [showDisambiguationNotes, setShowDisambiguationNotes] = useState<boolean>(false);

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
    onLoadAllHadston32();
    setLoadFeedback('All 32 garden plants (#1–#32) are loaded in your active garden plot.');
    setTimeout(() => setLoadFeedback(null), 4500);
  };

  const isPlantInActivePlot = (item: RhsCatalogPlant) =>
    plantInventory.some(
      (p) =>
        p.id === item.catalogId ||
        p.name.toLowerCase().includes(item.commonName.toLowerCase()) ||
        p.name.toLowerCase().includes(item.name.toLowerCase())
    );

  return (
    <section
      data-testid="hadston-master-guide-panel"
      aria-label="Master Horticulturist Guide"
      className="space-y-6"
    >
      {/* Clean Editorial Header Card */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
                <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                Master Horticulturist Guide
              </span>
              <span className="text-xs font-medium text-stone-600">
                {locationName || 'Your Garden Plot'} · RHS {rhsHardinessZone}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Your 32-Plant Botanical Care &amp; Seasonal Playbook
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
              Calibrated for your local garden microclimate (heavy clay to alluvial loam, pH 6.0–6.8, RHS {rhsHardinessZone}). Select any section below or click any plant to read its full care card.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              data-testid="load-hadston-32-button"
              onClick={handleLoadAllClick}
              className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-800 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Sync All 32 Plants to Plot</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadMarkdown}
              className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-stone-100 hover:bg-stone-200 text-slate-800 border border-stone-300 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-700 shrink-0" />
              <span>Download Guide (.md)</span>
            </button>
          </div>
        </div>

        {loadFeedback && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-medium">{loadFeedback}</span>
          </div>
        )}

        {/* 4-Section Chapter Navigation */}
        <div
          data-testid="master-guide-section-tabs"
          className="mt-5 pt-5 border-t border-stone-200 flex lg:grid lg:grid-cols-4 items-center gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0"
        >
          {[
            {
              id: 'SEC1_INVENTORY' as GuideSectionId,
              label: '1. Plant Inventory (32)',
              icon: Sprout
            },
            {
              id: 'SEC3_NUTRITION' as GuideSectionId,
              label: '2. Feed & NPK Guide',
              icon: Droplets
            },
            {
              id: 'SEC4_PRUNING' as GuideSectionId,
              label: '3. Pruning Playbook',
              icon: Scissors
            },
            {
              id: 'SEC5_CLIMATE_RISK' as GuideSectionId,
              label: '4. Frost & Winter Care',
              icon: ShieldAlert
            }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`guide-tab-${tab.id}`}
                onClick={() => setActiveSection(tab.id)}
                className={`min-h-[42px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition whitespace-nowrap shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                    : 'bg-stone-50 text-slate-700 border-stone-200 hover:bg-stone-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Shared Search & Filter Bar for Plant Sections */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={plantFilterQuery}
            onChange={(e) => setPlantFilterQuery(e.target.value)}
            placeholder="Search your 32 plants by name, #number (e.g. #16), pH, or pruning month..."
            className="w-full min-h-[42px] pl-10 pr-9 py-2 text-sm rounded-xl bg-stone-50 border border-stone-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-700"
          />
          {plantFilterQuery && (
            <button
              type="button"
              onClick={() => setPlantFilterQuery('')}
              aria-label="Clear filter"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'ALL', label: `All Plants (${HADSTON_GARDEN_COLLECTION_32.length})` },
            { id: 'TENDER_H3_H4', label: 'Tender / Borderline (H3–H4)' },
            { id: 'HARDY_H5_H7', label: 'Fully Hardy (H5–H7)' }
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setRhsFilter(pill.id)}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold border transition whitespace-nowrap shrink-0 cursor-pointer ${
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

      {/* =====================================================================
          SECTION 1: PLANT INVENTORY & IDENTIFICATION SUMMARY
      ===================================================================== */}
      {activeSection === 'SEC1_INVENTORY' && (
        <div data-testid="guide-section-1" className="space-y-4">
          {/* Collapsible Identification Notes so they don't clutter the view */}
          <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="text-sm font-bold text-amber-950">
                  Botanical Identification Notes (#3 Fuchsia, #5/#14/#22 Roses, #24/#28 Hydrangeas &amp; #29 Clematis)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDisambiguationNotes((prev) => !prev)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-amber-900 border border-amber-300 hover:bg-amber-100/50 transition shrink-0 cursor-pointer"
              >
                {showDisambiguationNotes ? 'Hide Notes' : 'Read ID Notes'}
              </button>
            </div>

            {showDisambiguationNotes && (
              <div className="mt-3 pt-3 border-t border-amber-200/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm text-amber-950 leading-relaxed">
                {HADSTON_GARDEN_COLLECTION_32.filter((p) => p.idDisambiguationNote).map((p) => (
                  <div key={p.catalogId} className="p-3 rounded-xl bg-white border border-amber-200/70">
                    <strong className="font-bold text-slate-900">
                      #{p.photoRef} {p.commonName}:
                    </strong>{' '}
                    <span className="text-slate-700">{p.idDisambiguationNote}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clean, High-Readability Plant Directory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHadstonPlants.map((plant) => {
              const inPlot = isPlantInActivePlot(plant);
              const isBorderline = ['H3', 'H4'].includes(plant.rhsRating);
              return (
                <div
                  key={plant.catalogId}
                  className="bg-white border border-stone-200/90 hover:border-emerald-600/60 rounded-2xl p-5 shadow-xs transition flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-mono font-bold text-emerald-900">
                          #{plant.photoRef}
                        </span>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 leading-snug">
                            {plant.commonName}
                          </h3>
                          <p className="text-xs italic text-slate-500">{plant.botanicalName}</p>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
                          isBorderline
                            ? 'bg-amber-50 text-amber-900 border border-amber-200'
                            : 'bg-stone-100 text-slate-700 border border-stone-200'
                        }`}
                      >
                        RHS {plant.rhsRating}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-stone-100 space-y-1.5 text-xs sm:text-sm text-slate-700">
                      <p>
                        <strong className="font-semibold text-slate-900">Soil &amp; Sun:</strong>{' '}
                        {plant.soilAndSun}
                      </p>
                      <p>
                        <strong className="font-semibold text-slate-900">Characteristics &amp; Origin:</strong>{' '}
                        {plant.characteristicsAndNative}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPlantDossier(plant)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-600 cursor-pointer"
                    >
                      <span>View Feed, Pruning &amp; Winter Care</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      disabled={inPlot}
                      onClick={() => onAddSingleCatalogPlant(plant)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        inPlot
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default'
                          : 'bg-emerald-800 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {inPlot ? 'In Garden Plot ✓' : '+ Add to Plot'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          SECTION 3: SPECIALIZED FEED & NUTRITION STRATEGY
      ===================================================================== */}
      {activeSection === 'SEC3_NUTRITION' && (
        <div data-testid="guide-section-3" className="space-y-4">
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-xs sm:text-sm text-emerald-950 leading-relaxed">
            <strong className="font-bold">Seasonal Feeding Rule:</strong> Begin granular slow-release feeding in late March as 6cm clay temperatures pass <span className="font-mono font-semibold">7°C</span>, and stop all high-nitrogen feeds by <strong className="font-semibold">31 July</strong> so new wood ripens before autumn frosts.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHadstonPlants.map((plant) => (
              <div
                key={plant.catalogId}
                className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2.5">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-800">
                      #{plant.photoRef}
                    </span>{' '}
                    <h4 className="inline text-base font-bold text-slate-900">
                      {plant.commonName}
                    </h4>
                    <p className="text-xs italic text-slate-500">{plant.botanicalName}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold shrink-0">
                    {plant.feedWindowUk}
                  </span>
                </div>

                <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
                  <p className="text-slate-800">
                    <strong className="font-semibold text-slate-900">Specific Feed &amp; NPK:</strong>{' '}
                    {plant.feedTypeNpk}
                  </p>
                  <p className="text-slate-700">
                    <strong className="font-semibold text-slate-900">Dosage &amp; Method:</strong>{' '}
                    {plant.feedFrequencyDosage}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          SECTION 4: PRECISION PRUNING & SHAPING GUIDE
      ===================================================================== */}
      {activeSection === 'SEC4_PRUNING' && (
        <div data-testid="guide-section-4" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHadstonPlants.map((plant) => (
              <div
                key={plant.catalogId}
                className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-stone-100 pb-2.5">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-800">
                      #{plant.photoRef}
                    </span>{' '}
                    <h4 className="inline text-base font-bold text-slate-900">
                      {plant.commonName}
                    </h4>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{plant.pruneType}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold">
                    {plant.pruneMonthsUk}
                  </span>
                </div>

                <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
                  <p className="text-slate-800">
                    <strong className="font-semibold text-slate-900">Step-by-Step Technique:</strong>{' '}
                    {plant.pruneTechnique}
                  </p>
                  <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/80 text-rose-950">
                    <strong className="font-semibold">What to Avoid:</strong> {plant.pruneAvoid}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          SECTION 5: CLIMATE & SEASONAL RISK MANAGEMENT
      ===================================================================== */}
      {activeSection === 'SEC5_CLIMATE_RISK' && (
        <div data-testid="guide-section-5" className="space-y-6">
          {/* Local Risk Mitigation Cards */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {locationName || 'Local Garden'} Climate Risk Mitigation (RHS {rhsHardinessZone})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {HADSTON_LOCAL_RISK_MITIGATION.map((risk) => (
                <div
                  key={risk.id}
                  className="p-4 rounded-xl bg-stone-50 border border-stone-200/90 space-y-2.5"
                >
                  <h4 className="text-sm font-bold text-slate-900">{risk.hazardTitle}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {risk.hadstonMicroclimateTrigger}
                  </p>
                  <p className="text-xs font-medium text-emerald-800">
                    Key Plants: {risk.affectedPlants.join(', ')}
                  </p>
                  <ul className="space-y-1 text-xs sm:text-sm text-slate-700 leading-relaxed list-disc pl-4">
                    {risk.actionableSteps.map((step, sIdx) => (
                      <li key={sIdx}>{step}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Plant-by-Plant Overwintering Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHadstonPlants.map((plant) => {
              const isTenderOrBorderline = ['H3', 'H4'].includes(plant.rhsRating);
              return (
                <div
                  key={plant.catalogId}
                  className={`rounded-2xl p-5 border shadow-xs space-y-2 ${
                    isTenderOrBorderline
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-white border-stone-200/90'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-800">
                        #{plant.photoRef}
                      </span>
                      <h4 className="text-base font-bold text-slate-900">{plant.commonName}</h4>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${
                        isTenderOrBorderline
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-emerald-50 text-emerald-900'
                      }`}
                    >
                      RHS {plant.rhsRating}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <strong className="font-semibold text-slate-900">Overwintering Protocol:</strong>{' '}
                    {plant.overwinteringProtocol}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          PLANT CARE DOSSIER MODAL (Clean, Full-Readability Single Plant View)
      ===================================================================== */}
      {selectedPlantDossier && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Care guide for ${selectedPlantDossier.name}`}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedPlantDossier(null)}
        >
          <div
            className="bg-white border border-stone-200 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-xl space-y-5 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-stone-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-mono font-bold text-emerald-900">
                    Photo Ref #{selectedPlantDossier.photoRef}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-stone-100 text-slate-800 text-xs font-bold">
                    RHS {selectedPlantDossier.rhsRating}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-1.5">
                  {selectedPlantDossier.commonName}
                </h3>
                <p className="text-sm italic text-slate-500">
                  {selectedPlantDossier.botanicalName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPlantDossier(null)}
                aria-label="Close plant care card"
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 cursor-pointer"
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

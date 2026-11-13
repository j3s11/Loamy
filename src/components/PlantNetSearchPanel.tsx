import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sprout,
  Search,
  X,
  Camera,
  Upload,
  Plus,
  Trash2,
  Download
} from 'lucide-react';
import PlantThumbnailWithModal from './PlantThumbnailWithModal';
import {
  RhsCatalogPlant,
  CatalogPlantItem,
  searchRhsPlantCatalog,
  fetchLiveRhsCatalogPlants,
  identifyPlantWithPlantNetClient
} from '../utils/rhsPlantCatalog';
import { registerLivePlantImage } from '../utils/plantImages';

interface PlantNetSearchPanelProps {
  isCatalogOpen: boolean;
  setIsCatalogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showPlantManagerDrawer: boolean;
  plantCount: number;
  isCatalogPlantInPlot: (item: CatalogPlantItem) => boolean;
  onQuickAddPlant: (plant: CatalogPlantItem) => void;
  onAddAllMatchingPlants: (plants: RhsCatalogPlant[]) => void;
  onOpenAddCustomPlant: () => void;
  onClearAllPlants: () => void;
  onExportBackup: () => void;
  onOpenBackupModal: () => void;
  onExportCsv: () => void;
}

const PlantNetSearchPanel = React.memo(function PlantNetSearchPanel({
  isCatalogOpen,
  setIsCatalogOpen,
  showPlantManagerDrawer,
  plantCount,
  isCatalogPlantInPlot,
  onQuickAddPlant,
  onAddAllMatchingPlants,
  onOpenAddCustomPlant,
  onClearAllPlants,
  onExportBackup,
  onOpenBackupModal,
  onExportCsv
}: PlantNetSearchPanelProps) {
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('ALL');
  const [liveRhsPlants, setLiveRhsPlants] = useState<RhsCatalogPlant[]>([]);
  const [liveRhsTotalHits, setLiveRhsTotalHits] = useState<number>(0);
  const [isLiveRhsLoading, setIsLiveRhsLoading] = useState<boolean>(false);
  const [liveRhsSource, setLiveRhsSource] = useState<
    'PLANTNET_RHS_MERGED' | 'RHS_LIVE_API' | 'LOCAL_FALLBACK'
  >('PLANTNET_RHS_MERGED');

  // Pl@ntNet Photo Identification state
  const [isPhotoIdentifyOpen, setIsPhotoIdentifyOpen] = useState<boolean>(false);
  const [photoIdentifyOrgan, setPhotoIdentifyOrgan] = useState<
    'auto' | 'flower' | 'leaf' | 'fruit' | 'bark'
  >('auto');
  const [isPhotoIdentifying, setIsPhotoIdentifying] = useState<boolean>(false);
  const [photoIdentifyError, setPhotoIdentifyError] = useState<string>('');
  const [photoIdentifyBestMatch, setPhotoIdentifyBestMatch] = useState<string>('');
  const [photoIdentifyResults, setPhotoIdentifyResults] = useState<RhsCatalogPlant[]>([]);
  const [photoIdentifyPreviewUrl, setPhotoIdentifyPreviewUrl] = useState<string>('');
  const photoFileInputRef = useRef<HTMLInputElement | null>(null);

  // Query live Pl@ntNet + RHS only when user enters a plant name search query
  useEffect(() => {
    const trimmedQuery = catalogSearchQuery.trim();
    if (!trimmedQuery) {
      setLiveRhsPlants([]);
      setLiveRhsTotalHits(0);
      setIsLiveRhsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLiveRhsLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const res = await fetchLiveRhsCatalogPlants(
          trimmedQuery,
          catalogCategory,
          16,
          controller.signal
        );
        for (const plant of res.plants) {
          registerLivePlantImage(plant);
        }
        setLiveRhsPlants(res.plants);
        setLiveRhsTotalHits(res.totalHits);
        setLiveRhsSource(res.source);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          const fallback = searchRhsPlantCatalog(trimmedQuery, catalogCategory).slice(0, 16);
          setLiveRhsPlants(fallback);
          setLiveRhsTotalHits(fallback.length);
          setLiveRhsSource('LOCAL_FALLBACK');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLiveRhsLoading(false);
        }
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [catalogSearchQuery, catalogCategory]);

  const matchingCatalogPlants = useMemo(() => {
    const trimmed = catalogSearchQuery.trim();
    if (!trimmed) return [];
    return liveRhsPlants.length > 0
      ? liveRhsPlants
      : searchRhsPlantCatalog(trimmed, catalogCategory).slice(0, 16);
  }, [liveRhsPlants, catalogSearchQuery, catalogCategory]);

  const handlePhotoIdentifyFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoIdentifyError('');
    setIsPhotoIdentifying(true);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read image file.'));
        reader.readAsDataURL(file);
      });

      setPhotoIdentifyPreviewUrl(dataUrl);
      const res = await identifyPlantWithPlantNetClient({
        imageBase64: dataUrl,
        mimeType: file.type || 'image/jpeg',
        organ: photoIdentifyOrgan
      });

      for (const plant of res.results) {
        registerLivePlantImage(plant);
      }

      setPhotoIdentifyBestMatch(res.bestMatch);
      setPhotoIdentifyResults(res.results);
    } catch (err: any) {
      setPhotoIdentifyError(
        err?.message ||
          'Could not identify plant from this photo. Try a clearer leaf or flower image.'
      );
    } finally {
      setIsPhotoIdentifying(false);
      e.target.value = '';
    }
  };

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50/90 border border-stone-200/90 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Sprout className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-slate-900">
            Search Plant Names (Pl@ntNet API + RHS Care Data)
          </span>
          <span
            data-testid="live-rhs-status-badge"
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
              liveRhsSource === 'PLANTNET_RHS_MERGED' || liveRhsSource === 'RHS_LIVE_API'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-stone-100 text-slate-700 border-stone-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLiveRhsLoading
                  ? 'bg-amber-500 animate-pulse'
                  : liveRhsSource === 'PLANTNET_RHS_MERGED' ||
                    liveRhsSource === 'RHS_LIVE_API'
                  ? 'bg-emerald-600'
                  : 'bg-slate-400'
              }`}
            />
            <span>
              {isLiveRhsLoading
                ? 'Searching Pl@ntNet + RHS...'
                : liveRhsSource === 'PLANTNET_RHS_MERGED'
                ? `Pl@ntNet + RHS Live · ${liveRhsTotalHits.toLocaleString()} matches`
                : liveRhsSource === 'RHS_LIVE_API'
                ? `RHS Live · ${liveRhsTotalHits.toLocaleString()} matches`
                : 'Offline reference mode'}
            </span>
          </span>
        </div>
        <span className="text-[11px] text-slate-500">
          Pl@ntNet species search paired with RHS UK hardiness, pruning &amp; feeding profiles
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <label htmlFor="plant-catalog-search" className="sr-only">
            Search plant names via Pl@ntNet and RHS
          </label>
          <input
            id="plant-catalog-search"
            data-testid="rhs-catalog-search-input"
            type="text"
            placeholder="Search plant names via Pl@ntNet + RHS (e.g. Lavandula, Lavender, Rosa, Fuchsia, Hydrangea, Acer)..."
            value={catalogSearchQuery}
            onFocus={() => setIsCatalogOpen(true)}
            onChange={(e) => {
              setCatalogSearchQuery(e.target.value);
              setIsCatalogOpen(true);
            }}
            className="w-full min-h-[40px] pl-9 pr-8 py-1.5 text-base sm:text-sm rounded-xl bg-white border border-stone-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-700"
          />
          {(catalogSearchQuery || isCatalogOpen) && (
            <button
              type="button"
              aria-label="Clear plant search"
              onClick={() => {
                setCatalogSearchQuery('');
                setIsCatalogOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="open-plantnet-photo-identify-btn"
            onClick={() => setIsPhotoIdentifyOpen((prev) => !prev)}
            className={`min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition whitespace-nowrap cursor-pointer ${
              isPhotoIdentifyOpen
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-white hover:bg-stone-100 text-slate-800 border-stone-300'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>Identify by Photo</span>
          </button>

          <button
            type="button"
            data-testid="browse-rhs-catalogue-btn"
            onClick={() => setIsCatalogOpen((prev) => !prev)}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-stone-100 text-slate-800 border border-stone-300 transition whitespace-nowrap cursor-pointer"
          >
            {isCatalogOpen ? 'Hide Search' : 'Browse Pl@ntNet + RHS'}
          </button>

          <button
            type="button"
            data-testid="add-all-rhs-catalogue-btn"
            onClick={() => onAddAllMatchingPlants(matchingCatalogPlants)}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition whitespace-nowrap cursor-pointer"
            title="Add all currently shown Pl@ntNet + RHS search results to your plot"
          >
            + Add Shown Results
          </button>
        </div>
      </div>

      {/* Pl@ntNet Visual Photo Identification Drawer */}
      {isPhotoIdentifyOpen && (
        <div
          data-testid="plantnet-photo-identify-panel"
          className="p-3.5 rounded-xl bg-white border border-emerald-200 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Pl@ntNet Visual Plant Identification</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Upload a photo of a flower, leaf, fruit, or bark to identify species via Pl@ntNet and match RHS care data.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="plantnet-organ-select" className="text-xs font-semibold text-slate-700">
                Organ:
              </label>
              <select
                id="plantnet-organ-select"
                data-testid="plantnet-organ-select"
                value={photoIdentifyOrgan}
                onChange={(e) => setPhotoIdentifyOrgan(e.target.value as any)}
                className="min-h-[34px] px-2.5 py-1 text-base sm:text-xs rounded-lg bg-stone-50 border border-stone-300 text-slate-800"
              >
                <option value="auto">Auto-detect</option>
                <option value="flower">Flower</option>
                <option value="leaf">Leaf</option>
                <option value="fruit">Fruit</option>
                <option value="bark">Bark</option>
              </select>

              <input
                ref={photoFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                data-testid="plantnet-photo-file-input"
                onChange={handlePhotoIdentifyFileSelected}
                className="sr-only"
              />
              <button
                type="button"
                data-testid="trigger-plantnet-photo-upload"
                disabled={isPhotoIdentifying}
                onClick={() => photoFileInputRef.current?.click()}
                className="min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 disabled:bg-emerald-800/60 text-white transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 shrink-0" />
                <span>{isPhotoIdentifying ? 'Identifying...' : 'Upload Plant Photo'}</span>
              </button>
            </div>
          </div>

          {photoIdentifyError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-900">
              {photoIdentifyError}
            </div>
          )}

          {photoIdentifyResults.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-stone-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-900">
                  Best Pl@ntNet Match: <strong>{photoIdentifyBestMatch}</strong>
                </span>
                {photoIdentifyPreviewUrl && (
                  <img
                    src={photoIdentifyPreviewUrl}
                    alt="Uploaded plant preview"
                    className="w-8 h-8 rounded-lg object-cover border border-stone-200"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {photoIdentifyResults.map((item) => {
                  const isAlreadyInPlot = isCatalogPlantInPlot(item);
                  return (
                    <div
                      key={item.catalogId}
                      className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <PlantThumbnailWithModal
                          plantId={item.catalogId}
                          plantName={item.commonName || item.name}
                          photoUrl={item.photoUrl}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {item.commonName || item.name}
                            </span>
                            {item.plantNetScore !== undefined && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-[10px] font-bold text-emerald-900">
                                {item.plantNetScore}% match
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 rounded bg-stone-200 text-[10px] font-bold text-slate-700">
                              {item.rhsRating}
                            </span>
                          </div>
                          {item.botanicalName && (
                            <p className="text-[11px] italic text-slate-500 truncate">
                              {item.botanicalName}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={Boolean(isAlreadyInPlot)}
                        onClick={() => onQuickAddPlant(item)}
                        className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition cursor-pointer ${
                          isAlreadyInPlot
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-emerald-800 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {isAlreadyInPlot ? 'In Plot ✓' : '+ Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Secondary Plot Management Controls */}
      {showPlantManagerDrawer && (
        <div className="pt-2.5 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Plot &amp; Inventory Tools
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenAddCustomPlant}
              className="min-h-[34px] inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Custom Plant</span>
            </button>

            {matchingCatalogPlants.length > 0 && (
              <button
                type="button"
                data-testid="inventory-load-all-rhs"
                onClick={() => onAddAllMatchingPlants(matchingCatalogPlants)}
                className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-emerald-50 text-emerald-900 border border-stone-300 transition cursor-pointer"
              >
                <Sprout className="w-3.5 h-3.5 text-emerald-700" />
                <span>Add Search Results ({matchingCatalogPlants.length})</span>
              </button>
            )}

            {plantCount > 0 && (
              <button
                type="button"
                onClick={onClearAllPlants}
                aria-label="Clear all plants from inventory"
                className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white hover:bg-rose-50 text-rose-800 border border-stone-300 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Plants</span>
              </button>
            )}

            <button
              type="button"
              onClick={onExportBackup}
              className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white hover:bg-stone-100 text-slate-700 border border-stone-300 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Backup JSON</span>
            </button>

            <button
              type="button"
              onClick={onOpenBackupModal}
              className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white hover:bg-stone-100 text-slate-700 border border-stone-300 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-700" />
              <span>Restore JSON</span>
            </button>

            <button
              type="button"
              onClick={onExportCsv}
              className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white hover:bg-stone-100 text-slate-700 border border-stone-300 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      )}

      {(isCatalogOpen || catalogSearchQuery.trim() !== '') && (
        <div
          data-testid="rhs-plant-search-results"
          className="pt-2 space-y-2.5 border-t border-stone-200/80"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'ALL', label: 'All Plants' },
                { id: 'SHRUBS', label: 'Shrubs & Trees' },
                { id: 'FLOWERS', label: 'Flowers & Perennials' },
                { id: 'VEGETABLES', label: 'Vegetables, Fruit & Herbs' },
                { id: 'FOLIAGE', label: 'Ferns & Foliage' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  data-testid={`rhs-catalog-filter-${cat.id}`}
                  onClick={() => setCatalogCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                    catalogCategory === cat.id
                      ? 'bg-emerald-800 text-white'
                      : 'bg-white text-slate-600 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <span className="text-xs font-semibold text-slate-600">
              {isLiveRhsLoading
                ? 'Fetching Pl@ntNet + RHS results...'
                : `Showing ${matchingCatalogPlants.length} of ${liveRhsTotalHits.toLocaleString()} Pl@ntNet + RHS plants`}
            </span>
          </div>

          {matchingCatalogPlants.length === 0 && !isLiveRhsLoading ? (
            <div className="p-3.5 rounded-xl bg-white border border-stone-200 text-xs text-slate-600 text-center">
              {catalogSearchQuery.trim() === ''
                ? 'Type a plant common or botanical name above (e.g. Lavender, Rosa, Hydrangea, Acer) or use Identify by Photo to search Pl@ntNet + RHS.'
                : `No Pl@ntNet or RHS plants matched "${catalogSearchQuery}". Try another common or botanical name.`}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {matchingCatalogPlants.map((item) => {
                const isAlreadyInPlot = isCatalogPlantInPlot(item);
                return (
                  <div
                    key={item.catalogId}
                    className="p-2.5 rounded-xl bg-white border border-stone-200 flex items-center justify-between gap-2.5 hover:border-emerald-600/50 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <PlantThumbnailWithModal
                        plantId={item.catalogId}
                        plantName={item.commonName || item.name}
                        photoRef={item.photoRef}
                        photoUrl={item.photoUrl}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {item.commonName || item.name}
                          </span>
                          {(item.plantNetId ||
                            item.dataSource === 'PLANTNET_RHS_MERGED' ||
                            item.dataSource === 'PLANTNET_SPECIES') && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-800 shrink-0">
                              Pl@ntNet
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-[10px] font-bold text-slate-700 shrink-0">
                            RHS {item.rhsRating}
                          </span>
                          {item.isAgm && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-900 shrink-0">
                              AGM
                            </span>
                          )}
                        </div>
                        {item.botanicalName && (
                          <p className="text-[11px] italic text-slate-500 truncate">
                            {item.botanicalName}
                            {item.scientificNameAuthorship
                              ? ` ${item.scientificNameAuthorship}`
                              : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      data-testid={`rhs-catalog-add-${item.catalogId}`}
                      disabled={Boolean(isAlreadyInPlot)}
                      onClick={() => onQuickAddPlant(item)}
                      className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition cursor-pointer ${
                        isAlreadyInPlot
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default'
                          : 'bg-emerald-800 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {isAlreadyInPlot ? 'In Plot ✓' : '+ Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default PlantNetSearchPanel;

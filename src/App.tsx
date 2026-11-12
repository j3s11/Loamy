/**
 * Garden & Weather Sentinel — Clean, Mobile-Friendly UK Garden Dashboard
 * Prompts the user for their garden location on first use, then displays
 * Current Temperature (°C), Wind Speed (mph), Rainfall (mm),
 * South-Facing Garden controls, 32 Garden Plants (#1–#32),
 * and the 5-Section Master Horticulturist Guide.
 */

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense, lazy } from 'react';
import { PixelSunflowerLogo } from './components/PixelSunflowerLogo';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallButton';
import {
  Wind,
  Thermometer,
  AlertTriangle,
  ShieldAlert,
  Sprout,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Circle,
  Download,
  MapPin,
  Calendar,
  Droplets,
  RotateCcw,
  Search,
  X,
  Compass,
  TrendingUp,
  BookOpen,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Upload,
  Copy,
  Camera
} from 'lucide-react';
import {
  useGardenAdvisor,
  ADVISOR_CONFIG,
  resolveGardenLocationProfile,
  getGardenLocationSuggestions,
  convertGeocodeResultToSuggestion,
  saveGardenProfileToStorage,
  loadSavedGardenProfileFromStorage,
  GARDEN_PROFILE_STORAGE_KEY,
  formatUkDateTime
} from './gardenAdvisorService';
import SevenDayRainfallRecharts from './components/SevenDayRainfallRecharts';
import PlantThumbnailWithModal from './components/PlantThumbnailWithModal';
import {
  searchRhsPlantCatalog,
  CatalogPlantItem,
  RHS_PLANT_CATALOG,
  RhsCatalogPlant,
  PLANT_CATEGORY_DEFINITIONS,
  PlantGroupCategoryId,
  resolvePlantGroupCategory,
  groupPlantInventoryByCategory,
  getPlantMonthlyCareStatus,
  PlantMonthlyCareStatus,
  calculatePlantHealthScore,
  PlantHealthAssessment,
  fetchLiveRhsCatalogPlants,
  identifyPlantWithPlantNetClient,
  LIVE_RHS_PLANT_CACHE,
  registerLiveRhsPlant
} from './utils/rhsPlantCatalog';
import { registerLivePlantImage } from './utils/plantImages';
import { getCurrentUkMonthIndex } from './utils/monthlyClayChecklist';
import {
  serializeGardenPlantsBackup,
  parseAndValidatePlantsBackup,
  applyPlantsBackupImport
} from './utils/plantBackupUtils';

// Lazy-load secondary workspace panels to reduce initial mobile JS parse time
const SoilSaturationLogPanel = lazy(() => import('./components/SoilSaturationLogPanel'));
const MonthlyClayChecklistPanel = lazy(() => import('./components/MonthlyClayChecklistPanel'));
const HadstonMasterGuidePanel = lazy(() => import('./components/HadstonMasterGuidePanel'));

// Pre-index all RHS Catalogue plants once at module load for O(1) lookup per card render
const HADSTON_BY_REF_MAP = new Map<number, RhsCatalogPlant>();
const HADSTON_BY_LOWER_NAME_MAP = new Map<string, RhsCatalogPlant>();
const CATALOG_BY_ID_MAP = new Map<string, RhsCatalogPlant>();
const CATEGORY_SEARCH_LABEL_MAP = new Map<PlantGroupCategoryId, string>();
const TENDER_OR_HALF_HARDY_SET = new Set(['H1a', 'H1b', 'H1c', 'H2', 'H3', 'H4']);

for (const def of PLANT_CATEGORY_DEFINITIONS) {
  CATEGORY_SEARCH_LABEL_MAP.set(def.id, `${def.label} ${def.shortLabel}`.toLowerCase());
}

for (const catalogPlant of RHS_PLANT_CATALOG) {
  if (typeof catalogPlant.photoRef === 'number') {
    HADSTON_BY_REF_MAP.set(catalogPlant.photoRef, catalogPlant);
  }
  CATALOG_BY_ID_MAP.set(catalogPlant.catalogId.toLowerCase(), catalogPlant);
  HADSTON_BY_LOWER_NAME_MAP.set(catalogPlant.name.toLowerCase(), catalogPlant);
  HADSTON_BY_LOWER_NAME_MAP.set(catalogPlant.commonName.toLowerCase(), catalogPlant);
  if (catalogPlant.botanicalName) {
    HADSTON_BY_LOWER_NAME_MAP.set(catalogPlant.botanicalName.toLowerCase(), catalogPlant);
  }
}

// ============================================================================
// 1. TYPES & UI CONFIGURATION
// ============================================================================

export interface PlantRecord {
  id: string;
  name: string;
  commonName?: string;
  botanicalName?: string;
  category?: PlantGroupCategoryId | string;
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

export interface GardenProfile {
  locationId: string;
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  regionCode: string;
  rhsHardinessZone: string;
  usdaEquivalent?: string;
  soilType?: string;
  soilProfile: string;
  isSouthFacing: boolean;
  gardenAspect: 'SOUTH' | 'WEST' | 'EAST' | 'NORTH' | string;
  microclimateNotes: string;
}

export interface PlantCareLogEntry {
  lastFed?: string;
  lastPruned?: string;
  lastProtected?: string;
  notes?: string;
}

const UI_CONFIG = {
  STORAGE_KEYS: {
    INVENTORY: 'gws_garden_inventory_v5',
    COMPLETED_TASKS: 'gws_completed_tasks_v3',
    PLANT_CARE_LOGS: 'gws_plant_care_logs_v1',
    PROTECTED_ALERT_PLANTS: 'gws_protected_alert_plants_v1',
    GARDEN_PROFILE: GARDEN_PROFILE_STORAGE_KEY
  },
  AUTO_RUN_ON_MOUNT: true,
  FROST_THRESHOLD_C: 2.0,
  AIR_FROST_THRESHOLD_C: 0.0,
  WIND_ROCK_THRESHOLD_MPH: 25.0,
  HEAVY_RAIN_48H_MM: 30.0,

  RHS_RATINGS: [
    { code: 'H1a', label: 'H1a (> 15°C - Heated Glasshouse)' },
    { code: 'H1b', label: 'H1b (10°C to 15°C - Subtropical)' },
    { code: 'H1c', label: 'H1c (5°C to 10°C - Frost-Free)' },
    { code: 'H2', label: 'H2 (1°C to 5°C - Tender / Cold Glass)' },
    { code: 'H3', label: 'H3 (-5°C to 1°C - Half-Hardy)' },
    { code: 'H4', label: 'H4 (-10°C to -5°C - Hardy Across Most of UK)' },
    { code: 'H5', label: 'H5 (-15°C to -10°C - Hardy)' },
    { code: 'H6', label: 'H6 (-20°C to -15°C - Very Hardy)' },
    { code: 'H7', label: 'H7 (< -20°C - Extremely Hardy)' }
  ],

  LOCATION_PRESETS: [
    'South-Facing Mixed Border (Heavy Clay)',
    'North-Facing Shaded Border (Heavy Clay)',
    'Sheltered West-Facing Acidic Bed / Ericaceous Pot',
    'Open Allotment Bed (Exposed)',
    'Raised Bed (Compost / Loam Mix)',
    'Terracotta Patio Pot',
    'Sheltered Courtyard Pot',
    'Cold Frame / Cloche'
  ],

  GROWTH_STAGE_PRESETS: [
    'Seedling / Young Plug',
    'Hardening Off',
    'Active Vegetative Growth',
    'Budding / Flowering',
    'Fruiting / Ripening',
    'Late Flowering / Pre-Dormancy',
    'Overwintering Vegetative Growth',
    'Leaf Drop / Autumn Dormancy',
    'Winter Dormant'
  ],

  SEVERITY_STYLES: {
    CRITICAL: {
      border: 'border-rose-300',
      bg: 'bg-rose-50/80',
      badge: 'bg-rose-700 text-white'
    },
    WARNING: {
      border: 'border-amber-300',
      bg: 'bg-amber-50/80',
      badge: 'bg-amber-600 text-white'
    },
    INFO: {
      border: 'border-sky-300',
      bg: 'bg-sky-50/80',
      badge: 'bg-sky-700 text-white'
    }
  } as Record<string, { border: string; bg: string; badge: string }>
};

// ============================================================================
// 2. HELPER FUNCTIONS (UK UNITS & CSV EXPORT)
// ============================================================================

const UK_DAY_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  timeZone: 'Europe/London'
});
const UK_DAY_FORMAT_CACHE = new Map<string, string>();

function formatUkDay(isoDateString?: string | null): string {
  if (!isoDateString) return 'N/A';
  const cached = UK_DAY_FORMAT_CACHE.get(isoDateString);
  if (cached) return cached;
  try {
    const date = new Date(isoDateString);
    const formatted = UK_DAY_FORMATTER.format(date);
    UK_DAY_FORMAT_CACHE.set(isoDateString, formatted);
    return formatted;
  } catch {
    return isoDateString;
  }
}

function resolveWindMph(mphVal?: number | null, kmhVal?: number | null): number | null {
  if (mphVal !== undefined && mphVal !== null && !Number.isNaN(Number(mphVal))) {
    return Number(Number(mphVal).toFixed(1));
  }
  if (kmhVal !== undefined && kmhVal !== null && !Number.isNaN(Number(kmhVal))) {
    return Number((Number(kmhVal) * 0.621371).toFixed(1));
  }
  return null;
}

function exportGardenReportToCsv(
  plantInventory: PlantRecord[],
  advice: any,
  gardenProfile: GardenProfile
) {
  try {
    const rows = [
      ['Section', 'Item / Plant Name', 'Category / RHS Rating', 'Location / Window', 'Details / Action Required']
    ];

    if (gardenProfile) {
      rows.push([
        'GARDEN_PROFILE',
        gardenProfile.locationName || 'Unconfigured Garden Plot',
        `RHS ${gardenProfile.rhsHardinessZone || 'H4-H5'}`,
        gardenProfile.isSouthFacing
          ? 'South-Facing Garden'
          : `Non-South-Facing (${gardenProfile.gardenAspect || 'NORTH'})`,
        gardenProfile.microclimateNotes || ''
      ]);
    }

    plantInventory.forEach((p) => {
      rows.push([
        'INVENTORY',
        p.name,
        p.rhsRating,
        p.location,
        `Stage: ${p.growthStage} | Vulnerabilities: ${(p.vulnerabilities || []).join('; ')}`
      ]);
    });

    (advice?.weatherAlerts || []).forEach((a: any) => {
      rows.push([
        `ALERT_${a.severity}`,
        (a.affectedPlants || []).join('; '),
        a.hazardType,
        a.forecastWindow,
        a.actionRequired
      ]);
    });

    (advice?.seasonalTasks || []).forEach((t: any) => {
      rows.push([
        'SEASONAL_TASK',
        t.taskTitle,
        t.category,
        (t.targetPlants || []).join('; '),
        t.instructions
      ]);
    });

    const csvContent = rows
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `garden-weather-sentinel-report-${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('[GardenDashboard] CSV Export failed:', err);
  }
}

// ============================================================================
// 3. MAIN DASHBOARD COMPONENT (App.tsx)
// ============================================================================

export default function App() {
  // Start with an empty garden plant inventory unless the user has added or imported custom plants
  const initialSavedInventory = useMemo<PlantRecord[]>(() => {
    const legacyStarterIds = new Set(['plt-01', 'plt-02', 'plt-03', 'plt-04']);
    try {
      localStorage.removeItem('gws_garden_inventory_v3');
      localStorage.removeItem('gws_garden_inventory_v4');
      const savedV5 = localStorage.getItem(UI_CONFIG.STORAGE_KEYS.INVENTORY);
      if (savedV5) {
        const parsed = JSON.parse(savedV5);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((p) => !legacyStarterIds.has(String(p?.id || '')))
            .map((p) => ({
              ...p,
              name: String(p.name || '').replace(/^#\d+\s+/, '').trim()
            }));
        }
      }
    } catch (err) {
      console.warn('[GardenDashboard] Failed to read inventory from localStorage:', err);
    }
    return [];
  }, []);

  // Restore previously selected location & direction from localStorage, or ask on first visit
  const initialSavedProfile = useMemo<GardenProfile>(() => {
    const restored = loadSavedGardenProfileFromStorage() as unknown as GardenProfile;

    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('autostart') === '1' && !restored.locationName) {
          const autoProfile = resolveGardenLocationProfile(
            'York, North Yorkshire, UK',
            restored as any
          ) as unknown as GardenProfile;
          saveGardenProfileToStorage(autoProfile);
          return autoProfile;
        }
      }
    } catch (err) {
      console.warn('[GardenDashboard] Failed to evaluate autostart parameter:', err);
    }

    return restored;
  }, []);

  const {
    plantInventory,
    setPlantInventory,
    gardenProfile,
    setGardenProfile,
    weatherData,
    advice,
    isLoading,
    error,
    runGardenAnalysis
  } = useGardenAdvisor(initialSavedInventory, initialSavedProfile as any);

  const hasConfiguredLocation = Boolean(
    gardenProfile?.locationName && gardenProfile.locationName.trim() !== ''
  );

  // Clean top-level workspace tab state
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<
    'OVERVIEW' | 'MASTER_GUIDE' | 'CHECKLIST' | 'SOIL_TREND' | 'PLANTS'
  >('OVERVIEW');

  // Weather tab details & sections expanded by default
  const [showWeatherDetails, setShowWeatherDetails] = useState<boolean>(true);
  const [expandedForecastDayIdx, setExpandedForecastDayIdx] = useState<number | null>(null);
  const [expandedAlertIndices, setExpandedAlertIndices] = useState<Record<number, boolean>>({});
  const [showRainfallChart, setShowRainfallChart] = useState<boolean>(true);
  const [showSoilTrendDrawer, setShowSoilTrendDrawer] = useState<boolean>(true);
  const [showPlantManagerDrawer, setShowPlantManagerDrawer] = useState<boolean>(false);

  // Location text input synced with current gardenProfile.locationName (empty on first visit)
  const [locationInputText, setLocationInputText] = useState<string>(
    initialSavedProfile.locationName || ''
  );

  // Partial location search autocomplete suggestions state
  const [isLocationSuggestionsOpen, setIsLocationSuggestionsOpen] = useState<boolean>(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);
  const [remoteLocationSuggestions, setRemoteLocationSuggestions] = useState<any[]>([]);

  // Clean progressive disclosure for location settings on mobile/desktop
  const [showLocationEditor, setShowLocationEditor] = useState<boolean>(false);
  const [locationValidationNotice, setLocationValidationNotice] = useState<string>('');

  // Combine instant local UK directory matches with optional live geocoded UK matches
  const locationSuggestions = useMemo(() => {
    const query = locationInputText.trim();
    if (!query) return [];
    const localMatches = getGardenLocationSuggestions(query, 8);
    if (remoteLocationSuggestions.length === 0) {
      return localMatches;
    }
    const seenNames = new Set(localMatches.map((m: any) => m.locationName.toLowerCase()));
    const seenTowns = new Set(localMatches.map((m: any) => (m.town || '').toLowerCase()));
    const merged = [...localMatches];
    for (const remoteItem of remoteLocationSuggestions) {
      const rName = (remoteItem.locationName || '').toLowerCase();
      const rTown = (remoteItem.town || '').toLowerCase();
      if (!seenNames.has(rName) && !seenTowns.has(rTown)) {
        seenNames.add(rName);
        merged.push(remoteItem);
      }
      if (merged.length >= 8) break;
    }
    return merged;
  }, [locationInputText, remoteLocationSuggestions]);

  // Fetch live UK geocoding suggestions for partial queries (2+ chars) to augment local directory
  useEffect(() => {
    const query = locationInputText.trim();
    if (!isLocationSuggestionsOpen || query.length < 2) {
      setRemoteLocationSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          query
        )}&count=6&language=en&format=json&countryCode=GB`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        const converted = (data?.results || [])
          .map((item: any) => convertGeocodeResultToSuggestion(item))
          .filter(Boolean);
        setRemoteLocationSuggestions(converted);
      } catch {
        // Ignore abort or offline errors; local UK directory suggestions remain available
      }
    }, 200);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [locationInputText, isLocationSuggestionsOpen]);

  // Inventory search, collapsible category headings & focused Master Guide plant state
  const [inventoryFilterText, setInventoryFilterText] = useState<string>('');
  const [expandedPlantCategories, setExpandedPlantCategories] = useState<Record<string, boolean>>({});
  const [focusedMasterGuidePlantId, setFocusedMasterGuidePlantId] = useState<string | null>(null);

  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(UI_CONFIG.STORAGE_KEYS.COMPLETED_TASKS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Per-plant care logs & personal notes persisted in localStorage
  const [plantCareLogs, setPlantCareLogs] = useState<Record<string, PlantCareLogEntry>>(() => {
    try {
      const saved = localStorage.getItem(UI_CONFIG.STORAGE_KEYS.PLANT_CARE_LOGS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Frost / Waterlogging alert plant protection checklist persisted in localStorage
  const [protectedAlertPlants, setProtectedAlertPlants] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(UI_CONFIG.STORAGE_KEYS.PROTECTED_ALERT_PLANTS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Plant Inventory Add/Edit state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlantId, setEditingPlantId] = useState<string | null>(null);
  const [plantForm, setPlantForm] = useState({
    name: '',
    category: 'SHRUBS' as PlantGroupCategoryId,
    rhsRating: 'H4',
    location: UI_CONFIG.LOCATION_PRESETS[0],
    growthStage: UI_CONFIG.GROWTH_STAGE_PRESETS[2],
    vulnerabilitiesText: '',
    photoUrl: '',
    rhsUrl: '',
    botanicalName: '',
    commonName: '',
    soilAndSun: '',
    feedWindowUk: '',
    feedTypeNpk: '',
    feedFrequencyDosage: '',
    pruneMonthsUk: '',
    pruneType: '',
    pruneTechnique: '',
    pruneAvoid: '',
    overwinteringProtocol: '',
    idDisambiguationNote: ''
  });
  const [formLiveSuggestions, setFormLiveSuggestions] = useState<RhsCatalogPlant[]>([]);
  const [isFormLookupLoading, setIsFormLookupLoading] = useState(false);

  // Live Pl@ntNet + RHS Plant Search-to-Add state
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('ALL');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
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
        err?.message || 'Could not identify plant from this photo. Try a clearer leaf or flower image.'
      );
    } finally {
      setIsPhotoIdentifying(false);
      e.target.value = '';
    }
  };

  // Garden Plants Backup Export / Import state
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [backupImportMode, setBackupImportMode] = useState<'MERGE' | 'REPLACE'>('MERGE');
  const [backupJsonInput, setBackupJsonInput] = useState('');
  const [backupUploadedFileName, setBackupUploadedFileName] = useState('');
  const [backupErrorNotice, setBackupErrorNotice] = useState('');
  const [backupStatusNotice, setBackupStatusNotice] = useState('');
  const [backupCopiedNotice, setBackupCopiedNotice] = useState(false);
  const backupFileInputRef = useRef<HTMLInputElement | null>(null);

  // Register any saved live RHS plant photos from plantInventory on mount or change
  useEffect(() => {
    for (const p of plantInventory) {
      if (p.photoUrl) {
        registerLivePlantImage(p);
      }
    }
  }, [plantInventory]);

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

  // Live RHS lookup inside the Add / Edit Custom Plant modal when typing a plant name
  useEffect(() => {
    const q = plantForm.name.trim();
    if (!isFormOpen || q.length < 2) {
      setFormLiveSuggestions([]);
      setIsFormLookupLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsFormLookupLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetchLiveRhsCatalogPlants(q, 'ALL', 5, controller.signal);
        for (const plant of res.plants) {
          registerLivePlantImage(plant);
        }
        setFormLiveSuggestions(res.plants);
      } catch {
        if (!controller.signal.aborted) {
          setFormLiveSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsFormLookupLoading(false);
        }
      }
    }, 260);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [plantForm.name, isFormOpen]);

  const matchingCatalogPlants = useMemo(() => {
    const trimmed = catalogSearchQuery.trim();
    if (!trimmed) return [];
    return liveRhsPlants.length > 0
      ? liveRhsPlants
      : searchRhsPlantCatalog(trimmed, catalogCategory).slice(0, 16);
  }, [liveRhsPlants, catalogSearchQuery, catalogCategory]);

  const activeInventoryNameSet = useMemo(() => {
    const set = new Set<string>();
    for (const p of plantInventory) {
      const lower = p.name.toLowerCase();
      set.add(lower);
      set.add(lower.replace(/^#\d+\s+/, ''));
      if (p.id) set.add(p.id.toLowerCase());
    }
    return set;
  }, [plantInventory]);

  const filteredPlotInventory = useMemo(() => {
    const q = inventoryFilterText.trim().toLowerCase();
    if (!q) return plantInventory;
    return plantInventory.filter((p: PlantRecord) => {
      const catId = resolvePlantGroupCategory(p);
      const catLabel = CATEGORY_SEARCH_LABEL_MAP.get(catId) || '';
      return (
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.rhsRating.toLowerCase().includes(q) ||
        catLabel.includes(q)
      );
    });
  }, [plantInventory, inventoryFilterText]);

  const groupedPlotInventory = useMemo(
    () => groupPlantInventoryByCategory(filteredPlotInventory, false),
    [filteredPlotInventory]
  );

  const isSearchingInventory = inventoryFilterText.trim() !== '';

  const areAllCategoriesExpanded = useMemo(
    () =>
      groupedPlotInventory.length > 0 &&
      groupedPlotInventory.every((g) => Boolean(expandedPlantCategories[g.id])),
    [groupedPlotInventory, expandedPlantCategories]
  );

  const togglePlantCategoryGroup = useCallback((categoryId: string) => {
    setExpandedPlantCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  }, []);

  const toggleAllPlantCategoryGroups = useCallback(() => {
    if (areAllCategoriesExpanded) {
      setExpandedPlantCategories({});
    } else {
      const next: Record<string, boolean> = {};
      for (const g of groupedPlotInventory) {
        next[g.id] = true;
      }
      setExpandedPlantCategories(next);
    }
  }, [areAllCategoriesExpanded, groupedPlotInventory]);

  // Current UK month index for seasonal care calculations
  const currentUkMonthIdx = useMemo(() => getCurrentUkMonthIndex(new Date()), []);

  useEffect(() => {
    try {
      localStorage.setItem(UI_CONFIG.STORAGE_KEYS.INVENTORY, JSON.stringify(plantInventory));
    } catch (err) {
      console.error('[GardenDashboard] Failed to save inventory:', err);
    }
  }, [plantInventory]);

  useEffect(() => {
    if (gardenProfile) {
      saveGardenProfileToStorage(gardenProfile);
    }
  }, [gardenProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(UI_CONFIG.STORAGE_KEYS.COMPLETED_TASKS, JSON.stringify(completedTasks));
    } catch (err) {
      console.error('[GardenDashboard] Failed to save task status:', err);
    }
  }, [completedTasks]);

  useEffect(() => {
    try {
      localStorage.setItem(UI_CONFIG.STORAGE_KEYS.PLANT_CARE_LOGS, JSON.stringify(plantCareLogs));
    } catch (err) {
      console.error('[GardenDashboard] Failed to save plant care logs:', err);
    }
  }, [plantCareLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(
        UI_CONFIG.STORAGE_KEYS.PROTECTED_ALERT_PLANTS,
        JSON.stringify(protectedAlertPlants)
      );
    } catch (err) {
      console.error('[GardenDashboard] Failed to save protected alert plants:', err);
    }
  }, [protectedAlertPlants]);

  const hasAutoAnalyzedOnMountRef = useRef(false);
  useEffect(() => {
    if (
      UI_CONFIG.AUTO_RUN_ON_MOUNT &&
      hasConfiguredLocation &&
      !hasAutoAnalyzedOnMountRef.current
    ) {
      hasAutoAnalyzedOnMountRef.current = true;
      runGardenAnalysis(false, gardenProfile);
    }
  }, [hasConfiguredLocation, gardenProfile, runGardenAnalysis]);

  // Preset location dropdown / button handler
  const handleSelectLocationPreset = (presetId: string) => {
    const resolved = resolveGardenLocationProfile(presetId, gardenProfile) as GardenProfile | null;
    if (!resolved) return;

    hasAutoAnalyzedOnMountRef.current = true;
    saveGardenProfileToStorage(resolved);
    setLocationValidationNotice('');
    setLocationInputText(resolved.locationName);
    setIsLocationSuggestionsOpen(false);
    setActiveSuggestionIndex(-1);
    setGardenProfile(resolved);
    setShowLocationEditor(false);
    runGardenAnalysis(false, resolved);
  };

  // Partial location suggestion selection handler
  const handleSelectLocationSuggestion = (suggestion: any) => {
    const resolved = resolveGardenLocationProfile(suggestion, gardenProfile) as GardenProfile | null;
    if (!resolved) return;

    hasAutoAnalyzedOnMountRef.current = true;
    saveGardenProfileToStorage(resolved);
    setLocationValidationNotice('');
    setLocationInputText(resolved.locationName);
    setIsLocationSuggestionsOpen(false);
    setActiveSuggestionIndex(-1);
    setGardenProfile(resolved);
    setShowLocationEditor(false);
    runGardenAnalysis(false, resolved);
  };

  // Keyboard navigation for partial location suggestions dropdown
  const handleLocationInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isLocationSuggestionsOpen || locationSuggestions.length === 0) {
      if (e.key === 'ArrowDown' && locationInputText.trim().length > 0) {
        setIsLocationSuggestionsOpen(true);
        setActiveSuggestionIndex(0);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) =>
        prev < locationSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) =>
        prev > 0 ? prev - 1 : locationSuggestions.length - 1
      );
    } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
      const chosen = locationSuggestions[activeSuggestionIndex];
      if (chosen) {
        e.preventDefault();
        handleSelectLocationSuggestion(chosen);
      }
    } else if (e.key === 'Escape') {
      setIsLocationSuggestionsOpen(false);
      setActiveSuggestionIndex(-1);
    }
  };

  // Custom location text input submit handler
  const handleLocationInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = locationInputText.trim();
    if (!trimmed) {
      setLocationValidationNotice('Please enter your town, city, village, or postcode to set your garden location.');
      return;
    }

    const chosenSuggestion =
      activeSuggestionIndex >= 0 && locationSuggestions[activeSuggestionIndex]
        ? locationSuggestions[activeSuggestionIndex]
        : trimmed;

    const updatedProfile = resolveGardenLocationProfile(chosenSuggestion, gardenProfile) as GardenProfile | null;
    if (!updatedProfile) return;

    hasAutoAnalyzedOnMountRef.current = true;
    saveGardenProfileToStorage(updatedProfile);
    setLocationValidationNotice('');
    setLocationInputText(updatedProfile.locationName);
    setIsLocationSuggestionsOpen(false);
    setActiveSuggestionIndex(-1);
    setGardenProfile(updatedProfile);
    setShowLocationEditor(false);
    runGardenAnalysis(false, updatedProfile);
  };

  // Garden direction selector handler (South / West / East / North)
  const handleSelectAspectOption = (aspectCode: 'SOUTH' | 'WEST' | 'EAST' | 'NORTH') => {
    const updatedProfile: GardenProfile = {
      ...gardenProfile,
      gardenAspect: aspectCode,
      isSouthFacing: aspectCode === 'SOUTH'
    };
    saveGardenProfileToStorage(updatedProfile);
    setGardenProfile(updatedProfile);
    if (hasConfiguredLocation) {
      runGardenAnalysis(false, updatedProfile);
    }
  };

  const openAddPlantModal = () => {
    setEditingPlantId(null);
    setPlantForm({
      name: '',
      category: 'SHRUBS',
      rhsRating: 'H4',
      location: gardenProfile.isSouthFacing
        ? UI_CONFIG.LOCATION_PRESETS[0]
        : UI_CONFIG.LOCATION_PRESETS[1],
      growthStage: UI_CONFIG.GROWTH_STAGE_PRESETS[2],
      vulnerabilitiesText: '',
      photoUrl: '',
      rhsUrl: '',
      botanicalName: '',
      commonName: '',
      soilAndSun: '',
      feedWindowUk: '',
      feedTypeNpk: '',
      feedFrequencyDosage: '',
      pruneMonthsUk: '',
      pruneType: '',
      pruneTechnique: '',
      pruneAvoid: '',
      overwinteringProtocol: '',
      idDisambiguationNote: ''
    });
    setFormLiveSuggestions([]);
    setIsFormOpen(true);
  };

  const openEditPlantModal = (plant: PlantRecord) => {
    setEditingPlantId(plant.id);
    setPlantForm({
      name: plant.name,
      category: resolvePlantGroupCategory(plant),
      rhsRating: plant.rhsRating || 'H4',
      location: plant.location || UI_CONFIG.LOCATION_PRESETS[0],
      growthStage: plant.growthStage || UI_CONFIG.GROWTH_STAGE_PRESETS[2],
      vulnerabilitiesText: Array.isArray(plant.vulnerabilities) ? plant.vulnerabilities.join(', ') : '',
      photoUrl: plant.photoUrl || '',
      rhsUrl: plant.rhsUrl || '',
      botanicalName: plant.botanicalName || '',
      commonName: plant.commonName || '',
      soilAndSun: plant.soilAndSun || '',
      feedWindowUk: plant.feedWindowUk || '',
      feedTypeNpk: plant.feedTypeNpk || '',
      feedFrequencyDosage: plant.feedFrequencyDosage || '',
      pruneMonthsUk: plant.pruneMonthsUk || '',
      pruneType: plant.pruneType || '',
      pruneTechnique: plant.pruneTechnique || '',
      pruneAvoid: plant.pruneAvoid || '',
      overwinteringProtocol: plant.overwinteringProtocol || '',
      idDisambiguationNote: plant.idDisambiguationNote || ''
    });
    setFormLiveSuggestions([]);
    setIsFormOpen(true);
  };

  const handleApplyLiveRhsSuggestionToForm = (rhsPlant: RhsCatalogPlant) => {
    registerLivePlantImage(rhsPlant);
    registerLiveRhsPlant(rhsPlant);
    setPlantForm({
      name: rhsPlant.commonName || rhsPlant.name,
      category: resolvePlantGroupCategory(rhsPlant),
      rhsRating: rhsPlant.rhsRating || 'H4',
      location: rhsPlant.recommendedLocation || UI_CONFIG.LOCATION_PRESETS[0],
      growthStage: rhsPlant.defaultOctGrowthStage || UI_CONFIG.GROWTH_STAGE_PRESETS[2],
      vulnerabilitiesText: (rhsPlant.vulnerabilities || []).join(', '),
      photoUrl: rhsPlant.photoUrl || '',
      rhsUrl: rhsPlant.rhsUrl || '',
      botanicalName: rhsPlant.botanicalName || '',
      commonName: rhsPlant.commonName || rhsPlant.name,
      soilAndSun: rhsPlant.soilAndSun || '',
      feedWindowUk: rhsPlant.feedWindowUk || '',
      feedTypeNpk: rhsPlant.feedTypeNpk || '',
      feedFrequencyDosage: rhsPlant.feedFrequencyDosage || '',
      pruneMonthsUk: rhsPlant.pruneMonthsUk || '',
      pruneType: rhsPlant.pruneType || '',
      pruneTechnique: rhsPlant.pruneTechnique || '',
      pruneAvoid: rhsPlant.pruneAvoid || '',
      overwinteringProtocol: rhsPlant.overwinteringProtocol || '',
      idDisambiguationNote: rhsPlant.idDisambiguationNote || ''
    });
    setFormLiveSuggestions([]);
  };

  const handleSavePlant = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = plantForm.name.trim();
    if (!trimmedName) return;

    const vulnerabilities = plantForm.vulnerabilitiesText
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    const chosenCategory = plantForm.category || resolvePlantGroupCategory({ name: trimmedName });
    const extraRhsFields = {
      commonName: plantForm.commonName || trimmedName,
      botanicalName: plantForm.botanicalName || undefined,
      photoUrl: plantForm.photoUrl || undefined,
      rhsUrl: plantForm.rhsUrl || undefined,
      soilAndSun: plantForm.soilAndSun || undefined,
      feedWindowUk: plantForm.feedWindowUk || undefined,
      feedTypeNpk: plantForm.feedTypeNpk || undefined,
      feedFrequencyDosage: plantForm.feedFrequencyDosage || undefined,
      pruneMonthsUk: plantForm.pruneMonthsUk || undefined,
      pruneType: plantForm.pruneType || undefined,
      pruneTechnique: plantForm.pruneTechnique || undefined,
      pruneAvoid: plantForm.pruneAvoid || undefined,
      overwinteringProtocol: plantForm.overwinteringProtocol || undefined,
      idDisambiguationNote: plantForm.idDisambiguationNote || undefined
    };

    if (editingPlantId) {
      setPlantInventory((prev: PlantRecord[]) =>
        prev.map((item) =>
          item.id === editingPlantId
            ? {
                ...item,
                name: trimmedName,
                category: chosenCategory,
                rhsRating: plantForm.rhsRating,
                location: plantForm.location,
                growthStage: plantForm.growthStage,
                vulnerabilities,
                ...extraRhsFields
              }
            : item
        )
      );
    } else {
      const newPlant: PlantRecord = {
        id: `plt-${Date.now()}`,
        name: trimmedName,
        category: chosenCategory,
        rhsRating: plantForm.rhsRating,
        location: plantForm.location,
        growthStage: plantForm.growthStage,
        vulnerabilities,
        ...extraRhsFields
      };
      if (newPlant.photoUrl) {
        registerLivePlantImage(newPlant);
      }
      setPlantInventory((prev: PlantRecord[]) => [newPlant, ...prev]);
    }

    setExpandedPlantCategories((prev) => ({ ...prev, [chosenCategory]: true }));
    setIsFormOpen(false);
    setEditingPlantId(null);
  };

  const handleDeletePlant = (plant: PlantRecord) => {
    setPlantInventory((prev: PlantRecord[]) => prev.filter((item) => item.id !== plant.id));
  };

  const handleResetInventory = () => {
    setPlantInventory([]);
  };

  const handleExportPlantsBackup = useCallback(() => {
    try {
      const jsonContent = serializeGardenPlantsBackup(plantInventory, {
        locationName: gardenProfile?.locationName || undefined
      });
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStamp = new Date().toISOString().split('T')[0];
      link.href = url;
      link.setAttribute('download', `loamy-garden-plants-backup-${dateStamp}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setBackupStatusNotice(
        `Exported ${plantInventory.length} garden ${
          plantInventory.length === 1 ? 'plant' : 'plants'
        } to backup file (.json).`
      );
    } catch (err) {
      console.error('[GardenDashboard] Plant backup export failed:', err);
    }
  }, [plantInventory, gardenProfile]);

  const handleCopyPlantsBackupJson = useCallback(async () => {
    try {
      const jsonContent = serializeGardenPlantsBackup(plantInventory, {
        locationName: gardenProfile?.locationName || undefined
      });
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(jsonContent);
      }
      setBackupCopiedNotice(true);
      window.setTimeout(() => setBackupCopiedNotice(false), 2500);
    } catch (err) {
      console.warn('[GardenDashboard] Failed to copy backup JSON:', err);
    }
  }, [plantInventory, gardenProfile]);

  const handleOpenBackupModal = useCallback(() => {
    setBackupErrorNotice('');
    setBackupCopiedNotice(false);
    setIsBackupModalOpen(true);
  }, []);

  const handleBackupFileSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackupUploadedFileName(file.name);
    setBackupErrorNotice('');

    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      setBackupJsonInput(content);
    };
    reader.onerror = () => {
      setBackupErrorNotice('Could not read the selected file. Please try again.');
    };
    reader.readAsText(file);
  }, []);

  const handleConfirmImportPlantsBackup = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const parsed = parseAndValidatePlantsBackup(backupJsonInput);
      if (!parsed.ok) {
        setBackupErrorNotice((parsed as { ok: false; error: string }).error);
        return;
      }

      const outcome = applyPlantsBackupImport(
        plantInventory,
        parsed.plants,
        backupImportMode
      );

      setPlantInventory(outcome.nextPlants as PlantRecord[]);
      setExpandedPlantCategories((prev) => {
        const next = { ...prev };
        for (const p of parsed.plants) {
          if (p.category) next[p.category] = true;
        }
        return next;
      });

      setBackupStatusNotice(
        backupImportMode === 'REPLACE'
          ? `Backup restored: replaced inventory with ${outcome.totalCount} ${
              outcome.totalCount === 1 ? 'plant' : 'plants'
            }.`
          : `Backup restored: ${outcome.addedCount} added, ${outcome.updatedCount} updated (${outcome.totalCount} total plants in plot).`
      );
      setBackupErrorNotice('');
      setBackupJsonInput('');
      setBackupUploadedFileName('');
      setIsBackupModalOpen(false);
    },
    [backupJsonInput, backupImportMode, plantInventory, setPlantInventory]
  );

  const handleQuickAddCatalogPlant = useCallback(
    (catalogPlant: CatalogPlantItem) => {
      const lowerName = catalogPlant.name.toLowerCase();
      const lowerCommon = (catalogPlant.commonName || '').toLowerCase();
      const lowerId = catalogPlant.catalogId.toLowerCase();
      if (
        activeInventoryNameSet.has(lowerName) ||
        (lowerCommon && activeInventoryNameSet.has(lowerCommon)) ||
        activeInventoryNameSet.has(lowerId)
      ) {
        return;
      }

      registerLivePlantImage(catalogPlant);
      registerLiveRhsPlant(catalogPlant);

      const resolvedCategory = resolvePlantGroupCategory(catalogPlant);
      const newPlant: PlantRecord = {
        id: catalogPlant.catalogId,
        name: (catalogPlant.commonName || catalogPlant.name).replace(/^#\d+\s+/, '').trim(),
        commonName: catalogPlant.commonName,
        botanicalName: catalogPlant.botanicalName,
        category: resolvedCategory,
        rhsRating: catalogPlant.rhsRating,
        location: catalogPlant.recommendedLocation,
        growthStage: catalogPlant.defaultOctGrowthStage,
        vulnerabilities: [...catalogPlant.vulnerabilities],
        photoUrl: catalogPlant.photoUrl,
        rhsUrl: catalogPlant.rhsUrl,
        isAgm: catalogPlant.isAgm,
        isPollinatorFriendly: catalogPlant.isPollinatorFriendly,
        soilAndSun: catalogPlant.soilAndSun,
        feedWindowUk: catalogPlant.feedWindowUk,
        feedTypeNpk: catalogPlant.feedTypeNpk,
        feedFrequencyDosage: catalogPlant.feedFrequencyDosage,
        pruneMonthsUk: catalogPlant.pruneMonthsUk,
        pruneType: catalogPlant.pruneType,
        pruneTechnique: catalogPlant.pruneTechnique,
        pruneAvoid: catalogPlant.pruneAvoid,
        overwinteringProtocol: catalogPlant.overwinteringProtocol,
        idDisambiguationNote: catalogPlant.idDisambiguationNote
      };
      setPlantInventory((prev: PlantRecord[]) => [newPlant, ...prev]);
      setExpandedPlantCategories((prev) => ({ ...prev, [resolvedCategory]: true }));
    },
    [activeInventoryNameSet, setPlantInventory]
  );

  const handleAddAllMatchingCatalogPlants = useCallback(() => {
    const toAdd = matchingCatalogPlants.filter(
      (item) =>
        !activeInventoryNameSet.has(item.name.toLowerCase()) &&
        !(item.commonName && activeInventoryNameSet.has(item.commonName.toLowerCase())) &&
        !activeInventoryNameSet.has(item.catalogId.toLowerCase())
    );
    if (toAdd.length === 0) return;

    const newRecords: PlantRecord[] = toAdd.map((catalogPlant) => {
      registerLivePlantImage(catalogPlant);
      registerLiveRhsPlant(catalogPlant);
      return {
        id: catalogPlant.catalogId,
        name: (catalogPlant.commonName || catalogPlant.name).replace(/^#\d+\s+/, '').trim(),
        commonName: catalogPlant.commonName,
        botanicalName: catalogPlant.botanicalName,
        category: resolvePlantGroupCategory(catalogPlant),
        rhsRating: catalogPlant.rhsRating,
        location: catalogPlant.recommendedLocation,
        growthStage: catalogPlant.defaultOctGrowthStage,
        vulnerabilities: [...catalogPlant.vulnerabilities],
        photoUrl: catalogPlant.photoUrl,
        rhsUrl: catalogPlant.rhsUrl,
        isAgm: catalogPlant.isAgm,
        isPollinatorFriendly: catalogPlant.isPollinatorFriendly,
        soilAndSun: catalogPlant.soilAndSun,
        feedWindowUk: catalogPlant.feedWindowUk,
        feedTypeNpk: catalogPlant.feedTypeNpk,
        feedFrequencyDosage: catalogPlant.feedFrequencyDosage,
        pruneMonthsUk: catalogPlant.pruneMonthsUk,
        pruneType: catalogPlant.pruneType,
        pruneTechnique: catalogPlant.pruneTechnique,
        pruneAvoid: catalogPlant.pruneAvoid,
        overwinteringProtocol: catalogPlant.overwinteringProtocol,
        idDisambiguationNote: catalogPlant.idDisambiguationNote
      };
    });

    setPlantInventory((prev: PlantRecord[]) => [...newRecords, ...prev]);
    setExpandedPlantCategories((prev) => {
      const next = { ...prev };
      for (const rec of newRecords) {
        if (rec.category) next[rec.category] = true;
      }
      return next;
    });
  }, [matchingCatalogPlants, activeInventoryNameSet, setPlantInventory]);

  const toggleTaskCompleted = (taskTitle: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskTitle]: !prev[taskTitle]
    }));
  };

  // Match an inventory plant to its rich Live RHS or Reference record in O(1) via pre-indexed Maps
  const findMatchingMasterPlant = useCallback((plant: PlantRecord): RhsCatalogPlant | null => {
    const lowerId = plant.id.toLowerCase();
    const lowerName = plant.name.toLowerCase();
    const strippedLowerName = lowerName.replace(/^#\d+\s+/, '');

    // 1. Check live RHS runtime cache first
    const fromLiveCache =
      LIVE_RHS_PLANT_CACHE.get(lowerId) ||
      LIVE_RHS_PLANT_CACHE.get(lowerName) ||
      LIVE_RHS_PLANT_CACHE.get(strippedLowerName);
    if (fromLiveCache) return fromLiveCache;

    // 2. If the plant record itself carries persisted live RHS metadata, synthesize its RhsCatalogPlant
    if (plant.soilAndSun || plant.photoUrl || plant.rhsUrl || plant.pruneTechnique) {
      return {
        catalogId: plant.id,
        name: plant.name,
        commonName: plant.commonName || plant.name,
        botanicalName: plant.botanicalName,
        category: plant.category || 'SHRUBS',
        rhsRating: plant.rhsRating || 'H4',
        recommendedLocation: plant.location,
        defaultOctGrowthStage: plant.growthStage,
        vulnerabilities: plant.vulnerabilities || [],
        photoUrl: plant.photoUrl,
        rhsUrl: plant.rhsUrl,
        isAgm: plant.isAgm,
        isPollinatorFriendly: plant.isPollinatorFriendly,
        soilAndSun: plant.soilAndSun,
        feedWindowUk: plant.feedWindowUk,
        feedTypeNpk: plant.feedTypeNpk,
        feedFrequencyDosage: plant.feedFrequencyDosage,
        pruneMonthsUk: plant.pruneMonthsUk,
        pruneType: plant.pruneType,
        pruneTechnique: plant.pruneTechnique,
        pruneAvoid: plant.pruneAvoid,
        overwinteringProtocol: plant.overwinteringProtocol,
        idDisambiguationNote: plant.idDisambiguationNote
      };
    }

    const refFromName = plant.name.match(/^#(\d+)\b/);
    if (refFromName) {
      const byRef = HADSTON_BY_REF_MAP.get(Number(refFromName[1]));
      if (byRef) return byRef;
    }

    const refFromId = plant.id.match(/hadston-(?:plt-)?0*(\d+)/i);
    if (refFromId) {
      const byIdRef = HADSTON_BY_REF_MAP.get(Number(refFromId[1]));
      if (byIdRef) return byIdRef;
    }

    const byId = CATALOG_BY_ID_MAP.get(lowerId);
    if (byId) return byId;

    const directHit =
      HADSTON_BY_LOWER_NAME_MAP.get(lowerName) ||
      HADSTON_BY_LOWER_NAME_MAP.get(strippedLowerName);
    if (directHit) return directHit;

    const bySubstring = RHS_PLANT_CATALOG.find(
      (c) =>
        strippedLowerName.includes(c.name.toLowerCase()) ||
        strippedLowerName.includes(c.commonName.toLowerCase())
    );
    return bySubstring || null;
  }, []);

  // Precompute master catalog match once per plant in inventory
  const plantMasterMap = useMemo(() => {
    const map = new Map<string, RhsCatalogPlant | null>();
    for (const p of plantInventory) {
      map.set(p.id, findMatchingMasterPlant(p));
    }
    return map;
  }, [plantInventory, findMatchingMasterPlant]);

  // Precompute monthly care status for each plant in inventory for the current UK month
  const plantMonthlyCareMap = useMemo(() => {
    const map = new Map<string, PlantMonthlyCareStatus>();
    for (const p of plantInventory) {
      const master = plantMasterMap.get(p.id);
      map.set(
        p.id,
        getPlantMonthlyCareStatus(
          {
            id: p.id,
            name: p.name,
            rhsRating: p.rhsRating,
            feedWindowUk: master?.feedWindowUk,
            pruneMonthsUk: master?.pruneMonthsUk
          },
          currentUkMonthIdx
        )
      );
    }
    return map;
  }, [plantInventory, plantMasterMap, currentUkMonthIdx]);

  // Precompute health score for each plant in inventory based on growth stage and recent weather alerts
  const plantHealthMap = useMemo(() => {
    const map = new Map<string, PlantHealthAssessment>();
    const activeWeatherAlerts = advice?.weatherAlerts || [];
    const activeHazardSummary = weatherData?.hazardSummary || {};
    const activeProtectedKeysLower: string[] = [];
    for (const [key, isChecked] of Object.entries(protectedAlertPlants)) {
      if (isChecked) activeProtectedKeysLower.push(key.toLowerCase());
    }

    for (const p of plantInventory) {
      const master = plantMasterMap.get(p.id);
      const careLogKey = master?.catalogId || p.id;
      const careLog = plantCareLogs[careLogKey];
      const strippedName = p.name.replace(/^#\d+\s+/, '').toLowerCase();

      const isProtectedInAlertChecklist =
        activeProtectedKeysLower.length > 0 &&
        activeProtectedKeysLower.some((keyLower) => keyLower.includes(strippedName));

      map.set(
        p.id,
        calculatePlantHealthScore(
          {
            id: p.id,
            name: p.name,
            rhsRating: p.rhsRating,
            growthStage: p.growthStage,
            location: p.location,
            vulnerabilities:
              Array.isArray(p.vulnerabilities) && p.vulnerabilities.length > 0
                ? p.vulnerabilities
                : master?.vulnerabilities || []
          },
          {
            weatherAlerts: activeWeatherAlerts,
            hazardSummary: activeHazardSummary,
            isProtectedInAlertChecklist,
            careLog
          }
        )
      );
    }
    return map;
  }, [
    plantInventory,
    plantMasterMap,
    advice?.weatherAlerts,
    weatherData?.hazardSummary,
    protectedAlertPlants,
    plantCareLogs
  ]);

  const displayedGroupedPlotInventory = groupedPlotInventory;

  const recordPlantCareAction = useCallback(
    (catalogId: string, actionField: 'lastFed' | 'lastPruned' | 'lastProtected') => {
      const stamp = formatUkDateTime(new Date());
      setPlantCareLogs((prev) => ({
        ...prev,
        [catalogId]: {
          ...(prev[catalogId] || {}),
          [actionField]: stamp
        }
      }));
    },
    []
  );

  const updatePlantPersonalNote = useCallback((catalogId: string, notes: string) => {
    setPlantCareLogs((prev) => ({
      ...prev,
      [catalogId]: {
        ...(prev[catalogId] || {}),
        notes
      }
    }));
  }, []);

  const toggleProtectedAlertPlant = useCallback((alertKey: string) => {
    setProtectedAlertPlants((prev) => ({
      ...prev,
      [alertKey]: !prev[alertKey]
    }));
  }, []);

  // Extract current conditions in UK units (°C, mph, mm)
  const hazardSummary = weatherData?.hazardSummary || {};
  const hourlyForecast = weatherData?.hourlyForecast || [];
  const dailyForecast = weatherData?.dailyForecast || [];
  const activeWarnings = weatherData?.severeWarnings?.activeWarnings || [];
  const weatherAlerts = advice?.weatherAlerts || [];
  const seasonalTasks = advice?.seasonalTasks || [];

  const weatherLastUpdatedLabel = useMemo(
    () =>
      formatUkDateTime(
        weatherData?.fetchedAt || weatherData?.location?.modelRunDate || advice?.evaluatedAt
      ),
    [weatherData?.fetchedAt, weatherData?.location?.modelRunDate, advice?.evaluatedAt]
  );

  const alertsLastUpdatedLabel = useMemo(
    () => formatUkDateTime(advice?.evaluatedAt || weatherData?.fetchedAt),
    [advice?.evaluatedAt, weatherData?.fetchedAt]
  );

  const currentHour = hourlyForecast[0] || null;
  const todayForecast = dailyForecast[0] || null;

  // 1. Current Temperature (°C)
  const currentTempC: number =
    currentHour?.tempC !== undefined && currentHour?.tempC !== null
      ? Number(currentHour.tempC)
      : todayForecast?.maxTempC !== undefined && todayForecast?.maxTempC !== null
      ? Number(todayForecast.maxTempC)
      : 8.8;

  const todayMaxTempC: number =
    todayForecast?.maxTempC !== undefined && todayForecast?.maxTempC !== null
      ? Number(todayForecast.maxTempC)
      : 9.8;

  const lowest7DayTempC: number =
    hazardSummary.lowestForecastTempC !== undefined && hazardSummary.lowestForecastTempC < 90
      ? Number(hazardSummary.lowestForecastTempC)
      : -0.5;

  const soilTemp6cmC: number =
    currentHour?.soilTemp6cmC !== undefined && currentHour?.soilTemp6cmC !== null
      ? Number(currentHour.soilTemp6cmC)
      : 7.5;

  // 2. Wind Speed (mph) & Peak Gust (mph)
  const currentWindSpeedMph: number =
    resolveWindMph(currentHour?.windSpeedMph, currentHour?.windSpeedKmh) ??
    resolveWindMph(todayForecast?.middayWindSpeedMph, todayForecast?.middayWindSpeedKmh) ??
    14.3;

  const peakWindGustMph: number =
    resolveWindMph(hazardSummary.maxForecastGustMph, hazardSummary.maxForecastGustKmh) ??
    resolveWindMph(todayForecast?.peakWindGustMph, todayForecast?.peakWindGustKmh) ??
    29.1;

  // 3. Rainfall (mm)
  const todayRainfallMm: number =
    todayForecast?.precipSumMm !== undefined && todayForecast?.precipSumMm !== null
      ? Number(todayForecast.precipSumMm)
      : currentHour?.precipMm !== undefined && currentHour?.precipMm !== null
      ? Number(currentHour.precipMm)
      : 4.2;

  const cumulative48hRainfallMm: number =
    hazardSummary.cumulativePrecip48hMm !== undefined && hazardSummary.cumulativePrecip48hMm !== null
      ? Number(hazardSummary.cumulativePrecip48hMm)
      : 19.0;

  const currentAspectOption =
    ADVISOR_CONFIG.GARDEN_ASPECT_OPTIONS.find(
      (opt: any) =>
        opt.code === (gardenProfile.gardenAspect || (gardenProfile.isSouthFacing ? 'SOUTH' : 'NORTH'))
    ) || ADVISOR_CONFIG.GARDEN_ASPECT_OPTIONS[0];

  const currentAspectShortName = `${currentAspectOption.code.charAt(0)}${currentAspectOption.code
    .slice(1)
    .toLowerCase()}-Facing`;

  const selectedLocationPreset = useMemo(
    () =>
      ADVISOR_CONFIG.GARDEN_LOCATION_PRESETS.find(
        (p: any) =>
          p.id === gardenProfile.locationId || p.locationName === gardenProfile.locationName
      ),
    [gardenProfile.locationId, gardenProfile.locationName]
  );

  const currentSoilProfileText =
    gardenProfile.soilProfile ||
    selectedLocationPreset?.soilProfile ||
    (gardenProfile as GardenProfile).soilType ||
    'Heavy clay to moisture-retentive garden loam (pH 6.0–6.8)';

  return (
    <div className="min-h-screen bg-[#F6F5F0] text-slate-900 font-sans safe-page-bottom overflow-x-hidden">
      {/* =====================================================================
          CLEAN STICKY TOP HEADER (Brand + Actions on Row 1, Location + Timestamp on Row 2)
      ===================================================================== */}
      <header className="border-b border-stone-200/90 bg-white sticky top-0 z-30 safe-top-header">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-2 sm:pt-3 pb-2.5 space-y-2">
          {/* Row 1: Brand Title & Quick Action Buttons */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-stone-900 border border-stone-700/80 flex items-center justify-center shrink-0 shadow-2xs">
                <PixelSunflowerLogo className="w-5 h-5 sm:w-7 sm:h-7" />
              </div>
              <div className="flex items-baseline gap-2 shrink-0">
                <h1
                  data-testid="app-brand-title"
                  className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-900 shrink-0"
                >
                  Loamy
                </h1>
                <span className="text-xs font-medium text-slate-500 hidden md:inline truncate">
                  Garden &amp; Weather Companion
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <PWAInstallButton />
              {hasConfiguredLocation && (
                <>
                  <button
                    type="button"
                    data-testid="toggle-location-editor-button"
                    onClick={() => setShowLocationEditor((prev) => !prev)}
                    className={`appearance-none inline-flex items-center justify-center gap-1 sm:gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl text-xs font-semibold leading-none whitespace-nowrap border transition cursor-pointer ${
                      showLocationEditor
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                        : 'bg-stone-100 hover:bg-stone-200 text-slate-800 border-stone-300'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span>{showLocationEditor ? 'Done' : 'Location'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => runGardenAnalysis(true)}
                    disabled={isLoading}
                    className="appearance-none inline-flex items-center justify-center gap-1 sm:gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-xl text-xs sm:text-sm font-semibold leading-none whitespace-nowrap bg-emerald-800 hover:bg-emerald-700 disabled:bg-emerald-800/60 text-white shadow-2xs transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="sm:hidden">{isLoading ? '...' : 'Refresh'}</span>
                    <span className="hidden sm:inline">
                      {isLoading ? 'Refreshing...' : 'Refresh'}
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Row 2: Dedicated Location Pill & Last Updated Timestamp Bar */}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-1.5 border-t border-stone-100 text-[11px] sm:text-xs text-slate-600">
            <button
              type="button"
              onClick={() => {
                if (hasConfiguredLocation) {
                  setShowLocationEditor((prev) => !prev);
                }
              }}
              className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-left hover:text-slate-900 transition cursor-pointer min-w-0"
              title="Tap to change garden location or direction"
            >
              <span className="inline-flex items-center gap-1 font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-none">
                <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-700 shrink-0" />
                <span className="truncate">
                  {hasConfiguredLocation
                    ? gardenProfile.locationName
                    : 'Set your garden location below'}
                </span>
              </span>
              {hasConfiguredLocation && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-800 font-semibold shrink-0">
                    RHS {gardenProfile.rhsHardinessZone}
                  </span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span className="text-amber-800 font-medium shrink-0">
                {currentAspectShortName}
              </span>
            </button>

            {hasConfiguredLocation && (
              <span
                data-testid="weather-last-updated"
                className="inline-flex items-center gap-1 text-[11px] text-slate-500 tabular-nums shrink-0"
              >
                <Clock className="w-3 h-3 text-emerald-700 shrink-0" />
                <span>Updated {weatherLastUpdatedLabel}</span>
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-5 space-y-4 sm:space-y-6">
        {!hasConfiguredLocation ? (
          /* ===================================================================
             FIRST-USE LOCATION SETUP PROMPT
             When the app is first opened, ask the user where their garden is
          =================================================================== */
          <section
            data-testid="first-use-location-setup"
            className="max-w-2xl mx-auto my-6 sm:my-10 bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6"
          >
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800">
                <PixelSunflowerLogo className="w-4 h-4 shrink-0" />
                <span>Welcome to Loamy</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Where is your garden located?
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Enter your town, city, village, or UK postcode below so we can calibrate your local
                weather forecast (°C, mph, mm), frost alerts, and seasonal care schedule for your
                32 garden plants.
              </p>
            </div>

            <form onSubmit={handleLocationInputSubmit} className="space-y-5">
              <div className="space-y-2 relative">
                <label
                  htmlFor="garden-location-input"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Your Garden Location
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1 min-w-0">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="garden-location-input"
                      data-testid="garden-location-input"
                      type="text"
                      autoFocus
                      autoComplete="off"
                      role="combobox"
                      aria-expanded={isLocationSuggestionsOpen && locationSuggestions.length > 0}
                      aria-autocomplete="list"
                      aria-controls="first-use-location-suggestions"
                      value={locationInputText}
                      onFocus={() => {
                        if (locationInputText.trim().length > 0) {
                          setIsLocationSuggestionsOpen(true);
                        }
                      }}
                      onBlur={() => {
                        window.setTimeout(() => setIsLocationSuggestionsOpen(false), 150);
                      }}
                      onKeyDown={handleLocationInputKeyDown}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLocationInputText(val);
                        setIsLocationSuggestionsOpen(val.trim().length > 0);
                        setActiveSuggestionIndex(-1);
                        if (locationValidationNotice) setLocationValidationNotice('');
                      }}
                      placeholder="Start typing town, village, or postcode (e.g. York, Morpeth, NE65)..."
                      className="w-full min-h-[44px] pl-10 pr-9 py-2 text-sm rounded-xl bg-stone-50 border border-stone-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-700"
                    />
                    {locationInputText && (
                      <button
                        type="button"
                        data-testid="clear-location-input-button"
                        onClick={() => {
                          setLocationInputText('');
                          setIsLocationSuggestionsOpen(false);
                          setActiveSuggestionIndex(-1);
                        }}
                        aria-label="Clear location search"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-stone-200/70 transition cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {/* Partial Location Suggestions Dropdown */}
                    {isLocationSuggestionsOpen && locationSuggestions.length > 0 && (
                      <ul
                        id="first-use-location-suggestions"
                        data-testid="location-suggestions-list"
                        role="listbox"
                        aria-label="Matching UK garden locations"
                        className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white border border-stone-200 rounded-xl shadow-lg max-h-64 overflow-y-auto divide-y divide-stone-100"
                      >
                        {locationSuggestions.map((suggestion: any, idx: number) => {
                          const isHighlighted = idx === activeSuggestionIndex;
                          return (
                            <li key={suggestion.id || suggestion.locationName} role="option" aria-selected={isHighlighted}>
                              <button
                                type="button"
                                data-testid="location-suggestion-item"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleSelectLocationSuggestion(suggestion);
                                }}
                                onClick={() => handleSelectLocationSuggestion(suggestion)}
                                className={`w-full text-left px-3.5 py-2.5 flex items-start justify-between gap-2 transition cursor-pointer ${
                                  isHighlighted
                                    ? 'bg-emerald-50 text-emerald-950'
                                    : 'hover:bg-stone-50 text-slate-800'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                    <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                                      {suggestion.locationName}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 truncate mt-0.5 pl-5">
                                    {suggestion.shortLabel || suggestion.county || 'UK'}
                                    {suggestion.soilProfile ? ` · ${suggestion.soilProfile}` : ''}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                                  {suggestion.postcodePrefix && (
                                    <span className="text-[11px] font-medium text-slate-600 bg-stone-100 px-1.5 py-0.5 rounded-md">
                                      {suggestion.postcodePrefix}
                                    </span>
                                  )}
                                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                                    RHS {suggestion.rhsHardinessZone || 'H4'}
                                  </span>
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                  <button
                    type="submit"
                    data-testid="set-location-button"
                    className="min-h-[44px] px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Set Garden Location
                  </button>
                </div>
                {locationValidationNotice && (
                  <p className="text-xs font-medium text-rose-700 mt-1">
                    {locationValidationNotice}
                  </p>
                )}
              </div>

              {/* Quick-select UK region presets */}
              <div className="space-y-2">
                <span className="block text-xs font-semibold text-slate-500">
                  Or choose a regional preset:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ADVISOR_CONFIG.GARDEN_LOCATION_PRESETS.map((preset: any) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectLocationPreset(preset.id)}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-medium text-left bg-stone-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-800 border border-stone-200 transition truncate cursor-pointer"
                    >
                      {preset.shortLabel || preset.locationName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2: What direction does your garden face? */}
              <div className="pt-4 border-t border-stone-200/80 space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>What direction does your garden face?</span>
                  </label>
                  <p className="text-xs text-slate-600">
                    Select the primary direction your garden faces so we can calibrate sunlight,
                    soil drying rate, and frost-thaw protection for your plants.
                  </p>
                </div>

                <div
                  data-testid="garden-direction-selector"
                  role="group"
                  aria-label="What direction does your garden face?"
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                >
                  {ADVISOR_CONFIG.GARDEN_ASPECT_OPTIONS.map((option: any) => {
                    const isSelected = currentAspectOption.code === option.code;
                    return (
                      <button
                        key={option.code}
                        type="button"
                        data-testid={`direction-option-${option.code.toLowerCase()}`}
                        onClick={() => handleSelectAspectOption(option.code)}
                        aria-pressed={isSelected}
                        className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-semibold border text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-800 border-emerald-800 text-white shadow-2xs'
                            : 'bg-stone-50 border-stone-200 text-slate-700 hover:bg-stone-100'
                        }`}
                      >
                        <Compass
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSelected ? 'text-emerald-200' : 'text-slate-400'
                          }`}
                        />
                        <span>{option.label || `${option.code.charAt(0)}${option.code.slice(1).toLowerCase()}-Facing`}</span>
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-slate-600 bg-stone-50 border border-stone-200/80 rounded-xl px-3.5 py-2.5">
                  <strong className="text-slate-900">{currentAspectShortName}:</strong>{' '}
                  {currentAspectOption.summary}
                </p>
              </div>
            </form>
          </section>
        ) : (
          <>
            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-950">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  <p className="font-bold">Weather Feed Notice</p>
                  <p className="mt-0.5 text-rose-800">{error}</p>
                </div>
              </div>
            )}

            {/* ===================================================================
                GARDEN LOCATION & DIRECTION BAR (Recommendation 3)
                Always collapsed by default on both mobile & desktop once location is set;
                opens as a clean panel only when the header location pill or 'Location' button is clicked.
            =================================================================== */}
            <section
              data-testid="garden-location-aspect-bar"
              className={`${
                showLocationEditor ? 'block' : 'hidden'
              } bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                {/* Location Input & Quick Region Preset */}
                <div className="lg:col-span-7 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="garden-location-input"
                        className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        Garden Location
                      </label>
                      <span
                        data-testid="saved-location-indicator"
                        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>Remembered for next visit</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <label htmlFor="garden-location-select" className="text-xs text-slate-500">
                        Preset:
                      </label>
                      <select
                        id="garden-location-select"
                        data-testid="garden-location-select"
                        value={selectedLocationPreset ? selectedLocationPreset.id : ''}
                        onChange={(e) => handleSelectLocationPreset(e.target.value)}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-stone-50 border border-stone-300 text-slate-800 focus:outline-none focus:border-emerald-700"
                      >
                        <option value="" disabled>
                          Choose a UK preset...
                        </option>
                        {ADVISOR_CONFIG.GARDEN_LOCATION_PRESETS.map((preset: any) => (
                          <option key={preset.id} value={preset.id}>
                            {preset.shortLabel || `${preset.locationName} (RHS ${preset.rhsHardinessZone})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <form onSubmit={handleLocationInputSubmit} className="flex flex-row gap-2 relative">
                    <div className="relative flex-1 min-w-0">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="garden-location-input"
                        data-testid="garden-location-input"
                        type="text"
                        autoComplete="off"
                        role="combobox"
                        aria-expanded={isLocationSuggestionsOpen && locationSuggestions.length > 0}
                        aria-autocomplete="list"
                        aria-controls="bar-location-suggestions"
                        value={locationInputText}
                        onFocus={() => {
                          if (locationInputText.trim().length > 0) {
                            setIsLocationSuggestionsOpen(true);
                          }
                        }}
                        onBlur={() => {
                          window.setTimeout(() => setIsLocationSuggestionsOpen(false), 150);
                        }}
                        onKeyDown={handleLocationInputKeyDown}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLocationInputText(val);
                          setIsLocationSuggestionsOpen(val.trim().length > 0);
                          setActiveSuggestionIndex(-1);
                        }}
                        placeholder="Start typing town, village, or postcode (e.g. York, Morpeth, NE65)..."
                        className="w-full min-h-[40px] pl-9 pr-8 py-1.5 text-sm rounded-xl bg-stone-50 border border-stone-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-700"
                      />
                      {locationInputText && (
                        <button
                          type="button"
                          data-testid="clear-location-input-button"
                          onClick={() => {
                            setLocationInputText('');
                            setIsLocationSuggestionsOpen(false);
                            setActiveSuggestionIndex(-1);
                          }}
                          aria-label="Clear location search"
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-stone-200/70 transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <button
                      type="submit"
                      data-testid="set-location-button"
                      className="min-h-[40px] px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Set Location
                    </button>

                    {/* Partial Location Suggestions Dropdown */}
                    {isLocationSuggestionsOpen && locationSuggestions.length > 0 && (
                      <ul
                        id="bar-location-suggestions"
                        data-testid="location-suggestions-list"
                        role="listbox"
                        aria-label="Matching UK garden locations"
                        className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white border border-stone-200 rounded-xl shadow-lg max-h-64 overflow-y-auto divide-y divide-stone-100"
                      >
                        {locationSuggestions.map((suggestion: any, idx: number) => {
                          const isHighlighted = idx === activeSuggestionIndex;
                          return (
                            <li key={suggestion.id || suggestion.locationName} role="option" aria-selected={isHighlighted}>
                              <button
                                type="button"
                                data-testid="location-suggestion-item"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleSelectLocationSuggestion(suggestion);
                                }}
                                onClick={() => handleSelectLocationSuggestion(suggestion)}
                                className={`w-full text-left px-3 py-2 flex items-start justify-between gap-2 transition cursor-pointer ${
                                  isHighlighted
                                    ? 'bg-emerald-50 text-emerald-950'
                                    : 'hover:bg-stone-50 text-slate-800'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                    <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                                      {suggestion.locationName}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 truncate mt-0.5 pl-5">
                                    {suggestion.shortLabel || suggestion.county || 'UK'}
                                    {suggestion.soilProfile ? ` · ${suggestion.soilProfile}` : ''}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                                  {suggestion.postcodePrefix && (
                                    <span className="text-[10px] font-medium text-slate-600 bg-stone-100 px-1.5 py-0.5 rounded-md">
                                      {suggestion.postcodePrefix}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                                    RHS {suggestion.rhsHardinessZone || 'H4'}
                                  </span>
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </form>
                </div>

                {/* Garden Direction Selector */}
                <div className="lg:col-span-5 flex flex-col justify-between gap-2.5 border-t border-stone-100 pt-3 lg:border-t-0 lg:pt-0 lg:border-l lg:pl-5">
                  <div className="min-w-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>What direction does your garden face?</span>
                    </span>
                  </div>

                  <div
                    data-testid="garden-direction-selector"
                    role="group"
                    aria-label="What direction does your garden face?"
                    className="grid grid-cols-4 gap-1.5"
                  >
                    {ADVISOR_CONFIG.GARDEN_ASPECT_OPTIONS.map((option: any) => {
                      const isSelected = currentAspectOption.code === option.code;
                      return (
                        <button
                          key={option.code}
                          type="button"
                          data-testid={`direction-option-${option.code.toLowerCase()}`}
                          onClick={() => handleSelectAspectOption(option.code)}
                          aria-pressed={isSelected}
                          className={`min-h-[34px] px-2 py-1 rounded-lg text-xs font-semibold border text-center transition truncate cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-800 border-emerald-800 text-white shadow-2xs'
                              : 'bg-stone-50 border-stone-200 text-slate-600 hover:bg-stone-100'
                          }`}
                        >
                          {option.code.charAt(0) + option.code.slice(1).toLowerCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
                <p data-testid="aspect-advice-summary">
                  <strong className="text-slate-900">{currentAspectShortName} Microclimate:</strong>{' '}
                  {currentAspectOption.summary}
                </p>
                <p className="text-slate-500">
                  <strong className="text-slate-700">Soil:</strong> {currentSoilProfileText}
                </p>
              </div>
            </section>

        {/* ===================================================================
            TAB 1: WEATHER & SOIL (Minimalist Progressive-Disclosure Layout)
        =================================================================== */}
        {(activeWorkspaceTab === 'OVERVIEW' || activeWorkspaceTab === 'SOIL_TREND') && (
          <div className="space-y-4">
            {/* 1. COMPACT "TODAY AT A GLANCE" BAR (Recommendation 1) */}
            <section
              data-testid="primary-weather-metrics"
              aria-label="Current weather conditions in UK units"
              className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    Today at a Glance
                  </span>
                  {(hazardSummary.frostRiskDetected ||
                    hazardSummary.windRockRiskDetected ||
                    hazardSummary.waterloggingRiskDetected) && (
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border whitespace-nowrap shrink-0 ${
                        hazardSummary.frostRiskDetected
                          ? 'bg-sky-50 text-sky-900 border-sky-200'
                          : hazardSummary.windRockRiskDetected
                          ? 'bg-amber-50 text-amber-900 border-amber-200'
                          : 'bg-blue-50 text-blue-900 border-blue-200'
                      }`}
                    >
                      <AlertTriangle
                        className={`w-3 h-3 shrink-0 ${
                          hazardSummary.frostRiskDetected
                            ? 'text-sky-600'
                            : hazardSummary.windRockRiskDetected
                            ? 'text-amber-600'
                            : 'text-blue-600'
                        }`}
                      />
                      <span>
                        {hazardSummary.frostRiskDetected
                          ? 'Frost Alert'
                          : hazardSummary.windRockRiskDetected
                          ? 'High Gusts'
                          : 'Wet Clay'}
                      </span>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  data-testid="toggle-weather-details-button"
                  onClick={() => setShowWeatherDetails((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-emerald-800 hover:text-emerald-950 px-2 sm:px-2.5 py-1 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200/80 whitespace-nowrap shrink-0 transition cursor-pointer"
                >
                  <span>{showWeatherDetails ? 'Hide details' : 'More details'}</span>
                  {showWeatherDetails ? (
                    <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-1">
                {/* Metric 1: Temperature (°C) */}
                <div
                  data-testid="metric-temperature-card"
                  onClick={() => setShowWeatherDetails((prev) => !prev)}
                  className={`p-2.5 sm:p-4 rounded-xl border transition cursor-pointer ${
                    hazardSummary.frostRiskDetected
                      ? 'bg-sky-50/60 border-sky-200'
                      : 'bg-stone-50/70 border-stone-200/80 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-semibold text-slate-500 truncate">Temp</span>
                    <Thermometer
                      className={`w-3.5 h-3.5 shrink-0 ${
                        hazardSummary.frostRiskDetected ? 'text-sky-700' : 'text-emerald-700'
                      }`}
                    />
                  </div>
                  <div
                    data-testid="current-temperature-value"
                    className="mt-1 text-lg sm:text-2xl font-bold text-slate-900 tabular-nums whitespace-nowrap"
                  >
                    {currentTempC.toFixed(1)}°C
                  </div>
                  {showWeatherDetails && (
                    <div className="mt-2 pt-2 border-t border-stone-200/70 space-y-1 text-[11px] text-slate-600 tabular-nums">
                      <p className="font-medium text-slate-700">
                        7d Low {lowest7DayTempC.toFixed(1)}°C · Soil {soilTemp6cmC.toFixed(1)}°C
                      </p>
                      <p>
                        {hazardSummary.frostRiskDetected
                          ? 'Ground/air frost risk (≤ 2°C)'
                          : 'Above ground-frost threshold'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Metric 2: Wind Speed (mph) */}
                <div
                  data-testid="metric-wind-card"
                  onClick={() => setShowWeatherDetails((prev) => !prev)}
                  className={`p-2.5 sm:p-4 rounded-xl border transition cursor-pointer ${
                    hazardSummary.windRockRiskDetected
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-stone-50/70 border-stone-200/80 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-semibold text-slate-500 truncate">Wind</span>
                    <Wind
                      className={`w-3.5 h-3.5 shrink-0 ${
                        hazardSummary.windRockRiskDetected ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    />
                  </div>
                  <div
                    data-testid="current-wind-mph-value"
                    className="mt-1 text-lg sm:text-2xl font-bold text-slate-900 tabular-nums whitespace-nowrap"
                  >
                    {currentWindSpeedMph.toFixed(1)} <span className="text-xs sm:text-sm font-semibold">mph</span>
                  </div>
                  {showWeatherDetails && (
                    <div className="mt-2 pt-2 border-t border-stone-200/70 space-y-1 text-[11px] text-slate-600 tabular-nums">
                      <p className="font-semibold text-amber-800">
                        Peak Gust {peakWindGustMph.toFixed(1)} mph
                      </p>
                      <p>
                        {hazardSummary.windRockRiskDetected
                          ? `Wind-rock risk (> ${UI_CONFIG.WIND_ROCK_THRESHOLD_MPH} mph)`
                          : `Below ${UI_CONFIG.WIND_ROCK_THRESHOLD_MPH} mph wind-rock limit`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Metric 3: Rainfall (mm) */}
                <div
                  data-testid="metric-rainfall-card"
                  onClick={() => setShowWeatherDetails((prev) => !prev)}
                  className={`p-2.5 sm:p-4 rounded-xl border transition cursor-pointer ${
                    hazardSummary.waterloggingRiskDetected
                      ? 'bg-blue-50/60 border-blue-200'
                      : 'bg-stone-50/70 border-stone-200/80 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-semibold text-slate-500 truncate">Rain</span>
                    <Droplets
                      className={`w-3.5 h-3.5 shrink-0 ${
                        hazardSummary.waterloggingRiskDetected ? 'text-blue-700' : 'text-sky-700'
                      }`}
                    />
                  </div>
                  <div
                    data-testid="current-rainfall-mm-value"
                    className="mt-1 text-lg sm:text-2xl font-bold text-slate-900 tabular-nums whitespace-nowrap"
                  >
                    {todayRainfallMm.toFixed(1)} <span className="text-xs sm:text-sm font-semibold">mm</span>
                  </div>
                  {showWeatherDetails && (
                    <div className="mt-2 pt-2 border-t border-stone-200/70 space-y-1 text-[11px] text-slate-600 tabular-nums">
                      <p className="font-medium text-slate-700">
                        48h Total: {cumulative48hRainfallMm.toFixed(1)} mm
                      </p>
                      <p>
                        {hazardSummary.waterloggingRiskDetected
                          ? `Heavy clay waterlogging risk`
                          : 'Normal clay drainage load'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 2. SLIM 7-DAY FORECAST STRIP (Recommendation 1) */}
            <section className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                    7-Day Outlook
                  </h2>
                  <span data-testid="forecast-last-updated" className="sr-only">
                    Last updated: {weatherLastUpdatedLabel}
                  </span>
                </div>

                <span className="text-[11px] text-slate-500">
                  Daily low / high (°C), rain (mm) &amp; peak gust
                </span>
              </div>

              {dailyForecast.length === 0 ? (
                <div className="py-4 text-center text-sm text-slate-500">
                  {isLoading ? 'Loading 7-day forecast...' : 'No forecast data loaded.'}
                </div>
              ) : (
                <div
                  data-testid="seven-day-forecast-strip"
                  className="grid grid-cols-1 lg:grid-cols-7 gap-1.5 sm:gap-2 overflow-hidden"
                >
                  {dailyForecast.slice(0, 7).map((day: any, idx: number) => {
                    const isFrost =
                      day.minTempC !== null &&
                      day.minTempC !== undefined &&
                      day.minTempC <= UI_CONFIG.FROST_THRESHOLD_C;
                    const dayGustMph = resolveWindMph(day.peakWindGustMph, day.peakWindGustKmh);
                    const isHighWind =
                      dayGustMph !== null && dayGustMph >= UI_CONFIG.WIND_ROCK_THRESHOLD_MPH;
                    const formattedDayLabel = formatUkDay(day.date);
                    const isDayExpanded = showWeatherDetails || expandedForecastDayIdx === idx;

                    return (
                      <button
                        type="button"
                        key={day.date || idx}
                        onClick={() =>
                          setExpandedForecastDayIdx((prev) => (prev === idx ? null : idx))
                        }
                        className={`text-left min-w-0 overflow-hidden rounded-xl px-3 py-2 lg:p-3 border transition cursor-pointer flex flex-col justify-between gap-1 ${
                          isFrost
                            ? 'bg-sky-50/60 border-sky-200 hover:border-sky-300'
                            : isHighWind
                            ? 'bg-amber-50/60 border-amber-200 hover:border-amber-300'
                            : 'bg-stone-50/60 border-stone-200/80 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 lg:flex-col lg:items-stretch lg:gap-1.5 w-full">
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <span
                              title={formattedDayLabel}
                              className="text-xs font-bold text-slate-900 truncate w-20 sm:w-24 lg:w-auto"
                            >
                              {formattedDayLabel}
                            </span>
                            {(isFrost || isHighWind) && (
                              <span
                                className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                                  isFrost
                                    ? 'bg-sky-700 text-white'
                                    : 'bg-amber-600 text-white'
                                }`}
                              >
                                {isFrost ? 'Frost' : 'Wind'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-end lg:justify-between gap-3 lg:gap-1 tabular-nums shrink-0 lg:w-full lg:pt-0.5">
                            <span className="text-[11px] text-slate-600 w-14 lg:w-auto text-right lg:text-left truncate">
                              {day.precipSumMm !== undefined && day.precipSumMm !== null
                                ? `${day.precipSumMm} mm`
                                : '0 mm'}
                            </span>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-xs text-slate-500">
                                {day.minTempC !== null && day.minTempC !== undefined
                                  ? `${day.minTempC}°C`
                                  : '--'}
                              </span>
                              <span className="text-xs text-slate-300">/</span>
                              <span className="text-sm sm:text-base font-bold text-slate-900">
                                {day.maxTempC !== null && day.maxTempC !== undefined
                                  ? `${day.maxTempC}°`
                                  : '--'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {isDayExpanded && (
                          <div className="pt-1.5 mt-1 border-t border-stone-200/70 text-[11px] text-slate-600 tabular-nums w-full flex items-center justify-between">
                            <span>Peak Wind Gust</span>
                            <span className="font-semibold text-slate-800">
                              {dayGustMph !== null ? `${dayGustMph} mph` : '--'}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 3. EXPANDABLE WEATHER ALERTS WITH INTERACTIVE PROTECTION CHECKLIST */}
            <section className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    Plant Weather Alerts ({weatherAlerts.length})
                  </h2>
                  <span data-testid="alerts-last-updated" className="sr-only">
                    Last updated: {alertsLastUpdatedLabel}
                  </span>
                </div>

                {activeWarnings.length > 0 && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-900">
                    Met Office {activeWarnings[0].level} Warning
                  </span>
                )}
              </div>

              {weatherAlerts.length === 0 ? (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs sm:text-sm text-emerald-950 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    {plantInventory.length === 0
                      ? 'No plants selected in My Garden Plants yet — add plants on the Plants tab to receive plant-specific weather alerts.'
                      : 'No severe weather hazards flagged for your selected garden plants over the next 7 days.'}
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  {weatherAlerts.map((alert: any, idx: number) => {
                    const style =
                      UI_CONFIG.SEVERITY_STYLES[alert.severity] || UI_CONFIG.SEVERITY_STYLES.INFO;
                    const isExpanded = expandedAlertIndices[idx] !== false;
                    const affectedList: string[] = alert.affectedPlants || [];
                    const plantCount = affectedList.length;
                    const protectedCount = affectedList.filter(
                      (pName) => protectedAlertPlants[`${alert.hazardType}::${pName}`]
                    ).length;
                    const allProtected = plantCount > 0 && protectedCount === plantCount;

                    return (
                      <div
                        key={idx}
                        className={`rounded-xl border ${style.border} ${style.bg} overflow-hidden transition`}
                      >
                        <button
                          type="button"
                          data-testid={`weather-alert-toggle-${idx}`}
                          onClick={() =>
                            setExpandedAlertIndices((prev) => ({
                              ...prev,
                              [idx]: !(prev[idx] !== false)
                            }))
                          }
                          aria-expanded={isExpanded}
                          className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-left cursor-pointer"
                        >
                          <div className="flex flex-wrap items-center gap-2 min-w-0">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0 ${style.badge}`}
                            >
                              {alert.severity}
                            </span>
                            <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-slate-900 truncate">
                              {alert.hazardType.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs text-slate-600 truncate">
                              · {alert.forecastWindow}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {protectedCount > 0 && (
                              <span
                                data-testid={`alert-protected-counter-${idx}`}
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                                  allProtected
                                    ? 'bg-emerald-700 text-white border-emerald-700'
                                    : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                }`}
                              >
                                {protectedCount}/{plantCount} protected
                              </span>
                            )}
                            <span className="text-[11px] font-semibold text-slate-700 bg-white/80 px-2 py-0.5 rounded-md border border-stone-200/80">
                              {plantCount} {plantCount === 1 ? 'plant' : 'plants'}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-600" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-600" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-3.5 pb-3.5 pt-2.5 border-t border-stone-200/60 space-y-2.5 bg-white/75">
                            {plantCount > 0 && (
                              <>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-[11px] font-semibold text-slate-600">
                                    Quick Protection Checklist — tap each plant as you fleece, mulch, or shelter it:
                                  </span>
                                  <button
                                    type="button"
                                    data-testid={`alert-mark-all-protected-${idx}`}
                                    onClick={() => {
                                      setProtectedAlertPlants((prev) => {
                                        const next = { ...prev };
                                        for (const pName of affectedList) {
                                          next[`${alert.hazardType}::${pName}`] = !allProtected;
                                        }
                                        return next;
                                      });
                                    }}
                                    className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                                  >
                                    {allProtected ? 'Reset checklist' : 'Mark all protected'}
                                  </button>
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                  {affectedList.map((rawPlantName: string, pIdx: number) => {
                                    const plantName = String(rawPlantName || '').replace(/^#\d+\s+/, '').trim();
                                    const alertKey = `${alert.hazardType}::${plantName}`;
                                    const isProtected = Boolean(
                                      protectedAlertPlants[alertKey] || protectedAlertPlants[`${alert.hazardType}::${rawPlantName}`]
                                    );
                                    return (
                                      <button
                                        key={pIdx}
                                        type="button"
                                        data-testid={`alert-plant-check-${idx}-${pIdx}`}
                                        onClick={() => toggleProtectedAlertPlant(alertKey)}
                                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                                          isProtected
                                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300 line-through decoration-emerald-600/70'
                                            : 'bg-white text-slate-800 border-stone-300 hover:border-emerald-600'
                                        }`}
                                      >
                                        {isProtected ? (
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                        ) : (
                                          <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        )}
                                        <span>{plantName}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </>
                            )}

                            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                              <strong className="font-semibold text-slate-900">Recommended Action: </strong>
                              {alert.actionRequired}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 4. COLLAPSIBLE CHART & SOIL TREND DRAWERS (Recommendation 1) */}
            <div className="space-y-3">
              {/* Collapsible Drawer: 7-Day Rainfall Chart */}
              <div className="bg-white border border-stone-200/90 rounded-2xl shadow-xs overflow-hidden">
                <button
                  type="button"
                  data-testid="toggle-rainfall-chart-drawer"
                  onClick={() => setShowRainfallChart((prev) => !prev)}
                  aria-expanded={showRainfallChart}
                  className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-stone-50/80 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Droplets className="w-4 h-4 text-blue-700 shrink-0" />
                    <span className="text-sm font-bold text-slate-900 truncate">
                      7-Day Rainfall Chart
                    </span>
                    <span className="text-xs text-slate-500 hidden sm:inline">
                      · Daily precipitation &amp; clay leaching threshold
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 shrink-0">
                    <span>{showRainfallChart ? 'Hide chart' : 'View chart'}</span>
                    {showRainfallChart ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                </button>

                {showRainfallChart && (
                  <div className="border-t border-stone-100 p-2 sm:p-3">
                    <SevenDayRainfallRecharts
                      dailyForecast={dailyForecast}
                      locationName={gardenProfile.locationName}
                      formatDayFn={formatUkDay}
                      lastUpdatedLabel={weatherLastUpdatedLabel}
                    />
                  </div>
                )}
              </div>

              {/* Collapsible Drawer: 30-Day Clay Soil Saturation Trend & Rain Log */}
              <div className="bg-white border border-stone-200/90 rounded-2xl shadow-xs overflow-hidden">
                <button
                  type="button"
                  data-testid="tab-soil-trend"
                  onClick={() => {
                    if (activeWorkspaceTab === 'SOIL_TREND') {
                      setActiveWorkspaceTab('OVERVIEW');
                      setShowSoilTrendDrawer(false);
                    } else {
                      setShowSoilTrendDrawer((prev) => !prev);
                    }
                  }}
                  aria-expanded={showSoilTrendDrawer || activeWorkspaceTab === 'SOIL_TREND'}
                  className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-stone-50/80 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <TrendingUp className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="text-sm font-bold text-slate-900 truncate">
                      Clay Soil Saturation &amp; 30-Day Trend
                    </span>
                    <span className="text-xs text-slate-500 hidden sm:inline">
                      · Moisture trend &amp; rain gauge log
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 shrink-0">
                    <span>
                      {showSoilTrendDrawer || activeWorkspaceTab === 'SOIL_TREND'
                        ? 'Hide soil trend'
                        : 'View soil trend'}
                    </span>
                    {showSoilTrendDrawer || activeWorkspaceTab === 'SOIL_TREND' ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                </button>

                {(showSoilTrendDrawer || activeWorkspaceTab === 'SOIL_TREND') && (
                  <div className="border-t border-stone-100 p-2 sm:p-3">
                    <Suspense
                      fallback={
                        <div className="p-6 text-center text-sm text-slate-500 animate-pulse">
                          Loading 30-day soil moisture trend &amp; rainfall log...
                        </div>
                      }
                    >
                      <SoilSaturationLogPanel
                        weatherData={weatherData}
                        gardenProfile={gardenProfile}
                        locationPresets={UI_CONFIG.LOCATION_PRESETS as any}
                      />
                    </Suspense>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 2: MASTER GUIDE (5-Section Botanical Playbook & 32 Plants)
        =================================================================== */}
        {activeWorkspaceTab === 'MASTER_GUIDE' && (
          <Suspense
            fallback={
              <div className="bg-white border border-stone-200/90 rounded-2xl p-6 text-center text-sm text-slate-500 animate-pulse">
                Loading Master Horticulturist Guide &amp; 32 Plant Care Matrix...
              </div>
            }
          >
            <HadstonMasterGuidePanel
              plantInventory={plantInventory}
              plantHealthMap={plantHealthMap}
              plantMonthlyCareMap={plantMonthlyCareMap}
              plantCareLogs={plantCareLogs}
              currentUkMonthIdx={currentUkMonthIdx}
              weatherAlerts={advice?.weatherAlerts}
              hazardSummary={weatherData?.hazardSummary}
              focusedPlantId={focusedMasterGuidePlantId}
              onClearFocusedPlant={() => setFocusedMasterGuidePlantId(null)}
              locationName={gardenProfile.locationName}
              rhsHardinessZone={gardenProfile.rhsHardinessZone}
              onAddSingleCatalogPlant={(item) => handleQuickAddCatalogPlant(item)}
              onEditGardenPlant={(plant) => {
                setActiveWorkspaceTab('PLANTS');
                openEditPlantModal(plant as PlantRecord);
              }}
              onRecordPlantCareAction={recordPlantCareAction}
              onUpdatePlantPersonalNote={updatePlantPersonalNote}
            />
          </Suspense>
        )}

        {/* ===================================================================
            TAB 3: CALENDAR & CHECKLIST (Unified Fortnightly Schedule, Priority Tasks & Clay Soil)
        =================================================================== */}
        {activeWorkspaceTab === 'CHECKLIST' && (
          <Suspense
            fallback={
              <div className="bg-white border border-stone-200/90 rounded-2xl p-6 text-center text-sm text-slate-500 animate-pulse">
                Loading unified calendar, care schedule &amp; clay soil checklist...
              </div>
            }
          >
            <MonthlyClayChecklistPanel
              plantInventory={plantInventory}
              seasonalTasks={seasonalTasks}
              completedSeasonalTasks={completedTasks}
              onToggleSeasonalTask={toggleTaskCompleted}
              alertsLastUpdatedLabel={alertsLastUpdatedLabel}
            />
          </Suspense>
        )}

        {/* ===================================================================
            TAB 4: MY PLANTS (Grouped by Collapsible Category Headings)
        =================================================================== */}
        {activeWorkspaceTab === 'PLANTS' && (
          <div className="space-y-4">
            <section className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3.5">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    My Garden Plants ({plantInventory.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Basic plant name &amp; photo list — health scores, care schedules, and logs live in the Master Guide tab.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-full sm:w-auto">
                    <input
                      type="text"
                      data-testid="plant-inventory-filter-input"
                      value={inventoryFilterText}
                      onChange={(e) => setInventoryFilterText(e.target.value)}
                      placeholder={`Filter ${plantInventory.length} plants in plot...`}
                      className="min-h-[38px] px-3 py-1.5 text-xs sm:text-sm rounded-xl bg-stone-50 border border-stone-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-700 w-full sm:w-52"
                    />
                    {inventoryFilterText && (
                      <button
                        type="button"
                        onClick={() => setInventoryFilterText('')}
                        aria-label="Clear inventory filter"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {displayedGroupedPlotInventory.length > 0 && !isSearchingInventory && (
                    <button
                      type="button"
                      data-testid="toggle-all-plant-categories-button"
                      onClick={toggleAllPlantCategoryGroups}
                      className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-50 hover:bg-stone-100 text-slate-700 border border-stone-200/90 transition cursor-pointer shrink-0"
                    >
                      <span>{areAllCategoriesExpanded ? 'Collapse All' : 'Expand All'}</span>
                      {areAllCategoriesExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    data-testid="export-plants-backup-btn"
                    onClick={handleExportPlantsBackup}
                    className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-50 hover:bg-stone-100 text-slate-800 border border-stone-200/90 transition cursor-pointer shrink-0"
                    title="Download a JSON backup of your garden plants"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Export Backup</span>
                  </button>

                  <button
                    type="button"
                    data-testid="import-plants-backup-btn"
                    onClick={handleOpenBackupModal}
                    className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-50 hover:bg-stone-100 text-slate-800 border border-stone-200/90 transition cursor-pointer shrink-0"
                    title="Import or restore garden plants from a backup JSON file"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Import Backup</span>
                  </button>

                  <button
                    type="button"
                    data-testid="toggle-plant-manager-button"
                    onClick={() => setShowPlantManagerDrawer((prev) => !prev)}
                    aria-expanded={showPlantManagerDrawer}
                    className={`min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                      showPlantManagerDrawer
                        ? 'bg-stone-200 text-slate-900'
                        : 'bg-emerald-800 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showPlantManagerDrawer ? 'Done' : 'Add / Manage'}</span>
                  </button>
                </div>
              </div>

              {backupStatusNotice && (
                <div
                  data-testid="plants-backup-status-banner"
                  role="status"
                  className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-950"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{backupStatusNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBackupStatusNotice('')}
                    aria-label="Dismiss backup notice"
                    className="p-1 rounded-lg text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Pl@ntNet + RHS Plant Finder Search Bar & Photo Identification */}
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
                      className="w-full min-h-[40px] pl-9 pr-8 py-1.5 text-xs sm:text-sm rounded-xl bg-white border border-stone-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-700"
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
                      onClick={handleAddAllMatchingCatalogPlants}
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
                          className="min-h-[34px] px-2.5 py-1 text-xs rounded-lg bg-stone-50 border border-stone-300 text-slate-800"
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
                            const isAlreadyInPlot =
                              activeInventoryNameSet.has(item.name.toLowerCase()) ||
                              (item.commonName &&
                                activeInventoryNameSet.has(item.commonName.toLowerCase()));
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
                                  onClick={() => handleQuickAddCatalogPlant(item)}
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
                        onClick={openAddPlantModal}
                        className="min-h-[34px] inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Custom Plant</span>
                      </button>

                      {matchingCatalogPlants.length > 0 && (
                        <button
                          type="button"
                          data-testid="inventory-load-all-rhs"
                          onClick={handleAddAllMatchingCatalogPlants}
                          className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-emerald-50 text-emerald-900 border border-stone-300 transition cursor-pointer"
                        >
                          <Sprout className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Add Search Results ({matchingCatalogPlants.length})</span>
                        </button>
                      )}

                      {plantInventory.length > 0 && (
                        <button
                          type="button"
                          onClick={handleResetInventory}
                          aria-label="Clear all plants from inventory"
                          className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white hover:bg-rose-50 text-rose-800 border border-stone-300 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Clear All Plants</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleExportPlantsBackup}
                        className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white hover:bg-stone-100 text-slate-700 border border-stone-300 transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Backup JSON</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenBackupModal}
                        className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white hover:bg-stone-100 text-slate-700 border border-stone-300 transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Restore JSON</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => exportGardenReportToCsv(plantInventory, advice, gardenProfile)}
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
                          const isAlreadyInPlot =
                            activeInventoryNameSet.has(item.name.toLowerCase()) ||
                            (item.commonName &&
                              activeInventoryNameSet.has(item.commonName.toLowerCase())) ||
                            activeInventoryNameSet.has(item.catalogId.toLowerCase());
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
                                onClick={() => handleQuickAddCatalogPlant(item)}
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

              {/* Add / Edit Custom Plant Form (with Live Pl@ntNet + RHS Auto-Fill Lookup) */}
              {isFormOpen && (
                <form
                  onSubmit={handleSavePlant}
                  className="p-4 rounded-2xl bg-stone-50 border border-emerald-300 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                      {editingPlantId ? 'Edit Plant' : 'Add Plant (with Pl@ntNet + RHS Lookup)'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="relative">
                      <label htmlFor="plant-name-input" className="block text-xs font-semibold text-slate-700 mb-1">
                        Plant Name * {isFormLookupLoading && <span className="text-[11px] font-normal text-emerald-700">(Searching Pl@ntNet + RHS...)</span>}
                      </label>
                      <input
                        id="plant-name-input"
                        type="text"
                        required
                        placeholder="Type a plant name to search Pl@ntNet + RHS..."
                        value={plantForm.name}
                        onChange={(e) => setPlantForm({ ...plantForm, name: e.target.value })}
                        className="w-full min-h-[38px] px-3 py-1.5 text-sm rounded-xl bg-white border border-stone-300 text-slate-900"
                      />
                      {formLiveSuggestions.length > 0 && (
                        <div className="mt-1.5 p-2 rounded-xl bg-white border border-emerald-200 shadow-sm space-y-1">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800 px-1">
                            Tap a Pl@ntNet + RHS match to auto-fill:
                          </span>
                          {formLiveSuggestions.map((sug) => (
                            <button
                              key={sug.catalogId}
                              type="button"
                              onClick={() => handleApplyLiveRhsSuggestionToForm(sug)}
                              className="w-full px-2 py-1.5 rounded-lg hover:bg-emerald-50 text-left flex items-center justify-between gap-2 transition cursor-pointer"
                            >
                              <span className="text-xs font-semibold text-slate-900 truncate">
                                {sug.commonName || sug.name}{' '}
                                {sug.botanicalName && (
                                  <span className="italic font-normal text-slate-500">
                                    ({sug.botanicalName})
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 shrink-0">
                                {sug.rhsRating}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="plant-category-select" className="block text-xs font-semibold text-slate-700 mb-1">
                        Category
                      </label>
                      <select
                        id="plant-category-select"
                        data-testid="plant-category-select"
                        value={plantForm.category}
                        onChange={(e) =>
                          setPlantForm({
                            ...plantForm,
                            category: e.target.value as PlantGroupCategoryId
                          })
                        }
                        className="w-full min-h-[38px] px-2.5 py-1.5 text-xs rounded-xl bg-white border border-stone-300 text-slate-900"
                      >
                        {PLANT_CATEGORY_DEFINITIONS.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label htmlFor="plant-rhs-select" className="block text-xs font-semibold text-slate-700 mb-1">
                        RHS Hardiness
                      </label>
                      <select
                        id="plant-rhs-select"
                        value={plantForm.rhsRating}
                        onChange={(e) => setPlantForm({ ...plantForm, rhsRating: e.target.value })}
                        className="w-full min-h-[38px] px-2.5 py-1.5 text-xs rounded-xl bg-white border border-stone-300 text-slate-900"
                      >
                        {UI_CONFIG.RHS_RATINGS.map((r) => (
                          <option key={r.code} value={r.code}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="plant-location-select" className="block text-xs font-semibold text-slate-700 mb-1">
                        Border Position
                      </label>
                      <select
                        id="plant-location-select"
                        value={plantForm.location}
                        onChange={(e) => setPlantForm({ ...plantForm, location: e.target.value })}
                        className="w-full min-h-[38px] px-2.5 py-1.5 text-xs rounded-xl bg-white border border-stone-300 text-slate-900"
                      >
                        {UI_CONFIG.LOCATION_PRESETS.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="plant-growth-stage-select" className="block text-xs font-semibold text-slate-700 mb-1">
                      Current Growth Stage
                    </label>
                    <select
                      id="plant-growth-stage-select"
                      data-testid="plant-growth-stage-select"
                      value={plantForm.growthStage}
                      onChange={(e) => setPlantForm({ ...plantForm, growthStage: e.target.value })}
                      className="w-full min-h-[38px] px-2.5 py-1.5 text-xs rounded-xl bg-white border border-stone-300 text-slate-900"
                    >
                      {UI_CONFIG.GROWTH_STAGE_PRESETS.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-200 text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-800 text-white"
                    >
                      {editingPlantId ? 'Save Changes' : 'Add Plant'}
                    </button>
                  </div>
                </form>
              )}

              {/* Grouped Plant Inventory with Collapsible Category Headings */}
              {plantInventory.length === 0 ? (
                <div
                  data-testid="empty-plant-inventory-state"
                  className="p-6 sm:p-8 text-center rounded-2xl bg-stone-50/80 border border-dashed border-stone-300 space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                    <Sprout className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      No plants in your garden yet
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Search the RHS Plant Catalogue above to add plants to your plot, create a custom plant, or import a saved backup file.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsCatalogOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5 shrink-0" />
                      <span>Browse RHS Catalogue</span>
                    </button>
                    <button
                      type="button"
                      onClick={openAddPlantModal}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-stone-100 text-slate-800 border border-stone-300 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>Add Custom Plant</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenBackupModal}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-stone-100 text-slate-800 border border-stone-300 transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>Import Backup (.json)</span>
                    </button>
                  </div>
                </div>
              ) : displayedGroupedPlotInventory.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-stone-50 border border-stone-200/80 text-xs sm:text-sm text-slate-500">
                  {`No plants match “${inventoryFilterText}”.`}
                </div>
              ) : (
                <div data-testid="plant-category-groups" className="space-y-3">
                  {displayedGroupedPlotInventory.map((group) => {
                    const isGroupOpen =
                      isSearchingInventory || Boolean(expandedPlantCategories[group.id]);

                    return (
                      <div
                        key={group.id}
                        data-testid={`plant-category-group-${group.id}`}
                        className="rounded-2xl border border-stone-200/90 bg-stone-50/40 overflow-hidden transition"
                      >
                        <button
                          type="button"
                          data-testid={`plant-category-heading-${group.id}`}
                          onClick={() => togglePlantCategoryGroup(group.id)}
                          aria-expanded={isGroupOpen}
                          className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left bg-stone-50/80 hover:bg-stone-100/80 transition cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Sprout className="w-4 h-4 text-emerald-700 shrink-0" />
                              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                                {group.label}
                              </h3>
                              <span className="px-2 py-0.5 rounded-md bg-white border border-stone-200 text-xs font-semibold text-slate-700 tabular-nums">
                                {group.plants.length}{' '}
                                {group.plants.length === 1 ? 'plant' : 'plants'}
                              </span>
                            </div>
                          </div>

                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 shrink-0">
                            <span className="hidden sm:inline">
                              {isGroupOpen ? 'Hide' : 'Show'}
                            </span>
                            {isGroupOpen ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </span>
                        </button>

                        {isGroupOpen && (
                          <div className="p-3 sm:p-4 bg-white border-t border-stone-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {group.plants.map((plant: PlantRecord) => {
                              const masterMatch = plantMasterMap.get(plant.id) ?? null;
                              const basicName =
                                masterMatch?.commonName || plant.name.replace(/^#\d+\s+/, '');

                              return (
                                <div
                                  key={plant.id}
                                  data-testid={`my-garden-plant-card-${plant.id}`}
                                  className="p-3 rounded-xl bg-stone-50/70 border border-stone-200/90 flex items-center justify-between gap-3"
                                >
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <PlantThumbnailWithModal
                                      plantId={plant.id}
                                      plantName={basicName}
                                      photoRef={masterMatch?.photoRef}
                                      photoUrl={plant.photoUrl || masterMatch?.photoUrl}
                                      size="md"
                                    />
                                    <h4 className="text-sm font-bold text-slate-900 truncate">
                                      {basicName}
                                    </h4>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleDeletePlant(plant)}
                                    aria-label={`Remove ${basicName}`}
                                    title="Remove from my garden"
                                    className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition shrink-0 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
          </>
        )}
      </main>


      {/* =====================================================================
          GARDEN PLANTS BACKUP & RESTORE MODAL (EXPORT / IMPORT JSON)
      ===================================================================== */}
      {isBackupModalOpen && (
        <div
          data-testid="plants-backup-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="plants-backup-modal-title"
          onClick={() => setIsBackupModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3.5 sm:p-6 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white border border-stone-200 shadow-2xl p-5 sm:p-6 space-y-5 my-auto"
          >
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3.5">
              <div>
                <h3
                  id="plants-backup-modal-title"
                  className="text-base sm:text-lg font-bold text-slate-900"
                >
                  Backup &amp; Restore Garden Plants
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Export your {plantInventory.length} garden plants as a JSON backup or restore from a saved file.
                </p>
              </div>
              <button
                type="button"
                data-testid="close-plants-backup-modal"
                onClick={() => setIsBackupModalOpen(false)}
                aria-label="Close backup modal"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Section 1: Export Current Inventory */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Export Current Plants ({plantInventory.length})
                </span>
                <span className="text-[11px] text-slate-500">JSON format v1</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  data-testid="modal-download-backup-btn"
                  onClick={handleExportPlantsBackup}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span>Download Backup (.json)</span>
                </button>
                <button
                  type="button"
                  data-testid="copy-plants-backup-btn"
                  onClick={handleCopyPlantsBackupJson}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-stone-100 text-slate-800 border border-stone-300 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span>{backupCopiedNotice ? 'Copied to Clipboard!' : 'Copy Backup JSON'}</span>
                </button>
              </div>
            </div>

            {/* Section 2: Import / Restore Plants */}
            <form onSubmit={handleConfirmImportPlantsBackup} className="space-y-4">
              <div className="space-y-2">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Import / Restore from Backup
                </span>

                <div
                  role="radiogroup"
                  aria-label="Import mode"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={backupImportMode === 'MERGE'}
                    data-testid="import-mode-merge"
                    onClick={() => setBackupImportMode('MERGE')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      backupImportMode === 'MERGE'
                        ? 'bg-emerald-50/90 border-emerald-700 text-emerald-950'
                        : 'bg-white border-stone-200 text-slate-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="text-xs font-bold">Merge with existing plants</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Adds new plants and updates matching plants without deleting current ones.
                    </div>
                  </button>

                  <button
                    type="button"
                    role="radio"
                    aria-checked={backupImportMode === 'REPLACE'}
                    data-testid="import-mode-replace"
                    onClick={() => setBackupImportMode('REPLACE')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      backupImportMode === 'REPLACE'
                        ? 'bg-emerald-50/90 border-emerald-700 text-emerald-950'
                        : 'bg-white border-stone-200 text-slate-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="text-xs font-bold">Replace entire plant list</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Replaces your current inventory with the plants in the backup file.
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="import-plants-json-textarea"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Select Backup File (.json) or Paste JSON
                  </label>
                  <div>
                    <input
                      ref={backupFileInputRef}
                      type="file"
                      accept=".json,application/json"
                      data-testid="import-plants-file-input"
                      onChange={handleBackupFileSelected}
                      className="sr-only"
                    />
                    <button
                      type="button"
                      data-testid="trigger-backup-file-btn"
                      onClick={() => backupFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-slate-800 border border-stone-300 transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>Choose .json File</span>
                    </button>
                  </div>
                </div>

                {backupUploadedFileName && (
                  <p className="text-[11px] font-medium text-emerald-800">
                    Loaded file: <strong>{backupUploadedFileName}</strong>
                  </p>
                )}

                <textarea
                  id="import-plants-json-textarea"
                  data-testid="import-plants-json-textarea"
                  rows={5}
                  value={backupJsonInput}
                  onChange={(e) => {
                    setBackupJsonInput(e.target.value);
                    if (backupErrorNotice) setBackupErrorNotice('');
                  }}
                  placeholder='Paste your Loamy backup JSON here or click "Choose .json File" above...'
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-stone-50 border border-stone-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-700"
                />
              </div>

              {backupErrorNotice && (
                <div
                  data-testid="import-plants-error"
                  role="alert"
                  className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-900 flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{backupErrorNotice}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsBackupModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="confirm-import-plants-btn"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 shrink-0" />
                  <span>Restore Plants</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          PRIMARY BOTTOM NAVIGATION BAR
          4-column bottom bar with stacked icons and non-truncating labels
      ===================================================================== */}
      {hasConfiguredLocation && (
        <nav
          id="workspace-tabs-anchor"
          data-testid="workspace-tabs"
          aria-label="Garden dashboard sections"
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 px-2 pt-1.5 pb-1.5 safe-bottom-nav shadow-lg"
        >
          <div className="grid grid-cols-4 gap-1 max-w-md sm:max-w-2xl mx-auto">
            <button
              type="button"
              data-testid="tab-overview"
              aria-current={
                activeWorkspaceTab === 'OVERVIEW' || activeWorkspaceTab === 'SOIL_TREND'
                  ? 'page'
                  : undefined
              }
              onClick={() => {
                setActiveWorkspaceTab('OVERVIEW');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`min-h-[46px] px-1 flex flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] sm:text-xs font-semibold transition cursor-pointer ${
                activeWorkspaceTab === 'OVERVIEW' || activeWorkspaceTab === 'SOIL_TREND'
                  ? 'text-emerald-800 bg-emerald-50/90'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Thermometer className="w-4 h-4 shrink-0" />
              <span className="sm:hidden whitespace-nowrap">Weather</span>
              <span className="hidden sm:inline whitespace-nowrap">Weather &amp; Soil</span>
            </button>

            <button
              type="button"
              data-testid="tab-master-guide"
              aria-current={activeWorkspaceTab === 'MASTER_GUIDE' ? 'page' : undefined}
              onClick={() => {
                setActiveWorkspaceTab('MASTER_GUIDE');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`min-h-[46px] px-1 flex flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] sm:text-xs font-semibold transition cursor-pointer ${
                activeWorkspaceTab === 'MASTER_GUIDE'
                  ? 'text-emerald-800 bg-emerald-50/90'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span className="sm:hidden whitespace-nowrap">Guide</span>
              <span className="hidden sm:inline whitespace-nowrap">Master Guide</span>
            </button>

            <button
              type="button"
              data-testid="tab-checklist"
              aria-current={activeWorkspaceTab === 'CHECKLIST' ? 'page' : undefined}
              onClick={() => {
                setActiveWorkspaceTab('CHECKLIST');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`min-h-[46px] px-1 flex flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] sm:text-xs font-semibold transition cursor-pointer ${
                activeWorkspaceTab === 'CHECKLIST'
                  ? 'text-emerald-800 bg-emerald-50/90'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span className="sm:hidden whitespace-nowrap">Calendar</span>
              <span className="hidden sm:inline whitespace-nowrap">Calendar &amp; Checklist</span>
            </button>

            <button
              type="button"
              data-testid="tab-plants"
              aria-current={activeWorkspaceTab === 'PLANTS' ? 'page' : undefined}
              onClick={() => {
                setActiveWorkspaceTab('PLANTS');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`min-h-[46px] px-1 flex flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] sm:text-xs font-semibold transition cursor-pointer ${
                activeWorkspaceTab === 'PLANTS'
                  ? 'text-emerald-800 bg-emerald-50/90'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sprout className="w-4 h-4 shrink-0" />
              <span className="sm:hidden whitespace-nowrap">Plants ({plantInventory.length})</span>
              <span className="hidden sm:inline whitespace-nowrap">
                My Plants ({plantInventory.length})
              </span>
            </button>
          </div>
          <span data-testid="microclimate-note" className="sr-only">
            {advice?.soilAndMicroclimateNote}
          </span>
        </nav>
      )}

      <OfflineIndicator />
    </div>
  );
}

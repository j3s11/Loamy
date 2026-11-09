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
  Clock
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
  getHadston32InventoryRecords,
  getAllRhsCatalogInventoryRecords,
  HADSTON_GARDEN_COLLECTION_32,
  RHS_PLANT_CATALOG,
  RhsCatalogPlant,
  PLANT_CATEGORY_DEFINITIONS,
  PlantGroupCategoryId,
  resolvePlantGroupCategory,
  groupPlantInventoryByCategory,
  getPlantMonthlyCareStatus,
  PlantMonthlyCareStatus,
  calculatePlantHealthScore,
  PlantHealthAssessment
} from './utils/rhsPlantCatalog';
import { HADSTON_MONTH_BY_MONTH_WEEKLY_CALENDAR } from './utils/hadstonMasterGuide';
import { getCurrentUkMonthIndex } from './utils/monthlyClayChecklist';

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
  category?: PlantGroupCategoryId | string;
  rhsRating: string;
  location: string;
  growthStage: string;
  vulnerabilities: string[];
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
    INVENTORY: 'gws_garden_inventory_v3',
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
  // Default to the user's 32 garden plants (#1–#32)
  const initialSavedInventory = useMemo<PlantRecord[]>(() => {
    try {
      const saved = localStorage.getItem(UI_CONFIG.STORAGE_KEYS.INVENTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (err) {
      console.warn('[GardenDashboard] Failed to read inventory from localStorage:', err);
    }
    return getHadston32InventoryRecords() as PlantRecord[];
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

  // Minimalist progressive-disclosure states (collapsed by default until clicked)
  const [showWeatherDetails, setShowWeatherDetails] = useState<boolean>(false);
  const [expandedForecastDayIdx, setExpandedForecastDayIdx] = useState<number | null>(null);
  const [expandedAlertIndices, setExpandedAlertIndices] = useState<Record<number, boolean>>({});
  const [showRainfallChart, setShowRainfallChart] = useState<boolean>(false);
  const [showSoilTrendDrawer, setShowSoilTrendDrawer] = useState<boolean>(false);
  const [showFullYearCalendar, setShowFullYearCalendar] = useState<boolean>(false);
  const [showMonthlyClayChecklist, setShowMonthlyClayChecklist] = useState<boolean>(false);
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

  // Inventory search, Due-This-Month filter, collapsible category headings & care modal state
  const [inventoryFilterText, setInventoryFilterText] = useState<string>('');
  const [filterDueThisMonth, setFilterDueThisMonth] = useState<boolean>(false);
  const [expandedPlantCategories, setExpandedPlantCategories] = useState<Record<string, boolean>>({});
  const [expandedHealthFactorPlantIds, setExpandedHealthFactorPlantIds] = useState<
    Record<string, boolean>
  >({});
  const [activeCareModalPlant, setActiveCareModalPlant] = useState<RhsCatalogPlant | null>(null);

  const togglePlantHealthFactors = useCallback((plantId: string) => {
    setExpandedHealthFactorPlantIds((prev) => ({
      ...prev,
      [plantId]: !prev[plantId]
    }));
  }, []);

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
    vulnerabilitiesText: ''
  });

  // RHS Plant Catalog Search-to-Add state
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('ALL');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  const matchingCatalogPlants = useMemo(
    () => searchRhsPlantCatalog(catalogSearchQuery, catalogCategory),
    [catalogSearchQuery, catalogCategory]
  );

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

  // Close Plant Care modal on Escape key
  useEffect(() => {
    if (!activeCareModalPlant) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveCareModalPlant(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCareModalPlant]);

  // Current month & week focus from the Hadston Master Guide
  const currentUkMonthIdx = useMemo(() => getCurrentUkMonthIndex(new Date()), []);
  const [selectedCalendarMonthIdx, setSelectedCalendarMonthIdx] = useState<number>(currentUkMonthIdx);
  const currentMonthGuide =
    HADSTON_MONTH_BY_MONTH_WEEKLY_CALENDAR[selectedCalendarMonthIdx] ||
    HADSTON_MONTH_BY_MONTH_WEEKLY_CALENDAR[currentUkMonthIdx] ||
    HADSTON_MONTH_BY_MONTH_WEEKLY_CALENDAR[9];
  const isSecondHalfOfMonth = new Date().getDate() >= 15;
  const activeWeeklyFocus = isSecondHalfOfMonth
    ? currentMonthGuide.week3To4
    : currentMonthGuide.week1To2;

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
      vulnerabilitiesText: ''
    });
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
      vulnerabilitiesText: Array.isArray(plant.vulnerabilities) ? plant.vulnerabilities.join(', ') : ''
    });
    setIsFormOpen(true);
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
                vulnerabilities
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
        vulnerabilities
      };
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
    setPlantInventory(getHadston32InventoryRecords() as PlantRecord[]);
  };

  const handleLoadAllHadston32Plants = () => {
    const gardenRecords = getHadston32InventoryRecords() as PlantRecord[];
    setPlantInventory(gardenRecords);
    if (hasConfiguredLocation) {
      runGardenAnalysis(false, gardenProfile);
    }
  };

  const handleLoadAllRhsCatalogPlants = () => {
    const allCatalogRecords = getAllRhsCatalogInventoryRecords() as PlantRecord[];
    setPlantInventory(allCatalogRecords);
    if (hasConfiguredLocation) {
      runGardenAnalysis(false, gardenProfile);
    }
  };

  const handleQuickAddCatalogPlant = useCallback(
    (catalogPlant: CatalogPlantItem) => {
      const lowerName = catalogPlant.name.toLowerCase();
      const lowerId = catalogPlant.catalogId.toLowerCase();
      if (activeInventoryNameSet.has(lowerName) || activeInventoryNameSet.has(lowerId)) return;

      const resolvedCategory = resolvePlantGroupCategory(catalogPlant);
      const newPlant: PlantRecord = {
        id: catalogPlant.catalogId,
        name: catalogPlant.photoRef
          ? `#${catalogPlant.photoRef} ${catalogPlant.name}`
          : catalogPlant.name,
        category: resolvedCategory,
        rhsRating: catalogPlant.rhsRating,
        location: catalogPlant.recommendedLocation,
        growthStage: catalogPlant.defaultOctGrowthStage,
        vulnerabilities: [...catalogPlant.vulnerabilities]
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
        !activeInventoryNameSet.has(item.catalogId.toLowerCase())
    );
    if (toAdd.length === 0) return;

    const newRecords: PlantRecord[] = toAdd.map((catalogPlant) => ({
      id: catalogPlant.catalogId,
      name: catalogPlant.photoRef
        ? `#${catalogPlant.photoRef} ${catalogPlant.name}`
        : catalogPlant.name,
      category: resolvePlantGroupCategory(catalogPlant),
      rhsRating: catalogPlant.rhsRating,
      location: catalogPlant.recommendedLocation,
      growthStage: catalogPlant.defaultOctGrowthStage,
      vulnerabilities: [...catalogPlant.vulnerabilities]
    }));

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

  // Match an inventory plant to its rich RHS Catalogue / Hadston Master Guide record in O(1) via pre-indexed Maps
  const findMatchingMasterPlant = useCallback((plant: PlantRecord): RhsCatalogPlant | null => {
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

    const byId = CATALOG_BY_ID_MAP.get(plant.id.toLowerCase());
    if (byId) return byId;

    const lowerName = plant.name.toLowerCase();
    const strippedLowerName = lowerName.replace(/^#\d+\s+/, '');
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

  const dueThisMonthTotalCount = useMemo(() => {
    let count = 0;
    for (const status of plantMonthlyCareMap.values()) {
      if (status.isDueThisMonth) count++;
    }
    return count;
  }, [plantMonthlyCareMap]);

  const displayedGroupedPlotInventory = useMemo(() => {
    if (!filterDueThisMonth) return groupedPlotInventory;
    const dueFiltered = filteredPlotInventory.filter(
      (p) => plantMonthlyCareMap.get(p.id)?.isDueThisMonth
    );
    return groupPlantInventoryByCategory(dueFiltered, false);
  }, [groupedPlotInventory, filteredPlotInventory, filterDueThisMonth, plantMonthlyCareMap]);

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
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-stone-900 border border-stone-700/80 flex items-center justify-center shrink-0 shadow-2xs">
                <PixelSunflowerLogo className="w-5 h-5 sm:w-7 sm:h-7" />
              </div>
              <div className="flex items-baseline gap-2 min-w-0">
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
                    className={`inline-flex items-center justify-center gap-1.5 min-h-[34px] sm:min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
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
                    className="inline-flex items-center justify-center gap-1.5 min-h-[34px] sm:min-h-[38px] px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-800 hover:bg-emerald-700 disabled:bg-emerald-800/60 text-white shadow-2xs transition cursor-pointer"
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
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {currentAspectShortName}: {currentAspectOption.summary}
                    </p>
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
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Today at a Glance
                  </span>
                  {(hazardSummary.frostRiskDetected ||
                    hazardSummary.windRockRiskDetected ||
                    hazardSummary.waterloggingRiskDetected) && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200">
                      <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
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
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 px-2.5 py-1 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200/80 transition cursor-pointer"
                >
                  <span>{showWeatherDetails ? 'Hide details' : 'More details'}</span>
                  {showWeatherDetails ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-1">
                {/* Metric 1: Temperature (°C) */}
                <div
                  data-testid="metric-temperature-card"
                  onClick={() => setShowWeatherDetails((prev) => !prev)}
                  className={`p-3 sm:p-4 rounded-xl border transition cursor-pointer ${
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
                    className="mt-1 text-xl sm:text-2xl font-bold text-slate-900 tabular-nums"
                  >
                    {currentTempC.toFixed(1)}°C
                  </div>
                  {showWeatherDetails && (
                    <div className="mt-2 pt-2 border-t border-stone-200/70 space-y-1 text-[11px] text-slate-600 tabular-nums">
                      <p className="font-medium text-slate-700">
                        High {todayMaxTempC.toFixed(1)}°C · 7d Low {lowest7DayTempC.toFixed(1)}°C
                      </p>
                      <p>
                        {hazardSummary.frostRiskDetected
                          ? `Frost alert: overnight low reaches ${lowest7DayTempC.toFixed(1)}°C`
                          : 'Above ground-frost threshold'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Metric 2: Wind Speed (mph) */}
                <div
                  data-testid="metric-wind-card"
                  onClick={() => setShowWeatherDetails((prev) => !prev)}
                  className={`p-3 sm:p-4 rounded-xl border transition cursor-pointer ${
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
                    className="mt-1 text-xl sm:text-2xl font-bold text-slate-900 tabular-nums"
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
                  className={`p-3 sm:p-4 rounded-xl border transition cursor-pointer ${
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
                    className="mt-1 text-xl sm:text-2xl font-bold text-slate-900 tabular-nums"
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

                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-sky-600 shrink-0" />
                    <span>Frost</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span>Wind</span>
                  </span>
                </div>
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
                        {/* Compact single-row layout on mobile/tablet, stacked card on lg+ */}
                        <div className="flex items-center justify-between gap-2 lg:flex-col lg:items-stretch lg:gap-1.5 w-full">
                          <div className="flex items-center gap-2 lg:justify-between min-w-0">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 lg:order-2 ${
                                isFrost
                                  ? 'bg-sky-600'
                                  : isHighWind
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500/60'
                              }`}
                              title={isFrost ? 'Frost risk' : isHighWind ? 'High wind' : 'Normal'}
                            />
                            <span
                              title={formattedDayLabel}
                              className="text-xs font-bold text-slate-900 truncate w-20 sm:w-24 lg:w-auto lg:order-1"
                            >
                              {formattedDayLabel}
                            </span>
                            {(isFrost || isHighWind) && (
                              <span
                                className={`lg:hidden text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
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
                            <span className="text-[11px] text-slate-600 lg:hidden w-14 text-right">
                              {day.precipSumMm !== undefined && day.precipSumMm !== null
                                ? `${day.precipSumMm} mm`
                                : '0 mm'}
                            </span>
                            <div className="flex items-baseline gap-1.5 lg:justify-between lg:w-full">
                              <span className="text-xs text-slate-500 lg:order-2">
                                {day.minTempC !== null && day.minTempC !== undefined
                                  ? `${day.minTempC}°C`
                                  : '--'}
                              </span>
                              <span className="text-xs text-slate-300 lg:hidden">/</span>
                              <span className="text-sm sm:text-base font-bold text-slate-900 lg:order-1">
                                {day.maxTempC !== null && day.maxTempC !== undefined
                                  ? `${day.maxTempC}°`
                                  : '--'}
                              </span>
                            </div>
                          </div>

                          <div className="hidden lg:flex items-center justify-between gap-1 text-[11px] text-slate-600 tabular-nums w-full">
                            <span className="truncate">
                              {day.precipSumMm !== undefined && day.precipSumMm !== null
                                ? `${day.precipSumMm} mm`
                                : '0 mm'}
                            </span>
                            {(isFrost || isHighWind) && (
                              <span
                                className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                                  isFrost
                                    ? 'bg-sky-700 text-white'
                                    : 'bg-amber-600 text-white'
                                }`}
                              >
                                {isFrost ? 'Frost' : 'Wind'}
                              </span>
                            )}
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

            {/* 3. EXPANDABLE 1-LINE WEATHER ALERTS WITH INTERACTIVE PROTECTION CHECKLIST */}
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

                {activeWarnings.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-900">
                    Met Office {activeWarnings[0].level} Warning
                  </span>
                ) : (
                  weatherAlerts.length > 0 && (
                    <span className="text-[11px] text-slate-500">Tap an alert to tick off protected plants</span>
                  )
                )}
              </div>

              {weatherAlerts.length === 0 ? (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs sm:text-sm text-emerald-950 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>No severe weather hazards flagged for your plants over the next 7 days.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {weatherAlerts.map((alert: any, idx: number) => {
                    const style =
                      UI_CONFIG.SEVERITY_STYLES[alert.severity] || UI_CONFIG.SEVERITY_STYLES.INFO;
                    const isExpanded = Boolean(expandedAlertIndices[idx]);
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
                          onClick={() =>
                            setExpandedAlertIndices((prev) => ({
                              ...prev,
                              [idx]: !prev[idx]
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
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[11px] font-semibold text-slate-600">
                                Quick Protection Checklist — tap each plant as you fleece, mulch, or shelter it:
                              </span>
                              {plantCount > 0 && (
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
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {affectedList.map((plantName: string, pIdx: number) => {
                                const alertKey = `${alert.hazardType}::${plantName}`;
                                const isProtected = Boolean(protectedAlertPlants[alertKey]);
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
              locationName={gardenProfile.locationName}
              rhsHardinessZone={gardenProfile.rhsHardinessZone}
              onAddSingleCatalogPlant={(item) => handleQuickAddCatalogPlant(item)}
              onLoadAllHadston32={handleLoadAllHadston32Plants}
            />
          </Suspense>
        )}

        {/* ===================================================================
            TAB 3: CALENDAR & CHECKLIST (Recommendation 4: Focus on Active Fortnight)
        =================================================================== */}
        {activeWorkspaceTab === 'CHECKLIST' && (
          <div className="space-y-4">
            {/* 1. Priority Seasonal Tasks Checklist */}
            <section className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    Priority Seasonal Tasks ({seasonalTasks.length})
                  </h2>
                  <span data-testid="tasks-last-updated" className="sr-only">
                    Last updated: {alertsLastUpdatedLabel}
                  </span>
                </div>
                <span className="text-xs text-slate-500">Tap to check off</span>
              </div>

              <div className="space-y-2">
                {seasonalTasks.map((task: any, idx: number) => {
                  const isDone = Boolean(completedTasks[task.taskTitle]);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleTaskCompleted(task.taskTitle)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                        isDone
                          ? 'bg-stone-50 border-stone-200 opacity-60'
                          : 'bg-white border-stone-200/90 hover:border-emerald-600/60'
                      }`}
                    >
                      <button
                        type="button"
                        className="mt-0.5 text-emerald-700 shrink-0 focus:outline-none"
                        aria-label={`Mark ${task.taskTitle} as complete`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        ) : (
                          <Circle className="w-4 h-4 text-stone-400 hover:text-emerald-700" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className={`text-xs sm:text-sm font-bold ${
                              isDone ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {task.taskTitle}
                          </h3>
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                            {task.category.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                          {task.instructions}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 2. Active Fortnight Focus (with "Browse All 12 Months" progressive disclosure) */}
            <section className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    {currentMonthGuide.monthName} ·{' '}
                    {selectedCalendarMonthIdx === currentUkMonthIdx
                      ? `Active Focus (${isSecondHalfOfMonth ? 'Weeks 3–4' : 'Weeks 1–2'})`
                      : 'Monthly Schedule'}
                  </span>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                    Fortnightly Care Schedule
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {selectedCalendarMonthIdx !== currentUkMonthIdx && (
                    <button
                      type="button"
                      onClick={() => setSelectedCalendarMonthIdx(currentUkMonthIdx)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                    >
                      Current Month
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowFullYearCalendar((prev) => !prev)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-slate-800 border border-stone-200 transition cursor-pointer"
                  >
                    <span>
                      {showFullYearCalendar ? 'Show Active Fortnight Only' : 'Browse All 12 Months'}
                    </span>
                    {showFullYearCalendar ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* 12-Month Selector Pills (Hidden unless Browse All 12 Months is clicked) */}
              {showFullYearCalendar && (
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
                  {HADSTON_MONTH_BY_MONTH_WEEKLY_CALENDAR.map((m, idx) => {
                    const isSelected = idx === selectedCalendarMonthIdx;
                    const isCurrentMonth = idx === currentUkMonthIdx;
                    return (
                      <button
                        key={m.monthName}
                        type="button"
                        onClick={() => setSelectedCalendarMonthIdx(idx)}
                        className={`min-h-[34px] px-2 py-1 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-800 border-emerald-800 text-white shadow-2xs'
                            : isCurrentMonth
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-stone-50 border-stone-200 text-slate-700 hover:bg-stone-100'
                        }`}
                      >
                        {m.monthName.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Fortnight Cards: Show only active fortnight by default, or both when expanded */}
              <div
                className={`grid grid-cols-1 ${
                  showFullYearCalendar ? 'lg:grid-cols-2' : ''
                } gap-4`}
              >
                {/* Weeks 1–2 */}
                {(showFullYearCalendar || !isSecondHalfOfMonth) && (
                  <div
                    className={`rounded-xl border p-4 space-y-2.5 ${
                      selectedCalendarMonthIdx === currentUkMonthIdx && !isSecondHalfOfMonth
                        ? 'bg-emerald-50/35 border-emerald-300'
                        : 'bg-stone-50/70 border-stone-200/90'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        {currentMonthGuide.monthName} — Weeks 1–2
                      </h3>
                      {selectedCalendarMonthIdx === currentUkMonthIdx && !isSecondHalfOfMonth && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-800 text-white">
                          Active Now
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs leading-relaxed">
                      <div className="p-2.5 rounded-lg bg-white border border-stone-200/80">
                        <span className="block text-[11px] font-bold uppercase text-sky-800 mb-0.5">
                          Watering &amp; Soil
                        </span>
                        <p className="text-slate-700">{currentMonthGuide.week1To2.wateringAndSoilCare}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-stone-200/80">
                        <span className="block text-[11px] font-bold uppercase text-emerald-800 mb-0.5">
                          Feeding &amp; Mulch
                        </span>
                        <p className="text-slate-700">{currentMonthGuide.week1To2.feedingAndMulching}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-stone-200/80">
                        <span className="block text-[11px] font-bold uppercase text-amber-900 mb-0.5">
                          Pruning
                        </span>
                        <p className="text-slate-700">{currentMonthGuide.week1To2.pruningAndDeadheading}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-stone-200/80">
                        <span className="block text-[11px] font-bold uppercase text-rose-800 mb-0.5">
                          Frost &amp; Pests
                        </span>
                        <p className="text-slate-700">{currentMonthGuide.week1To2.pestDiseaseAndFrost}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Weeks 3–4 */}
                {(showFullYearCalendar || isSecondHalfOfMonth) && (
                  <div
                    className={`rounded-xl border p-4 space-y-2.5 ${
                      selectedCalendarMonthIdx === currentUkMonthIdx && isSecondHalfOfMonth
                        ? 'bg-emerald-50/35 border-emerald-300'
                        : 'bg-stone-50/70 border-stone-200/90'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        {currentMonthGuide.monthName} — Weeks 3–4
                      </h3>
                      {selectedCalendarMonthIdx === currentUkMonthIdx && isSecondHalfOfMonth && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-800 text-white">
                          Active Now
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs leading-relaxed">
                      <div className="p-2.5 rounded-lg bg-white border border-stone-200/80">
                        <span className="block text-[11px] font-bold uppercase text-sky-800 mb-0.5">
                          Watering &amp; Soil
                        </span>
                        <p className="text-slate-700">{currentMonthGuide.week3To4.wateringAndSoilCare}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-stone-200/80">
                        <span className="block text-[11px] font-bold uppercase text-emerald-800 mb-0.5">
                          Feeding &amp; Mulch
                        </span>
                        <p className="text-slate-700">{currentMonthGuide.week3To4.feedingAndMulching}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-stone-200/80">
                        <span className="block text-[11px] font-bold uppercase text-amber-900 mb-0.5">
                          Pruning
                        </span>
                        <p className="text-slate-700">{currentMonthGuide.week3To4.pruningAndDeadheading}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-stone-200/80">
                        <span className="block text-[11px] font-bold uppercase text-rose-800 mb-0.5">
                          Frost &amp; Pests
                        </span>
                        <p className="text-slate-700">{currentMonthGuide.week3To4.pestDiseaseAndFrost}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 3. Collapsible Monthly Clay Soil Checklist Drawer */}
            <div className="bg-white border border-stone-200/90 rounded-2xl shadow-xs overflow-hidden">
              <button
                type="button"
                onClick={() => setShowMonthlyClayChecklist((prev) => !prev)}
                aria-expanded={showMonthlyClayChecklist}
                className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-stone-50/80 transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="text-sm font-bold text-slate-900 truncate">
                    Monthly Clay Soil &amp; Drainage Checklist
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 shrink-0">
                  <span>{showMonthlyClayChecklist ? 'Hide checklist' : 'View checklist'}</span>
                  {showMonthlyClayChecklist ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </span>
              </button>

              {showMonthlyClayChecklist && (
                <div className="border-t border-stone-100 p-2 sm:p-3">
                  <Suspense
                    fallback={
                      <div className="p-6 text-center text-sm text-slate-500 animate-pulse">
                        Loading monthly clay checklist...
                      </div>
                    }
                  >
                    <MonthlyClayChecklistPanel />
                  </Suspense>
                </div>
              )}
            </div>
          </div>
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
                    Grouped by category — tap a heading to expand or tap any plant for its care guide.
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

                  <button
                    type="button"
                    data-testid="filter-due-this-month-button"
                    onClick={() => setFilterDueThisMonth((prev) => !prev)}
                    aria-pressed={filterDueThisMonth}
                    className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer shrink-0 ${
                      filterDueThisMonth
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-950 border-emerald-200'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>Due This Month ({dueThisMonthTotalCount})</span>
                  </button>

                  {displayedGroupedPlotInventory.length > 0 && !isSearchingInventory && !filterDueThisMonth && (
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

              {/* Always-Accessible RHS Plant Catalogue Search Bar to Add More Plants */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50/90 border border-stone-200/90 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                      Search RHS Plant Catalogue ({RHS_PLANT_CATALOG.length} UK Plants)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Search by common name, botanical name, category, or RHS rating to add plants to your garden
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <label htmlFor="plant-catalog-search" className="sr-only">
                      Search RHS plant catalogue to add
                    </label>
                    <input
                      id="plant-catalog-search"
                      data-testid="rhs-catalog-search-input"
                      type="text"
                      placeholder={`Search all ${RHS_PLANT_CATALOG.length} RHS catalogue plants to add (e.g. Rose, Tomato, Acer, Dahlia, Blueberry, Fern)...`}
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

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      data-testid="browse-rhs-catalogue-btn"
                      onClick={() => setIsCatalogOpen((prev) => !prev)}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-stone-100 text-slate-800 border border-stone-300 transition whitespace-nowrap cursor-pointer"
                    >
                      {isCatalogOpen
                        ? 'Hide Catalogue'
                        : `Browse All (${RHS_PLANT_CATALOG.length})`}
                    </button>

                    <button
                      type="button"
                      data-testid="add-all-rhs-catalogue-btn"
                      onClick={handleAddAllMatchingCatalogPlants}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition whitespace-nowrap cursor-pointer"
                      title="Add all matching RHS catalogue plants that are not yet in your plot"
                    >
                      + Add All RHS Plants
                    </button>
                  </div>
                </div>

                {/* Secondary Plot Management Controls (Custom Plant, Starter 32, Full 92, Reset, CSV) */}
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

                      <button
                        type="button"
                        data-testid="inventory-load-all-rhs"
                        onClick={handleLoadAllRhsCatalogPlants}
                        className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-emerald-50 text-emerald-900 border border-stone-300 transition cursor-pointer"
                      >
                        <Sprout className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Load All RHS ({RHS_PLANT_CATALOG.length})</span>
                      </button>

                      <button
                        type="button"
                        data-testid="inventory-load-hadston-32"
                        onClick={handleLoadAllHadston32Plants}
                        className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-emerald-50 text-emerald-900 border border-stone-300 transition cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Reset to Starter 32</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetInventory}
                        aria-label="Reset plant inventory"
                        className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white hover:bg-stone-100 text-slate-700 border border-stone-300 transition cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset</span>
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
                          { id: 'ALL', label: `All (${RHS_PLANT_CATALOG.length})` },
                          { id: 'SHRUBS', label: 'Shrubs & Trees' },
                          { id: 'FLOWERS', label: 'Flowers & Perennials' },
                          { id: 'VEGETABLES', label: 'Vegetables, Fruit & Herbs' },
                          { id: 'FOLIAGE', label: 'Ferns & Foliage' },
                          { id: 'HADSTON_32', label: 'Starter 32' }
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
                        {matchingCatalogPlants.length} {matchingCatalogPlants.length === 1 ? 'plant' : 'plants'} found
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                      {matchingCatalogPlants.map((item) => {
                        const isAlreadyInPlot =
                          activeInventoryNameSet.has(item.name.toLowerCase()) ||
                          activeInventoryNameSet.has(item.catalogId.toLowerCase());
                        return (
                          <div
                            key={item.catalogId}
                            className="p-2.5 rounded-xl bg-white border border-stone-200 flex items-center justify-between gap-2.5 hover:border-emerald-600/50 transition"
                          >
                            <div
                              className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                              onClick={() => setActiveCareModalPlant(item)}
                              title="Tap to preview RHS care guide"
                            >
                              <PlantThumbnailWithModal
                                plantId={item.catalogId}
                                plantName={item.name}
                                photoRef={item.photoRef}
                                size="sm"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {item.photoRef && (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-mono font-bold text-emerald-900">
                                      #{item.photoRef}
                                    </span>
                                  )}
                                  <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                    {item.name}
                                  </span>
                                  <span className="text-xs font-semibold text-emerald-800">
                                    · RHS {item.rhsRating}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5 truncate">
                                  {item.recommendedLocation}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              data-testid={`rhs-catalog-add-${item.catalogId}`}
                              disabled={isAlreadyInPlot}
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
                  </div>
                )}
              </div>

              {/* Add / Edit Custom Plant Form */}
              {isFormOpen && (
                <form
                  onSubmit={handleSavePlant}
                  className="p-4 rounded-2xl bg-stone-50 border border-emerald-300 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                      {editingPlantId ? 'Edit Plant' : 'Add Custom Plant'}
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
                    <div>
                      <label htmlFor="plant-name-input" className="block text-xs font-semibold text-slate-700 mb-1">
                        Plant Name *
                      </label>
                      <input
                        id="plant-name-input"
                        type="text"
                        required
                        value={plantForm.name}
                        onChange={(e) => setPlantForm({ ...plantForm, name: e.target.value })}
                        className="w-full min-h-[38px] px-3 py-1.5 text-sm rounded-xl bg-white border border-stone-300 text-slate-900"
                      />
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
              {displayedGroupedPlotInventory.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-stone-50 border border-stone-200/80 text-xs sm:text-sm text-slate-500">
                  {filterDueThisMonth
                    ? 'No plants match your current "Due This Month" filter.'
                    : `No plants match “${inventoryFilterText}”.`}
                </div>
              ) : (
                <div data-testid="plant-category-groups" className="space-y-3">
                  {displayedGroupedPlotInventory.map((group) => {
                    const isGroupOpen =
                      isSearchingInventory ||
                      filterDueThisMonth ||
                      Boolean(expandedPlantCategories[group.id]);
                    const groupDueCount = group.plants.filter(
                      (p) => plantMonthlyCareMap.get(p.id)?.isDueThisMonth
                    ).length;

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
                              {groupDueCount > 0 && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-900">
                                  {groupDueCount} due this month
                                </span>
                              )}
                              {group.tenderCount > 0 && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-900">
                                  {group.tenderCount} tender
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 truncate pl-6">
                              {group.description}
                            </p>
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
                          <div className="p-3 sm:p-4 bg-white border-t border-stone-200/80 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {group.plants.map((plant: PlantRecord) => {
                              const isTender = TENDER_OR_HALF_HARDY_SET.has(plant.rhsRating);
                              const masterMatch = plantMasterMap.get(plant.id) ?? null;
                              const monthlyCare = plantMonthlyCareMap.get(plant.id);
                              const health = plantHealthMap.get(plant.id);
                              const careLogKey = masterMatch?.catalogId || plant.id;
                              const careLog = plantCareLogs[careLogKey];
                              const hasCareLog = Boolean(
                                careLog &&
                                  (careLog.lastFed ||
                                    careLog.lastPruned ||
                                    careLog.lastProtected ||
                                    (careLog.notes && careLog.notes.trim() !== ''))
                              );

                              return (
                                <div
                                  key={plant.id}
                                  onClick={() => {
                                    if (masterMatch) setActiveCareModalPlant(masterMatch);
                                  }}
                                  className={`p-3.5 sm:p-4 rounded-xl bg-stone-50/70 border border-stone-200/90 hover:border-emerald-600/60 transition ${
                                    masterMatch ? 'cursor-pointer' : ''
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                      <PlantThumbnailWithModal
                                        plantId={plant.id}
                                        plantName={
                                          masterMatch?.photoRef
                                            ? plant.name.replace(/^#\d+\s+/, '')
                                            : plant.name
                                        }
                                        photoRef={masterMatch?.photoRef}
                                        size="md"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          {masterMatch?.photoRef && (
                                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] font-mono font-bold text-emerald-900">
                                              #{masterMatch.photoRef}
                                            </span>
                                          )}
                                          <h4 className="text-sm font-bold text-slate-900">
                                            {masterMatch?.photoRef
                                              ? plant.name.replace(/^#\d+\s+/, '')
                                              : plant.name}
                                          </h4>
                                          {health && (
                                            <button
                                              type="button"
                                              data-testid={`plant-health-indicator-${plant.id}`}
                                              aria-expanded={Boolean(
                                                expandedHealthFactorPlantIds[plant.id]
                                              )}
                                              aria-label={`Health score ${health.score}% ${health.label} for ${plant.name} — tap to view contributing factors`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                togglePlantHealthFactors(plant.id);
                                              }}
                                              title="Click to view contributing health score factors"
                                              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-md border tabular-nums transition cursor-pointer ${
                                                health.status === 'THRIVING'
                                                  ? 'bg-emerald-50/90 hover:bg-emerald-100/90 text-emerald-950 border-emerald-200'
                                                  : health.status === 'WATCH'
                                                  ? 'bg-amber-50/90 hover:bg-amber-100/90 text-amber-950 border-amber-200'
                                                  : 'bg-rose-50/90 hover:bg-rose-100/90 text-rose-950 border-rose-200'
                                              }`}
                                            >
                                              <span
                                                aria-hidden="true"
                                                className={`w-2 h-2 rounded-full shrink-0 ${
                                                  health.status === 'THRIVING'
                                                    ? 'bg-emerald-500'
                                                    : health.status === 'WATCH'
                                                    ? 'bg-amber-500'
                                                    : 'bg-rose-500'
                                                }`}
                                              />
                                              <span>
                                                {health.score}% {health.label}
                                              </span>
                                              {expandedHealthFactorPlantIds[plant.id] ? (
                                                <ChevronUp className="w-3 h-3 opacity-75 shrink-0" />
                                              ) : (
                                                <ChevronDown className="w-3 h-3 opacity-75 shrink-0" />
                                              )}
                                            </button>
                                          )}
                                          <span
                                            className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                              isTender
                                                ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                                : 'bg-white text-slate-700 border border-stone-200'
                                            }`}
                                          >
                                            RHS {plant.rhsRating}
                                          </span>
                                          {monthlyCare?.isDueThisMonth && (
                                            <span
                                              data-testid={`plant-due-badge-${plant.id}`}
                                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                                monthlyCare.pruneDue
                                                  ? 'bg-amber-100/90 text-amber-950 border-amber-300'
                                                  : monthlyCare.feedDue
                                                  ? 'bg-emerald-100/90 text-emerald-950 border-emerald-300'
                                                  : 'bg-sky-100/90 text-sky-950 border-sky-300'
                                              }`}
                                            >
                                              {monthlyCare.badgeLabel}
                                            </span>
                                          )}
                                          {hasCareLog && (
                                            <span
                                              data-testid={`plant-care-logged-badge-${plant.id}`}
                                              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-200/80 text-slate-800"
                                            >
                                              Care Logged ✓
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-xs text-slate-600 mt-1">
                                          {plant.location}
                                        </p>
                                        <p
                                          data-testid={`plant-growth-stage-${plant.id}`}
                                          className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5"
                                        >
                                          <span>
                                            Stage: <strong className="font-medium text-slate-700">{plant.growthStage}</strong>
                                          </span>
                                          {health && health.activeAlertCount > 0 && (
                                            <span className="text-amber-800 font-medium">
                                              · {health.activeAlertCount} weather {health.activeAlertCount === 1 ? 'alert' : 'alerts'} active
                                            </span>
                                          )}
                                        </p>

                                        {/* Expandable Contributing Health Factors Breakdown */}
                                        {health && expandedHealthFactorPlantIds[plant.id] && (
                                          <div
                                            data-testid={`plant-health-factors-${plant.id}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="mt-2 p-2.5 rounded-xl bg-white border border-stone-200/90 shadow-2xs space-y-1.5 text-[11px]"
                                          >
                                            <div className="flex items-center justify-between gap-2 pb-1 border-b border-stone-100">
                                              <span className="font-bold text-slate-800">
                                                Contributing Health Factors ({health.score}%)
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => togglePlantHealthFactors(plant.id)}
                                                aria-label="Hide health score factors"
                                                className="text-slate-400 hover:text-slate-700 font-semibold px-1 cursor-pointer"
                                              >
                                                Hide
                                              </button>
                                            </div>
                                            <ul className="space-y-1.5">
                                              {health.factorItems.map((factor, fIdx) => (
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
                                                        : 'bg-stone-100 text-slate-700'
                                                    }`}
                                                  >
                                                    {factor.impact}
                                                  </span>
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}

                                        {masterMatch && (
                                          <p className="text-[11px] font-semibold text-emerald-800 mt-1.5 inline-flex items-center gap-0.5">
                                            <span>
                                              View Feed ({masterMatch.feedWindowUk}), Prune (
                                              {masterMatch.pruneMonthsUk}) &amp; Care Log
                                            </span>
                                            <ChevronRight className="w-3.5 h-3.5" />
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <div
                                      className="flex items-center gap-1 shrink-0"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => openEditPlantModal(plant)}
                                        aria-label={`Edit ${plant.name}`}
                                        className="min-h-[40px] min-w-[40px] sm:min-h-[36px] sm:min-w-[36px] inline-flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-stone-200/60 active:bg-stone-200 transition cursor-pointer"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeletePlant(plant)}
                                        aria-label={`Delete ${plant.name}`}
                                        className="min-h-[40px] min-w-[40px] sm:min-h-[36px] sm:min-w-[36px] inline-flex items-center justify-center rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition cursor-pointer"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
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
          PLANT CARE MODAL (Mobile Bottom Sheet + Desktop Centered Dialog)
      ===================================================================== */}
      {activeCareModalPlant && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Care details for ${activeCareModalPlant.commonName}`}
          className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
          onClick={() => setActiveCareModalPlant(null)}
        >
          <div
            className="bg-white border-t sm:border border-stone-200 rounded-t-3xl sm:rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile bottom-sheet grab handle */}
            <div className="sm:hidden flex justify-center -mt-1 pb-1">
              <div className="w-10 h-1.5 rounded-full bg-stone-300" />
            </div>

            <div className="flex items-start justify-between gap-3 border-b border-stone-200 pb-3.5">
              <div className="flex items-start gap-3 min-w-0">
                <PlantThumbnailWithModal
                  plantId={activeCareModalPlant.catalogId}
                  plantName={activeCareModalPlant.commonName}
                  photoRef={activeCareModalPlant.photoRef}
                  size="lg"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {activeCareModalPlant.photoRef && (
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-mono font-bold text-emerald-900">
                        #{activeCareModalPlant.photoRef}
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-lg bg-stone-100 text-slate-800 text-xs font-bold">
                      RHS {activeCareModalPlant.rhsRating}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                    {activeCareModalPlant.commonName}
                  </h3>
                  <p className="text-xs sm:text-sm italic text-slate-500">
                    {activeCareModalPlant.botanicalName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveCareModalPlant(null)}
                aria-label="Close care card"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 rounded-xl bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-slate-700 shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm leading-relaxed">
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <strong className="text-slate-900">Soil pH &amp; Sun:</strong>{' '}
                <span className="text-slate-700">{activeCareModalPlant.soilAndSun}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                <strong className="block text-emerald-950">
                  Feeding ({activeCareModalPlant.feedWindowUk}):
                </strong>
                <p className="text-slate-800">{activeCareModalPlant.feedTypeNpk}</p>
                <p className="text-slate-700">{activeCareModalPlant.feedFrequencyDosage}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                <strong className="block text-amber-950">
                  Pruning ({activeCareModalPlant.pruneMonthsUk}):
                </strong>
                <p className="text-slate-800">{activeCareModalPlant.pruneTechnique}</p>
                <p className="text-rose-900 font-medium">
                  Avoid: {activeCareModalPlant.pruneAvoid}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200">
                <strong className="text-sky-950">Overwintering Protocol:</strong>{' '}
                <span className="text-slate-800">{activeCareModalPlant.overwinteringProtocol}</span>
              </div>

              {/* Per-Plant Care Log & Personal Notes (Saved Locally) */}
              <div
                data-testid="plant-care-log-section"
                className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/90 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-slate-900 text-xs sm:text-sm">
                    My Care Log &amp; Personal Notes
                  </strong>
                  <span className="text-[11px] text-slate-500">Saved on this device</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    data-testid="log-fed-today-btn"
                    onClick={() => recordPlantCareAction(activeCareModalPlant.catalogId, 'lastFed')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition cursor-pointer"
                  >
                    + Fed Today
                  </button>
                  <button
                    type="button"
                    data-testid="log-pruned-today-btn"
                    onClick={() =>
                      recordPlantCareAction(activeCareModalPlant.catalogId, 'lastPruned')
                    }
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-700 hover:bg-amber-600 text-white transition cursor-pointer"
                  >
                    + Pruned Today
                  </button>
                  <button
                    type="button"
                    data-testid="log-protected-today-btn"
                    onClick={() =>
                      recordPlantCareAction(activeCareModalPlant.catalogId, 'lastProtected')
                    }
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-800 hover:bg-sky-700 text-white transition cursor-pointer"
                  >
                    + Mulched / Protected Today
                  </button>
                </div>

                {(plantCareLogs[activeCareModalPlant.catalogId]?.lastFed ||
                  plantCareLogs[activeCareModalPlant.catalogId]?.lastPruned ||
                  plantCareLogs[activeCareModalPlant.catalogId]?.lastProtected) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-stone-200">
                    {plantCareLogs[activeCareModalPlant.catalogId]?.lastFed && (
                      <div>
                        <span className="font-semibold text-emerald-900">Last Fed:</span>{' '}
                        {plantCareLogs[activeCareModalPlant.catalogId]?.lastFed}
                      </div>
                    )}
                    {plantCareLogs[activeCareModalPlant.catalogId]?.lastPruned && (
                      <div>
                        <span className="font-semibold text-amber-900">Last Pruned:</span>{' '}
                        {plantCareLogs[activeCareModalPlant.catalogId]?.lastPruned}
                      </div>
                    )}
                    {plantCareLogs[activeCareModalPlant.catalogId]?.lastProtected && (
                      <div>
                        <span className="font-semibold text-sky-900">Protected:</span>{' '}
                        {plantCareLogs[activeCareModalPlant.catalogId]?.lastProtected}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="plant-personal-note-input"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Personal Garden Notes
                  </label>
                  <textarea
                    id="plant-personal-note-input"
                    data-testid="plant-personal-note-input"
                    rows={2}
                    placeholder="e.g. Moved pot to south porch, applied 5cm bark mulch, or spotted new basal shoots..."
                    value={plantCareLogs[activeCareModalPlant.catalogId]?.notes || ''}
                    onChange={(e) =>
                      updatePlantPersonalNote(activeCareModalPlant.catalogId, e.target.value)
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white border border-stone-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-700"
                  />
                </div>
              </div>
            </div>
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

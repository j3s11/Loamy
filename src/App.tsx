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
  HADSTON_GARDEN_COLLECTION_32,
  RhsCatalogPlant
} from './utils/rhsPlantCatalog';
import { HADSTON_MONTH_BY_MONTH_WEEKLY_CALENDAR } from './utils/hadstonMasterGuide';
import { getCurrentUkMonthIndex } from './utils/monthlyClayChecklist';

// Lazy-load secondary workspace panels to reduce initial mobile JS parse time
const SoilSaturationLogPanel = lazy(() => import('./components/SoilSaturationLogPanel'));
const MonthlyClayChecklistPanel = lazy(() => import('./components/MonthlyClayChecklistPanel'));
const HadstonMasterGuidePanel = lazy(() => import('./components/HadstonMasterGuidePanel'));

// Pre-index the 32 master plants once at module load for O(1) lookup per card render
const HADSTON_BY_REF_MAP = new Map<number, RhsCatalogPlant>();
const HADSTON_BY_LOWER_NAME_MAP = new Map<string, RhsCatalogPlant>();
for (const masterPlant of HADSTON_GARDEN_COLLECTION_32) {
  if (typeof masterPlant.photoRef === 'number') {
    HADSTON_BY_REF_MAP.set(masterPlant.photoRef, masterPlant);
  }
  HADSTON_BY_LOWER_NAME_MAP.set(masterPlant.name.toLowerCase(), masterPlant);
  HADSTON_BY_LOWER_NAME_MAP.set(masterPlant.commonName.toLowerCase(), masterPlant);
}

// ============================================================================
// 1. TYPES & UI CONFIGURATION
// ============================================================================

export interface PlantRecord {
  id: string;
  name: string;
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

const UI_CONFIG = {
  STORAGE_KEYS: {
    INVENTORY: 'gws_garden_inventory_v3',
    COMPLETED_TASKS: 'gws_completed_tasks_v3',
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

function formatUkDay(isoDateString?: string | null): string {
  if (!isoDateString) return 'N/A';
  try {
    const date = new Date(isoDateString);
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      timeZone: 'Europe/London'
    }).format(date);
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

  // Clean top-level workspace tab state (directly under title)
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<
    'OVERVIEW' | 'MASTER_GUIDE' | 'CHECKLIST' | 'SOIL_TREND' | 'PLANTS'
  >('OVERVIEW');

  // Sub-view for grouping similar options inside the Calendar & Checklist tab
  const [calendarSubView, setCalendarSubView] = useState<'ALL' | 'CALENDAR' | 'CHECKLISTS'>('ALL');

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

  // Inventory search & care modal state
  const [inventoryFilterText, setInventoryFilterText] = useState<string>('');
  const [activeCareModalPlant, setActiveCareModalPlant] = useState<RhsCatalogPlant | null>(null);

  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(UI_CONFIG.STORAGE_KEYS.COMPLETED_TASKS);
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

  const activeInventoryNameSet = useMemo(
    () => new Set(plantInventory.map((p: PlantRecord) => p.name.toLowerCase())),
    [plantInventory]
  );

  const filteredPlotInventory = useMemo(() => {
    const q = inventoryFilterText.trim().toLowerCase();
    if (!q) return plantInventory;
    return plantInventory.filter(
      (p: PlantRecord) =>
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.rhsRating.toLowerCase().includes(q)
    );
  }, [plantInventory, inventoryFilterText]);

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

    if (editingPlantId) {
      setPlantInventory((prev: PlantRecord[]) =>
        prev.map((item) =>
          item.id === editingPlantId
            ? {
                ...item,
                name: trimmedName,
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
        rhsRating: plantForm.rhsRating,
        location: plantForm.location,
        growthStage: plantForm.growthStage,
        vulnerabilities
      };
      setPlantInventory((prev: PlantRecord[]) => [newPlant, ...prev]);
    }

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

  const handleQuickAddCatalogPlant = useCallback(
    (catalogPlant: CatalogPlantItem) => {
      if (activeInventoryNameSet.has(catalogPlant.name.toLowerCase())) return;

      const newPlant: PlantRecord = {
        id: catalogPlant.photoRef
          ? `hadston-plt-${String(catalogPlant.photoRef).padStart(2, '0')}`
          : `plt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        name: catalogPlant.name,
        rhsRating: catalogPlant.rhsRating,
        location: catalogPlant.recommendedLocation,
        growthStage: catalogPlant.defaultOctGrowthStage,
        vulnerabilities: [...catalogPlant.vulnerabilities]
      };
      setPlantInventory((prev: PlantRecord[]) => [newPlant, ...prev]);
    },
    [activeInventoryNameSet, setPlantInventory]
  );

  const toggleTaskCompleted = (taskTitle: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskTitle]: !prev[taskTitle]
    }));
  };

  // Match an inventory plant to its rich Hadston Master Guide record in O(1) via pre-indexed Maps
  const findMatchingMasterPlant = useCallback((plant: PlantRecord): RhsCatalogPlant | null => {
    const refFromName = plant.name.match(/^#(\d+)\b/);
    if (refFromName) {
      const byRef = HADSTON_BY_REF_MAP.get(Number(refFromName[1]));
      if (byRef) return byRef;
    }

    const refFromId = plant.id.match(/hadston-plt-0*(\d+)/i);
    if (refFromId) {
      const byIdRef = HADSTON_BY_REF_MAP.get(Number(refFromId[1]));
      if (byIdRef) return byIdRef;
    }

    const lowerName = plant.name.toLowerCase();
    const directHit = HADSTON_BY_LOWER_NAME_MAP.get(lowerName);
    if (directHit) return directHit;

    const bySubstring = HADSTON_GARDEN_COLLECTION_32.find(
      (c) =>
        lowerName.includes(c.name.toLowerCase()) ||
        lowerName.includes(c.commonName.toLowerCase())
    );
    return bySubstring || null;
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
          CLEAN STICKY TOP HEADER WITH SAFE-AREA CLEARANCE & TOP TABS
      ===================================================================== */}
      <header className="border-b border-stone-200/90 bg-white sticky top-0 z-30 safe-top-header">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-2 sm:pt-3.5 pb-2.5 space-y-2.5">
          {/* Top Row: Title, Subtitle & Quick Actions */}
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-stone-900 border border-stone-700/80 flex items-center justify-center shrink-0 shadow-2xs">
                  <PixelSunflowerLogo className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h1
                      data-testid="app-brand-title"
                      className="text-base sm:text-2xl font-extrabold tracking-tight text-slate-900 truncate"
                    >
                      Loamy
                    </h1>
                    <span className="text-xs font-medium text-slate-500 hidden sm:inline">
                      Garden &amp; Weather Companion
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (hasConfiguredLocation) {
                        setShowLocationEditor((prev) => !prev);
                      }
                    }}
                    className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] sm:text-xs text-slate-600 text-left hover:text-slate-900 transition cursor-pointer"
                    title="Tap to change garden location or direction"
                  >
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-800 truncate max-w-[135px] sm:max-w-none">
                      <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-700 shrink-0" />
                      <span className="truncate">
                        {hasConfiguredLocation
                          ? gardenProfile.locationName
                          : 'Set your garden location below'}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      {hasConfiguredLocation && (
                        <>
                          <span className="text-emerald-800 font-semibold">
                            RHS {gardenProfile.rhsHardinessZone}
                          </span>
                          <span aria-hidden="true">·</span>
                        </>
                      )}
                      <span className="text-amber-800 font-medium truncate">
                        {currentAspectShortName}
                      </span>
                    </span>
                  </button>
                </div>
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
                    className={`inline-flex items-center justify-center gap-1.5 min-h-[36px] sm:min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      showLocationEditor
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                        : 'bg-stone-100 hover:bg-stone-200 text-slate-800 border-stone-300'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span className="sm:hidden">{showLocationEditor ? 'Done' : 'Location'}</span>
                    <span className="hidden sm:inline">
                      {showLocationEditor ? 'Hide Location' : 'Location & Direction'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportGardenReportToCsv(plantInventory, advice, gardenProfile)}
                    className="hidden md:inline-flex items-center justify-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-medium bg-white hover:bg-stone-50 text-slate-700 border border-stone-300 transition cursor-pointer"
                    title="Export Inventory, Alerts & Tasks to CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => runGardenAnalysis(true)}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-1.5 min-h-[36px] sm:min-h-[38px] px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-800 hover:bg-emerald-700 disabled:bg-emerald-800/60 text-white shadow-2xs transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="sm:hidden">{isLoading ? '...' : 'Refresh'}</span>
                    <span className="hidden sm:inline">
                      {isLoading ? 'Refreshing...' : 'Refresh Weather'}
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Primary Top Navigation Tabs Directly Under the Title */}
          {hasConfiguredLocation && (
            <nav
              id="workspace-tabs-anchor"
              data-testid="workspace-tabs"
              aria-label="Garden dashboard sections"
              className="pt-1.5 border-t border-stone-100"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full">
                <button
                  type="button"
                  data-testid="tab-overview"
                  onClick={() => setActiveWorkspaceTab('OVERVIEW')}
                  className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                    activeWorkspaceTab === 'OVERVIEW' || activeWorkspaceTab === 'SOIL_TREND'
                      ? 'bg-emerald-800 text-white shadow-2xs'
                      : 'text-slate-700 bg-stone-50 hover:bg-stone-100 border border-stone-200/80'
                  }`}
                >
                  <Thermometer className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">Weather &amp; Soil</span>
                </button>

                <button
                  type="button"
                  data-testid="tab-master-guide"
                  onClick={() => setActiveWorkspaceTab('MASTER_GUIDE')}
                  className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                    activeWorkspaceTab === 'MASTER_GUIDE'
                      ? 'bg-emerald-800 text-white shadow-2xs'
                      : 'text-slate-700 bg-stone-50 hover:bg-stone-100 border border-stone-200/80'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">Master Guide</span>
                </button>

                <button
                  type="button"
                  data-testid="tab-checklist"
                  onClick={() => setActiveWorkspaceTab('CHECKLIST')}
                  className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                    activeWorkspaceTab === 'CHECKLIST'
                      ? 'bg-emerald-800 text-white shadow-2xs'
                      : 'text-slate-700 bg-stone-50 hover:bg-stone-100 border border-stone-200/80'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">Calendar &amp; Checklist</span>
                </button>

                <button
                  type="button"
                  data-testid="tab-plants"
                  onClick={() => setActiveWorkspaceTab('PLANTS')}
                  className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                    activeWorkspaceTab === 'PLANTS'
                      ? 'bg-emerald-800 text-white shadow-2xs'
                      : 'text-slate-700 bg-stone-50 hover:bg-stone-100 border border-stone-200/80'
                  }`}
                >
                  <Sprout className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">My Plants ({plantInventory.length})</span>
                </button>
              </div>
              <span data-testid="microclimate-note" className="sr-only">
                {advice?.soilAndMicroclimateNote}
              </span>
            </nav>
          )}
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
                GARDEN LOCATION & DIRECTION BAR
                Collapsed by default on mobile once location is remembered so weather cards
                appear immediately; expands when 'Location' is tapped in header.
            =================================================================== */}
            {(activeWorkspaceTab === 'OVERVIEW' ||
              activeWorkspaceTab === 'SOIL_TREND' ||
              showLocationEditor) && (
              <section
                data-testid="garden-location-aspect-bar"
                className={`${
                  showLocationEditor ? 'block' : 'hidden md:block'
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

                      {/* Partial Location Suggestions Dropdown (Full Form Row Width) */}
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

                  {/* Garden Direction Selector (What direction does your garden face?) */}
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

                {showLocationEditor && (
                  <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
                    <p data-testid="aspect-advice-summary">
                      <strong className="text-slate-900">{currentAspectShortName} Microclimate:</strong>{' '}
                      {currentAspectOption.summary}
                    </p>
                    <p className="text-slate-500">
                      <strong className="text-slate-700">Soil:</strong> {currentSoilProfileText}
                    </p>
                  </div>
                )}
              </section>
            )}

        {/* ===================================================================
            TAB 1: WEATHER & SOIL (Grouped Weather Forecast, Alerts & Soil Trend)
        =================================================================== */}
        {(activeWorkspaceTab === 'OVERVIEW' || activeWorkspaceTab === 'SOIL_TREND') && (
          <div className="space-y-4 sm:space-y-6">
            {/* Sub-options Switcher Inside Weather & Soil Tab */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-stone-200/90 rounded-2xl p-2 sm:p-3 shadow-xs">
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveWorkspaceTab('OVERVIEW')}
                  className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                    activeWorkspaceTab === 'OVERVIEW'
                      ? 'bg-emerald-800 text-white'
                      : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                  }`}
                >
                  <Thermometer className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate sm:hidden">Weather &amp; Outlook</span>
                  <span className="hidden sm:inline">Current Weather, 7-Day Outlook &amp; Alerts</span>
                </button>

                <button
                  type="button"
                  data-testid="tab-soil-trend"
                  onClick={() => setActiveWorkspaceTab('SOIL_TREND')}
                  className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                    activeWorkspaceTab === 'SOIL_TREND'
                      ? 'bg-emerald-800 text-white'
                      : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate sm:hidden">Soil &amp; 30-Day Trend</span>
                  <span className="hidden sm:inline">Soil Moisture &amp; 30-Day Trend</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-1 sm:pt-0 border-t border-stone-100 sm:border-t-0 text-xs text-slate-600">
                <span
                  data-testid="weather-last-updated"
                  className="inline-flex items-center gap-1.5 font-medium text-emerald-900 bg-emerald-50/80 border border-emerald-200/80 px-2.5 py-1 rounded-lg tabular-nums"
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Last updated: {weatherLastUpdatedLabel}</span>
                </span>
                <span className="hidden lg:inline text-slate-400">·</span>
                <span className="hidden lg:inline text-slate-500">ukv_2km + Open-Meteo</span>
              </div>
            </div>

            {activeWorkspaceTab === 'SOIL_TREND' ? (
              <Suspense
                fallback={
                  <div className="bg-white border border-stone-200/90 rounded-2xl p-6 text-center text-sm text-slate-500 animate-pulse">
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
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {/* 3 Clean Weather Cards (°C, mph, mm) */}
                <section
                  data-testid="primary-weather-metrics"
                  aria-label="Current weather conditions in UK units"
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                >
                  {/* Card 1: Current Temperature (°C) */}
                  <div
                    data-testid="metric-temperature-card"
                    className={`p-5 rounded-2xl border shadow-xs ${
                      hazardSummary.frostRiskDetected
                        ? 'bg-sky-50/70 border-sky-300'
                        : 'bg-white border-stone-200/90'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Temperature (°C)
                      </span>
                      <Thermometer
                        className={`w-5 h-5 ${
                          hazardSummary.frostRiskDetected ? 'text-sky-700' : 'text-emerald-700'
                        }`}
                      />
                    </div>

                    <div className="mt-2 flex items-baseline justify-between gap-2 tabular-nums">
                      <span
                        data-testid="current-temperature-value"
                        className="text-3xl font-bold text-slate-900"
                      >
                        {currentTempC.toFixed(1)}°C
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        High {todayMaxTempC.toFixed(1)}°C · 7d Low {lowest7DayTempC.toFixed(1)}°C
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-600">
                      {hazardSummary.frostRiskDetected
                        ? `Frost alert: overnight low reaches ${lowest7DayTempC.toFixed(1)}°C`
                        : 'Above ground-frost threshold'}
                    </p>
                  </div>

                  {/* Card 2: Wind Speed (mph) */}
                  <div
                    data-testid="metric-wind-card"
                    className={`p-5 rounded-2xl border shadow-xs ${
                      hazardSummary.windRockRiskDetected
                        ? 'bg-amber-50/70 border-amber-300'
                        : 'bg-white border-stone-200/90'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Wind Speed (mph)
                      </span>
                      <Wind
                        className={`w-5 h-5 ${
                          hazardSummary.windRockRiskDetected ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      />
                    </div>

                    <div className="mt-2 flex items-baseline justify-between gap-2 tabular-nums">
                      <span
                        data-testid="current-wind-mph-value"
                        className="text-3xl font-bold text-slate-900"
                      >
                        {currentWindSpeedMph.toFixed(1)} mph
                      </span>
                      <span className="text-xs font-semibold text-amber-800">
                        Gust {peakWindGustMph.toFixed(1)} mph
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-600">
                      {hazardSummary.windRockRiskDetected
                        ? `Wind-rock risk: gusts exceed ${UI_CONFIG.WIND_ROCK_THRESHOLD_MPH} mph`
                        : `Calm — below ${UI_CONFIG.WIND_ROCK_THRESHOLD_MPH} mph wind-rock limit`}
                    </p>
                  </div>

                  {/* Card 3: Rainfall (mm) */}
                  <div
                    data-testid="metric-rainfall-card"
                    className={`p-5 rounded-2xl border shadow-xs ${
                      hazardSummary.waterloggingRiskDetected
                        ? 'bg-blue-50/70 border-blue-300'
                        : 'bg-white border-stone-200/90'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Rainfall (mm)
                      </span>
                      <Droplets
                        className={`w-5 h-5 ${
                          hazardSummary.waterloggingRiskDetected ? 'text-blue-700' : 'text-sky-700'
                        }`}
                      />
                    </div>

                    <div className="mt-2 flex items-baseline justify-between gap-2 tabular-nums">
                      <span
                        data-testid="current-rainfall-mm-value"
                        className="text-3xl font-bold text-slate-900"
                      >
                        {todayRainfallMm.toFixed(1)} mm
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        48h Total: {cumulative48hRainfallMm.toFixed(1)} mm
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-600">
                      {hazardSummary.waterloggingRiskDetected
                        ? `Heavy clay waterlogging risk (>= ${UI_CONFIG.HEAVY_RAIN_48H_MM} mm)`
                        : 'Normal clay drainage load'}
                    </p>
                  </div>
                </section>

                {/* Full-Width 7-Day Outlook Strip */}
                <section className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 min-w-0 max-w-full">
                        <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span className="truncate break-words">
                          7-Day Outlook — {gardenProfile.locationName}
                        </span>
                      </h2>
                      <span
                        data-testid="forecast-last-updated"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-stone-50 border border-stone-200/90 px-2 py-0.5 rounded-md tabular-nums"
                      >
                        <Clock className="w-3 h-3 text-emerald-700 shrink-0" />
                        <span>Last updated: {weatherLastUpdatedLabel}</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 min-w-0">
                      <span className="inline-flex items-center gap-1.5 truncate">
                        <span className="w-2 h-2 rounded-full bg-sky-600 shrink-0" />
                        <span className="truncate">Frost (&le; {UI_CONFIG.FROST_THRESHOLD_C}°C)</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 truncate">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        <span className="truncate">High Wind (&ge; {UI_CONFIG.WIND_ROCK_THRESHOLD_MPH} mph)</span>
                      </span>
                    </div>
                  </div>

                  {dailyForecast.length === 0 ? (
                    <div className="py-6 text-center text-sm text-slate-500">
                      {isLoading ? 'Loading 7-day forecast...' : 'No forecast data loaded.'}
                    </div>
                  ) : (
                    <div
                      data-testid="seven-day-forecast-strip"
                      className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 overflow-hidden"
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

                        return (
                          <div
                            key={day.date || idx}
                            className={`min-w-0 overflow-hidden break-words rounded-xl p-3.5 border flex flex-col justify-between gap-2.5 ${
                              isFrost
                                ? 'bg-sky-50/75 border-sky-300'
                                : isHighWind
                                ? 'bg-amber-50/75 border-amber-300'
                                : 'bg-stone-50/80 border-stone-200/90'
                            }`}
                          >
                            <div className="space-y-1.5 min-w-0 overflow-hidden break-words">
                              <div className="flex items-center justify-between gap-1 min-w-0 overflow-hidden">
                                <span
                                  title={formattedDayLabel}
                                  className="block w-full text-xs font-bold text-slate-900 truncate break-words"
                                >
                                  {formattedDayLabel}
                                </span>
                              </div>

                              <div className="min-w-0 overflow-hidden">
                                {isFrost ? (
                                  <span className="inline-block max-w-full truncate break-words text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-700 text-white">
                                    Frost
                                  </span>
                                ) : isHighWind ? (
                                  <span className="inline-block max-w-full truncate break-words text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-600 text-white">
                                    High Wind
                                  </span>
                                ) : (
                                  <span className="inline-block max-w-full truncate break-words text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                                    Normal
                                  </span>
                                )}
                              </div>

                              <div className="pt-1 tabular-nums min-w-0 overflow-hidden break-words">
                                <div className="text-lg font-bold text-slate-900 leading-tight truncate break-words">
                                  {day.maxTempC !== null && day.maxTempC !== undefined
                                    ? `${day.maxTempC}°C`
                                    : '--'}
                                </div>
                                <div className="text-xs font-medium text-slate-600 mt-0.5 truncate break-words">
                                  Low:{' '}
                                  {day.minTempC !== null && day.minTempC !== undefined
                                    ? `${day.minTempC}°C`
                                    : '--'}
                                </div>
                              </div>
                            </div>

                            <div className="pt-2.5 border-t border-stone-200/80 space-y-1.5 text-xs text-slate-600 tabular-nums min-w-0 overflow-hidden break-words">
                              <div className="flex items-center justify-between gap-1.5 min-w-0 overflow-hidden">
                                <span className="text-slate-500 shrink-0 truncate">Wind</span>
                                <span
                                  title={dayGustMph !== null ? `${dayGustMph} mph` : '--'}
                                  className={`truncate break-words text-right ${
                                    isHighWind ? 'font-bold text-amber-900' : 'font-semibold text-slate-800'
                                  }`}
                                >
                                  {dayGustMph !== null ? `${dayGustMph} mph` : '--'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-1.5 min-w-0 overflow-hidden">
                                <span className="text-slate-500 shrink-0 truncate">Rain</span>
                                <span
                                  title={
                                    day.precipSumMm !== undefined && day.precipSumMm !== null
                                      ? `${day.precipSumMm} mm`
                                      : '--'
                                  }
                                  className="font-semibold text-slate-800 truncate break-words text-right"
                                >
                                  {day.precipSumMm !== undefined && day.precipSumMm !== null
                                    ? `${day.precipSumMm} mm`
                                    : '--'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Daily Rainfall Forecast Bar Chart (Recharts) directly below 7-Day Outlook Strip */}
                <SevenDayRainfallRecharts
                  dailyForecast={dailyForecast}
                  locationName={gardenProfile.locationName}
                  formatDayFn={formatUkDay}
                  lastUpdatedLabel={weatherLastUpdatedLabel}
                />

                {/* Plant-Specific Weather Alerts */}
                <section className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                        <span>Weather Alerts for Your Plants ({weatherAlerts.length})</span>
                      </h2>
                      <span
                        data-testid="alerts-last-updated"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-stone-50 border border-stone-200/90 px-2 py-0.5 rounded-md tabular-nums"
                      >
                        <Clock className="w-3 h-3 text-emerald-700 shrink-0" />
                        <span>Last updated: {alertsLastUpdatedLabel}</span>
                      </span>
                    </div>
                    {activeWarnings.length > 0 && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">
                        Met Office {activeWarnings[0].level} Warning
                      </span>
                    )}
                  </div>

                  {weatherAlerts.length === 0 ? (
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-950 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                      <span>
                        No severe weather hazards flagged for your plants over the next 7 days.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {weatherAlerts.map((alert: any, idx: number) => {
                        const style =
                          UI_CONFIG.SEVERITY_STYLES[alert.severity] || UI_CONFIG.SEVERITY_STYLES.INFO;

                        return (
                          <div
                            key={idx}
                            className={`rounded-xl border ${style.border} ${style.bg} p-4 space-y-2.5`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md uppercase ${style.badge}`}>
                                  {alert.severity}
                                </span>
                                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900">
                                  {alert.hazardType.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <span className="text-xs font-medium text-slate-600">
                                {alert.forecastWindow}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {(alert.affectedPlants || []).slice(0, 8).map((plantName: string, pIdx: number) => (
                                <span
                                  key={pIdx}
                                  className="text-xs font-medium bg-white text-slate-800 px-2.5 py-0.5 rounded-md border border-stone-300"
                                >
                                  {plantName}
                                </span>
                              ))}
                              {(alert.affectedPlants || []).length > 8 && (
                                <span className="text-xs font-medium text-slate-600 px-1.5 py-0.5">
                                  +{alert.affectedPlants.length - 8} more
                                </span>
                              )}
                            </div>

                            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                              <strong className="font-semibold text-slate-900">Recommended Action: </strong>
                              {alert.actionRequired}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            )}
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
            TAB 3: CALENDAR & CHECKLIST (Weekly Focus, 12-Month Schedule & Checklists)
        =================================================================== */}
        {activeWorkspaceTab === 'CHECKLIST' && (
          <div className="space-y-6">
            {/* Sub-Options Switcher Inside Calendar & Checklist Tab */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-stone-200/90 rounded-2xl p-3 shadow-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'ALL', label: 'All Calendar & Checklists' },
                  { id: 'CALENDAR', label: '12-Month & Weekly Schedule' },
                  { id: 'CHECKLISTS', label: 'Seasonal & Clay Checklists' }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setCalendarSubView(mode.id as 'ALL' | 'CALENDAR' | 'CHECKLISTS')}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                      calendarSubView === mode.id
                        ? 'bg-emerald-800 text-white'
                        : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <span className="text-xs font-medium text-slate-500">
                Calibrated for {gardenProfile.locationName} (RHS {gardenProfile.rhsHardinessZone || 'H4–H5'})
              </span>
            </div>

            {/* 1. 12-Month & Weekly Task Calendar (Weeks 1–2 and Weeks 3–4) */}
            {(calendarSubView === 'ALL' || calendarSubView === 'CALENDAR') && (
              <section className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      {currentMonthGuide.monthName} Schedule ·{' '}
                      {selectedCalendarMonthIdx === currentUkMonthIdx
                        ? `Current Focus: ${isSecondHalfOfMonth ? 'Weeks 3–4' : 'Weeks 1–2'}`
                        : 'Monthly View'}
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                      Month-by-Month &amp; Weekly Task Calendar
                    </h2>
                  </div>

                  {selectedCalendarMonthIdx !== currentUkMonthIdx && (
                    <button
                      type="button"
                      onClick={() => setSelectedCalendarMonthIdx(currentUkMonthIdx)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                    >
                      Jump to Current Month
                    </button>
                  )}
                </div>

                {/* 12-Month Selector Pills */}
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
                  {HADSTON_MONTH_BY_MONTH_WEEKLY_CALENDAR.map((m, idx) => {
                    const isSelected = idx === selectedCalendarMonthIdx;
                    const isCurrentMonth = idx === currentUkMonthIdx;
                    return (
                      <button
                        key={m.monthName}
                        type="button"
                        onClick={() => setSelectedCalendarMonthIdx(idx)}
                        className={`min-h-[36px] px-2 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
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

                {/* Weeks 1–2 and Weeks 3–4 Side-by-Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Weeks 1–2 */}
                  <div
                    className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${
                      selectedCalendarMonthIdx === currentUkMonthIdx && !isSecondHalfOfMonth
                        ? 'bg-emerald-50/40 border-emerald-300'
                        : 'bg-stone-50/70 border-stone-200/90'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        {currentMonthGuide.monthName} — Weeks 1–2
                      </h3>
                      {selectedCalendarMonthIdx === currentUkMonthIdx && !isSecondHalfOfMonth && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-800 text-white">
                          Active Now
                        </span>
                      )}
                    </div>

                    <div className="space-y-2.5 text-xs sm:text-sm leading-relaxed">
                      <div className="p-3 rounded-xl bg-white border border-stone-200/80">
                        <span className="block text-xs font-bold uppercase tracking-wider text-sky-800 mb-0.5">
                          1. Watering &amp; Soil Care
                        </span>
                        <p className="text-slate-800">{currentMonthGuide.week1To2.wateringAndSoilCare}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-stone-200/80">
                        <span className="block text-xs font-bold uppercase tracking-wider text-emerald-800 mb-0.5">
                          2. Feeding &amp; Mulching
                        </span>
                        <p className="text-slate-800">{currentMonthGuide.week1To2.feedingAndMulching}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-stone-200/80">
                        <span className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-0.5">
                          3. Pruning &amp; Deadheading
                        </span>
                        <p className="text-slate-800">{currentMonthGuide.week1To2.pruningAndDeadheading}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-stone-200/80">
                        <span className="block text-xs font-bold uppercase tracking-wider text-rose-800 mb-0.5">
                          4. Frost &amp; Pest Protection
                        </span>
                        <p className="text-slate-800">{currentMonthGuide.week1To2.pestDiseaseAndFrost}</p>
                      </div>
                    </div>
                  </div>

                  {/* Weeks 3–4 */}
                  <div
                    className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${
                      selectedCalendarMonthIdx === currentUkMonthIdx && isSecondHalfOfMonth
                        ? 'bg-emerald-50/40 border-emerald-300'
                        : 'bg-stone-50/70 border-stone-200/90'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        {currentMonthGuide.monthName} — Weeks 3–4
                      </h3>
                      {selectedCalendarMonthIdx === currentUkMonthIdx && isSecondHalfOfMonth && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-800 text-white">
                          Active Now
                        </span>
                      )}
                    </div>

                    <div className="space-y-2.5 text-xs sm:text-sm leading-relaxed">
                      <div className="p-3 rounded-xl bg-white border border-stone-200/80">
                        <span className="block text-xs font-bold uppercase tracking-wider text-sky-800 mb-0.5">
                          1. Watering &amp; Soil Care
                        </span>
                        <p className="text-slate-800">{currentMonthGuide.week3To4.wateringAndSoilCare}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-stone-200/80">
                        <span className="block text-xs font-bold uppercase tracking-wider text-emerald-800 mb-0.5">
                          2. Feeding &amp; Mulching
                        </span>
                        <p className="text-slate-800">{currentMonthGuide.week3To4.feedingAndMulching}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-stone-200/80">
                        <span className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-0.5">
                          3. Pruning &amp; Deadheading
                        </span>
                        <p className="text-slate-800">{currentMonthGuide.week3To4.pruningAndDeadheading}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-stone-200/80">
                        <span className="block text-xs font-bold uppercase tracking-wider text-rose-800 mb-0.5">
                          4. Frost &amp; Pest Protection
                        </span>
                        <p className="text-slate-800">{currentMonthGuide.week3To4.pestDiseaseAndFrost}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 2. Priority Seasonal Tasks & Monthly Clay Checklist */}
            {(calendarSubView === 'ALL' || calendarSubView === 'CHECKLISTS') && (
              <div className="space-y-6">
                <section className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                        <span>Priority Seasonal Tasks ({seasonalTasks.length})</span>
                      </h2>
                      <span
                        data-testid="tasks-last-updated"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-stone-50 border border-stone-200/90 px-2 py-0.5 rounded-md tabular-nums"
                      >
                        <Clock className="w-3 h-3 text-emerald-700 shrink-0" />
                        <span>Last updated: {alertsLastUpdatedLabel}</span>
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">Click to check off</span>
                  </div>

                  <div className="space-y-2.5">
                    {seasonalTasks.map((task: any, idx: number) => {
                      const isDone = Boolean(completedTasks[task.taskTitle]);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleTaskCompleted(task.taskTitle)}
                          className={`p-4 rounded-xl border transition cursor-pointer flex items-start gap-3.5 ${
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
                              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                            ) : (
                              <Circle className="w-5 h-5 text-stone-400 hover:text-emerald-700" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3
                                className={`text-sm sm:text-base font-bold ${
                                  isDone ? 'line-through text-slate-400' : 'text-slate-900'
                                }`}
                              >
                                {task.taskTitle}
                              </h3>
                              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                                {task.category.replace(/_/g, ' ')}
                              </span>
                            </div>

                            <p className="mt-1.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                              {task.instructions}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <Suspense
                  fallback={
                    <div className="bg-white border border-stone-200/90 rounded-2xl p-6 text-center text-sm text-slate-500 animate-pulse">
                      Loading monthly clay checklist...
                    </div>
                  }
                >
                  <MonthlyClayChecklistPanel />
                </Suspense>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            TAB 4: MY PLANTS (32 Garden Plants, RHS Catalogue Search & Care Cards)
        =================================================================== */}
        {activeWorkspaceTab === 'PLANTS' && (
          <div className="space-y-6">
            <section className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 pb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    My Garden Plants ({plantInventory.length})
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Click any plant card below to open its specialized Feeding, Pruning &amp; Winter Care guide.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    data-testid="inventory-load-hadston-32"
                    onClick={handleLoadAllHadston32Plants}
                    className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition cursor-pointer"
                    title="Load all 32 garden plants (#1–#32)"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Load All 32 Plants</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetInventory}
                    aria-label="Reset plant inventory"
                    className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 border border-stone-300 transition cursor-pointer"
                    title="Reset to default 32 garden plants"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={openAddPlantModal}
                    className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Custom Plant</span>
                  </button>
                </div>
              </div>

              {/* RHS Plant Catalogue Search-to-Add & Filter Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                <div className="lg:col-span-7 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <label htmlFor="plant-catalog-search" className="sr-only">
                      Search RHS plant catalogue to add
                    </label>
                    <input
                      id="plant-catalog-search"
                      type="text"
                      placeholder="Search RHS catalogue to add plants (e.g. Salvia, Rose, Garlic)..."
                      value={catalogSearchQuery}
                      onFocus={() => setIsCatalogOpen(true)}
                      onChange={(e) => {
                        setCatalogSearchQuery(e.target.value);
                        setIsCatalogOpen(true);
                      }}
                      className="w-full min-h-[40px] pl-9 pr-8 py-1.5 text-xs sm:text-sm rounded-xl bg-stone-50 border border-stone-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-700"
                    />
                    {(catalogSearchQuery || isCatalogOpen) && (
                      <button
                        type="button"
                        aria-label="Clear plant search"
                        onClick={() => {
                          setCatalogSearchQuery('');
                          setIsCatalogOpen(false);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCatalogOpen((prev) => !prev)}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-slate-800 border border-stone-300 transition whitespace-nowrap cursor-pointer"
                  >
                    {isCatalogOpen ? 'Hide Catalogue' : 'Browse Catalogue (46)'}
                  </button>
                </div>

                <div className="lg:col-span-5">
                  <input
                    type="text"
                    value={inventoryFilterText}
                    onChange={(e) => setInventoryFilterText(e.target.value)}
                    placeholder={`Filter your ${plantInventory.length} active plants...`}
                    className="w-full min-h-[40px] px-3.5 py-1.5 text-xs sm:text-sm rounded-xl bg-stone-50 border border-stone-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-700"
                  />
                </div>
              </div>

              {(isCatalogOpen || catalogSearchQuery.trim() !== '') && (
                <div
                  data-testid="rhs-plant-search-results"
                  className="p-4 rounded-2xl bg-stone-50 border border-emerald-300 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {[
                        { id: 'ALL', label: 'All (46)' },
                        { id: 'HADSTON_32', label: 'My 32 Plants' },
                        { id: 'SHRUB_TREE', label: 'Shrubs & Trees' },
                        { id: 'ORNAMENTAL', label: 'Perennials' },
                        { id: 'EDIBLE_ALLOTMENT', label: 'Edibles' }
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
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
                    <span className="text-xs text-slate-500">
                      {matchingCatalogPlants.length} matches
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                    {matchingCatalogPlants.map((item) => {
                      const isAlreadyInPlot = activeInventoryNameSet.has(item.name.toLowerCase());
                      return (
                        <div
                          key={item.catalogId}
                          className="p-3 rounded-xl bg-white border border-stone-200 flex items-center justify-between gap-2.5"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
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
                            disabled={isAlreadyInPlot}
                            onClick={() => handleQuickAddCatalogPlant(item)}
                            className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer ${
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

              {/* Spacious 2-Column Plant Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredPlotInventory.map((plant: PlantRecord) => {
                  const isTender = ['H1a', 'H1b', 'H1c', 'H2', 'H3', 'H4'].includes(plant.rhsRating);
                  const masterMatch = findMatchingMasterPlant(plant);

                  return (
                    <div
                      key={plant.id}
                      onClick={() => {
                        if (masterMatch) setActiveCareModalPlant(masterMatch);
                      }}
                      className={`p-4 rounded-xl bg-stone-50/70 border border-stone-200/90 hover:border-emerald-600/60 transition ${
                        masterMatch ? 'cursor-pointer' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <PlantThumbnailWithModal
                            plantId={plant.id}
                            plantName={masterMatch?.photoRef ? plant.name.replace(/^#\d+\s+/, '') : plant.name}
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
                              <h3 className="text-sm font-bold text-slate-900">
                                {masterMatch?.photoRef
                                  ? plant.name.replace(/^#\d+\s+/, '')
                                  : plant.name}
                              </h3>
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                  isTender
                                    ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                    : 'bg-white text-slate-700 border border-stone-200'
                                }`}
                              >
                                RHS {plant.rhsRating}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">
                              {plant.location}
                            </p>
                            {masterMatch && (
                              <p className="text-[11px] font-semibold text-emerald-800 mt-1.5 inline-flex items-center gap-0.5">
                                <span>View Feed ({masterMatch.feedWindowUk}) &amp; Prune ({masterMatch.pruneMonthsUk})</span>
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
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-mono font-bold text-emerald-900">
                      #{activeCareModalPlant.photoRef}
                    </span>
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
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MOBILE THUMB-ZONE BOTTOM NAVIGATION BAR
          Provides one-handed tab switching on mobile screens when scrolled down
      ===================================================================== */}
      {hasConfiguredLocation && (
        <nav
          aria-label="Mobile quick navigation"
          className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 px-2 pt-1.5 safe-bottom-nav shadow-lg"
        >
          <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => {
                setActiveWorkspaceTab('OVERVIEW');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`min-h-[46px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold transition cursor-pointer ${
                activeWorkspaceTab === 'OVERVIEW' || activeWorkspaceTab === 'SOIL_TREND'
                  ? 'text-emerald-800 bg-emerald-50/90'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Thermometer className="w-4 h-4 shrink-0" />
              <span className="truncate">Weather</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveWorkspaceTab('MASTER_GUIDE');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`min-h-[46px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold transition cursor-pointer ${
                activeWorkspaceTab === 'MASTER_GUIDE'
                  ? 'text-emerald-800 bg-emerald-50/90'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span className="truncate">Guide</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveWorkspaceTab('CHECKLIST');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`min-h-[46px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold transition cursor-pointer ${
                activeWorkspaceTab === 'CHECKLIST'
                  ? 'text-emerald-800 bg-emerald-50/90'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span className="truncate">Calendar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveWorkspaceTab('PLANTS');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`min-h-[46px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold transition cursor-pointer ${
                activeWorkspaceTab === 'PLANTS'
                  ? 'text-emerald-800 bg-emerald-50/90'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sprout className="w-4 h-4 shrink-0" />
              <span className="truncate">Plants ({plantInventory.length})</span>
            </button>
          </div>
        </nav>
      )}

      <OfflineIndicator />
    </div>
  );
}

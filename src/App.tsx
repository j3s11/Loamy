/**
 * Loamy — Clean, Mobile-Friendly UK Garden & Weather Companion
 * Prompts the user for their garden location on first use, then displays
 * Current Temperature (°C), Wind Speed (mph), Rainfall (mm),
 * South-Facing Garden controls, Pl@ntNet + RHS plant finder & custom plot inventory,
 * and the 5-Section Master Horticulturist Guide.
 */

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense, lazy } from 'react';
import { PixelSunflowerLogo } from './components/PixelSunflowerLogo';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallButton';
import {
  Thermometer,
  AlertTriangle,
  Sprout,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  Download,
  MapPin,
  Calendar,
  Search,
  X,
  Compass,
  BookOpen,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Clock,
  Upload
} from 'lucide-react';
import {
  useGardenAdvisor,
  ADVISOR_CONFIG,
  resolveGardenLocationProfile,
  getGardenLocationSuggestions,
  convertGeocodeResultToSuggestion,
  saveGardenProfileToStorage,
  loadSavedGardenProfileFromStorage,
  formatUkDateTime
} from './gardenAdvisorService';
import PlantThumbnailWithModal from './components/PlantThumbnailWithModal';
import WeatherForecastSection from './components/WeatherForecastSection';
import PlantNetSearchPanel from './components/PlantNetSearchPanel';
import PlantFormModal from './components/PlantFormModal';
import PlantsBackupModal from './components/PlantsBackupModal';
import {
  CatalogPlantItem,
  RhsCatalogPlant,
  resolvePlantGroupCategory,
  groupPlantInventoryByCategory,
  getPlantMonthlyCareStatus,
  PlantMonthlyCareStatus,
  calculatePlantHealthScore,
  PlantHealthAssessment,
  registerLiveRhsPlant,
  CATEGORY_SEARCH_LABEL_BY_ID,
  matchRhsCatalogPlant
} from './utils/rhsPlantCatalog';
import { registerLivePlantImage } from './utils/plantImages';
import { getCurrentUkMonthIndex } from './utils/monthlyClayChecklist';
import { serializeGardenPlantsBackup } from './utils/plantBackupUtils';
import {
  UI_CONFIG,
  resolveWindMph,
  exportGardenReportToCsv,
  PlantRecord,
  GardenProfile,
  PlantCareLogEntry
} from './constants/gardenConfig';

export type { PlantRecord, GardenProfile, PlantCareLogEntry };

// Lazy-load secondary workspace panels to reduce initial mobile JS parse time
const MonthlyClayChecklistPanel = lazy(() => import('./components/MonthlyClayChecklistPanel'));
const HadstonMasterGuidePanel = lazy(() => import('./components/HadstonMasterGuidePanel'));

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

  // Plant Inventory Add/Edit modal state & Backup modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<PlantRecord | null>(null);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [backupStatusNotice, setBackupStatusNotice] = useState('');

  // Register any saved live RHS plant photos from plantInventory on mount or change
  useEffect(() => {
    for (const p of plantInventory) {
      if (p.photoUrl) {
        registerLivePlantImage(p);
      }
    }
  }, [plantInventory]);

  const activeInventoryMatchSets = useMemo(() => {
    const ids = new Set<string>();
    const botanicalNames = new Set<string>();
    const commonNamesWithoutBotanical = new Set<string>();
    for (const p of plantInventory) {
      if (p.id) ids.add(p.id.toLowerCase());
      const botanical = p.botanicalName?.trim().toLowerCase();
      if (botanical) {
        botanicalNames.add(botanical);
      } else {
        const lower = p.name.trim().toLowerCase();
        if (lower) {
          commonNamesWithoutBotanical.add(lower);
          commonNamesWithoutBotanical.add(lower.replace(/^#\d+\s+/, ''));
        }
      }
    }
    return { ids, botanicalNames, commonNamesWithoutBotanical };
  }, [plantInventory]);

  const isCatalogPlantInPlot = useCallback(
    (item: CatalogPlantItem) => {
      if (activeInventoryMatchSets.ids.has(item.catalogId.toLowerCase())) {
        return true;
      }
      const itemBotanical = item.botanicalName?.trim().toLowerCase();
      if (itemBotanical) {
        if (activeInventoryMatchSets.botanicalNames.has(itemBotanical)) {
          return true;
        }
        const lowerName = item.name.trim().toLowerCase();
        const lowerCommon = item.commonName?.trim().toLowerCase();
        return (
          activeInventoryMatchSets.commonNamesWithoutBotanical.has(lowerName) ||
          Boolean(lowerCommon && activeInventoryMatchSets.commonNamesWithoutBotanical.has(lowerCommon))
        );
      }
      const lowerName = item.name.trim().toLowerCase();
      const lowerCommon = item.commonName?.trim().toLowerCase();
      return (
        activeInventoryMatchSets.commonNamesWithoutBotanical.has(lowerName) ||
        Boolean(lowerCommon && activeInventoryMatchSets.commonNamesWithoutBotanical.has(lowerCommon))
      );
    },
    [activeInventoryMatchSets]
  );

  const filteredPlotInventory = useMemo(() => {
    const q = inventoryFilterText.trim().toLowerCase();
    if (!q) return plantInventory;
    return plantInventory.filter((p: PlantRecord) => {
      const catId = resolvePlantGroupCategory(p);
      const catLabel = CATEGORY_SEARCH_LABEL_BY_ID.get(catId) || '';
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

  const openAddPlantModal = useCallback(() => {
    setEditingPlant(null);
    setIsFormOpen(true);
  }, []);

  const openEditPlantModal = useCallback((plant: PlantRecord) => {
    setEditingPlant(plant);
    setIsFormOpen(true);
  }, []);

  const handleClosePlantForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingPlant(null);
  }, []);

  const handleSavePlantForm = useCallback(
    (savedRecord: PlantRecord, isEdit: boolean, chosenCategory: string) => {
      if (isEdit) {
        setPlantInventory((prev: PlantRecord[]) =>
          prev.map((item) => (item.id === savedRecord.id ? savedRecord : item))
        );
      } else {
        setPlantInventory((prev: PlantRecord[]) => [savedRecord, ...prev]);
      }
      setExpandedPlantCategories((prev) => ({ ...prev, [chosenCategory]: true }));
      setIsFormOpen(false);
      setEditingPlant(null);
    },
    [setPlantInventory]
  );

  const handleDeletePlant = useCallback(
    (plant: PlantRecord) => {
      setPlantInventory((prev: PlantRecord[]) => prev.filter((item) => item.id !== plant.id));
    },
    [setPlantInventory]
  );

  const handleResetInventory = useCallback(() => {
    setPlantInventory([]);
  }, [setPlantInventory]);

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
  }, [plantInventory, gardenProfile?.locationName]);

  const handleExportCsv = useCallback(() => {
    exportGardenReportToCsv(plantInventory, advice, gardenProfile);
  }, [plantInventory, advice, gardenProfile]);

  const handleOpenBackupModal = useCallback(() => {
    setIsBackupModalOpen(true);
  }, []);

  const handleCloseBackupModal = useCallback(() => {
    setIsBackupModalOpen(false);
  }, []);

  const handleImportBackupConfirmed = useCallback(
    ({
      nextPlants,
      importedCategories,
      statusMessage
    }: {
      nextPlants: PlantRecord[];
      importedCategories: string[];
      statusMessage: string;
    }) => {
      setPlantInventory(nextPlants);
      setExpandedPlantCategories((prev) => {
        const next = { ...prev };
        for (const cat of importedCategories) {
          next[cat] = true;
        }
        return next;
      });
      setBackupStatusNotice(statusMessage);
      setIsBackupModalOpen(false);
    },
    [setPlantInventory]
  );

  const handleQuickAddCatalogPlant = useCallback(
    (catalogPlant: CatalogPlantItem) => {
      if (isCatalogPlantInPlot(catalogPlant)) {
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
    [isCatalogPlantInPlot, setPlantInventory]
  );

  const handleAddAllMatchingCatalogPlants = useCallback(
    (plantsToAdd: RhsCatalogPlant[]) => {
      const toAdd = plantsToAdd.filter((item) => !isCatalogPlantInPlot(item));
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
    },
    [isCatalogPlantInPlot, setPlantInventory]
  );

  const toggleTaskCompleted = useCallback((taskTitle: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskTitle]: !prev[taskTitle]
    }));
  }, []);

  const handleClearFocusedPlant = useCallback(() => {
    setFocusedMasterGuidePlantId(null);
  }, []);

  const handleEditFromGuide = useCallback(
    (plant: any) => {
      setActiveWorkspaceTab('PLANTS');
      openEditPlantModal(plant as PlantRecord);
    },
    [openEditPlantModal]
  );

  // Precompute master catalog match once per plant in inventory using shared matcher
  const plantMasterMap = useMemo(() => {
    const map = new Map<string, RhsCatalogPlant | null>();
    for (const p of plantInventory) {
      map.set(p.id, matchRhsCatalogPlant(p, { synthesizePersisted: true }));
    }
    return map;
  }, [plantInventory]);

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
                weather forecast (°C, mph, mm), frost alerts, and seasonal care schedule for the
                plants in your garden.
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
                      className="w-full min-h-[44px] pl-10 pr-9 py-2 text-base sm:text-sm rounded-xl bg-stone-50 border border-stone-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-700"
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
                        className="px-2.5 py-1 text-base sm:text-xs font-medium rounded-lg bg-stone-50 border border-stone-300 text-slate-800 focus:outline-none focus:border-emerald-700"
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
                        className="w-full min-h-[40px] pl-9 pr-8 py-1.5 text-base sm:text-sm rounded-xl bg-stone-50 border border-stone-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-700"
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
          <WeatherForecastSection
            activeWorkspaceTab={activeWorkspaceTab}
            setActiveWorkspaceTab={setActiveWorkspaceTab}
            gardenProfile={gardenProfile}
            weatherData={weatherData}
            isLoading={isLoading}
            hazardSummary={hazardSummary}
            dailyForecast={dailyForecast}
            activeWarnings={activeWarnings}
            weatherAlerts={weatherAlerts}
            plantInventory={plantInventory}
            weatherLastUpdatedLabel={weatherLastUpdatedLabel}
            alertsLastUpdatedLabel={alertsLastUpdatedLabel}
            currentTempC={currentTempC}
            lowest7DayTempC={lowest7DayTempC}
            soilTemp6cmC={soilTemp6cmC}
            currentWindSpeedMph={currentWindSpeedMph}
            peakWindGustMph={peakWindGustMph}
            todayRainfallMm={todayRainfallMm}
            cumulative48hRainfallMm={cumulative48hRainfallMm}
            showWeatherDetails={showWeatherDetails}
            setShowWeatherDetails={setShowWeatherDetails}
            expandedForecastDayIdx={expandedForecastDayIdx}
            setExpandedForecastDayIdx={setExpandedForecastDayIdx}
            expandedAlertIndices={expandedAlertIndices}
            setExpandedAlertIndices={setExpandedAlertIndices}
            showRainfallChart={showRainfallChart}
            setShowRainfallChart={setShowRainfallChart}
            showSoilTrendDrawer={showSoilTrendDrawer}
            setShowSoilTrendDrawer={setShowSoilTrendDrawer}
            protectedAlertPlants={protectedAlertPlants}
            setProtectedAlertPlants={setProtectedAlertPlants}
            onToggleProtectedAlertPlant={toggleProtectedAlertPlant}
          />
        )}

        {/* ===================================================================
            TAB 2: MASTER GUIDE (5-Section Botanical Playbook)
        =================================================================== */}
        {activeWorkspaceTab === 'MASTER_GUIDE' && (
          <Suspense
            fallback={
              <div className="bg-white border border-stone-200/90 rounded-2xl p-6 text-center text-sm text-slate-500 animate-pulse">
                Loading Master Horticulturist Guide &amp; Plant Care Matrix...
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
              onClearFocusedPlant={handleClearFocusedPlant}
              locationName={gardenProfile.locationName}
              rhsHardinessZone={gardenProfile.rhsHardinessZone}
              onAddSingleCatalogPlant={handleQuickAddCatalogPlant}
              onEditGardenPlant={handleEditFromGuide}
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
                      className="min-h-[38px] px-3 py-1.5 text-base sm:text-sm rounded-xl bg-stone-50 border border-stone-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-700 w-full sm:w-52"
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
              <PlantNetSearchPanel
                isCatalogOpen={isCatalogOpen}
                setIsCatalogOpen={setIsCatalogOpen}
                showPlantManagerDrawer={showPlantManagerDrawer}
                plantCount={plantInventory.length}
                isCatalogPlantInPlot={isCatalogPlantInPlot}
                onQuickAddPlant={handleQuickAddCatalogPlant}
                onAddAllMatchingPlants={handleAddAllMatchingCatalogPlants}
                onOpenAddCustomPlant={openAddPlantModal}
                onClearAllPlants={handleResetInventory}
                onExportBackup={handleExportPlantsBackup}
                onOpenBackupModal={handleOpenBackupModal}
                onExportCsv={handleExportCsv}
              />

              {/* Add / Edit Custom Plant Form (with Live Pl@ntNet + RHS Auto-Fill Lookup) */}
              <PlantFormModal
                isOpen={isFormOpen}
                editingPlant={editingPlant}
                isSouthFacing={Boolean(gardenProfile?.isSouthFacing)}
                onClose={handleClosePlantForm}
                onSavePlant={handleSavePlantForm}
              />

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
      <PlantsBackupModal
        isOpen={isBackupModalOpen}
        plantInventory={plantInventory}
        locationName={gardenProfile?.locationName}
        onClose={handleCloseBackupModal}
        onExportBackup={handleExportPlantsBackup}
        onImportConfirmed={handleImportBackupConfirmed}
      />

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

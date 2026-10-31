/**
 * Northumberland Garden & Weather Sentinel - Main Dashboard UI (App.jsx)
 * Target Environment: React 18+ / Google AI Studio Build Mode / Vite + Tailwind CSS
 * Dependencies: npm install lucide-react @google/genai
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  CloudRain,
  Wind,
  ThermometerSnowflake,
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
  X
} from 'lucide-react';
import { useGardenAdvisor, ADVISOR_CONFIG } from './gardenAdvisorService';

// ============================================================================
// 1. EDITABLE UI CONFIGURATION & CONSTANTS BLOCK
// ============================================================================
const UI_CONFIG = {
  STORAGE_KEYS: {
    INVENTORY: 'ngws_plant_inventory_v1',
    COMPLETED_TASKS: 'ngws_completed_tasks_v1'
  },
  AUTO_RUN_ON_MOUNT: true,
  FROST_THRESHOLD_C: 2.0,
  AIR_FROST_THRESHOLD_C: 0.0,
  WIND_ROCK_THRESHOLD_KMH: 40.0,
  HEAVY_RAIN_48H_MM: 30.0,

  RHS_RATINGS: [
    { code: 'H1a', label: 'H1a (> 15°C - Heated Glasshouse)' },
    { code: 'H1b', label: 'H1b (10°C to 15°C - Subtropical)' },
    { code: 'H1c', label: 'H1c (5°C to 10°C - Frost-Free)' },
    { code: 'H2', label: 'H2 (1°C to 5°C - Tender / Cold Glass)' },
    { code: 'H3', label: 'H3 (-5°C to 1°C - Half-Hardy)' },
    { code: 'H4', label: 'H4 (-10°C to -5°C - Morpeth Baseline)' },
    { code: 'H5', label: 'H5 (-15°C to -10°C - Hardy)' },
    { code: 'H6', label: 'H6 (-20°C to -15°C - Very Hardy)' },
    { code: 'H7', label: 'H7 (< -20°C - Extremely Hardy)' }
  ],

  LOCATION_PRESETS: [
    'South-Facing Mixed Border (Heavy Clay)',
    'North-Facing Shaded Border (Heavy Clay)',
    'Open Allotment Bed (Exposed)',
    'Raised Bed (Compost / Loam Mix)',
    'Terracotta Patio Pot',
    'Sheltered Courtyard Pot',
    'Unheated Greenhouse',
    'Cold Frame / Cloche',
    'Sheltered Lawn Corner'
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
      border: 'border-red-600',
      bg: 'bg-red-950/40',
      badge: 'bg-red-600 text-white',
      text: 'text-red-200',
      iconColor: 'text-red-400'
    },
    WARNING: {
      border: 'border-amber-500',
      bg: 'bg-amber-950/40',
      badge: 'bg-amber-500 text-slate-950 font-bold',
      text: 'text-amber-200',
      iconColor: 'text-amber-400'
    },
    INFO: {
      border: 'border-sky-500',
      bg: 'bg-sky-950/40',
      badge: 'bg-sky-600 text-white',
      text: 'text-sky-200',
      iconColor: 'text-sky-400'
    }
  }
};

// ============================================================================
// 2. HELPER FUNCTIONS (UK FORMATTING & CSV EXPORT)
// ============================================================================

function formatUkDay(isoDateString) {
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

function exportGardenReportToCsv(plantInventory, advice) {
  try {
    const rows = [
      ['Section', 'Item / Plant Name', 'Category / RHS Rating', 'Location / Window', 'Details / Action Required']
    ];

    plantInventory.forEach((p) => {
      rows.push([
        'INVENTORY',
        p.name,
        p.rhsRating,
        p.location,
        `Stage: ${p.growthStage} | Vulnerabilities: ${(p.vulnerabilities || []).join('; ')}`
      ]);
    });

    (advice?.weatherAlerts || []).forEach((a) => {
      rows.push([
        `ALERT_${a.severity}`,
        (a.affectedPlants || []).join('; '),
        a.hazardType,
        a.forecastWindow,
        a.actionRequired
      ]);
    });

    (advice?.seasonalTasks || []).forEach((t) => {
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
    link.setAttribute('download', `northumberland-garden-report-${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('[GardenDashboard] CSV Export failed:', err);
  }
}

// ============================================================================
// 3. MAIN DASHBOARD COMPONENT
// ============================================================================

export default function App() {
  const initialSavedInventory = useMemo(() => {
    try {
      const saved = localStorage.getItem(UI_CONFIG.STORAGE_KEYS.INVENTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (err) {
      console.warn('[GardenDashboard] Failed to read inventory from localStorage:', err);
    }
    return ADVISOR_CONFIG.DEFAULT_PLANT_INVENTORY;
  }, []);

  const {
    plantInventory,
    setPlantInventory,
    gardenProfile,
    weatherData,
    advice,
    isLoading,
    error,
    runGardenAnalysis
  } = useGardenAdvisor(initialSavedInventory, ADVISOR_CONFIG.DEFAULT_GARDEN_PROFILE);

  const [completedTasks, setCompletedTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(UI_CONFIG.STORAGE_KEYS.COMPLETED_TASKS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlantId, setEditingPlantId] = useState(null);
  const [plantForm, setPlantForm] = useState({
    name: '',
    rhsRating: 'H4',
    location: UI_CONFIG.LOCATION_PRESETS[0],
    growthStage: UI_CONFIG.GROWTH_STAGE_PRESETS[2],
    vulnerabilitiesText: ''
  });

  useEffect(() => {
    try {
      localStorage.setItem(UI_CONFIG.STORAGE_KEYS.INVENTORY, JSON.stringify(plantInventory));
    } catch (err) {
      console.error('[GardenDashboard] Failed to save inventory to localStorage:', err);
    }
  }, [plantInventory]);

  useEffect(() => {
    try {
      localStorage.setItem(UI_CONFIG.STORAGE_KEYS.COMPLETED_TASKS, JSON.stringify(completedTasks));
    } catch (err) {
      console.error('[GardenDashboard] Failed to save task status:', err);
    }
  }, [completedTasks]);

  useEffect(() => {
    if (UI_CONFIG.AUTO_RUN_ON_MOUNT) {
      runGardenAnalysis(false);
    }
  }, [runGardenAnalysis]);

  const openAddPlantModal = () => {
    setEditingPlantId(null);
    setPlantForm({
      name: '',
      rhsRating: 'H4',
      location: UI_CONFIG.LOCATION_PRESETS[0],
      growthStage: UI_CONFIG.GROWTH_STAGE_PRESETS[2],
      vulnerabilitiesText: ''
    });
    setIsFormOpen(true);
  };

  const openEditPlantModal = (plant) => {
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

  const handleSavePlant = (e) => {
    e.preventDefault();
    const trimmedName = plantForm.name.trim();
    if (!trimmedName) return;

    const vulnerabilities = plantForm.vulnerabilitiesText
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    if (editingPlantId) {
      setPlantInventory((prev) =>
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
      const newPlant = {
        id: `plt-${Date.now()}`,
        name: trimmedName,
        rhsRating: plantForm.rhsRating,
        location: plantForm.location,
        growthStage: plantForm.growthStage,
        vulnerabilities
      };
      setPlantInventory((prev) => [...prev, newPlant]);
    }

    setIsFormOpen(false);
    setEditingPlantId(null);
  };

  const handleDeletePlant = (plant) => {
    const confirmed = window.confirm(
      `Remove "${plant.name}" from your garden inventory? This action will remove it from future weather alert checks.`
    );
    if (!confirmed) return;
    setPlantInventory((prev) => prev.filter((item) => item.id !== plant.id));
  };

  const handleResetInventory = () => {
    const confirmed = window.confirm(
      'Reset plant inventory back to the default Morpeth starter plants? Any custom plants will be overwritten.'
    );
    if (!confirmed) return;
    setPlantInventory(ADVISOR_CONFIG.DEFAULT_PLANT_INVENTORY);
  };

  const toggleTaskCompleted = (taskTitle) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskTitle]: !prev[taskTitle]
    }));
  };

  const activeWarnings = weatherData?.severeWarnings?.activeWarnings || [];
  const hazardSummary = weatherData?.hazardSummary || {};
  const dailyForecast = weatherData?.dailyForecast || [];
  const weatherAlerts = advice?.weatherAlerts || [];
  const seasonalTasks = advice?.seasonalTasks || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Sprout className="w-7 h-7 text-emerald-400 shrink-0" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Northumberland Garden &amp; Weather Sentinel
              </h1>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-200 px-2.5 py-0.5 rounded-full border border-slate-700">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                {gardenProfile.locationName} (55.16°N)
              </span>
              <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-2.5 py-0.5 rounded-full font-medium">
                RHS Zone {gardenProfile.rhsHardinessZone}
              </span>
              <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700">
                Heavy Clay / Alluvial Loam (pH 6.0–6.8)
              </span>
              {weatherData?.dataSourceMode && (
                <span className="bg-sky-950/80 text-sky-300 border border-sky-700/60 px-2.5 py-0.5 rounded-full">
                  Feed: {weatherData.dataSourceMode === 'MET_OFFICE_DATAHUB_PROXY' ? 'Met Office DataHub' : 'UKMO 2km Direct'}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center">
            <button
              onClick={() => exportGardenReportToCsv(plantInventory, advice)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Export Inventory, Alerts & Tasks to CSV"
            >
              <Download className="w-4 h-4 text-slate-400" />
              Export CSV
            </button>

            <button
              onClick={() => runGardenAnalysis(true)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/60 text-white shadow-sm transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Analysing Forecast...' : 'Sync & Analyse Garden'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        {error && (
          <div className="bg-red-950/70 border border-red-600 rounded-xl p-4 flex items-start gap-3 text-red-200">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-100">Horticultural Engine Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {activeWarnings.length > 0 && (
          <section className="space-y-2">
            {activeWarnings.map((warn, idx) => (
              <div
                key={warn.id || idx}
                className="bg-amber-950/70 border-2 border-amber-500 rounded-xl p-4 flex items-start gap-3.5"
              >
                <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-bold uppercase rounded bg-amber-500 text-slate-950">
                      Met Office {warn.level} Warning
                    </span>
                    <h2 className="text-sm font-bold text-amber-100">{warn.headline}</h2>
                  </div>
                  {warn.description && (
                    <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">{warn.description}</p>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className={`p-4 rounded-xl border ${
              hazardSummary.frostRiskDetected
                ? 'bg-sky-950/50 border-sky-500/80'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                7-Day Minimum Temp
              </span>
              <ThermometerSnowflake
                className={`w-5 h-5 ${
                  hazardSummary.frostRiskDetected ? 'text-sky-400' : 'text-slate-500'
                }`}
              />
            </div>
            <p className="mt-2 text-2xl font-bold text-white">
              {hazardSummary.lowestForecastTempC !== undefined && hazardSummary.lowestForecastTempC < 90
                ? `${hazardSummary.lowestForecastTempC}°C`
                : '--'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {hazardSummary.frostRiskDetected
                ? 'Frost pocket risk active (<= 2.0°C)'
                : 'Above ground-frost threshold'}
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border ${
              hazardSummary.windRockRiskDetected
                ? 'bg-amber-950/50 border-amber-500/80'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Peak Wind Gust
              </span>
              <Wind
                className={`w-5 h-5 ${
                  hazardSummary.windRockRiskDetected ? 'text-amber-400' : 'text-slate-500'
                }`}
              />
            </div>
            <p className="mt-2 text-2xl font-bold text-white">
              {hazardSummary.maxForecastGustKmh !== undefined
                ? `${hazardSummary.maxForecastGustKmh} km/h`
                : '--'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {hazardSummary.windRockRiskDetected
                ? 'Wind-rock threshold breached (>= 40 km/h)'
                : 'Below wind-rock threshold'}
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border ${
              hazardSummary.waterloggingRiskDetected
                ? 'bg-blue-950/50 border-blue-500/80'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                48h Cumulative Rain
              </span>
              <Droplets
                className={`w-5 h-5 ${
                  hazardSummary.waterloggingRiskDetected ? 'text-blue-400' : 'text-slate-500'
                }`}
              />
            </div>
            <p className="mt-2 text-2xl font-bold text-white">
              {hazardSummary.cumulativePrecip48hMm !== undefined
                ? `${hazardSummary.cumulativePrecip48hMm} mm`
                : '--'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {hazardSummary.waterloggingRiskDetected
                ? 'Heavy clay waterlogging risk (>= 30 mm)'
                : 'Normal drainage load'}
            </p>
          </div>

          <div className="p-4 rounded-xl border bg-slate-900 border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                Soil &amp; Wansbeck Pocket
              </span>
              <Sprout className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed line-clamp-3">
              {advice?.soilAndMicroclimateNote ||
                'Click "Sync & Analyse Garden" to evaluate heavy clay workability and frost pocket drainage.'}
            </p>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              7-Day Met Office Forecast Ribbon
            </h2>
            {weatherData?.fetchedAt && (
              <span className="text-xs text-slate-400">
                Updated: {new Date(weatherData.fetchedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {dailyForecast.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              {isLoading ? 'Loading 7-day Met Office forecast...' : 'No forecast data loaded yet.'}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {dailyForecast.slice(0, 7).map((day, idx) => {
                const isFrost = day.minTempC !== null && day.minTempC <= UI_CONFIG.FROST_THRESHOLD_C;
                const isAirFrost = day.minTempC !== null && day.minTempC <= UI_CONFIG.AIR_FROST_THRESHOLD_C;
                const isHighWind =
                  day.peakWindGustKmh !== null && day.peakWindGustKmh >= UI_CONFIG.WIND_ROCK_THRESHOLD_KMH;

                return (
                  <div
                    key={day.date || idx}
                    className={`rounded-xl p-3.5 border flex flex-col justify-between transition ${
                      isAirFrost
                        ? 'bg-sky-950/60 border-sky-500'
                        : isFrost
                        ? 'bg-sky-950/30 border-sky-700/70'
                        : isHighWind
                        ? 'bg-amber-950/30 border-amber-700/70'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{formatUkDay(day.date)}</span>
                        {isFrost && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isAirFrost ? 'bg-sky-500 text-slate-950' : 'bg-sky-900 text-sky-200'
                            }`}
                          >
                            {isAirFrost ? 'AIR FROST' : 'GROUND FROST'}
                          </span>
                        )}
                      </div>

                      {day.dayWeatherDescription && day.dayWeatherDescription !== 'N/A' && (
                        <p className="text-[11px] text-slate-400 mt-1 truncate" title={day.dayWeatherDescription}>
                          {day.dayWeatherDescription}
                        </p>
                      )}

                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-lg font-bold text-white">
                          {day.maxTempC !== null ? `${day.maxTempC}°` : '--'}
                        </span>
                        <span
                          className={`text-sm font-semibold ${
                            isFrost ? 'text-sky-300' : 'text-slate-400'
                          }`}
                        >
                          / {day.minTempC !== null ? `${day.minTempC}°C` : '--'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          <Wind className="w-3 h-3" /> Gust
                        </span>
                        <span className={isHighWind ? 'text-amber-300 font-bold' : ''}>
                          {day.peakWindGustKmh !== null ? `${day.peakWindGustKmh} km/h` : '--'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          <CloudRain className="w-3 h-3" /> Rain
                        </span>
                        <span>
                          {day.precipSumMm !== undefined
                            ? `${day.precipSumMm} mm`
                            : day.dayPrecipProbPercent !== null && day.dayPrecipProbPercent !== undefined
                            ? `${day.dayPrecipProbPercent}% prob`
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  Plant-Specific Weather Alerts ({weatherAlerts.length})
                </h2>
              </div>

              {isLoading && weatherAlerts.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-sm text-slate-400 animate-pulse">
                  Cross-referencing your {plantInventory.length} plants against the 7-day Met Office forecast...
                </div>
              ) : weatherAlerts.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-sm text-slate-300 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    No immediate weather hazards flagged for your current plant inventory over the next 7 days.
                  </span>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {weatherAlerts.map((alert, idx) => {
                    const style =
                      UI_CONFIG.SEVERITY_STYLES[alert.severity] || UI_CONFIG.SEVERITY_STYLES.INFO;

                    return (
                      <div
                        key={idx}
                        className={`rounded-xl border-l-4 border ${style.border} ${style.bg} p-4 shadow-sm`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2.5 py-0.5 rounded uppercase ${style.badge}`}>
                              {alert.severity}
                            </span>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                              {alert.hazardType.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-700">
                            Window: {alert.forecastWindow}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {(alert.affectedPlants || []).map((plantName, pIdx) => (
                            <span
                              key={pIdx}
                              className="text-xs font-semibold bg-slate-900/90 text-white px-2.5 py-1 rounded-md border border-slate-700"
                            >
                              {plantName}
                            </span>
                          ))}
                        </div>

                        <p className="mt-3 text-sm text-slate-100 leading-relaxed">
                          <strong className="font-semibold text-white">Action Required: </strong>
                          {alert.actionRequired}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  North East England Seasonal Tasks ({seasonalTasks.length})
                </h2>
                <span className="text-xs text-slate-400">Adjusted 2–3 wks behind Southern UK</span>
              </div>

              {seasonalTasks.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-sm text-slate-400">
                  Run garden analysis to generate seasonal tasks for your inventory.
                </div>
              ) : (
                <div className="space-y-3">
                  {seasonalTasks.map((task, idx) => {
                    const isDone = Boolean(completedTasks[task.taskTitle]);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleTaskCompleted(task.taskTitle)}
                        className={`p-4 rounded-xl border transition cursor-pointer flex items-start gap-3.5 ${
                          isDone
                            ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <button
                          type="button"
                          className="mt-0.5 text-emerald-400 shrink-0 focus:outline-none"
                          aria-label={`Mark ${task.taskTitle} as complete`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-500 hover:text-emerald-400" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3
                              className={`text-sm font-bold ${
                                isDone ? 'line-through text-slate-400' : 'text-white'
                              }`}
                            >
                              {task.taskTitle}
                            </h3>
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                              {task.category.replace(/_/g, ' ')}
                            </span>
                          </div>

                          {(task.targetPlants || []).length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {task.targetPlants.map((tp, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded"
                                >
                                  {tp}
                                </span>
                              ))}
                            </div>
                          )}

                          <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                            {task.instructions}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Garden Plant Inventory ({plantInventory.length})
                  </h2>
                  <p className="text-xs text-slate-400">
                    Stored in browser &amp; evaluated against Met Office feeds
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetInventory}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                    title="Reset to default Morpeth starter inventory"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={openAddPlantModal}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition"
                  >
                    <Plus className="w-4 h-4" />
                    Add Plant
                  </button>
                </div>
              </div>

              {isFormOpen && (
                <form
                  onSubmit={handleSavePlant}
                  className="mb-5 p-4 rounded-xl bg-slate-950 border border-emerald-700/70 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      {editingPlantId ? 'Edit Plant Record' : 'Add New Plant to Plot'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Plant Name &amp; Cultivar *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Dahlia 'Bishop of Llandaff'"
                      value={plantForm.name}
                      onChange={(e) => setPlantForm({ ...plantForm, name: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        RHS Hardiness Rating
                      </label>
                      <select
                        value={plantForm.rhsRating}
                        onChange={(e) => setPlantForm({ ...plantForm, rhsRating: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                      >
                        {UI_CONFIG.RHS_RATINGS.map((r) => (
                          <option key={r.code} value={r.code}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Current Growth Stage
                      </label>
                      <select
                        value={plantForm.growthStage}
                        onChange={(e) => setPlantForm({ ...plantForm, growthStage: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                      >
                        {UI_CONFIG.GROWTH_STAGE_PRESETS.map((stage) => (
                          <option key={stage} value={stage}>
                            {stage}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Planting Location / Container
                    </label>
                    <input
                      type="text"
                      list="location-presets"
                      value={plantForm.location}
                      onChange={(e) => setPlantForm({ ...plantForm, location: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                    />
                    <datalist id="location-presets">
                      {UI_CONFIG.LOCATION_PRESETS.map((loc) => (
                        <option key={loc} value={loc} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Known Vulnerabilities (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Wind-rock in wet clay, Early autumn frost, Slugs"
                      value={plantForm.vulnerabilitiesText}
                      onChange={(e) =>
                        setPlantForm({ ...plantForm, vulnerabilitiesText: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500"
                    >
                      {editingPlantId ? 'Save Changes' : 'Add to Inventory'}
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
                {plantInventory.map((plant) => {
                  const isTender = ['H1a', 'H1b', 'H1c', 'H2', 'H3'].includes(plant.rhsRating);

                  return (
                    <div
                      key={plant.id}
                      className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-white">{plant.name}</h3>
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                isTender
                                  ? 'bg-amber-950 text-amber-300 border border-amber-700/70'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              }`}
                            >
                              RHS {plant.rhsRating}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            <strong className="text-slate-300">Location:</strong> {plant.location}
                          </p>
                          <p className="text-xs text-slate-400">
                            <strong className="text-slate-300">Stage:</strong> {plant.growthStage}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEditPlantModal(plant)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Edit plant"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePlant(plant)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                            title="Delete plant"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {Array.isArray(plant.vulnerabilities) && plant.vulnerabilities.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {plant.vulnerabilities.map((vuln, vIdx) => (
                            <span
                              key={vIdx}
                              className="text-[11px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800"
                            >
                              {vuln}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

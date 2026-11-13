import { GARDEN_PROFILE_STORAGE_KEY } from '../gardenAdvisorService';
import type { PlantGroupCategoryId } from '../utils/rhsPlantCatalog';
import { setBoundedMap } from '../utils/ttlCache';

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

export const UI_CONFIG = {
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

const UK_DAY_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  timeZone: 'Europe/London'
});
const UK_DAY_FORMAT_CACHE = new Map<string, string>();

export function formatUkDay(isoDateString?: string | null): string {
  if (!isoDateString) return 'N/A';
  const cached = UK_DAY_FORMAT_CACHE.get(isoDateString);
  if (cached) return cached;
  try {
    const date = new Date(isoDateString);
    const formatted = UK_DAY_FORMATTER.format(date);
    setBoundedMap(UK_DAY_FORMAT_CACHE, isoDateString, formatted, 200);
    return formatted;
  } catch {
    return isoDateString;
  }
}

export function resolveWindMph(mphVal?: number | null, kmhVal?: number | null): number | null {
  if (mphVal !== undefined && mphVal !== null && !Number.isNaN(Number(mphVal))) {
    return Number(Number(mphVal).toFixed(1));
  }
  if (kmhVal !== undefined && kmhVal !== null && !Number.isNaN(Number(kmhVal))) {
    return Number((Number(kmhVal) * 0.621371).toFixed(1));
  }
  return null;
}

export function exportGardenReportToCsv(
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

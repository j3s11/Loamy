/**
 * Historical Rainfall & Soil Saturation Database Schema & Persistence Engine
 * Tailored for UK & Temperate Gardens (RHS Zones H3–H6, Clay & Loam Soils)
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export interface HistoricalSoilRainfallLog {
  id: string;
  recordedAt: string;           // ISO timestamp
  locationKey?: string;         // Normalized garden location key (e.g., 'york', 'manchester', 'custom:hexham')
  locationName?: string;        // Active garden location (e.g., 'York, North Yorkshire, UK')
  locationZone: string;         // e.g., 'South-Facing Mixed Border (Heavy Clay)'
  rainfall24hMm: number;        // 24h cumulative rainfall (mm)
  rainfall48hMm: number;        // 48h cumulative rainfall (mm)
  soilSaturationPct: number;    // 0 - 100% volumetric clay pore saturation
  soilTemp6cmC: number;         // Soil temperature at 6cm depth (°C)
  drainageState: 'FREE_DRAINING' | 'FIELD_CAPACITY' | 'NEAR_SATURATION' | 'WATERLOGGED_CLAY';
  waterloggingHazard: boolean;  // True when 48h rain >= 30mm or saturation >= 85%
  frostPocketActive: boolean;   // True when overnight min temp <= 2.0°C
  notes: string;
  source: 'MANUAL_OBSERVATION' | 'UKMO_2KM_AUTO_SYNC' | 'MET_OFFICE_DATAHUB_SYNC' | 'FORECAST_SYNC';
}

export interface SoilLogLocationQuery {
  locationId?: string;
  locationName?: string;
  latitude?: number | null;
  longitude?: number | null;
  soilProfile?: string;
  gardenAspect?: string;
  rhsHardinessZone?: string;
}

export interface SoilLocationCalibrationSummary {
  locationKey: string;
  locationName: string;
  soilProfile: string;
  gardenAspect: string;
  rhsHardinessZone: string;
  baselineClayRetentionPct: number;
  rainfallMultiplier: number;
  soilTempOffsetC: number;
  hydrologyNote: string;
}

/**
 * Explicit SQL DDL Schema accommodating historical logs for rainfall and soil saturation levels
 */
export const SOIL_RAINFALL_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS historical_rainfall_soil_logs (
  id TEXT PRIMARY KEY,
  recorded_at TEXT NOT NULL,
  location_key TEXT NOT NULL DEFAULT 'default',
  location_name TEXT NOT NULL DEFAULT '',
  location_zone TEXT NOT NULL DEFAULT 'South-Facing Mixed Border (Heavy Clay)',
  rainfall_24h_mm REAL NOT NULL CHECK (rainfall_24h_mm >= 0),
  rainfall_48h_mm REAL NOT NULL CHECK (rainfall_48h_mm >= 0),
  soil_saturation_pct REAL NOT NULL CHECK (soil_saturation_pct >= 0 AND soil_saturation_pct <= 100),
  soil_temp_6cm_c REAL NOT NULL,
  drainage_state TEXT NOT NULL CHECK (drainage_state IN ('FREE_DRAINING', 'FIELD_CAPACITY', 'NEAR_SATURATION', 'WATERLOGGED_CLAY')),
  waterlogging_hazard INTEGER NOT NULL DEFAULT 0,
  frost_pocket_active INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'MANUAL_OBSERVATION'
);
CREATE INDEX IF NOT EXISTS idx_soil_logs_recorded_at ON historical_rainfall_soil_logs(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_soil_logs_location_key ON historical_rainfall_soil_logs(location_key);
`;

/**
 * Pure calculation: estimates heavy clay soil saturation (%) from 48h cumulative rainfall (mm)
 * and optional volumetric moisture (m³/m³ from UKMO 3-9cm layer).
 */
export function calculateClaySoilSaturation({
  rainfall24hMm,
  rainfall48hMm,
  volumetricMoisture = null,
  baselineClayRetentionPct = 62
}: {
  rainfall24hMm: number;
  rainfall48hMm: number;
  volumetricMoisture?: number | null;
  baselineClayRetentionPct?: number;
}): {
  soilSaturationPct: number;
  drainageState: HistoricalSoilRainfallLog['drainageState'];
  waterloggingHazard: boolean;
} {
  const clean24 = Math.max(0, Number(rainfall24hMm) || 0);
  const clean48 = Math.max(clean24, Number(rainfall48hMm) || 0);

  let computedPct: number;
  if (typeof volumetricMoisture === 'number' && !Number.isNaN(volumetricMoisture) && volumetricMoisture > 0) {
    // Heavy clay saturation porosity typically ~0.48 m³/m³
    const fromVolumetric = (volumetricMoisture / 0.48) * 100;
    const rainBoost = clean48 * 0.75 + clean24 * 0.35;
    computedPct = Math.min(100, Math.max(15, fromVolumetric * 0.7 + rainBoost));
  } else {
    // Derive from heavy clay baseline retention + 48h/24h rainfall load
    const rawPct = baselineClayRetentionPct + clean48 * 0.85 + clean24 * 0.3;
    computedPct = Math.min(100, Math.max(20, rawPct));
  }

  const soilSaturationPct = Number(computedPct.toFixed(1));
  const waterloggingHazard = clean48 >= 30.0 || soilSaturationPct >= 85.0;

  let drainageState: HistoricalSoilRainfallLog['drainageState'] = 'FIELD_CAPACITY';
  if (soilSaturationPct >= 85.0 || clean48 >= 30.0) {
    drainageState = 'WATERLOGGED_CLAY';
  } else if (soilSaturationPct >= 74.0 || clean48 >= 18.0) {
    drainageState = 'NEAR_SATURATION';
  } else if (soilSaturationPct < 50.0) {
    drainageState = 'FREE_DRAINING';
  }

  return {
    soilSaturationPct,
    drainageState,
    waterloggingHazard
  };
}

interface SeedLogTemplate extends Omit<HistoricalSoilRainfallLog, 'recordedAt'> {
  daysAgo: number;
  hourUtc: number;
  minuteUtc: number;
}

/**
 * Computes a rolling ISO timestamp `daysAgo` prior to `referenceDate` (defaults to Today).
 * Ensures `daysAgo === 0` always lands on today's date without exceeding the current timestamp.
 */
export function computeRollingLogTimestamp(
  daysAgo: number,
  hourUtc: number = 8,
  minuteUtc: number = 0,
  referenceDate: Date = new Date()
): string {
  const target = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate() - daysAgo,
      hourUtc,
      minuteUtc,
      0,
      0
    )
  );
  if (daysAgo === 0 && target.getTime() > referenceDate.getTime()) {
    return referenceDate.toISOString();
  }
  return target.toISOString();
}

const DEFAULT_SEED_LOG_TEMPLATES: SeedLogTemplate[] = [
  {
    id: 'log-garden-01',
    daysAgo: 0,
    hourUtc: 8,
    minuteUtc: 0,
    locationZone: 'South-Facing Mixed Border (Heavy Clay)',
    rainfall24hMm: 16.4,
    rainfall48hMm: 32.8,
    soilSaturationPct: 91.2,
    soilTemp6cmC: 7.4,
    drainageState: 'WATERLOGGED_CLAY',
    waterloggingHazard: true,
    frostPocketActive: false,
    notes: 'Surface pooling near Dahlia tubers after persistent frontal rain; avoid walking on clay beds to prevent structural panning.',
    source: 'UKMO_2KM_AUTO_SYNC'
  },
  {
    id: 'log-garden-02',
    daysAgo: 2,
    hourUtc: 8,
    minuteUtc: 0,
    locationZone: 'Open Allotment Bed (Exposed)',
    rainfall24hMm: 9.2,
    rainfall48hMm: 21.5,
    soilSaturationPct: 78.6,
    soilTemp6cmC: 8.1,
    drainageState: 'NEAR_SATURATION',
    waterloggingHazard: false,
    frostPocketActive: false,
    notes: 'Soft clay collar around Purple Sprouting Broccoli stems; firmed with heel and staked against 27 mph westerly gusts.',
    source: 'MANUAL_OBSERVATION'
  },
  {
    id: 'log-garden-03',
    daysAgo: 5,
    hourUtc: 7,
    minuteUtc: 30,
    locationZone: 'Lower Garden Frost Pocket',
    rainfall24hMm: 1.8,
    rainfall48hMm: 5.4,
    soilSaturationPct: 65.0,
    soilTemp6cmC: 5.9,
    drainageState: 'FIELD_CAPACITY',
    waterloggingHazard: false,
    frostPocketActive: true,
    notes: 'Clear radiation night dropped grass minimum to 0.8°C; terracotta Meyer Lemon pot elevated onto pot feet.',
    source: 'MANUAL_OBSERVATION'
  },
  {
    id: 'log-garden-04',
    daysAgo: 8,
    hourUtc: 9,
    minuteUtc: 0,
    locationZone: 'Raised Bed (Compost / Loam Mix)',
    rainfall24hMm: 0.4,
    rainfall48hMm: 2.1,
    soilSaturationPct: 46.5,
    soilTemp6cmC: 9.8,
    drainageState: 'FREE_DRAINING',
    waterloggingHazard: false,
    frostPocketActive: false,
    notes: 'Friable tilth across raised beds; applied 5cm well-rotted organic mulch ahead of overnight frosts.',
    source: 'MANUAL_OBSERVATION'
  },
  {
    id: 'log-garden-05',
    daysAgo: 11,
    hourUtc: 8,
    minuteUtc: 15,
    locationZone: 'South-Facing Mixed Border (Heavy Clay)',
    rainfall24hMm: 4.5,
    rainfall48hMm: 11.2,
    soilSaturationPct: 68.4,
    soilTemp6cmC: 9.2,
    drainageState: 'FIELD_CAPACITY',
    waterloggingHazard: false,
    frostPocketActive: false,
    notes: 'Moderate drainage recovery following passing squalls; earthworm casts active across mulched border.',
    source: 'UKMO_2KM_AUTO_SYNC'
  },
  {
    id: 'log-garden-06',
    daysAgo: 14,
    hourUtc: 7,
    minuteUtc: 45,
    locationZone: 'North-Facing Shaded Border (Heavy Clay)',
    rainfall24hMm: 18.2,
    rainfall48hMm: 35.6,
    soilSaturationPct: 94.0,
    soilTemp6cmC: 8.6,
    drainageState: 'WATERLOGGED_CLAY',
    waterloggingHazard: true,
    frostPocketActive: false,
    notes: 'Low-pressure system delivered 35.6mm over 48h; clay macropores saturated, cleared perimeter ditch outfall.',
    source: 'MET_OFFICE_DATAHUB_SYNC'
  },
  {
    id: 'log-garden-07',
    daysAgo: 18,
    hourUtc: 8,
    minuteUtc: 30,
    locationZone: 'Open Allotment Bed (Exposed)',
    rainfall24hMm: 11.0,
    rainfall48hMm: 23.4,
    soilSaturationPct: 81.5,
    soilTemp6cmC: 10.1,
    drainageState: 'NEAR_SATURATION',
    waterloggingHazard: false,
    frostPocketActive: false,
    notes: 'Sticky surface tilth on allotment plot; laid timber staging planks between brassica rows.',
    source: 'MANUAL_OBSERVATION'
  },
  {
    id: 'log-garden-08',
    daysAgo: 21,
    hourUtc: 8,
    minuteUtc: 0,
    locationZone: 'South-Facing Mixed Border (Heavy Clay)',
    rainfall24hMm: 3.2,
    rainfall48hMm: 7.8,
    soilSaturationPct: 63.2,
    soilTemp6cmC: 11.0,
    drainageState: 'FIELD_CAPACITY',
    waterloggingHazard: false,
    frostPocketActive: false,
    notes: 'Rolling 3-week baseline check; soil moist and stable at field capacity.',
    source: 'UKMO_2KM_AUTO_SYNC'
  },
  {
    id: 'log-garden-09',
    daysAgo: 25,
    hourUtc: 9,
    minuteUtc: 0,
    locationZone: 'Sheltered Lawn Corner',
    rainfall24hMm: 1.2,
    rainfall48hMm: 3.5,
    soilSaturationPct: 55.8,
    soilTemp6cmC: 12.1,
    drainageState: 'FIELD_CAPACITY',
    waterloggingHazard: false,
    frostPocketActive: false,
    notes: 'Dry breezy spell allowed good aeration around Acer palmatum root zone.',
    source: 'MANUAL_OBSERVATION'
  },
  {
    id: 'log-garden-10',
    daysAgo: 28,
    hourUtc: 8,
    minuteUtc: 30,
    locationZone: 'Raised Bed (Compost / Loam Mix)',
    rainfall24hMm: 0.0,
    rainfall48hMm: 1.4,
    soilSaturationPct: 48.2,
    soilTemp6cmC: 12.8,
    drainageState: 'FREE_DRAINING',
    waterloggingHazard: false,
    frostPocketActive: false,
    notes: 'Start of 30-day window dry tilth; planted spring bulbs with sharp grit drainage layer.',
    source: 'MANUAL_OBSERVATION'
  }
];

function materializeRollingSeedLogs(referenceDate: Date = new Date()): HistoricalSoilRainfallLog[] {
  return DEFAULT_SEED_LOG_TEMPLATES.map(({ daysAgo, hourUtc, minuteUtc, ...rest }) => ({
    ...rest,
    recordedAt: computeRollingLogTimestamp(daysAgo, hourUtc, minuteUtc, referenceDate)
  }));
}

interface RegionalHydrologyProfile {
  baselineClayRetentionPct: number;
  rainfallMultiplier: number;
  soilTempOffsetC: number;
  defaultSoilProfile: string;
  rhsHardinessZone: string;
  hydrologyNote: string;
  dayWaveOffsets: number[];
}

const REGIONAL_HYDROLOGY_PRESETS: Record<string, RegionalHydrologyProfile> = {
  york: {
    baselineClayRetentionPct: 59,
    rainfallMultiplier: 0.88,
    soilTempOffsetC: -0.2,
    defaultSoilProfile: 'Vale alluvial clay & moisture-retentive loam (pH 6.4–7.0)',
    rhsHardinessZone: 'H4',
    hydrologyNote: 'Vale of York lowland alluvial clay: moderate eastern rainfall with slow water-table drainage after river-valley rain bands.',
    dayWaveOffsets: [-1.2, 0.8, -0.4, -0.2, 1.4, -2.0, 0.5, -0.6, 0.2, -0.3]
  },
  edinburgh: {
    baselineClayRetentionPct: 63,
    rainfallMultiplier: 0.96,
    soilTempOffsetC: -1.5,
    defaultSoilProfile: 'Glacial boulder clay to fertile garden loam (pH 6.0–6.8)',
    rhsHardinessZone: 'H4',
    hydrologyNote: 'Lothian glacial boulder clay: cooler 6cm soil temperatures slow evaporation; brisk Firth of Forth breeze dries surface crust.',
    dayWaveOffsets: [1.5, -1.0, 2.2, 0.6, -1.2, 1.8, -0.8, 1.1, 0.4, 0.0]
  },
  manchester: {
    baselineClayRetentionPct: 68,
    rainfallMultiplier: 1.32,
    soilTempOffsetC: 0.1,
    defaultSoilProfile: 'Moisture-retentive clay loam over glacial till (pH 6.0–6.7)',
    rhsHardinessZone: 'H4',
    hydrologyNote: 'Pennine-edge North West rainfall regime: frequent Atlantic frontal rain keeps clay pores near or above the 85% waterlogging threshold.',
    dayWaveOffsets: [4.2, 3.6, 2.8, 1.9, 3.4, 4.8, 2.5, 2.0, 1.6, 1.2]
  },
  bristol: {
    baselineClayRetentionPct: 60,
    rainfallMultiplier: 1.08,
    soilTempOffsetC: 1.7,
    defaultSoilProfile: 'Neutral to mildly alkaline clay loam (pH 6.5–7.2)',
    rhsHardinessZone: 'H5',
    hydrologyNote: 'South West maritime clay loam (RHS H5): warmer 6cm soil temperatures accelerate root activity and recovery between westerly rain fronts.',
    dayWaveOffsets: [1.8, 0.4, -0.5, 0.9, 1.5, 0.6, -1.1, 0.5, -0.4, 0.2]
  },
  cambridge: {
    baselineClayRetentionPct: 48,
    rainfallMultiplier: 0.58,
    soilTempOffsetC: 0.8,
    defaultSoilProfile: 'Calcareous clay loam to fen silt (pH 6.8–7.4)',
    rhsHardinessZone: 'H4',
    hydrologyNote: 'East Anglian rain-shadow regime: significantly lower 48h rainfall totals keep calcareous clay-silt well below waterlogging thresholds.',
    dayWaveOffsets: [-4.5, -3.2, -1.4, -0.8, -2.1, -5.8, -3.6, -1.8, -0.9, -0.5]
  },
  cardiff: {
    baselineClayRetentionPct: 66,
    rainfallMultiplier: 1.24,
    soilTempOffsetC: 1.5,
    defaultSoilProfile: 'Alluvial clay-silt & coastal loam (pH 6.2–6.9)',
    rhsHardinessZone: 'H5',
    hydrologyNote: 'Severn Estuary maritime regime: mild soil temperatures paired with heavy Atlantic frontal downpours requiring active winter drainage.',
    dayWaveOffsets: [3.4, 2.5, 1.2, 1.6, 2.8, 3.9, 1.9, 1.4, 0.9, 0.6]
  },
  london: {
    baselineClayRetentionPct: 52,
    rainfallMultiplier: 0.68,
    soilTempOffsetC: 2.2,
    defaultSoilProfile: 'London clay to improved alluvial loam (pH 6.5–7.2)',
    rhsHardinessZone: 'H5',
    hydrologyNote: 'Thames Basin London Clay (RHS H5): urban heat-island warmth (+2°C soil temp) and lower autumn rainfall reduce prolonged waterlogging.',
    dayWaveOffsets: [-3.4, -2.4, -1.1, -0.5, -1.6, -4.2, -2.8, -1.2, -0.6, -0.2]
  },
  durham: {
    baselineClayRetentionPct: 65,
    rainfallMultiplier: 1.05,
    soilTempOffsetC: -1.1,
    defaultSoilProfile: 'Wear Valley heavy boulder clay (pH 6.0–6.8)',
    rhsHardinessZone: 'H4',
    hydrologyNote: 'Wear Valley boulder clay frost pocket: steep valley topography retains autumn moisture and experiences early overnight radiation frosts.',
    dayWaveOffsets: [1.2, 1.8, 0.9, 0.3, 1.1, 2.2, 0.8, 0.6, 0.3, 0.1]
  }
};

/**
 * Normalizes a location query into a deterministic key and hydrological calibration profile.
 */
export function resolveSoilLocationCalibration(
  query?: SoilLogLocationQuery
): SoilLocationCalibrationSummary {
  const rawName = (query?.locationName || '').trim();
  const rawId = (query?.locationId || '').trim().toLowerCase();
  const aspect = (query?.gardenAspect || 'SOUTH').trim().toUpperCase();

  // Aspect modifiers: North-facing stays wetter and cooler; South-facing warms and drains faster
  const aspectRetentionMod =
    aspect === 'NORTH' ? 5.5 : aspect === 'EAST' ? 2.5 : aspect === 'WEST' ? 1.5 : 0;
  const aspectTempMod =
    aspect === 'NORTH' ? -1.1 : aspect === 'EAST' ? -0.4 : aspect === 'WEST' ? 0.2 : 0.6;

  // Check if query matches one of the 8 UK presets by ID or name
  let matchedPresetKey: string | null = null;
  if (rawId && REGIONAL_HYDROLOGY_PRESETS[rawId]) {
    matchedPresetKey = rawId;
  } else if (rawName) {
    const lowerName = rawName.toLowerCase();
    for (const key of Object.keys(REGIONAL_HYDROLOGY_PRESETS)) {
      if (lowerName.includes(key)) {
        matchedPresetKey = key;
        break;
      }
    }
  }

  if (matchedPresetKey) {
    const preset = REGIONAL_HYDROLOGY_PRESETS[matchedPresetKey];
    const locationKey = `${matchedPresetKey}:${aspect.toLowerCase()}`;
    return {
      locationKey,
      locationName: rawName || matchedPresetKey.charAt(0).toUpperCase() + matchedPresetKey.slice(1),
      soilProfile: query?.soilProfile || preset.defaultSoilProfile,
      gardenAspect: aspect,
      rhsHardinessZone: query?.rhsHardinessZone || preset.rhsHardinessZone,
      baselineClayRetentionPct: Number(
        Math.min(78, Math.max(40, preset.baselineClayRetentionPct + aspectRetentionMod)).toFixed(1)
      ),
      rainfallMultiplier: preset.rainfallMultiplier,
      soilTempOffsetC: Number((preset.soilTempOffsetC + aspectTempMod).toFixed(1)),
      hydrologyNote: preset.hydrologyNote
    };
  }

  // If no location is provided at all, return default baseline calibration
  if (!rawName && !rawId) {
    return {
      locationKey: 'default',
      locationName: 'UK Temperate Heavy Clay Plot',
      soilProfile: query?.soilProfile || 'Heavy clay to moisture-retentive garden loam (pH 6.0–6.8)',
      gardenAspect: aspect,
      rhsHardinessZone: query?.rhsHardinessZone || 'H4',
      baselineClayRetentionPct: 62,
      rainfallMultiplier: 1.0,
      soilTempOffsetC: 0,
      hydrologyNote: 'Baseline UK heavy clay hydrology profile.'
    };
  }

  // Custom town/village/postcode deterministic calibration using name hash + coordinates
  let hash = 0;
  const cleanLower = rawName.toLowerCase();
  for (let i = 0; i < cleanLower.length; i++) {
    hash = (hash * 33 + cleanLower.charCodeAt(i)) % 10000;
  }

  const lat =
    typeof query?.latitude === 'number' && !Number.isNaN(query.latitude)
      ? query.latitude
      : 51.5 + (hash % 45) * 0.1;
  const lon =
    typeof query?.longitude === 'number' && !Number.isNaN(query.longitude)
      ? query.longitude
      : -3.5 + ((hash >> 3) % 35) * 0.1;

  // Western longitudes (< -2.0) get wetter Atlantic air masses; eastern (> -0.5) are drier
  const lonRainFactor = lon < -2.2 ? 1.18 : lon < -1.2 ? 1.02 : lon < 0 ? 0.84 : 0.72;
  const hashVariance = ((hash % 21) - 10) * 0.015; // -0.15 to +0.15
  const rainfallMultiplier = Number(Math.min(1.45, Math.max(0.55, lonRainFactor + hashVariance)).toFixed(2));

  // Northern latitudes (> 54) have cooler 6cm soil temperature
  const latTempOffset = (53.2 - lat) * 0.55;
  const soilTempOffsetC = Number((latTempOffset + aspectTempMod).toFixed(1));

  const baseRetention = 56 + (rainfallMultiplier - 0.8) * 18 + ((hash % 9) - 4) + aspectRetentionMod;
  const baselineClayRetentionPct = Number(Math.min(76, Math.max(44, baseRetention)).toFixed(1));
  const rhsZone = query?.rhsHardinessZone || (lat < 52.5 ? 'H5' : 'H4');

  return {
    locationKey: `custom:${cleanLower.replace(/[^a-z0-9]+/g, '-')}:${aspect.toLowerCase()}`,
    locationName: rawName,
    soilProfile:
      query?.soilProfile || 'Moisture-retentive clay to garden loam (pH 6.0–6.8)',
    gardenAspect: aspect,
    rhsHardinessZone: rhsZone,
    baselineClayRetentionPct,
    rainfallMultiplier,
    soilTempOffsetC,
    hydrologyNote: `Calibrated for ${rawName} (${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E, ${aspect.charAt(0)}${aspect.slice(1).toLowerCase()}-Facing): ${
      rainfallMultiplier >= 1.1
        ? 'higher western rainfall load requires close monitoring of the 85% clay waterlogging threshold.'
        : rainfallMultiplier <= 0.8
          ? 'drier regional rainfall profile keeps clay pore saturation lower between autumn fronts.'
          : 'moderate regional rainfall with periodic autumn saturation peaks after frontal rain.'
    }`
  };
}

/**
 * Generates a realistic, deterministic 30-day series of 10 soil saturation & rainfall logs
 * calibrated to the specified garden location, soil profile, and aspect, dynamically anchored to Today.
 */
export function buildLocationCalibratedSeedLogs(
  query?: SoilLogLocationQuery,
  referenceDate: Date = new Date()
): HistoricalSoilRainfallLog[] {
  const rollingBaseLogs = materializeRollingSeedLogs(referenceDate);
  const hasLocationQuery = Boolean(
    (query?.locationName && query.locationName.trim()) ||
      (query?.locationId && query.locationId.trim())
  );

  if (!hasLocationQuery) {
    return rollingBaseLogs;
  }

  const calibration = resolveSoilLocationCalibration(query);
  const shortLoc = calibration.locationName.split(',')[0].trim();
  const aspectTitle =
    calibration.gardenAspect.charAt(0) + calibration.gardenAspect.slice(1).toLowerCase();

  // Check if we have preset wave offsets, or compute deterministic ones from locationKey
  const baseKey = calibration.locationKey.split(':')[0];
  const presetProfile = REGIONAL_HYDROLOGY_PRESETS[baseKey];
  let hash = 0;
  for (let i = 0; i < calibration.locationKey.length; i++) {
    hash = (hash * 31 + calibration.locationKey.charCodeAt(i)) % 9973;
  }

  return rollingBaseLogs.map((baseLog, idx) => {
    const waveOffset = presetProfile
      ? presetProfile.dayWaveOffsets[idx % presetProfile.dayWaveOffsets.length]
      : (((hash >> (idx % 8)) % 11) - 5) * 0.7;

    const scaledRain24 = Math.max(
      0,
      Number((baseLog.rainfall24hMm * calibration.rainfallMultiplier + waveOffset * 0.45).toFixed(1))
    );
    const scaledRain48 = Math.max(
      scaledRain24,
      Number((baseLog.rainfall48hMm * calibration.rainfallMultiplier + waveOffset).toFixed(1))
    );

    // Raise or lower retention slightly for raised bed vs heavy clay border
    const isRaisedBed = baseLog.locationZone.toLowerCase().includes('raised bed');
    const zoneRetention = isRaisedBed
      ? Math.max(36, calibration.baselineClayRetentionPct - 14)
      : calibration.baselineClayRetentionPct;

    const calc = calculateClaySoilSaturation({
      rainfall24hMm: scaledRain24,
      rainfall48hMm: scaledRain48,
      baselineClayRetentionPct: zoneRetention
    });

    const adjustedSoilTemp = Number(
      Math.max(1.5, baseLog.soilTemp6cmC + calibration.soilTempOffsetC).toFixed(1)
    );
    const frostPocketActive = adjustedSoilTemp <= 6.2 || (idx === 2 && calibration.soilTempOffsetC <= 0.5);

    // Adapt zone label to reflect the user's garden aspect & location
    const localizedZone = baseLog.locationZone.includes('South-Facing Mixed Border')
      ? `${aspectTitle}-Facing Mixed Border (${shortLoc})`
      : `${baseLog.locationZone} (${shortLoc})`;

    const localizedNote =
      calc.drainageState === 'WATERLOGGED_CLAY'
        ? `${shortLoc} (${scaledRain48}mm / 48h): clay macropores above 85% saturation threshold; avoid treading on ${aspectTitle.toLowerCase()}-facing beds.`
        : calc.drainageState === 'NEAR_SATURATION'
          ? `${shortLoc} (${scaledRain48}mm / 48h): sticky surface tilth at ${calc.soilSaturationPct}% saturation; check brassica stakes against wind-rock.`
          : calc.drainageState === 'FREE_DRAINING'
            ? `${shortLoc} (${scaledRain48}mm / 48h): friable well-aerated tilth (${calc.soilSaturationPct}% saturation) at ${adjustedSoilTemp}°C 6cm soil depth.`
            : `${shortLoc} (${scaledRain48}mm / 48h): steady field capacity (${calc.soilSaturationPct}% saturation) across ${calibration.soilProfile.split('(')[0].trim().toLowerCase()}.`;

    return {
      ...baseLog,
      id: `log-${calibration.locationKey.replace(/[^a-z0-9]+/g, '-')}-${String(idx + 1).padStart(2, '0')}`,
      locationKey: calibration.locationKey,
      locationName: calibration.locationName,
      locationZone: localizedZone,
      rainfall24hMm: scaledRain24,
      rainfall48hMm: scaledRain48,
      soilSaturationPct: calc.soilSaturationPct,
      soilTemp6cmC: adjustedSoilTemp,
      drainageState: calc.drainageState,
      waterloggingHazard: calc.waterloggingHazard,
      frostPocketActive,
      notes: localizedNote
    };
  });
}

interface PersistedSoilDbState {
  schema: string;
  customLogs: HistoricalSoilRainfallLog[];
  deletedIds: string[];
}

const DB_FILE_PATH = path.resolve(os.tmpdir(), 'garden_soil_rainfall_logs_v6.json');

let cachedPersistedState: PersistedSoilDbState | null = null;

function loadPersistedState(): PersistedSoilDbState {
  if (cachedPersistedState) {
    return cachedPersistedState;
  }
  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE_PATH)) {
      const initial: PersistedSoilDbState = {
        schema: SOIL_RAINFALL_SCHEMA_SQL,
        customLogs: [],
        deletedIds: []
      };
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initial, null, 2), 'utf8');
      cachedPersistedState = initial;
      return initial;
    }
    const raw = JSON.parse(fs.readFileSync(DB_FILE_PATH, 'utf8'));
    cachedPersistedState = {
      schema: SOIL_RAINFALL_SCHEMA_SQL,
      customLogs: Array.isArray(raw?.customLogs) ? raw.customLogs : [],
      deletedIds: Array.isArray(raw?.deletedIds) ? raw.deletedIds : []
    };
    return cachedPersistedState;
  } catch {
    cachedPersistedState = {
      schema: SOIL_RAINFALL_SCHEMA_SQL,
      customLogs: [],
      deletedIds: []
    };
    return cachedPersistedState;
  }
}

function savePersistedState(state: PersistedSoilDbState): void {
  cachedPersistedState = state;
  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.warn('[SoilLogsDB] Disk write warning:', err);
  }
}

export function getAllSoilRainfallLogs(
  query?: SoilLogLocationQuery,
  referenceDate: Date = new Date()
): {
  schemaSql: string;
  locationCalibration: SoilLocationCalibrationSummary;
  logs: HistoricalSoilRainfallLog[];
} {
  const state = loadPersistedState();
  const calibration = resolveSoilLocationCalibration(query);
  const seedLogs = buildLocationCalibratedSeedLogs(query, referenceDate);

  // Filter user-created logs that belong to this locationKey (or default if unconfigured)
  const matchingCustomLogs = state.customLogs.filter((log) => {
    if (calibration.locationKey === 'default') {
      return !log.locationKey || log.locationKey === 'default';
    }
    return log.locationKey === calibration.locationKey;
  });

  const combined = [...matchingCustomLogs, ...seedLogs]
    .filter((log) => !state.deletedIds.includes(log.id))
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

  return {
    schemaSql: SOIL_RAINFALL_SCHEMA_SQL.trim(),
    locationCalibration: calibration,
    logs: combined
  };
}

export function insertSoilRainfallLog(input: {
  locationZone?: string;
  locationId?: string;
  locationName?: string;
  latitude?: number | null;
  longitude?: number | null;
  soilProfile?: string;
  gardenAspect?: string;
  rhsHardinessZone?: string;
  rainfall24hMm: number;
  rainfall48hMm: number;
  soilSaturationPct?: number;
  soilTemp6cmC?: number;
  frostPocketActive?: boolean;
  notes?: string;
  source?: HistoricalSoilRainfallLog['source'];
}): HistoricalSoilRainfallLog {
  const state = loadPersistedState();
  const calibration = resolveSoilLocationCalibration({
    locationId: input.locationId,
    locationName: input.locationName,
    latitude: input.latitude,
    longitude: input.longitude,
    soilProfile: input.soilProfile,
    gardenAspect: input.gardenAspect,
    rhsHardinessZone: input.rhsHardinessZone
  });

  const rain24 = Number(Number(input.rainfall24hMm || 0).toFixed(1));
  const rain48 = Number(Math.max(rain24, Number(input.rainfall48hMm || 0)).toFixed(1));

  const calc = calculateClaySoilSaturation({
    rainfall24hMm: rain24,
    rainfall48hMm: rain48,
    baselineClayRetentionPct: calibration.baselineClayRetentionPct
  });

  const finalSaturation =
    typeof input.soilSaturationPct === 'number' && !Number.isNaN(input.soilSaturationPct)
      ? Number(Math.min(100, Math.max(0, input.soilSaturationPct)).toFixed(1))
      : calc.soilSaturationPct;

  const waterloggingHazard = rain48 >= 30.0 || finalSaturation >= 85.0;
  let drainageState: HistoricalSoilRainfallLog['drainageState'] = calc.drainageState;
  if (finalSaturation >= 85.0 || rain48 >= 30.0) {
    drainageState = 'WATERLOGGED_CLAY';
  } else if (finalSaturation >= 74.0 || rain48 >= 18.0) {
    drainageState = 'NEAR_SATURATION';
  } else if (finalSaturation < 50.0) {
    drainageState = 'FREE_DRAINING';
  } else {
    drainageState = 'FIELD_CAPACITY';
  }

  const newEntry: HistoricalSoilRainfallLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    recordedAt: new Date().toISOString(),
    locationKey: calibration.locationKey,
    locationName: calibration.locationName,
    locationZone: (input.locationZone || 'South-Facing Mixed Border (Heavy Clay)').trim(),
    rainfall24hMm: rain24,
    rainfall48hMm: rain48,
    soilSaturationPct: finalSaturation,
    soilTemp6cmC: Number((input.soilTemp6cmC ?? 7.8 + calibration.soilTempOffsetC).toFixed(1)),
    drainageState,
    waterloggingHazard,
    frostPocketActive: Boolean(input.frostPocketActive),
    notes: (input.notes || `Recorded clay moisture & rainfall check for ${calibration.locationName}.`).trim(),
    source: input.source || 'MANUAL_OBSERVATION'
  };

  state.customLogs = [newEntry, ...state.customLogs];
  savePersistedState(state);
  return newEntry;
}

export function deleteSoilRainfallLog(id: string): boolean {
  const state = loadPersistedState();
  const initialCustomLen = state.customLogs.length;
  state.customLogs = state.customLogs.filter((l) => l.id !== id);
  const removedFromCustom = state.customLogs.length < initialCustomLen;

  if (!state.deletedIds.includes(id)) {
    state.deletedIds.push(id);
  }
  savePersistedState(state);
  return removedFromCustom || state.deletedIds.includes(id);
}

/**
 * Pure Data Transformation & Trend Analytics for the 30-Day D3 Soil Saturation Line Chart
 */

import type { HistoricalSoilRainfallLog } from '../db/soilLogsDb';

export interface SoilChartPoint {
  id: string;
  date: Date;
  recordedAt: string;
  locationZone: string;
  soilSaturationPct: number;
  rainfall24hMm: number;
  rainfall48hMm: number;
  soilTemp6cmC: number;
  drainageState: HistoricalSoilRainfallLog['drainageState'];
  waterloggingHazard: boolean;
  frostPocketActive: boolean;
  notes: string;
}

export interface SoilTrendSummary {
  pointCount: number;
  minSaturationPct: number;
  maxSaturationPct: number;
  avgSaturationPct: number;
  latestSaturationPct: number;
  netChange30dPct: number;
  daysAboveWaterloggingThreshold: number;
}

/**
 * Filters database logs to the last `windowDays` (default 30 days) relative to the newest log
 * (or referenceDate) and returns them sorted chronologically (oldest -> newest) for D3 line plotting.
 */
export function prepare30DaySoilSeries(
  logs: HistoricalSoilRainfallLog[] = [],
  windowDays: number = 30,
  referenceDate?: Date
): SoilChartPoint[] {
  if (!Array.isArray(logs) || logs.length === 0) return [];

  const validPoints: SoilChartPoint[] = logs
    .map((log) => {
      const parsedDate = new Date(log.recordedAt);
      if (Number.isNaN(parsedDate.getTime())) return null;
      return {
        id: log.id,
        date: parsedDate,
        recordedAt: log.recordedAt,
        locationZone: log.locationZone,
        soilSaturationPct: Number(log.soilSaturationPct) || 0,
        rainfall24hMm: Number(log.rainfall24hMm) || 0,
        rainfall48hMm: Number(log.rainfall48hMm) || 0,
        soilTemp6cmC: Number(log.soilTemp6cmC) || 0,
        drainageState: log.drainageState,
        waterloggingHazard: Boolean(log.waterloggingHazard),
        frostPocketActive: Boolean(log.frostPocketActive),
        notes: log.notes || ''
      };
    })
    .filter((item): item is SoilChartPoint => item !== null);

  if (validPoints.length === 0) return [];

  // Determine anchor timestamp (either provided referenceDate or latest log timestamp)
  const newestTime = referenceDate
    ? referenceDate.getTime()
    : Math.max(...validPoints.map((p) => p.date.getTime()));
  const cutoffTime = newestTime - windowDays * 24 * 60 * 60 * 1000;

  return validPoints
    .filter((p) => p.date.getTime() >= cutoffTime && p.date.getTime() <= newestTime + 86400000)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Computes summary statistics across the 30-day chronological series.
 */
export function compute30DayTrendMetrics(series: SoilChartPoint[]): SoilTrendSummary {
  if (!Array.isArray(series) || series.length === 0) {
    return {
      pointCount: 0,
      minSaturationPct: 0,
      maxSaturationPct: 0,
      avgSaturationPct: 0,
      latestSaturationPct: 0,
      netChange30dPct: 0,
      daysAboveWaterloggingThreshold: 0
    };
  }

  const values = series.map((p) => p.soilSaturationPct);
  const minSaturationPct = Number(Math.min(...values).toFixed(1));
  const maxSaturationPct = Number(Math.max(...values).toFixed(1));
  const avgSaturationPct = Number(
    (values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1)
  );
  const firstVal = values[0];
  const latestSaturationPct = Number(values[values.length - 1].toFixed(1));
  const netChange30dPct = Number((latestSaturationPct - firstVal).toFixed(1));
  const daysAboveWaterloggingThreshold = series.filter(
    (p) => p.soilSaturationPct >= 85.0 || p.waterloggingHazard
  ).length;

  return {
    pointCount: series.length,
    minSaturationPct,
    maxSaturationPct,
    avgSaturationPct,
    latestSaturationPct,
    netChange30dPct,
    daysAboveWaterloggingThreshold
  };
}

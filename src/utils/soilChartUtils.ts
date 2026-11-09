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

  const validPoints: SoilChartPoint[] = [];
  let maxLogTimestamp = -Infinity;

  for (const log of logs) {
    const parsedDate = new Date(log.recordedAt);
    const ts = parsedDate.getTime();
    if (Number.isNaN(ts)) continue;
    if (ts > maxLogTimestamp) maxLogTimestamp = ts;

    validPoints.push({
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
    });
  }

  if (validPoints.length === 0) return [];

  const newestTime = referenceDate ? referenceDate.getTime() : maxLogTimestamp;
  const cutoffTime = newestTime - windowDays * 24 * 60 * 60 * 1000;
  const upperBoundTime = newestTime + 86400000;

  return validPoints
    .filter((p) => {
      const t = p.date.getTime();
      return t >= cutoffTime && t <= upperBoundTime;
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Computes summary statistics across the 30-day chronological series in a single O(N) pass.
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

  let minVal = Infinity;
  let maxVal = -Infinity;
  let sumVal = 0;
  let daysAboveThreshold = 0;

  for (const point of series) {
    const val = point.soilSaturationPct;
    if (val < minVal) minVal = val;
    if (val > maxVal) maxVal = val;
    sumVal += val;
    if (val >= 85.0 || point.waterloggingHazard) {
      daysAboveThreshold += 1;
    }
  }

  const firstVal = series[0].soilSaturationPct;
  const latestSaturationPct = Number(series[series.length - 1].soilSaturationPct.toFixed(1));

  return {
    pointCount: series.length,
    minSaturationPct: Number(minVal.toFixed(1)),
    maxSaturationPct: Number(maxVal.toFixed(1)),
    avgSaturationPct: Number((sumVal / series.length).toFixed(1)),
    latestSaturationPct,
    netChange30dPct: Number((latestSaturationPct - firstVal).toFixed(1)),
    daysAboveWaterloggingThreshold: daysAboveThreshold
  };
}

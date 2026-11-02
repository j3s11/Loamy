import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Database,
  Droplets,
  Plus,
  Trash2,
  ThermometerSnowflake,
  CloudRain,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Compass
} from 'lucide-react';
import SoilSaturationD3Chart from './SoilSaturationD3Chart';

const DRAINAGE_LABELS = {
  WATERLOGGED_CLAY: {
    label: 'Waterlogged Clay',
    style: 'text-rose-900 bg-rose-50 border-rose-200'
  },
  NEAR_SATURATION: {
    label: 'Near Saturation',
    style: 'text-amber-900 bg-amber-50 border-amber-200'
  },
  FIELD_CAPACITY: {
    label: 'Field Capacity',
    style: 'text-sky-900 bg-sky-50 border-sky-200'
  },
  FREE_DRAINING: {
    label: 'Free Draining',
    style: 'text-emerald-900 bg-emerald-50 border-emerald-200'
  }
};

export default function SoilSaturationLogPanel({
  weatherData,
  gardenProfile,
  locationPresets = []
}) {
  const [logs, setLogs] = useState([]);
  const [locationCalibration, setLocationCalibration] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showLogHistory, setShowLogHistory] = useState(false);
  const [filterState, setFilterState] = useState('ALL');
  const [statusMessage, setStatusMessage] = useState(null);

  const activeLocationName = gardenProfile?.locationName || '';
  const activeLocationId = gardenProfile?.locationId || '';
  const activeLatitude = gardenProfile?.latitude ?? null;
  const activeLongitude = gardenProfile?.longitude ?? null;
  const activeSoilProfile = gardenProfile?.soilProfile || '';
  const activeGardenAspect =
    gardenProfile?.gardenAspect || (gardenProfile?.isSouthFacing === false ? 'NORTH' : 'SOUTH');
  const activeRhsZone = gardenProfile?.rhsHardinessZone || 'H4';

  const aspectLabel = useMemo(() => {
    const code = String(activeGardenAspect || 'SOUTH').toUpperCase();
    return `${code.charAt(0)}${code.slice(1).toLowerCase()}-Facing`;
  }, [activeGardenAspect]);

  const localizedPresets = useMemo(() => {
    const shortLoc = activeLocationName ? activeLocationName.split(',')[0].trim() : '';
    const baseZone = `${aspectLabel} Mixed Border (${shortLoc || 'Heavy Clay'})`;
    const baseList = Array.isArray(locationPresets) && locationPresets.length > 0
      ? locationPresets
      : [
          'South-Facing Mixed Border (Heavy Clay)',
          'Open Allotment Bed (Exposed)',
          'Lower Garden Frost Pocket',
          'Raised Bed (Compost / Loam Mix)'
        ];
    if (!shortLoc) return baseList;
    return [
      baseZone,
      ...baseList.map((zone) =>
        zone.includes('South-Facing Mixed Border')
          ? baseZone
          : `${zone} (${shortLoc})`
      ).filter((item, idx, arr) => arr.indexOf(item) === idx)
    ];
  }, [activeLocationName, aspectLabel, locationPresets]);

  const [formState, setFormState] = useState({
    locationZone: localizedPresets[0] || 'South-Facing Mixed Border (Heavy Clay)',
    rainfall24hMm: '8.4',
    rainfall48hMm: '19.2',
    soilSaturationPct: '',
    soilTemp6cmC: '7.5',
    frostPocketActive: false,
    notes: ''
  });

  useEffect(() => {
    const precip48 = weatherData?.hazardSummary?.cumulativePrecip48hMm;
    const hasPrecip = typeof precip48 === 'number' && !Number.isNaN(precip48);
    const rain48Str = hasPrecip ? Number(precip48).toFixed(1) : '19.2';
    const rain24Str = hasPrecip ? Number(precip48 * 0.52).toFixed(1) : '8.4';
    const soilTemp = weatherData?.hourlyForecast?.[0]?.soilTemp6cmC;
    const soilTempStr =
      typeof soilTemp === 'number' && !Number.isNaN(soilTemp) ? Number(soilTemp).toFixed(1) : '7.5';

    setFormState((prev) => ({
      ...prev,
      locationZone: localizedPresets[0] || prev.locationZone,
      rainfall24hMm: rain24Str,
      rainfall48hMm: rain48Str,
      soilTemp6cmC: soilTempStr
    }));
  }, [localizedPresets, weatherData]);

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    if (activeLocationId) params.set('locationId', String(activeLocationId));
    if (activeLocationName) params.set('locationName', String(activeLocationName));
    if (activeLatitude !== null && activeLatitude !== undefined) {
      params.set('lat', String(activeLatitude));
    }
    if (activeLongitude !== null && activeLongitude !== undefined) {
      params.set('lon', String(activeLongitude));
    }
    if (activeSoilProfile) params.set('soilProfile', String(activeSoilProfile));
    if (activeGardenAspect) params.set('gardenAspect', String(activeGardenAspect));
    if (activeRhsZone) params.set('rhsZone', String(activeRhsZone));
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }, [
    activeLocationId,
    activeLocationName,
    activeLatitude,
    activeLongitude,
    activeSoilProfile,
    activeGardenAspect,
    activeRhsZone
  ]);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const qs = buildQueryString();
      const res = await fetch(`/api/soil-logs${qs}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data.logs) ? data.logs : []);
        if (data.locationCalibration) {
          setLocationCalibration(data.locationCalibration);
        }
      }
    } catch (err) {
      console.error('[SoilSaturationLogPanel] Failed to fetch soil logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [buildQueryString]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleCreateLog = async (e) => {
    e.preventDefault();
    const r24 = parseFloat(formState.rainfall24hMm);
    const r48 = parseFloat(formState.rainfall48hMm);
    if (Number.isNaN(r24) || Number.isNaN(r48) || r24 < 0 || r48 < 0) {
      setStatusMessage({ type: 'error', text: 'Please enter valid non-negative rainfall amounts (mm).' });
      return;
    }

    try {
      const res = await fetch('/api/soil-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: activeLocationId,
          locationName: activeLocationName,
          latitude: activeLatitude,
          longitude: activeLongitude,
          soilProfile: activeSoilProfile,
          gardenAspect: activeGardenAspect,
          rhsHardinessZone: activeRhsZone,
          locationZone: formState.locationZone,
          rainfall24hMm: r24,
          rainfall48hMm: Math.max(r24, r48),
          soilSaturationPct: formState.soilSaturationPct !== '' ? parseFloat(formState.soilSaturationPct) : undefined,
          soilTemp6cmC: formState.soilTemp6cmC !== '' ? parseFloat(formState.soilTemp6cmC) : 7.5,
          frostPocketActive: formState.frostPocketActive,
          notes:
            formState.notes ||
            `Manual clay saturation & rain gauge entry for ${activeLocationName || 'garden plot'}.`,
          source: 'MANUAL_OBSERVATION'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data.logs) ? data.logs : []);
        if (data.locationCalibration) {
          setLocationCalibration(data.locationCalibration);
        }
        setIsFormOpen(false);
        setFormState((prev) => ({ ...prev, notes: '', soilSaturationPct: '' }));
        setStatusMessage({
          type: 'success',
          text: `Saved new rainfall and clay saturation entry for ${activeLocationName || 'your garden'}.`
        });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save log.' });
    }
  };

  const handleLogCurrentForecast = async () => {
    const precip48 = weatherData?.hazardSummary?.cumulativePrecip48hMm ?? 19.0;
    const precip24 = Number((precip48 * 0.52).toFixed(1));
    const frostRisk = Boolean(weatherData?.hazardSummary?.frostRiskDetected);
    const firstHourlyTemp = weatherData?.hourlyForecast?.[0]?.soilTemp6cmC ?? 7.2;

    try {
      const res = await fetch('/api/soil-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: activeLocationId,
          locationName: activeLocationName,
          latitude: activeLatitude,
          longitude: activeLongitude,
          soilProfile: activeSoilProfile,
          gardenAspect: activeGardenAspect,
          rhsHardinessZone: activeRhsZone,
          locationZone: localizedPresets[0] || 'South-Facing Mixed Border (Heavy Clay)',
          rainfall24hMm: precip24,
          rainfall48hMm: precip48,
          soilTemp6cmC: firstHourlyTemp,
          frostPocketActive: frostRisk,
          notes: `Synced from ${activeLocationName || 'local'} forecast (lowest temp: ${weatherData?.hazardSummary?.lowestForecastTempC ?? 1.4}°C).`,
          source: 'FORECAST_SYNC'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data.logs) ? data.logs : []);
        if (data.locationCalibration) {
          setLocationCalibration(data.locationCalibration);
        }
        setStatusMessage({
          type: 'success',
          text: `Logged current 48h forecast reading (${precip48} mm) into your ${activeLocationName || 'local'} 30-day trend.`
        });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Could not sync forecast reading.' });
    }
  };

  const handleDeleteLog = async (id) => {
    try {
      const qs = buildQueryString();
      const res = await fetch(`/api/soil-logs/${id}${qs}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data.logs) ? data.logs : []);
      }
    } catch (err) {
      console.error('Failed to delete soil log:', err);
    }
  };

  const filteredLogs = logs.filter((l) => (filterState === 'ALL' ? true : l.drainageState === filterState));
  const avgSaturation =
    logs.length > 0
      ? (logs.reduce((acc, item) => acc + (item.soilSaturationPct || 0), 0) / logs.length).toFixed(1)
      : '0.0';
  const peakRain48h =
    logs.length > 0 ? Math.max(...logs.map((item) => item.rainfall48hMm || 0)).toFixed(1) : '0.0';
  const waterloggedDaysCount = logs.filter((l) => l.waterloggingHazard).length;

  return (
    <section
      aria-label="Historical Rainfall and Soil Saturation Database"
      data-testid="soil-saturation-log-panel"
      className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-stone-200 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Database className="w-5 h-5 text-emerald-700 shrink-0" />
            <h2
              data-testid="soil-panel-location-heading"
              className="text-lg sm:text-xl font-bold text-slate-900"
            >
              Clay Soil Saturation &amp; 30-Day Trend
              {activeLocationName ? ` — ${activeLocationName}` : ''}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
            {activeLocationName && (
              <>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span data-testid="soil-active-location-name">{activeLocationName}</span>
                </span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span className="inline-flex items-center gap-1 font-medium text-amber-800">
              <Compass className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>{aspectLabel} Aspect</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>RHS {activeRhsZone}</span>
            {locationCalibration?.baselineClayRetentionPct && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  Baseline Retention: <strong>{locationCalibration.baselineClayRetentionPct}%</strong>
                </span>
              </>
            )}
          </div>

          <p data-testid="soil-hydrology-note" className="text-xs sm:text-sm text-slate-600 pt-0.5">
            {locationCalibration?.hydrologyNote ||
              'Monitors 48-hour rainfall (mm) and heavy clay waterlogging thresholds (>= 85% saturation).'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleLogCurrentForecast}
            className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-stone-100 hover:bg-stone-200 text-slate-800 border border-stone-300 transition cursor-pointer"
          >
            <CloudRain className="w-4 h-4 text-sky-700" />
            Log Today&apos;s Forecast
          </button>

          <button
            type="button"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Rain Reading
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-sm flex items-center justify-between gap-2 ${
            statusMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <span className="flex items-center gap-2">
            {statusMessage.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            )}
            {statusMessage.text}
          </span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs font-semibold underline px-2 py-1 shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3 Clean Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/90 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Average Clay Saturation</span>
            <p
              data-testid="soil-avg-saturation-value"
              className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5"
            >
              {avgSaturation}%
            </p>
          </div>
          <Droplets className="w-5 h-5 text-emerald-700 shrink-0" />
        </div>
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/90 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Peak 48h Rainfall</span>
            <p
              data-testid="soil-peak-rain-value"
              className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5"
            >
              {peakRain48h} mm
            </p>
          </div>
          <CloudRain className="w-5 h-5 text-sky-700 shrink-0" />
        </div>
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/90 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Waterlogged Days (&ge; 85%)</span>
            <p
              data-testid="soil-waterlogged-days-value"
              className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5"
            >
              {waterloggedDaysCount} days
            </p>
          </div>
          <ThermometerSnowflake className="w-5 h-5 text-amber-600 shrink-0" />
        </div>
      </div>

      {/* Primary D3 Line Chart */}
      <SoilSaturationD3Chart logs={logs} locationName={activeLocationName} />

      {isFormOpen && (
        <form
          onSubmit={handleCreateLog}
          className="p-5 rounded-2xl bg-stone-50 border border-emerald-300 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
            <h3 className="text-sm font-bold text-emerald-950">
              Record New Rainfall &amp; Soil Reading
              {activeLocationName ? ` (${activeLocationName})` : ''}
            </h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="sm:col-span-2">
              <label htmlFor="soil-zone-select" className="block text-xs font-semibold text-slate-700 mb-1">
                Garden Border / Zone
              </label>
              <select
                id="soil-zone-select"
                value={formState.locationZone}
                onChange={(e) => setFormState({ ...formState, locationZone: e.target.value })}
                className="w-full min-h-[40px] px-3 py-1.5 text-sm rounded-xl bg-white border border-stone-300 text-slate-900"
              >
                {localizedPresets.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="rain-24h-input" className="block text-xs font-semibold text-slate-700 mb-1">
                24h Rain (mm) *
              </label>
              <input
                id="rain-24h-input"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                required
                value={formState.rainfall24hMm}
                onChange={(e) => setFormState({ ...formState, rainfall24hMm: e.target.value })}
                className="w-full min-h-[44px] sm:min-h-[40px] px-3 py-1.5 text-sm rounded-xl bg-white border border-stone-300 text-slate-900 tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="rain-48h-input" className="block text-xs font-semibold text-slate-700 mb-1">
                48h Rain (mm) *
              </label>
              <input
                id="rain-48h-input"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                required
                value={formState.rainfall48hMm}
                onChange={(e) => setFormState({ ...formState, rainfall48hMm: e.target.value })}
                className="w-full min-h-[44px] sm:min-h-[40px] px-3 py-1.5 text-sm rounded-xl bg-white border border-stone-300 text-slate-900 tabular-nums"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition cursor-pointer"
            >
              Save Reading
            </button>
          </div>
        </form>
      )}

      {/* Collapsible Historical Log Table to keep the screen uncluttered */}
      <div className="pt-2 border-t border-stone-200">
        <button
          type="button"
          onClick={() => setShowLogHistory((prev) => !prev)}
          className="w-full flex items-center justify-between py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
        >
          <span>
            {showLogHistory ? 'Hide Detailed Log History' : `View All ${logs.length} Recorded Soil Readings`}
          </span>
          {showLogHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showLogHistory && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {[
                  { id: 'ALL', label: 'All Readings' },
                  { id: 'WATERLOGGED_CLAY', label: 'Waterlogged' },
                  { id: 'NEAR_SATURATION', label: 'Near Saturation' },
                  { id: 'FIELD_CAPACITY', label: 'Field Capacity' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterState(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      filterState === tab.id
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'bg-stone-50 text-slate-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-500">
                Showing {filteredLogs.length} of {logs.length} records
              </span>
            </div>

            <div className="overflow-x-auto border border-stone-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Zone</th>
                    <th className="py-2.5 px-3 text-right">48h Rain</th>
                    <th className="py-2.5 px-3 text-right">Saturation</th>
                    <th className="py-2.5 px-3">State</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/70">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">
                        Loading readings...
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const badge = DRAINAGE_LABELS[log.drainageState] || DRAINAGE_LABELS.FIELD_CAPACITY;
                      const formattedDate = new Date(log.recordedAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short'
                      });
                      return (
                        <tr key={log.id} className="hover:bg-stone-50/80">
                          <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                            {formattedDate}
                          </td>
                          <td className="py-2.5 px-3 text-slate-900 font-medium">{log.locationZone}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-800 whitespace-nowrap">
                            {log.rainfall48hMm} mm
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            {log.soilSaturationPct}%
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-md border ${badge.style}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteLog(log.id)}
                              aria-label={`Delete log from ${formattedDate}`}
                              className="p-1.5 rounded text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

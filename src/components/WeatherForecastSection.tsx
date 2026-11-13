import React, { Suspense, lazy } from 'react';
import {
  Wind,
  Thermometer,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Circle,
  Calendar,
  Droplets,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import SevenDayRainfallRecharts from './SevenDayRainfallRecharts';
import {
  GardenProfile,
  PlantRecord,
  UI_CONFIG,
  formatUkDay,
  resolveWindMph
} from '../constants/gardenConfig';

const SoilSaturationLogPanel = lazy(() => import('./SoilSaturationLogPanel'));

interface WeatherForecastSectionProps {
  activeWorkspaceTab: 'OVERVIEW' | 'MASTER_GUIDE' | 'CHECKLIST' | 'SOIL_TREND' | 'PLANTS';
  setActiveWorkspaceTab: React.Dispatch<
    React.SetStateAction<'OVERVIEW' | 'MASTER_GUIDE' | 'CHECKLIST' | 'SOIL_TREND' | 'PLANTS'>
  >;
  gardenProfile: GardenProfile;
  weatherData: any;
  isLoading: boolean;
  hazardSummary: any;
  dailyForecast: any[];
  activeWarnings: any[];
  weatherAlerts: any[];
  plantInventory: PlantRecord[];
  weatherLastUpdatedLabel: string;
  alertsLastUpdatedLabel: string;
  currentTempC: number;
  lowest7DayTempC: number;
  soilTemp6cmC: number;
  currentWindSpeedMph: number;
  peakWindGustMph: number;
  todayRainfallMm: number;
  cumulative48hRainfallMm: number;
  showWeatherDetails: boolean;
  setShowWeatherDetails: React.Dispatch<React.SetStateAction<boolean>>;
  expandedForecastDayIdx: number | null;
  setExpandedForecastDayIdx: React.Dispatch<React.SetStateAction<number | null>>;
  expandedAlertIndices: Record<number, boolean>;
  setExpandedAlertIndices: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  showRainfallChart: boolean;
  setShowRainfallChart: React.Dispatch<React.SetStateAction<boolean>>;
  showSoilTrendDrawer: boolean;
  setShowSoilTrendDrawer: React.Dispatch<React.SetStateAction<boolean>>;
  protectedAlertPlants: Record<string, boolean>;
  setProtectedAlertPlants: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onToggleProtectedAlertPlant: (alertKey: string) => void;
}

const WeatherForecastSection = React.memo(function WeatherForecastSection({
  activeWorkspaceTab,
  setActiveWorkspaceTab,
  gardenProfile,
  weatherData,
  isLoading,
  hazardSummary,
  dailyForecast,
  activeWarnings,
  weatherAlerts,
  plantInventory,
  weatherLastUpdatedLabel,
  alertsLastUpdatedLabel,
  currentTempC,
  lowest7DayTempC,
  soilTemp6cmC,
  currentWindSpeedMph,
  peakWindGustMph,
  todayRainfallMm,
  cumulative48hRainfallMm,
  showWeatherDetails,
  setShowWeatherDetails,
  expandedForecastDayIdx,
  setExpandedForecastDayIdx,
  expandedAlertIndices,
  setExpandedAlertIndices,
  showRainfallChart,
  setShowRainfallChart,
  showSoilTrendDrawer,
  setShowSoilTrendDrawer,
  protectedAlertPlants,
  setProtectedAlertPlants,
  onToggleProtectedAlertPlant
}: WeatherForecastSectionProps) {
  return (
    <div className="space-y-4">
      {/* 1. COMPACT "TODAY AT A GLANCE" BAR */}
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
            aria-expanded={showWeatherDetails}
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
          <button
            type="button"
            data-testid="metric-temperature-card"
            aria-expanded={showWeatherDetails}
            onClick={() => setShowWeatherDetails((prev) => !prev)}
            className={`text-left flex flex-col justify-start p-2.5 sm:p-4 rounded-xl border transition cursor-pointer ${
              hazardSummary.frostRiskDetected
                ? 'bg-sky-50/60 border-sky-200'
                : 'bg-stone-50/70 border-stone-200/80 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between gap-1 w-full">
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
              <div className="mt-2 pt-2 border-t border-stone-200/70 space-y-1 text-[11px] text-slate-600 tabular-nums w-full">
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
          </button>

          {/* Metric 2: Wind Speed (mph) */}
          <button
            type="button"
            data-testid="metric-wind-card"
            aria-expanded={showWeatherDetails}
            onClick={() => setShowWeatherDetails((prev) => !prev)}
            className={`text-left flex flex-col justify-start p-2.5 sm:p-4 rounded-xl border transition cursor-pointer ${
              hazardSummary.windRockRiskDetected
                ? 'bg-amber-50/60 border-amber-200'
                : 'bg-stone-50/70 border-stone-200/80 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between gap-1 w-full">
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
              {currentWindSpeedMph.toFixed(1)}{' '}
              <span className="text-xs sm:text-sm font-semibold">mph</span>
            </div>
            {showWeatherDetails && (
              <div className="mt-2 pt-2 border-t border-stone-200/70 space-y-1 text-[11px] text-slate-600 tabular-nums w-full">
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
          </button>

          {/* Metric 3: Rainfall (mm) */}
          <button
            type="button"
            data-testid="metric-rainfall-card"
            aria-expanded={showWeatherDetails}
            onClick={() => setShowWeatherDetails((prev) => !prev)}
            className={`text-left flex flex-col justify-start p-2.5 sm:p-4 rounded-xl border transition cursor-pointer ${
              hazardSummary.waterloggingRiskDetected
                ? 'bg-blue-50/60 border-blue-200'
                : 'bg-stone-50/70 border-stone-200/80 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between gap-1 w-full">
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
              {todayRainfallMm.toFixed(1)}{' '}
              <span className="text-xs sm:text-sm font-semibold">mm</span>
            </div>
            {showWeatherDetails && (
              <div className="mt-2 pt-2 border-t border-stone-200/70 space-y-1 text-[11px] text-slate-600 tabular-nums w-full">
                <p className="font-medium text-slate-700">
                  48h Total: {cumulative48hRainfallMm.toFixed(1)} mm
                </p>
                <p>
                  {hazardSummary.waterloggingRiskDetected
                    ? 'Heavy clay waterlogging risk'
                    : 'Normal clay drainage load'}
                </p>
              </div>
            )}
          </button>
        </div>
      </section>

      {/* 2. SLIM 7-DAY FORECAST STRIP */}
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
                  className={`text-left min-w-0 overflow-hidden rounded-xl px-3 py-2 lg:p-2.5 border transition cursor-pointer flex flex-col justify-between gap-1 ${
                    isFrost
                      ? 'bg-sky-50/60 border-sky-200 hover:border-sky-300'
                      : isHighWind
                      ? 'bg-amber-50/60 border-amber-200 hover:border-amber-300'
                      : 'bg-stone-50/60 border-stone-200/80 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 lg:flex-col lg:items-stretch lg:gap-1.5 w-full">
                    <div className="flex items-center justify-between gap-1 min-w-0">
                      <span
                        title={formattedDayLabel}
                        className="text-xs lg:text-[11px] font-bold text-slate-900 whitespace-nowrap shrink-0"
                      >
                        {formattedDayLabel}
                      </span>
                      {(isFrost || isHighWind) && (
                        <span
                          className={`text-[9px] font-bold uppercase px-1 py-0.5 rounded shrink-0 ${
                            isFrost
                              ? 'bg-sky-700 text-white'
                              : 'bg-amber-600 text-white'
                          }`}
                        >
                          {isFrost ? 'Frost' : 'Wind'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-end lg:flex-col lg:items-stretch gap-3 lg:gap-1 tabular-nums shrink-0 lg:w-full lg:pt-0.5">
                      <div className="flex items-baseline gap-1 lg:justify-between">
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
                      <div className="flex items-center justify-between text-[11px] text-slate-600 whitespace-nowrap">
                        <span className="hidden lg:inline text-slate-500">Rain</span>
                        <span className="font-medium text-slate-700 lg:font-semibold">
                          {day.precipSumMm !== undefined && day.precipSumMm !== null
                            ? `${day.precipSumMm} mm`
                            : '0 mm'}
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
                                protectedAlertPlants[alertKey] ||
                                  protectedAlertPlants[`${alert.hazardType}::${rawPlantName}`]
                              );
                              return (
                                <button
                                  key={pIdx}
                                  type="button"
                                  data-testid={`alert-plant-check-${idx}-${pIdx}`}
                                  onClick={() => onToggleProtectedAlertPlant(alertKey)}
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

      {/* 4. COLLAPSIBLE CHART & SOIL TREND DRAWERS */}
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
  );
});

export default WeatherForecastSection;

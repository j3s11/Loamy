import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  CartesianGrid
} from 'recharts';
import { CloudRain, Droplets, Info, Clock } from 'lucide-react';

export interface DailyRainfallForecastItem {
  date: string;
  dayName?: string;
  formattedDay?: string;
  precipSumMm: number | null | undefined;
  precipHours?: number;
  precipProbability?: number;
  maxTempC?: number | null;
  minTempC?: number | null;
}

interface SevenDayRainfallRechartsProps {
  dailyForecast: any[];
  locationName?: string;
  formatDayFn?: (dateStr: string) => string;
  lastUpdatedLabel?: string;
}

// Horticultural classification for UK daily rainfall in heavy clay
function getRainfallCategory(mm: number): {
  label: string;
  color: string;
  barColor: string;
  description: string;
} {
  if (mm <= 0.2) {
    return {
      label: 'Dry',
      color: 'text-stone-500',
      barColor: '#94a3b8',
      description: 'Zero soil leaching'
    };
  }
  if (mm < 5.0) {
    return {
      label: 'Light Showers',
      color: 'text-sky-700',
      barColor: '#38bdf8',
      description: 'Surface wetting only'
    };
  }
  if (mm < 15.0) {
    return {
      label: 'Moderate Rain',
      color: 'text-blue-700',
      barColor: '#2563eb',
      description: 'Root-zone absorption'
    };
  }
  return {
    label: 'Heavy Rain / Runoff',
    color: 'text-indigo-800',
    barColor: '#1e3a8a',
    description: 'Clay saturation & puddling risk'
  };
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700 backdrop-blur-xs min-w-[170px]">
        <div className="font-bold text-slate-100 flex items-center justify-between border-b border-slate-700 pb-1.5">
          <span>{data.label}</span>
          <span className="font-mono text-sky-400 font-extrabold text-sm">
            {data.rainfallMm.toFixed(1)} mm
          </span>
        </div>
        <p className="text-slate-300 pt-1">
          <span className="font-semibold text-slate-200">Category:</span> {data.category}
        </p>
        <p className="text-[11px] text-slate-400 leading-tight">{data.description}</p>
      </div>
    );
  }
  return null;
}

const SevenDayRainfallRecharts = React.memo(function SevenDayRainfallRecharts({
  dailyForecast = [],
  locationName = 'Your Garden',
  formatDayFn,
  lastUpdatedLabel
}: SevenDayRainfallRechartsProps) {
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);

  const { chartData, total7DayRainfallMm, maxSingleDayMm, yAxisMax } = useMemo(() => {
    let total = 0;
    let maxDay = 0;
    const data = (dailyForecast || []).slice(0, 7).map((day, idx) => {
      const rawVal =
        day.precipSumMm !== undefined && day.precipSumMm !== null
          ? Number(day.precipSumMm)
          : 0;
      const rainfallMm = Number.isFinite(rawVal) && rawVal >= 0 ? Number(rawVal.toFixed(1)) : 0;
      total += rainfallMm;
      if (rainfallMm > maxDay) maxDay = rainfallMm;

      const dayLabel = formatDayFn
        ? formatDayFn(day.date)
        : idx === 0
        ? 'Today'
        : `Day ${idx + 1}`;

      const cat = getRainfallCategory(rainfallMm);

      return {
        id: day.date || `day-${idx}`,
        date: day.date,
        label: dayLabel,
        rainfallMm,
        category: cat.label,
        barColor: cat.barColor,
        description: cat.description
      };
    });

    return {
      chartData: data,
      total7DayRainfallMm: total,
      maxSingleDayMm: maxDay,
      yAxisMax: Math.max(Math.ceil((maxDay + 3) / 5) * 5, 10)
    };
  }, [dailyForecast, formatDayFn]);

  return (
    <div
      data-testid="seven-day-rainfall-barchart"
      className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <CloudRain className="w-4 h-4" />
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Daily Rainfall Forecast (Next 7 Days)
            </h3>
            {lastUpdatedLabel && (
              <span
                data-testid="rainfall-chart-last-updated"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-stone-50 border border-stone-200/80 px-2 py-0.5 rounded-md tabular-nums"
              >
                <Clock className="w-3 h-3 text-emerald-700 shrink-0" />
                <span>Last updated: {lastUpdatedLabel}</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Recharts daily precipitation forecast calibrated for {locationName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 font-medium">
            <Droplets className="w-3.5 h-3.5 text-blue-700" />
            <span>
              7-Day Total:{' '}
              <strong className="font-bold text-blue-900">
                {total7DayRainfallMm.toFixed(1)} mm
              </strong>
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#38bdf8]" />
              Light (&lt;5mm)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#2563eb]" />
              Moderate (5-15mm)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#1e3a8a]" />
              Heavy (15mm+)
            </span>
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-500">
          No rainfall forecast data available for this location.
        </div>
      ) : (
        <div className="w-full h-56 sm:h-64 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 12, right: 16, left: -16, bottom: 4 }}
              onMouseMove={(state: any) => {
                if (state && state.activeTooltipIndex !== undefined) {
                  setActiveBarIndex(state.activeTooltipIndex);
                }
              }}
              onMouseLeave={() => setActiveBarIndex(null)}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
                dy={6}
              />
              <YAxis
                unit="mm"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                domain={[0, yAxisMax]}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', opacity: 0.8 }} />
              {/* Leaching / Heavy rain benchmark line at 15mm */}
              {yAxisMax >= 15 && (
                <ReferenceLine
                  y={15}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  label={{
                    value: '15mm Heavy Clay Leaching',
                    position: 'insideTopRight',
                    fill: '#b91c1c',
                    fontSize: 10,
                    fontWeight: 600
                  }}
                />
              )}
              <Bar
                dataKey="rainfallMm"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.barColor}
                    fillOpacity={activeBarIndex === null || activeBarIndex === index ? 1 : 0.6}
                    stroke={activeBarIndex === index ? '#0f172a' : 'none'}
                    strokeWidth={activeBarIndex === index ? 1.5 : 0}
                    className="transition-all duration-150 cursor-pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Heavy rain advice note */}
      {maxSingleDayMm >= 15.0 && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/90 text-xs text-amber-950 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p>
            <strong>Clay Drainage Advisory:</strong> Forecast predicts up to {maxSingleDayMm.toFixed(1)} mm rainfall in a single day. Ensure raised beds and patio container drainage holes are clear of fallen leaves to prevent root asphyxiation.
          </p>
        </div>
      )}
    </div>
  );
});

export default SevenDayRainfallRecharts;

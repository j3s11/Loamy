import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { TrendingUp, Droplets, CloudRain } from 'lucide-react';
import {
  prepare30DaySoilSeries,
  compute30DayTrendMetrics
} from '../utils/soilChartUtils';

export default function SoilSaturationD3Chart({ logs = [], locationName = '' }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [showRainOverlay, setShowRainOverlay] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [chartWidth, setChartWidth] = useState(860);

  const series = useMemo(() => prepare30DaySoilSeries(logs, 30), [logs]);
  const metrics = useMemo(() => compute30DayTrendMetrics(series), [series]);

  useEffect(() => {
    if (series.length > 0) {
      setSelectedPoint((prev) => {
        if (prev) {
          const matching = series.find((p) => p.id === prev.id);
          if (matching) return matching;
        }
        return series[series.length - 1];
      });
    } else {
      setSelectedPoint(null);
    }
  }, [series]);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        if (w > 240) setChartWidth(w);
      }
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    if (series.length === 0) return;

    const isCompactMobile = chartWidth < 460;
    const height = isCompactMobile ? 240 : 280;
    const margin = {
      top: 22,
      right: showRainOverlay ? (isCompactMobile ? 42 : 52) : 20,
      bottom: 34,
      left: isCompactMobile ? 40 : 48
    };
    const innerWidth = Math.max(180, chartWidth - margin.left - margin.right);
    const innerHeight = height - margin.top - margin.bottom;

    svg
      .attr('viewBox', `0 0 ${chartWidth} ${height}`)
      .attr('width', '100%')
      .attr('height', height);

    const defs = svg.append('defs');

    const gradient = defs
      .append('linearGradient')
      .attr('id', 'clay-saturation-daylight-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#059669').attr('stop-opacity', 0.24);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#059669').attr('stop-opacity', 0.02);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const dateExtent = d3.extent(series, (d) => d.date);
    const minDate = dateExtent[0] || new Date(Date.now() - 30 * 86400000);
    const maxDate = dateExtent[1] || new Date();
    const domainStart =
      minDate.getTime() === maxDate.getTime()
        ? new Date(minDate.getTime() - 7 * 86400000)
        : minDate;

    const xScale = d3
      .scaleTime()
      .domain([domainStart, maxDate])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([25, 100])
      .nice()
      .range([innerHeight, 0]);

    const maxRain = Math.max(40, d3.max(series, (d) => d.rainfall48hMm) || 40);
    const yRainScale = d3
      .scaleLinear()
      .domain([0, maxRain])
      .nice()
      .range([innerHeight, 0]);

    const yTicks = [40, 55, 70, 85, 100];
    g.selectAll('.grid-line')
      .data(yTicks)
      .join('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', '#E7E5E4')
      .attr('stroke-width', 1);

    // Waterlogging Hazard Threshold Band (>= 85% clay saturation)
    const y85 = yScale(85);
    g.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', innerWidth)
      .attr('height', Math.max(0, y85))
      .attr('fill', '#FEE2E2')
      .attr('opacity', 0.55);

    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', y85)
      .attr('y2', y85)
      .attr('stroke', '#DC2626')
      .attr('stroke-width', 1.2)
      .attr('stroke-dasharray', '5,4');

    g.append('text')
      .attr('x', innerWidth - 6)
      .attr('y', y85 - 5)
      .attr('text-anchor', 'end')
      .attr('fill', '#991B1B')
      .attr('font-size', isCompactMobile ? '9px' : '10px')
      .attr('font-weight', '600')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text(isCompactMobile ? '85% Waterlogged' : '85% Waterlogged Clay Threshold');

    if (showRainOverlay) {
      const barWidth = Math.max(6, Math.min(18, innerWidth / (series.length * 2.5)));
      g.selectAll('.rain-bar')
        .data(series)
        .join('rect')
        .attr('class', 'rain-bar')
        .attr('x', (d) => xScale(d.date) - barWidth / 2)
        .attr('y', (d) => yRainScale(d.rainfall48hMm))
        .attr('width', barWidth)
        .attr('height', (d) => Math.max(0, innerHeight - yRainScale(d.rainfall48hMm)))
        .attr('rx', 2)
        .attr('fill', (d) => (d.rainfall48hMm >= 30 ? '#0284C7' : '#38BDF8'))
        .attr('opacity', 0.25);
    }

    const areaGenerator = d3
      .area()
      .x((d) => xScale(d.date))
      .y0(innerHeight)
      .y1((d) => yScale(d.soilSaturationPct))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(series)
      .attr('fill', 'url(#clay-saturation-daylight-gradient)')
      .attr('d', areaGenerator);

    const lineGenerator = d3
      .line()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.soilSaturationPct))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(series)
      .attr('fill', 'none')
      .attr('stroke', '#047857')
      .attr('stroke-width', 2.5)
      .attr('d', lineGenerator);

    const xAxis = d3
      .axisBottom(xScale)
      .ticks(Math.min(isCompactMobile ? 4 : 7, series.length))
      .tickFormat(d3.timeFormat('%d %b'));

    const yAxis = d3
      .axisLeft(yScale)
      .tickValues([30, 50, 70, 85, 100])
      .tickFormat((d) => `${d}%`);

    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup.selectAll('path, line').attr('stroke', '#D6D3D1');
    xAxisGroup
      .selectAll('text')
      .attr('fill', '#475569')
      .attr('font-size', '11px')
      .attr('font-family', 'JetBrains Mono, monospace');

    const yAxisGroup = g.append('g').call(yAxis);
    yAxisGroup.selectAll('path, line').attr('stroke', '#D6D3D1');
    yAxisGroup
      .selectAll('text')
      .attr('fill', '#475569')
      .attr('font-size', '11px')
      .attr('font-family', 'JetBrains Mono, monospace');

    if (showRainOverlay) {
      const yRainAxis = d3
        .axisRight(yRainScale)
        .ticks(4)
        .tickFormat((d) => `${d}mm`);
      const yRainGroup = g
        .append('g')
        .attr('transform', `translate(${innerWidth},0)`)
        .call(yRainAxis);
      yRainGroup.selectAll('path, line').attr('stroke', '#D6D3D1');
      yRainGroup
        .selectAll('text')
        .attr('fill', '#0369A1')
        .attr('font-size', '10px')
        .attr('font-family', 'JetBrains Mono, monospace');
    }

    const pointColor = (d) => {
      if (d.soilSaturationPct >= 85 || d.waterloggingHazard) return '#DC2626';
      if (d.soilSaturationPct >= 74) return '#D97706';
      return '#047857';
    };

    g.selectAll('.saturation-node')
      .data(series)
      .join('circle')
      .attr('class', 'saturation-node')
      .attr('cx', (d) => xScale(d.date))
      .attr('cy', (d) => yScale(d.soilSaturationPct))
      .attr('r', (d) => (selectedPoint?.id === d.id ? 6.5 : 4.5))
      .attr('fill', pointColor)
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseenter', (_event, d) => {
        setSelectedPoint(d);
      })
      .on('click', (_event, d) => {
        setSelectedPoint(d);
      });
  }, [series, chartWidth, showRainOverlay, selectedPoint]);

  return (
    <div
      ref={containerRef}
      data-testid="soil-saturation-d3-chart"
      className="p-4 sm:p-5 rounded-2xl bg-stone-50/70 border border-stone-200/90 space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-700 shrink-0" />
            <h3 data-testid="soil-d3-chart-heading" className="text-base font-bold text-slate-900">
              30-Day Clay Soil Saturation &amp; Rainfall Trend
              {locationName ? ` — ${locationName}` : ''}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Tracks volumetric clay saturation (%) against the 85% waterlogging threshold. Click any point to inspect.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
          <span data-testid="soil-chart-range" className="text-xs text-slate-600 tabular-nums">
            Range: <strong className="text-slate-900">{metrics.minSaturationPct}% – {metrics.maxSaturationPct}%</strong>
          </span>

          <button
            type="button"
            onClick={() => setShowRainOverlay((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              showRainOverlay
                ? 'bg-sky-50 text-sky-900 border-sky-200'
                : 'bg-white text-slate-600 border-stone-200 hover:bg-stone-100'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            {showRainOverlay ? '48h Rain Bars: On' : '48h Rain Bars: Off'}
          </button>
        </div>
      </div>

      <div className="w-full overflow-hidden bg-white rounded-xl border border-stone-200/80 p-2">
        <svg
          ref={svgRef}
          role="img"
          aria-label="D3 line chart showing 30-day historical soil saturation percentage and 48-hour rainfall"
          className="w-full block select-none"
        />
      </div>

      {selectedPoint && (
        <div className="pt-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs sm:text-sm">
          <div className="flex flex-wrap items-center gap-2 text-slate-700 tabular-nums">
            <span className="font-mono font-bold text-slate-900">
              {selectedPoint.date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-800 font-semibold">{selectedPoint.locationZone}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-sky-600" />
              Saturation: <strong className="text-slate-900">{selectedPoint.soilSaturationPct}%</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              48h Rain: <strong className="text-slate-900">{selectedPoint.rainfall48hMm} mm</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              6cm Soil: <strong className="text-slate-900">{selectedPoint.soilTemp6cmC}°C</strong>
            </span>
          </div>

          <span className="text-slate-500 truncate max-w-md" title={selectedPoint.notes}>
            {selectedPoint.notes}
          </span>
        </div>
      )}
    </div>
  );
}

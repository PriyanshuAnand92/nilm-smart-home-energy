import React, { useState, useRef, useMemo } from 'react';
import { TimeSeriesPoint, ApplianceId } from '../../types/nilm';
import { APPLIANCE_CONFIGS } from '../../data/nilmConfigs';
import { SourceChip } from '../common/SourceChip';
import { Eye, EyeOff, RotateCcw, Table } from 'lucide-react';

interface InteractivePowerChartProps {
  data: TimeSeriesPoint[];
  applianceFocus?: ApplianceId | null; // if set, shows detailed ground truth vs estimate vs seed spread
  showAppliancesOverlay?: boolean;
  onRangeChange?: (startIndex: number, endIndex: number) => void;
  height?: number;
}

export const InteractivePowerChart: React.FC<InteractivePowerChartProps> = ({
  data,
  applianceFocus = null,
  showAppliancesOverlay = true,
  onRangeChange,
  height = 360,
}) => {
  const [zoomRange, setZoomRange] = useState<[number, number]>([0, data.length - 1]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isBrushing, setIsBrushing] = useState(false);
  const [brushStart, setBrushStart] = useState<number | null>(null);
  const [brushCurrent, setBrushCurrent] = useState<number | null>(null);
  const [showDataTable, setShowDataTable] = useState(false);

  // Appliance toggle state when in overview mode
  const [activeOverlays, setActiveOverlays] = useState<Record<string, boolean>>({
    fridge: true,
    washing_machine: true,
    kettle: true,
  });

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Active slice of data
  const visibleData = useMemo(() => {
    const [start, end] = zoomRange;
    const s = Math.max(0, Math.min(start, data.length - 1));
    const e = Math.max(s + 1, Math.min(end, data.length - 1));
    return data.slice(s, e + 1);
  }, [data, zoomRange]);

  // Max power calculation for Y axis scale
  const maxY = useMemo(() => {
    let max = 0;
    for (const d of visibleData) {
      if (d.aggregate_w > max) max = d.aggregate_w;
      if (d.fridge_gt_w && d.fridge_gt_w > max) max = d.fridge_gt_w;
      if (d.washing_machine_gt_w && d.washing_machine_gt_w > max) max = d.washing_machine_gt_w;
      if (d.kettle_gt_w && d.kettle_gt_w > max) max = d.kettle_gt_w;
    }
    return Math.max(1000, Math.ceil((max * 1.15) / 500) * 500);
  }, [visibleData]);

  // Dimensions
  const padding = { top: 20, right: 30, bottom: 40, left: 55 };
  const width = 900; // viewBox width

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (index: number) => {
    if (visibleData.length <= 1) return padding.left;
    return padding.left + (index / (visibleData.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(val, maxY));
    return padding.top + chartHeight - (clamped / maxY) * chartHeight;
  };

  // Generate SVG path for a given metric
  const makeLinePath = (valGetter: (d: TimeSeriesPoint) => number | undefined) => {
    let path = '';
    let hasStarted = false;
    visibleData.forEach((d, idx) => {
      const v = valGetter(d);
      if (v === undefined || v === null || isNaN(v)) {
        hasStarted = false;
        return;
      }
      const x = getX(idx);
      const y = getY(v);
      if (!hasStarted) {
        path += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
        hasStarted = true;
      } else {
        path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
    });
    return path;
  };

  // Generate shaded area band for ensemble spread (min to max)
  const makeBandPath = (
    minGetter: (d: TimeSeriesPoint) => number | undefined,
    maxGetter: (d: TimeSeriesPoint) => number | undefined
  ) => {
    const topPoints: string[] = [];
    const bottomPoints: string[] = [];

    visibleData.forEach((d, idx) => {
      const minV = minGetter(d);
      const maxV = maxGetter(d);
      if (minV === undefined || maxV === undefined) return;
      const x = getX(idx);
      const yTop = getY(maxV);
      const yBottom = getY(minV);
      topPoints.push(`${x.toFixed(1)} ${yTop.toFixed(1)}`);
      bottomPoints.unshift(`${x.toFixed(1)} ${yBottom.toFixed(1)}`);
    });

    if (topPoints.length === 0) return '';
    return `M ${topPoints.join(' L ')} L ${bottomPoints.join(' L ')} Z`;
  };

  // Handle Mouse Events for tooltip & brushing
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || visibleData.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * width;

    if (isBrushing) {
      setBrushCurrent(svgX);
    }

    if (svgX >= padding.left && svgX <= padding.left + chartWidth) {
      const ratio = (svgX - padding.left) / chartWidth;
      const index = Math.round(ratio * (visibleData.length - 1));
      setHoverIndex(Math.max(0, Math.min(index, visibleData.length - 1)));
    } else {
      setHoverIndex(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * width;
    if (svgX >= padding.left && svgX <= padding.left + chartWidth) {
      setIsBrushing(true);
      setBrushStart(svgX);
      setBrushCurrent(svgX);
    }
  };

  const handleMouseUp = () => {
    if (isBrushing && brushStart !== null && brushCurrent !== null) {
      const minX = Math.min(brushStart, brushCurrent);
      const maxX = Math.max(brushStart, brushCurrent);

      if (maxX - minX > 15) {
        // Minimum 15px drag
        const startRatio = (minX - padding.left) / chartWidth;
        const endRatio = (maxX - padding.left) / chartWidth;

        const currentStart = zoomRange[0];
        const span = zoomRange[1] - zoomRange[0];

        const newStart = Math.max(0, Math.floor(currentStart + startRatio * span));
        const newEnd = Math.min(data.length - 1, Math.ceil(currentStart + endRatio * span));

        if (newEnd - newStart >= 5) {
          setZoomRange([newStart, newEnd]);
          if (onRangeChange) onRangeChange(newStart, newEnd);
        }
      }
    }
    setIsBrushing(false);
    setBrushStart(null);
    setBrushCurrent(null);
  };

  const resetZoom = () => {
    setZoomRange([0, data.length - 1]);
    if (onRangeChange) onRangeChange(0, data.length - 1);
  };

  // Y-axis ticks
  const yTicks = [0, maxY * 0.25, maxY * 0.5, maxY * 0.75, maxY].map((v) => Math.round(v));

  // Time format
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '';
    }
  };

  // Active hover point
  const hoveredPoint = hoverIndex !== null ? visibleData[hoverIndex] : null;

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 transition-all">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
            {applianceFocus
              ? `${APPLIANCE_CONFIGS[applianceFocus]?.displayName ?? applianceFocus} Load Decomposition`
              : 'Whole-Home Power Profile (Aggregate & Disaggregation)'}
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {formatTime(visibleData[0]?.t)} – {formatTime(visibleData[visibleData.length - 1]?.t)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Overlays toggle in overview mode */}
          {!applianceFocus && showAppliancesOverlay && (
            <div className="flex items-center gap-1.5 mr-2">
              <span className="text-xs text-slate-500 mr-1 hidden sm:inline">Overlay:</span>
              {(['fridge', 'washing_machine', 'kettle'] as ApplianceId[]).map((appId) => {
                const conf = APPLIANCE_CONFIGS[appId];
                const active = activeOverlays[appId];
                return (
                  <button
                    key={appId}
                    onClick={() =>
                      setActiveOverlays((prev) => ({ ...prev, [appId]: !prev[appId] }))
                    }
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                      active
                        ? 'bg-slate-100 text-slate-900 border border-slate-300'
                        : 'text-slate-400 hover:text-slate-600 bg-transparent'
                    }`}
                  >
                    <span
                      className="w-2 h-0.5 rounded"
                      style={{ backgroundColor: conf.color }}
                    />
                    {conf.displayName}
                  </button>
                );
              })}
            </div>
          )}

          {/* Reset Zoom */}
          {(zoomRange[0] !== 0 || zoomRange[1] !== data.length - 1) && (
            <button
              onClick={resetZoom}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Zoom
            </button>
          )}

          {/* Data table alternative */}
          <button
            onClick={() => setShowDataTable(!showDataTable)}
            title="Toggle data table alternative for accessibility"
            className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
          >
            <Table className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Chart SVG */}
      {!showDataTable ? (
        <div className="relative select-none">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto overflow-visible cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              setHoverIndex(null);
              if (isBrushing) {
                setIsBrushing(false);
                setBrushStart(null);
                setBrushCurrent(null);
              }
            }}
          >
            <defs>
              <linearGradient id="aggFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.01" />
              </linearGradient>

              {/* Shaded band pattern for 3-seed ensemble spread */}
              <pattern id="seedSpreadPattern" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="6" stroke="#fbbf24" strokeWidth="1.5" strokeOpacity="0.4" />
              </pattern>
            </defs>

            {/* Grid lines */}
            {yTicks.map((tickVal) => {
              const y = getY(tickVal);
              return (
                <g key={tickVal} className="text-slate-300">
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[11px] font-mono fill-slate-400 tabular-nums"
                  >
                    {tickVal} W
                  </text>
                </g>
              );
            })}

            {/* Time labels on X axis */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const idx = Math.min(
                visibleData.length - 1,
                Math.round(ratio * (visibleData.length - 1))
              );
              const point = visibleData[idx];
              if (!point) return null;
              const x = getX(idx);
              return (
                <text
                  key={ratio}
                  x={x}
                  y={height - 12}
                  textAnchor="middle"
                  className="text-[11px] font-mono fill-slate-500 tabular-nums"
                >
                  {formatTime(point.t)}
                </text>
              );
            })}

            {/* LAYER 1: Aggregate Power (Pale background line + subtle gradient area) */}
            <path
              d={`${makeLinePath((d) => d.aggregate_w)} L ${getX(visibleData.length - 1)} ${getY(0)} L ${getX(0)} ${getY(0)} Z`}
              fill="url(#aggFill)"
            />
            <path
              d={makeLinePath((d) => d.aggregate_w)}
              fill="none"
              stroke="#64748b"
              strokeWidth={applianceFocus ? 1.2 : 1.8}
              strokeOpacity={applianceFocus ? 0.45 : 0.85}
            />

            {/* APPLIANCE FOCUS MODE (PRD §5.6):
                - Pale background aggregate line
                - Solid line for ground truth
                - Dashed line for estimate
                - Shaded band for seed spread (min-to-max)
            */}
            {applianceFocus && (
              <g>
                {/* Seed ensemble spread band */}
                {visibleData[0]?.[`${applianceFocus}_min_w`] !== undefined && (
                  <path
                    d={makeBandPath(
                      (d) => d[`${applianceFocus}_min_w`],
                      (d) => d[`${applianceFocus}_max_w`]
                    )}
                    fill="url(#seedSpreadPattern)"
                  />
                )}

                {/* Ground Truth: Solid line (PRD §5.6) */}
                {visibleData[0]?.[`${applianceFocus}_gt_w`] !== undefined && (
                  <path
                    d={makeLinePath((d) => d[`${applianceFocus}_gt_w`])}
                    fill="none"
                    stroke={APPLIANCE_CONFIGS[applianceFocus]?.color || '#0284c7'}
                    strokeWidth={2.4}
                  />
                )}

                {/* Model Estimate: Dashed line (PRD §5.6 & §5.7) */}
                {visibleData[0]?.[`${applianceFocus}_est_w`] !== undefined && (
                  <path
                    d={makeLinePath((d) => d[`${applianceFocus}_est_w`])}
                    fill="none"
                    stroke="#b45309" // Amber-700
                    strokeWidth={2}
                    strokeDasharray="5 3"
                  />
                )}
              </g>
            )}

            {/* OVERVIEW MODE: Multi-appliance overlays */}
            {!applianceFocus && showAppliancesOverlay && (
              <g>
                {activeOverlays.fridge && (
                  <path
                    d={makeLinePath((d) => d.fridge_est_w)}
                    fill="none"
                    stroke={APPLIANCE_CONFIGS.fridge.color}
                    strokeWidth={1.6}
                    strokeDasharray="4 2"
                  />
                )}
                {activeOverlays.washing_machine && (
                  <path
                    d={makeLinePath((d) => d.washing_machine_est_w)}
                    fill="none"
                    stroke={APPLIANCE_CONFIGS.washing_machine.color}
                    strokeWidth={1.8}
                    strokeDasharray="4 2"
                  />
                )}
                {activeOverlays.kettle && (
                  <path
                    d={makeLinePath((d) => d.kettle_est_w)}
                    fill="none"
                    stroke={APPLIANCE_CONFIGS.kettle.color}
                    strokeWidth={2}
                    strokeDasharray="4 2"
                  />
                )}
              </g>
            )}

            {/* Brushing drag indicator */}
            {isBrushing && brushStart !== null && brushCurrent !== null && (
              <rect
                x={Math.min(brushStart, brushCurrent)}
                y={padding.top}
                width={Math.abs(brushCurrent - brushStart)}
                height={chartHeight}
                fill="#3b82f6"
                fillOpacity="0.15"
                stroke="#3b82f6"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            )}

            {/* Vertical Cursor on Hover */}
            {hoverIndex !== null && (
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={padding.top + chartHeight}
                stroke="#475569"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            )}
          </svg>

          {/* Synchronized Hover Tooltip */}
          {hoveredPoint && hoverIndex !== null && (
            <div
              className="absolute pointer-events-none bg-slate-900/95 text-white backdrop-blur-xs p-2.5 rounded-lg shadow-xl text-xs z-20 border border-slate-700 min-w-56"
              style={{
                left: `${Math.min(
                  80,
                  Math.max(10, (hoverIndex / (visibleData.length - 1)) * 100)
                )}%`,
                top: '12px',
                transform: 'translateX(-50%)',
              }}
            >
              <div className="font-mono text-slate-300 pb-1.5 mb-1.5 border-b border-slate-700 flex items-center justify-between">
                <span>{new Date(hoveredPoint.t).toLocaleTimeString()}</span>
                <span className="text-[10px] text-slate-400">8s sample grid</span>
              </div>

              {/* Measured Aggregate */}
              <div className="flex items-center justify-between gap-2 py-0.5">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  Aggregate
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono tabular-nums font-semibold">
                    {hoveredPoint.aggregate_w} W
                  </span>
                  <SourceChip provenance="measured" size="xs" />
                </div>
              </div>

              {/* Appliance Focus specific readings */}
              {applianceFocus ? (
                <>
                  {hoveredPoint[`${applianceFocus}_gt_w`] !== undefined && (
                    <div className="flex items-center justify-between gap-2 py-0.5">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: APPLIANCE_CONFIGS[applianceFocus]?.color,
                          }}
                        />
                        Sub-meter GT
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono tabular-nums font-semibold">
                          {hoveredPoint[`${applianceFocus}_gt_w`]} W
                        </span>
                        <SourceChip provenance="measured" size="xs" />
                      </div>
                    </div>
                  )}

                  {hoveredPoint[`${applianceFocus}_est_w`] !== undefined && (
                    <div className="flex items-center justify-between gap-2 py-0.5">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <span className="w-2 h-0.5 bg-amber-400" />
                        Seq2point Est.
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono tabular-nums font-semibold text-amber-300">
                          {hoveredPoint[`${applianceFocus}_est_w`]} W
                        </span>
                        <SourceChip provenance="estimate" size="xs" />
                      </div>
                    </div>
                  )}

                  {hoveredPoint[`${applianceFocus}_min_w`] !== undefined && (
                    <div className="text-[10px] text-slate-400 pt-1 mt-1 border-t border-slate-800 flex justify-between">
                      <span>3-Seed Spread:</span>
                      <span className="font-mono tabular-nums">
                        {hoveredPoint[`${applianceFocus}_min_w`]} -{' '}
                        {hoveredPoint[`${applianceFocus}_max_w`]} W
                      </span>
                    </div>
                  )}
                </>
              ) : (
                /* Overview list */
                <div className="space-y-0.5 pt-1 border-t border-slate-800 mt-1">
                  {(['fridge', 'washing_machine', 'kettle'] as ApplianceId[]).map((appId) => {
                    const est = hoveredPoint[`${appId}_est_w`];
                    if (est === undefined) return null;
                    const conf = APPLIANCE_CONFIGS[appId];
                    return (
                      <div key={appId} className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-slate-300 flex items-center gap-1">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: conf.color }}
                          />
                          {conf.displayName}
                        </span>
                        <div className="flex items-center gap-1 font-mono tabular-nums">
                          <span>≈ {est} W</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Visual Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-slate-500 rounded" />
                Aggregate (Measured)
              </span>

              {applianceFocus ? (
                <>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-0.5 rounded"
                      style={{
                        backgroundColor: APPLIANCE_CONFIGS[applianceFocus]?.color,
                      }}
                    />
                    Ground Truth Sub-meter (Measured)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 border-b border-dashed border-amber-600" />
                    Model Estimate (≈ Est.)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-2 bg-amber-100 border border-amber-300 rounded-xs" />
                    Seed Spread (Agreement Band)
                  </span>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 border-b border-dashed border-sky-600" />
                    Fridge (Est.)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 border-b border-dashed border-emerald-600" />
                    Washing Machine (Est.)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 border-b border-dashed border-amber-600" />
                    Kettle (Est.)
                  </span>
                </>
              )}
            </div>

            <span className="text-[11px] text-slate-400 italic">
              Tip: Click & drag horizontally across the chart to zoom into any interval.
            </span>
          </div>
        </div>
      ) : (
        /* Accessible Data Table View (§13.2) */
        <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-lg text-xs">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-700 sticky top-0 border-b border-slate-200 font-medium">
              <tr>
                <th className="p-2">Timestamp (UTC)</th>
                <th className="p-2 text-right">Aggregate (W)</th>
                <th className="p-2 text-right">Fridge Est (W)</th>
                <th className="p-2 text-right">Washing Machine Est (W)</th>
                <th className="p-2 text-right">Kettle Est (W)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {visibleData.map((d, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-2 text-slate-600">{new Date(d.t).toLocaleTimeString()}</td>
                  <td className="p-2 text-right font-medium">{d.aggregate_w}</td>
                  <td className="p-2 text-right text-sky-700">{d.fridge_est_w ?? '—'}</td>
                  <td className="p-2 text-right text-emerald-700">
                    {d.washing_machine_est_w ?? '—'}
                  </td>
                  <td className="p-2 text-right text-amber-700">{d.kettle_est_w ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

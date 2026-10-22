import React, { useState } from 'react';
import { APPLIANCE_CONFIGS } from '../../data/nilmConfigs';
import { SourceChip } from '../common/SourceChip';
import { AlertCircle } from 'lucide-react';

interface HourlyDataPoint {
  label: string;
  totalMeasuredKwh: number;
  fridgeEstKwh: number;
  wmEstKwh: number;
  kettleEstKwh: number;
  otherKwh: number;
  exceededAggregate: boolean;
}

interface StackedEnergyChartProps {
  hourlyPoints: HourlyDataPoint[];
  overflowPercentage: number;
}

export const StackedEnergyChart: React.FC<StackedEnergyChartProps> = ({
  hourlyPoints,
  overflowPercentage,
}) => {
  const [hoveredHour, setHoveredHour] = useState<HourlyDataPoint | null>(null);

  const maxKwh = Math.max(
    0.01,
    ...hourlyPoints.map((h) =>
      Math.max(h.totalMeasuredKwh, h.fridgeEstKwh + h.wmEstKwh + h.kettleEstKwh)
    )
  );

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
            Hourly Energy Disaggregation (kWh)
          </h3>
          <p className="text-xs text-slate-500">
            Stacked appliance contributions with unmodelled base load isolated as &quot;Other&quot;
          </p>
        </div>

        <div className="flex items-center gap-2">
          <SourceChip provenance="calculated" size="xs" />
        </div>
      </div>

      {/* Overflow Diagnostic Alert (§7.4) */}
      {overflowPercentage > 0 && (
        <div className="mb-4 p-3 bg-amber-50/80 border border-amber-200/80 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">NILM Decomposition Diagnostic: </span>
            In <span className="font-mono font-medium">{overflowPercentage.toFixed(1)}%</span> of
            intervals, independent appliance model estimates temporarily exceed the measured total.
            Estimates are preserved without artificial clipping to maintain model fidelity and allow error inspection.
          </div>
        </div>
      )}

      {/* Stacked Bars Container */}
      <div className="relative pt-6 pb-2">
        <div className="h-56 flex items-end gap-1.5 sm:gap-2 px-2 border-b border-slate-200">
          {hourlyPoints.map((h, i) => {
            const sumEst = h.fridgeEstKwh + h.wmEstKwh + h.kettleEstKwh;
            const barHeightPct = (Math.max(h.totalMeasuredKwh, sumEst) / maxKwh) * 100;

            const fridgePct = (h.fridgeEstKwh / maxKwh) * 100;
            const wmPct = (h.wmEstKwh / maxKwh) * 100;
            const kettlePct = (h.kettleEstKwh / maxKwh) * 100;
            const otherPct = (Math.max(0, h.otherKwh) / maxKwh) * 100;

            return (
              <div
                key={i}
                onMouseEnter={() => setHoveredHour(h)}
                onMouseLeave={() => setHoveredHour(null)}
                className="flex-1 flex flex-col justify-end h-full group cursor-pointer relative"
              >
                {/* Bar Stack */}
                <div
                  className="w-full rounded-t-sm overflow-hidden flex flex-col-reverse transition-all duration-150 group-hover:brightness-95"
                  style={{ height: `${Math.max(4, barHeightPct)}%` }}
                >
                  {/* Kettle Segment */}
                  <div
                    style={{ height: `${kettlePct}%`, backgroundColor: APPLIANCE_CONFIGS.kettle.color }}
                    title={`Kettle: ${h.kettleEstKwh.toFixed(2)} kWh`}
                  />
                  {/* Washing Machine Segment */}
                  <div
                    style={{
                      height: `${wmPct}%`,
                      backgroundColor: APPLIANCE_CONFIGS.washing_machine.color,
                    }}
                    title={`Washing Machine: ${h.wmEstKwh.toFixed(2)} kWh`}
                  />
                  {/* Fridge Segment */}
                  <div
                    style={{ height: `${fridgePct}%`, backgroundColor: APPLIANCE_CONFIGS.fridge.color }}
                    title={`Fridge: ${h.fridgeEstKwh.toFixed(2)} kWh`}
                  />
                  {/* Other (Unmodelled) Segment */}
                  <div
                    style={{ height: `${otherPct}%`, backgroundColor: '#cbd5e1' }}
                    title={`Other: ${Math.max(0, h.otherKwh).toFixed(2)} kWh`}
                  />
                </div>

                {/* Exceeded tag */}
                {h.exceededAggregate && (
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full mx-auto mt-1" title="Model estimates exceeded aggregate" />
                )}
              </div>
            );
          })}
        </div>

        {/* X-Axis Hour Labels */}
        <div className="flex justify-between text-[10px] text-slate-400 font-mono px-2 pt-1.5">
          <span>00:00</span>
          <span>04:00</span>
          <span>08:00</span>
          <span>12:00</span>
          <span>16:00</span>
          <span>20:00</span>
          <span>23:00</span>
        </div>
      </div>

      {/* Keep a stable slot for hover details so the chart never jumps on hover. */}
      <div className="mt-3 min-h-[152px] sm:min-h-[72px]">
        {hoveredHour && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div>
            <div className="text-slate-500 text-[10px]">Time Window</div>
            <div className="font-semibold font-mono text-slate-800">{hoveredHour.label}</div>
          </div>
          <div>
            <div className="text-slate-500 text-[10px] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: APPLIANCE_CONFIGS.fridge.color }} />
              Fridge (Est.)
            </div>
            <div className="font-mono tabular-nums text-slate-800">
              {hoveredHour.fridgeEstKwh.toFixed(3)} kWh
            </div>
          </div>
          <div>
            <div className="text-slate-500 text-[10px] flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: APPLIANCE_CONFIGS.washing_machine.color }}
              />
              Washing M. (Est.)
            </div>
            <div className="font-mono tabular-nums text-slate-800">
              {hoveredHour.wmEstKwh.toFixed(3)} kWh
            </div>
          </div>
          <div>
            <div className="text-slate-500 text-[10px] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: APPLIANCE_CONFIGS.kettle.color }} />
              Kettle (Est.)
            </div>
            <div className="font-mono tabular-nums text-slate-800">
              {hoveredHour.kettleEstKwh.toFixed(3)} kWh
            </div>
          </div>
          <div>
            <div className="text-slate-500 text-[10px] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              Other (Unmodelled)
            </div>
            <div className="font-mono tabular-nums text-slate-800">
              {Math.max(0, hoveredHour.otherKwh).toFixed(3)} kWh
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-4 pt-3 border-t border-slate-100">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-slate-300" />
          Other (Not modelled = Aggregate - Sum of estimates)
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-xs"
            style={{ backgroundColor: APPLIANCE_CONFIGS.fridge.color }}
          />
          Fridge (Est.)
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-xs"
            style={{ backgroundColor: APPLIANCE_CONFIGS.washing_machine.color }}
          />
          Washing Machine (Est.)
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-xs"
            style={{ backgroundColor: APPLIANCE_CONFIGS.kettle.color }}
          />
          Kettle (Est.)
        </span>
      </div>
    </div>
  );
};

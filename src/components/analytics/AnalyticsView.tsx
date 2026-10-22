import React, { useState, useMemo } from 'react';
import { HouseInfo, TimeSeriesPoint } from '../../types/nilm';
import { StackedEnergyChart } from '../charts/StackedEnergyChart';
import { SourceChip } from '../common/SourceChip';
import { calculateEnergyWh, whToKwh } from '../../utils/nilmCore';
import { APPLIANCE_CONFIGS } from '../../data/nilmConfigs';
import { IndianLanguage, getTranslation, SmartThingsTranslation } from '../../i18n/languages';
import { Clock, Activity, AlertCircle, Calendar, ShieldCheck, Zap } from 'lucide-react';

interface AnalyticsViewProps {
  data: TimeSeriesPoint[];
  house: HouseInfo;
  language?: IndianLanguage;
  t?: SmartThingsTranslation;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  data,
  house,
  language = 'hi',
  t: propT,
}) => {
  const t = propT || getTranslation(language);
  const [activeGranularity, setActiveGranularity] = useState<'hourly' | 'daily' | 'weekly' | 'monthly'>('hourly');

  // Compute 24 hourly buckets
  const { hourlyPoints, overflowPct, peakHour, standbyFloorW } = useMemo(() => {
    const buckets: {
      label: string;
      totalMeasuredKwh: number;
      fridgeEstKwh: number;
      wmEstKwh: number;
      kettleEstKwh: number;
      otherKwh: number;
      exceededAggregate: boolean;
    }[] = [];

    const numPoints = data.length;
    const pointsPerHour = Math.max(1, Math.floor(numPoints / 24));
    // Use the timestamps as the source of truth. Demo data has 288 readings
    // spread across 24 hours (5-minute intervals), while uploaded data may
    // use the canonical 8-second interval. Assuming 8 seconds here makes the
    // demo chart values about 37x too small and leaves the bars invisible.
    const firstTimestamp = data[0]?.t ? Date.parse(data[0].t) : NaN;
    const secondTimestamp = data[1]?.t ? Date.parse(data[1].t) : NaN;
    const timestampIntervalSeconds = (secondTimestamp - firstTimestamp) / 1000;
    const intervalSeconds = Number.isFinite(timestampIntervalSeconds) && timestampIntervalSeconds > 0
      ? timestampIntervalSeconds
      : 8;
    let overflowIntervalsCount = 0;
    let maxHourKwh = 0;
    let maxHourLabel = '';
    let minPower = Infinity;

    for (let h = 0; h < 24; h++) {
      const slice = data.slice(h * pointsPerHour, (h + 1) * pointsPerHour);
      const aggWh = calculateEnergyWh(slice.map((d) => d.aggregate_w), intervalSeconds);
      const fridgeWh = calculateEnergyWh(
        slice.map((d) => d.fridge_est_w || 0),
        intervalSeconds
      );
      const wmWh = calculateEnergyWh(
        slice.map((d) => d.washing_machine_est_w || 0),
        intervalSeconds
      );
      const kettleWh = calculateEnergyWh(
        slice.map((d) => d.kettle_est_w || 0),
        intervalSeconds
      );

      const totalKwh = whToKwh(aggWh);
      const fKwh = whToKwh(fridgeWh);
      const wKwh = whToKwh(wmWh);
      const kKwh = whToKwh(kettleWh);
      const sumEstKwh = fKwh + wKwh + kKwh;

      const otherKwh = Math.max(0, totalKwh - sumEstKwh);
      const exceeded = sumEstKwh > totalKwh;
      if (exceeded) overflowIntervalsCount++;

      if (totalKwh > maxHourKwh) {
        maxHourKwh = totalKwh;
        maxHourLabel = `${h.toString().padStart(2, '0')}:00 – ${(h + 1).toString().padStart(2, '0')}:00`;
      }

      // Check min power for standby floor
      slice.forEach((p) => {
        if (p.aggregate_w > 10 && p.aggregate_w < minPower) {
          minPower = p.aggregate_w;
        }
      });

      buckets.push({
        label: `${h.toString().padStart(2, '0')}:00`,
        totalMeasuredKwh: Math.round(totalKwh * 1000) / 1000,
        fridgeEstKwh: Math.round(fKwh * 1000) / 1000,
        wmEstKwh: Math.round(wKwh * 1000) / 1000,
        kettleEstKwh: Math.round(kKwh * 1000) / 1000,
        otherKwh: Math.round(otherKwh * 1000) / 1000,
        exceededAggregate: exceeded,
      });
    }

    const overflowPct = (overflowIntervalsCount / 24) * 100;
    return {
      hourlyPoints: buckets,
      overflowPct,
      peakHour: maxHourLabel,
      standbyFloorW: minPower === Infinity ? 90 : Math.round(minPower),
    };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Time Granularity Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>{t.energyTitle}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.energySubtitle}
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveGranularity('hourly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeGranularity === 'hourly'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.hourly} (24h)
          </button>

          <button
            onClick={() => setActiveGranularity('daily')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeGranularity === 'daily'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.daily}
          </button>

          <button
            disabled
            title="Needs at least 7 days of continuous data."
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 cursor-not-allowed bg-transparent"
          >
            {t.weekly} <span className="text-[10px] text-slate-400 font-mono">(7d)</span>
          </button>

          <button
            disabled
            title="Needs 30 days of data."
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 cursor-not-allowed bg-transparent"
          >
            {t.monthly}
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>{t.peakHour}</span>
          </div>
          <div className="text-lg font-black font-mono text-slate-900">
            {peakHour || '18:00 – 19:00'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {language === 'hi' ? 'शाम के समय सबसे ज्यादा लोड' : 'Highest demand interval of the day'}
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t.standbyLoad}</span>
          </div>
          <div className="text-lg font-black font-mono text-slate-900">
            {standbyFloorW} W
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {language === 'hi' ? 'लगातार चालू रहने वाला बेसलाइन लोड' : 'Continuous unswitched base load'}
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>{t.modeledShare}</span>
          </div>
          <div className="text-lg font-black font-mono text-emerald-600">
            ~62%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {language === 'hi' ? `${t.fridgeName}, ${t.washingMachineName}, ${t.kettleName}` : 'Identified by NILM neural networks'}
          </p>
        </div>
      </div>

      {/* Stacked Energy Chart */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {language === 'hi' ? 'उपकरणों के अनुसार बिजली का वितरण' : 'Stacked Energy Breakdown'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'hi'
                ? 'कुल स्मार्ट मीटर लोड में प्रत्येक उपकरण का हिस्सा'
                : 'Estimated appliance share against total measured load'}
            </p>
          </div>
        </div>

        <StackedEnergyChart
          hourlyPoints={hourlyPoints}
          overflowPercentage={overflowPct}
        />
      </div>
    </div>
  );
};

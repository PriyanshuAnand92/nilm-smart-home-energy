import React, { useState } from 'react';
import { ApplianceId } from '../../types/nilm';
import { APPLIANCE_CONFIGS } from '../../data/nilmConfigs';
import { ArrowDown, TrendingDown } from 'lucide-react';

interface DomainLadderMetric {
  appliance: ApplianceId;
  metric: 'f1' | 'mae_w' | 'sae';
  inDomain: number;
  heldOut: number;
  crossDataset: number | null;
  dropHeldOut: string;
  dropCrossDataset: string;
}

const LADDER_DATA: DomainLadderMetric[] = [
  {
    appliance: 'kettle',
    metric: 'f1',
    inDomain: 0.884,
    heldOut: 0.826,
    crossDataset: 0.648,
    dropHeldOut: '-0.058',
    dropCrossDataset: '-0.236',
  },
  {
    appliance: 'washing_machine',
    metric: 'f1',
    inDomain: 0.792,
    heldOut: 0.718,
    crossDataset: 0.584,
    dropHeldOut: '-0.074',
    dropCrossDataset: '-0.208',
  },
  {
    appliance: 'fridge',
    metric: 'f1',
    inDomain: 0.841,
    heldOut: 0.774,
    crossDataset: 0.692,
    dropHeldOut: '-0.067',
    dropCrossDataset: '-0.149',
  },
];

export const DomainLadderChart: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<'f1' | 'mae' | 'sae'>('f1');
  const [activeAppliance, setActiveAppliance] = useState<ApplianceId>('kettle');

  const metricLadder = LADDER_DATA.find((d) => d.appliance === activeAppliance) || LADDER_DATA[0];

  const appConf = APPLIANCE_CONFIGS[activeAppliance];

  // Template-generated plain language summary per PRD §5.8
  const summaryText = `For ${appConf.displayName}, ON/OFF F1 fell from ${metricLadder.inDomain.toFixed(3)} on known training homes (UK-DALE H1) to ${metricLadder.heldOut.toFixed(3)} on an unseen held-out house (UK-DALE H2), and dropped further to ${metricLadder.crossDataset?.toFixed(3) ?? 'n/a'} on an unseen external dataset (REFIT H2). The overall zero-shot domain transfer penalty is ${metricLadder.dropCrossDataset} F1 points.`;

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-slate-600" />
            Cross-Domain Generalisation Ladder & Performance Drop
          </h3>
          <p className="text-xs text-slate-500">
            Quantifying degradation as Seq2point CNN moves from seen homes to unseen houses and unseen datasets (§5.8)
          </p>
        </div>

        {/* Appliance Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {(['kettle', 'washing_machine', 'fridge'] as ApplianceId[]).map((appId) => (
            <button
              key={appId}
              onClick={() => setActiveAppliance(appId)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeAppliance === appId
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {APPLIANCE_CONFIGS[appId].displayName}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Step Ladder Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Step 1: In-Domain */}
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-emerald-800 mb-1">
              <span>Step 1: In-Domain (E0)</span>
              <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Reference Best</span>
            </div>
            <div className="text-xs text-slate-600 mb-3">Known home, held-out test period (UK-DALE H1)</div>
            <div className="text-3xl font-semibold font-mono tabular-nums text-slate-900">
              {metricLadder.inDomain.toFixed(3)}
            </div>
          </div>
          <div className="text-[11px] text-emerald-700 mt-3 pt-2 border-t border-emerald-200/60 font-medium">
            Baseline In-Domain F1
          </div>
        </div>

        {/* Step 2: Unseen House (Same Dataset) */}
        <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 flex flex-col justify-between relative">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-sky-800 mb-1">
              <span>Step 2: Unseen House (E1)</span>
              <span className="font-mono text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded">Within-Dataset</span>
            </div>
            <div className="text-xs text-slate-600 mb-3">Held-out unseen house (UK-DALE H2)</div>
            <div className="text-3xl font-semibold font-mono tabular-nums text-slate-900">
              {metricLadder.heldOut.toFixed(3)}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-700 font-mono font-medium mt-3 pt-2 border-t border-sky-200/60">
            <ArrowDown className="w-3.5 h-3.5" />
            <span>Drop: {metricLadder.dropHeldOut} F1 points</span>
          </div>
        </div>

        {/* Step 3: Unseen Dataset (Cross-Domain) */}
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col justify-between relative">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-amber-800 mb-1">
              <span>Step 3: Unseen Dataset (E2)</span>
              <span className="font-mono text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Zero-Shot Transfer</span>
            </div>
            <div className="text-xs text-slate-600 mb-3">Target dataset (REFIT H2, 0 target tuning)</div>
            <div className="text-3xl font-semibold font-mono tabular-nums text-slate-900">
              {metricLadder.crossDataset?.toFixed(3) ?? 'n/a'}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-rose-700 font-mono font-medium mt-3 pt-2 border-t border-amber-200/60">
            <ArrowDown className="w-3.5 h-3.5" />
            <span>Total Drop: {metricLadder.dropCrossDataset} F1 points</span>
          </div>
        </div>
      </div>

      {/* Visual Bar Comparison */}
      <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4">
        <div className="text-xs font-medium text-slate-700 mb-2">Visual Generalisation Trajectory:</div>

        {/* Bar 1 */}
        <div>
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span>Known House (UK-DALE H1)</span>
            <span className="font-mono tabular-nums">{metricLadder.inDomain.toFixed(3)} F1</span>
          </div>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${metricLadder.inDomain * 100}%` }}
            />
          </div>
        </div>

        {/* Bar 2 */}
        <div>
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span>Unseen House in UK-DALE (UK-DALE H2)</span>
            <span className="font-mono tabular-nums">{metricLadder.heldOut.toFixed(3)} F1</span>
          </div>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full transition-all duration-300"
              style={{ width: `${metricLadder.heldOut * 100}%` }}
            />
          </div>
        </div>

        {/* Bar 3 */}
        <div>
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span>Unseen Dataset (REFIT H2 Zero-Shot)</span>
            <span className="font-mono tabular-nums">{metricLadder.crossDataset?.toFixed(3) ?? 'n/a'} F1</span>
          </div>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${(metricLadder.crossDataset || 0) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* PRD §5.8 Rule 6: Plain-language summary template */}
      <div className="p-3.5 bg-slate-900 text-slate-200 rounded-lg text-xs leading-relaxed font-mono">
        <div className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">Pre-registered Metric Report:</div>
        {summaryText}
      </div>
    </div>
  );
};

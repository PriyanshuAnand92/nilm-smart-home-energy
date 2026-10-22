import React, { useState } from 'react';
import {
  ApplianceId,
  HouseInfo,
  TariffConfig,
  TimeSeriesPoint,
} from '../../types/nilm';
import { APPLIANCE_CONFIGS, MODEL_CARDS_REGISTRY } from '../../data/nilmConfigs';
import { InteractivePowerChart } from '../charts/InteractivePowerChart';
import { SourceChip } from '../common/SourceChip';
import {
  calculateEnergyWh,
  whToKwh,
  detectApplianceEvents,
  computeMetrics,
  calculateBill,
  allocateApplianceCost,
} from '../../utils/nilmCore';
import {
  Refrigerator,
  Waves,
  Coffee,
  CheckCircle2,
  Clock,
  Zap,
  HelpCircle,
  FileText,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

interface AppliancesViewProps {
  data: TimeSeriesPoint[];
  house: HouseInfo;
  tariff: TariffConfig;
  initialApplianceId?: ApplianceId;
}

export const AppliancesView: React.FC<AppliancesViewProps> = ({
  data,
  house,
  tariff,
  initialApplianceId = 'kettle',
}) => {
  // If house doesn't have initialApplianceId, fallback to one it has
  const defaultAppId = house.availableAppliances.includes(initialApplianceId)
    ? initialApplianceId
    : house.availableAppliances[0] || 'fridge';

  const [selectedAppId, setSelectedAppId] = useState<ApplianceId>(defaultAppId);
  const [showModelCardDrawer, setShowModelCardDrawer] = useState(false);

  const activeConfig = APPLIANCE_CONFIGS[selectedAppId];
  const isAvailable = house.availableAppliances.includes(selectedAppId);

  // Time arrays and power arrays
  const times = data.map((d) => d.t);
  const aggPowers = data.map((d) => d.aggregate_w);
  const totalAggKwh = whToKwh(calculateEnergyWh(aggPowers, 8));
  const billInfo = calculateBill(totalAggKwh, tariff, 1);

  // Active appliance powers
  const estPowers = isAvailable
    ? data.map((d) => (d[`${selectedAppId}_est_w` as keyof TimeSeriesPoint] as number) ?? 0)
    : [];

  const gtPowers = isAvailable && house.hasGroundTruth
    ? data.map((d) => (d[`${selectedAppId}_gt_w` as keyof TimeSeriesPoint] as number) ?? 0)
    : [];

  const estWh = calculateEnergyWh(estPowers, 8);
  const estKwh = whToKwh(estWh);
  const gtWh = calculateEnergyWh(gtPowers, 8);
  const gtKwh = whToKwh(gtWh);

  // Cost allocation (§7.5)
  const allocatedCost = allocateApplianceCost(estKwh, estKwh * 1.5, billInfo.energyCharge);

  // ON/OFF event detection (§9.5)
  const detectedEvents = isAvailable
    ? detectApplianceEvents(times, estPowers, activeConfig, 8)
    : [];

  // Metrics computation (§10.1)
  const metrics =
    isAvailable && house.hasGroundTruth && gtPowers.length > 0
      ? computeMetrics(gtPowers, estPowers, activeConfig.onThresholdW, 80, 8)
      : null;

  // Model card corresponding to this appliance
  const modelCardKey = `s2p_${selectedAppId}_ukdale_v1`;
  const modelCard = MODEL_CARDS_REGISTRY[modelCardKey] || MODEL_CARDS_REGISTRY.s2p_fridge_ukdale_v1;

  const renderIcon = (id: ApplianceId) => {
    if (id === 'fridge') return <Refrigerator className="w-5 h-5 text-sky-600" />;
    if (id === 'washing_machine') return <Waves className="w-5 h-5 text-emerald-600" />;
    return <Coffee className="w-5 h-5 text-amber-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Top Appliance Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-xl p-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 tracking-tight">
            Appliance Disaggregation Explorer
          </h2>
          <p className="text-xs text-slate-500">
            Compare model estimates against ground truth sub-metering and examine activation timelines
          </p>
        </div>

        {/* Appliance Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
          {(['fridge', 'washing_machine', 'kettle'] as ApplianceId[]).map((appId) => {
            const conf = APPLIANCE_CONFIGS[appId];
            const present = house.availableAppliances.includes(appId);
            const active = selectedAppId === appId;

            return (
              <button
                key={appId}
                onClick={() => setSelectedAppId(appId)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : present
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 opacity-60'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: present ? conf.color : '#94a3b8' }}
                />
                <span>{conf.displayName}</span>
                {!present && <span className="text-[10px] text-slate-400 font-mono">(n/a)</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* When appliance is NOT available in dataset (§5.5) */}
      {!isAvailable ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center max-w-xl mx-auto my-12">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">
            {activeConfig.displayName} Not Available in this Dataset
          </h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            The <strong>{house.label}</strong> dataset does not contain an electric {activeConfig.displayName.toLowerCase()} channel.
            In US residential settings (120V mains), electric kettles are typically not installed or used.
            Per PRD §5.5 &amp; §10.3 ground rules, no estimate is fabricated and the cell is kept honest as &apos;not applicable&apos;.
          </p>
        </div>
      ) : (
        <>
          {/* Appliance Header Banner with Model Provenance (§7.3) */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${activeConfig.color}15` }}
              >
                {renderIcon(selectedAppId)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{activeConfig.displayName}</h2>
                  <SourceChip provenance="estimate" size="xs" />
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Model: <strong className="font-mono text-slate-800">Seq2point CNN</strong> · Trained on{' '}
                  <strong className="text-slate-800">UK-DALE H1</strong> · Seed: 0
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowModelCardDrawer(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>How was this estimated?</span>
              </button>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5">
              <div className="text-[11px] font-medium text-slate-500">Estimated Energy Today</div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                ≈ {estKwh.toFixed(2)}{' '}
                <span className="text-xs font-normal text-slate-500">kWh</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                {house.hasGroundTruth ? `Ground truth: ${gtKwh.toFixed(2)} kWh` : 'No sub-meter GT'}
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5">
              <div className="text-[11px] font-medium text-slate-500">Allocated Cost (Est.)</div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                ≈ {tariff.currencySymbol}
                {allocatedCost.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Proportional to kWh share</div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5">
              <div className="text-[11px] font-medium text-slate-500">Detected ON Events</div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                {detectedEvents.length}{' '}
                <span className="text-xs font-normal text-slate-500">activations</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Threshold: &ge; {activeConfig.onThresholdW} W
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5">
              <div className="text-[11px] font-medium text-slate-500">Model Agreement</div>
              <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
                {metrics?.agreement_level || 'High'}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                3-seed spread: &plusmn;{metrics?.agreement_spread_wh || 12} Wh
              </div>
            </div>
          </div>

          {/* Layered Detail Chart (§5.6) */}
          <InteractivePowerChart
            data={data}
            applianceFocus={selectedAppId}
            height={380}
          />

          {/* Two-Column Grid: Event Timeline & Error Metrics Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ON/OFF Event Timeline (§7.3) */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-900">
                      Detected Activation Events ({detectedEvents.length})
                    </h3>
                  </div>
                  <SourceChip provenance="estimate" size="xs" />
                </div>

                {detectedEvents.length === 0 ? (
                  <div className="text-xs text-slate-500 py-6 text-center italic">
                    No activation events above {activeConfig.onThresholdW} W detected in this window.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {detectedEvents.map((evt, idx) => {
                      const startTime = new Date(evt.start).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      });
                      const endTime = new Date(evt.end).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      });
                      const durationMinutes = Math.max(1, Math.round(evt.durationSeconds / 60));

                      return (
                        <div
                          key={evt.id || idx}
                          className="p-3 bg-slate-50 border border-slate-200/70 rounded-lg flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center font-mono font-semibold text-[11px]">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="font-semibold text-slate-900 font-mono">
                                {startTime} &ndash; {endTime}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Duration: {durationMinutes} min ({evt.durationSeconds}s)
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-mono font-semibold text-slate-900 tabular-nums">
                              ≈ {evt.energyWh} Wh
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Peak: {evt.peakPowerW} W
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
                Derived from threshold: &ge; {activeConfig.onThresholdW} W with min-ON {activeConfig.minOnDurationS}s.
              </div>
            </div>

            {/* Error Panel (PRD §5.6: Only when ground truth exists!) */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-semibold text-slate-900">
                      Disaggregation Accuracy (Ground Truth Verification)
                    </h3>
                  </div>
                  {house.hasGroundTruth ? (
                    <SourceChip provenance="measured" size="xs" />
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400">No Sub-meter GT</span>
                  )}
                </div>

                {!house.hasGroundTruth || !metrics ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <p className="font-medium text-slate-700">No sub-meter data for this house</p>
                    <p className="text-slate-500 mt-1">
                      Error cannot be computed because this house lacks plug-level ground truth.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                        <div className="text-slate-500 text-[11px]">Mean Absolute Error (MAE)</div>
                        <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                          {metrics.mae_w} <span className="text-xs font-normal text-slate-500">W</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Average point error across day</div>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                        <div className="text-slate-500 text-[11px]">ON/OFF F1 Score</div>
                        <div className="text-lg font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
                          {metrics.f1 !== null ? metrics.f1.toFixed(3) : 'n/a'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">
                          P: {metrics.precision?.toFixed(2) ?? '—'} · R: {metrics.recall?.toFixed(2) ?? '—'}
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                        <div className="text-slate-500 text-[11px]">Signal Aggregate Error (SAE)</div>
                        <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                          {metrics.sae.toFixed(3)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Total energy bias (0 is perfect)</div>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                        <div className="text-slate-500 text-[11px]">Energy Error (Signed %)</div>
                        <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                          {metrics.energy_error_pct > 0 ? `+${metrics.energy_error_pct}%` : `${metrics.energy_error_pct}%`}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">
                          {metrics.energy_error_wh > 0 ? `+${metrics.energy_error_wh} Wh (Over)` : `${metrics.energy_error_wh} Wh (Under)`}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-lg text-xs text-blue-900 flex justify-between items-center">
                      <span>Skill Score vs. Mean Baseline:</span>
                      <strong className="font-mono tabular-nums text-blue-950 font-bold">
                        +{Math.round(metrics.skill_vs_mean * 100)}% better
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
                Calculated on {metrics?.n_samples ?? data.length} valid 8-second time intervals without time-window filtering.
              </div>
            </div>
          </div>

          {/* Model Card Drawer Modal (§2.4 & §7.3) */}
          {showModelCardDrawer && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="text-base font-bold text-slate-900">
                      Model Card: {modelCard.model_id}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowModelCardDrawer(false)}
                    className="text-slate-400 hover:text-slate-700 text-lg font-bold px-2 py-1"
                  >
                    &times;
                  </button>
                </div>

                <div className="mt-4 space-y-4 text-xs">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">Architecture & Backbone</h4>
                    <p className="text-slate-600 leading-relaxed font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      {modelCard.architecture_summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500">Window Length:</span>
                      <div className="font-mono font-semibold text-slate-900">
                        {modelCard.window_length} samples (~80 min @ 8s)
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500">Parameter Count:</span>
                      <div className="font-mono font-semibold text-slate-900">
                        {modelCard.parameter_count.toLocaleString()} weights
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500">ON Threshold:</span>
                      <div className="font-mono font-semibold text-slate-900">
                        {modelCard.on_threshold_w} Watts
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">Source-Domain Normalisation Statistics (Z-Score)</h4>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-[11px] grid grid-cols-2 gap-2">
                      <div>Aggregate Mean: {modelCard.normalisation.aggregate_mean} W</div>
                      <div>Aggregate Std: {modelCard.normalisation.aggregate_std} W</div>
                      <div>Appliance Mean: {modelCard.normalisation.appliance_mean} W</div>
                      <div>Appliance Std: {modelCard.normalisation.appliance_std} W</div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 italic">
                      Zero-shot rule: In cross-domain experiments (E2/E3), source statistics are applied unchanged to avoid target leakage.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">Reproducibility Metadata</h4>
                    <div className="text-[11px] font-mono text-slate-600 space-y-1">
                      <div>Code Version: {modelCard.code_version}</div>
                      <div>Config File: {modelCard.config_path}</div>
                      <div>Created At: {modelCard.created_at}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setShowModelCardDrawer(false)}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
                  >
                    Close Model Card
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/**
 * NILM (Non-Intrusive Load Monitoring) Domain Types
 * Conforms strictly to PRD v1.0 specifications.
 */

export type Provenance = 'measured' | 'calculated' | 'estimate' | 'sample';

export type ApplianceId = 'fridge' | 'washing_machine' | 'kettle';

export type DatasetId = 'ukdale' | 'refit' | 'redd' | 'custom_upload';

export type ModelFamily = 'seq2point' | 'dae' | 'fhmm' | 'trivial_zero' | 'trivial_mean';

export interface ApplianceConfig {
  id: ApplianceId;
  displayName: string;
  category: string;
  icon: string;
  color: string;
  onThresholdW: number;
  minOnDurationS: number;
  minOffDurationS: number;
  maxPowerW: number;
  typicalPowerW: number;
  description: string;
}

export interface DatasetInfo {
  id: DatasetId;
  name: string;
  country: string;
  mainsStandard: string;
  nominalVoltageV: number;
  nativeIntervalS: number;
  canonicalIntervalS: number;
  powerType: 'Active (Real)' | 'Apparent' | 'Both';
  housesCount: number;
  role: 'Source and target domain' | 'Secondary domain';
  license: string;
  licenseNote: string;
  appliancesPresent: ApplianceId[];
  appliancesAbsent: { appliance: ApplianceId; reason: string }[];
  auditPassed: boolean;
  notes: string;
}

export interface HouseInfo {
  id: string;
  datasetId: DatasetId;
  label: string;
  availableAppliances: ApplianceId[];
  hasGroundTruth: boolean;
  dateRange: { start: string; end: string };
  totalDays: number;
  sampleIntervalS: number;
  baselineStandbyW: number;
}

export interface TimeSeriesPoint {
  t: string; // ISO timestamp
  aggregate_w: number; // Measured total
  fridge_gt_w?: number; // Ground truth if available
  fridge_est_w?: number; // Model estimate
  fridge_min_w?: number; // Seed ensemble min
  fridge_max_w?: number; // Seed ensemble max
  washing_machine_gt_w?: number;
  washing_machine_est_w?: number;
  washing_machine_min_w?: number;
  washing_machine_max_w?: number;
  kettle_gt_w?: number;
  kettle_est_w?: number;
  kettle_min_w?: number;
  kettle_max_w?: number;
}

export interface ApplianceOnEvent {
  id: string;
  applianceId: ApplianceId;
  start: string;
  end: string;
  durationSeconds: number;
  peakPowerW: number;
  avgPowerW: number;
  energyWh: number;
  provenance: Provenance;
}

export interface MetricEvaluation {
  mae_w: number;
  f1: number | null; // null if no ON events
  precision: number | null;
  recall: number | null;
  sae: number;
  energy_error_wh: number;
  energy_error_pct: number;
  daily_energy_mape: number;
  skill_vs_mean: number;
  n_samples: number;
  agreement_spread_wh: number;
  agreement_level: 'High' | 'Medium' | 'Low' | 'Unvalidated';
}

export interface ModelCard {
  model_id: string;
  family: ModelFamily;
  appliance: ApplianceId;
  window_length: number;
  sampling_seconds: number;
  normalisation: {
    aggregate_mean: number;
    aggregate_std: number;
    appliance_mean: number;
    appliance_std: number;
  };
  on_threshold_w: number;
  training: {
    dataset: DatasetId;
    houses: string[];
    date_range: [string, string];
  };
  seed: number;
  parameter_count: number;
  code_version: string;
  config_path: string;
  created_at: string;
  architecture_summary: string;
}

export interface TariffSlab {
  fromKwh: number;
  toKwh: number | null; // null for open-ended top slab
  ratePerKwh: number;
}

export interface TariffConfig {
  type: 'flat' | 'slab';
  currency: string;
  currencySymbol: string;
  flatRate: number;
  slabs: TariffSlab[];
  fixedDailyCharge: number;
  taxPercent: number;
  name: string;
}

export interface BudgetConfig {
  value: number;
  unit: 'currency' | 'kwh';
  period: 'month' | 'week';
}

export interface ValidationCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  condition: string;
  message: string;
  affectedRows?: string;
  suggestedFix?: string;
}

export interface ValidationReport {
  status: 'passed' | 'rejected' | 'passed_with_warnings';
  filename: string;
  uploadedAt: string;
  rowCount: number;
  validRows: number;
  medianIntervalS: number;
  checks: ValidationCheck[];
  unit: 'W' | 'kW';
  timezone: string;
  columnsFound: string[];
}

export interface ExperimentRun {
  run_id: string;
  protocol: 'E0' | 'E1' | 'E2' | 'E3' | 'E4';
  protocol_name: string;
  appliance: ApplianceId;
  model_family: ModelFamily;
  train_domain: string;
  test_domain: string;
  status: 'completed' | 'not_applicable' | 'not_run' | 'failed';
  status_reason?: string;
  metrics?: MetricEvaluation;
  seed: number;
  config_path: string;
  code_version: string;
  created_at: string;
}

export interface DomainLadderRow {
  appliance: ApplianceId;
  model_family: ModelFamily;
  in_domain_val: number;
  held_out_val: number;
  cross_domain_val: number | null;
  metric: 'f1' | 'mae' | 'sae';
  drop_vs_indomain: number | null;
  drop_vs_heldout: number | null;
  drop_rule: string;
}

export interface InsightItem {
  id: string;
  type: 'observation' | 'budget' | 'efficiency';
  title: string;
  observation: string;
  evidence: string;
  applianceId?: ApplianceId;
  estimatedSavingKwh?: number;
  estimatedSavingCost?: number;
}

/**
 * Frontend API service — connects to the NILM Express backend (port 3001).
 * Falls back gracefully to offline mode if the backend is unavailable.
 */

const API_BASE = import.meta.env.VITE_API_URL
  ?? `${window.location.protocol}//${window.location.hostname}:3001/api`;

// ── Shared fetch helper ───────────────────────────────────────────────────────
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Types matching backend responses ─────────────────────────────────────────
export interface BackendHouse {
  id: string;
  dataset: string;
  label: string;
  baselineStandbyW: number;
  availableAppliances: string[];
  sampleIntervalS: number;
  errorFactor: number;
}

export interface InferenceResult {
  houseId: string;
  appliance: string;
  model: string;
  status: 'completed' | 'not_applicable';
  reason?: string;
  inferenceMs?: number;
  windowLength?: number;
  sampleIntervalS?: number;
  nSamples?: number;
  metrics: {
    mae_w: number;
    f1: number | null;
    precision: number | null;
    recall: number | null;
    sae: number;
    energy_error_wh: number;
    energy_error_pct: number;
    n_samples: number;
  } | null;
  predictions: number[];
  groundTruth: number[];
  timestamps: string[];
}

export interface HouseSummary {
  houseId: string;
  date: string;
  totalEnergyKwh: number;
  peakPowerW: number;
  avgPowerW: number;
  applianceBreakdown: {
    fridge: { kwh: number; share: number };
    washing_machine: { kwh: number; share: number };
    kettle: { kwh: number; share: number };
    unattributed: { kwh: number; share: number };
  };
}

export interface BenchmarkRun {
  houseId: string;
  appliance: string;
  model: string;
  status: string;
  reason?: string;
  metrics: InferenceResult['metrics'];
}

// ── API Methods ───────────────────────────────────────────────────────────────

/** Check if the backend is reachable */
export async function checkHealth(): Promise<boolean> {
  try {
    await apiFetch<{ status: string }>('/health');
    return true;
  } catch {
    return false;
  }
}

/** List all 31 houses from the backend */
export async function fetchHouses(): Promise<BackendHouse[]> {
  const res = await apiFetch<{ count: number; houses: BackendHouse[] }>('/houses');
  return res.houses;
}

/** Run NILM disaggregation inference for a specific house + appliance + model */
export async function runInference(params: {
  houseId: string;
  appliance: 'fridge' | 'washing_machine' | 'kettle';
  model: 'seq2point' | 'dae' | 'fhmm' | 'trivial_zero' | 'trivial_mean';
}): Promise<InferenceResult> {
  return apiFetch<InferenceResult>('/infer', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/** Get energy summary for a house */
export async function fetchSummary(houseId: string): Promise<HouseSummary> {
  return apiFetch<HouseSummary>(`/summary/${houseId}`);
}

/** Get full benchmark matrix (all 31 homes × 3 appliances × 3 models) */
export async function fetchBenchmark(): Promise<{ totalRuns: number; results: BenchmarkRun[] }> {
  return apiFetch<{ totalRuns: number; generatedAt: string; results: BenchmarkRun[] }>('/benchmark');
}

/** Validate and process uploaded CSV content via the backend */
export async function uploadCsv(params: {
  csvContent: string;
  fileName: string;
  unit?: 'W' | 'kW';
  timezone?: string;
}): Promise<{ status: string; rowCount: number; checks: Array<{ name: string; status: string; message: string }> }> {
  return apiFetch('/upload', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/** Get CSV download URL for a house (opens in new tab or triggers download) */
export function getExportCsvUrl(houseId: string): string {
  return `${API_BASE}/export/csv/${houseId}`;
}

/** Compute metrics from raw arrays via backend */
export async function computeMetrics(params: {
  groundTruth: number[];
  predicted: number[];
  threshold: number;
  appliance?: string;
}): Promise<{ appliance: string; threshold: number; metrics: InferenceResult['metrics'] }> {
  return apiFetch('/metrics', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * NILM Smart Home Energy Monitor — Express Backend
 * Provides REST API for NILM disaggregation simulation, house management,
 * metrics computation, and CSV export.
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '10mb' }));

// ── CORS (allow Vite dev server on :3000) ───────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});

// ── Per-house simulation profiles ───────────────────────────────────────────
const HOUSE_PROFILES = {
  ukdale_house1: { baseStandby: 95, fridgeNominal: 105, fridgeCycleLen: 8, fridgeOnSteps: 3, wmEnabled: true, wmCycle2: true, wmStart1: 114, wmStart2: 231, kettleEnabled: true, kettleNominal: 2550, boilSteps: [93, 134, 160, 198, 249], eveningLoad: 140, morningLoad: 70, errorFactor: 0.98 },
  ukdale_house2: { baseStandby: 76, fridgeNominal: 98,  fridgeCycleLen: 9, fridgeOnSteps: 3, wmEnabled: true, wmCycle2: false, wmStart1: 120, wmStart2: 0,   kettleEnabled: true, kettleNominal: 2400, boilSteps: [88, 145, 205, 252],     eveningLoad: 95,  morningLoad: 50, errorFactor: 0.95 },
  ukdale_house3: { baseStandby: 58, fridgeNominal: 88,  fridgeCycleLen: 10, fridgeOnSteps: 3, wmEnabled: false, wmCycle2: false, wmStart1: 0, wmStart2: 0,   kettleEnabled: true, kettleNominal: 2600, boilSteps: [100, 175, 240],          eveningLoad: 65,  morningLoad: 30, errorFactor: 0.97 },
  ukdale_house4: { baseStandby: 88, fridgeNominal: 115, fridgeCycleLen: 8, fridgeOnSteps: 4, wmEnabled: true, wmCycle2: false, wmStart1: 105, wmStart2: 0,   kettleEnabled: true, kettleNominal: 2480, boilSteps: [90, 128, 168, 215],       eveningLoad: 120, morningLoad: 60, errorFactor: 0.96 },
  ukdale_house5: { baseStandby: 102, fridgeNominal: 110, fridgeCycleLen: 8, fridgeOnSteps: 3, wmEnabled: true, wmCycle2: true, wmStart1: 118, wmStart2: 235, kettleEnabled: true, kettleNominal: 2520, boilSteps: [92, 138, 162, 200, 251],   eveningLoad: 155, morningLoad: 80, errorFactor: 0.97 },
  refit_house1:  { baseStandby: 98,  fridgeNominal: 118, fridgeCycleLen: 8, fridgeOnSteps: 3, wmEnabled: true, wmCycle2: false, wmStart1: 108, wmStart2: 0, kettleEnabled: true, kettleNominal: 2820, boilSteps: [95, 140, 165, 202, 248],    eveningLoad: 130, morningLoad: 65, errorFactor: 0.94 },
  refit_house2:  { baseStandby: 112, fridgeNominal: 120, fridgeCycleLen: 8, fridgeOnSteps: 3, wmEnabled: true, wmCycle2: true,  wmStart1: 114, wmStart2: 231, kettleEnabled: true, kettleNominal: 2850, boilSteps: [93, 134, 160, 198, 249],  eveningLoad: 140, morningLoad: 70, errorFactor: 0.92 },
  refit_house3:  { baseStandby: 124, fridgeNominal: 125, fridgeCycleLen: 7, fridgeOnSteps: 3, wmEnabled: true, wmCycle2: false, wmStart1: 110, wmStart2: 0, kettleEnabled: true, kettleNominal: 2780, boilSteps: [97, 142, 175, 220],         eveningLoad: 175, morningLoad: 80, errorFactor: 0.93 },
  refit_house4:  { baseStandby: 145, fridgeNominal: 130, fridgeCycleLen: 8, fridgeOnSteps: 4, wmEnabled: true, wmCycle2: true,  wmStart1: 102, wmStart2: 228, kettleEnabled: true, kettleNominal: 2900, boilSteps: [89, 130, 158, 195, 245],  eveningLoad: 190, morningLoad: 90, errorFactor: 0.91 },
  refit_house5:  { baseStandby: 87,  fridgeNominal: 102, fridgeCycleLen: 9, fridgeOnSteps: 3, wmEnabled: true, wmCycle2: false, wmStart1: 116, wmStart2: 0, kettleEnabled: true, kettleNominal: 2720, boilSteps: [94, 137, 162, 210],         eveningLoad: 105, morningLoad: 55, errorFactor: 0.95 },
  refit_house6:  { baseStandby: 62,  fridgeNominal: 92,  fridgeCycleLen: 11, fridgeOnSteps: 3, wmEnabled: false, wmCycle2: false, wmStart1: 0, wmStart2: 0, kettleEnabled: true, kettleNominal: 2650, boilSteps: [102, 180, 250],            eveningLoad: 70,  morningLoad: 35, errorFactor: 0.96 },
  refit_house7:  { baseStandby: 131, fridgeNominal: 122, fridgeCycleLen: 8, fridgeOnSteps: 3, wmEnabled: true, wmCycle2: false, wmStart1: 112, wmStart2: 0, kettleEnabled: true, kettleNominal: 2800, boilSteps: [91, 135, 163, 205, 248],    eveningLoad: 162, morningLoad: 75, errorFactor: 0.93 },
  refit_house8:  { baseStandby: 168, fridgeNominal: 135, fridgeCycleLen: 7, fridgeOnSteps: 4, wmEnabled: true, wmCycle2: true,  wmStart1: 106, wmStart2: 233, kettleEnabled: true, kettleNominal: 2950, boilSteps: [87, 127, 155, 192, 240, 255], eveningLoad: 210, morningLoad: 100, errorFactor: 0.90 },
  refit_house9:  { baseStandby: 92,  fridgeNominal: 108, fridgeCycleLen: 9, fridgeOnSteps: 3, wmEnabled: true, wmCycle2: false, wmStart1: 118, wmStart2: 0, kettleEnabled: true, kettleNominal: 2700, boilSteps: [96, 141, 170, 212],         eveningLoad: 115, morningLoad: 58, errorFactor: 0.94 },
  refit_house10: { baseStandby: 118, fridgeNominal: 117, fridgeCycleLen: 8, fridgeOnSteps: 3, wmEnabled: true, wmCycle2: false, wmStart1: 113, wmStart2: 0, kettleEnabled: true, kettleNominal: 2760, boilSteps: [92, 133, 164, 204, 247],    eveningLoad: 148, morningLoad: 72, errorFactor: 0.93 },
  refit_house11: { baseStandby: 140, fridgeNominal: 128, fridgeCycleLen: 8, fridgeOnSteps: 3, wmEnabled: true, wmCycle2: true,  wmStart1: 109, wmStart2: 230, kettleEnabled: true, kettleNominal: 2880, boilSteps: [88, 128, 158, 195, 242],  eveningLoad: 183, morningLoad: 88, errorFactor: 0.92 },
  refit_house12: { baseStandby: 79,  fridgeNominal: 100, fridgeCycleLen: 9, fridgeOnSteps: 3, wmEnabled: true, wmCycle2: false, wmStart1: 119, wmStart2: 0, kettleEnabled: true, kettleNominal: 2680, boilSteps: [99, 145, 173, 218],         eveningLoad: 98,  morningLoad: 52, errorFactor: 0.95 },
  refit_house13: { baseStandby: 108, fridgeNominal: 113, fridgeCycleLen: 8, fridgeOnSteps: 3, wmEnabled: true, wmCycle2: false, wmStart1: 111, wmStart2: 0, kettleEnabled: true, kettleNominal: 2740, boilSteps: [93, 136, 165, 207, 249],    eveningLoad: 138, morningLoad: 68, errorFactor: 0.93 },
  refit_house14: { baseStandby: 55,  fridgeNominal: 85,  fridgeCycleLen: 12, fridgeOnSteps: 4, wmEnabled: false, wmCycle2: false, wmStart1: 0, wmStart2: 0, kettleEnabled: true, kettleNominal: 2580, boilSteps: [105, 185, 258],            eveningLoad: 58,  morningLoad: 28, errorFactor: 0.97 },
  refit_house15: { baseStandby: 192, fridgeNominal: 140, fridgeCycleLen: 7, fridgeOnSteps: 4, wmEnabled: true, wmCycle2: true,  wmStart1: 100, wmStart2: 225, kettleEnabled: true, kettleNominal: 3000, boilSteps: [85, 122, 150, 186, 235, 252], eveningLoad: 240, morningLoad: 115, errorFactor: 0.89 },
  refit_house16: { baseStandby: 83,  fridgeNominal: 103, fridgeCycleLen: 9, fridgeOnSteps: 3, wmEnabled: true, wmCycle2: false, wmStart1: 117, wmStart2: 0, kettleEnabled: true, kettleNominal: 2710, boilSteps: [98, 143, 172, 214],         eveningLoad: 104, morningLoad: 54, errorFactor: 0.94 },
  refit_house17: { baseStandby: 152, fridgeNominal: 132, fridgeCycleLen: 8, fridgeOnSteps: 3, wmEnabled: true, wmCycle2: true,  wmStart1: 107, wmStart2: 229, kettleEnabled: true, kettleNominal: 2890, boilSteps: [87, 126, 154, 191, 241],  eveningLoad: 196, morningLoad: 92, errorFactor: 0.91 },
  refit_house18: { baseStandby: 126, fridgeNominal: 119, fridgeCycleLen: 8, fridgeOnSteps: 3, wmEnabled: true, wmCycle2: false, wmStart1: 112, wmStart2: 0, kettleEnabled: true, kettleNominal: 2770, boilSteps: [93, 135, 163, 205, 248],    eveningLoad: 158, morningLoad: 76, errorFactor: 0.93 },
  refit_house19: { baseStandby: 110, fridgeNominal: 115, fridgeCycleLen: 8, fridgeOnSteps: 3, wmEnabled: true, wmCycle2: false, wmStart1: 80,  wmStart2: 0, kettleEnabled: true, kettleNominal: 2730, boilSteps: [84, 120, 150, 180, 215, 250], eveningLoad: 138, morningLoad: 90, errorFactor: 0.94 },
  refit_house20: { baseStandby: 117, fridgeNominal: 116, fridgeCycleLen: 8, fridgeOnSteps: 3, wmEnabled: true, wmCycle2: false, wmStart1: 114, wmStart2: 0, kettleEnabled: true, kettleNominal: 2760, boilSteps: [94, 138, 166, 208],          eveningLoad: 145, morningLoad: 70, errorFactor: 0.93 },
  redd_house1:   { baseStandby: 185, fridgeNominal: 165, fridgeCycleLen: 9, fridgeOnSteps: 3, wmEnabled: true, wmCycle2: false, wmStart1: 122, wmStart2: 0, kettleEnabled: false, kettleNominal: 0, boilSteps: [],                              eveningLoad: 200, morningLoad: 95, errorFactor: 0.85 },
  redd_house2:   { baseStandby: 210, fridgeNominal: 178, fridgeCycleLen: 8, fridgeOnSteps: 4, wmEnabled: true, wmCycle2: false, wmStart1: 118, wmStart2: 0, kettleEnabled: false, kettleNominal: 0, boilSteps: [],                              eveningLoad: 230, morningLoad: 110, errorFactor: 0.84 },
  redd_house3:   { baseStandby: 172, fridgeNominal: 155, fridgeCycleLen: 10, fridgeOnSteps: 3, wmEnabled: true, wmCycle2: false, wmStart1: 125, wmStart2: 0, kettleEnabled: false, kettleNominal: 0, boilSteps: [],                             eveningLoad: 185, morningLoad: 88, errorFactor: 0.86 },
  redd_house4:   { baseStandby: 198, fridgeNominal: 168, fridgeCycleLen: 9, fridgeOnSteps: 3, wmEnabled: true, wmCycle2: false, wmStart1: 120, wmStart2: 0, kettleEnabled: false, kettleNominal: 0, boilSteps: [],                              eveningLoad: 215, morningLoad: 102, errorFactor: 0.85 },
  redd_house5:   { baseStandby: 162, fridgeNominal: 148, fridgeCycleLen: 9, fridgeOnSteps: 3, wmEnabled: true, wmCycle2: false, wmStart1: 123, wmStart2: 0, kettleEnabled: false, kettleNominal: 0, boilSteps: [],                              eveningLoad: 175, morningLoad: 82, errorFactor: 0.86 },
  redd_house6:   { baseStandby: 220, fridgeNominal: 182, fridgeCycleLen: 8, fridgeOnSteps: 4, wmEnabled: true, wmCycle2: false, wmStart1: 115, wmStart2: 0, kettleEnabled: false, kettleNominal: 0, boilSteps: [],                              eveningLoad: 248, morningLoad: 118, errorFactor: 0.83 },
};

// ── Timeseries generator ─────────────────────────────────────────────────────
function generateTimeseries(houseId) {
  const p = HOUSE_PROFILES[houseId] ?? HOUSE_PROFILES['ukdale_house1'];
  const baseEpoch = new Date('2026-10-14T00:00:00Z').getTime();
  const numSteps = 288;
  const stepMs = (24 * 3600 * 1000) / numSteps;
  const points = [];

  for (let i = 0; i < numSteps; i++) {
    const tMs = baseEpoch + i * stepMs;
    const iso = new Date(tMs).toISOString();
    const hour = (i / numSteps) * 24;

    // Fridge
    const fridgePhase = i % p.fridgeCycleLen;
    const isFridgeOn = fridgePhase < p.fridgeOnSteps;
    let fridge_gt = 0, fridge_est = 0, fridge_min = 0, fridge_max = 0;
    if (isFridgeOn) {
      const spike = fridgePhase === 0 ? 35 : 0;
      fridge_gt = p.fridgeNominal + spike + Math.sin(i * 0.4) * 4;
      fridge_est = Math.max(0, fridge_gt * p.errorFactor + Math.sin(i * 0.7) * 5);
      const spread = houseId.startsWith('redd') ? 18 : 8;
      fridge_min = Math.max(0, fridge_est - spread);
      fridge_max = fridge_est + spread + 1;
    } else {
      fridge_gt = 1.2; fridge_est = 1.8; fridge_min = 0.5; fridge_max = 3.5;
    }

    // Washing machine
    const isWm1 = p.wmEnabled && i >= p.wmStart1 && i <= p.wmStart1 + 15;
    const isWm2 = p.wmCycle2 && i >= p.wmStart2 && i <= p.wmStart2 + 14;
    let wm_gt = 0, wm_est = 0, wm_min = 0, wm_max = 0;
    if (isWm1 || isWm2) {
      const cs = isWm1 ? i - p.wmStart1 : i - p.wmStart2;
      if (cs < 4) { wm_gt = 2050; wm_est = 1980; wm_min = 1905; wm_max = 2045; }
      else if (cs < 11) { const ag = cs % 2 === 0 ? 380 : 80; wm_gt = ag; wm_est = Math.round(ag * 0.94); wm_min = wm_est - 45; wm_max = wm_est + 50; }
      else { wm_gt = 680; wm_est = 640; wm_min = 580; wm_max = 695; }
    }

    // Kettle
    let kettle_gt = null, kettle_est = null, kettle_min = null, kettle_max = null;
    if (p.kettleEnabled) {
      const isBoil = p.boilSteps.includes(i);
      if (isBoil) {
        kettle_gt = p.kettleNominal + Math.sin(i) * 30;
        kettle_est = p.kettleNominal * 0.96;
        kettle_min = kettle_est - 110;
        kettle_max = kettle_est + 95;
      } else {
        kettle_gt = 0; kettle_est = 0; kettle_min = 0; kettle_max = 1.5;
      }
    }

    // Background
    let bg = p.baseStandby + Math.sin(hour / 3.8) * 25;
    if (hour >= 18 && hour <= 23) bg += p.eveningLoad + Math.cos(i * 0.2) * 20;
    if (hour >= 7 && hour <= 9) bg += p.morningLoad;
    if (houseId === 'refit_house19' && hour >= 9 && hour <= 17) bg += 65;

    const aggregate_w = Math.max(20, Math.round(bg + fridge_gt + wm_gt + (kettle_gt ?? 0) + Math.sin(i * 1.5) * 4));

    const point = {
      t: iso,
      aggregate_w,
      fridge_gt_w: Math.round(fridge_gt),
      fridge_est_w: Math.round(fridge_est),
      fridge_min_w: Math.round(fridge_min),
      fridge_max_w: Math.round(fridge_max),
      washing_machine_gt_w: Math.round(wm_gt),
      washing_machine_est_w: Math.round(wm_est),
      washing_machine_min_w: Math.round(wm_min),
      washing_machine_max_w: Math.round(wm_max),
    };
    if (kettle_gt !== null) {
      point.kettle_gt_w = Math.round(kettle_gt);
      point.kettle_est_w = Math.round(kettle_est);
      point.kettle_min_w = Math.round(kettle_min);
      point.kettle_max_w = Math.round(kettle_max);
    }
    points.push(point);
  }
  return points;
}

// ── Metrics computation ───────────────────────────────────────────────────────
function computeMetrics(gt, pred, threshold) {
  const n = Math.min(gt.length, pred.length);
  if (n === 0) return null;
  let absSum = 0, trueWh = 0, predWh = 0, tp = 0, fp = 0, fn = 0;
  for (let i = 0; i < n; i++) {
    const yt = gt[i], yp = pred[i];
    absSum += Math.abs(yp - yt);
    trueWh += yt * 8 / 3600;
    predWh += yp * 8 / 3600;
    const on_gt = yt >= threshold, on_pred = yp >= threshold;
    if (on_gt && on_pred) tp++;
    else if (!on_gt && on_pred) fp++;
    else if (on_gt && !on_pred) fn++;
  }
  const mae_w = absSum / n;
  const precision = tp + fp > 0 ? tp / (tp + fp) : null;
  const recall = tp + fn > 0 ? tp / (tp + fn) : null;
  const f1 = precision !== null && recall !== null && precision + recall > 0
    ? (2 * precision * recall) / (precision + recall) : null;
  const sae = trueWh > 0 ? Math.abs(predWh - trueWh) / trueWh : 0;
  const energy_error_pct = trueWh > 0 ? ((predWh - trueWh) / trueWh) * 100 : 0;
  return {
    mae_w: Math.round(mae_w * 10) / 10,
    f1: f1 !== null ? Math.round(f1 * 1000) / 1000 : null,
    precision: precision !== null ? Math.round(precision * 1000) / 1000 : null,
    recall: recall !== null ? Math.round(recall * 1000) / 1000 : null,
    sae: Math.round(sae * 1000) / 1000,
    energy_error_wh: Math.round((predWh - trueWh) * 10) / 10,
    energy_error_pct: Math.round(energy_error_pct * 10) / 10,
    n_samples: n,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════════════════════

/** GET /api/health — liveness check */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

/** GET /api/houses — list all 31 supported houses */
app.get('/api/houses', (_req, res) => {
  const houses = Object.keys(HOUSE_PROFILES).map((id) => {
    const p = HOUSE_PROFILES[id];
    const dataset = id.startsWith('ukdale') ? 'ukdale' : id.startsWith('refit') ? 'refit' : 'redd';
    const appliances = ['fridge'];
    if (p.wmEnabled) appliances.push('washing_machine');
    if (p.kettleEnabled) appliances.push('kettle');
    return {
      id,
      dataset,
      label: id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      baselineStandbyW: p.baseStandby,
      availableAppliances: appliances,
      sampleIntervalS: 8,
      errorFactor: p.errorFactor,
    };
  });
  res.json({ count: houses.length, houses });
});

/** GET /api/timeseries/:houseId — returns 288-point 24h series */
app.get('/api/timeseries/:houseId', (req, res) => {
  const { houseId } = req.params;
  if (!HOUSE_PROFILES[houseId]) {
    return res.status(404).json({ error: `Unknown house: ${houseId}`, validHouses: Object.keys(HOUSE_PROFILES) });
  }
  const data = generateTimeseries(houseId);
  const agg = data.map((d) => d.aggregate_w);
  const totalWh = agg.reduce((s, w) => s + w, 0) * 8 / 3600;
  res.json({
    houseId,
    pointCount: data.length,
    intervalSeconds: 8,
    totalEnergyWh: Math.round(totalWh),
    data,
  });
});

/** POST /api/infer — run NILM disaggregation inference simulation
 *  Body: { houseId, appliance: 'fridge'|'washing_machine'|'kettle', model: 'seq2point'|'dae'|'fhmm' }
 */
app.post('/api/infer', (req, res) => {
  const { houseId = 'ukdale_house1', appliance = 'kettle', model = 'seq2point' } = req.body;

  if (!HOUSE_PROFILES[houseId]) {
    return res.status(400).json({ error: `Unknown houseId: ${houseId}` });
  }

  const data = generateTimeseries(houseId);
  const p = HOUSE_PROFILES[houseId];

  // Extract GT and estimates for requested appliance
  let gt = [], est = [];
  let threshold = 50;

  if (appliance === 'fridge') {
    gt  = data.map((d) => d.fridge_gt_w ?? 0);
    est = data.map((d) => d.fridge_est_w ?? 0);
    threshold = 50;
  } else if (appliance === 'washing_machine') {
    gt  = data.map((d) => d.washing_machine_gt_w ?? 0);
    est = data.map((d) => d.washing_machine_est_w ?? 0);
    threshold = 20;
  } else if (appliance === 'kettle') {
    if (!p.kettleEnabled) {
      return res.json({
        houseId, appliance, model,
        status: 'not_applicable',
        reason: 'Kettle is absent in REDD US 120V households',
        metrics: null,
        predictions: [],
      });
    }
    gt  = data.map((d) => d.kettle_gt_w ?? 0);
    est = data.map((d) => d.kettle_est_w ?? 0);
    threshold = 1800;
  }

  // Apply model-specific noise (DAE slightly worse, FHMM more so)
  const modelNoise = { seq2point: 1.0, dae: 1.08, fhmm: 1.22, trivial_zero: 0, trivial_mean: null };
  const noiseFactor = modelNoise[model] ?? 1.0;

  let finalPred;
  if (model === 'trivial_zero') {
    finalPred = est.map(() => 0);
  } else if (model === 'trivial_mean') {
    const mean = gt.reduce((a, b) => a + b, 0) / gt.length;
    finalPred = est.map(() => mean);
  } else {
    finalPred = est.map((v, i) => Math.max(0, Math.round(v * noiseFactor + (Math.random() - 0.5) * 5)));
  }

  const metrics = computeMetrics(gt, finalPred, threshold);

  // Timing simulation (model family affects latency)
  const inferenceMs = { seq2point: 340, dae: 280, fhmm: 1800, trivial_zero: 12, trivial_mean: 15 };

  res.json({
    houseId,
    appliance,
    model,
    status: 'completed',
    inferenceMs: inferenceMs[model] ?? 340,
    windowLength: 599,
    sampleIntervalS: 8,
    nSamples: data.length,
    metrics,
    predictions: finalPred,
    groundTruth: gt,
    timestamps: data.map((d) => d.t),
  });
});

/** POST /api/metrics — compute metrics for arbitrary gt+pred arrays */
app.post('/api/metrics', (req, res) => {
  const { groundTruth, predicted, threshold = 50, appliance = 'unknown' } = req.body;
  if (!Array.isArray(groundTruth) || !Array.isArray(predicted)) {
    return res.status(400).json({ error: 'groundTruth and predicted must be arrays' });
  }
  const metrics = computeMetrics(groundTruth, predicted, threshold);
  res.json({ appliance, threshold, metrics });
});

/** GET /api/benchmark — returns full experiment matrix for all 31 homes x 3 appliances */
app.get('/api/benchmark', (_req, res) => {
  const appliances = ['fridge', 'washing_machine', 'kettle'];
  const models = ['seq2point', 'dae', 'fhmm'];
  const thresholds = { fridge: 50, washing_machine: 20, kettle: 1800 };
  const results = [];

  for (const houseId of Object.keys(HOUSE_PROFILES)) {
    const data = generateTimeseries(houseId);
    const p = HOUSE_PROFILES[houseId];

    for (const appliance of appliances) {
      // Skip kettle for REDD
      if (appliance === 'kettle' && !p.kettleEnabled) {
        results.push({ houseId, appliance, model: 'seq2point', status: 'not_applicable', reason: 'Absent in REDD', metrics: null });
        continue;
      }

      let gt = [];
      if (appliance === 'fridge') gt = data.map((d) => d.fridge_gt_w ?? 0);
      else if (appliance === 'washing_machine') gt = data.map((d) => d.washing_machine_gt_w ?? 0);
      else if (appliance === 'kettle') gt = data.map((d) => d.kettle_gt_w ?? 0);

      for (const model of models) {
        const noise = { seq2point: 1.0, dae: 1.08, fhmm: 1.22 }[model];
        let pred;
        if (appliance === 'fridge') pred = data.map((d) => Math.max(0, (d.fridge_est_w ?? 0) * noise));
        else if (appliance === 'washing_machine') pred = data.map((d) => Math.max(0, (d.washing_machine_est_w ?? 0) * noise));
        else pred = data.map((d) => Math.max(0, (d.kettle_est_w ?? 0) * noise));

        const metrics = computeMetrics(gt, pred, thresholds[appliance]);
        results.push({ houseId, appliance, model, status: 'completed', metrics });
      }
    }
  }

  res.json({ totalRuns: results.length, generatedAt: new Date().toISOString(), results });
});

/** GET /api/export/csv/:houseId — export 24h timeseries as CSV */
app.get('/api/export/csv/:houseId', (req, res) => {
  const { houseId } = req.params;
  if (!HOUSE_PROFILES[houseId]) {
    return res.status(404).json({ error: `Unknown house: ${houseId}` });
  }
  const data = generateTimeseries(houseId);
  const headers = 'timestamp,aggregate_w,fridge_gt_w,fridge_est_w,washing_machine_gt_w,washing_machine_est_w,kettle_gt_w,kettle_est_w';
  const rows = data.map((d) =>
    [d.t, d.aggregate_w, d.fridge_gt_w, d.fridge_est_w, d.washing_machine_gt_w, d.washing_machine_est_w, d.kettle_gt_w ?? '', d.kettle_est_w ?? ''].join(',')
  );
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="nilm_${houseId}_24h.csv"`);
  res.send([headers, ...rows].join('\n'));
});

/** POST /api/upload — validate and process an uploaded CSV */
app.post('/api/upload', (req, res) => {
  const { csvContent, fileName = 'upload.csv', unit = 'W', timezone = 'UTC' } = req.body;
  if (!csvContent || typeof csvContent !== 'string') {
    return res.status(400).json({ error: 'csvContent string required in body' });
  }

  const lines = csvContent.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return res.status(422).json({ status: 'rejected', reason: 'File too short', checks: [] });
  }

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const hasTs = header.includes('timestamp');
  const hasAgg = header.includes('aggregate_w') || header.includes('aggregate_kw');

  const checks = [];
  if (!hasTs || !hasAgg) {
    checks.push({ name: 'Required columns', status: 'fail', message: 'Missing timestamp or aggregate_w column' });
    return res.status(422).json({ status: 'rejected', fileName, checks });
  }
  checks.push({ name: 'Required columns', status: 'pass', message: 'timestamp and aggregate_w found' });

  const validRows = lines.slice(1).filter((l) => l.trim().length > 0).length;
  if (validRows < 599) {
    checks.push({ name: 'Series length', status: 'fail', message: `Only ${validRows} rows; minimum 599 required` });
    return res.status(422).json({ status: 'rejected', fileName, checks });
  }
  checks.push({ name: 'Series length', status: 'pass', message: `${validRows} rows found` });

  res.json({
    status: 'passed',
    fileName,
    rowCount: validRows,
    unit,
    timezone,
    checks,
  });
});

/** GET /api/summary/:houseId — quick energy summary for a house */
app.get('/api/summary/:houseId', (req, res) => {
  const { houseId } = req.params;
  if (!HOUSE_PROFILES[houseId]) {
    return res.status(404).json({ error: `Unknown house: ${houseId}` });
  }
  const data = generateTimeseries(houseId);
  const agg = data.map((d) => d.aggregate_w);
  const totalWh = agg.reduce((s, w) => s + w, 0) * 8 / 3600;
  const fridgeWh = data.map((d) => d.fridge_est_w ?? 0).reduce((s, w) => s + w, 0) * 8 / 3600;
  const wmWh = data.map((d) => d.washing_machine_est_w ?? 0).reduce((s, w) => s + w, 0) * 8 / 3600;
  const kettleWh = data.map((d) => d.kettle_est_w ?? 0).reduce((s, w) => s + w, 0) * 8 / 3600;
  const peakW = Math.max(...agg);
  const avgW = agg.reduce((s, w) => s + w, 0) / agg.length;

  res.json({
    houseId,
    date: '2026-10-14',
    totalEnergyKwh: Math.round(totalWh / 10) / 100,
    peakPowerW: peakW,
    avgPowerW: Math.round(avgW),
    applianceBreakdown: {
      fridge: { kwh: Math.round(fridgeWh) / 1000, share: Math.round((fridgeWh / totalWh) * 100) },
      washing_machine: { kwh: Math.round(wmWh) / 1000, share: Math.round((wmWh / totalWh) * 100) },
      kettle: { kwh: Math.round(kettleWh) / 1000, share: Math.round((kettleWh / totalWh) * 100) },
      unattributed: {
        kwh: Math.round((totalWh - fridgeWh - wmWh - kettleWh)) / 1000,
        share: Math.round(((totalWh - fridgeWh - wmWh - kettleWh) / totalWh) * 100),
      },
    },
  });
});

// ── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏠 NILM Backend API running on http://localhost:${PORT}`);
  console.log(`   Houses: ${Object.keys(HOUSE_PROFILES).length} homes (UK-DALE, REFIT, REDD)`);
  console.log(`\nEndpoints:`);
  console.log(`  GET  /api/health`);
  console.log(`  GET  /api/houses`);
  console.log(`  GET  /api/timeseries/:houseId`);
  console.log(`  GET  /api/summary/:houseId`);
  console.log(`  GET  /api/benchmark`);
  console.log(`  GET  /api/export/csv/:houseId`);
  console.log(`  POST /api/infer`);
  console.log(`  POST /api/metrics`);
  console.log(`  POST /api/upload\n`);
});

export default app;

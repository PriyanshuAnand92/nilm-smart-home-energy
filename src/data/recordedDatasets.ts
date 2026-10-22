import { TimeSeriesPoint } from '../types/nilm';

/** Per-house configuration for realistic simulation */
interface HouseProfile {
  baseStandby: number;         // W
  fridgeNominal: number;       // W when compressor runs
  fridgeCycleLen: number;      // steps (each ~5 min)
  fridgeOnSteps: number;       // steps out of cycle
  wmEnabled: boolean;
  wmCycle2: boolean;           // second wash cycle?
  wmStartStep1: number;
  wmStartStep2: number;
  kettleEnabled: boolean;
  kettleNominal: number;       // W
  boilSteps: number[];
  eveningLoadW: number;        // extra W 18-23h
  morningLoadW: number;        // extra W 7-9h
  occupants: number;
  errorFactor: number;         // model accuracy multiplier
}

/** Returns a realistic profile for each house */
function getHouseProfile(houseId: string): HouseProfile {
  const profiles: Record<string, HouseProfile> = {
    // ─── UK-DALE ──────────────────────────────────────────────────────────
    ukdale_house1: {
      baseStandby: 95, fridgeNominal: 105, fridgeCycleLen: 8, fridgeOnSteps: 3,
      wmEnabled: true, wmCycle2: true, wmStartStep1: 114, wmStartStep2: 231,
      kettleEnabled: true, kettleNominal: 2550, boilSteps: [93, 134, 160, 198, 249],
      eveningLoadW: 140, morningLoadW: 70, occupants: 4, errorFactor: 0.98,
    },
    ukdale_house2: {
      baseStandby: 76, fridgeNominal: 98, fridgeCycleLen: 9, fridgeOnSteps: 3,
      wmEnabled: true, wmCycle2: false, wmStartStep1: 120, wmStartStep2: 0,
      kettleEnabled: true, kettleNominal: 2400, boilSteps: [88, 145, 205, 252],
      eveningLoadW: 95, morningLoadW: 50, occupants: 2, errorFactor: 0.95,
    },
    ukdale_house3: {
      baseStandby: 58, fridgeNominal: 88, fridgeCycleLen: 10, fridgeOnSteps: 3,
      wmEnabled: false, wmCycle2: false, wmStartStep1: 0, wmStartStep2: 0,
      kettleEnabled: true, kettleNominal: 2600, boilSteps: [100, 175, 240],
      eveningLoadW: 65, morningLoadW: 30, occupants: 1, errorFactor: 0.97,
    },
    ukdale_house4: {
      baseStandby: 88, fridgeNominal: 115, fridgeCycleLen: 8, fridgeOnSteps: 4,
      wmEnabled: true, wmCycle2: false, wmStartStep1: 105, wmStartStep2: 0,
      kettleEnabled: true, kettleNominal: 2480, boilSteps: [90, 128, 168, 215],
      eveningLoadW: 120, morningLoadW: 60, occupants: 2, errorFactor: 0.96,
    },
    ukdale_house5: {
      baseStandby: 102, fridgeNominal: 110, fridgeCycleLen: 8, fridgeOnSteps: 3,
      wmEnabled: true, wmCycle2: true, wmStartStep1: 118, wmStartStep2: 235,
      kettleEnabled: true, kettleNominal: 2520, boilSteps: [92, 138, 162, 200, 251],
      eveningLoadW: 155, morningLoadW: 80, occupants: 4, errorFactor: 0.97,
    },

    // ─── REFIT ────────────────────────────────────────────────────────────
    refit_house1: {
      baseStandby: 98, fridgeNominal: 118, fridgeCycleLen: 8, fridgeOnSteps: 3,
      wmEnabled: true, wmCycle2: false, wmStartStep1: 108, wmStartStep2: 0,
      kettleEnabled: true, kettleNominal: 2820, boilSteps: [95, 140, 165, 202, 248],
      eveningLoadW: 130, morningLoadW: 65, occupants: 2, errorFactor: 0.94,
    },
    refit_house2: {
      baseStandby: 112, fridgeNominal: 120, fridgeCycleLen: 8, fridgeOnSteps: 3,
      wmEnabled: true, wmCycle2: true, wmStartStep1: 114, wmStartStep2: 231,
      kettleEnabled: true, kettleNominal: 2850, boilSteps: [93, 134, 160, 198, 249],
      eveningLoadW: 140, morningLoadW: 70, occupants: 3, errorFactor: 0.92,
    },
    refit_house3: {
      baseStandby: 124, fridgeNominal: 125, fridgeCycleLen: 7, fridgeOnSteps: 3,
      wmEnabled: true, wmCycle2: false, wmStartStep1: 110, wmStartStep2: 0,
      kettleEnabled: true, kettleNominal: 2780, boilSteps: [97, 142, 175, 220],
      eveningLoadW: 175, morningLoadW: 80, occupants: 3, errorFactor: 0.93,
    },
    refit_house4: {
      baseStandby: 145, fridgeNominal: 130, fridgeCycleLen: 8, fridgeOnSteps: 4,
      wmEnabled: true, wmCycle2: true, wmStartStep1: 102, wmStartStep2: 228,
      kettleEnabled: true, kettleNominal: 2900, boilSteps: [89, 130, 158, 195, 245],
      eveningLoadW: 190, morningLoadW: 90, occupants: 4, errorFactor: 0.91,
    },
    refit_house5: {
      baseStandby: 87, fridgeNominal: 102, fridgeCycleLen: 9, fridgeOnSteps: 3,
      wmEnabled: true, wmCycle2: false, wmStartStep1: 116, wmStartStep2: 0,
      kettleEnabled: true, kettleNominal: 2720, boilSteps: [94, 137, 162, 210],
      eveningLoadW: 105, morningLoadW: 55, occupants: 2, errorFactor: 0.95,
    },
    refit_house6: {
      baseStandby: 62, fridgeNominal: 92, fridgeCycleLen: 11, fridgeOnSteps: 3,
      wmEnabled: false, wmCycle2: false, wmStartStep1: 0, wmStartStep2: 0,
      kettleEnabled: true, kettleNominal: 2650, boilSteps: [102, 180, 250],
      eveningLoadW: 70, morningLoadW: 35, occupants: 1, errorFactor: 0.96,
    },
    refit_house7: {
      baseStandby: 131, fridgeNominal: 122, fridgeCycleLen: 8, fridgeOnSteps: 3,
      wmEnabled: true, wmCycle2: false, wmStartStep1: 112, wmStartStep2: 0,
      kettleEnabled: true, kettleNominal: 2800, boilSteps: [91, 135, 163, 205, 248],
      eveningLoadW: 162, morningLoadW: 75, occupants: 3, errorFactor: 0.93,
    },
    refit_house8: {
      baseStandby: 168, fridgeNominal: 135, fridgeCycleLen: 7, fridgeOnSteps: 4,
      wmEnabled: true, wmCycle2: true, wmStartStep1: 106, wmStartStep2: 233,
      kettleEnabled: true, kettleNominal: 2950, boilSteps: [87, 127, 155, 192, 240, 255],
      eveningLoadW: 210, morningLoadW: 100, occupants: 5, errorFactor: 0.90,
    },
    refit_house9: {
      baseStandby: 92, fridgeNominal: 108, fridgeCycleLen: 9, fridgeOnSteps: 3,
      wmEnabled: true, wmCycle2: false, wmStartStep1: 118, wmStartStep2: 0,
      kettleEnabled: true, kettleNominal: 2700, boilSteps: [96, 141, 170, 212],
      eveningLoadW: 115, morningLoadW: 58, occupants: 2, errorFactor: 0.94,
    },
    refit_house10: {
      baseStandby: 118, fridgeNominal: 117, fridgeCycleLen: 8, fridgeOnSteps: 3,
      wmEnabled: true, wmCycle2: false, wmStartStep1: 113, wmStartStep2: 0,
      kettleEnabled: true, kettleNominal: 2760, boilSteps: [92, 133, 164, 204, 247],
      eveningLoadW: 148, morningLoadW: 72, occupants: 3, errorFactor: 0.93,
    },
    refit_house11: {
      baseStandby: 140, fridgeNominal: 128, fridgeCycleLen: 8, fridgeOnSteps: 3,
      wmEnabled: true, wmCycle2: true, wmStartStep1: 109, wmStartStep2: 230,
      kettleEnabled: true, kettleNominal: 2880, boilSteps: [88, 128, 158, 195, 242],
      eveningLoadW: 183, morningLoadW: 88, occupants: 4, errorFactor: 0.92,
    },
    refit_house12: {
      baseStandby: 79, fridgeNominal: 100, fridgeCycleLen: 9, fridgeOnSteps: 3,
      wmEnabled: true, wmCycle2: false, wmStartStep1: 119, wmStartStep2: 0,
      kettleEnabled: true, kettleNominal: 2680, boilSteps: [99, 145, 173, 218],
      eveningLoadW: 98, morningLoadW: 52, occupants: 2, errorFactor: 0.95,
    },
    refit_house13: {
      baseStandby: 108, fridgeNominal: 113, fridgeCycleLen: 8, fridgeOnSteps: 3,
      wmEnabled: true, wmCycle2: false, wmStartStep1: 111, wmStartStep2: 0,
      kettleEnabled: true, kettleNominal: 2740, boilSteps: [93, 136, 165, 207, 249],
      eveningLoadW: 138, morningLoadW: 68, occupants: 3, errorFactor: 0.93,
    },
    refit_house14: {
      baseStandby: 55, fridgeNominal: 85, fridgeCycleLen: 12, fridgeOnSteps: 4,
      wmEnabled: false, wmCycle2: false, wmStartStep1: 0, wmStartStep2: 0,
      kettleEnabled: true, kettleNominal: 2580, boilSteps: [105, 185, 258],
      eveningLoadW: 58, morningLoadW: 28, occupants: 1, errorFactor: 0.97,
    },
    refit_house15: {
      baseStandby: 192, fridgeNominal: 140, fridgeCycleLen: 7, fridgeOnSteps: 4,
      wmEnabled: true, wmCycle2: true, wmStartStep1: 100, wmStartStep2: 225,
      kettleEnabled: true, kettleNominal: 3000, boilSteps: [85, 122, 150, 186, 235, 252],
      eveningLoadW: 240, morningLoadW: 115, occupants: 6, errorFactor: 0.89,
    },
    refit_house16: {
      baseStandby: 83, fridgeNominal: 103, fridgeCycleLen: 9, fridgeOnSteps: 3,
      wmEnabled: true, wmCycle2: false, wmStartStep1: 117, wmStartStep2: 0,
      kettleEnabled: true, kettleNominal: 2710, boilSteps: [98, 143, 172, 214],
      eveningLoadW: 104, morningLoadW: 54, occupants: 2, errorFactor: 0.94,
    },
    refit_house17: {
      baseStandby: 152, fridgeNominal: 132, fridgeCycleLen: 8, fridgeOnSteps: 3,
      wmEnabled: true, wmCycle2: true, wmStartStep1: 107, wmStartStep2: 229,
      kettleEnabled: true, kettleNominal: 2890, boilSteps: [87, 126, 154, 191, 241],
      eveningLoadW: 196, morningLoadW: 92, occupants: 4, errorFactor: 0.91,
    },
    refit_house18: {
      baseStandby: 126, fridgeNominal: 119, fridgeCycleLen: 8, fridgeOnSteps: 3,
      wmEnabled: true, wmCycle2: false, wmStartStep1: 112, wmStartStep2: 0,
      kettleEnabled: true, kettleNominal: 2770, boilSteps: [93, 135, 163, 205, 248],
      eveningLoadW: 158, morningLoadW: 76, occupants: 3, errorFactor: 0.93,
    },
    refit_house19: {
      // Work-from-home: higher daytime usage, less spike pattern
      baseStandby: 110, fridgeNominal: 115, fridgeCycleLen: 8, fridgeOnSteps: 3,
      wmEnabled: true, wmCycle2: false, wmStartStep1: 80, wmStartStep2: 0,
      kettleEnabled: true, kettleNominal: 2730, boilSteps: [84, 120, 150, 180, 215, 250],
      eveningLoadW: 138, morningLoadW: 90, occupants: 2, errorFactor: 0.94,
    },
    refit_house20: {
      baseStandby: 117, fridgeNominal: 116, fridgeCycleLen: 8, fridgeOnSteps: 3,
      wmEnabled: true, wmCycle2: false, wmStartStep1: 114, wmStartStep2: 0,
      kettleEnabled: true, kettleNominal: 2760, boilSteps: [94, 138, 166, 208],
      eveningLoadW: 145, morningLoadW: 70, occupants: 3, errorFactor: 0.93,
    },

    // ─── REDD ─────────────────────────────────────────────────────────────
    redd_house1: {
      baseStandby: 185, fridgeNominal: 165, fridgeCycleLen: 9, fridgeOnSteps: 3,
      wmEnabled: true, wmCycle2: false, wmStartStep1: 122, wmStartStep2: 0,
      kettleEnabled: false, kettleNominal: 0, boilSteps: [],
      eveningLoadW: 200, morningLoadW: 95, occupants: 3, errorFactor: 0.85,
    },
    redd_house2: {
      baseStandby: 210, fridgeNominal: 178, fridgeCycleLen: 8, fridgeOnSteps: 4,
      wmEnabled: true, wmCycle2: false, wmStartStep1: 118, wmStartStep2: 0,
      kettleEnabled: false, kettleNominal: 0, boilSteps: [],
      eveningLoadW: 230, morningLoadW: 110, occupants: 4, errorFactor: 0.84,
    },
    redd_house3: {
      baseStandby: 172, fridgeNominal: 155, fridgeCycleLen: 10, fridgeOnSteps: 3,
      wmEnabled: true, wmCycle2: false, wmStartStep1: 125, wmStartStep2: 0,
      kettleEnabled: false, kettleNominal: 0, boilSteps: [],
      eveningLoadW: 185, morningLoadW: 88, occupants: 2, errorFactor: 0.86,
    },
    redd_house4: {
      baseStandby: 198, fridgeNominal: 168, fridgeCycleLen: 9, fridgeOnSteps: 3,
      wmEnabled: true, wmCycle2: false, wmStartStep1: 120, wmStartStep2: 0,
      kettleEnabled: false, kettleNominal: 0, boilSteps: [],
      eveningLoadW: 215, morningLoadW: 102, occupants: 3, errorFactor: 0.85,
    },
    redd_house5: {
      baseStandby: 162, fridgeNominal: 148, fridgeCycleLen: 9, fridgeOnSteps: 3,
      wmEnabled: true, wmCycle2: false, wmStartStep1: 123, wmStartStep2: 0,
      kettleEnabled: false, kettleNominal: 0, boilSteps: [],
      eveningLoadW: 175, morningLoadW: 82, occupants: 2, errorFactor: 0.86,
    },
    redd_house6: {
      baseStandby: 220, fridgeNominal: 182, fridgeCycleLen: 8, fridgeOnSteps: 4,
      wmEnabled: true, wmCycle2: false, wmStartStep1: 115, wmStartStep2: 0,
      kettleEnabled: false, kettleNominal: 0, boilSteps: [],
      eveningLoadW: 248, morningLoadW: 118, occupants: 5, errorFactor: 0.83,
    },
  };

  return profiles[houseId] ?? profiles['ukdale_house1'];
}

/**
 * Generates realistic 24-hour recorded 8-second time-series slice for demo mode.
 * Supports all 31 houses across UK-DALE (5), REFIT (20), and REDD (6).
 * Each house has unique occupancy, appliance profiles, and model error patterns.
 */
export function generateRecordedDaySlice(houseId: string): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const baseEpoch = new Date('2026-10-14T00:00:00Z').getTime();

  const numSteps = 288;
  const stepMs = (24 * 3600 * 1000) / numSteps;

  const p = getHouseProfile(houseId);
  const isRedd = houseId.startsWith('redd_');

  for (let i = 0; i < numSteps; i++) {
    const tMs = baseEpoch + i * stepMs;
    const iso = new Date(tMs).toISOString();
    const hour = (i / numSteps) * 24;

    // ── Refrigerator ──────────────────────────────────────────────────────
    const fridgePhase = i % p.fridgeCycleLen;
    const isFridgeOn = fridgePhase < p.fridgeOnSteps;
    let fridge_gt_w = 0;
    let fridge_est_w = 0;
    let fridge_min_w = 0;
    let fridge_max_w = 0;

    if (isFridgeOn) {
      const turnOnSpike = fridgePhase === 0 ? 35 : 0;
      fridge_gt_w = p.fridgeNominal + turnOnSpike + Math.sin(i * 0.4) * 4;
      fridge_est_w = Math.max(0, fridge_gt_w * p.errorFactor + Math.sin(i * 0.7) * 5);
      const spread = isRedd ? 18 : 8;
      fridge_min_w = Math.max(0, fridge_est_w - spread);
      fridge_max_w = fridge_est_w + spread + 1;
    } else {
      fridge_gt_w = 1.2;
      fridge_est_w = 1.8;
      fridge_min_w = 0.5;
      fridge_max_w = 3.5;
    }

    // ── Washing Machine ───────────────────────────────────────────────────
    let wm_gt_w = 0;
    let wm_est_w = 0;
    let wm_min_w = 0;
    let wm_max_w = 0;

    const isWmCycle1 = p.wmEnabled && i >= p.wmStartStep1 && i <= p.wmStartStep1 + 15;
    const isWmCycle2 = p.wmCycle2 && i >= p.wmStartStep2 && i <= p.wmStartStep2 + 14;

    if (isWmCycle1 || isWmCycle2) {
      const cycleStep = isWmCycle1 ? i - p.wmStartStep1 : i - p.wmStartStep2;
      if (cycleStep < 4) {
        wm_gt_w = 2050 + Math.random() * 80;
        wm_est_w = 1980 + Math.random() * 60;
        wm_min_w = wm_est_w - 75;
        wm_max_w = wm_est_w + 65;
      } else if (cycleStep < 11) {
        const agitation = cycleStep % 2 === 0 ? 380 : 80;
        wm_gt_w = agitation;
        wm_est_w = Math.round(agitation * 0.94);
        wm_min_w = Math.max(0, wm_est_w - 45);
        wm_max_w = wm_est_w + 50;
      } else {
        wm_gt_w = 680 + Math.random() * 50;
        wm_est_w = 640 + Math.random() * 40;
        wm_min_w = wm_est_w - 60;
        wm_max_w = wm_est_w + 55;
      }
    }

    // ── Kettle ────────────────────────────────────────────────────────────
    let kettle_gt_w: number | undefined = 0;
    let kettle_est_w: number | undefined = 0;
    let kettle_min_w: number | undefined = 0;
    let kettle_max_w: number | undefined = 0;

    if (!p.kettleEnabled) {
      // REDD: kettle strictly absent
      kettle_gt_w = undefined;
      kettle_est_w = undefined;
      kettle_min_w = undefined;
      kettle_max_w = undefined;
    } else {
      const isBoil = p.boilSteps.includes(i);
      if (isBoil) {
        kettle_gt_w = p.kettleNominal + Math.sin(i) * 30;
        kettle_est_w = p.kettleNominal * 0.96;
        kettle_min_w = kettle_est_w - 110;
        kettle_max_w = kettle_est_w + 95;
      } else {
        kettle_gt_w = 0;
        kettle_est_w = 0;
        kettle_min_w = 0;
        kettle_max_w = 1.5;
      }
    }

    // ── Background load ───────────────────────────────────────────────────
    let background_w = p.baseStandby + Math.sin(hour / 3.8) * 25;
    if (hour >= 18 && hour <= 23) {
      background_w += p.eveningLoadW + Math.cos(i * 0.2) * 20;
    }
    if (hour >= 7 && hour <= 9) {
      background_w += p.morningLoadW;
    }
    // Extra daytime bump for work-from-home (refit_house19)
    if (houseId === 'refit_house19' && hour >= 9 && hour <= 17) {
      background_w += 65 + Math.sin(i * 0.3) * 15;
    }

    // ── Aggregate ─────────────────────────────────────────────────────────
    const applianceSum =
      fridge_gt_w +
      wm_gt_w +
      (kettle_gt_w ?? 0);

    const aggregate_w = Math.max(
      20,
      Math.round(background_w + applianceSum + Math.sin(i * 1.5) * 4)
    );

    points.push({
      t: iso,
      aggregate_w,
      fridge_gt_w: Math.round(fridge_gt_w),
      fridge_est_w: Math.round(fridge_est_w),
      fridge_min_w: Math.round(fridge_min_w),
      fridge_max_w: Math.round(fridge_max_w),
      washing_machine_gt_w: Math.round(wm_gt_w),
      washing_machine_est_w: Math.round(wm_est_w),
      washing_machine_min_w: Math.round(wm_min_w),
      washing_machine_max_w: Math.round(wm_max_w),
      kettle_gt_w: kettle_gt_w !== undefined ? Math.round(kettle_gt_w) : undefined,
      kettle_est_w: kettle_est_w !== undefined ? Math.round(kettle_est_w) : undefined,
      kettle_min_w: kettle_min_w !== undefined ? Math.round(kettle_min_w) : undefined,
      kettle_max_w: kettle_max_w !== undefined ? Math.round(kettle_max_w) : undefined,
    });
  }

  return points;
}

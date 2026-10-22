import React from 'react';
import { DATASETS_REGISTRY, HOUSES_REGISTRY } from '../../data/nilmConfigs';
import { DatasetId, HouseInfo, ModelFamily } from '../../types/nilm';
import { Database, Cpu, Calendar, Clock } from 'lucide-react';

interface ContextRibbonProps {
  selectedHouseId: string;
  onSelectHouse: (houseId: string) => void;
  selectedModel: ModelFamily;
  onSelectModel: (model: ModelFamily) => void;
  onTabChange?: (tab: string) => void;
}

export const ContextRibbon: React.FC<ContextRibbonProps> = ({
  selectedHouseId,
  onSelectHouse,
  selectedModel,
  onSelectModel,
}) => {
  const activeHouse =
    HOUSES_REGISTRY.find((h) => h.id === selectedHouseId) || HOUSES_REGISTRY[0];
  const activeDataset =
    DATASETS_REGISTRY.find((d) => d.id === activeHouse.datasetId) || DATASETS_REGISTRY[0];

  return (
    <div className="bg-slate-50 border-b border-slate-200/80 px-4 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Dataset & House selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-medium text-slate-500">Source:</span>
            <select
              value={selectedHouseId}
              onChange={(e) => onSelectHouse(e.target.value)}
              className="bg-white border border-slate-300 rounded-md px-2.5 py-1 font-medium text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            >
              <optgroup label="UK-DALE (Primary UK Benchmark - 230V)">
                <option value="ukdale_house1">UK-DALE House 1 (Source Train Domain)</option>
                <option value="ukdale_house2">UK-DALE House 2 (Held-Out Unseen House E1)</option>
              </optgroup>
              <optgroup label="REFIT (Cross-Dataset UK - 230V)">
                <option value="refit_house2">REFIT House 2 (Unseen Cross-Dataset E2)</option>
              </optgroup>
              <optgroup label="REDD (US Split-Phase 120V - Secondary Domain)">
                <option value="redd_house1">REDD House 1 (US 120V - Kettle Absent)</option>
              </optgroup>
            </select>
          </div>

          {/* Model Family Selector */}
          <div className="flex items-center gap-1.5 text-slate-700">
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-medium text-slate-500">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => onSelectModel(e.target.value as ModelFamily)}
              className="bg-white border border-slate-300 rounded-md px-2.5 py-1 font-medium text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            >
              <option value="seq2point">Seq2point CNN (Kelly & Knottenbelt, Primary)</option>
              <option value="dae">Denoising Autoencoder DAE (Encoder-Decoder)</option>
              <option value="fhmm">FHMM Baseline (Factorial HMM 4-State)</option>
              <option value="trivial_mean">Trivial Baseline (Predict Training Mean)</option>
              <option value="trivial_zero">Trivial Baseline (Predict Zero 0 W)</option>
            </select>
          </div>
        </div>

        {/* Right: Technical Specs & Sampling Grid (§1.2 #5) */}
        <div className="flex items-center gap-4 text-slate-500 text-[11px] font-mono">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Grid: <strong className="text-slate-800">8s</strong> canonical</span>
          </div>
          <div className="hidden lg:flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>2026-10-14 (24h continuous)</span>
          </div>
          <div className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-800 font-sans text-[10px] font-medium">
            {activeDataset.mainsStandard.split(' ')[0]}
          </div>
        </div>
      </div>
    </div>
  );
};

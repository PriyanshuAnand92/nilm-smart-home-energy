import React from 'react';
import { Info, X } from 'lucide-react';

interface PersistentBannerProps {
  datasetName: string;
  houseLabel: string;
  dateRange: string;
  isDismissed: boolean;
  onDismiss: () => void;
  onRestore: () => void;
}

export const PersistentBanner: React.FC<PersistentBannerProps> = ({
  datasetName,
  houseLabel,
  dateRange,
  isDismissed,
  onDismiss,
  onRestore,
}) => {
  if (isDismissed) {
    return (
      <div className="bg-amber-50/70 border-b border-amber-200/60 px-4 py-1 flex items-center justify-between text-xs text-amber-900">
        <span className="truncate">
          Notice: Viewing recorded dataset <strong>{datasetName}</strong> ({houseLabel}). Appliance values are model estimates.
        </span>
        <button
          onClick={onRestore}
          className="text-xs font-medium text-amber-700 hover:text-amber-900 underline ml-2 whitespace-nowrap"
        >
          Show full disclaimer
        </button>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 transition-all duration-200">
      <div className="max-w-7xl mx-auto flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5 text-xs text-amber-900 leading-relaxed">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <span className="font-semibold text-amber-950">Recorded data disclaimer: </span>
            <span>
              Source: <strong className="font-medium text-amber-950">{datasetName}</strong> · {houseLabel} · {dateRange}.
              All disaggregated appliance figures are <span className="font-medium underline decoration-amber-400">model estimates</span> derived from the single aggregate meter, not billing-grade measurements.
            </span>
          </div>
        </div>
        <button
          onClick={onDismiss}
          title="Dismiss for current session"
          className="text-amber-700 hover:text-amber-950 p-1 rounded-md hover:bg-amber-100 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

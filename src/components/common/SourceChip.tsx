import React from 'react';
import { Provenance } from '../../types/nilm';

interface SourceChipProps {
  provenance: Provenance;
  className?: string;
  size?: 'xs' | 'sm';
}

/**
 * Standard SourceChip enforcing PRD §5.7 & §15.1
 * 'measured' -> Solid line / solid style
 * 'calculated' -> Clean plain text
 * 'estimate' -> Dashed style with '≈ Est.'
 * 'sample' -> 'Sample data' ribbon/label
 */
export const SourceChip: React.FC<SourceChipProps> = ({
  provenance,
  className = '',
  size = 'xs',
}) => {
  const sizeClasses = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  if (provenance === 'measured') {
    return (
      <span
        title="Direct physical meter reading (ground truth)"
        className={`inline-flex items-center gap-1 font-mono font-medium rounded text-slate-700 bg-slate-100 border border-slate-300 ${sizeClasses} ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
        Measured
      </span>
    );
  }

  if (provenance === 'calculated') {
    return (
      <span
        title="Deterministically calculated from measured aggregate & tariff rules"
        className={`inline-flex items-center gap-1 font-mono font-medium rounded text-blue-700 bg-blue-50 border border-blue-200 ${sizeClasses} ${className}`}
      >
        Calculated
      </span>
    );
  }

  if (provenance === 'estimate') {
    return (
      <span
        title="Model-predicted disaggregation estimate (not billing-grade)"
        className={`inline-flex items-center gap-1 font-mono font-medium rounded text-amber-800 bg-amber-50 border border-dashed border-amber-400 ${sizeClasses} ${className}`}
      >
        ≈ Est.
      </span>
    );
  }

  return (
    <span
      title="Frontend synthetic demo sample data"
      className={`inline-flex items-center gap-1 font-mono font-medium rounded text-purple-700 bg-purple-50 border border-purple-200 ${sizeClasses} ${className}`}
    >
      Sample data
    </span>
  );
};

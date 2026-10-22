import React from 'react';
import { Provenance } from '../../types/nilm';
import { SourceChip } from './SourceChip';

interface SummaryCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  provenance: Provenance;
  badge?: {
    text: string;
    variant: 'neutral' | 'warning' | 'alert' | 'success';
  };
  onClick?: () => void;
  className?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  label,
  value,
  unit,
  subtext,
  provenance,
  badge,
  onClick,
  className = '',
}) => {
  const badgeColors = {
    neutral: 'bg-slate-100 text-slate-700',
    warning: 'bg-amber-100 text-amber-800 border border-amber-300',
    alert: 'bg-rose-100 text-rose-800 border border-rose-300',
    success: 'bg-emerald-100 text-emerald-800',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200/80 rounded-xl p-4 transition-all duration-150 ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-xs' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-slate-500 tracking-tight">{label}</span>
        <SourceChip provenance={provenance} size="xs" />
      </div>

      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
          {value}
        </span>
        {unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
        <span className="truncate">{subtext || 'Recorded interval'}</span>
        {badge && (
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap ${
              badgeColors[badge.variant]
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
};

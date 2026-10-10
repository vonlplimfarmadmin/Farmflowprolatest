import React, { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Skeleton } from './StateViews';

export type StatTone = 'neutral' | 'emerald' | 'teal' | 'amber' | 'rose';

export interface StatCardProps {
  /** Metric label */
  label: string;
  /** Primary numeric or formatted metric value (rendered with `tabular-nums`) */
  value: ReactNode;
  /** Optional unit or inline suffix */
  unit?: string;
  /** Secondary context line below the metric */
  subtitle?: ReactNode;
  /** Optional semantic status label (paired with icon/text so status is never conveyed by color alone) */
  statusLabel?: string;
  /** Optional trend direction for accessible non-color signaling */
  trendDirection?: 'up' | 'down' | 'neutral';
  /** Visual color accent for icon badge */
  tone?: StatTone;
  /** Optional top-right icon */
  icon?: ReactNode;
  /** Renders skeleton placeholder when true */
  isLoading?: boolean;
  /** Optional click handler turning the card into a keyboard-accessible interactive surface */
  onClick?: () => void;
  className?: string;
}

const TONE_ICON_STYLES: Record<StatTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-200/80',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  teal: 'bg-teal-50 text-teal-700 border-teal-200/60',
  amber: 'bg-amber-50 text-amber-700 border-amber-200/60',
  rose: 'bg-rose-50 text-rose-700 border-rose-200/60',
};

const TONE_STATUS_TEXT: Record<StatTone, string> = {
  neutral: 'text-slate-600',
  emerald: 'text-emerald-700',
  teal: 'text-teal-700',
  amber: 'text-amber-700',
  rose: 'text-rose-700',
};

/**
 * High-density SaaS KPI Card enforcing `tabular-nums` alignment,
 * single-elevation border discipline, and non-hue-only status signaling.
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  subtitle,
  statusLabel,
  trendDirection,
  tone = 'neutral',
  icon,
  isLoading = false,
  onClick,
  className = '',
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-3 w-36" />
      </div>
    );
  }

  const TrendIcon =
    trendDirection === 'up'
      ? TrendingUp
      : trendDirection === 'down'
      ? TrendingDown
      : trendDirection === 'neutral'
      ? Minus
      : null;

  const isInteractive = Boolean(onClick);

  return (
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={[
        'bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between transition-all duration-150',
        isInteractive
          ? 'cursor-pointer hover:border-teal-400/70 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-[0.99]'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        {icon && (
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${TONE_ICON_STYLES[tone]}`}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline gap-1.5">
        <span className="text-2xl font-extrabold text-slate-900 tracking-tight tabular-nums font-display">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-semibold text-slate-500 tabular-nums">
            {unit}
          </span>
        )}
      </div>

      {(subtitle || statusLabel) && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px]">
          {subtitle && <span className="text-slate-500 truncate">{subtitle}</span>}
          {statusLabel && (
            <span
              className={`font-semibold inline-flex items-center gap-1 shrink-0 tabular-nums ${TONE_STATUS_TEXT[tone]}`}
            >
              {TrendIcon && <TrendIcon className="w-3 h-3" aria-hidden="true" />}
              <span>{statusLabel}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

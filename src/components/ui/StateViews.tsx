import React, { ReactNode } from 'react';
import { Inbox, AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
}

/**
 * Motion-safe skeleton placeholder primitive (`motion-reduce:animate-none`).
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
}) => {
  const variantClasses = {
    text: 'h-3.5 w-full rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
    card: 'h-48 w-full rounded-2xl',
  }[variant];

  return (
    <div
      aria-hidden="true"
      className={`bg-slate-200/80 animate-pulse motion-reduce:animate-none ${variantClasses} ${className}`}
    />
  );
};

/**
 * Geometry-accurate SaaS workspace skeleton used during lazy-loaded route transitions.
 * Eliminates Cumulative Layout Shift (CLS) when switching farm modules.
 */
export const ModuleLoadingSkeleton: React.FC<{ label?: string }> = ({
  label = 'Loading farm module workspace...',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="space-y-6 py-2"
    >
      <span className="sr-only">{label}</span>

      {/* Top PageHeader Skeleton */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2.5 flex-1 max-w-md">
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-3.5 w-80" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* 4-Column KPI Strip Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {[0, 1, 2].map((idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden"
          >
            <div className="p-5 bg-slate-100 border-b border-slate-200/60 flex justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
              </div>
              <Skeleton className="h-14 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export interface EmptyStateProps {
  /** Custom icon element */
  icon?: ReactNode;
  /** Clear headline stating what is currently empty */
  title: string;
  /** Helpful explanation of what will appear once data is recorded or filters are cleared */
  description: string;
  /** Optional primary call-to-action button */
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: ReactNode;
  /** Optional secondary action (e.g., "Reset Filters") */
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  /** Compact mode for inline cards or table bodies */
  compact?: boolean;
  className?: string;
}

/**
 * Standardized Empty & Filtered-Zero State component.
 * Guides operators toward the next logical action when a collection or filter yields 0 records.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
  className = '',
}) => {
  return (
    <div
      role="region"
      aria-label={title}
      className={[
        'bg-white rounded-3xl border border-slate-200/80 text-center flex flex-col items-center justify-center',
        compact ? 'p-6 sm:p-8' : 'p-8 sm:p-12',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center mb-3.5 shadow-2xs">
        {icon || <Inbox className="w-6 h-6" aria-hidden="true" />}
      </div>

      <h3 className="text-base font-bold text-slate-900 max-w-md [text-wrap:balance]">
        {title}
      </h3>
      <p className="text-xs text-slate-500 max-w-md mt-1 leading-relaxed">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onSecondaryAction}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              {secondaryActionLabel}
            </Button>
          )}

          {actionLabel && onAction && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAction}
              leftIcon={actionIcon}
            >
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export interface AsyncStateBoundaryProps {
  /** Whether data is currently loading */
  isLoading?: boolean;
  /** Optional error message or Error object */
  error?: string | Error | null;
  /** Retry handler when in error state */
  onRetry?: () => void;
  /** Whether the resolved dataset is empty */
  isEmpty?: boolean;
  /** Props passed to EmptyState when `isEmpty` is true */
  emptyStateProps?: EmptyStateProps;
  /** Optional custom loading skeleton element */
  loadingFallback?: ReactNode;
  /** Populated view children */
  children: ReactNode;
}

/**
 * Declarative State Boundary orchestrating Loading -> Error -> Empty -> Populated states.
 */
export const AsyncStateBoundary: React.FC<AsyncStateBoundaryProps> = ({
  isLoading = false,
  error = null,
  onRetry,
  isEmpty = false,
  emptyStateProps,
  loadingFallback,
  children,
}) => {
  if (isLoading) {
    return <>{loadingFallback || <ModuleLoadingSkeleton />}</>;
  }

  if (error) {
    const errorMessage =
      typeof error === 'string'
        ? error
        : error.message || 'An unexpected error occurred while loading farm records.';

    return (
      <div
        role="alert"
        className="bg-white rounded-3xl border border-rose-200 p-8 text-center max-w-lg mx-auto my-6 space-y-4 shadow-xs"
      >
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/60 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">
            Unable to Load Module Data
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">{errorMessage}</p>
        </div>
        {onRetry && (
          <div className="pt-1">
            <Button
              variant="primary"
              size="sm"
              onClick={onRetry}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Retry Loading
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (isEmpty && emptyStateProps) {
    return <EmptyState {...emptyStateProps} />;
  }

  return <>{children}</>;
};

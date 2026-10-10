import React, { useRef, KeyboardEvent, ReactNode } from 'react';

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
  count?: number;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  /** Array of selectable options */
  options: SegmentedOption<T>[];
  /** Currently active option value */
  value: T;
  /** Callback fired when user selects a new segment */
  onChange: (value: T) => void;
  /** Accessible label describing the filter group */
  ariaLabel: string;
  /** Visual size scale */
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Accessible Segmented Filter Control (`role="tablist"` / `role="tab"`).
 * Supports ArrowLeft / ArrowRight / Home / End roving keyboard navigation
 * and enforces single-line `whitespace-nowrap` labels.
 */
export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'sm',
  className = '',
}: SegmentedControlProps<T>) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    const enabledIndices = options
      .map((opt, idx) => (!opt.disabled ? idx : -1))
      .filter((idx) => idx !== -1);

    if (enabledIndices.length === 0) return;

    const pos = enabledIndices.indexOf(currentIndex);
    let nextIndex: number | null = null;

    if (e.key === 'ArrowRight') {
      nextIndex = enabledIndices[(pos + 1) % enabledIndices.length];
    } else if (e.key === 'ArrowLeft') {
      nextIndex =
        enabledIndices[(pos - 1 + enabledIndices.length) % enabledIndices.length];
    } else if (e.key === 'Home') {
      nextIndex = enabledIndices[0];
    } else if (e.key === 'End') {
      nextIndex = enabledIndices[enabledIndices.length - 1];
    }

    if (nextIndex !== null) {
      e.preventDefault();
      const targetOption = options[nextIndex];
      onChange(targetOption.value);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  const buttonPadding =
    size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-xs';

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={[
        'inline-flex items-center gap-1 p-1 bg-slate-100 border border-slate-200/80 rounded-xl overflow-x-auto max-w-full scrollbar-none',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {options.map((opt, index) => {
        const isSelected = opt.value === value;

        return (
          <button
            key={opt.value}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={[
              'inline-flex items-center gap-1.5 font-semibold rounded-lg transition-all duration-150 whitespace-nowrap shrink-0',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
              'disabled:opacity-50 disabled:pointer-events-none',
              buttonPadding,
              isSelected
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60 cursor-default'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 cursor-pointer',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {opt.icon && (
              <span className="inline-flex shrink-0" aria-hidden="true">
                {opt.icon}
              </span>
            )}
            <span>{opt.label}</span>
            {typeof opt.count === 'number' && (
              <span
                className={`text-[11px] tabular-nums ${
                  isSelected ? 'text-teal-700 font-bold' : 'text-slate-400'
                }`}
              >
                ({opt.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

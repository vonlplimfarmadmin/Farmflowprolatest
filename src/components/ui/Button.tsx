import React, { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'emerald'
  | 'danger'
  | 'ghost'
  | 'outline'
  | 'dark';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant of the button */
  variant?: ButtonVariant;
  /** Size scale enforcing touch-friendly target heights and 2:1 horizontal-to-vertical padding */
  size?: ButtonSize;
  /** Shows a loading spinner and disables interaction while preserving button width */
  isLoading?: boolean;
  /** Optional accessible text replacement while loading */
  loadingText?: string;
  /** Leading icon element */
  leftIcon?: ReactNode;
  /** Trailing icon element */
  rightIcon?: ReactNode;
  /** Expands button to 100% of parent container width */
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-xs border border-teal-700/20 focus-visible:ring-teal-500',
  emerald:
    'bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 text-forest-950 font-black shadow-sm shadow-emerald-400/20 border border-emerald-500/30 focus-visible:ring-emerald-400',
  secondary:
    'bg-slate-100 hover:bg-slate-200 active:bg-slate-300/80 text-slate-700 border border-slate-200/80 focus-visible:ring-slate-400',
  outline:
    'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs focus-visible:ring-teal-500',
  danger:
    'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs border border-rose-700/20 focus-visible:ring-rose-500',
  ghost:
    'bg-transparent hover:bg-slate-100 active:bg-slate-200/60 text-slate-600 hover:text-slate-900 border border-transparent focus-visible:ring-slate-400',
  dark:
    'bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white shadow-xs border border-slate-700 focus-visible:ring-slate-500',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: 'min-h-[30px] px-2.5 py-1 text-[11px] rounded-lg gap-1.5',
  sm: 'min-h-[36px] px-3 py-1.5 text-xs rounded-xl gap-1.5',
  md: 'min-h-[40px] px-4 py-2.5 text-xs rounded-xl gap-2',
  lg: 'min-h-[44px] px-5 py-3 text-sm rounded-2xl gap-2.5',
};

/**
 * Production-grade accessible Button component.
 * Enforces single-line label discipline (`whitespace-nowrap shrink-0`),
 * WCAG 2.1 AA focus rings, `aria-busy` loading state, and 150ms tactile response.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      children,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const isDisabled = Boolean(disabled || isLoading);

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading || undefined}
        className={[
          'inline-flex items-center justify-center font-bold whitespace-nowrap shrink-0',
          'transition-all duration-150 ease-out select-none',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-55 disabled:pointer-events-none disabled:cursor-not-allowed',
          !isDisabled ? 'cursor-pointer active:scale-[0.98]' : '',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          fullWidth ? 'w-full' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
        ) : (
          leftIcon && (
            <span className="inline-flex shrink-0" aria-hidden="true">
              {leftIcon}
            </span>
          )
        )}

        <span className="truncate">{isLoading && loadingText ? loadingText : children}</span>

        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Mandatory accessible label for screen readers */
  'aria-label': string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon: ReactNode;
}

const ICON_SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: 'w-7 h-7 rounded-lg',
  sm: 'w-8 h-8 rounded-xl',
  md: 'w-10 h-10 rounded-xl',
  lg: 'w-11 h-11 rounded-2xl',
};

/**
 * Accessible Icon-only Button enforcing an explicit `aria-label` at compile time.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = 'ghost',
      size = 'sm',
      isLoading = false,
      icon,
      disabled,
      className = '',
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const isDisabled = Boolean(disabled || isLoading);

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading || undefined}
        className={[
          'inline-flex items-center justify-center shrink-0',
          'transition-all duration-150 ease-out select-none',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-55 disabled:pointer-events-none',
          !isDisabled ? 'cursor-pointer active:scale-95' : '',
          VARIANT_CLASSES[variant],
          ICON_SIZE_CLASSES[size],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          <span className="inline-flex items-center justify-center" aria-hidden="true">
            {icon}
          </span>
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

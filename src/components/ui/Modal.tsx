import React, { useEffect, useId, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
export type ModalTone = 'teal' | 'forest' | 'rose' | 'amber' | 'light';

export interface ModalProps {
  /** Controls whether the modal is mounted and visible */
  isOpen: boolean;
  /** Callback invoked on Escape key, close button click, or backdrop click */
  onClose: () => void;
  /** Primary dialog heading */
  title: ReactNode;
  /** Optional contextual subtitle or metadata line */
  subtitle?: ReactNode;
  /** Optional leading icon in the header */
  icon?: ReactNode;
  /** Dialog width preset */
  size?: ModalSize;
  /** Header visual theme */
  tone?: ModalTone;
  /** Dialog body content */
  children: ReactNode;
  /** Optional sticky footer slot for action buttons */
  footer?: ReactNode;
  /** Whether clicking the backdrop scrim closes the modal (default: true) */
  closeOnBackdropClick?: boolean;
  /** Optional custom class on the modal panel */
  className?: string;
}

const SIZE_MAX_WIDTH: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-5xl',
};

const TONE_HEADER_STYLES: Record<
  ModalTone,
  { container: string; title: string; subtitle: string; closeBtn: string }
> = {
  teal: {
    container: 'bg-teal-950 text-white border-b border-teal-900/50',
    title: 'text-white',
    subtitle: 'text-teal-300/85',
    closeBtn: 'text-teal-300 hover:text-white hover:bg-teal-900/60 focus-visible:ring-teal-400',
  },
  forest: {
    container: 'bg-forest-950 text-white border-b border-forest-900',
    title: 'text-white',
    subtitle: 'text-emerald-300/85',
    closeBtn: 'text-emerald-300 hover:text-white hover:bg-forest-900 focus-visible:ring-emerald-400',
  },
  rose: {
    container: 'bg-rose-950 text-white border-b border-rose-900/50',
    title: 'text-white',
    subtitle: 'text-rose-200/85',
    closeBtn: 'text-rose-300 hover:text-white hover:bg-rose-900/60 focus-visible:ring-rose-400',
  },
  amber: {
    container: 'bg-amber-950 text-white border-b border-amber-900/50',
    title: 'text-white',
    subtitle: 'text-amber-200/85',
    closeBtn: 'text-amber-300 hover:text-white hover:bg-amber-900/60 focus-visible:ring-amber-400',
  },
  light: {
    container: 'bg-slate-50 text-slate-900 border-b border-slate-200/80',
    title: 'text-slate-900',
    subtitle: 'text-slate-500',
    closeBtn: 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 focus-visible:ring-slate-400',
  },
};

/**
 * Accessible WAI-ARIA Dialog component (`role="dialog"`, `aria-modal="true"`).
 * Handles Escape-key dismissal, focus trapping/restoration, and body scroll locking.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  size = 'md',
  tone = 'teal',
  children,
  footer,
  closeOnBackdropClick = true,
  className = '',
}) => {
  const titleId = useId();
  const subtitleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Focus first focusable input or close button inside modal on open
    const focusTimer = window.setTimeout(() => {
      if (!dialogRef.current) return;
      const firstInput = dialogRef.current.querySelector<HTMLElement>(
        'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
      );
      firstInput?.focus();
    }, 10);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      previousActiveElementRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const headerStyle = TONE_HEADER_STYLES[tone];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onMouseDown={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        className={[
          'bg-white rounded-3xl shadow-2xl border border-slate-200 w-full overflow-hidden flex flex-col max-h-[90vh]',
          SIZE_MAX_WIDTH[size],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Modal Header */}
        <div className={`p-5 flex items-center justify-between gap-4 shrink-0 ${headerStyle.container}`}>
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="shrink-0 flex items-center justify-center" aria-hidden="true">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h3 id={titleId} className={`font-bold text-base truncate ${headerStyle.title}`}>
                {title}
              </h3>
              {subtitle && (
                <p id={subtitleId} className={`text-xs truncate mt-0.5 ${headerStyle.subtitle}`}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className={`p-1.5 rounded-xl transition cursor-pointer focus:outline-none focus-visible:ring-2 ${headerStyle.closeBtn}`}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {/* Optional Sticky Footer */}
        {footer && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

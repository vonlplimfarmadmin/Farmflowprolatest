import React, { ReactNode } from 'react';

export interface PageHeaderProps {
  /** Quiet domain category kicker above the title */
  kicker?: ReactNode;
  /** Optional leading icon for the kicker */
  kickerIcon?: ReactNode;
  /** Primary view heading */
  title: ReactNode;
  /** Concise operational description */
  description?: ReactNode;
  /** Unboxed inline metadata items separated by middle dots (`·`) */
  metadata?: ReactNode[];
  /** Right-aligned primary/secondary action controls */
  actions?: ReactNode;
  className?: string;
}

/**
 * Standardized Module Page Header enforcing balanced typography,
 * Zero-Pill unboxed metadata separators (`·`), and responsive action alignment.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  kicker,
  kickerIcon,
  title,
  description,
  metadata,
  actions,
  className = '',
}) => {
  const validMetadata = metadata?.filter(Boolean) ?? [];

  return (
    <header
      className={[
        'bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="min-w-0 space-y-1">
        {kicker && (
          <div className="flex items-center gap-1.5 text-teal-700 text-xs font-semibold tracking-tight">
            {kickerIcon && (
              <span className="inline-flex shrink-0" aria-hidden="true">
                {kickerIcon}
              </span>
            )}
            <span>{kicker}</span>
          </div>
        )}

        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight [text-wrap:balance]">
          {title}
        </h1>

        {description && (
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}

        {validMetadata.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500 tabular-nums">
            {validMetadata.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <span className="text-slate-300 select-none" aria-hidden="true">
                    ·
                  </span>
                )}
                <span>{item}</span>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
};

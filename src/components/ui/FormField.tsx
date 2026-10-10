import React, {
  forwardRef,
  useId,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from 'react';
import { AlertCircle } from 'lucide-react';

export interface BaseFieldProps {
  /** Field label text */
  label?: ReactNode;
  /** Optional helper hint displayed below the control */
  hint?: ReactNode;
  /** Validation error message; triggers `aria-invalid="true"` and live alert announcement */
  error?: string;
  /** Marks field as required visually and semantically */
  required?: boolean;
  /** Optional right-aligned label metadata (e.g. unit badge or character count) */
  labelRight?: ReactNode;
  /** Wrapper class name */
  containerClassName?: string;
}

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    BaseFieldProps {
  /** Leading icon or text unit inside input */
  leftAddon?: ReactNode;
  /** Trailing icon or text unit inside input */
  rightAddon?: ReactNode;
  /** Enforces `tabular-nums` for aligned numeric entry */
  tabularNums?: boolean;
  /** Visual size scale */
  inputSize?: 'sm' | 'md';
}

export interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement>,
    BaseFieldProps {
  inputSize?: 'sm' | 'md';
}

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    BaseFieldProps {}

/**
 * Standalone FormField layout wrapper for custom controls.
 */
export const FormField: React.FC<
  BaseFieldProps & { htmlFor?: string; children: ReactNode }
> = ({
  label,
  hint,
  error,
  required,
  labelRight,
  htmlFor,
  containerClassName = '',
  children,
}) => {
  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {(label || labelRight) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <label
              htmlFor={htmlFor}
              className="block text-xs font-semibold text-slate-700"
            >
              {label}
              {required && (
                <span className="text-rose-600 ml-0.5" aria-hidden="true">
                  *
                </span>
              )}
            </label>
          )}
          {labelRight && (
            <span className="text-[11px] text-slate-500 font-medium">
              {labelRight}
            </span>
          )}
        </div>
      )}

      {children}

      {error ? (
        <p
          role="alert"
          className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 pt-0.5"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : (
        hint && <p className="text-[11px] text-slate-500 pt-0.5">{hint}</p>
      )}
    </div>
  );
};

/**
 * Accessible Input control with automatic `useId()` label/error/hint association.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      required,
      labelRight,
      leftAddon,
      rightAddon,
      tabularNums,
      inputSize = 'md',
      containerClassName = '',
      className = '',
      id: providedId,
      type = 'text',
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = providedId || generatedId;
    const descriptionId = `${inputId}-desc`;
    const isNumeric = tabularNums ?? type === 'number';

    const sizeClasses =
      inputSize === 'sm' ? 'px-2.5 py-1.5 text-xs rounded-lg' : 'px-3 py-2 text-sm rounded-xl';

    return (
      <div className={`space-y-1 ${containerClassName}`}>
        {(label || labelRight) && (
          <div className="flex items-center justify-between gap-2">
            {label && (
              <label
                htmlFor={inputId}
                className="block text-xs font-semibold text-slate-700"
              >
                {label}
                {required && (
                  <span className="text-rose-600 ml-0.5" aria-hidden="true">
                    *
                  </span>
                )}
              </label>
            )}
            {labelRight && (
              <span className="text-[11px] text-slate-500 font-medium">
                {labelRight}
              </span>
            )}
          </div>
        )}

        <div className="relative flex items-center">
          {leftAddon && (
            <span
              className="absolute left-3 text-slate-400 pointer-events-none flex items-center"
              aria-hidden="true"
            >
              {leftAddon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            required={required}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error || hint ? descriptionId : undefined}
            className={[
              'w-full bg-white border transition-colors outline-hidden',
              'focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600',
              'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
              error
                ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-500/20'
                : 'border-slate-200 hover:border-slate-300',
              sizeClasses,
              leftAddon ? 'pl-9' : '',
              rightAddon ? 'pr-9' : '',
              isNumeric ? 'tabular-nums' : '',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...rest}
          />

          {rightAddon && (
            <span
              className="absolute right-3 text-slate-400 pointer-events-none flex items-center text-xs font-semibold"
              aria-hidden="true"
            >
              {rightAddon}
            </span>
          )}
        </div>

        {error ? (
          <p
            id={descriptionId}
            role="alert"
            className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 pt-0.5"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        ) : (
          hint && (
            <p id={descriptionId} className="text-[11px] text-slate-500 pt-0.5">
              {hint}
            </p>
          )
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * Accessible Select dropdown control with automatic `useId()` association.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      hint,
      error,
      required,
      labelRight,
      inputSize = 'md',
      containerClassName = '',
      className = '',
      id: providedId,
      children,
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = providedId || generatedId;
    const descriptionId = `${selectId}-desc`;

    const sizeClasses =
      inputSize === 'sm' ? 'px-2.5 py-1.5 text-xs rounded-lg' : 'px-3 py-2 text-sm rounded-xl';

    return (
      <div className={`space-y-1 ${containerClassName}`}>
        {(label || labelRight) && (
          <div className="flex items-center justify-between gap-2">
            {label && (
              <label
                htmlFor={selectId}
                className="block text-xs font-semibold text-slate-700"
              >
                {label}
                {required && (
                  <span className="text-rose-600 ml-0.5" aria-hidden="true">
                    *
                  </span>
                )}
              </label>
            )}
            {labelRight && (
              <span className="text-[11px] text-slate-500 font-medium">
                {labelRight}
              </span>
            )}
          </div>
        )}

        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error || hint ? descriptionId : undefined}
          className={[
            'w-full bg-white border transition-colors outline-hidden',
            'focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600',
            'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
            error
              ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-500/20'
              : 'border-slate-200 hover:border-slate-300',
            sizeClasses,
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        >
          {children}
        </select>

        {error ? (
          <p
            id={descriptionId}
            role="alert"
            className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 pt-0.5"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        ) : (
          hint && (
            <p id={descriptionId} className="text-[11px] text-slate-500 pt-0.5">
              {hint}
            </p>
          )
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

/**
 * Accessible Textarea control with automatic `useId()` association.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      hint,
      error,
      required,
      labelRight,
      containerClassName = '',
      className = '',
      id: providedId,
      rows = 2,
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = providedId || generatedId;
    const descriptionId = `${textareaId}-desc`;

    return (
      <div className={`space-y-1 ${containerClassName}`}>
        {(label || labelRight) && (
          <div className="flex items-center justify-between gap-2">
            {label && (
              <label
                htmlFor={textareaId}
                className="block text-xs font-semibold text-slate-700"
              >
                {label}
                {required && (
                  <span className="text-rose-600 ml-0.5" aria-hidden="true">
                    *
                  </span>
                )}
              </label>
            )}
            {labelRight && (
              <span className="text-[11px] text-slate-500 font-medium">
                {labelRight}
              </span>
            )}
          </div>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error || hint ? descriptionId : undefined}
          className={[
            'w-full px-3 py-2 text-sm bg-white border rounded-xl transition-colors outline-hidden',
            'focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600',
            'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
            error
              ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-500/20'
              : 'border-slate-200 hover:border-slate-300',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        />

        {error ? (
          <p
            id={descriptionId}
            role="alert"
            className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 pt-0.5"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        ) : (
          hint && (
            <p id={descriptionId} className="text-[11px] text-slate-500 pt-0.5">
              {hint}
            </p>
          )
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

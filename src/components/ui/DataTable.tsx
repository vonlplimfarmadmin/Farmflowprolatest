import React, { useState, useMemo, ReactNode } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { EmptyState, EmptyStateProps, Skeleton } from './StateViews';

export interface DataTableColumn<T> {
  /** Unique column identifier */
  id: string;
  /** Column header text */
  header: ReactNode;
  /** Cell renderer or property key */
  cell: (row: T, rowIndex: number) => ReactNode;
  /** Optional sort value extractor enabling client-side column sorting */
  sortValue?: (row: T) => string | number;
  /** Horizontal alignment; `'right'` automatically applies `tabular-nums` */
  align?: 'left' | 'center' | 'right';
  /** Optional column width or utility classes */
  className?: string;
}

export interface DataTableProps<T> {
  /** Array of data items to render */
  data: T[];
  /** Column configuration array */
  columns: DataTableColumn<T>[];
  /** Deterministic row key extractor */
  getRowKey: (row: T, index: number) => string;
  /** Accessible table caption for screen readers */
  caption: string;
  /** Shows geometry-matched loading skeleton rows */
  isLoading?: boolean;
  /** Number of skeleton rows to render when loading */
  skeletonRowCount?: number;
  /** Empty state configuration when `data.length === 0` */
  emptyState?: EmptyStateProps;
  /** Optional row click handler */
  onRowClick?: (row: T) => void;
  className?: string;
}

/**
 * High-density SaaS Data Table component.
 * Enforces compact row heights (40px), right-aligned `tabular-nums` numeric columns,
 * accessible `aria-sort` headers, loading skeletons, and integrated EmptyState.
 */
export function DataTable<T>({
  data,
  columns,
  getRowKey,
  caption,
  isLoading = false,
  skeletonRowCount = 5,
  emptyState,
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  const [sortColId, setSortColId] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (col: DataTableColumn<T>) => {
    if (!col.sortValue) return;
    if (sortColId === col.id) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColId(col.id);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortColId) return data;
    const col = columns.find((c) => c.id === sortColId);
    if (!col?.sortValue) return data;

    const extractor = col.sortValue;
    return [...data].sort((a, b) => {
      const valA = extractor(a);
      const valB = extractor(b);
      if (valA === valB) return 0;
      const cmp = valA < valB ? -1 : 1;
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [data, columns, sortColId, sortDirection]);

  if (!isLoading && data.length === 0 && emptyState) {
    return <EmptyState compact {...emptyState} />;
  }

  return (
    <div
      className={[
        'bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-600">
              {columns.map((col) => {
                const isSorted = sortColId === col.id;
                const alignClass =
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left';

                return (
                  <th
                    key={col.id}
                    scope="col"
                    aria-sort={
                      col.sortValue
                        ? isSorted
                          ? sortDirection === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                        : undefined
                    }
                    className={`px-4 py-3 whitespace-nowrap ${alignClass} ${col.className || ''}`}
                  >
                    {col.sortValue ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col)}
                        className="inline-flex items-center gap-1 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded px-1 -mx-1 cursor-pointer"
                      >
                        <span>{col.header}</span>
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3 h-3 text-teal-600" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-teal-600" aria-hidden="true" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400" aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {isLoading
              ? Array.from({ length: skeletonRowCount }).map((_, rIdx) => (
                  <tr key={rIdx} className="h-10">
                    {columns.map((col) => (
                      <td key={col.id} className="px-4 py-2.5">
                        <Skeleton className="h-3.5 w-full max-w-[120px]" />
                      </td>
                    ))}
                  </tr>
                ))
              : sortedData.map((row, rowIndex) => {
                  const isClickable = Boolean(onRowClick);
                  return (
                    <tr
                      key={getRowKey(row, rowIndex)}
                      onClick={isClickable ? () => onRowClick?.(row) : undefined}
                      tabIndex={isClickable ? 0 : undefined}
                      onKeyDown={
                        isClickable
                          ? (e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onRowClick?.(row);
                              }
                            }
                          : undefined
                      }
                      className={[
                        'h-10 transition-colors hover:bg-slate-50/80',
                        isClickable
                          ? 'cursor-pointer focus:outline-none focus-visible:bg-teal-50/50'
                          : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {columns.map((col) => {
                        const alignClass =
                          col.align === 'right'
                            ? 'text-right tabular-nums'
                            : col.align === 'center'
                            ? 'text-center tabular-nums'
                            : 'text-left';

                        return (
                          <td
                            key={col.id}
                            className={`px-4 py-2.5 whitespace-nowrap ${alignClass} ${
                              col.className || ''
                            }`}
                          >
                            {col.cell(row, rowIndex)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

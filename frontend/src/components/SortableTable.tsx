/**
 * Sortable Table Component
 * Adapted from 21st.dev (ddoemonn/sortable-table)
 * Customized for fraud detection dashboard with keyboard nav + accessibility
 * Uses motion/react with prefers-reduced-motion support
 */

'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { motion, useReducedMotion } from 'motion/react';

export type SortDirection = 'asc' | 'desc';
export type SortState = { columnId: string; direction: SortDirection };

export type TableColumn<T> = {
  id: string;
  header: string;
  width?: string;
  align?: 'start' | 'end';
  numeric?: boolean;
  sortable?: boolean;
  value?: (row: T) => string | number | null | undefined;
  cell?: (row: T) => ReactNode;
};

const CELL = {
  type: 'spring' as const,
  stiffness: 520,
  damping: 34,
  mass: 0.45,
};

const SMALL = {
  type: 'spring' as const,
  stiffness: 700,
  damping: 46,
  mass: 0.5,
};

const STEP = 0.018;
const STEP_CAP = 8;
const SETTLE_MS = 380;

interface SortableTableProps<T> {
  rows: T[];
  columns: TableColumn<T>[];
  getRowId: (row: T) => string;
  label: string;
  rowHeight?: number;
  maxHeight?: number;
  sort?: SortState | null;
  defaultSort?: SortState | null;
  onSortChange?: (next: SortState | null) => void;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function SortableTable<T>({
  rows,
  columns,
  getRowId,
  label,
  rowHeight = 44,
  maxHeight,
  sort,
  defaultSort = null,
  onSortChange,
  onRowClick,
  className = '',
}: SortableTableProps<T>) {
  const reduced = useReducedMotion();
  const [internal, setInternal] = useState<SortState | null>(defaultSort);
  const [moving, setMoving] = useState(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, []);

  const controlled = sort !== undefined;
  const current = controlled ? sort : internal;

  const collator = useMemo(
    () => new Intl.Collator('en', { numeric: true, sensitivity: 'base' }),
    []
  );

  const getValue = useCallback(
    (row: T, columnId: string) => {
      const column = columns.find((c) => c.id === columnId);
      return column?.value ? column.value(row) : null;
    },
    [columns]
  );

  const ordered = useMemo(() => {
    const base = rows.map((row, i) => ({
      id: getRowId(row),
      row,
      index: i,
    }));

    if (current) {
      const dir = current.direction === 'asc' ? 1 : -1;
      base.sort((x, y) => {
        const a = getValue(x.row, current.columnId);
        const b = getValue(y.row, current.columnId);
        const emptyA = a === null || a === undefined || a === '';
        const emptyB = b === null || b === undefined || b === '';

        if (emptyA || emptyB) {
          if (emptyA && emptyB) return x.index - y.index;
          return emptyA ? 1 : -1;
        }

        const d =
          typeof a === 'number' && typeof b === 'number'
            ? a - b
            : collator.compare(String(a), String(b));

        return d === 0 ? x.index - y.index : d * dir;
      });
    }

    return base.map(({ id, row }, newIndex) => ({
      id,
      row,
      index: newIndex,
    }));
  }, [rows, current, getRowId, getValue, collator]);

  const toggle = useCallback(
    (columnId: string) => {
      const next: SortState | null =
        !current || current.columnId !== columnId
          ? { columnId, direction: 'asc' }
          : current.direction === 'asc'
            ? { columnId, direction: 'desc' }
            : null;

      if (!controlled) setInternal(next);
      onSortChange?.(next);

      if (!reduced) {
        setMoving(true);
        if (settleTimer.current) clearTimeout(settleTimer.current);
        settleTimer.current = setTimeout(() => setMoving(false), SETTLE_MS);
      }
    },
    [current, controlled, onSortChange, reduced]
  );

  const ariaSort = useCallback(
    (columnId: string): 'ascending' | 'descending' | 'none' =>
      current?.columnId === columnId
        ? current.direction === 'asc'
          ? 'ascending'
          : 'descending'
        : 'none',
    [current]
  );

  const template = useMemo(
    () => columns.map((c) => c.width ?? 'minmax(0, 1fr)').join(' '),
    [columns]
  );

  return (
    <div
      className={`overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm ${className}`}
      role="table"
      aria-label={label}
      aria-rowcount={rows.length + 1}
      aria-colcount={columns.length}
    >
      {/* Header */}
      <div role="rowgroup">
        <div
          role="row"
          aria-rowindex={1}
          className="grid h-10 items-center gap-x-2 border-b border-zinc-200 dark:border-zinc-800 px-4 bg-zinc-50 dark:bg-zinc-800/50"
          style={{ gridTemplateColumns: template }}
        >
          {columns.map((column) => {
            const state = ariaSort(column.id);
            const active = state !== 'none';
            const end = column.align === 'end';

            return (
              <div
                key={column.id}
                role="columnheader"
                aria-sort={column.sortable === false ? undefined : state}
                className="min-w-0"
              >
                {column.sortable === false ? (
                  <span
                    className={`block truncate text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 ${
                      end ? 'text-right' : ''
                    }`}
                  >
                    {column.header}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggle(column.id)}
                    className={`group flex h-8 w-full items-center gap-2 rounded-md px-2 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 ${
                      end ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <span
                      className={`truncate text-xs font-semibold uppercase tracking-wider ${
                        active
                          ? 'text-zinc-900 dark:text-zinc-50'
                          : 'text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-50'
                      }`}
                    >
                      {column.header}
                    </span>
                    <motion.span
                      aria-hidden
                      className="shrink-0 text-zinc-900 dark:text-zinc-50"
                      initial={false}
                      animate={{
                        rotate: state === 'descending' ? 180 : 0,
                        opacity: active ? 1 : 0,
                        scale: active ? 1 : 0.72,
                      }}
                      transition={reduced ? { duration: 0 } : SMALL}
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                      >
                        <path
                          d="M5 8.6V1.6M5 1.6 2.2 4.4M5 1.6l2.8 2.8"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </motion.span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div
        role="rowgroup"
        className="relative overflow-y-auto"
        style={{
          height: (rows.length || 1) * rowHeight,
          maxHeight,
        }}
      >
        {rows.length === 0 && (
          <div
            role="row"
            className="absolute inset-x-0 top-0 flex items-center px-4"
            style={{ height: rowHeight }}
          >
            <span
              role="cell"
              className="text-sm text-zinc-500 dark:text-zinc-400"
            >
              No transactions found
            </span>
          </div>
        )}

        {ordered.map(({ id, row, index }) => (
          <motion.div
            key={id}
            role="row"
            aria-rowindex={index + 2}
            initial={false}
            animate={{ y: index * rowHeight }}
            transition={
              reduced
                ? { duration: 0 }
                : { ...CELL, delay: Math.min(index, STEP_CAP) * STEP }
            }
            onClick={() => onRowClick?.(row)}
            className={`absolute inset-x-0 top-0 grid items-center gap-x-2 px-4 border-b border-zinc-100 dark:border-zinc-800 transition-colors duration-150 ${
              onRowClick
                ? 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                : ''
            }`}
            style={{ height: rowHeight, gridTemplateColumns: template }}
          >
            {columns.map((column) => {
              const raw = column.value?.(row);
              const content =
                column.cell?.(row) ??
                (raw === null || raw === undefined || raw === ''
                  ? '—'
                  : String(raw));

              return (
                <div
                  key={column.id}
                  role="cell"
                  className={`min-w-0 truncate text-sm ${
                    column.align === 'end' ? 'text-right' : ''
                  } ${column.numeric ? 'font-mono' : ''} text-zinc-700 dark:text-zinc-300`}
                >
                  {content}
                </div>
              );
            })}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default SortableTable;

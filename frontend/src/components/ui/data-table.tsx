import * as React from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SkeletonTable } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

export interface ColumnDef<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (newPage: number) => void;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor?: (row: T, index: number) => string | number;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  pagination?: PaginationConfig;
  onRowClick?: (row: T) => void;
  striped?: boolean;
  hoverable?: boolean;
  className?: string;
  headerActions?: React.ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records matching your criteria.',
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  pagination,
  onRowClick,
  striped = false,
  hoverable = true,
  className,
  headerActions,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a: any, b: any) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return sortDirection === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [data, sortKey, sortDirection]);

  return (
    <div className={cn('space-y-3.5', className)}>
      {/* Table Toolbar (Search & Header Actions) */}
      {(onSearchChange || headerActions) && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {onSearchChange && (
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <input
                type="text"
                value={searchQuery ?? ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm bg-white placeholder-[#64748B]/60 text-[#17201A] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A] transition-all"
              />
            </div>
          )}
          {headerActions && <div className="flex items-center gap-2 self-end sm:self-auto">{headerActions}</div>}
        </div>
      )}

      {/* Table Card Wrapper */}
      <div className="rounded-2xl border border-gray-200/80 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <SkeletonTable rows={5} cols={columns.length} />
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            compact
            className="my-6"
          />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200/80 bg-gray-50/60 text-[#64748B] text-xs font-semibold uppercase tracking-wider">
                  {columns.map((col) => {
                    const alignClass =
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left';

                    return (
                      <th
                        key={col.key}
                        style={{ width: col.width }}
                        className={cn('py-3 px-4 font-semibold select-none', alignClass, col.className)}
                      >
                        {col.sortable ? (
                          <button
                            type="button"
                            onClick={() => handleSort(col.key)}
                            className="inline-flex items-center gap-1.5 hover:text-[#17201A] transition-colors group"
                          >
                            <span>{col.header}</span>
                            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#17201A]" />
                          </button>
                        ) : (
                          col.header
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedData.map((row, index) => {
                  const key = keyExtractor ? keyExtractor(row, index) : index;
                  return (
                    <tr
                      key={key}
                      onClick={() => onRowClick && onRowClick(row)}
                      className={cn(
                        'transition-colors duration-150 text-[#17201A]',
                        striped && index % 2 === 1 && 'bg-gray-50/40',
                        hoverable && 'hover:bg-gray-50/80',
                        onRowClick && 'cursor-pointer'
                      )}
                    >
                      {columns.map((col) => {
                        const alignClass =
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                            ? 'text-center'
                            : 'text-left';

                        return (
                          <td
                            key={col.key}
                            className={cn('py-3.5 px-4 align-middle', alignClass, col.className)}
                          >
                            {col.render
                              ? col.render(row, index)
                              : String((row as any)[col.key] ?? '-')}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination && pagination.total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/40 text-xs text-[#64748B]">
            <div>
              Showing{' '}
              <span className="font-semibold text-[#17201A]">
                {Math.min(
                  pagination.total,
                  (pagination.page - 1) * pagination.pageSize + 1
                )}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-[#17201A]">
                {Math.min(pagination.total, pagination.page * pagination.pageSize)}
              </span>{' '}
              of <span className="font-semibold text-[#17201A]">{pagination.total}</span> entries
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                className="p-1.5 rounded-lg border border-gray-200 text-[#64748B] hover:text-[#17201A] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2.5 font-medium text-[#17201A]">
                Page {pagination.page}
              </span>
              <button
                type="button"
                disabled={pagination.page * pagination.pageSize >= pagination.total}
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                className="p-1.5 rounded-lg border border-gray-200 text-[#64748B] hover:text-[#17201A] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DataTable;

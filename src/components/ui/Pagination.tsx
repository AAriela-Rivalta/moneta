import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { Button } from './Button';

interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, totalItems, onPageChange }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <nav className="flex items-center justify-between gap-3" aria-label="Paginación">
      <p className="text-sm text-ink-500">
        Mostrando <span className="font-semibold text-ink-800">{formatNumber(from)}–{formatNumber(to)}</span> de{' '}
        <span className="font-semibold text-ink-800">{formatNumber(totalItems)}</span>
      </p>
      {pageCount > 1 && (
        <div className="flex items-center gap-1.5">
          <Button variant="secondary" size="icon-sm" icon={ChevronLeft} onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Página anterior" />
          <span className="min-w-14 text-center text-sm font-medium text-ink-700">
            {page} / {pageCount}
          </span>
          <Button variant="secondary" size="icon-sm" icon={ChevronRight} onClick={() => onPageChange(page + 1)} disabled={page >= pageCount} aria-label="Página siguiente" />
        </div>
      )}
    </nav>
  );
}

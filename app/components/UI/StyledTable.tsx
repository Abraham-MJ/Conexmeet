'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export type Column<T> = {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  cell?: (item: T, key: number) => React.ReactNode;
  className?: string;
  highlightColor?: boolean;
};

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  footer?: React.ReactNode;
  className?: string;
  highlightOnHover?: boolean;
  isLoading?: boolean;
  skeletonRows?: number;
}

export function StyledTable<T>({
  data,
  columns,
  emptyMessage,
  footer,
  className = '',
  highlightOnHover = true,
  isLoading = false,
  skeletonRows = 10,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const defaultEmptyMessage = emptyMessage || t('common.noData');

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, data.length);
  const currentPageData = data.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);

      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 2) {
        endPage = 3;
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - 2;
      }

      if (startPage > 2) {
        pageNumbers.push('...');
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }

      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  return (
    <div
      className={`overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`whitespace-nowrap px-6 py-4 text-xs font-medium uppercase tracking-wider text-gray-500 ${
                    column.align === 'center'
                      ? 'text-center'
                      : column.align === 'right'
                        ? 'text-right'
                        : 'text-left'
                  } ${column.width ? column.width : ''} ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`} className="animate-pulse">
                  {columns.map((column, colIndex) => (
                    <td
                      key={`skeleton-${rowIndex}-${colIndex}`}
                      className={`whitespace-nowrap px-6 py-4 ${
                        column.align === 'center'
                          ? 'text-center'
                          : column.align === 'right'
                            ? 'text-right'
                            : 'text-left'
                      }`}
                    >
                      <div
                        className={`h-4 rounded bg-gray-200 ${
                          column.key === 'photo'
                            ? 'mx-auto h-10 w-10 rounded-full'
                            : 'w-3/4'
                        } ${column.align === 'right' ? 'ml-auto' : column.align === 'center' ? 'mx-auto' : ''}`}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : currentPageData.length > 0 ? (
              currentPageData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`transition-colors ${highlightOnHover ? 'hover:bg-gray-50/80' : ''}`}
                >
                  {columns.map((column) => {
                    const value = (row as any)[column.key];
                    return (
                      <td
                        key={`${rowIndex}-${column.key}`}
                        className={`whitespace-nowrap px-6 py-4 text-sm ${
                          column.align === 'center'
                            ? 'text-center'
                            : column.align === 'right'
                              ? 'text-right'
                              : 'text-left'
                        } ${
                          column.highlightColor
                            ? 'font-medium text-[#fc3d6b]'
                            : 'text-gray-700'
                        } ${column.className || ''}`}
                      >
                        {column.cell
                          ? column.cell(row, rowIndex)
                          : renderCellContent(value, t)}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  {defaultEmptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {footer && (
        <div className="border-t border-gray-100 bg-gray-50/80 px-6 py-3">
          {footer}
        </div>
      )}

      {!isLoading && data.length > itemsPerPage && (
        <div className="flex items-center justify-center border-t border-gray-100 bg-gray-50/80 px-6 py-3">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={t('pagination.previous')}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {getPageNumbers().map((pageNumber, index) =>
              typeof pageNumber === 'number' ? (
                <button
                  key={index}
                  onClick={() => goToPage(pageNumber)}
                  className={`flex h-8 min-w-[2rem] items-center justify-center rounded-md px-2 text-sm transition-colors ${
                    pageNumber === currentPage
                      ? 'bg-[#fc3d6b] text-white'
                      : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              ) : (
                <span key={index} className="px-1 text-gray-500">
                  {pageNumber}
                </span>
              ),
            )}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={t('pagination.next')}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function renderCellContent(content: any, t: (key: string) => string): React.ReactNode {
  if (content === null || content === undefined) {
    return '-';
  }

  if (
    typeof content === 'string' &&
    (content.startsWith('http') || content.startsWith('/')) &&
    (content.endsWith('.jpg') ||
      content.endsWith('.jpeg') ||
      content.endsWith('.png') ||
      content.endsWith('.webp') ||
      content.endsWith('.gif'))
  ) {
    return (
      <div className="flex justify-center">
        <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-[#fc3d6b]/10">
          <Image
            src={content || '/placeholder.svg'}
            alt={t('aria.image')}
            fill
            sizes="40px"
            className="object-cover"
            priority
          />
        </div>
      </div>
    );
  }

  if (typeof content === 'boolean') {
    return content ? t('common.yes') : t('common.no');
  }

  if (content instanceof Date) {
    return content.toLocaleDateString();
  }

  return String(content);
}

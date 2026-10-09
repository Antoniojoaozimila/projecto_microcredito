import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const AnimatedPagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemLabel = 'cotações',
}) => {
  if (totalPages <= 0) return null;

  const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  const btnBase =
    'p-2 rounded-xl transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 bg-gradient-to-r from-gray-50 to-emerald-50/40 border-t border-gray-200 rounded-b-xl">
      <p className="text-sm text-gray-600">
        Mostrando{' '}
        <span className="font-semibold text-gray-900">{start}</span> a{' '}
        <span className="font-semibold text-gray-900">{end}</span> de{' '}
        <span className="font-semibold text-emerald-700">{totalItems}</span> {itemLabel}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`${btnBase} text-gray-600 hover:bg-white hover:text-emerald-700`}
          title="Primeira página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${btnBase} text-gray-600 hover:bg-white hover:text-emerald-700`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1 mx-1">
          <AnimatePresence mode="popLayout">
            {getPageNumbers().map((page, idx) =>
              page === '...' ? (
                <span key={`dots-${idx}`} className="px-2 text-gray-400 select-none">
                  ···
                </span>
              ) : (
                <motion.button
                  key={page}
                  type="button"
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  onClick={() => onPageChange(page)}
                  className={`min-w-[2.25rem] h-9 px-2 rounded-xl text-sm font-semibold transition-colors duration-200 ${
                    currentPage === page
                      ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-200'
                      : 'text-gray-700 hover:bg-white hover:text-emerald-700'
                  }`}
                >
                  {page}
                </motion.button>
              )
            )}
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`${btnBase} text-gray-600 hover:bg-white hover:text-emerald-700`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`${btnBase} text-gray-600 hover:bg-white hover:text-emerald-700`}
          title="Última página"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default AnimatedPagination;

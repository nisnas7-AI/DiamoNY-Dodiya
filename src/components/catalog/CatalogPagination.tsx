import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface CatalogPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Minimalist Scandinavian-style pagination bar.
 * Fixed height (h-16) prevents footer CLS.
 */
const CatalogPagination = ({ currentPage, totalPages, onPageChange }: CatalogPaginationProps) => {
  if (totalPages <= 1) return null;

  // Generate page numbers to show (max 5 visible, with ellipsis)
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Always show first page
    pages.push(1);

    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    // Show pages around current
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

    // Always show last page
    if (!pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav 
      aria-label="Pagination" 
      className="flex justify-center items-center h-16 mt-8 mb-4"
      dir="ltr"
    >
      <ul className="flex items-center gap-1 md:gap-2">
        {/* Previous Button */}
        <li>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-body tracking-wide transition-all duration-200 rounded-md",
              currentPage === 1
                ? "text-muted-foreground/40 cursor-not-allowed"
                : "text-foreground hover:bg-accent/10 hover:text-accent"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">הקודם</span>
          </button>
        </li>

        {/* Page Numbers */}
        {pageNumbers.map((page, index) => (
          <li key={typeof page === 'number' ? page : `ellipsis-${index}`}>
            {page === 'ellipsis' ? (
              <span className="px-2 text-muted-foreground">…</span>
            ) : (
              <button
                onClick={() => onPageChange(page)}
                aria-label={`Page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
                className={cn(
                  "min-w-[40px] h-10 flex items-center justify-center text-sm font-body transition-all duration-200 rounded-md",
                  currentPage === page
                    ? "bg-accent text-white font-medium shadow-sm"
                    : "text-foreground hover:bg-accent/10 hover:text-accent"
                )}
              >
                {page}
              </button>
            )}
          </li>
        ))}

        {/* Next Button */}
        <li>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-body tracking-wide transition-all duration-200 rounded-md",
              currentPage === totalPages
                ? "text-muted-foreground/40 cursor-not-allowed"
                : "text-foreground hover:bg-accent/10 hover:text-accent"
            )}
          >
            <span className="hidden sm:inline">הבא</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default CatalogPagination;

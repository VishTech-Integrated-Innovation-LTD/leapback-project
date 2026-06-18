interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemsPerPage?: number;
    onItemsPerPageChange?: (limit: number) => void;
    totalItems?: number;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage,
    onItemsPerPageChange,
    totalItems
}) => {
    if (totalPages <= 1 && !itemsPerPage) return null;

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            onPageChange(page);
            window.scroll({ top: 0, behavior: 'smooth' });
        }
    };

    // Generate page numbers with ellipsis
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-4 border-t border-white/10">
            {/* Items per page and total count */}
            {(itemsPerPage || totalItems) && (
                <div className="flex items-center gap-3 text-sm text-white/40">
                    {totalItems && (
                        <span>{totalItems} total items</span>
                    )}
                    {onItemsPerPageChange && (
                        <div className="flex items-center gap-2">
                            <span>Show</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    onItemsPerPageChange(Number(e.target.value));
                                    onPageChange(1); // Reset to first page
                                }}
                                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white/60 text-xs focus:outline-none focus:border-[#E8A120]/50"
                            >
                                <option value={10} className="text-black">10</option>
                                <option value={20} className="text-black">20</option>
                                <option value={50} className="text-black">50</option>
                                <option value={100} className="text-black">100</option>
                            </select>
                            <span>per page</span>
                        </div>
                    )}
                </div>
            )}

            {/* Pagination buttons */}
            <div className="flex items-center gap-1.5">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                >
                    Previous
                </button>

                {getPageNumbers().map((page, idx) => (
                    <button
                        key={idx}
                        onClick={() => typeof page === 'number' && handlePageChange(page)}
                        className={`min-w-[32px] h-8 px-2 rounded-md text-sm font-medium transition-colors
                            ${currentPage === page 
                                ? 'bg-[#E8A120] text-[#0A0F1E]' 
                                : page === '...' 
                                    ? 'text-white/30 cursor-default'
                                    : 'text-white/60 hover:bg-white/5'
                            }`}
                        disabled={page === '...'}
                    >
                        {page}
                    </button>
                ))}

                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default Pagination;
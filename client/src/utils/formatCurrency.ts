// --------------------------------------------------------------------------
// FORMAT CURRENCY
// Formats a number as NGN currency string
// e.g. 1290000 → "NGN 1,290,000.00"
// --------------------------------------------------------------------------
export const formatCurrency = (amount: number | string): string => {
    const num = Number(amount);
    if (isNaN(num)) return 'NGN 0.00';
    return (
        'NGN ' +
        num.toLocaleString('en-NG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    );
};


// --------------------------------------------------------------------------
// FORMAT CURRENCY COMPACT
// Formats large numbers compactly for KPI cards
// e.g. 4200000 → "NGN 4.2M"   |   480000 → "NGN 480K"
// --------------------------------------------------------------------------
export const formatCurrencyCompact = (amount: number | string): string => {
    const num = Number(amount);
    if (isNaN(num)) return 'NGN 0';

    if (num >= 1_000_000) {
        return `NGN ${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    if (num >= 1_000) {
        return `NGN ${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    }
    return `NGN ${num}`;
};


// --------------------------------------------------------------------------
// FORMAT DATE
// Formats an ISO date string to a readable format
// e.g. "2026-03-03T00:00:00.000Z" → "Mar 3, 2026"
// --------------------------------------------------------------------------
export const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

// --------------------------------------------------------------------------
// GET STATUS COLOR
// Returns Tailwind classes for quote/invoice status badges
// --------------------------------------------------------------------------
export const getQuoteStatusColor = (status: string): string => {
    const map: Record<string, string> = {
        draft: 'bg-gray-100 text-gray-600',
        pending: 'bg-yellow-100 text-yellow-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
        cancelled: 'bg-gray-100 text-gray-500',
    };
    return map[status] ?? 'bg-gray-100 text-gray-600';
};

export const getInvoiceStatusColor = (status: string): string => {
    const map: Record<string, string> = {
        sent: 'bg-blue-100 text-blue-700',
        paid: 'bg-green-100 text-green-700',
        cancelled: 'bg-gray-100 text-gray-500',
    };
    return map[status] ?? 'bg-gray-100 text-gray-600';
};
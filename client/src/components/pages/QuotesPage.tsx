import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Quote } from '../../types';
import { formatCurrency, formatDate, getQuoteStatusColor } from '../../utils/formatCurrency';
import { getAllQuotes, updateQuoteStatus } from '../../api/quotes.api';
import {
    ArrowRightIcon, ArrowUpRightIcon,
    CheckCircleIcon, InvoiceIcon,
    MagnifyingGlassIcon, PencilSimpleIcon,
    WarningIcon, XCircleIcon, FileCsvIcon,
} from '@phosphor-icons/react';
import { usePermissions } from '../../hooks/usePermissions';
import { downloadCSV, type QuoteExportRow } from '../../utils/exportUtils';
import Pagination from '../ui/Pagination';


// --------------------------------------------------------------------------
// API ERROR HELPER
// --------------------------------------------------------------------------

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
        message?: string;
    };
    message?: string;
}
const getErrorMessage = (err: unknown): string => {
    // Type guard to check if error has the expected structure
    const isApiError = (error: unknown): error is ApiError => {
        return typeof error === 'object' && error !== null;
    };

    if (isApiError(err)) {
        return (
            err?.response?.data?.message ||
            err?.response?.message ||
            err?.message ||
            'Failed to approve quote'
        );
    }

    return 'Failed to approve quote';
};



// ----------------------------------------------------------------
// APPROVAL MODAL
// Shown when staff clicks "Approve" on a pending quote
// ----------------------------------------------------------------
interface ApprovalModalProps {
    quote: Quote;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
    error?: string;
}

const ApprovalModal = ({ quote, onConfirm, onCancel, isLoading }: ApprovalModalProps) => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
        <div className="bg-[#0D1526] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-[#E8A120]/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon size={24} weight="fill" className="text-[#E8A120]" />
            </div>
            <h3 className="text-white font-semibold text-center text-base mb-1">
                Approve Quote {quote.quoteNumber}?
            </h3>
            <p className="text-white/40 text-sm text-center mb-5">
                This will automatically generate an invoice, deduct inventory, and email the client.
            </p>
            <div className="bg-white/5 rounded-lg p-4 mb-5 space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-white/40">Client</span>
                    <span className="text-white font-medium">{quote.client?.clientName ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-white/40">Amount</span>
                    <span className="text-white font-medium">{formatCurrency(quote.grandTotal)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-white/40">Items</span>
                    <span className="text-white font-medium">
                        {quote.items?.length ?? 0} line item{(quote.items?.length ?? 0) !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>
            <p className="text-[#E8A120]/70 text-xs text-center mb-5 flex items-center justify-center gap-1.5">
                <WarningIcon size={13} weight="fill" />
                Inventory will be deducted immediately on approval.
            </p>
            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/60 text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className="flex-1 py-2.5 rounded-lg bg-[#E8A120] text-[#0A0F1E] text-sm font-semibold hover:bg-[#E8A120]/90 transition-colors disabled:opacity-60"
                >
                    {isLoading ? 'Approving...' : '✓ Confirm Approval'}
                </button>
            </div>
        </div>
    </div>
);


// ----------------------------------------------------------------
// STATUS FILTER TABS
// ----------------------------------------------------------------
const STATUS_TABS = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Cancelled', value: 'cancelled' },
];


// ----------------------------------------------------------------
// QUOTES PAGE
// ----------------------------------------------------------------
const QuotesPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const perms = usePermissions();

    const [activeTab, setActiveTab] = useState('');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

    const [approvalQuote, setApprovalQuote] = useState<Quote | null>(null);


    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);


    // Fetch quotes with active filters
    const { data, isLoading, isError } = useQuery({
        queryKey: ['quotes', activeTab, search],
        queryFn: () => getAllQuotes({ status: activeTab || undefined, search: search || undefined }),
        refetchInterval: 30_000,   // auto-refresh every 30 s 
        refetchOnMount: true,
        refetchOnWindowFocus: true,
    });

    // Mutation
    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' | 'cancelled' }) =>
            updateQuoteStatus(id, status),
        onSuccess: () => {
            // Invalidate both quotes AND invoices so the invoice list
            // shows the new invoice immediately without a manual refresh (Issue #3)
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            setApprovalQuote(null);
        },
        onError: (err) => {
            console.error("Approval failed:", err); // for debugging
        },
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
    };

    const handleExportCSV = () => {
        if (!quotes.length) return;
        const rows: QuoteExportRow[] = quotes.map(q => ({
            'Quote #': q.quoteNumber,
            Client: q.client?.clientName ?? '—',
            Items: q.items?.length ?? 0,
            'Amount (₦)': Number(q.grandTotal),
            Status: q.status,
            'Created At': formatDate(q.createdAt),
        }));
        downloadCSV('quotes-export', rows);
    };

    // Get quotes from API
    const quotes = data?.quotes ?? [];

    // Client-side pagination
    const totalPages = Math.ceil(quotes.length / itemsPerPage);
    const paginatedQuotes = quotes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-5">

            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-white/40 text-sm">
                    {data?.count ?? 0} total
                    {activeTab && ` · ${quotes.filter(q => q.status === activeTab).length} ${activeTab}`}
                </p>
                {perms.canExport && (
                    <button
                        onClick={handleExportCSV}
                        disabled={!quotes.length}
                        className="flex items-center gap-2 text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                    >
                        <FileCsvIcon size={14} />
                        Export CSV
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between gap-4 flex-wrap">

                {/* Status tabs */}
                <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === tab.value
                                ? 'bg-[#E8A120] text-[#0A0F1E]'
                                : 'text-white/50 hover:text-white'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <div className="relative">
                        <MagnifyingGlassIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            placeholder="Search by client name..."
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#E8A120]/50 w-56 transition-colors"
                        />
                    </div>
                    {search && (
                        <button type="button" onClick={() => { setSearch(''); setSearchInput(''); }} className="text-white/30 hover:text-white text-xs transition-colors">
                            Clear
                        </button>
                    )}
                </form>
            </div>

            {/* --------- Table ---------------------------------------------------------------- */}
            <div className="bg-[#0D1526] border border-white/10 rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-7 h-7 border-2 border-[#E8A120] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : isError ? (
                    <div className="flex items-center justify-center h-48 text-white/30 text-sm">
                        Failed to load quotes. Please refresh.
                    </div>
                ) : paginatedQuotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-white/30 text-sm gap-3">
                        <p>No quotes found.</p>
                        <button onClick={() => navigate('/quotes/new')} className="text-[#E8A120] text-xs font-medium flex gap-2 hover:underline">
                            Create your first quote <ArrowRightIcon />
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {/* <table className="w-full text-sm min-w-175"> */}
                        <table className="w-full text-sm min-w-187.5">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="text-left text-xs font-medium text-white/30 px-5 py-3.5">Quote ID</th>
                                    <th className="text-left text-xs font-medium text-white/30 px-5 py-3.5">Client</th>
                                    <th className="text-left text-xs font-medium text-white/30 px-5 py-3.5">Items</th>
                                    <th className="text-left text-xs font-medium text-white/30 px-5 py-3.5">Amount</th>
                                    <th className="text-left text-xs font-medium text-white/30 px-5 py-3.5">Status</th>
                                    <th className="text-left text-xs font-medium text-white/30 px-5 py-3.5">Date</th>
                                    <th className="text-right text-xs font-medium text-white/30 px-5 py-3.5">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedQuotes.map(quote => (
                                    <tr key={quote.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                                        <td className="px-5 py-4 font-medium text-white">#{quote.quoteNumber}</td>
                                        <td className="px-5 py-4 text-white/60">{quote.client?.clientName ?? '—'}</td>
                                        <td className="px-5 py-4 text-white/40">
                                            {quote.items?.length ?? 0} item{(quote.items?.length ?? 0) !== 1 ? 's' : ''}
                                        </td>
                                        <td className="px-5 py-4 text-white font-medium">{formatCurrency(quote.grandTotal)}</td>
                                        <td className="px-5 py-4">
                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${getQuoteStatusColor(quote.status)}`}>
                                                {quote.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-white/40">{formatDate(quote.createdAt)}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">

                                                {/* View — always visible */}
                                                <button
                                                    onClick={() => navigate(`/quotes/${quote.id}`)}
                                                    className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/20 px-2.5 py-1.5 rounded-lg transition-colors"
                                                >
                                                    <ArrowUpRightIcon size={13} />
                                                    View
                                                </button>

                                                {/* Edit — chief_admin only, draft quotes only (Issue #8) */}
                                                {perms.canEditQuote && quote.status === 'draft' && (
                                                    <button
                                                        onClick={() => navigate(`/quotes/${quote.id}/edit`)}
                                                        className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/20 px-2.5 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        <PencilSimpleIcon size={13} />
                                                        Edit
                                                    </button>
                                                )}

                                                {/* Approve — admin+ only, pending quotes only (Issue #7) */}
                                                {perms.canApproveQuote && quote.status === 'pending' && (
                                                    <button
                                                        onClick={() => setApprovalQuote(quote)}
                                                        className="flex items-center gap-1.5 text-xs text-[#0A0F1E] bg-[#E8A120] hover:bg-[#E8A120]/90 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                                                    >
                                                        <CheckCircleIcon size={13} weight="fill" />
                                                        Approve
                                                    </button>
                                                )}

                                                {/* Reject — admin+ only, pending quotes only (Issue #7) */}
                                                {perms.canRejectQuote && quote.status === 'pending' && (
                                                    <button
                                                        onClick={() => statusMutation.mutate({ id: quote.id, status: 'rejected' })}
                                                        className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 border border-red-400/20 hover:border-red-400/40 px-2.5 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        <XCircleIcon size={13} weight="fill" />
                                                        Reject
                                                    </button>
                                                )}

                                                {/* View Invoice — approved quotes */}
                                                {quote.status === 'approved' && perms.canViewInvoices && (
                                                    <button
                                                        onClick={() => navigate('/invoices')}
                                                        className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 border border-blue-400/20 hover:border-blue-400/40 px-2.5 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        <InvoiceIcon size={13} weight="fill" />
                                                        Invoice
                                                    </button>
                                                )}

                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination - only show if there are items */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={(limit) => {
                    setItemsPerPage(limit);
                    setCurrentPage(1);
                }}
                totalItems={quotes.length}
            />

            {/* Approval Modal */}
            {approvalQuote && (
                <ApprovalModal
                    quote={approvalQuote}
                    isLoading={statusMutation.isPending}
                    error={statusMutation.error ? getErrorMessage(statusMutation.error) : undefined}
                    onConfirm={() => statusMutation.mutate({ id: approvalQuote.id, status: 'approved' })}
                    onCancel={() => {
                        setApprovalQuote(null);
                        statusMutation.reset(); // Clear error + loading state
                    }}
                // onCancel={() => setApprovalQuote(null)}
                />
            )}

        </div>
    );
};

export default QuotesPage;

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeftIcon,
    CheckCircleIcon,
    XCircleIcon,
    WarningIcon,
    FilePdfIcon,
    UserIcon,
    CalendarBlankIcon,
} from '@phosphor-icons/react';
import { getQuoteById, updateQuoteStatus } from '../../api/quotes.api';
import {
    formatCurrency,
    formatDate,
    getQuoteStatusColor,
} from '../../utils/formatCurrency';


// --------------------------------------------------------------------------
// QUOTE DETAIL PAGE
// --------------------------------------------------------------------------

const QuoteDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showApprove, setShowApprove] = useState(false);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['quote', id],
        queryFn: () => getQuoteById(id!),
        enabled: !!id,
    });

    const statusMutation = useMutation({
        mutationFn: (status: 'approved' | 'rejected' | 'cancelled') =>
            updateQuoteStatus(id!, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quote', id] });
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            setShowApprove(false);
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-7 h-7 border-2 border-[#E8A120] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (isError || !data?.quote) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <p className="text-white/40 text-sm">Quote not found.</p>
                <button
                    onClick={() => navigate('/quotes')}
                    className="text-[#E8A120] text-sm hover:underline"
                >
                    ← Back to Quotes
                </button>
            </div>
        );
    }

    const quote = data.quote;


    return (
        <div className="space-y-5 max-w-4xl">

            {/* Back + Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <button
                        onClick={() => navigate('/quotes')}
                        className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-3 transition-colors"
                    >
                        <ArrowLeftIcon size={15} />
                        Back to Quotes
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-white">#{quote.quoteNumber}</h1>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${getQuoteStatusColor(quote.status)}`}>
                            {quote.status}
                        </span>
                    </div>
                </div>

                {/* Actions — only shown on pending quotes */}
                {quote.status === 'pending' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => statusMutation.mutate('rejected')}
                            disabled={statusMutation.isPending}
                            className="flex items-center gap-1.5 text-sm text-red-400 border border-red-400/20 hover:border-red-400/40 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <XCircleIcon size={16} weight="fill" />
                            Reject
                        </button>
                        <button
                            onClick={() => setShowApprove(true)}
                            disabled={statusMutation.isPending}
                            className="flex items-center gap-1.5 text-sm bg-[#E8A120] text-[#0A0F1E] font-semibold px-4 py-2 rounded-lg hover:bg-[#E8A120]/90 transition-colors disabled:opacity-50"
                        >
                            <CheckCircleIcon size={16} weight="fill" />
                            Approve Quote
                        </button>
                    </div>
                )}
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-[#0D1526] border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-white/40 text-xs mb-1.5">
                        <UserIcon size={13} />
                        Client
                    </div>
                    <p className="text-white font-medium text-sm">{quote.client?.clientName ?? '—'}</p>
                    <p className="text-white/40 text-xs mt-0.5">{quote.client?.email ?? ''}</p>
                </div>

                <div className="bg-[#0D1526] border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-white/40 text-xs mb-1.5">
                        <CalendarBlankIcon size={13} />
                        Created
                    </div>
                    <p className="text-white font-medium text-sm">{formatDate(quote.createdAt)}</p>
                    <p className="text-white/40 text-xs mt-0.5">by {quote.creator?.name ?? '—'}</p>
                </div>

                {quote.sentAt && (
                    <div className="bg-[#0D1526] border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-white/40 text-xs mb-1.5">
                            <FilePdfIcon size={13} />
                            Sent to Client
                        </div>
                        <p className="text-white font-medium text-sm">{formatDate(quote.sentAt)}</p>
                        <p className="text-white/40 text-xs mt-0.5">PDF emailed automatically</p>
                    </div>
                )}
            </div>

            {/* Line Items */}
            <div className="bg-[#0D1526] border border-white/10 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10">
                    <h3 className="text-sm font-semibold text-white">Line Items</h3>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="text-left text-xs font-medium text-white/30 px-5 py-3">Item</th>
                            <th className="text-left text-xs font-medium text-white/30 px-5 py-3">Type</th>
                            <th className="text-right text-xs font-medium text-white/30 px-5 py-3">Qty</th>
                            <th className="text-right text-xs font-medium text-white/30 px-5 py-3">Unit Price</th>
                            <th className="text-right text-xs font-medium text-white/30 px-5 py-3">Line Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(quote.items ?? []).map((item, i) => (
                            <tr key={item.id ?? i} className="border-b border-white/5">
                                <td className="px-5 py-3.5 text-white font-medium">{item.itemName}</td>
                                <td className="px-5 py-3.5">
                                    <span className="text-xs text-white/40 capitalize">{item.itemType}</span>
                                </td>
                                <td className="px-5 py-3.5 text-white/60 text-right">{item.quantity}</td>
                                <td className="px-5 py-3.5 text-white/60 text-right">{formatCurrency(item.unitPrice)}</td>
                                <td className="px-5 py-3.5 text-white font-medium text-right">{formatCurrency(item.lineTotal)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="px-5 py-4 border-t border-white/10 flex justify-end">
                    <div className="w-64 space-y-2 text-sm">
                        <div className="flex justify-between text-white/50">
                            <span>Subtotal</span>
                            <span>{formatCurrency(quote.subtotal)}</span>
                        </div>
                        {quote.vatRate && quote.vatAmount && (
                            <div className="flex justify-between text-white/50">
                                <span>VAT ({quote.vatRate}%)</span>
                                <span>{formatCurrency(quote.vatAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-white font-bold text-base border-t border-white/10 pt-2">
                            <span>Grand Total</span>
                            <span className="text-[#E8A120]">{formatCurrency(quote.grandTotal)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notes */}
            {quote.notes && (
                <div className="bg-[#0D1526] border border-white/10 rounded-xl p-5">
                    <h3 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-2">Notes</h3>
                    <p className="text-white/60 text-sm leading-relaxed">{quote.notes}</p>
                </div>
            )}


            {/* Approval Modal */}
            {showApprove && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
                    <div className="bg-[#0D1526] border border-white/10 rounded-2xl w-full max-w-sm p-6">

                        <div className="w-12 h-12 rounded-full bg-[#E8A120]/10 flex items-center justify-center mx-auto mb-4">
                            <CheckCircleIcon size={24} weight="fill" className="text-[#E8A120]" />
                        </div>

                        <h3 className="text-white font-semibold text-center mb-1">
                            Approve {quote.quoteNumber}?
                        </h3>
                        <p className="text-white/40 text-sm text-center mb-5">
                            This will generate a PDF invoice and deduct inventory automatically.
                        </p>

                        <div className="bg-white/5 rounded-lg p-4 mb-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-white/40">Client</span>
                                <span className="text-white">{quote.client?.clientName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/40">Amount</span>
                                <span className="text-white font-bold">{formatCurrency(quote.grandTotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/40">Items</span>
                                <span className="text-white">{quote.items?.length ?? 0} line items</span>
                            </div>
                        </div>

                        <p className="text-[#E8A120]/70 text-xs text-center mb-5 flex items-center justify-center gap-1.5">
                            <WarningIcon size={13} weight="fill" />
                            Inventory will be deducted immediately on approval.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowApprove(false)}
                                className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => statusMutation.mutate('approved')}
                                disabled={statusMutation.isPending}
                                className="flex-1 py-2.5 rounded-lg bg-[#E8A120] text-[#0A0F1E] text-sm font-semibold hover:bg-[#E8A120]/90 transition-colors disabled:opacity-60"
                            >
                                {statusMutation.isPending ? 'Approving...' : '✓ Confirm'}
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    )
}

export default QuoteDetailPage

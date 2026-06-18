// ============================================================
// Edits a quote that is still in 'draft' status.
// Route: /quotes/:id/edit  (chief_admin only via RoleRoute)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
    PlusIcon, TrashIcon, ArrowLeftIcon,
    WarningIcon, CheckCircleIcon,
} from '@phosphor-icons/react';
import { getQuoteById, updateQuote, submitQuote } from '../../api/quotes.api';
import { getAllClients } from '../../api/clients.api';
import { getAllInventory } from '../../api/inventory.api';
import { formatCurrency } from '../../utils/formatCurrency';
import { useToast } from '../../stores/useToastStore';
import type { Client, InventoryItem } from '../../types';

// ── Types ──────────────────────────────────────────────────
interface LineItem {
    id: string;
    inventoryId: string | null;
    itemName: string;
    itemType: 'product' | 'service' | '';
    quantity: number;
    unitPrice: number;
}

interface QuoteItemData {
    inventoryId?: string | null;
    itemName: string;
    itemType: 'product' | 'service';
    quantity: number;
    unitPrice: number;
    lineTotal?: number;
}

interface QuoteData {
    id: string;
    status: string;
    clientId?: string;
    client?: { id: string };
    notes?: string | null;
    vatRate?: number | null;
    items?: QuoteItemData[];
}

interface ApiError {
    response?: { data?: { message?: string } };
}

const getErrMsg = (err: unknown): string => {
    const e = err as ApiError;
    return e?.response?.data?.message ?? 'Something went wrong';
};

const emptyItem = (): LineItem => ({
    id: crypto.randomUUID(),
    inventoryId: null,
    itemName: '',
    itemType: '',
    quantity: 1,
    unitPrice: 0,
});

// ── Helper to map quote item to line item ──────────────────
const mapQuoteItemToLineItem = (item: QuoteItemData): LineItem => ({
    id: crypto.randomUUID(),
    inventoryId: item.inventoryId ?? null,
    itemName: item.itemName ?? '',
    itemType: (item.itemType ?? '') as 'product' | 'service' | '',
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
});


// ── Edit Quote Page ─────────────────────────────────────────
const EditQuotePage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const toast = useToast();

    const [selectedClientId, setSelectedClientId] = useState('');
    const [lineItems, setLineItems] = useState<LineItem[]>([emptyItem()]);
    const [notes, setNotes] = useState('');
    const [useVat, setUseVat] = useState(false);
    const [vatRate, setVatRate] = useState(7.5);
    const [formError, setFormError] = useState('');
    const [saved, setSaved] = useState(false);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    // ── Fetch the existing quote ────────────────────────────
    const { data: quoteData, isLoading: quoteLoading } = useQuery({
        queryKey: ['quote', id],
        queryFn: () => getQuoteById(id!),
        enabled: !!id,
    });

    // ── Fetch reference data ────────────────────────────────
    // Wrapped in arrow functions so TanStack Query can infer the return types correctly
    const { data: clientsData } = useQuery({
        queryKey: ['clients'],
        queryFn: () => getAllClients()
    });
    
    const { data: inventoryData } = useQuery({
        queryKey: ['inventory'],
        queryFn: () => getAllInventory()
    });

    const allClients: Client[] = clientsData?.clients ?? [];
    const inventoryItems: InventoryItem[] = inventoryData?.items ?? [];

    // ── Pre-populate form once quote loads (FIXED: No cascading renders) ──
    const populateForm = useCallback((quote: QuoteData) => {
        if (!quote) return;

        // Redirect if quote is no longer a draft
        if (quote.status !== 'draft') {
            toast.warning('Only draft quotes can be edited.');
            navigate(`/quotes/${id}`);
            return;
        }

        setSelectedClientId(quote.clientId ?? quote.client?.id ?? '');
        setNotes(quote.notes ?? '');
        setUseVat(!!quote.vatRate);
        setVatRate(quote.vatRate ?? 7.5);
        
        if (quote.items && quote.items.length > 0) {
            setLineItems(quote.items.map(mapQuoteItemToLineItem));
        } else {
            setLineItems([emptyItem()]);
        }
        
        setIsDataLoaded(true);
    }, [id, navigate, toast]);

    // Effect to populate form when quote data is ready
    useEffect(() => {
        const q = quoteData?.quote;
        if (q && !isDataLoaded) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            populateForm(q);
        }
    }, [quoteData, populateForm, isDataLoaded]);

    // ── Totals ──────────────────────────────────────────────
    const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const vatAmount = useVat ? parseFloat((subtotal * vatRate / 100).toFixed(2)) : 0;
    const grandTotal = subtotal + vatAmount;

    // ── Line item handlers ──────────────────────────────────
    const addItem = () => setLineItems(prev => [...prev, emptyItem()]);
    
    const removeItem = (itemId: string) => {
        if (lineItems.length === 1) {
            toast.warning('You need at least one line item');
            return;
        }
        setLineItems(prev => prev.filter(item => item.id !== itemId));
    };
    
    const updateItem = (itemId: string, changes: Partial<LineItem>) => {
        setLineItems(prev =>
            prev.map(item =>
                item.id === itemId ? { ...item, ...changes } : item
            )
        );
    };

    const handleInventorySelect = (itemId: string, inventoryId: string) => {
        if (!inventoryId) {
            updateItem(itemId, {
                inventoryId: null,
                itemName: '',
                itemType: '',
                unitPrice: 0
            });
            return;
        }
        
        const inventoryItem = inventoryItems.find(i => i.id === inventoryId);
        if (inventoryItem) {
            updateItem(itemId, {
                inventoryId: inventoryItem.id,
                itemName: inventoryItem.name,
                itemType: inventoryItem.type,
                unitPrice: Number(inventoryItem.unitPrice)
            });
        }
    };

    // ── Validate ────────────────────────────────────────────
    const validate = (): boolean => {
        if (!selectedClientId) {
            setFormError('Please select a client');
            toast.error('Please select a client');
            return false;
        }
        
        if (lineItems.length === 0) {
            setFormError('Please add at least one line item');
            toast.error('Please add at least one line item');
            return false;
        }
        
        for (const item of lineItems) {
            if (!item.itemName.trim()) {
                setFormError('All line items must have a name');
                toast.error('All line items must have a name');
                return false;
            }
            if (!item.itemType) {
                setFormError('All line items must have a type');
                toast.error('All line items must have a type');
                return false;
            }
            if (item.quantity <= 0) {
                setFormError('Quantity must be greater than 0');
                toast.error('Quantity must be greater than 0');
                return false;
            }
            if (item.unitPrice < 0) {
                setFormError('Unit price cannot be negative');
                toast.error('Unit price cannot be negative');
                return false;
            }
        }
        
        setFormError('');
        return true;
    };

    // ── Save Draft mutation (without submit flag) ───────────
    const saveDraftMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                items: lineItems.map(({ inventoryId, itemName, itemType, quantity, unitPrice }) => ({
                    inventoryId: inventoryId ?? undefined,
                    itemName: itemName.trim(),
                    itemType: itemType as 'product' | 'service',
                    quantity,
                    unitPrice,
                })),
                notes: notes || undefined,
                vatRate: useVat ? vatRate : undefined,
            };
            
            return await updateQuote(id!, payload);
        },
        onSuccess: () => {
            setSaved(true);
            toast.success('Draft saved successfully');
            setTimeout(() => setSaved(false), 3000);
        },
        onError: (err) => {
            const errorMsg = getErrMsg(err);
            setFormError(errorMsg);
            toast.error(errorMsg);
        },
    });

    // ── Submit mutation (separate API call) ─────────────────
    const submitMutation = useMutation({
        mutationFn: async () => {
            // First save the draft, then submit
            const payload = {
                items: lineItems.map(({ inventoryId, itemName, itemType, quantity, unitPrice }) => ({
                    inventoryId: inventoryId ?? undefined,
                    itemName: itemName.trim(),
                    itemType: itemType as 'product' | 'service',
                    quantity,
                    unitPrice,
                })),
                notes: notes || undefined,
                vatRate: useVat ? vatRate : undefined,
            };
            
            await updateQuote(id!, payload);
            return await submitQuote(id!);
        },
        onSuccess: () => {
            toast.success('Quote submitted for approval');
            navigate(`/quotes/${id}`);
        },
        onError: (err) => {
            const errorMsg = getErrMsg(err);
            setFormError(errorMsg);
            toast.error(errorMsg);
        },
    });

    const handleSaveDraft = () => {
        if (validate()) {
            saveDraftMutation.mutate();
        }
    };

    const handleSubmit = () => {
        if (validate()) {
            if (window.confirm('Submit this quote for approval? Once submitted, it cannot be edited.')) {
                submitMutation.mutate();
            }
        }
    };

    const isPending = saveDraftMutation.isPending || submitMutation.isPending;

    if (quoteLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-7 h-7 border-2 border-[#E8A120] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl space-y-6">

            {/* Back */}
            <button
                onClick={() => navigate(`/quotes/${id}`)}
                className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors"
            >
                <ArrowLeftIcon size={15} />
                Back to Quote
            </button>

            {/* Success banner */}
            {saved && (
                <div className="flex items-center gap-2.5 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-lg px-4 py-3">
                    <CheckCircleIcon size={16} weight="fill" className="shrink-0" />
                    Draft saved successfully — you can keep editing or submit when ready.
                </div>
            )}

            {/* Error banner */}
            {formError && (
                <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">
                    <WarningIcon size={16} weight="fill" className="shrink-0 mt-0.5" />
                    {formError}
                </div>
            )}

            {/* Info banner */}
            <div className="flex items-center gap-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm rounded-lg px-4 py-3">
                <WarningIcon size={16} weight="fill" className="shrink-0" />
                You are editing a draft quote. Make your changes below.
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* ── Left column ─────────────────────────────────── */}
                <div className="xl:col-span-2 space-y-5">

                    {/* A — Client */}
                    <div className="bg-[#0D1526] border border-white/10 rounded-xl p-5">
                        <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">
                            A · Client Information
                        </h3>
                        <div>
                            <label className="block text-xs text-white/40 mb-1.5">Select Client</label>
                            <select
                                value={selectedClientId}
                                onChange={e => setSelectedClientId(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#E8A120]/50 transition-colors appearance-none"
                            >
                                <option value="" className="bg-[#0D1526]">--- Select a client ---</option>
                                {allClients.map(c => (
                                    <option key={c.id} value={c.id} className="bg-[#0D1526]">{c.clientName}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Show selected client details */}
                        {selectedClientId && (() => {
                            const client = allClients.find(c => c.id === selectedClientId);
                            return client ? (
                                <div className="mt-3 bg-white/5 rounded-lg px-4 py-2.5">
                                    <p className="text-white/60 text-xs">{client.email}</p>
                                    {client.phone && <p className="text-white/40 text-xs mt-0.5">{client.phone}</p>}
                                </div>
                            ) : null;
                        })()}
                    </div>

                    {/* B — Line Items */}
                    <div className="bg-[#0D1526] border border-white/10 rounded-xl p-5">
                        <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">
                            B · Line Items
                        </h3>

                        <div className="space-y-3">
                            {lineItems.map((item, idx) => (
                                <div key={item.id} className="bg-white/3 border border-white/5 rounded-xl p-4 space-y-3">

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-white/30 font-medium">Item {idx + 1}</span>
                                        {lineItems.length > 1 && (
                                            <button onClick={() => removeItem(item.id)} className="text-white/20 hover:text-red-400 transition-colors">
                                                <TrashIcon size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Inventory dropdown */}
                                    <div>
                                        <label className="block text-xs text-white/40 mb-1">From Catalogue (optional)</label>
                                        <select
                                            value={item.inventoryId ?? ''}
                                            onChange={e => handleInventorySelect(item.id, e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#E8A120]/50 transition-colors appearance-none"
                                        >
                                            <option value="" className="bg-[#0D1526]">— Select from inventory —</option>
                                            {inventoryItems.map(inv => (
                                                <option key={inv.id} value={inv.id} className="bg-[#0D1526]">
                                                    {inv.name} — {formatCurrency(inv.unitPrice)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <label className="block text-xs text-white/40 mb-1">Item Name *</label>
                                            <input
                                                value={item.itemName}
                                                onChange={e => updateItem(item.id, { itemName: e.target.value })}
                                                placeholder="e.g. Solar Panel 400W"
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#E8A120]/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-white/40 mb-1">Type *</label>
                                            <select
                                                value={item.itemType}
                                                onChange={e => updateItem(item.id, { itemType: e.target.value as 'product' | 'service' })}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#E8A120]/50 appearance-none"
                                            >
                                                <option value="" className="bg-[#0D1526]">— type —</option>
                                                <option value="product" className="bg-[#0D1526]">Product</option>
                                                <option value="service" className="bg-[#0D1526]">Service</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-white/40 mb-1">Quantity *</label>
                                            <input
                                                type="number" min={1}
                                                value={item.quantity}
                                                onChange={e => updateItem(item.id, { quantity: Number(e.target.value) })}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#E8A120]/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-white/40 mb-1">Unit Price (NGN) *</label>
                                            <input
                                                type="number" min={0} step={0.01}
                                                value={item.unitPrice}
                                                onChange={e => updateItem(item.id, { unitPrice: Number(e.target.value) })}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#E8A120]/50"
                                            />
                                        </div>
                                        <div className="col-span-2 text-right text-xs text-white/40">
                                            Subtotal: <span className="text-white font-medium">{formatCurrency(item.quantity * item.unitPrice)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={addItem}
                            className="mt-4 flex items-center gap-2 text-sm text-[#E8A120] hover:text-[#E8A120]/80 transition-colors"
                        >
                            <PlusIcon size={16} weight="bold" />
                            Add Another Item
                        </button>
                    </div>

                    {/* C — Notes */}
                    <div className="bg-[#0D1526] border border-white/10 rounded-xl p-5">
                        <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">
                            C · Notes (Optional)
                        </h3>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Any additional notes for this quote..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#E8A120]/50 resize-none"
                        />
                    </div>
                </div>

                {/* ── Right column — summary ───────────────────────── */}
                <div className="space-y-5">
                    <div className="bg-[#0D1526] border border-white/10 rounded-xl p-5 sticky top-6">
                        <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">
                            Summary
                        </h3>

                        {/* VAT toggle */}
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-white/60">Apply VAT</span>
                            <button
                                onClick={() => setUseVat(p => !p)}
                                className={`w-10 h-5 rounded-full transition-colors relative ${useVat ? 'bg-[#E8A120]' : 'bg-white/10'}`}
                            >
                                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${useVat ? 'right-0.5' : 'left-0.5'}`} />
                            </button>
                        </div>
                        {useVat && (
                            <div className="mb-4">
                                <label className="block text-xs text-white/40 mb-1">VAT Rate (%)</label>
                                <input
                                    type="number" min={0} max={100} step={0.5}
                                    value={vatRate}
                                    onChange={e => setVatRate(Number(e.target.value))}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#E8A120]/50"
                                />
                            </div>
                        )}

                        <div className="space-y-2 text-sm border-t border-white/5 pt-4">
                            <div className="flex justify-between text-white/60">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            {useVat && (
                                <div className="flex justify-between text-white/60">
                                    <span>VAT ({vatRate}%)</span>
                                    <span>{formatCurrency(vatAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-white font-semibold text-base border-t border-white/5 pt-2">
                                <span>Total</span>
                                <span>{formatCurrency(grandTotal)}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 space-y-3">
                            <button
                                onClick={handleSaveDraft}
                                disabled={isPending}
                                className="w-full py-3 rounded-xl border border-white/15 text-white text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-60"
                            >
                                {saveDraftMutation.isPending ? 'Saving...' : 'Save Draft'}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isPending}
                                className="w-full py-3 rounded-xl bg-[#E8A120] text-[#0A0F1E] text-sm font-semibold hover:bg-[#E8A120]/90 transition-colors disabled:opacity-60"
                            >
                                {submitMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
                            </button>
                        </div>
                        
                        <p className="text-white/25 text-xs mt-4 text-center">
                            Once submitted, the quote will be sent to the client and cannot be edited.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default EditQuotePage;
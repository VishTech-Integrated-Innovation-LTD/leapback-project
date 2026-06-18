// ============================================================
// Features:
//  - Bulk delete with progress tracking
//  - Role-gated UI (chief_admin/admin vs staff)
//  - Export CSV button (admin+ only)
//  - Toast notifications
//  - Sequential deletion with error handling
// ============================================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    MagnifyingGlassIcon, PlusIcon, XIcon,
    PencilSimpleIcon, ArrowCounterClockwiseIcon,
    TrashIcon, WarningIcon, PackageIcon,
    WrenchIcon, FileCsvIcon,
} from '@phosphor-icons/react';
import {
    getAllInventory, createInventoryItem, updateInventoryItem,
    restockInventoryItem, deleteInventoryItem,
} from '../../api/inventory.api';
import { formatCurrency, formatDate } from '../../utils/formatCurrency';
import { usePermissions } from '../../hooks/usePermissions';
import { useToast } from '../../stores/useToastStore';
import { downloadCSV } from '../../utils/exportUtils';
import type { InventoryItem, InventoryType, AvailabilityStatus } from '../../types';
import Pagination from '../ui/Pagination';


// --------------------------------------------------------------------------
// API ERROR HELPER
// --------------------------------------------------------------------------
interface ApiError { response?: { data?: { message?: string } } }
const getErrMsg = (e: unknown): string =>
    (e as ApiError)?.response?.data?.message ?? 'Something went wrong';

// --------------------------------------------------------------------------
// STOCK STATUS BADGE
// --------------------------------------------------------------------------
const StockBadge = ({ item }: { item: InventoryItem }) => {
    if (item.type === 'service') {
        const map: Record<AvailabilityStatus, string> = {
            available: 'bg-green-500/10 text-green-400',
            busy: 'bg-yellow-500/10 text-yellow-400',
            unavailable: 'bg-red-500/10 text-red-400',
        };
        return (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${map[item.availabilityStatus ?? 'available']}`}>
                {item.availabilityStatus ?? 'available'}
            </span>
        );
    }

  // Product
    const qty = item.stockQty ?? 0;
    if (qty === 0) return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-500/10 text-red-400">Out of Stock</span>;
    if (qty <= item.lowStockThreshold) return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400">Low Stock</span>;
    if (qty <= item.lowStockThreshold * 2) return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400">Medium</span>;
    return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/10 text-green-400">In Stock</span>;
};


// --------------------------------------------------------------------------
// ADD / EDIT ITEM MODAL
// --------------------------------------------------------------------------
interface ItemModalProps { item?: InventoryItem; onSuccess: () => void; onClose: () => void; }

const ItemModal = ({ item, onSuccess, onClose }: ItemModalProps) => {
    const isEditing = !!item;
    const [form, setForm] = useState({
        name: item?.name ?? '',
        type: (item?.type ?? 'product') as InventoryType,
        category: item?.category ?? '',
        unitPrice: item?.unitPrice ?? 0,
        itemCode: item?.itemCode ?? '',
        stockQty: item?.stockQty ?? 0,
        lowStockThreshold: item?.lowStockThreshold ?? 5,
        availabilityStatus: (item?.availabilityStatus ?? 'available') as AvailabilityStatus,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.unitPrice) { setError('Name and unit price are required'); return; }
        setLoading(true);
        try {
            if (isEditing) {
                await updateInventoryItem(item!.id, form);
            } else {
                await createInventoryItem({
                    ...form,
                    stockQty: form.type === 'product' ? Number(form.stockQty) : undefined,
                    availabilityStatus: form.type === 'service' ? form.availabilityStatus : undefined,
                });
            }
            onSuccess();
        } catch (err) {
            setError(getErrMsg(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
            <div className="bg-[#0D1526] border border-white/10 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-white font-semibold">{isEditing ? 'Edit Item' : 'Add New Item'}</h3>
                    <button onClick={onClose} className="text-white/30 hover:text-white transition-colors"><XIcon size={18} /></button>
                </div>
                {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-3">
                   
          {/* Name */}
                    <div>
                        <label className="block text-xs text-white/40 mb-1.5">Item Name *</label>
                        <input type="text" placeholder="e.g. Solar Panel 400W" value={form.name}
                            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#E8A120]/50" />
                    </div>

          {/* Type */}
                    <div>
                        <label className="block text-xs text-white/40 mb-1.5">Type *</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['product', 'service'] as InventoryType[]).map(t => (
                                <button key={t} type="button" onClick={() => setForm(p => ({ ...p, type: t }))}
                                    className={`py-2.5 rounded-lg text-sm font-medium border transition-colors capitalize
                                        ${form.type === t ? 'bg-[#E8A120] text-[#0A0F1E] border-[#E8A120]' : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

          {/* Category + Item Code */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-white/40 mb-1.5">Category</label>
                            <input type="text" placeholder="e.g. Solar" value={form.category}
                                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#E8A120]/50" />
                        </div>
                        <div>
                            <label className="block text-xs text-white/40 mb-1.5">Item Code</label>
                            <input type="text" placeholder="e.g. SP-400W" value={form.itemCode}
                                onChange={e => setForm(p => ({ ...p, itemCode: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#E8A120]/50" />
                        </div>
                    </div>

          {/* Unit Price */}
                    <div>
                        <label className="block text-xs text-white/40 mb-1.5">Unit Price (NGN) *</label>
                        <input type="number" min={0} value={form.unitPrice}
                            onChange={e => setForm(p => ({ ...p, unitPrice: Number(e.target.value) }))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#E8A120]/50" />
                    </div>

          {/* Product-specific fields */}
                    {form.type === 'product' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-white/40 mb-1.5">{isEditing ? 'Stock Qty' : 'Initial Stock'}</label>
                                <input type="number" min={0} value={form.stockQty}
                                    onChange={e => setForm(p => ({ ...p, stockQty: Number(e.target.value) }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#E8A120]/50" />
                            </div>
                            <div>
                                <label className="block text-xs text-white/40 mb-1.5">Low Stock Alert</label>
                                <input type="number" min={1} value={form.lowStockThreshold}
                                    onChange={e => setForm(p => ({ ...p, lowStockThreshold: Number(e.target.value) }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#E8A120]/50" />
                            </div>
                        </div>
                    )}

          {/* Service-specific fields */}
                    {form.type === 'service' && (
                        <div>
                            <label className="block text-xs text-white/40 mb-1.5">Availability</label>
                            <select value={form.availabilityStatus}
                                onChange={e => setForm(p => ({ ...p, availabilityStatus: e.target.value as AvailabilityStatus }))}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#E8A120]/50 appearance-none">
                                <option value="available" className="bg-[#0D1526]">Available</option>
                                <option value="busy" className="bg-[#0D1526]">Busy</option>
                                <option value="unavailable" className="bg-[#0D1526]">Unavailable</option>
                            </select>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 py-2.5 rounded-lg bg-[#E8A120] text-[#0A0F1E] text-sm font-semibold hover:bg-[#E8A120]/90 disabled:opacity-60">
                            {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --------------------------------------------------------------------------
// RESTOCK MODAL
// --------------------------------------------------------------------------
interface RestockModalProps { item: InventoryItem; onSuccess: () => void; onClose: () => void; }

const RestockModal = ({ item, onSuccess, onClose }: RestockModalProps) => {
    const [qty, setQty] = useState(1);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRestock = async () => {
        if (qty <= 0) { setError('Quantity must be greater than 0'); return; }
        setLoading(true);
        try {
            await restockInventoryItem(item.id, qty);
            onSuccess();
        } catch (err) {
            setError(getErrMsg(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
            <div className="bg-[#0D1526] border border-white/10 rounded-2xl w-full max-w-sm p-6">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-white font-semibold">Restock — {item.name}</h3>
                    <button onClick={onClose} className="text-white/30 hover:text-white transition-colors"><XIcon size={18} /></button>
                </div>

                <div className="bg-white/5 rounded-lg px-4 py-3 mb-4 flex justify-between text-sm">
                    <span className="text-white/40">Current Stock</span>
                    <span className="text-white font-medium">{item.stockQty} units</span>
                </div>

                {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

                <label className="block text-xs text-white/40 mb-1.5">Add Quantity</label>
                <input type="number" min={1} value={qty}
                    onChange={e => setQty(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#E8A120]/50 mb-4" />

                <div className="bg-white/3 rounded-lg px-4 py-2.5 mb-5 flex justify-between text-sm">
                    <span className="text-white/40">New Stock Total</span>
                    <span className="text-[#E8A120] font-semibold">{(item.stockQty ?? 0) + qty} units</span>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleRestock} disabled={loading}
                        className="flex-1 py-2.5 rounded-lg bg-[#E8A120] text-[#0A0F1E] text-sm font-semibold disabled:opacity-60">
                        {loading ? 'Restocking...' : 'Confirm Restock'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// ── Delete confirm modal (single) ────────────────────────────
interface DeleteModalProps { item: InventoryItem; onConfirm: () => void; onClose: () => void; isLoading: boolean; }

const DeleteModal = ({ item, onConfirm, onClose, isLoading }: DeleteModalProps) => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
        <div className="bg-[#0D1526] border border-white/10 rounded-2xl w-full max-w-sm p-6">
            <div className="w-11 h-11 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <WarningIcon size={22} weight="fill" className="text-red-400" />
            </div>
            <h3 className="text-white font-semibold text-center mb-1">Delete {item.name}?</h3>
            <p className="text-white/40 text-sm text-center mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
                <button onClick={onClose} disabled={isLoading}
                    className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5 disabled:opacity-50">
                    Cancel
                </button>
                <button onClick={onConfirm} disabled={isLoading}
                    className="flex-1 py-2.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-medium hover:bg-red-500/30 disabled:opacity-60">
                    {isLoading ? 'Deleting...' : 'Delete'}
                </button>
            </div>
        </div>
    </div>
);


// ── Bulk Delete Progress Modal ───────────────────────────────
interface BulkDeleteProgressProps {
    total: number;
    completed: number;
    failed: Array<{ id: string; name: string; error: string }>;
    onClose: () => void;
}

const BulkDeleteProgressModal = ({ total, completed, failed, onClose }: BulkDeleteProgressProps) => {
    const isComplete = completed === total;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
            <div className="bg-[#0D1526] border border-white/10 rounded-2xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-white font-semibold">Deleting Items...</h3>
                    {isComplete && (
                        <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
                            <XIcon size={18} />
                        </button>
                    )}
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-xs text-white/40 mb-2">
                        <span>Progress</span>
                        <span>{completed} / {total}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#E8A120] transition-all duration-300"
                            style={{ width: `${(completed / total) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Success message */}
                {isComplete && failed.length === 0 && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-4">
                        <p className="text-green-400 text-sm text-center">
                            ✓ Successfully deleted all {total} items
                        </p>
                    </div>
                )}

                {/* Failed items */}
                {failed.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 max-h-48 overflow-y-auto">
                        <p className="text-red-400 text-xs font-medium mb-2">
                            Failed to delete {failed.length} item{failed.length !== 1 ? 's' : ''}:
                        </p>
                        <div className="space-y-1.5">
                            {failed.map((fail) => (
                                <div key={fail.id} className="text-xs">
                                    <span className="text-white/60">• {fail.name}</span>
                                    <span className="text-red-400/70 text-xs ml-2">({fail.error})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!isComplete && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <div className="w-4 h-4 border-2 border-[#E8A120] border-t-transparent rounded-full animate-spin" />
                        <span className="text-white/40 text-xs">Deleting items, please wait...</span>
                    </div>
                )}

                {isComplete && (
                    <button
                        onClick={onClose}
                        className="w-full mt-4 py-2.5 rounded-lg bg-[#E8A120] text-[#0A0F1E] text-sm font-semibold hover:bg-[#E8A120]/90 transition-colors"
                    >
                        Close
                    </button>
                )}
            </div>
        </div>
    );
};



// --------------------------------------------------------------------------
// INVENTORY PAGE
// --------------------------------------------------------------------------
const InventoryPage = () => {
    const queryClient = useQueryClient();
    const perms = usePermissions();
    const toast = useToast();

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'' | InventoryType>('');
    const [addModal, setAddModal] = useState(false);
    const [editItem, setEditItem] = useState<InventoryItem | null>(null);
    const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
    const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);

    // Bulk delete states
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [showBulkConfirm, setShowBulkConfirm] = useState(false);
    const [bulkDeleteProgress, setBulkDeleteProgress] = useState<{
        isActive: boolean;
        total: number;
        completed: number;
        failed: Array<{ id: string; name: string; error: string }>;
    }>({
        isActive: false,
        total: 0,
        completed: 0,
        failed: [],
    });


    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);


    const { data, isLoading, isError } = useQuery({
        queryKey: ['inventory', typeFilter],
        queryFn: () => getAllInventory(typeFilter ? { type: typeFilter } : undefined),
        refetchInterval: 30_000,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteInventoryItem(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            setDeleteItem(null);
            toast.success('Item deleted successfully');
        },
        onError: (err) => toast.error(getErrMsg(err)),
    });

    const handleModalSuccess = (message: string) => {
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        setAddModal(false);
        setEditItem(null);
        setRestockItem(null);
        toast.success(message);
    };

    const handleExportCSV = () => {
        if (!items.length) return;
        const rows = items.map(i => ({
            Name: i.name,
            Type: i.type,
            Category: i.category ?? '',
            'Item Code': i.itemCode ?? '',
            'Unit Price (₦)': Number(i.unitPrice),
            'Stock Qty': i.type === 'product' ? (i.stockQty ?? 0) : '—',
            'Low Stock Alert': i.type === 'product' ? (i.lowStockThreshold ?? 5) : '—',
            Availability: i.type === 'service' ? (i.availabilityStatus ?? '—') : '—',
            'Created At':  formatDate(i.createdAt),
            // 'Created At': new Date(i.createdAt).toLocaleDateString('en-NG'),
        }));
        downloadCSV('inventory-export', rows);
        toast.success('Inventory exported to CSV');
    };

    // Bulk delete handler - sequential deletion with progress tracking
    const handleBulkDelete = async () => {
        const itemsToDelete = Array.from(selectedItems);
        const itemMap = new Map(items.map(item => [item.id, item.name]));

        setBulkDeleteProgress({
            isActive: true,
            total: itemsToDelete.length,
            completed: 0,
            failed: [],
        });
        setShowBulkConfirm(false);

        const failedDeletions: Array<{ id: string; name: string; error: string }> = [];

        for (const id of itemsToDelete) {
            try {
                await deleteInventoryItem(id);
                setBulkDeleteProgress(prev => ({
                    ...prev,
                    completed: prev.completed + 1,
                }));
            } catch (err) {
                const errorMsg = getErrMsg(err);
                failedDeletions.push({
                    id,
                    name: itemMap.get(id) || 'Unknown item',
                    error: errorMsg,
                });
                setBulkDeleteProgress(prev => ({
                    ...prev,
                    completed: prev.completed + 1,
                    failed: [...prev.failed, {
                        id,
                        name: itemMap.get(id) || 'Unknown item',
                        error: errorMsg,
                    }],
                }));
            }
        }

        await queryClient.invalidateQueries({ queryKey: ['inventory'] });
        setSelectedItems(new Set());

        if (failedDeletions.length === 0) {
            toast.success(`Successfully deleted ${itemsToDelete.length} items`);
            setTimeout(() => {
                setBulkDeleteProgress(prev => ({ ...prev, isActive: false }));
            }, 1500);
        } else {
            toast.error(`Deleted ${itemsToDelete.length - failedDeletions.length} of ${itemsToDelete.length} items. Check details.`);
        }
    };

    const filtered = (data?.items ?? []).filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        (i.category ?? '').toLowerCase().includes(search.toLowerCase())
    );

    const items: InventoryItem[] = filtered;

    // Client-side pagination
const totalPages = Math.ceil(filtered.length / itemsPerPage);
const paginatedItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
);


    // Selection handlers (only available for admin+)
    const toggleSelectAll = () => {
        if (!perms.canDeleteInventory) return;
        if (selectedItems.size === items.length && items.length > 0) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(items.map(item => item.id)));
        }
    };

    const toggleSelectItem = (id: string) => {
        if (!perms.canDeleteInventory) return;
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedItems(newSelected);
    };

    const clearSelected = () => {
        setSelectedItems(new Set());
    };

    return (
        <div className="space-y-5">

            {/* Header */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <p className="text-white/40 text-sm">{data?.count ?? 0} items</p>
                    {selectedItems.size > 0 && perms.canDeleteInventory && (
                        <span className="text-xs bg-[#E8A120]/10 text-[#E8A120] px-2 py-1 rounded-full">
                            {selectedItems.size} selected
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Export — admin+ only */}
                    {perms.canExportInventory && (
                        <button
                            onClick={handleExportCSV}
                            disabled={!items.length}
                            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                        >
                            <FileCsvIcon size={14} />
                            Export CSV
                        </button>
                    )}

                    {/* Add item — admin+ only */}
                    {perms.canAddInventory && (
                        <button
                            onClick={() => setAddModal(true)}
                            className="flex items-center gap-1.5 text-xs bg-[#E8A120] text-[#0A0F1E] font-semibold px-3 py-1.5 rounded-lg hover:bg-[#E8A120]/90 transition-colors"
                        >
                            <PlusIcon size={14} weight="bold" />
                            Add Item
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                {/* Search */}
                <div className="relative flex-1 min-w-48">
                    <MagnifyingGlassIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                        type="text"
                        placeholder="Search by name or category..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#E8A120]/50"
                    />
                </div>

                {/* Type filter */}
                <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                    {([['', 'All'], ['product', 'Products'], ['service', 'Services']] as [string, string][]).map(([v, l]) => (
                        <button key={v}
                            onClick={() => setTypeFilter(v as '' | InventoryType)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                                ${typeFilter === v ? 'bg-[#E8A120] text-[#0A0F1E]' : 'text-white/50 hover:text-white'}`}>
                            {v === 'product' && <PackageIcon size={13} />}
                            {v === 'service' && <WrenchIcon size={13} />}
                            {l}
                        </button>
                    ))}
                </div>
            </div>

            {/* Staff notice — shown only to staff role */}
            {/* {!perms.canAddInventory && (
                <div className="flex items-center gap-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs rounded-lg px-4 py-2.5">
                    <WarningIcon size={14} weight="fill" className="shrink-0" />
                    You can restock products but cannot add, edit, or delete items. Contact an admin for catalogue changes.
                </div>
            )} */}

            {/* Table */}
            <div className="bg-[#0D1526] border border-white/10 rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-7 h-7 border-2 border-[#E8A120] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : isError ? (
                    <div className="flex items-center justify-center h-48 text-white/30 text-sm">
                        Failed to load inventory. Please refresh.
                    </div>
                ) : paginatedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-white/30 text-sm gap-2">
                        <p>No items found.</p>
                        {perms.canAddInventory && (
                            <button onClick={() => setAddModal(true)} className="text-[#E8A120] text-xs hover:underline">
                                Add your first item
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[700px]">
                            <thead>
                                <tr className="border-b border-white/5">
                                    {/* Checkbox column - only for admin+ */}
                                    {perms.canDeleteInventory && (
                                        <th className="w-10 px-3 py-3.5">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.size === items.length && items.length > 0}
                                                onChange={toggleSelectAll}
                                                className="rounded border-white/20 bg-white/5 text-[#E8A120] focus:ring-[#E8A120]/20 cursor-pointer"
                                            />
                                        </th>
                                    )}
                                    <th className="text-left text-xs font-medium text-white/30 px-5 py-3.5">Item</th>
                                    <th className="text-left text-xs font-medium text-white/30 px-5 py-3.5">Category</th>
                                    <th className="text-left text-xs font-medium text-white/30 px-5 py-3.5">Unit Price</th>
                                    <th className="text-left text-xs font-medium text-white/30 px-5 py-3.5">Stock / Status</th>
                                    <th className="text-right text-xs font-medium text-white/30 px-5 py-3.5">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedItems.map(item => (
                                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        {/* Checkbox cell - only for admin+ */}
                                        {perms.canDeleteInventory && (
                                            <td className="px-3 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.has(item.id)}
                                                    onChange={() => toggleSelectItem(item.id)}
                                                    className="rounded border-white/20 bg-white/5 text-[#E8A120] focus:ring-[#E8A120]/20 cursor-pointer"
                                                />
                                            </td>
                                        )}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                                                    ${item.type === 'product' ? 'bg-blue-500/10' : 'bg-purple-500/10'}`}>
                                                    {item.type === 'product'
                                                        ? <PackageIcon size={14} className="text-blue-400" />
                                                        : <WrenchIcon size={14} className="text-purple-400" />}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium text-sm">{item.name}</p>
                                                    {item.itemCode && <p className="text-white/30 text-xs">{item.itemCode}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-white/50 text-sm capitalize">{item.category ?? '—'}</td>
                                        <td className="px-5 py-4 text-white font-medium">{formatCurrency(item.unitPrice)}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <StockBadge item={item} />
                                                {item.type === 'product' && (
                                                    <span className="text-white/30 text-xs">{item.stockQty} units</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-1.5">

                                                {/* Restock — all roles (products only) */}
                                                {item.type === 'product' && (
                                                    <button
                                                        onClick={() => setRestockItem(item)}
                                                        className="flex items-center gap-1 text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/20 px-2.5 py-1.5 rounded-lg transition-colors"
                                                        title="Restock"
                                                    >
                                                        <ArrowCounterClockwiseIcon size={13} />
                                                        Restock
                                                    </button>
                                                )}

                                                {/* Edit — admin+ only */}
                                                {perms.canEditInventory && (
                                                    <button
                                                        onClick={() => setEditItem(item)}
                                                        className="flex items-center gap-1 text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/20 px-2.5 py-1.5 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <PencilSimpleIcon size={13} />
                                                        Edit
                                                    </button>
                                                )}

                                                {/* Delete — admin+ only */}
                                                {perms.canDeleteInventory && (
                                                    <button
                                                        onClick={() => setDeleteItem(item)}
                                                        className="flex items-center gap-1 text-xs text-red-400/60 hover:text-red-400 border border-red-400/10 hover:border-red-400/30 px-2.5 py-1.5 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <TrashIcon size={13} />
                                                        Delete
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

            {/* Bulk Action Bar - only shown for admin+ with selections */}
            {selectedItems.size > 0 && !bulkDeleteProgress.isActive && perms.canDeleteInventory && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
                    <div className="bg-[#0D1526] border border-white/10 rounded-xl shadow-lg px-4 py-3 flex items-center gap-4">
                        <span className="text-white text-sm">
                            {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                        </span>
                        <button
                            onClick={() => setShowBulkConfirm(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm"
                        >
                            <TrashIcon size={14} />
                            Delete Selected
                        </button>
                        <button
                            onClick={clearSelected}
                            className="text-white/40 hover:text-white/60 text-sm"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {/* Bulk Delete Confirmation Modal */}
            {showBulkConfirm && perms.canDeleteInventory && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
                    <div className="bg-[#0D1526] border border-white/10 rounded-2xl w-full max-w-md p-6">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                            <WarningIcon size={24} weight="fill" className="text-red-400" />
                        </div>
                        <h3 className="text-white font-semibold text-center mb-1">Delete Multiple Items?</h3>
                        <p className="text-white/40 text-sm text-center mb-5">
                            Are you sure you want to delete {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''}?
                            This action cannot be undone.
                        </p>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-5">
                            <p className="text-yellow-400 text-xs text-center">
                                ⚠️ This will permanently remove these items from your inventory.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowBulkConfirm(false)}
                                className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
                            >
                                Delete {selectedItems.size} Items
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Delete Progress Modal */}
            {bulkDeleteProgress.isActive && (
                <BulkDeleteProgressModal
                    total={bulkDeleteProgress.total}
                    completed={bulkDeleteProgress.completed}
                    failed={bulkDeleteProgress.failed}
                    onClose={() => setBulkDeleteProgress(prev => ({ ...prev, isActive: false }))}
                />
            )}

            {/* Modals */}
            {addModal && <ItemModal onSuccess={() => handleModalSuccess('Item added successfully')} onClose={() => setAddModal(false)} />}
            {editItem && <ItemModal item={editItem} onSuccess={() => handleModalSuccess('Item updated successfully')} onClose={() => setEditItem(null)} />}
            {restockItem && <RestockModal item={restockItem} onSuccess={() => handleModalSuccess(`${restockItem.name} restocked`)} onClose={() => setRestockItem(null)} />}
            {deleteItem && (
                <DeleteModal
                    item={deleteItem}
                    isLoading={deleteMutation.isPending}
                    onConfirm={() => deleteMutation.mutate(deleteItem.id)}
                    onClose={() => setDeleteItem(null)}
                />
            )}

 {/* Pagination */}
        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(limit) => {
                setItemsPerPage(limit);
                setCurrentPage(1);
            }}
            totalItems={filtered.length}
        />

        </div>
    );
};

export default InventoryPage;
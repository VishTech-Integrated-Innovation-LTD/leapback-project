import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  XIcon,
  PencilSimpleIcon,
  ArrowCounterClockwiseIcon,
  WarningIcon,
  PackageIcon,
  WrenchIcon,
} from '@phosphor-icons/react';
import {
  getAllInventory,
  createInventoryItem,
  updateInventoryItem,
  restockInventoryItem,
  deleteInventoryItem,
} from '../../api/inventory.api';
import { formatCurrency } from '../../utils/formatCurrency';
import type { InventoryItem, InventoryType, AvailabilityStatus } from '../../types';

// --------------------------------------------------------------------------
// STOCK STATUS BADGE
// --------------------------------------------------------------------------
const StockBadge = ({ item }: { item: InventoryItem }) => {
  if (item.type === 'service') {
    const map: Record<AvailabilityStatus, string> = {
      available:   'bg-green-500/10 text-green-400',
      busy:        'bg-yellow-500/10 text-yellow-400',
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
  if (qty === 0)                        return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-500/10 text-red-400">Out of Stock</span>;
  if (qty <= item.lowStockThreshold)    return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400">Low Stock</span>;
  if (qty <= item.lowStockThreshold * 2) return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400">Medium</span>;
  return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/10 text-green-400">In Stock</span>;
};

// --------------------------------------------------------------------------
// ADD / EDIT ITEM MODAL
// --------------------------------------------------------------------------
interface ItemModalProps {
  item?:     InventoryItem;
  onSuccess: () => void;
  onClose:   () => void;
}

const ItemModal = ({ item, onSuccess, onClose }: ItemModalProps) => {
  const isEditing = !!item;
  const [form, setForm] = useState({
    name:               item?.name               ?? '',
    type:               item?.type               ?? 'product' as InventoryType,
    category:           item?.category           ?? '',
    unitPrice:          item?.unitPrice           ?? 0,
    itemCode:           item?.itemCode           ?? '',
    stockQty:           item?.stockQty           ?? 0,
    lowStockThreshold:  item?.lowStockThreshold  ?? 5,
    availabilityStatus: item?.availabilityStatus ?? 'available' as AvailabilityStatus,
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.type || !form.unitPrice) {
      setError('Name, type, and unit price are required');
      return;
    }
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
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
      <div className="bg-[#0D1526] border border-white/10 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">
            {isEditing ? 'Edit Item' : 'Add New Item'}
          </h3>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <XIcon size={18} />
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Name */}
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Item Name *</label>
            <input
              type="text"
              placeholder="e.g. Solar Panel 400W"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#E8A120]/50 transition-colors"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {(['product', 'service'] as InventoryType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, type: t }))}
                  className={`py-2.5 rounded-lg text-sm font-medium border transition-colors capitalize
                    ${form.type === t
                      ? 'bg-[#E8A120] text-[#0A0F1E] border-[#E8A120]'
                      : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20'
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Category + Item Code */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Category</label>
              <input
                type="text"
                placeholder="e.g. Solar, IT"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#E8A120]/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Item Code</label>
              <input
                type="text"
                placeholder="e.g. SP-400W"
                value={form.itemCode}
                onChange={(e) => setForm((p) => ({ ...p, itemCode: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#E8A120]/50 transition-colors"
              />
            </div>
          </div>

          {/* Unit Price */}
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Unit Price (NGN) *</label>
            <input
              type="number"
              min={0}
              value={form.unitPrice}
              onChange={(e) => setForm((p) => ({ ...p, unitPrice: Number(e.target.value) }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#E8A120]/50 transition-colors"
            />
          </div>

          {/* Product-specific fields */}
          {form.type === 'product' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/40 mb-1.5">
                  {isEditing ? 'Stock Qty' : 'Initial Stock'}
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.stockQty}
                  onChange={(e) => setForm((p) => ({ ...p, stockQty: Number(e.target.value) }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#E8A120]/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Low Stock Alert</label>
                <input
                  type="number"
                  min={1}
                  value={form.lowStockThreshold}
                  onChange={(e) => setForm((p) => ({ ...p, lowStockThreshold: Number(e.target.value) }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#E8A120]/50 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Service-specific fields */}
          {form.type === 'service' && (
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Availability</label>
              <select
                value={form.availabilityStatus}
                onChange={(e) => setForm((p) => ({ ...p, availabilityStatus: e.target.value as AvailabilityStatus }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#E8A120]/50 transition-colors appearance-none"
              >
                <option value="available"   className="bg-[#0D1526]">Available</option>
                <option value="busy"        className="bg-[#0D1526]">Busy</option>
                <option value="unavailable" className="bg-[#0D1526]">Unavailable</option>
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-[#E8A120] text-[#0A0F1E] text-sm font-semibold hover:bg-[#E8A120]/90 transition-colors disabled:opacity-60"
            >
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
interface RestockModalProps {
  item:      InventoryItem;
  onSuccess: () => void;
  onClose:   () => void;
}

const RestockModal = ({ item, onSuccess, onClose }: RestockModalProps) => {
  const [qty,     setQty]     = useState(1);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleRestock = async () => {
    if (qty <= 0) { setError('Quantity must be greater than 0'); return; }
    setLoading(true);
    try {
      await restockInventoryItem(item.id, qty);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to restock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
      <div className="bg-[#0D1526] border border-white/10 rounded-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">Restock — {item.name}</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <XIcon size={18} />
          </button>
        </div>

        <div className="bg-white/5 rounded-lg px-4 py-3 mb-4 flex justify-between text-sm">
          <span className="text-white/40">Current Stock</span>
          <span className="text-white font-medium">{item.stockQty} units</span>
        </div>

        {error && (
          <p className="text-red-400 text-xs mb-3">{error}</p>
        )}

        <div className="mb-5">
          <label className="block text-xs text-white/40 mb-1.5">Quantity to Add</label>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#E8A120]/50 transition-colors"
          />
          <p className="text-white/30 text-xs mt-1.5">
            New total: {(item.stockQty ?? 0) + qty} units
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRestock}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-[#E8A120] text-[#0A0F1E] text-sm font-semibold hover:bg-[#E8A120]/90 transition-colors disabled:opacity-60"
          >
            {loading ? 'Restocking...' : 'Confirm Restock'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------
// INVENTORY PAGE
// --------------------------------------------------------------------------
const CATEGORIES = ['All', 'Solar', 'IT', 'Services', 'Energy'];

const InventoryPage = () => {
  const queryClient = useQueryClient();

  const [search,       setSearch]       = useState('');
  const [searchInput,  setSearchInput]  = useState('');
  const [category,     setCategory]     = useState('');
  const [typeFilter,   setTypeFilter]   = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem,     setEditItem]     = useState<InventoryItem | null>(null);
  const [restockItem,  setRestockItem]  = useState<InventoryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['inventory', search, category, typeFilter],
    queryFn:  () => getAllInventory({
      search:   search   || undefined,
      category: category || undefined,
      type:     typeFilter || undefined,
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInventoryItem(id),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setDeleteTarget(null);
    },
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    setShowAddModal(false);
    setEditItem(null);
    setRestockItem(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const items = data?.items ?? [];
  const lowStockCount = items.filter(
    (i) => i.type === 'product' && i.stockQty !== null && i.stockQty <= i.lowStockThreshold
  ).length;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-white/40 text-sm">
            {data?.count ?? 0} item{(data?.count ?? 0) !== 1 ? 's' : ''}
          </p>
          {lowStockCount > 0 && (
            <span className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <WarningIcon size={11} weight="fill" />
              {lowStockCount} low stock
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#E8A120] text-[#0A0F1E] text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#E8A120]/90 transition-colors"
        >
          <PlusIcon size={16} weight="bold" />
          Add Item
        </button>
      </div>

      {/*  Filters  */}
      <div className="flex items-center gap-3 flex-wrap">

        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <MagnifyingGlassIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#E8A120]/50 w-48 transition-colors"
            />
          </div>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); }} className="text-white/30 hover:text-white text-xs transition-colors">
              Clear
            </button>
          )}
        </form>

        {/* Category filter */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat === 'All' ? '' : cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${(cat === 'All' ? '' : cat) === category
                  ? 'bg-[#E8A120] text-[#0A0F1E]'
                  : 'text-white/50 hover:text-white'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          {[{ label: 'All', value: '' }, { label: 'Products', value: 'product' }, { label: 'Services', value: 'service' }].map((t) => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${typeFilter === t.value
                  ? 'bg-[#E8A120] text-[#0A0F1E]'
                  : 'text-white/50 hover:text-white'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

      </div>

      {/* Table  */}
      <div className="bg-[#0D1526] border border-white/10 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-2 border-[#E8A120] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="text-center text-white/30 text-sm py-12">Failed to load inventory.</div>
        ) : items.length === 0 ? (
          <div className="text-center text-white/30 text-sm py-12 space-y-2">
            <p>No items found.</p>
            <button onClick={() => setShowAddModal(true)} className="text-[#E8A120] text-xs hover:underline">
              Add your first item →
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-medium text-white/30 px-5 py-3.5">Name</th>
                <th className="text-left text-xs font-medium text-white/30 px-5 py-3.5">Category</th>
                <th className="text-left text-xs font-medium text-white/30 px-5 py-3.5">Unit Price</th>
                <th className="text-left text-xs font-medium text-white/30 px-5 py-3.5">Stock / Availability</th>
                <th className="text-left text-xs font-medium text-white/30 px-5 py-3.5">Status</th>
                <th className="text-right text-xs font-medium text-white/30 px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                        ${item.type === 'product' ? 'bg-blue-500/10' : 'bg-purple-500/10'}`}>
                        {item.type === 'product'
                          ? <PackageIcon size={14} className="text-blue-400" />
                          : <WrenchIcon  size={14} className="text-purple-400" />
                        }
                      </div>
                      <div>
                        <p className="text-white font-medium">{item.name}</p>
                        {item.itemCode && (
                          <p className="text-white/30 text-xs">{item.itemCode}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-white/50 capitalize">
                    {item.category ?? '—'}
                  </td>
                  <td className="px-5 py-4 text-white font-medium">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-5 py-4 text-white/50">
                    {item.type === 'product'
                      ? `${item.stockQty ?? 0} units`
                      : <span className="capitalize">{item.availabilityStatus ?? '—'}</span>
                    }
                  </td>
                  <td className="px-5 py-4">
                    <StockBadge item={item} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditItem(item)}
                        className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/20 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        <PencilSimpleIcon size={13} />
                        Edit
                      </button>
                      {item.type === 'product' && (
                        <button
                          onClick={() => setRestockItem(item)}
                          className="flex items-center gap-1.5 text-xs text-[#E8A120] border border-[#E8A120]/20 hover:border-[#E8A120]/50 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <ArrowCounterClockwiseIcon size={13} />
                          Restock
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ------- Modals -------------------------------------- */}
      {(showAddModal || editItem) && (
        <ItemModal
          item={editItem ?? undefined}
          onSuccess={handleSuccess}
          onClose={() => { setShowAddModal(false); setEditItem(null); }}
        />
      )}

      {restockItem && (
        <RestockModal
          item={restockItem}
          onSuccess={handleSuccess}
          onClose={() => setRestockItem(null)}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-[#0D1526] border border-white/10 rounded-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <WarningIcon size={24} weight="fill" className="text-red-400" />
            </div>
            <h3 className="text-white font-semibold text-center mb-1">Deactivate Item?</h3>
            <p className="text-white/40 text-sm text-center mb-5">
              "{deleteTarget.name}" will be hidden from the catalogue.
              Existing quotes are not affected.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {deleteMutation.isPending ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InventoryPage;
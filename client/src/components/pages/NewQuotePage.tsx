import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  WarningIcon,
  UserPlusIcon,
  XIcon,
} from '@phosphor-icons/react';
import { getAllClients, createClient } from '../../api/clients.api';
import { getAllInventory } from '../../api/inventory.api';
import { createQuote } from '../../api/quotes.api';
import { formatCurrency } from '../../utils/formatCurrency';
import type { InventoryItem, Client } from '../../types';


// --------------------------------------------------------------------------
// TYPES
// --------------------------------------------------------------------------
interface LineItem {
  id: string;        // local key for React rendering only
  inventoryId: string | null;
  itemName: string;
  itemType: 'product' | 'service' | '';
  quantity: number;
  unitPrice: number;
}

// --------------------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------------------
const emptyItem = (): LineItem => ({
  id: crypto.randomUUID(),
  inventoryId: null,
  itemName: '',
  itemType: '',
  quantity: 1,
  unitPrice: 0,
});

// --------------------------------------------------------------------------
// ADD CLIENT MODAL
// Inline quick-add so staff don't have to leave the quote form
// --------------------------------------------------------------------------
interface AddClientModalProps {
  onSuccess: (client: Client) => void;
  onClose: () => void;
}


const AddClientModal = ({ onSuccess, onClose }: AddClientModalProps) => {
  const [form, setForm] = useState({ clientName: '', email: '', phone: '', contactPerson: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName || !form.email) {
      setError('Client name and email are required');
      return;
    }
    setLoading(true);
    try {
      const res = await createClient(form);
      onSuccess(res.client);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
      <div className="bg-[#0D1526] border border-white/10 rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">Add New Client</h3>
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
          {[
            { label: 'Client Name *', key: 'clientName', placeholder: 'e.g. Nexus Energy Ltd' },
            { label: 'Email *', key: 'email', placeholder: 'e.g. info@nexus.ng' },
            { label: 'Phone', key: 'phone', placeholder: '+234 801 234 5678' },
            { label: 'Contact Person', key: 'contactPerson', placeholder: 'e.g. Emeka Obi' },
            { label: 'Address', key: 'address', placeholder: 'e.g. Abuja way, Nigeria' }
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-xs text-white/40 mb-1">{label}</label>
              <input
                type="text"
                placeholder={placeholder}
                value={(form as any)[key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#E8A120]/50 transition-colors"
              />
            </div>
          ))}

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
              {loading ? 'Adding...' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --------------------------------------------------------------------------
// NEW QUOTE PAGE
// --------------------------------------------------------------------------
const NewQuotePage = () => {
  const navigate = useNavigate();

  // ----- State -----------------------------------------------------------------
  const [selectedClientId, setSelectedClientId] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyItem()]);
  const [notes, setNotes] = useState('');
  const [useVat, setUseVat] = useState(false);
  const [vatRate, setVatRate] = useState(7.5);
  const [showAddClient, setShowAddClient] = useState(false);
  const [extraClients, setExtraClients] = useState<Client[]>([]);  // newly added clients
  const [formError, setFormError] = useState('');


  // ----- Data fetching -----------------------------------------------------------------
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => getAllClients(),
  });

  const { data: inventoryData } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => getAllInventory(),
  });

  const allClients = [...(clientsData?.clients ?? []), ...extraClients];
  const inventoryItems: InventoryItem[] = inventoryData?.items ?? [];


  // ----- Totals (computed live) -----------------------------------------------------------------
  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const vatAmount = useVat ? parseFloat((subtotal * vatRate / 100).toFixed(2)) : 0;
  const grandTotal = subtotal + vatAmount;


  // ----- Line item handlers -----------------------------------------------------------------
  const addItem = () => setLineItems((prev) => [...prev, emptyItem()]);

  const removeItem = (id: string) =>
    setLineItems((prev) => prev.filter((item) => item.id !== id));

  const updateItem = (id: string, changes: Partial<LineItem>) =>
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...changes } : item))
    );

  // When staff selects an inventory item from the dropdown,
  // auto-fill name, type, and price from the catalogue
  const handleInventorySelect = (lineId: string, inventoryId: string) => {
    if (!inventoryId) {
      // Cleared — reset to manual entry
      updateItem(lineId, { inventoryId: null, itemName: '', itemType: '', unitPrice: 0 });
      return;
    }
    const inv = inventoryItems.find((i) => i.id === inventoryId);
    if (inv) {
      updateItem(lineId, {
        inventoryId: inv.id,
        itemName: inv.name,
        itemType: inv.type,
        unitPrice: Number(inv.unitPrice),
      });
    }
  };

  // Submit
  const mutation = useMutation({
    mutationFn: (submit: boolean) =>
      createQuote({
        clientId: selectedClientId,
        items: lineItems.map(({ inventoryId, itemName, itemType, quantity, unitPrice }) => ({
          inventoryId: inventoryId ?? undefined,
          itemName,
          itemType: itemType as 'product' | 'service',
          quantity,
          unitPrice,
        })),
        notes: notes || undefined,
        vatRate: useVat ? vatRate : undefined,
        submit,
      }),
    onSuccess: (data) => {
      navigate(`/quotes/${data.quote.id}`);
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message ?? 'Failed to save quote. Please try again.');
    },
  });

  const validate = (): boolean => {
    if (!selectedClientId) { setFormError('Please select a client'); return false; }
    for (const item of lineItems) {
      if (!item.itemName) { setFormError('All line items must have a name'); return false; }
      if (!item.itemType) { setFormError('All line items must have a type'); return false; }
      if (item.quantity <= 0) { setFormError('Quantity must be greater than 0'); return false; }
      if (item.unitPrice < 0) { setFormError('Unit price cannot be negative'); return false; }
    }
    setFormError('');
    return true;
  };

  const handleSaveDraft = () => { if (validate()) mutation.mutate(false); };
  const handleSubmit = () => { if (validate()) mutation.mutate(true); };


  return (
    <div className="max-w-5xl space-y-6">

      {/* Back */}
      <button
        onClick={() => navigate('/quotes')}
        className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors"
      >
        <ArrowLeftIcon size={15} />
        Back to Quotes
      </button>

      {/* Form error */}
      {formError && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">
          <WarningIcon size={16} weight="fill" className="shrink-0 mt-0.5" />
          {formError}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ---------- Left column - form  --------------------------------------- */}
        <div className="xl:col-span-2 space-y-5">

          {/* A — Client Information */}
          <div className="bg-[#0D1526] border border-white/10 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">
              A · Client Information
            </h3>

            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs text-white/40 mb-1.5">Select Client</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    if (e.target.value === '__add__') {
                      setShowAddClient(true);
                    } else {
                      setSelectedClientId(e.target.value);
                    }
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#E8A120]/50 transition-colors appearance-none"
                >
                  <option value="" className="bg-[#0D1526]">--- Select a client ---</option>
                  {allClients.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#0D1526]">
                      {c.clientName}
                    </option>
                  ))}
                  <option value="__add__" className="bg-[#0D1526] text-[#E8A120]">
                    + Add New Client
                  </option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setShowAddClient(true)}
                className="flex items-center gap-1.5 text-xs text-[#E8A120] border border-[#E8A120]/20 hover:border-[#E8A120]/50 px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap"
              >
                <UserPlusIcon size={14} />
                New Client
              </button>
            </div>

            {/* Show selected client details */}
            {selectedClientId && (() => {
              const c = allClients.find((cl) => cl.id === selectedClientId);
              return c ? (
                <div className="mt-3 bg-white/3 rounded-lg px-4 py-3 text-sm">
                  <p className="text-white font-medium">{c.clientName}</p>
                  <p className="text-white/40 text-xs mt-0.5">{c.email}{c.phone ? ` · ${c.phone}` : ''}</p>
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
              {lineItems.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white/3 border border-white/5 rounded-xl p-4 space-y-3"
                >
                  {/* Row 1 — Item selector */}
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-white/30 mb-1.5">
                        Item {index + 1}
                      </label>
                      {/* Inventory dropdown */}
                      <select
                        value={item.inventoryId ?? ''}
                        onChange={(e) => handleInventorySelect(item.id, e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#E8A120]/50 transition-colors appearance-none"
                      >
                        <option value="" className="bg-[#0D1526]">---- Select from inventory or type manually ----</option>
                        {inventoryItems.map((inv) => (
                          <option key={inv.id} value={inv.id} className="bg-[#0D1526]">
                            {inv.name} ({inv.type}) -: {formatCurrency(inv.unitPrice)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Remove button */}
                    {lineItems.length > 1 && (
                      <button
                        onClick={() => removeItem(item.id)}
                        className="mt-6 text-white/20 hover:text-red-400 transition-colors"
                      >
                        <TrashIcon size={16} />
                      </button>
                    )}
                  </div>

                  {/* Row 2 — Manual name + type (shown always, pre-filled from inventory) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-white/30 mb-1.5">Item Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Solar Panel 400W"
                        value={item.itemName}
                        onChange={(e) => updateItem(item.id, { itemName: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-[#E8A120]/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/30 mb-1.5">Type</label>
                      <select
                        value={item.itemType}
                        onChange={(e) => updateItem(item.id, { itemType: e.target.value as 'product' | 'service' })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#E8A120]/50 transition-colors appearance-none"
                      >
                        <option value="" className="bg-[#0D1526]">--- Select type ---</option>
                        <option value="product" className="bg-[#0D1526]">Product</option>
                        <option value="service" className="bg-[#0D1526]">Service</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 3 — Qty + Unit Price + Line Total */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-white/30 mb-1.5">Quantity</label>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#E8A120]/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/30 mb-1.5">Unit Price (NGN)</label>
                      <input
                        type="number"
                        min={0}
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#E8A120]/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/30 mb-1.5">Line Total</label>
                      <div className="bg-white/3 border border-white/5 rounded-lg px-3 py-2 text-sm text-[#E8A120] font-medium">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>

            {/* Add line item */}
            <button
              onClick={addItem}
              className="mt-4 flex items-center gap-2 text-sm text-[#E8A120] hover:text-[#E8A120]/80 transition-colors"
            >
              <PlusIcon size={16} weight="bold" />
              Add Line Item
            </button>
          </div>

          {/* C — Notes */}
          <div className="bg-[#0D1526] border border-white/10 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">
              C · Notes (optional)
            </h3>
            <textarea
              rows={3}
              placeholder="Any additional notes for the client..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#E8A120]/50 transition-colors resize-none"
            />
          </div>

        </div>

        {/* Right column - Quote Summary */}
        <div className="space-y-4">
          <div className="bg-[#0D1526] border border-white/10 rounded-xl p-5 sticky top-20">
            <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">
              Quote Summary
            </h3>

            {/* Line item breakdown */}
            {lineItems.filter(i => i.itemName).map((item) => (
              <div key={item.id} className="flex justify-between text-xs text-white/40 mb-2">
                <span className="truncate max-w-35">
                  {item.itemName} × {item.quantity}
                </span>
                <span>{formatCurrency(item.quantity * item.unitPrice)}</span>
              </div>
            ))}

            <div className="border-t border-white/10 mt-3 pt-3 space-y-2.5">
              {/* Subtotal */}
              <div className="flex justify-between text-sm text-white/60">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {/* VAT toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUseVat((v) => !v)}
                    className={`w-9 h-5 rounded-full transition-colors relative ${useVat ? 'bg-[#E8A120]' : 'bg-white/10'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${useVat ? 'translate-x-1.5' : 'translate-x-0.5'}`} />
                  </button>
                  <span className="text-sm text-white/60">VAT</span>
                </div>
                {useVat && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={vatRate}
                      onChange={(e) => setVatRate(Number(e.target.value))}
                      className="w-14 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white text-right outline-none focus:border-[#E8A120]/50"
                    />
                    <span className="text-xs text-white/40">%</span>
                  </div>
                )}
              </div>

              {useVat && (
                <div className="flex justify-between text-sm text-white/60">
                  <span>VAT ({vatRate}%)</span>
                  <span>{formatCurrency(vatAmount)}</span>
                </div>
              )}

              {/* Grand Total */}
              <div className="flex justify-between text-base font-bold text-white border-t border-white/10 pt-3">
                <span>Grand Total</span>
                <span className="text-[#E8A120]">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Submit hint */}
            <p className="text-white/25 text-xs mt-4 flex items-start gap-1.5">
              <WarningIcon size={12} weight="fill" className="shrink-0 mt-0.5" />
              Quote will be emailed to the client automatically on submission.
            </p>

            {/* Action buttons */}
            <div className="mt-4 space-y-2.5">
              <button
                onClick={handleSubmit}
                disabled={mutation.isPending}
                className="w-full py-2.5 rounded-lg bg-[#E8A120] text-[#0A0F1E] text-sm font-semibold hover:bg-[#E8A120]/90 transition-colors disabled:opacity-60"
              >
                {mutation.isPending ? 'Submitting...' : 'Submit Quote →'}
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={mutation.isPending}
                className="w-full py-2.5 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors disabled:opacity-60"
              >
                Save as Draft
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Add Client Modal */}
      {showAddClient && (
        <AddClientModal
          onSuccess={(newClient) => {
            setExtraClients((prev) => [...prev, newClient]);
            setSelectedClientId(newClient.id);
            setShowAddClient(false);
          }}
          onClose={() => setShowAddClient(false)}
        />
      )}

    </div>
  )
}

export default NewQuotePage

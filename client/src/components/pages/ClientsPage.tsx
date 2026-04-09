import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  XIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  QuotesIcon,
  InvoiceIcon,
  TrashIcon,
  PencilSimpleIcon,
  WarningIcon,
} from '@phosphor-icons/react';
import {
  getAllClients,
  createClient,
  updateClient,
  deleteClient,
} from '../../api/clients.api';
import { formatCurrency, formatDate, getQuoteStatusColor, getInvoiceStatusColor } from '../../utils/formatCurrency';
import type { Client } from '../../types';

// --------------------------------------------------------------------------
// ADD / EDIT CLIENT MODAL
// --------------------------------------------------------------------------
interface ClientModalProps {
  client?: Client;   // if provided, we're editing; otherwise adding
  onSuccess: () => void;
  onClose: () => void;
}

const ClientModal = ({ client, onSuccess, onClose }: ClientModalProps) => {
  const [form, setForm] = useState({
    clientName: client?.clientName ?? '',
    email: client?.email ?? '',
    phone: client?.phone ?? '',
    contactPerson: client?.contactPerson ?? '',
    address: client?.address ?? '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = !!client;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName || !form.email) {
      setError('Client name and email are required');
      return;
    }
    setLoading(true);
    try {
      if (isEditing) {
        await updateClient(client!.id, form);
      } else {
        await createClient(form);
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
      <div className="bg-[#0D1526] border border-white/10 rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">
            {isEditing ? 'Edit Client' : 'Add New Client'}
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
          {[
            { label: 'Client Name *', key: 'clientName', placeholder: 'e.g. Nexus Energy Ltd' },
            { label: 'Email *', key: 'email', placeholder: 'info@nexusenergy.ng' },
            { label: 'Phone', key: 'phone', placeholder: '+234 801 234 5678' },
            { label: 'Contact Person', key: 'contactPerson', placeholder: 'e.g. Emeka Obi' },
            { label: 'Address', key: 'address', placeholder: 'Lagos, Nigeria' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-xs text-white/40 mb-1.5">{label}</label>
              <input
                type={key === 'email' ? 'email' : 'text'}
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
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --------------------------------------------------------------------------
// CLIENT DETAIL PANEL
// Slides in from the right when a client row is clicked
// --------------------------------------------------------------------------
interface ClientDetailProps {
  client: Client;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const ClientDetail = ({ client, onEdit, onDelete, onClose }: ClientDetailProps) => {
  const { data } = useQuery({
    queryKey: ['client', client.id],
    queryFn: async () => {
      const { default: api } = await import('../../lib/axios');
      const res = await api.get(`/clients/${client.id}`);
      return res.data;
    },
  });

  const quotes = data?.quotes ?? [];
  const invoices = data?.invoices ?? [];
  const stats = data?.stats ?? {};

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-[#0D1526] border-l border-white/10 h-full overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-[#0D1526] z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E8A120]/10 flex items-center justify-center text-[#E8A120] font-bold text-sm">
              {client.clientName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{client.clientName}</p>
              <p className="text-white/40 text-xs">{client.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 text-white/40 hover:text-[#E8A120] transition-colors"
              title="Edit client"
            >
              <PencilSimpleIcon size={16} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-white/40 hover:text-red-400 transition-colors"
              title="Delete client"
            >
              <TrashIcon size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/40 hover:text-white transition-colors"
            >
              <XIcon size={16} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">

          {/* Contact info */}
          <div className="space-y-2.5">
            {client.contactPerson && (
              <div className="flex items-center gap-2.5 text-sm">
                <UserIcon size={14} className="text-white/30 flex-shrink-0" />
                <span className="text-white/70">{client.contactPerson}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5 text-sm">
              <EnvelopeIcon size={14} className="text-white/30 shrink-0" />
              <span className="text-white/70">{client.email}</span>
            </div>
            {client.phone && (
              <div className="flex items-center gap-2.5 text-sm">
                <PhoneIcon size={14} className="text-white/30 shrink-0" />
                <span className="text-white/70">{client.phone}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-2.5 text-sm">
                <MapPinIcon size={14} className="text-white/30 shrink-0" />
                <span className="text-white/70">{client.address}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Quotes', value: stats.totalQuotes ?? 0 },
              { label: 'Invoices', value: stats.totalInvoices ?? 0 },
              { label: 'Spent', value: formatCurrency(stats.totalSpend ?? 0) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-white font-bold text-sm">{value}</p>
                <p className="text-white/40 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Recent Quotes */}
          {quotes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs text-white/30 uppercase tracking-wider mb-3">
                <QuotesIcon size={12} />
                Recent Quotes
              </div>
              <div className="space-y-2">
                {quotes.slice(0, 4).map((q: any) => (
                  <div key={q.id} className="flex items-center justify-between bg-white/3 rounded-lg px-3 py-2.5">
                    <span className="text-white text-xs font-medium">#{q.quoteNumber}</span>
                    <span className="text-white/40 text-xs">{formatCurrency(q.grandTotal)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getQuoteStatusColor(q.status)}`}>
                      {q.status}
                    </span>
                    <span className="text-white/30 text-xs">{formatDate(q.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Invoices */}
          {invoices.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs text-white/30 uppercase tracking-wider mb-3">
                <InvoiceIcon size={12} />
                Recent Invoices
              </div>
              <div className="space-y-2">
                {invoices.slice(0, 4).map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between bg-white/3 rounded-lg px-3 py-2.5">
                    <span className="text-white text-xs font-medium">#{inv.invoiceNumber}</span>
                    <span className="text-white/40 text-xs">{formatCurrency(inv.grandTotal)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getInvoiceStatusColor(inv.status)}`}>
                      {inv.status}
                    </span>
                    <span className="text-white/30 text-xs">{formatDate(inv.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};


// --------------------------------------------------------------------------
// CLIENTS PAGE
// --------------------------------------------------------------------------
const ClientsPage = () => {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => getAllClients({ search: search || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setDeleteTarget(null);
      if (selectedClient?.id === deleteTarget?.id) setSelectedClient(null);
    },
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    setShowAddModal(false);
    setEditClient(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const clients = data?.clients ?? [];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-white/40 text-sm">
          {data?.count ?? 0} client{(data?.count ?? 0) !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#E8A120] text-[#0A0F1E] text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#E8A120]/90 transition-colors"
        >
          <PlusIcon size={16} weight="bold" />
          Add Client
        </button>
      </div>

      {/* Search  */}
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#E8A120]/50 transition-colors"
          />
        </div>
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(''); setSearchInput(''); }}
            className="text-white/30 hover:text-white text-xs transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {/* Client Cards Grid  */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 border-2 border-[#E8A120] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isError ? (
        <div className="text-center text-white/30 text-sm py-12">
          Failed to load clients. Please refresh.
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center text-white/30 text-sm py-12 space-y-2">
          <p>No clients found.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-[#E8A120] text-xs hover:underline"
          >
            Add your first client →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map((client) => (
            <div
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className={`bg-[#0D1526] border rounded-xl p-4 cursor-pointer transition-colors hover:border-[#E8A120]/30
                  ${selectedClient?.id === client.id ? 'border-[#E8A120]/40' : 'border-white/10'}`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#E8A120]/10 flex items-center justify-center text-[#E8A120] font-bold text-sm shrink-0">
                  {client.clientName.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-medium text-sm truncate">{client.clientName}</p>
                  <p className="text-white/40 text-xs mt-0.5 truncate">{client.email}</p>
                  {client.phone && (
                    <p className="text-white/30 text-xs mt-0.5">{client.phone}</p>
                  )}
                  {client.address && (
                    <p className="text-white/25 text-xs mt-1 truncate">{client.address}</p>
                  )}
                </div>
              </div>
              <p className="text-white/20 text-xs mt-3">
                Added {formatDate(client.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modals  */}
      {(showAddModal || editClient) && (
        <ClientModal
          client={editClient ?? undefined}
          onSuccess={handleSuccess}
          onClose={() => { setShowAddModal(false); setEditClient(null); }}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-[#0D1526] border border-white/10 rounded-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <WarningIcon size={24} weight="fill" className="text-red-400" />
            </div>
            <h3 className="text-white font-semibold text-center mb-1">Delete Client?</h3>
            <p className="text-white/40 text-sm text-center mb-5">
              "{deleteTarget.clientName}" will be permanently removed.
              This will fail if they have existing quotes.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client detail slide-in panel */}
      {selectedClient && (
        <ClientDetail
          client={selectedClient}
          onEdit={() => { setEditClient(selectedClient); setSelectedClient(null); }}
          onDelete={() => { setDeleteTarget(selectedClient); setSelectedClient(null); }}
          onClose={() => setSelectedClient(null)}
        />
      )}

    </div>
  );
}

export default ClientsPage

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    MagnifyingGlassIcon,
    ArrowUpRightIcon,
    FileCsvIcon,
} from '@phosphor-icons/react';
import { getAllInvoices } from '../../api/invoices.api';
import {
    formatCurrency,
    formatDate,
    getInvoiceStatusColor,
} from '../../utils/formatCurrency';

import { usePermissions } from '../../hooks/usePermissions';
import { downloadCSV, type InvoiceExportRow } from '../../utils/exportUtils';
import Pagination from '../ui/Pagination';


// --------------------------------------------------------------------------
// STATUS FILTER TABS
// --------------------------------------------------------------------------
const STATUS_TABS = [
    { label: 'All', value: '' },
    { label: 'Sent', value: 'sent' },
    { label: 'Paid', value: 'paid' },
    { label: 'Cancelled', value: 'cancelled' },
];

// --------------------------------------------------------------------------
// INVOICES PAGE
// --------------------------------------------------------------------------
const InvoicesPage = () => {
    const navigate = useNavigate();
        const perms       = usePermissions();
    

    const [activeTab, setActiveTab] = useState('');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

// Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);


    const { data, isLoading, isError } = useQuery({
        queryKey: ['invoices', activeTab, search],
        queryFn: () => getAllInvoices({
            status: activeTab || undefined,
            search: search || undefined,
        }),
         refetchOnMount: true,        // 
    refetchOnWindowFocus: true,  // 
        refetchInterval: 30_000,   // auto-refresh every 30 s (Issue #3)

    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
    };

     const handleExportCSV = () => {
            if (!invoices.length) return;
            const rows: InvoiceExportRow[] = invoices.map(inv => ({
                'Invoice #':   inv.invoiceNumber,
                Client:        inv.client?.clientName ?? '—',
                'Quote Ref':   inv.quote?.quoteNumber  ?? '—',
                'Amount (₦)':  Number(inv.grandTotal),
                Status:        inv.status,
                'Due Date':    inv.dueDate   ? formatDate(inv.dueDate)   : '—',
                'Created At':  formatDate(inv.createdAt),
            }));
            downloadCSV('invoices-export', rows);
        };

    const invoices = data?.invoices ?? [];

       // Client-side pagination
    const totalPages = Math.ceil(invoices.length / itemsPerPage);
    const paginatedInvoices = invoices.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-5">

            {/* Header  */}
                <div className="flex items-center justify-between">
                            <p className="text-white/40 text-sm">{data?.count ?? 0} total invoices</p>
                            {perms.canExport && (
                                <button
                                    onClick={handleExportCSV}
                                    disabled={!invoices.length}
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
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${activeTab === tab.value
                                    ? 'bg-[#E8A120] text-[#0A0F1E]'
                                    : 'text-white/50 hover:text-white'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <div className="relative">
                        <MagnifyingGlassIcon
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                        />
                        <input
                            type="text"
                            placeholder="Search by client name..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#E8A120]/50 w-56 transition-colors"
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

            </div>

            {/* Table  */}
            <div className="bg-[#0D1526] border border-white/10 rounded-xl overflow-hidden">

                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-7 h-7 border-2 border-[#E8A120] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : isError ? (
                    <div className="flex items-center justify-center h-48 text-white/30 text-sm">
                        Failed to load invoices. Please refresh.
                    </div>
                ) : paginatedInvoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-white/30 text-sm gap-2">
                        <p>No invoices found.</p>
                        <p className="text-xs">Invoices are generated automatically when a quote is approved.</p>
                    </div>
                ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-187.5">
                    {/* <table className="w-full text-sm"> */}
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="text-left text-xs font-medium text-white/30 px-5 py-3.5">Invoice</th>
                                <th className="text-left text-xs font-medium text-white/30 px-5 py-3.5">Client</th>
                                <th className="text-left text-xs font-medium text-white/30 px-5 py-3.5">Quote Ref</th>
                                <th className="text-left text-xs font-medium text-white/30 px-5 py-3.5">Amount</th>
                                <th className="text-left text-xs font-medium text-white/30 px-5 py-3.5">Payment Status</th>
                                <th className="text-left text-xs font-medium text-white/30 px-5 py-3.5">Due Date</th>
                                <th className="text-left text-xs font-medium text-white/30 px-5 py-3.5">Date</th>
                                <th className="text-right text-xs font-medium text-white/30 px-5 py-3.5">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedInvoices.map((invoice) => (
                                <tr
                                    key={invoice.id}
                                    className="border-b border-white/5 hover:bg-white/2 transition-colors"
                                >
                                    <td className="px-5 py-4 font-medium text-white">
                                        #{invoice.invoiceNumber}
                                    </td>
                                    <td className="px-5 py-4 text-white/60">
                                        {invoice.client?.clientName ?? '—'}
                                    </td>
                                    <td className="px-5 py-4 text-white/40">
                                        #{invoice.quote?.quoteNumber ?? '—'}
                                    </td>
                                    <td className="px-5 py-4 text-white font-medium">
                                        {formatCurrency(invoice.grandTotal)}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${getInvoiceStatusColor(invoice.status)}`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-white/40">
                                        {invoice.dueDate ? formatDate(invoice.dueDate) : '—'}
                                    </td>
                                    <td className="px-5 py-4 text-white/40">
                                        {formatDate(invoice.createdAt)}
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <button
                                            onClick={() => navigate(`/invoices/${invoice.id}`)}
                                            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/20 px-2.5 py-1.5 rounded-lg transition-colors ml-auto"
                                        >
                                            <ArrowUpRightIcon size={13} />
                                            View
                                        </button>
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
                totalItems={invoices.length}
            />

        </div>
    );
};

export default InvoicesPage;
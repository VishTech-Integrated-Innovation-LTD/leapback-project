import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { getDashboardData } from "../../api/dashboard.api"
import { formatCurrency, formatCurrencyCompact, formatDate, getQuoteStatusColor } from "../../utils/formatCurrency"
import { ArrowRightIcon, ArrowUpRightIcon, CheckCircleIcon, ClockCountdownIcon, CurrencyNgnIcon, FileTextIcon, UsersIcon, WarningIcon } from "@phosphor-icons/react";

// --------------------------------------------------------------------------
// KPI CARD - dark themed
// --------------------------------------------------------------------------

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
}

const KpiCard = ({ label, value, sub, icon, iconBg }: KpiCardProps) => (
  <div className="bg-[#0D1526] border border-white/10 rounded-xl p-5 flex items-start gap-4">
    <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-bold text-white leading-tight">{value}</p>
      <p className="text-sm text-white/50 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-[#E8A120] font-medium mt-1">{sub}</p>}
    </div>
  </div>
);

// --------------------------------------------------------------------------
// DASHBOARD PAGE
// --------------------------------------------------------------------------
const DashboardPage = () => {
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#E8A120] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-white/40 text-sm">Failed to load dashboard. Please refresh.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* KPI Cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 sm:grid-cols-1 gap-4">
        <KpiCard
          label="Total Sales"
          value={formatCurrencyCompact(data.totalSales)}
          sub="From paid invoices"
          icon={<CurrencyNgnIcon size={22} weight="bold" className="text-[#E8A120]" />}
          iconBg="bg-[#E8A120]/10"
        />
        <KpiCard
          label="Pending Quotes"
          value={data.quotes.pending}
          sub="Awaiting approval"
          icon={<ClockCountdownIcon size={22} weight="fill" className="text-yellow-400" />}
          iconBg="bg-yellow-400/10"
        />
        <KpiCard
          label="Approved Quotes"
          value={data.quotes.approved}
          icon={<CheckCircleIcon size={22} weight="fill" className="text-green-400" />}
          iconBg="bg-green-400/10"
        />
        <KpiCard
          label="Total Quotes"
          value={data.quotes.total}
          sub="All time"
          icon={<FileTextIcon size={22} weight="fill" className="text-blue-400" />}
          iconBg="bg-blue-400/10"
        />
        <KpiCard
          label="Low Stock Alerts"
          value={data.lowStockAlerts.length}
          sub={data.lowStockAlerts.length > 0 ? 'Action needed' : 'All good'}
          icon={<WarningIcon size={22} weight="fill" className={data.lowStockAlerts.length > 0 ? 'text-red-400' : 'text-white/30'} />}
          iconBg={data.lowStockAlerts.length > 0 ? 'bg-red-400/10' : 'bg-white/5'}
        />
        <KpiCard
          label="Total Clients"
          value={data.totalClients}
          sub="Active clients"
          icon={<UsersIcon size={22} weight="fill" className="text-purple-400" />}
          iconBg="bg-purple-400/10"
        />
      </div>

      {/* Bottom section */}
      {/* <div className="grid md:grid-cols-2 xl:grid-cols-3 sm:grid-cols-1 gap-4"> */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Recent Quotes */}
        <div className="xl:col-span-2 bg-[#0D1526] border border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Quotes</h3>
              <p className="text-xs text-white/30 mt-0.5">Latest 5 quote requests</p>
            </div>
            <button
              onClick={() => navigate('/quotes')}
              className="text-xs text-[#E8A120] font-medium flex items-center gap-1 hover:underline"
            >
              View All <ArrowRightIcon size={12} />
            </button>
          </div>

          {data.recentQuotes.length === 0 ? (
            <div className="px-5 py-10 text-center text-white/30 text-sm">
              No quotes yet. Create your first quote.
            </div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-150">
            {/*  <table className="w-full text-sm"> */}
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs font-medium text-white/30 px-5 py-3">Quote ID</th>
                  <th className="text-left text-xs font-medium text-white/30 px-5 py-3">Client</th>
                  <th className="text-left text-xs font-medium text-white/30 px-5 py-3">Amount</th>
                  <th className="text-left text-xs font-medium text-white/30 px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-white/30 px-5 py-3">Date</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.recentQuotes.map((quote) => (
                  <tr
                    key={quote.id}
                    className="border-b border-white/5 hover:bg-white/3 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-medium text-white">
                      #{quote.quoteNumber}
                    </td>
                    {/* Client name comes from the nested client object on the quote */}
                    <td className="px-5 py-3.5 text-white/60">
                      {quote.client?.clientName ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 text-white font-medium">
                      {formatCurrency(quote.grandTotal)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${getQuoteStatusColor(quote.status)}`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-white/40">
                      {formatDate(quote.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => navigate(`/quotes/${quote.id}`)}
                        className="text-white/30 hover:text-[#E8A120] transition-colors"
                        title="View quote"
                      >
                        <ArrowUpRightIcon size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-[#0D1526] border border-white/10 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white">Low Stock</h3>
            <p className="text-xs text-white/30 mt-0.5">Items needing attention</p>
          </div>

          {data.lowStockAlerts.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <CheckCircleIcon size={32} weight="fill" className="text-green-400 mx-auto mb-2" />
              <p className="text-white/30 text-sm">All stock levels are healthy</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {data.lowStockAlerts.map((item) => (
                <li key={item.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.name}</p>
                    <p className="text-xs text-white/30 mt-0.5">
                      Threshold: {item.lowStockThreshold} units
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0
                    ${item.stockQty === 0
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-orange-500/20 text-orange-400'
                    }`}
                  >
                    {item.stockQty} left
                  </span>
                </li>
              ))}
            </ul>
          )}

          {data.lowStockAlerts.length > 0 && (
            <div className="px-5 py-3 border-t border-white/10">
              <button
                onClick={() => navigate('/inventory')}
                className="text-xs text-[#E8A120] font-medium flex items-center gap-1 hover:underline"
              >
                Manage Inventory <ArrowRightIcon size={12} />
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}

export default DashboardPage

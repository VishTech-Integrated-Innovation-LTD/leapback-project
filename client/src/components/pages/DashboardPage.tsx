import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { getDashboardData } from "../../api/dashboard.api"
import { formatCurrency, formatCurrencyCompact, formatDate, getQuoteStatusColor } from "../../utils/formatCurrency"
import { ArrowRightIcon, CheckCircleIcon, ClockCountdownIcon, CurrencyNgnIcon, FileTextIcon, UsersIcon, WarningIcon } from "@phosphor-icons/react";

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
        </div>

      </div>

    </div>
  )
}

export default DashboardPage

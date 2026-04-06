import { BellIcon, PlusIcon } from "@phosphor-icons/react";
import { useLocation, useNavigate } from "react-router-dom";


// --------------------------------------------------------------------------
// PAGE TITLES
// Maps route paths to the page title shown in the topbar
// --------------------------------------------------------------------------
const pageTitles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/quotes': 'Quotes',
    '/quotes/new': 'Create New Quote',
    '/invoices': 'Invoices',
    '/inventory': 'Inventory',
    '/clients': 'Client Records',
    '/settings': 'Settings',
};

interface TopbarProps {
    lowStockCount?: number;
}


// --------------------------------------------------------------------------
// TOPBAR
// Fixed top bar - shows current page title, low stock alert bell, new quote btn
// --------------------------------------------------------------------------
const Topbar = ({ lowStockCount = 0 }: TopbarProps) => {
    // const Topbar = () => {

    const location = useLocation();
    const navigate = useNavigate();


    // Derive the page title from the current path
    // For dynamic routes like /quotes/:id, fall back to "Quotes"
    const title =
        pageTitles[location.pathname] ??
        Object.entries(pageTitles).find(([path]) =>
            location.pathname.startsWith(path)
        )?.[1] ??
        'Leapback';


    return (
        <header className="h-16 bg-[#0D1526] border-b border-white/10 flex items-center justify-between px-6 fixed top-0 left-64 right-0 z-30">

            {/* ----- Page title --------------------------------------------------- */}
            <h2 className="text-lg font-semibold text-white">{title}</h2>


            {/* ----- Right actions --------------------------------------------------- */}
            <div className="flex items-center gap-3">
                {/* Low stock notification bell */}
                <button
                    className="relative p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                    title={
                        lowStockCount > 0
                            ? `${lowStockCount} low stock alert${lowStockCount > 1 ? 's' : ''}`
                            : 'No alerts'
                    }
                >
                    <BellIcon size={20} weight={lowStockCount > 0 ? 'fill' : 'regular'} />
                    {lowStockCount > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                </button>

                {/* New Quote CTA - visible on all pages except New Quote itself */}
                {location.pathname !== '/quotes/new' && (
                    <button
                        onClick={() => navigate('/quotes/new')}
                        className="flex items-center gap-2 bg-[#E8A120] text-[#0A0F1E] text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#E8A120]/90 transition-colors"
                    >
                        <PlusIcon size={16} weight="bold" />
                        New Quote
                    </button>
                )}
            </div>

        </header>
    )
}

export default Topbar
import { ArrowRightIcon, BellIcon, PlusIcon, WarningIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
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

// --------------------------------------------------------------------------
// LOW STOCK ITEM TYPE
// --------------------------------------------------------------------------
interface LowStockItem {
  id:                string;
  name:              string;
  stockQty:          number;
  lowStockThreshold: number;
}

interface TopbarProps {
    lowStockCount?: number;
  lowStockItems?: LowStockItem[];
}


// --------------------------------------------------------------------------
// TOPBAR
// Fixed top bar - shows current page title, low stock alert bell, new quote btn
// --------------------------------------------------------------------------
    const Topbar = ({ lowStockCount = 0, lowStockItems = [] }: TopbarProps) => {

    const location = useLocation();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
      const dropdownRef        = useRef<HTMLDivElement>(null);


    // Derive the page title from the current path
    // For dynamic routes like /quotes/:id, fall back to "Quotes"
    const title =
        pageTitles[location.pathname] ??
        Object.entries(pageTitles).find(([path]) =>
            location.pathname.startsWith(path)
        )?.[1] ??
        'Leapback';

         // Close dropdown when clicking outside
          useEffect(() => {
            const handler = (e: MouseEvent) => {
              if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
              }
            };
            document.addEventListener('mousedown', handler);
            return () => document.removeEventListener('mousedown', handler);
          }, []);


    return (
        <header className="h-16 bg-[#0D1526] border-b border-white/10 flex items-center justify-between px-6 fixed top-0 left-64 right-0 z-30">

            {/* ----- Page title --------------------------------------------------- */}
            <h2 className="text-lg font-semibold text-white">{title}</h2>


            {/* ----- Right actions --------------------------------------------------- */}
            <div className="flex items-center gap-3">
                {/* Low stock notification bell */}
                  {/* Notification bell with dropdown */}
                        <div className="relative" ref={dropdownRef}>
                          <button
                            onClick={() => setShowDropdown((v) => !v)}
                            className="relative p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                            title={
                              lowStockCount > 0
                                ? `${lowStockCount} low stock alert${lowStockCount > 1 ? 's' : ''}`
                                : 'No alerts'
                            }
                          >
                            <BellIcon size={20} weight={lowStockCount > 0 ? 'fill' : 'regular'} />
                            {lowStockCount > 0 && (
                              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                            )}
                          </button>
                
                          {/* Dropdown */}
                          {showDropdown && (
                            <div className="absolute right-0 top-11 w-72 bg-[#0D1526] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                
                              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                                <p className="text-white text-xs font-semibold">Notifications</p>
                                {lowStockCount > 0 && (
                                  <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">
                                    {lowStockCount} alert{lowStockCount > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                
                              {lowStockCount === 0 ? (
                                <div className="px-4 py-6 text-center">
                                  <BellIcon size={24} className="text-white/20 mx-auto mb-2" />
                                  <p className="text-white/30 text-xs">No alerts right now</p>
                                </div>
                              ) : (
                                <>
                                  <ul className="max-h-56 overflow-y-auto divide-y divide-white/5">
                                    {lowStockItems.map((item) => (
                                      <li key={item.id} className="px-4 py-3 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <WarningIcon
                                            size={14}
                                            weight="fill"
                                            className={item.stockQty === 0 ? 'text-red-400 shrink-0' : 'text-orange-400 shrink-0'}
                                          />
                                          <div className="min-w-0">
                                            <p className="text-white text-xs font-medium truncate">{item.name}</p>
                                            <p className="text-white/30 text-xs">
                                              {item.stockQty === 0
                                                ? 'Out of stock'
                                                : `${item.stockQty} left · threshold: ${item.lowStockThreshold}`
                                              }
                                            </p>
                                          </div>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                
                                  {/* Footer link */}
                                  <div className="px-4 py-2.5 border-t border-white/10">
                                    <button
                                      onClick={() => { navigate('/inventory'); setShowDropdown(false); }}
                                      className="text-[#E8A120] text-xs font-medium flex items-center gap-1 hover:underline"
                                    >
                                      Manage Inventory <ArrowRightIcon size={11} />
                                    </button>
                                  </div>
                                </>
                              )}
                
                            </div>
                          )}
                        </div>

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
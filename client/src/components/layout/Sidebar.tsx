import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { GearIcon, InvoiceIcon, NotepadIcon, PackageIcon, PencilIcon, SignOutIcon, SquaresFourIcon, UsersIcon } from "@phosphor-icons/react";


// --------------------------------------------------------------------------
// TYPES
// --------------------------------------------------------------------------
interface SidebarProps {
    pendingQuotesCount?: number;
}

interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
    badge?: number // used for pending quotes count
}

interface NavGroup {
    group: string;
    items: NavItem[];
}


// --------------------------------------------------------------------------
// SIDEBAR
// Fixed left panel
// --------------------------------------------------------------------------
const Sidebar = ({ pendingQuotesCount = 0 }: SidebarProps) => {
// const Sidebar = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    //   Nav groups
    const navGroups: NavGroup[] = [
        {
            group: 'Main',
            items: [
                {
                    label: 'Dashboard',
                    path: '/dashboard',
                    icon: <SquaresFourIcon size={18} weight="fill" />,
                },
                {
                    label: 'Quotes',
                    path: '/quotes',
                    icon: <NotepadIcon size={18} weight="fill" />,
                    badge: pendingQuotesCount,
                },
                {
                    label: 'New Quote',
                    path: '/quotes/new',
                    icon: <PencilIcon size={18} weight="bold" />,
                },
                {
                    label: 'Invoices',
                    path: '/invoices',
                    icon: <InvoiceIcon size={18} weight="fill" />,
                },
            ],
        },
        {
            group: 'Inventory',
            items: [
                {
                    label: 'Inventory',
                    path: '/inventory',
                    icon: <PackageIcon size={18} weight="fill" />,
                },
            ],
        },
        {
            group: 'Clients',
            items: [
                {
                    label: 'Client Records',
                    path: '/clients',
                    icon: <UsersIcon size={18} weight="fill" />,
                },
            ],
        },
        {
            group: 'System',
            items: [
                {
                    label: 'Settings',
                    path: '/settings',
                    icon: <GearIcon size={18} weight="fill" />,
                },
            ],
        },
    ];

    const handleLogOut = () => {
        logout();
        navigate('/');
    }

    // Get initials from user's name for the avatar
    const getInitials = (name: string) =>
        name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);


    return (
        <aside className="flex flex-col h-screen w-64 bg-[#0A0F1E] text-white fixed left-0 top-0 z-40">

            {/* ----- Brand --------------------------------------------------- */}
            <div className="px-6 py-5 border-b border-white/10">
                <h1 className="text-[#E8A120] font-bold text-xl tracking-widest">
                    LEAPBACK
                </h1>
                <p className="text-white/40 text-xs mt-0.5">E-Quotation v1.0</p>
            </div>

            {/* ----- User Avatar --------------------------------------------------- */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#E8A120] flex items-center justify-center text-[#0A0F1E] font-bold text-sm shrink-0">
                    {user ? getInitials(user.name) : 'A'}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                        {user?.name ?? 'Admin User'}
                    </p>
                    <p className="text-xs text-white/40">Administrator</p>
                </div>
            </div>

            {/* ----- Navigation --------------------------------------------------- */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 [scrollbar-width:none]">
                {navGroups.map((group) => (
                    <div key={group.group}>
                        {/* Group label */}
                        <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest px-3 mb-1.5">
                            {group.group}
                        </p>

                        {/* Nav items */}
                        <ul className="space-y-0.5">
                            {group.items.map((item) => (
                                <li key={item.path}>
                                    <NavLink
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                      ${isActive
                                                ? 'bg-[#E8A120]/15 text-[#E8A120]'
                                                //   ? 'bg-[#E8A120]/15 text-[#E8A120] border'
                                                : 'text-white/60 hover:text-white hover:bg-white/5'
                                            }`
                                        }
                                    >
                                        <span className="shrink-0">{item.icon}</span>
                                        <span className="flex-1">{item.label}</span>

                                        {/* Pending badge — shown on Quotes when there are pending items */}
                                        {item.badge !== undefined && item.badge > 0 && (
                                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4.5 text-center">
                                                {item.badge}
                                            </span>
                                        )}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* ----- Sign Out --------------------------------------------------- */}
            <div className="px-3 py-4 border-t border-white/10">
                <button
                    onClick={handleLogOut}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors w-full"
                >
                    <SignOutIcon size={18} weight="bold" />
                    <span>Sign Out</span>
                </button>
            </div>

        </aside>
    )
}

export default Sidebar

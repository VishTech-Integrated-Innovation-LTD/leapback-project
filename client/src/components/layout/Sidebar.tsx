// ============================================================
// Changes vs original:
//  - Nav items filtered by permission (invoices / settings hidden from staff)
//  - canViewSettings added to Settings item
//  - Role label shown correctly (Chief Admin / Administrator / Staff)
//  - Permission filter: item only renders if no permission key, or perms[key] is true
// ============================================================

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore }         from '../../stores/authStore';
import {
    GearIcon, InvoiceIcon, NotepadIcon, PackageIcon,
    PencilIcon, SignOutIcon, SquaresFourIcon,
    UsersIcon, WarningIcon,
} from '@phosphor-icons/react';
import { useState }        from 'react';
import { usePermissions }  from '../../hooks/usePermissions';
import type { Permissions } from '../../utils/permissions';


// ── Types ───────────────────────────────────────────────────
interface SidebarProps {
    pendingQuotesCount?: number;
    isOpen:  boolean;
    onClose: () => void;
}

interface NavItem {
    label:      string;
    path:       string;
    icon:       React.ReactNode;
    badge?:     number;
    // If set, the item only renders when perms[permission] === true
    permission?: keyof Permissions;
}

interface NavGroup {
    group: string;
    items: NavItem[];
}

// ── Role display label ───────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
    chief_admin: 'Chief Admin',
    admin:       'Administrator',
    staff:       'Staff',
};

// ── Logout modal ─────────────────────────────────────────────
interface LogoutModalProps { onConfirm: () => void; onCancel: () => void; }

const LogoutModal = ({ onConfirm, onCancel }: LogoutModalProps) => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
        <div className="bg-[#0D1526] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <WarningIcon size={24} weight="fill" className="text-red-400" />
            </div>
            <h3 className="text-white font-semibold text-center text-base mb-1.5">Sign out?</h3>
            <p className="text-white/50 text-sm text-center mb-6">
                You'll need to sign in again to access the portal.
            </p>
            <div className="flex gap-3">
                <button onClick={onCancel}
                    className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/70 text-sm font-medium hover:bg-white/5 transition-colors">
                    Cancel
                </button>
                <button onClick={onConfirm}
                    className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">
                    Sign Out
                </button>
            </div>
        </div>
    </div>
);


// ── Sidebar ──────────────────────────────────────────────────
const Sidebar = ({ pendingQuotesCount = 0, isOpen, onClose }: SidebarProps) => {
    const { user, logout } = useAuthStore();
    const navigate         = useNavigate();
    const perms            = usePermissions();
    const [showLogout, setShowLogout] = useState(false);

    const navGroups: NavGroup[] = [
        {
            group: 'Main',
            items: [
                {
                    label: 'Dashboard',
                    path:  '/dashboard',
                    icon:  <SquaresFourIcon size={18} weight="fill" />,
                },
                {
                    label: 'Quotes',
                    path:  '/quotes',
                    icon:  <NotepadIcon size={18} weight="fill" />,
                    badge: pendingQuotesCount,
                },
                {
                    label: 'New Quote',
                    path:  '/quotes/new',
                    icon:  <PencilIcon size={18} weight="bold" />,
                },
                {
                    label:      'Invoices',
                    path:       '/invoices',
                    icon:       <InvoiceIcon size={18} weight="fill" />,
                    permission: 'canViewInvoices',   // hidden from staff
                },
            ],
        },
        {
            group: 'Inventory',
            items: [
                {
                    label:      'Inventory',
                    path:       '/inventory',
                    icon:       <PackageIcon size={18} weight="fill" />,
                    permission: 'canViewInventory',  // all roles — always shows
                },
            ],
        },
        {
            group: 'Clients',
            items: [
                {
                    label: 'Client Records',
                    path:  '/clients',
                    icon:  <UsersIcon size={18} weight="fill" />,
                },
            ],
        },
        {
            group: 'System',
            items: [
                {
                    label:      'Settings',
                    path:       '/settings',
                    icon:       <GearIcon size={18} weight="fill" />,
                    permission: 'canViewSettings',   // hidden from staff
                },
            ],
        },
    ];

    const handleConfirmLogout = () => {
        logout();
        navigate('/');
    };

    const getInitials = (name: string) =>
        name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />
            )}

            <aside
                className={`
                    flex flex-col h-screen w-64 bg-[#0A0F1E] border-r border-white/10
                    fixed left-0 top-0 z-40 transition-transform duration-300
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                    lg:translate-x-0
                `}
            >

                {/* Brand */}
                <div className="px-6 py-5 border-b border-white/10 flex items-center gap-3">
                    <img src="/logo-favicon.png" className="w-9 h-9 object-contain" />
                    <div>
                        <h1 className="text-[#E8A120] font-bold text-xl tracking-widest">LEAPBACK</h1>
                        <p className="text-white/30 text-xs mt-0.5">E-Quotation v1.0</p>
                    </div>
                </div>

                {/* User avatar + role */}
                <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#E8A120] flex items-center justify-center text-[#0A0F1E] font-bold text-sm shrink-0">
                        {user ? getInitials(user.name) : 'A'}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.name ?? 'Admin User'}</p>
                        {/* Shows actual role: Chief Admin / Administrator / Staff */}
                        <p className="text-xs text-white/40">
                            {ROLE_LABELS[user?.role ?? ''] ?? 'Staff'}
                        </p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 [scrollbar-width:none]">
                    {navGroups.map(group => {
                        // Filter out items the current role can't access
                        const visibleItems = group.items.filter(
                            item => !item.permission || perms[item.permission] === true
                        );
                        if (!visibleItems.length) return null;

                        return (
                            <div key={group.group}>
                                <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest px-3 mb-1.5">
                                    {group.group}
                                </p>
                                <ul className="space-y-0.5">
                                    {visibleItems.map(item => (
                                        <li key={item.path}>
                                            <NavLink
                                                to={item.path}
                                                onClick={onClose}
                                                className={({ isActive }) =>
                                                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                                                    ${isActive
                                                        ? 'bg-[#E8A120]/10 text-[#E8A120]'
                                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                                    }`
                                                }
                                            >
                                                <span className="shrink-0">{item.icon}</span>
                                                <span className="flex-1">{item.label}</span>

                                                {/* Pending badge */}
                                                {item.badge !== undefined && item.badge > 0 && (
                                                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </NavLink>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </nav>

                {/* Sign out */}
                <div className="px-3 py-4 border-t border-white/10">
                    <button
                        onClick={() => setShowLogout(true)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors w-full"
                    >
                        <SignOutIcon size={18} weight="bold" />
                        <span>Sign Out</span>
                    </button>
                </div>

            </aside>

            {showLogout && (
                <LogoutModal
                    onConfirm={handleConfirmLogout}
                    onCancel={() => setShowLogout(false)}
                />
            )}
        </>
    );
};

export default Sidebar;

import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { GearIcon, InvoiceIcon, NotepadIcon, PackageIcon, PencilIcon, SquaresFourIcon, UsersIcon } from "@phosphor-icons/react";


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



// SIDEBAR
// Fixed left panel
const Sidebar = () => {
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
                    // badge: pendingQuotesCount,
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

    const handleLogOut  = () => {
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
        <aside>
            <div>LEAPBACK</div>
        </aside>
    )
}

export default Sidebar

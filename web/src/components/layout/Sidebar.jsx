// Sidebar — dashboard navigation, role-aware menu items
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Heart,
  SendHorizontal,
  MessageSquare,
  User,
  ListChecks,
  PlusSquare,
  BarChart2,
  Users,
  Flag,
} from 'lucide-react';

// ─── Per-role menu configs ─────────────────────────────────────────────────
export const MENUS = {
  TENANT: [
    { to: '/dashboard',               icon: LayoutDashboard, label: 'dashboardMenu' },
    { to: '/dashboard/my-listings',   icon: ListChecks,      label: 'myListingsMenu' },
    { to: '/dashboard/listings/new',  icon: PlusSquare,      label: 'addListingMenu' },
    { to: '/dashboard/saved',         icon: Heart,           label: 'savedListingsMenu' },
    { to: '/dashboard/requests',      icon: SendHorizontal,  label: 'myRequestsMenu' },
    { to: '/dashboard/chats',         icon: MessageSquare,   label: 'chatsMenu' },
    { to: '/dashboard/profile',       icon: User,            label: 'profileMenu' },
  ],
  OWNER: [
    { to: '/dashboard',               icon: LayoutDashboard, label: 'dashboardMenu' },
    { to: '/dashboard/listings',      icon: ListChecks,      label: 'myListingsMenu' },
    { to: '/dashboard/listings/new',  icon: PlusSquare,      label: 'addListingMenu' },
    { to: '/dashboard/saved',         icon: Heart,           label: 'savedListingsMenu' },
    { to: '/dashboard/requests',      icon: SendHorizontal,  label: 'requestsMenu' },
    { to: '/dashboard/chats',         icon: MessageSquare,   label: 'chatsMenu' },
    { to: '/dashboard/analytics',     icon: BarChart2,       label: 'analyticsMenu' },
    { to: '/dashboard/profile',       icon: User,            label: 'profileMenu' },
  ],
  ADMIN: [
    { to: '/admin',                   icon: LayoutDashboard, label: 'dashboardMenu' },
    { to: '/admin',                   icon: Users,           label: 'users' },
    { to: '/admin',                   icon: ListChecks,      label: 'listingsTab' },
    { to: '/admin',                   icon: Flag,            label: 'reports' },
    { to: '/admin',                   icon: BarChart2,       label: 'analyticsMenu' },
  ],
};

// ─── Single nav item ───────────────────────────────────────────────────────
function SidebarItem({ to, icon: Icon, label, end }) {
  const { t } = useTranslation();
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-primary-50 text-primary-700 shadow-sm'
            : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={18}
            className={`shrink-0 transition-colors duration-150 ${
              isActive ? 'text-primary-600' : 'text-surface-400 group-hover:text-surface-600'
            }`}
          />
          <span className="truncate">{t(label)}</span>
          {/* Active indicator bar */}
          {isActive && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
          )}
        </>
      )}
    </NavLink>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────
/**
 * @param {{ role: 'TENANT' | 'OWNER' | 'ADMIN' }} props
 */
export default function Sidebar({ role }) {
  const { t } = useTranslation();
  const items = MENUS[role] ?? MENUS.TENANT;

  return (
    <aside className="flex flex-col h-full bg-surface-50/80 backdrop-blur-xl border-r border-surface-100/60 px-3 py-4 sm:py-6 gap-1">
      {/* Section label */}
      <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-surface-400">
        {role === 'ADMIN' ? t('adminPanel') : t('myAccount')}
      </p>

      <nav className="flex flex-col gap-0.5">
        {items.map((item, idx) => (
          <SidebarItem
            key={idx}
            to={item.to}
            icon={item.icon}
            label={item.label}
            // Only the first item (Dashboard) uses exact matching
            end={idx === 0}
          />
        ))}
      </nav>
    </aside>
  );
}

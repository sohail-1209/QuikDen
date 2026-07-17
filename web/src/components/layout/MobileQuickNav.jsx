// MobileQuickNav — horizontal quick-nav row for mobile dashboard
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ListChecks, Heart, SendHorizontal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TENANT_ITEMS = [
  { to: '/dashboard/my-listings', icon: ListChecks, label: 'My Listing' },
  { to: '/dashboard/saved', icon: Heart, label: 'Saved Listings' },
  { to: '/dashboard/requests', icon: SendHorizontal, label: 'My Requests' },
];

const OWNER_ITEMS = [
  { to: '/dashboard/listings', icon: ListChecks, label: 'My Listings' },
  { to: '/dashboard/saved', icon: Heart, label: 'Saved Listings' },
  { to: '/dashboard/requests', icon: SendHorizontal, label: 'requests' },
];

export default function MobileQuickNav() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const items = user?.role === 'OWNER' ? OWNER_ITEMS : TENANT_ITEMS;

  return (
    <div className="lg:hidden flex gap-2 px-4 py-2">
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-xs font-medium transition-all ${isActive
              ? 'bg-primary-50 text-primary-700 shadow-sm'
              : 'bg-white text-surface-600 hover:bg-surface-50 border border-surface-100'
            }`
          }
        >
          <Icon size={14} />
          <span>{t(label)}</span>
        </NavLink>
      ))}
    </div>
  );
}

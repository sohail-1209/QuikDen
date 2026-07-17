// IconSidebar — thin icon sidebar with temporary expand overlay
import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { MENUS } from './Sidebar';

function IconItem({ to, icon: Icon, label, end, onNavigate }) {
  const { t } = useTranslation();
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 w-full rounded-xl transition-all duration-150 ${
          isActive
            ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
            : 'text-surface-400 hover:bg-surface-100 hover:text-surface-700 active:bg-surface-200'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`flex items-center justify-center w-11 h-11 shrink-0 ${isActive ? '' : ''}`}>
            <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
          </span>
          {/* Label — only visible when expanded */}
          <span className="icon-sidebar-label hidden text-sm font-medium whitespace-nowrap overflow-hidden">
            {t(label)}
          </span>
          {/* Active dot */}
          {isActive && (
            <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary-500 ring-2 ring-surface-50" />
          )}
        </>
      )}
    </NavLink>
  );
}

export default function IconSidebar({ role }) {
  const { t } = useTranslation();
  const items = MENUS[role] ?? MENUS.TENANT;
  const [expanded, setExpanded] = useState(false);
  const sidebarRef = useRef(null);
  const location = useLocation();

  // Collapse on route change
  useEffect(() => {
    setExpanded(false);
  }, [location.pathname]);

  // Collapse on outside click
  useEffect(() => {
    if (!expanded) return;
    const handler = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [expanded]);

  // Collapse on Escape key
  useEffect(() => {
    if (!expanded) return;
    const handler = (e) => {
      if (e.key === 'Escape') setExpanded(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [expanded]);

  const collapse = () => setExpanded(false);

  return (
    <>
      <style>{`
        .icon-sidebar-expanded .icon-sidebar-label {
          display: inline-block !important;
          animation: fade-in-right 0.2s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes fade-in-right {
          from { opacity: 0; transform: translateX(-6px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Backdrop */}
      {expanded && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-30 lg:hidden animate-fade-in"
          onClick={collapse}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed left-0 top-14 bottom-0 z-40 bg-surface-50/95 backdrop-blur-xl border-r border-surface-100/60 flex flex-col items-center py-3 lg:hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          expanded ? 'w-[220px] items-stretch px-3 shadow-2xl shadow-black/10' : 'w-[60px]'
        } ${expanded ? 'icon-sidebar-expanded' : ''}`}
      >
        <nav className="flex flex-col items-center gap-1 flex-1 w-full">
          {items.map((item, idx) => (
            <IconItem
              key={idx}
              to={item.to}
              icon={item.icon}
              label={item.label}
              end={idx === 0}
              onNavigate={collapse}
            />
          ))}
        </nav>

        {/* Expand/collapse toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 mt-2 ${
            expanded
              ? 'bg-surface-200 text-surface-600 hover:bg-surface-300'
              : 'bg-surface-100 text-surface-400 hover:bg-surface-200 hover:text-surface-600'
          }`}
          title={expanded ? t('collapseSidebar') : t('expandSidebar')}
        >
          {expanded ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>
      </div>
    </>
  );
}

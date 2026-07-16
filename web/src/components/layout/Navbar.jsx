// Navbar — app-shell style: minimal top + bottom nav on mobile
import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Home, Search, Bell, Menu, X, ChevronDown, User,
  LayoutDashboard, ListPlus, LogOut, CheckCheck,
  Download, BedDouble, LandPlot, Users, MessageCircle,
  Heart, PlusCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationsAPI } from '../../services/endpoints';
import { timeAgo } from '../../utils/helpers';
import Avatar from '../ui/Avatar';

const MobileNavLink = ({ to, icon: Icon, label, badge }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  return (
    <NavLink
      to={to}
      className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-all duration-200 ${
        isActive ? 'text-primary-600' : 'text-surface-400'
      }`}
    >
      <div className="relative">
        <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-danger-500 text-white text-[9px] font-bold px-1">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className={`text-[10px] font-medium ${isActive ? 'text-primary-600' : ''}`}>{label}</span>
    </NavLink>
  );
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsAPI.getAll,
    select: (res) => res.data?.data ?? [],
    enabled: !!user,
    refetchInterval: 60_000,
  });
  const unreadCount = notifData?.filter((n) => !n.read).length ?? 0;

  const markAsRead = useMutation({
    mutationFn: (id) => notificationsAPI.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllAsRead = useMutation({
    mutationFn: () => notificationsAPI.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const handleLogout = async () => {
    setDropdownOpen(false);
    setMobileOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <>
      {/* ── Top Bar ──────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl shadow-soft border-b border-surface-100/50'
            : 'bg-white/70 backdrop-blur-lg'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Left: hamburger (mobile) */}
          <button
            className="md:hidden p-2 -ml-2 rounded-xl hover:bg-surface-100 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Center: Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-sm">
              <Home size={15} strokeWidth={2.5} />
            </span>
            <span className="font-display font-bold text-lg text-surface-900 hidden sm:block">Houziee</span>
          </Link>

          {/* Center: Desktop nav */}
          <div className="hidden md:flex items-center gap-1 bg-surface-100/80 rounded-full px-1.5 py-1">
            {[
              { to: '/', label: 'Home' },
              { to: '/search?type=HOUSE_RENTAL', label: 'House' },
              { to: '/search?type=ROOM_SHARING', label: 'Rooms' },
              { to: '/search?type=HOSTEL', label: 'Hostels' },
              { to: '/search?type=LAND_SALE', label: 'Land' },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive ? 'bg-white text-primary-600 shadow-sm' : 'text-surface-500 hover:text-surface-800'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1.5">
            {user ? (
              <>
                {/* Notification */}
                <div className="relative" ref={notifRef}>
                  <button
                    className="relative p-2 rounded-xl hover:bg-surface-100 transition-colors"
                    onClick={() => setNotifOpen((v) => !v)}
                    aria-label="Notifications"
                  >
                    <Bell size={20} className="text-surface-600" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-danger-500 text-white text-[9px] font-bold px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] rounded-2xl bg-white border border-surface-200/60 shadow-soft-lg py-0 z-50 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
                        <h3 className="font-semibold text-surface-900 text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                          <button onClick={() => markAllAsRead.mutate()} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                            <CheckCheck size={14} /> Mark all read
                          </button>
                        )}
                      </div>
                      <div className="overflow-y-auto max-h-[60vh]">
                        {notifData?.length === 0 ? (
                          <div className="px-4 py-10 text-center text-surface-400 text-sm">
                            <Bell size={32} className="mx-auto mb-2 opacity-30" />
                            <p>No notifications yet</p>
                          </div>
                        ) : (
                          notifData?.slice(0, 20).map((notif) => (
                            <button
                              key={notif.id}
                              onClick={() => {
                                markAsRead.mutate(notif.id);
                                if (notif.data?.chatId) navigate(`/dashboard/chats/${notif.data.chatId}`);
                                else if (notif.data?.requestId) navigate('/dashboard/requests');
                                else if (notif.data?.listingId) navigate(`/listing/${notif.data.listingId}`);
                                setNotifOpen(false);
                              }}
                              className={`w-full text-left px-4 py-3 hover:bg-surface-50 transition-colors border-b border-surface-50 last:border-0 ${!notif.read ? 'bg-primary-50/30' : ''}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notif.read ? 'bg-primary-500' : 'bg-surface-300'}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-surface-900">{notif.title}</p>
                                  <p className="text-sm text-surface-600 line-clamp-2 mt-0.5">{notif.body}</p>
                                  <p className="text-xs text-surface-400 mt-1">{timeAgo(notif.createdAt)}</p>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Avatar */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-surface-100 transition-colors"
                  >
                    <Avatar src={user.profileImage} name={user.name} size="sm" />
                    <ChevronDown size={14} className={`text-surface-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-surface-200/60 shadow-soft-lg py-1.5 z-50">
                      <div className="px-4 py-2.5 border-b border-surface-100 mb-1">
                        <p className="text-sm font-semibold text-surface-900 truncate">{user.name}</p>
                        <p className="text-xs text-surface-400 truncate">{user.email}</p>
                      </div>
                      {[
                        { to: '/dashboard/profile', icon: User, label: 'My Profile' },
                        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                        ...(user.role === 'OWNER' ? [{ to: '/dashboard/listings', icon: ListPlus, label: 'My Listings' }] : []),
                      ].map(({ to, icon: Icon, label }) => (
                        <Link key={to} to={to} onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors">
                          <Icon size={16} className="text-surface-400" />
                          {label}
                        </Link>
                      ))}
                      <div className="border-t border-surface-100 mt-1 pt-1">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors">
                          <LogOut size={16} />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-surface-600 hover:text-surface-900 transition-colors">Login</Link>
                <Link to="/register" className="btn-primary btn-sm">Register</Link>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* ── Mobile Drawer ─────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute top-14 left-0 right-0 bg-white border-b border-surface-100 shadow-soft-lg p-4 space-y-1 z-50">
            {[
              { to: '/', icon: Home, label: 'Home' },
              { to: '/search', icon: Search, label: 'Search' },
              { to: '/search?type=ROOM_SHARING', icon: Users, label: 'Room Sharing' },
              { to: '/search?type=HOSTEL', icon: BedDouble, label: 'Hostels' },
              { to: '/search?type=LAND_SALE', icon: LandPlot, label: 'Land Sale' },
            ].map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary-50 text-primary-700' : 'text-surface-700 hover:bg-surface-50'
                  }`
                }
              >
                <Icon size={18} /> {label}
              </NavLink>
            ))}
            {!user && (
              <div className="pt-3 border-t border-surface-100 flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-outline btn-md w-full justify-center">Login</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary btn-md w-full justify-center">Register</Link>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ── Bottom Nav (mobile, logged in) ────────────────────────── */}
      {user && (
        <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t border-surface-100 md:hidden safe-area-bottom">
          <div className="flex items-center justify-around h-16 px-2">
            <MobileNavLink to="/" icon={Home} label="Home" />
            <MobileNavLink to="/search" icon={Search} label="Search" />
            <MobileNavLink to="/dashboard/listings/new" icon={PlusCircle} label="List" />
            <MobileNavLink to="/dashboard/chats" icon={MessageCircle} label="Chats" />
            <MobileNavLink to="/dashboard" icon={LayoutDashboard} label="Account" />
          </div>
        </nav>
      )}

      {/* Spacer */}
      <div className="h-14" />
      {user && <div className="h-16 md:hidden" />}
    </>
  );
}

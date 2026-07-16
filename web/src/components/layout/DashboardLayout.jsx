// DashboardLayout — icon sidebar (mobile/tablet) + full sidebar (desktop)
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import IconSidebar from './IconSidebar';
import { useAuth } from '../../context/AuthContext';

export default function DashboardLayout({ children }) {
  const { user } = useAuth();
  const role = user?.role ?? 'TENANT';

  return (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-3.5rem)] flex bg-surface-50">

      {/* ── Icon sidebar (mobile/tablet, < lg) ──────────────────────────── */}
      <IconSidebar role={role} />

      {/* ── Full sidebar (desktop, ≥ lg) ────────────────────────────────── */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-60 flex flex-col sticky top-14 h-[calc(100vh-3.5rem)]">
          <Sidebar role={role} />
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0 ml-[60px]">
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children ? children : <Outlet />}
        </main>
      </div>
    </div>
    </>
  );
}

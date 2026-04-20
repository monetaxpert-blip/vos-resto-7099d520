import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, Users, BarChart3, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AdminGuard from '@/components/admin/AdminGuard';

const tabs = [
  { to: '/admin', label: 'Vue', icon: LayoutDashboard, end: true },
  { to: '/admin/restaurants', label: 'Restaurants', icon: Store },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/users', label: 'Utilisateurs', icon: Users },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-muted-foreground" aria-label="Retour app">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-extrabold text-base flex-1">Admin · Vos Resto</h1>
          <button
            onClick={async () => { await signOut(); navigate('/'); }}
            className="text-muted-foreground"
            aria-label="Déconnexion"
          >
            <LogOut size={16} />
          </button>
        </header>

        <nav className="sticky top-14 z-20 bg-background border-b border-border overflow-x-auto hide-scrollbar">
          <div className="flex">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  `flex-shrink-0 flex items-center gap-1.5 px-4 h-11 text-xs font-semibold border-b-2 ${
                    isActive ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
                  }`
                }
              >
                <t.icon size={14} />
                {t.label}
              </NavLink>
            ))}
          </div>
        </nav>

        <main className="px-4 py-4">
          <Outlet />
        </main>
      </div>
    </AdminGuard>
  );
};

export default AdminLayout;

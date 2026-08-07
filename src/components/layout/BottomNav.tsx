import { forwardRef, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Heart, User, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

const baseTabs = [
  { path: '/', icon: Home, label: 'Accueil' },
  { path: '/search', icon: Search, label: 'Recherche' },
  { path: '/favorites', icon: Heart, label: 'Réservations' },
  { path: '/profile', icon: User, label: 'Profil' },
];

const HIDDEN_ROUTES = ['/auth', '/map'];

const BottomNav = memo(
  forwardRef<HTMLElement>((_, ref) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAdmin, isRestaurantOwner } = useAuth();

    // Restaurant owners (non-admin) are isolated: only dashboard + profile.
    // Admins see full nav + admin shortcut.
    const tabs = isAdmin
      ? [...baseTabs.slice(0, 3), { path: '/admin', icon: LayoutDashboard, label: 'Admin' }, baseTabs[3]]
      : isRestaurantOwner
        ? [{ path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }, baseTabs[3]]
        : baseTabs;

    if (HIDDEN_ROUTES.includes(location.pathname)) return null;

    return (
      <nav
        ref={ref}
        className="fixed z-50 glass border-border/50 pb-safe md:pb-0
          inset-x-0 bottom-0 border-t
          md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:bottom-4 md:w-[min(92%,720px)] md:rounded-2xl md:border md:shadow-lg md:px-4"
      >
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto md:max-w-none md:px-2">
          {tabs.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="flex flex-col items-center gap-0.5 px-4 py-2 relative rounded-xl md:px-6 md:py-2.5 md:hover:bg-muted/50 transition-colors"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-px left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <motion.div
                  animate={{ scale: isActive ? 1 : 0.9, y: isActive ? -2 : 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Icon
                    size={22}
                    className={isActive ? 'text-primary md:w-6 md:h-6' : 'text-muted-foreground md:w-6 md:h-6'}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </motion.div>
                <span
                  className={`text-[10px] font-medium md:text-xs ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  })
);

BottomNav.displayName = 'BottomNav';
export default BottomNav;

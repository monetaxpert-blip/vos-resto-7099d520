import { ReactNode, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Global role-based redirect. Restaurant owners (non-admin) are isolated from
 * public client routes — they may only see their dashboard, onboarding, auth,
 * and notifications.
 */
const OWNER_ALLOWED_PREFIXES = [
  '/restaurant/dashboard',
  '/dashboard',
  '/restaurant/onboarding',
  '/auth',
  '/notifications',
  '/profile',
  '/admin',
];

const RoleRouter = ({ children }: { children: ReactNode }) => {
  const { isReady, isRestaurantOwner, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isReady) return;
    if (!isRestaurantOwner || isAdmin) return;
    const path = location.pathname;
    const allowed = OWNER_ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(p + '/') || path.startsWith(p));
    if (!allowed) {
      navigate('/restaurant/dashboard', { replace: true });
    }
  }, [isReady, isRestaurantOwner, isAdmin, location.pathname, navigate]);

  return <>{children}</>;
};

export default RoleRouter;

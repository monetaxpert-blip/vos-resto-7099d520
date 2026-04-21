import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const OwnerGuard = ({ children }: { children: ReactNode }) => {
  const { user, loading, isRestaurantOwner, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth?redirect=/dashboard" replace />;
  if (!isRestaurantOwner && !isAdmin) return <Navigate to="/restaurant/onboarding" replace />;
  return <>{children}</>;
};

export default OwnerGuard;

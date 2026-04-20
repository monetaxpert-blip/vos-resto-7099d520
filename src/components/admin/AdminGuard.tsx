import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const AdminGuard = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth?redirect=/admin" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6 text-center">
        <div>
          <p className="text-lg font-bold mb-2">Accès refusé</p>
          <p className="text-sm text-muted-foreground">
            Vous n'avez pas les droits administrateur.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

export default AdminGuard;

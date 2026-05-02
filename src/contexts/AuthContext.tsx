import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isReady: boolean;
  isAdmin: boolean;
  isRestaurantOwner: boolean;
  intendedRole: 'client' | 'restaurant' | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRestaurantOwner, setIsRestaurantOwner] = useState(false);

  const checkRoles = async (uid: string | undefined) => {
    if (!uid) {
      setIsAdmin(false);
      setIsRestaurantOwner(false);
      return;
    }
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', uid);
    const roles = new Set((data ?? []).map((row) => row.role));
    setIsAdmin(roles.has('admin'));
    setIsRestaurantOwner(roles.has('restaurant_owner'));
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      // defer to avoid deadlock
      setTimeout(() => checkRoles(newSession?.user?.id), 0);
    });

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      checkRoles(existing?.user?.id).finally(() => {
        setLoading(false);
        setIsReady(true);
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const intendedRole = (user?.user_metadata?.intended_role as 'client' | 'restaurant' | undefined) ?? null;

  return (
    <AuthContext.Provider value={{ user, session, loading, isReady, isAdmin, isRestaurantOwner, intendedRole, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

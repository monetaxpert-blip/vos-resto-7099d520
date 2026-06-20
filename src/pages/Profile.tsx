import { motion } from 'framer-motion';
import { User, LogOut, LogIn, Heart, Calendar, Map, ChevronRight, Store, Shield, Bell, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { useReservations } from '@/hooks/useReservations';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';
import InstallButton from '@/components/pwa/InstallButton';
import AvatarUploader from '@/components/profile/AvatarUploader';
import { avatarFor } from '@/lib/avatar';

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut, loading, isAdmin, isRestaurantOwner } = useAuth();
  const { ids: favIds } = useFavorites();
  const { reservations } = useReservations();
  const { unreadCount } = useNotifications();
  const activeRes = reservations.filter((r) => r.status !== 'cancelled').length;
  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'Invité';
  // Avatar rendered via AvatarUploader (handles fallback)
  void avatarFor;

  const handleSignOut = async () => {
    await signOut();
    toast.success('À bientôt !');
    navigate('/');
  };

  return (
    <div className="min-h-screen pb-24 bg-background pt-14 px-5">
      <h1 className="text-2xl font-extrabold mb-6">Profil</h1>

      <div className="flex items-center gap-4 mb-8">
        {user ? (
          <AvatarUploader size={72} />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User size={28} className="text-primary" />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-bold text-lg truncate">{displayName}</p>
          <p className="text-sm text-muted-foreground truncate">
            {user ? user.email : 'Connectez-vous pour synchroniser vos réservations et favoris'}
          </p>
        </div>
      </div>

      {user && (
        <button
          onClick={() => navigate('/notifications')}
          className="w-full mb-4 rounded-2xl bg-card shadow-card p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 relative">
            <Bell size={18} className="text-primary" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-sm">Notifications</p>
            <p className="text-xs text-muted-foreground">{unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Tout est à jour'}</p>
          </div>
          <ChevronRight size={18} className="text-muted-foreground" />
        </button>
      )}

      {user && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => navigate('/favorites')}
            className="rounded-2xl bg-card shadow-card p-4 text-left"
          >
            <Calendar size={18} className="text-primary mb-2" />
            <p className="text-2xl font-extrabold leading-none">{activeRes}</p>
            <p className="text-xs text-muted-foreground mt-1">Réservation{activeRes > 1 ? 's' : ''}</p>
          </button>
          <button
            onClick={() => navigate('/favorites?tab=favorites')}
            className="rounded-2xl bg-card shadow-card p-4 text-left"
          >
            <Heart size={18} className="text-primary mb-2" />
            <p className="text-2xl font-extrabold leading-none">{favIds.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Favori{favIds.length > 1 ? 's' : ''}</p>
          </button>
        </div>
      )}

      {/* Restaurateur CTA */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate(user ? '/dashboard' : '/auth?redirect=/restaurant/onboarding')}
        className="w-full mb-4 rounded-2xl p-4 text-left bg-gradient-to-r from-primary to-orange-600 text-primary-foreground shadow-card flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Store size={20} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm">Vous êtes restaurateur ?</p>
          <p className="text-xs opacity-90">Inscrivez votre établissement — 30 jours gratuits</p>
        </div>
        <ChevronRight size={18} />
      </motion.button>

      {(isRestaurantOwner || isAdmin) && (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
          className="w-full mb-4 rounded-2xl border border-border bg-card p-4 text-left shadow-card flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Shield size={20} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">{isAdmin ? 'Espace administrateur' : 'Dashboard restaurant'}</p>
            <p className="text-xs text-muted-foreground">Accéder à vos outils de gestion</p>
          </div>
          <ChevronRight size={18} />
        </motion.button>
      )}

      {/* PWA install card */}
      <div className="mb-6">
        <InstallButton />
      </div>

      <div className="rounded-2xl bg-card shadow-card overflow-hidden">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/map')}
          className="w-full flex items-center gap-3 p-4 border-b border-border/50 hover:bg-secondary/50 transition-colors"
        >
          <Map size={20} className="text-muted-foreground" />
          <span className="flex-1 text-left text-sm font-medium">Voir la carte</span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </motion.button>

        {user ? (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSignOut}
            disabled={loading}
            className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors"
          >
            <LogOut size={20} className="text-muted-foreground" />
            <span className="flex-1 text-left text-sm font-medium">Déconnexion</span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/auth')}
            className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors"
          >
            <LogIn size={20} className="text-primary" />
            <span className="flex-1 text-left text-sm font-medium text-primary">
              Se connecter / S'inscrire
            </span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </motion.button>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-8">
        Vos Resto v1.1 · Sénégal
      </p>
    </div>
  );
};

export default Profile;

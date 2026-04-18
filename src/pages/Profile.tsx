import { motion } from 'framer-motion';
import { User, LogOut, LogIn, Heart, Calendar, Map, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { useReservations } from '@/hooks/useReservations';
import { toast } from 'sonner';

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const { ids: favIds } = useFavorites();
  const { reservations } = useReservations();

  const activeRes = reservations.filter((r) => r.status !== 'cancelled').length;
  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'Invité';

  const handleSignOut = async () => {
    await signOut();
    toast.success('À bientôt !');
    navigate('/');
  };

  return (
    <div className="min-h-screen pb-24 bg-background pt-14 px-5">
      <h1 className="text-2xl font-extrabold mb-6">Profil</h1>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <User size={28} className="text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-lg truncate">{displayName}</p>
          <p className="text-sm text-muted-foreground truncate">
            {user ? user.email : 'Connectez-vous pour synchroniser vos réservations et favoris'}
          </p>
        </div>
      </div>

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
        Vos Resto v1.1 · Dakar, Sénégal
      </p>
    </div>
  );
};

export default Profile;

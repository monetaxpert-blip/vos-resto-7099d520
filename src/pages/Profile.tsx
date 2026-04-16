import { motion } from 'framer-motion';
import { User, Settings, LogOut, ChevronRight } from 'lucide-react';

const Profile = () => (
  <div className="min-h-screen pb-24 bg-background pt-14 px-5">
    <h1 className="text-2xl font-extrabold mb-6">Profil</h1>

    <div className="flex items-center gap-4 mb-8">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <User size={28} className="text-primary" />
      </div>
      <div>
        <p className="font-bold text-lg">Utilisateur</p>
        <p className="text-sm text-muted-foreground">Connectez-vous pour personnaliser</p>
      </div>
    </div>

    <div className="rounded-2xl bg-card shadow-card overflow-hidden">
      {[
        { icon: Settings, label: 'Paramètres' },
        { icon: LogOut, label: 'Connexion' },
      ].map(({ icon: Icon, label }) => (
        <motion.button
          key={label}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 p-4 border-b border-border/50 last:border-0 hover:bg-secondary/50 transition-colors"
        >
          <Icon size={20} className="text-muted-foreground" />
          <span className="flex-1 text-left text-sm font-medium">{label}</span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </motion.button>
      ))}
    </div>

    <p className="text-center text-xs text-muted-foreground mt-8">Vos Resto v1.0 · Dakar, Sénégal</p>
  </div>
);

export default Profile;

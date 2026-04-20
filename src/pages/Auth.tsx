import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Mail, Lock, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Auth = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'unspecified'>('unspecified');
  const [loading, setLoading] = useState(false);

  const redirect = new URLSearchParams(window.location.search).get('redirect');
  useEffect(() => {
    if (!user) return;
    if (redirect) navigate(redirect, { replace: true });
    else if (isAdmin) navigate('/admin', { replace: true });
    else navigate('/profile', { replace: true });
  }, [user, isAdmin, navigate, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { avatarFor } = await import('@/lib/avatar');
        const seed = displayName || email.split('@')[0];
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              display_name: seed,
              first_name: displayName,
              phone,
              gender,
              avatar_url: avatarFor(seed, gender),
            },
          },
        });
        if (error) throw error;
        toast.success('Compte créé ! Vous êtes connecté.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Bienvenue !');
      }
      // useEffect handles redirect (admin -> /admin, otherwise /profile)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      if (msg.toLowerCase().includes('invalid login')) {
        toast.error('Email ou mot de passe incorrect');
      } else if (msg.toLowerCase().includes('already registered')) {
        toast.error('Cet email est déjà utilisé. Connectez-vous.');
        setMode('signin');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <button
        onClick={() => navigate('/')}
        className="absolute top-12 left-4 z-10 w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
        aria-label="Retour"
      >
        <ArrowLeft size={20} />
      </button>

      <div className="flex-1 flex flex-col justify-center px-6 pt-24 pb-12 max-w-md w-full mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <h1 className="text-3xl font-extrabold tracking-tight">
            {mode === 'signin' ? 'Bon retour 👋' : 'Bienvenue 🎉'}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {mode === 'signin'
              ? 'Connectez-vous pour voir vos réservations et favoris'
              : 'Créez un compte pour réserver et sauvegarder vos restos'}
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-3">
          {mode === 'signup' && (
            <>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Votre prénom"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full h-12 rounded-2xl bg-secondary px-4 text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="Téléphone (optionnel)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-12 rounded-2xl bg-secondary px-4 text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['male','female','unspecified'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`h-11 rounded-2xl text-xs font-semibold transition-colors ${
                      gender === g ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                    }`}
                  >
                    {g === 'male' ? 'Homme' : g === 'female' ? 'Femme' : 'Non précisé'}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 rounded-2xl bg-secondary pl-11 pr-4 text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              placeholder="Mot de passe (6+ caractères)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 rounded-2xl bg-secondary pl-11 pr-4 text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : mode === 'signin' ? (
              'Se connecter'
            ) : (
              'Créer mon compte'
            )}
          </motion.button>
        </form>

        <button
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="mt-6 text-sm text-muted-foreground text-center"
        >
          {mode === 'signin' ? (
            <>Pas encore de compte ? <span className="text-primary font-semibold">Inscription</span></>
          ) : (
            <>Déjà un compte ? <span className="text-primary font-semibold">Connexion</span></>
          )}
        </button>

        <p className="text-[10px] text-muted-foreground text-center mt-8">
          En continuant, vous acceptez nos conditions d'utilisation
        </p>
      </div>
    </div>
  );
};

export default Auth;

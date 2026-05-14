import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Mail, Lock, ArrowLeft, Store, User as UserIcon, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const MIN_RETRY_MS = 2000;

type Role = 'client' | 'restaurant';
type Step = 'role' | 'form';

const Auth = () => {
  const navigate = useNavigate();
  const { user, isReady, isAdmin, isRestaurantOwner, intendedRole } = useAuth();
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<Role>('client');
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'unspecified'>('unspecified');
  const [loading, setLoading] = useState(false);

  const redirect = new URLSearchParams(window.location.search).get('redirect');

  useEffect(() => {
    if (!isReady || !user) return;
    if (redirect) {
      navigate(redirect, { replace: true });
      return;
    }
    if (isAdmin) {
      navigate('/admin', { replace: true });
      return;
    }
    // Existing owner → straight to dashboard. Only fresh signups with intended_role='restaurant'
    // and no ownership row yet should land on onboarding.
    if (isRestaurantOwner) {
      navigate('/dashboard', { replace: true });
      return;
    }
    if (intendedRole === 'restaurant') {
      navigate('/restaurant/onboarding', { replace: true });
      return;
    }
    navigate('/', { replace: true });
  }, [user, isReady, isAdmin, isRestaurantOwner, intendedRole, navigate, redirect]);

  const lastSubmitRef = useRef<number>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const now = Date.now();
    if (now - lastSubmitRef.current < MIN_RETRY_MS) {
      toast.info('Patientez un instant avant de réessayer');
      return;
    }
    lastSubmitRef.current = now;
    setLoading(true);
    try {
      const cleanEmail = email.trim();
      if (mode === 'signup') {
        const { avatarFor } = await import('@/lib/avatar');
        const seed = displayName || cleanEmail.split('@')[0];
        const { error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              display_name: seed,
              first_name: displayName,
              phone,
              gender,
              avatar_url: avatarFor(seed, gender),
              intended_role: role,
            },
          },
        });
        if (signUpError) throw signUpError;

        // Auto sign-in immediately (auto-confirm is enabled)
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (signInError) {
          toast.success('Compte créé. Connecte-toi maintenant.');
          setMode('signin');
        } else {
          await supabase.auth.getSession();
          toast.success(role === 'restaurant' ? 'Bienvenue ! Configurons votre restaurant.' : 'Bienvenue 🎉');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
        await supabase.auth.getSession();
        toast.success('Bienvenue !');
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Erreur inconnue';
      const msg = raw.toLowerCase();
      if (msg.includes('rate limit') || msg.includes('only request this after') || msg.includes('too many')) {
        const secs = raw.match(/(\d+)\s*seconds?/i)?.[1];
        toast.error(secs
          ? `Trop de tentatives. Réessayez dans ${secs}s.`
          : 'Trop de tentatives, réessayez dans quelques secondes');
      } else if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
        toast.error('Email ou mot de passe incorrect');
      } else if (msg.includes('already registered') || msg.includes('user already')) {
        toast.error('Cet email est déjà utilisé. Connexion…');
        setMode('signin');
      } else if (msg.includes('password') && msg.includes('6')) {
        toast.error('Le mot de passe doit faire au moins 6 caractères');
      } else {
        toast.error('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <button
        onClick={() => (step === 'form' ? setStep('role') : navigate('/'))}
        className="absolute top-12 left-4 z-10 w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
        aria-label="Retour"
      >
        <ArrowLeft size={20} />
      </button>

      <AnimatePresence mode="wait">
        {step === 'role' ? (
          <motion.div
            key="role"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col justify-center px-6 pt-24 pb-12 max-w-md w-full mx-auto"
          >
            <div className="mb-10 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-orange-500 mx-auto mb-4 flex items-center justify-center shadow-xl"
              >
                <Sparkles className="text-white" size={28} />
              </motion.div>
              <h1 className="text-3xl font-extrabold tracking-tight">Bienvenue sur Vos Resto</h1>
              <p className="text-sm text-muted-foreground mt-2">Comment souhaitez-vous utiliser l'application ?</p>
            </div>

            <div className="space-y-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ y: -2 }}
                onClick={() => {
                  setRole('client');
                  setStep('form');
                }}
                className="w-full rounded-2xl border-2 border-border bg-card p-5 text-left flex items-center gap-4 hover:border-primary transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <UserIcon className="text-primary" size={26} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base">Je suis un client 👤</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Découvrir et réserver des restaurants</p>
                </div>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ y: -2 }}
                onClick={() => {
                  setRole('restaurant');
                  setMode('signup');
                  setStep('form');
                }}
                className="w-full rounded-2xl border-2 border-border bg-card p-5 text-left flex items-center gap-4 hover:border-primary transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shrink-0">
                  <Store className="text-white" size={26} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base">Je suis un restaurant 🏪</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Gérer mon établissement · 30j gratuits</p>
                </div>
              </motion.button>
            </div>

            <button
              onClick={() => {
                setRole('client');
                setMode('signin');
                setStep('form');
              }}
              className="mt-8 text-sm text-muted-foreground text-center"
            >
              Déjà un compte ? <span className="text-primary font-semibold">Se connecter</span>
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col justify-center px-6 pt-24 pb-12 max-w-md w-full mx-auto"
          >
            <div className="flex items-center gap-3 mb-1">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${role === 'restaurant' ? 'bg-gradient-to-br from-primary to-orange-500' : 'bg-primary/10'}`}>
                {role === 'restaurant' ? <Store className="text-white" size={20} /> : <UserIcon className="text-primary" size={20} />}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {role === 'restaurant' ? 'Restaurant' : 'Client'}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {mode === 'signin' ? 'Bon retour 👋' : role === 'restaurant' ? 'Inscrivez votre resto 🚀' : 'Créons votre compte 🎉'}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {mode === 'signin'
                ? 'Connectez-vous pour accéder à votre espace'
                : role === 'restaurant'
                ? 'Étape 1/2 — Créez votre compte. Ensuite, vous configurerez votre fiche.'
                : 'Réservez et sauvegardez vos restos préférés'}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              {mode === 'signup' && (
                <>
                  <input
                    type="text"
                    placeholder={role === 'restaurant' ? 'Votre nom (gérant)' : 'Votre prénom'}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full h-12 rounded-2xl bg-secondary px-4 text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <input
                    type="tel"
                    placeholder={role === 'restaurant' ? 'Téléphone du restaurant' : 'Téléphone (optionnel)'}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-12 rounded-2xl bg-secondary px-4 text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {role === 'client' && (
                    <div className="grid grid-cols-3 gap-2">
                      {(['male', 'female', 'unspecified'] as const).map((g) => (
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
                  )}
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
                ) : role === 'restaurant' ? (
                  'Créer mon compte resto'
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Auth;

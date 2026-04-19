import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share, Check } from 'lucide-react';
import { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface InstallButtonProps {
  variant?: 'card' | 'inline';
}

const InstallButton = ({ variant = 'card' }: InstallButtonProps) => {
  const { canInstall, installed, platform, promptInstall, hasNativePrompt } = usePWAInstall();
  const [showIosHint, setShowIosHint] = useState(false);

  if (installed) {
    if (variant === 'inline') return null;
    return (
      <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <Check size={18} />
        </div>
        <div>
          <p className="font-semibold text-sm">Application installée</p>
          <p className="text-xs text-muted-foreground">Vos Resto est sur ton appareil 🎉</p>
        </div>
      </div>
    );
  }

  if (!canInstall) return null;

  const handleClick = async () => {
    if (hasNativePrompt) {
      await promptInstall();
    } else if (platform === 'ios-safari') {
      setShowIosHint(true);
    }
  };

  if (variant === 'inline') {
    return (
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold"
      >
        <Download size={12} /> Installer
      </button>
    );
  }

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleClick}
        className="w-full rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-4 flex items-center gap-3 shadow-lg"
      >
        <div className="w-12 h-12 rounded-xl bg-primary-foreground/15 flex items-center justify-center">
          <Download size={22} />
        </div>
        <div className="text-left flex-1">
          <p className="font-bold text-sm">Installer Vos Resto</p>
          <p className="text-xs opacity-90">Accès rapide depuis ton écran d'accueil</p>
        </div>
        <span className="text-xs font-semibold opacity-90">→</span>
      </motion.button>

      <AnimatePresence>
        {showIosHint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowIosHint(false)}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-3xl p-6 max-w-sm w-full"
            >
              <h3 className="font-bold text-lg mb-2">Installer sur iPhone</h3>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                    1
                  </span>
                  <span>
                    Appuie sur l'icône <Share size={14} className="inline mx-1" /> Partager dans Safari
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                    2
                  </span>
                  <span>Choisis « Sur l'écran d'accueil »</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                    3
                  </span>
                  <span>Appuie sur « Ajouter » en haut à droite</span>
                </li>
              </ol>
              <button
                onClick={() => setShowIosHint(false)}
                className="w-full mt-5 rounded-xl bg-primary text-primary-foreground py-3 font-semibold text-sm"
              >
                Compris
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default InstallButton;

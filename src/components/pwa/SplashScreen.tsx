import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * One-time splash shown on standalone PWA launch.
 * Skipped on the Lovable preview iframe so the editor never gets stuck.
 */
const SplashScreen = () => {
  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error - iOS-only
      window.navigator.standalone === true;
    const isPreview =
      window.self !== window.top ||
      window.location.hostname.includes('lovableproject.com') ||
      window.location.hostname.includes('lovable.app') &&
        window.location.hostname.includes('id-preview');
    return isStandalone && !isPreview;
  });

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), 1100);
    return () => clearTimeout(t);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-primary"
        >
          <motion.img
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            src="/icons/icon-192.png"
            alt="Vos Resto"
            className="w-24 h-24 rounded-3xl shadow-2xl"
            width={96}
            height={96}
          />
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-5 text-primary-foreground text-xl font-extrabold tracking-tight"
          >
            Vos Resto
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;

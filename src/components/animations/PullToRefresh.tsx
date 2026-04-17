import { ReactNode, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  threshold?: number;
}

/**
 * Native-feeling pull-to-refresh wrapper.
 * Activates only when the page is scrolled to the very top.
 */
const PullToRefresh = ({ onRefresh, children, threshold = 70 }: PullToRefreshProps) => {
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, threshold], [0, 1]);
  const rotate = useTransform(y, [0, threshold * 1.5], [0, 360]);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY > 0 || refreshing) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pulling.current || startY.current === null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 && window.scrollY === 0) {
      y.set(Math.min(delta * 0.5, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (!pulling.current) return;
    pulling.current = false;
    startY.current = null;
    if (y.get() >= threshold && !refreshing) {
      setRefreshing(true);
      animate(y, threshold, { type: 'spring', stiffness: 300, damping: 30 });
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        animate(y, 0, { type: 'spring', stiffness: 300, damping: 30 });
      }
    } else {
      animate(y, 0, { type: 'spring', stiffness: 300, damping: 30 });
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <motion.div
        style={{ y, opacity }}
        className="absolute top-2 left-1/2 -translate-x-1/2 z-50 w-9 h-9 rounded-full glass flex items-center justify-center shadow-lg"
      >
        <motion.div style={{ rotate: refreshing ? undefined : rotate }}>
          {refreshing ? (
            <Loader2 size={16} className="text-primary animate-spin" />
          ) : (
            <Loader2 size={16} className="text-primary" />
          )}
        </motion.div>
      </motion.div>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
};

export default PullToRefresh;

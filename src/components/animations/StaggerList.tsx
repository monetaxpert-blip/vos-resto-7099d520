import { memo } from 'react';
import { motion } from 'framer-motion';

interface StaggerListProps {
  children: React.ReactNode[];
  className?: string;
  staggerDelay?: number;
}

const StaggerList = memo(({ children, className = '', staggerDelay = 0.06 }: StaggerListProps) => (
  <motion.div
    className={className}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-50px" }}
    variants={{
      hidden: {},
      visible: { transition: { staggerChildren: staggerDelay } },
    }}
  >
    {children.map((child, i) => (
      <motion.div
        key={i}
        variants={{
          hidden: { opacity: 0, y: 24 },
          visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
        }}
      >
        {child}
      </motion.div>
    ))}
  </motion.div>
));

StaggerList.displayName = 'StaggerList';
export default StaggerList;

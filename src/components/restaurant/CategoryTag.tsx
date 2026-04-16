import { memo } from 'react';

interface CategoryTagProps {
  category: string;
  onClick?: () => void;
  active?: boolean;
}

const CategoryTag = memo(({ category, onClick, active }: CategoryTagProps) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200
      ${active
        ? 'bg-primary text-primary-foreground shadow-card'
        : 'bg-secondary text-secondary-foreground hover:bg-primary/10'
      }`}
  >
    {category}
  </button>
));

CategoryTag.displayName = 'CategoryTag';
export default CategoryTag;

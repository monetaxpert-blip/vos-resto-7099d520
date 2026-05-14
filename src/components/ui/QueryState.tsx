import { ReactNode } from 'react';
import { Loader2, AlertTriangle, Inbox } from 'lucide-react';

interface QueryStateProps {
  loading?: boolean;
  error?: string | null | Error;
  isEmpty?: boolean;
  onRetry?: () => void;
  loadingFallback?: ReactNode;
  emptyTitle?: string;
  emptyMessage?: string;
  errorTitle?: string;
  children: ReactNode;
}

/**
 * Standardized loading / error / empty wrapper.
 * Use around any data-driven section to guarantee consistent UX.
 */
const QueryState = ({
  loading,
  error,
  isEmpty,
  onRetry,
  loadingFallback,
  emptyTitle = 'Aucun résultat',
  emptyMessage = "Il n'y a rien à afficher pour le moment.",
  errorTitle = 'Une erreur est survenue',
  children,
}: QueryStateProps) => {
  if (loading) {
    return (
      <>
        {loadingFallback ?? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        )}
      </>
    );
  }

  if (error) {
    const msg = error instanceof Error ? error.message : error;
    return (
      <div className="flex flex-col items-center justify-center text-center py-10 px-6">
        <AlertTriangle className="text-destructive mb-3" size={28} />
        <p className="text-sm font-semibold mb-1">{errorTitle}</p>
        <p className="text-xs text-muted-foreground mb-4 max-w-xs">{msg}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold"
          >
            Réessayer
          </button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10 px-6">
        <Inbox className="text-muted-foreground mb-3" size={28} />
        <p className="text-sm font-semibold mb-1">{emptyTitle}</p>
        <p className="text-xs text-muted-foreground max-w-xs">{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default QueryState;

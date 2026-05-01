import { ArrowLeft, BellOff, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, unreadCount, isLoading, markRead, markAllRead } = useNotifications();

  if (!user) {
    navigate('/auth?redirect=/notifications');
    return null;
  }

  return (
    <div className="min-h-screen pb-24 bg-background pt-14 px-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft size={16} /> Retour
        </button>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            className="text-xs text-primary font-semibold inline-flex items-center gap-1"
          >
            <CheckCheck size={14} /> Tout marquer lu
          </button>
        )}
      </div>
      <h1 className="text-2xl font-extrabold mb-6">Notifications</h1>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <BellOff size={32} className="text-primary" />
          </div>
          <p className="font-semibold">Tout est calme</p>
          <p className="text-sm text-muted-foreground mt-1">Vos notifications apparaîtront ici.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.is_read && markRead.mutate(n.id)}
              className={`w-full text-left rounded-2xl p-4 border transition-colors ${
                n.is_read ? 'border-border bg-card' : 'border-primary/30 bg-primary/5'
              }`}
            >
              <div className="flex items-start gap-3">
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{n.title}</p>
                  {n.message && <p className="text-xs text-muted-foreground mt-1">{n.message}</p>}
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;

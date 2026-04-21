import { useMemo, useState } from 'react';
import { Star, ThumbsUp } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurantReviews } from '@/hooks/useRestaurantReviews';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().trim().min(4, 'Ajoute un commentaire').max(500, '500 caractères max'),
});

const RestaurantReviews = ({ restaurantId }: { restaurantId: string }) => {
  const { user } = useAuth();
  const { reviews, isLoading, create, markHelpful } = useRestaurantReviews(restaurantId);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const average = useMemo(() => {
    if (reviews.length === 0) return null;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }, [reviews]);

  const submit = () => {
    if (!user) {
      toast.error('Connectez-vous pour laisser un avis');
      return;
    }
    const parsed = reviewSchema.safeParse({ rating, comment });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Avis invalide');
      return;
    }
    create.mutate(
      { restaurant_id: restaurantId, user_id: user.id, rating, comment },
      {
        onSuccess: () => {
          toast.success('Avis publié');
          setComment('');
          setRating(5);
        },
      }
    );
  };

  return (
    <section className="mt-8 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Avis clients</h2>
          <p className="text-xs text-muted-foreground">
            {average ? `${average.toFixed(1)} / 5 · ${reviews.length} avis` : 'Pas encore d’avis'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button key={value} type="button" onClick={() => setRating(value)} className="text-primary">
              <Star size={18} className={value <= rating ? 'fill-current' : ''} />
            </button>
          ))}
        </div>
        <Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Partagez votre expérience" />
        <Button onClick={submit} disabled={create.isPending}>{create.isPending ? 'Publication...' : 'Publier un avis'}</Button>
      </div>

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Chargement...</p>}
        {!isLoading && reviews.length === 0 && <p className="text-sm text-muted-foreground">Soyez le premier à laisser un avis.</p>}
        {reviews.map((review) => (
          <div key={review.id} className="rounded-2xl bg-card border border-border p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-sm">{review.profile?.display_name || 'Client Vos Resto'}</p>
                <div className="flex gap-1 mt-1 text-primary">
                  {Array.from({ length: review.rating }).map((_, index) => (
                    <Star key={index} size={12} className="fill-current" />
                  ))}
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground">{new Date(review.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
            {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
            {user && user.id !== review.user_id && (
              <button
                type="button"
                onClick={() => markHelpful.mutate({ review_id: review.id, user_id: user.id })}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
              >
                <ThumbsUp size={12} /> Utile ({review.helpful_count})
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default RestaurantReviews;

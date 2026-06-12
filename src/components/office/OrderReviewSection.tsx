'use client';

import { useCallback, useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { apiFetch, parseJsonResponse } from '@/lib/api/client';
import { apiErrorMessage } from '@/lib/api-errors';
import { formatDateTimeFr } from '@/lib/calendar-utils';

export type OrderReview = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
  client?: { firstName?: string; lastName?: string };
  technician?: { firstName?: string; lastName?: string } | null;
};

type OrderReviewSectionProps = {
  orderId: string;
  token: string;
  orderStatus: string;
  canSubmit: boolean;
  readOnly?: boolean;
};

function StarRating({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange?: (rating: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled || !onChange}
          onClick={() => onChange?.(star)}
          className={`rounded p-0.5 transition-colors ${
            disabled || !onChange ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          }`}
          aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
        >
          <Star
            className={`h-7 w-7 ${
              star <= value
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function OrderReviewSection({
  orderId,
  token,
  orderStatus,
  canSubmit,
  readOnly = false,
}: OrderReviewSectionProps) {
  const [review, setReview] = useState<OrderReview | null | undefined>(undefined);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadReview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(
        `/orders/${encodeURIComponent(orderId)}/review`,
        { method: 'GET', token },
      );
      if (!res.ok) {
        const data = await parseJsonResponse<unknown>(res);
        setError(apiErrorMessage(data, 'Impossible de charger l’avis'));
        setReview(null);
        return;
      }
      const data = await parseJsonResponse<OrderReview>(res);
      setReview(data);
      if (data) {
        setRating(data.rating);
        setComment(data.comment ?? '');
      }
    } catch {
      setError('Erreur réseau.');
      setReview(null);
    } finally {
      setLoading(false);
    }
  }, [orderId, token]);

  useEffect(() => {
    void loadReview();
  }, [loadReview]);

  async function submitReview() {
    if (rating < 1 || rating > 5) {
      setError('Choisissez une note entre 1 et 5 étoiles.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await apiFetch(
        `/orders/${encodeURIComponent(orderId)}/review`,
        {
          method: 'PUT',
          token,
          json: {
            rating,
            ...(comment.trim() ? { comment: comment.trim() } : {}),
          },
        },
      );
      if (!res.ok) {
        const data = await parseJsonResponse<unknown>(res);
        setError(apiErrorMessage(data, 'Impossible d’enregistrer l’avis'));
        return;
      }
      const data = await parseJsonResponse<OrderReview>(res);
      if (!data) {
        setError('Réponse invalide du serveur.');
        return;
      }
      setReview(data);
      setSuccess(review ? 'Avis mis à jour.' : 'Merci pour votre avis !');
    } catch {
      setError('Erreur réseau.');
    } finally {
      setSubmitting(false);
    }
  }

  const showForm =
    canSubmit && orderStatus === 'resultat_rendu' && !readOnly;

  if (
    !showForm &&
    !readOnly &&
    orderStatus !== 'resultat_rendu' &&
    !review
  ) {
    return null;
  }

  if (loading) {
    return (
      <Card className="mb-4 border-slate-200 shadow-sm">
        <CardContent className="py-4 text-sm text-slate-500">
          Chargement de l’avis…
        </CardContent>
      </Card>
    );
  }

  if (!showForm && !review) {
    return null;
  }

  return (
    <Card className="mb-4 border-teal-200 shadow-sm">
      <CardHeader className="bg-teal-50/50 py-3">
        <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          Avis client
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {success}
          </p>
        ) : null}

        {review && (readOnly || !showForm) ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <StarRating value={review.rating} disabled />
            {review.comment ? (
              <p className="mt-3 text-sm text-slate-700">{review.comment}</p>
            ) : (
              <p className="mt-3 text-sm italic text-slate-500">Sans commentaire.</p>
            )}
            <p className="mt-2 text-xs text-slate-500">
              Déposé le {formatDateTimeFr(review.createdAt)}
              {review.technician
                ? ` — prestation par ${review.technician.firstName ?? ''} ${review.technician.lastName ?? ''}`.trim()
                : ''}
            </p>
          </div>
        ) : null}

        {showForm ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Comment s’est passée votre prestation ? Votre avis nous aide à améliorer le service.
            </p>
            <div>
              <p className="mb-2 text-xs font-medium text-slate-600">Note</p>
              <StarRating value={rating} onChange={setRating} disabled={submitting} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Commentaire (optionnel)
              </label>
              <textarea
                className="min-h-[80px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Partagez votre expérience…"
                disabled={submitting}
                maxLength={2000}
              />
            </div>
            <Button
              type="button"
              onClick={() => void submitReview()}
              disabled={submitting || rating < 1}
            >
              {submitting
                ? 'Enregistrement…'
                : review
                  ? 'Mettre à jour mon avis'
                  : 'Envoyer mon avis'}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

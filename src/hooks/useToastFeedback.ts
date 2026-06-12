'use client';

import { useEffect } from 'react';
import { notify } from '@/lib/notify';

/** Affiche des toasts pop-up lorsque les messages d’erreur ou de succès changent. */
export function useToastFeedback(
  error: string | null | undefined,
  success?: string | null | undefined,
  info?: string | null | undefined,
) {
  useEffect(() => {
    if (error) {
      notify.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      notify.success(success);
    }
  }, [success]);

  useEffect(() => {
    if (info) {
      notify.info(info);
    }
  }, [info]);
}

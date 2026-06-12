'use client';

import { useEffect, useState } from 'react';
import { buttonClassName } from '@/components/ui/Button';
import { apiFetch } from '@/lib/api/client';

function attachmentKind(mimeType: string, fileName: string): 'pdf' | 'image' | 'other' {
  if (mimeType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf')) {
    return 'pdf';
  }
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  return 'other';
}

type BilanAttachmentPreviewCardProps = {
  orderId: string;
  attachmentId: string;
  fileName: string;
  mimeType: string;
  token: string | null;
  downloading?: boolean;
  onDownload: () => void;
};

export function BilanAttachmentPreviewCard({
  orderId,
  attachmentId,
  fileName,
  mimeType,
  token,
  downloading = false,
  onDownload,
}: BilanAttachmentPreviewCardProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const kind = attachmentKind(mimeType, fileName);

  useEffect(() => {
    if (!token || kind === 'other') {
      queueMicrotask(() => setLoadingPreview(false));
      return;
    }

    let cancelled = false;

    async function loadPreview() {
      try {
        const path =
          attachmentId === 'legacy'
            ? `/orders/${encodeURIComponent(orderId)}/bilan-fichier`
            : `/orders/${encodeURIComponent(orderId)}/bilan-fichier/${encodeURIComponent(attachmentId)}`;
        const res = await apiFetch(path, { method: 'GET', token });
        if (!res.ok) {
          if (!cancelled) setPreviewError(true);
          return;
        }
        const blob = await res.blob();
        if (cancelled) return;
        setPreviewUrl(URL.createObjectURL(blob));
      } catch {
        if (!cancelled) setPreviewError(true);
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [orderId, attachmentId, token, kind]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="flex w-full min-w-[9.5rem] max-w-[13rem] flex-1 flex-col overflow-hidden rounded-xl border border-teal-200 bg-white shadow-sm sm:max-w-[11rem]">
      <div className="relative flex h-28 items-center justify-center border-b border-teal-100 bg-slate-50/80">
        {loadingPreview ? (
          <div className="flex flex-col items-center gap-1.5 text-slate-400">
            <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="text-[10px]">Chargement…</span>
          </div>
        ) : previewUrl && kind === 'image' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={`Aperçu ${fileName}`}
            className="h-full w-full object-contain p-1.5"
          />
        ) : previewUrl && kind === 'pdf' ? (
          <iframe
            title={`Aperçu ${fileName}`}
            src={`${previewUrl}#toolbar=0&navpanes=0`}
            className="h-full w-full bg-white"
          />
        ) : (
          <div
            className={[
              'flex h-12 w-12 items-center justify-center rounded-xl',
              kind === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-teal-100 text-teal-700',
            ].join(' ')}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        {!loadingPreview && !previewError && previewUrl ? (
          <span
            className={[
              'absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
              kind === 'pdf' ? 'bg-red-100 text-red-700' : 'bg-teal-100 text-teal-700',
            ].join(' ')}
          >
            {kind === 'pdf' ? 'PDF' : 'IMG'}
          </span>
        ) : null}
        {previewError && !loadingPreview ? (
          <span className="absolute bottom-1.5 left-1.5 right-1.5 rounded bg-amber-50 px-1.5 py-0.5 text-center text-[9px] text-amber-800">
            Aperçu indisponible
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <div className="min-w-0">
          <p
            className="line-clamp-2 text-xs font-semibold leading-snug text-slate-900"
            title={fileName}
          >
            {fileName}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500">{mimeType}</p>
        </div>
        <button
          type="button"
          className={`${buttonClassName('primary')} !w-full !px-2 !py-1.5 !text-[11px]`}
          disabled={downloading}
          onClick={onDownload}
        >
          {downloading ? 'Téléchargement…' : 'Télécharger'}
        </button>
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { adminLabelClass } from '@/components/admin/admin-form-styles';

const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;
const DEFAULT_MAX_FILES = 10;
const ACCEPT = '.pdf,.jpg,.jpeg,.png';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function fileKind(file: File): 'pdf' | 'image' | 'other' {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return 'pdf';
  }
  if (file.type.startsWith('image/')) {
    return 'image';
  }
  return 'other';
}

function fileFingerprint(file: File): string {
  return `${file.name}::${file.size}::${file.lastModified}`;
}

type BilanDocumentUploadProps = {
  value: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  onError?: (message: string) => void;
  maxBytes?: number;
  maxFiles?: number;
};

function BilanDocumentPreviewCard({
  file,
  disabled,
  onRemove,
}: {
  file: File;
  disabled?: boolean;
  onRemove: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const kind = fileKind(file);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="flex w-full min-w-[9.5rem] max-w-[13rem] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:max-w-[11rem]">
      <div className="relative flex h-28 items-center justify-center border-b border-slate-100 bg-slate-50/80">
        {previewUrl && kind === 'image' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt=""
            className="h-full w-full object-contain p-1.5"
          />
        ) : previewUrl && kind === 'pdf' ? (
          <iframe
            title={`Aperçu ${file.name}`}
            src={`${previewUrl}#toolbar=0&navpanes=0`}
            className="h-full w-full bg-white"
          />
        ) : null}
        <span
          className={[
            'absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
            kind === 'pdf' ? 'bg-red-100 text-red-700' : 'bg-teal-100 text-teal-700',
          ].join(' ')}
        >
          {kind === 'pdf' ? 'PDF' : 'IMG'}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-xs font-semibold leading-snug text-slate-900" title={file.name}>
            {file.name}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500">{formatFileSize(file.size)}</p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          className="w-full rounded-lg border border-red-100 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
        >
          Retirer
        </button>
      </div>
    </div>
  );
}

export function BilanDocumentUpload({
  value,
  onChange,
  disabled = false,
  onError,
  maxBytes = DEFAULT_MAX_BYTES,
  maxFiles = DEFAULT_MAX_FILES,
}: BilanDocumentUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const validateAndAdd = useCallback(
    (file: File | undefined) => {
      if (!file || disabled) return;

      if (value.length >= maxFiles) {
        onError?.(`Maximum ${maxFiles} documents.`);
        return;
      }
      if (file.size > maxBytes) {
        onError?.('Chaque fichier ne doit pas dépasser 10 Mo');
        return;
      }
      if (fileKind(file) === 'other') {
        onError?.('Format non accepté (PDF, JPG ou PNG uniquement)');
        return;
      }
      const fp = fileFingerprint(file);
      if (value.some((f) => fileFingerprint(f) === fp)) {
        onError?.('Ce fichier est déjà dans la liste.');
        return;
      }
      onChange([...value, file]);
    },
    [disabled, maxBytes, maxFiles, onChange, onError, value],
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    validateAndAdd(e.target.files?.[0]);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    validateAndAdd(e.dataTransfer.files?.[0]);
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  const canAddMore = value.length < maxFiles;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className={adminLabelClass} htmlFor={inputId}>
          Documents bilan (optionnel)
        </label>
        {value.length > 0 && (
          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700">
            {value.length} document{value.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {value.map((file, index) => (
            <BilanDocumentPreviewCard
              key={`${fileFingerprint(file)}-${index}`}
              file={file}
              disabled={disabled}
              onRemove={() => removeAt(index)}
            />
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        className="sr-only"
        accept={ACCEPT}
        disabled={disabled || !canAddMore}
        onChange={handleInputChange}
      />

      {canAddMore ? (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onClick={() => !disabled && inputRef.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setDragOver(false);
            }
          }}
          onDrop={handleDrop}
          className={[
            'group relative cursor-pointer rounded-xl border-2 border-dashed px-4 text-center transition-all',
            value.length > 0 ? 'py-5' : 'py-8',
            disabled
              ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
              : dragOver
                ? 'border-teal-500 bg-teal-50/80 shadow-inner'
                : 'border-slate-200 bg-gradient-to-br from-slate-50 to-white hover:border-teal-400 hover:bg-teal-50/40',
          ].join(' ')}
        >
          <div
            className={[
              'mx-auto flex items-center justify-center rounded-2xl bg-teal-100 text-teal-600 shadow-sm transition group-hover:scale-105',
              value.length > 0 ? 'h-10 w-10' : 'h-14 w-14',
            ].join(' ')}
          >
            <svg className={value.length > 0 ? 'h-5 w-5' : 'h-7 w-7'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-800">
            {value.length > 0 ? 'Ajouter un autre document' : 'Glissez-déposez un document ici'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            ou{' '}
            <span className="font-medium text-teal-600 underline decoration-teal-300 underline-offset-2">
              parcourez vos fichiers
            </span>
            {' '}— un par un
          </p>
          <p className="mt-2 text-[11px] text-slate-400">
            PDF, JPG, PNG — max 10 Mo — jusqu’à {maxFiles} fichiers
          </p>
        </div>
      ) : (
        <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Limite de {maxFiles} documents atteinte. Retirez un fichier pour en ajouter un autre.
        </p>
      )}
    </div>
  );
}

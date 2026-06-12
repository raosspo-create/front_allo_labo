'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/app/providers';
import { Button, buttonClassName } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { apiFetch } from '@/lib/api/client';
import {
  buildPageQuery,
  DEFAULT_PAGE_SIZE,
  parsePaginatedResponse,
  type PaginationMeta,
} from '@/lib/pagination';
import { apiErrorMessage, getNetworkErrorMessage } from '@/lib/api-errors';
import { isFieldAgentRole } from '@/lib/order-permissions';
import { isStaffAdmin } from '@/lib/types/auth';

type FactureRow = {
  id: string;
  codeSuivi?: string | null;
  serviceName?: string | null;
  amount?: string | null;
  paid?: boolean;
  createdAt?: string;
  updatedAt?: string;
  client?: {
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
};

export default function FacturesPage() {
  const { token, user } = useAuth();
  const isAdmin = isStaffAdmin(user?.role);
  const isFieldAgent = isFieldAgentRole(user?.role);
  const [rows, setRows] = useState<FactureRow[] | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [listMeta, setListMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewOrder, setPreviewOrder] = useState<FactureRow | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || isFieldAgent) return;
    setError(null);
    setRows(undefined);
    try {
      const res = await apiFetch(
        `/orders${buildPageQuery({ paid: true, page, limit: DEFAULT_PAGE_SIZE })}`,
        { method: 'GET', token },
      );
      if (!res.ok) {
        setError('Impossible de charger les factures.');
        setRows([]);
        return;
      }
      const data = await parsePaginatedResponse<FactureRow>(res);
      setRows(data.items);
      setListMeta(data.meta);
    } catch (err) {
      setError(getNetworkErrorMessage(err));
      setRows([]);
    }
  }, [token, isFieldAgent, page]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function fetchFactureBlob(orderId: string): Promise<Blob> {
    if (!token) {
      throw new Error('Session expirée.');
    }
    const res = await apiFetch(`/orders/${encodeURIComponent(orderId)}/facture`, {
      method: 'GET',
      token,
      accept: 'application/pdf',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(
        apiErrorMessage(data, 'Impossible de charger la facture.'),
      );
    }
    return res.blob();
  }

  function factureFileName(orderId: string, codeSuivi: string | null | undefined) {
    const slug =
      (codeSuivi ?? orderId.slice(0, 8)).replace(/[^\w.-]+/g, '_') || 'facture';
    return `facture-${slug}.pdf`;
  }

  function triggerBlobDownload(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function downloadFacture(orderId: string, codeSuivi: string | null | undefined) {
    setDownloadingId(orderId);
    setDownloadError(null);
    try {
      const blob = await fetchFactureBlob(orderId);
      triggerBlobDownload(blob, factureFileName(orderId, codeSuivi));
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : getNetworkErrorMessage(err),
      );
    } finally {
      setDownloadingId(null);
    }
  }

  function closePreview() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewOrder(null);
    setPreviewError(null);
    setPreviewLoading(false);
  }

  async function openPreview(order: FactureRow) {
    closePreview();
    setPreviewOrder(order);
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const blob = await fetchFactureBlob(order.id);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      setPreviewError(
        err instanceof Error ? err.message : getNetworkErrorMessage(err),
      );
    } finally {
      setPreviewLoading(false);
    }
  }

  async function downloadFromPreview() {
    if (!previewOrder) return;
    setDownloadingId(previewOrder.id);
    setDownloadError(null);
    try {
      const blob = await fetchFactureBlob(previewOrder.id);
      triggerBlobDownload(
        blob,
        factureFileName(previewOrder.id, previewOrder.codeSuivi),
      );
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : getNetworkErrorMessage(err),
      );
    } finally {
      setDownloadingId(null);
    }
  }

  if (isFieldAgent) {
    return (
      <div className="mx-auto max-w-xl px-4 py-14 lg:px-8">
        <Card className="border-slate-200">
          <CardContent className="py-8 text-center text-sm text-slate-600">
            Cette section n’est pas accessible aux comptes technicien et coursier.
          </CardContent>
        </Card>
        <Link href="/office/commandes" className={`${buttonClassName('secondary')} mt-6 inline-flex`}>
          Retour aux commandes
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-4 lg:px-8 lg:pb-12">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            Factures
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Commandes réglées : visualisez la facture dans l’application ou téléchargez le PDF.
          </p>
        </div>
        <Link href="/office/commandes" className={buttonClassName('secondary')}>
          Retour aux commandes
        </Link>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4">
          <CardTitle className="text-base">Liste des factures</CardTitle>
          <CardDescription>
            Une facture correspond à une commande marquée comme payée. Les droits sont les mêmes que pour la liste des commandes.
          </CardDescription>
        </CardHeader>
        <CardContent className="!px-0 !pb-0 !pt-0">
          {error ? (
            <div className="px-6 py-8 text-center text-sm text-red-700">{error}</div>
          ) : rows === undefined ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">Chargement…</div>
          ) : rows.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-600">
              Aucune facture pour le moment (aucune commande payée).
            </div>
          ) : (
            <>
              {downloadError ? (
                <div className="mx-6 mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                  {downloadError}
                </div>
              ) : null}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-y border-slate-100 bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Référence
                      </th>
                      {isAdmin ? (
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Client
                        </th>
                      ) : null}
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Prestation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Montant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Mise à jour
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {rows.map((o) => (
                      <tr key={o.id} className="transition hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-semibold text-teal-700">
                            {o.codeSuivi ?? `${o.id.slice(0, 8)}…`}
                          </span>
                        </td>
                        {isAdmin ? (
                          <td className="px-6 py-4">
                            {o.client ? (
                              <div>
                                <p className="text-sm font-medium text-slate-900">
                                  {o.client.firstName} {o.client.lastName}
                                </p>
                                <p className="text-xs text-slate-500">{o.client.email}</p>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">—</span>
                            )}
                          </td>
                        ) : null}
                        <td className="max-w-[200px] px-6 py-4">
                          <span className="line-clamp-2 text-sm text-slate-800" title={o.serviceName ?? ''}>
                            {o.serviceName?.trim() || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-slate-900">
                            {o.amount ? `${o.amount} XOF` : '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-600">
                            {o.updatedAt
                              ? new Date(o.updatedAt).toLocaleString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => void openPreview(o)}
                              className={buttonClassName('secondary')}
                            >
                              Voir
                            </button>
                            <Link
                              href={`/office/commandes/${encodeURIComponent(o.id)}`}
                              className={buttonClassName('secondary')}
                            >
                              Commande
                            </Link>
                            <button
                              type="button"
                              disabled={downloadingId === o.id}
                              onClick={() => void downloadFacture(o.id, o.codeSuivi)}
                              className={buttonClassName('primary')}
                            >
                              {downloadingId === o.id ? 'Téléchargement…' : 'Télécharger'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {rows && rows.length > 0 ? (
            <div className="border-t border-slate-100 px-6 py-4">
              <Pagination meta={listMeta} onPageChange={setPage} />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Modal
        isOpen={previewOrder !== null}
        onClose={closePreview}
        title={
          previewOrder
            ? `Facture — ${previewOrder.codeSuivi ?? previewOrder.id.slice(0, 8)}`
            : 'Facture'
        }
        size="xl"
      >
        <div className="-mx-6 -mb-6 flex min-h-[72vh] flex-col">
          {previewLoading ? (
            <div className="flex flex-1 items-center justify-center px-6 py-16 text-sm text-slate-500">
              Chargement de la facture…
            </div>
          ) : previewError ? (
            <div className="mx-6 mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {previewError}
            </div>
          ) : previewUrl ? (
            <iframe
              src={`${previewUrl}#toolbar=1&navpanes=0`}
              className="min-h-[72vh] w-full flex-1 border-0 bg-slate-100"
              title="Aperçu de la facture"
            />
          ) : null}
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3">
            <Button type="button" variant="secondary" onClick={closePreview}>
              Fermer
            </Button>
            <Button
              type="button"
              disabled={!previewOrder || previewLoading || !!previewError}
              onClick={() => void downloadFromPreview()}
            >
              {downloadingId === previewOrder?.id
                ? 'Téléchargement…'
                : 'Télécharger le PDF'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  buildPageQuery,
  DEFAULT_PAGE_SIZE,
  parsePaginatedResponse,
  type PaginationMeta,
  type PaginatedResponse,
} from '@/lib/pagination';

type UsePaginatedListOptions<T> = {
  token: string | null | undefined;
  path: string;
  pageSize?: number;
  extraParams?: Record<string, string | number | boolean | undefined | null>;
  enabled?: boolean;
  onError?: (message: string) => void;
  mapItems?: (items: T[]) => T[];
};

type UsePaginatedListResult<T> = {
  items: T[];
  meta: PaginationMeta;
  page: number;
  setPage: (page: number) => void;
  loading: boolean;
  refresh: () => Promise<void>;
};

const EMPTY_META: PaginationMeta = {
  total: 0,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalPages: 0,
};

export function usePaginatedList<T>({
  token,
  path,
  pageSize = DEFAULT_PAGE_SIZE,
  extraParams = {},
  enabled = true,
  onError,
  mapItems,
}: UsePaginatedListOptions<T>): UsePaginatedListResult<T> {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<T[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    ...EMPTY_META,
    pageSize,
  });
  const [loading, setLoading] = useState(false);

  const extraKey = JSON.stringify(extraParams);

  const refresh = useCallback(async () => {
    if (!token || !enabled) {
      setItems([]);
      setMeta({ ...EMPTY_META, pageSize });
      return;
    }

    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        ...JSON.parse(extraKey) as Record<string, string | number | boolean | undefined | null>,
      };
      const res = await apiFetch(`${path}${buildPageQuery(params)}`, {
        method: 'GET',
        token,
      });
      if (!res.ok) {
        onError?.('Impossible de charger la liste.');
        setItems([]);
        setMeta({ ...EMPTY_META, pageSize, page });
        return;
      }
      const data: PaginatedResponse<T> = await parsePaginatedResponse<T>(res);
      setItems(mapItems ? mapItems(data.items) : data.items);
      setMeta(data.meta);
    } catch {
      onError?.('Erreur réseau.');
      setItems([]);
      setMeta({ ...EMPTY_META, pageSize, page });
    } finally {
      setLoading(false);
    }
  }, [token, enabled, path, page, pageSize, extraKey, mapItems, onError]);

  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, [refresh]);

  return { items, meta, page, setPage, loading, refresh };
}

'use client';

import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NotificationBell() {
  const {
    items,
    unreadCount,
    markRead,
    markAllRead,
    deleteRead,
    deleteAllRead,
  } = useNotifications();
  const hasReadItems = items.some((item) => item.read);
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef(unreadCount);
  const pulseReadyRef = useRef(false);

  useEffect(() => {
    if (!pulseReadyRef.current) {
      pulseReadyRef.current = true;
      prevUnreadRef.current = unreadCount;
      return;
    }
    if (unreadCount > prevUnreadRef.current) {
      setPulse(true);
      const timer = window.setTimeout(() => setPulse(false), 1200);
      prevUnreadRef.current = unreadCount;
      return () => window.clearTimeout(timer);
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 ${pulse ? 'animate-pulse ring-2 ring-teal-400/60' : ''}`}
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            <div className="flex shrink-0 items-center gap-3">
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-900"
                >
                  Tout marquer lu
                </button>
              ) : null}
              {hasReadItems ? (
                <button
                  type="button"
                  onClick={() => void deleteAllRead()}
                  className="text-xs font-semibold text-slate-500 hover:text-red-600"
                >
                  Supprimer les lues
                </button>
              ) : null}
            </div>
          </div>

          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-slate-500">
                Aucune notification
              </li>
            ) : (
              items.map((item) => (
                <li
                  key={item.id}
                  className={`border-b border-slate-50 px-4 py-3 ${item.read ? 'bg-white' : 'bg-teal-50/40'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-0.5 text-xs text-slate-600">{item.body}</p>
                      <p className="mt-1 text-[10px] text-slate-400">{formatWhen(item.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {!item.read ? (
                        <button
                          type="button"
                          onClick={() => void markRead(item.id)}
                          className="text-[10px] font-semibold text-teal-700 hover:underline"
                        >
                          Lu
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void deleteRead(item.id)}
                          className="flex items-center gap-0.5 text-[10px] font-semibold text-slate-400 hover:text-red-600"
                          aria-label="Supprimer cette notification"
                        >
                          <Trash2 className="h-3 w-3" />
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                  {item.orderId ? (
                    <Link
                      href={`/office/commandes/${item.orderId}`}
                      onClick={() => {
                        if (!item.read) {
                          void markRead(item.id);
                        }
                        setOpen(false);
                      }}
                      className="mt-2 inline-block text-xs font-semibold text-teal-700 hover:underline"
                    >
                      Voir la commande
                    </Link>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

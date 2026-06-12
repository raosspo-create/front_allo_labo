'use client';

import { Toaster } from 'sonner';

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      duration={5000}
      expand
      visibleToasts={4}
      toastOptions={{
        classNames: {
          toast: 'font-sans shadow-lg border',
          title: 'font-semibold',
          description: 'text-sm',
        },
      }}
    />
  );
}

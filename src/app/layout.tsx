import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { AuthProvider } from '@/app/providers';
import { ConditionalChrome } from '@/components/layout/ConditionalChrome';
import { AppToaster } from '@/components/ui/AppToaster';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Allo-Labo — Laboratoire & console',
  description: 'Catalogue services, pilotage commandes et profils patients.',
  icons: {
    icon: '/images/allo-labo-logo.webp',
    apple: '/images/allo-labo-logo.webp',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-[100dvh] bg-white font-sans text-slate-900 antialiased"
        suppressHydrationWarning
      >
        <AuthProvider>
          <ConditionalChrome>{children}</ConditionalChrome>
          <AppToaster />
        </AuthProvider>
      </body>
    </html>
  );
}

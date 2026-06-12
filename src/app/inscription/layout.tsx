import { GuestOnlyGate } from '@/components/auth/GuestOnlyGate';

export default function InscriptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GuestOnlyGate>{children}</GuestOnlyGate>;
}

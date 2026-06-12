import { GuestOnlyGate } from '@/components/auth/GuestOnlyGate';

export default function ConnexionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GuestOnlyGate>{children}</GuestOnlyGate>;
}

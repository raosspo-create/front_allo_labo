import { OfficeGate } from '@/components/office/OfficeGate';
import { OfficeShell } from '@/components/app/OfficeShell';

export default function OfficeSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OfficeGate>
      <OfficeShell>{children}</OfficeShell>
    </OfficeGate>
  );
}

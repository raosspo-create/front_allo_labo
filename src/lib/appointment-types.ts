export type AppointmentEvent = {
  id: string;
  status: string;
  scheduledAt: string | null;
  serviceName?: string | null;
  title?: string | null;
  subtitle?: string | null;
  technicianName?: string | null;
  clientAddress?: string | null;
  codeSuivi?: string | null;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
  technician?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  zone?: { id: string; name: string; code?: string | null } | null;
};

export const APPOINTMENT_STATUS_STYLES: Record<
  string,
  { label: string; dot: string; badge: string }
> = {
  prise_en_compte: {
    label: 'Prise en compte — validé',
    dot: 'bg-cyan-500',
    badge: 'bg-cyan-100 text-cyan-800',
  },
  programme: {
    label: 'Programmé',
    dot: 'bg-indigo-500',
    badge: 'bg-indigo-100 text-indigo-800',
  },
  arrivee_patient: {
    label: 'Arrivée chez le patient',
    dot: 'bg-orange-500',
    badge: 'bg-orange-100 text-orange-800',
  },
  remise_centre: {
    label: 'Remise au centre',
    dot: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-800',
  },
  resultat_rendu: {
    label: 'Résultat rendu',
    dot: 'bg-green-500',
    badge: 'bg-green-100 text-green-800',
  },
};

export function appointmentStatusStyle(status: string) {
  return (
    APPOINTMENT_STATUS_STYLES[status] ?? {
      label: status.replace(/_/g, ' '),
      dot: 'bg-slate-400',
      badge: 'bg-slate-100 text-slate-700',
    }
  );
}

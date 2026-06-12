import { APPOINTMENT_STATUS_STYLES } from '@/lib/appointment-types';

const LEGEND_ORDER = [
  'prise_en_compte',
  'programme',
  'arrivee_patient',
  'remise_centre',
  'resultat_rendu',
] as const;

export function AppointmentStatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-100 px-4 py-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Statuts
      </span>
      {LEGEND_ORDER.map((key) => {
        const style = APPOINTMENT_STATUS_STYLES[key];
        return (
          <span key={key} className="inline-flex items-center gap-1.5 text-xs text-slate-600">
            <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} aria-hidden />
            {style.label}
          </span>
        );
      })}
    </div>
  );
}

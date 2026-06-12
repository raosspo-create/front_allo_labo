import { formatYmd } from '@/lib/calendar-utils';

export const SLOT_MINUTES = 30;
export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 18;

export type BookedSlot = {
  orderId: string;
  scheduledAt: string;
};

export function buildTimeSlotOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let hour = DAY_START_HOUR; hour < DAY_END_HOUR; hour += 1) {
    for (const minute of [0, 30]) {
      const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      options.push({ value, label: value });
    }
  }
  return options;
}

export function slotKeyFromDate(d: Date): string {
  const totalMinutes = d.getHours() * 60 + d.getMinutes();
  const snapped = Math.floor(totalMinutes / SLOT_MINUTES) * SLOT_MINUTES;
  return `${formatYmd(d)}-${snapped}`;
}

export function slotKeyFromParts(dateYmd: string, timeHm: string): string {
  const [h, m] = timeHm.split(':').map(Number);
  const totalMinutes = h * 60 + m;
  const snapped = Math.floor(totalMinutes / SLOT_MINUTES) * SLOT_MINUTES;
  return `${dateYmd}-${snapped}`;
}

export function buildTakenSlotKeys(
  bookings: BookedSlot[],
  excludeOrderId?: string,
): Set<string> {
  const taken = new Set<string>();
  for (const b of bookings) {
    if (excludeOrderId && b.orderId === excludeOrderId) continue;
    const d = new Date(b.scheduledAt);
    if (Number.isNaN(d.getTime())) continue;
    taken.add(slotKeyFromDate(d));
  }
  return taken;
}

export function splitDatetimeLocal(value: string): { date: string; time: string } {
  if (!value.includes('T')) return { date: '', time: '' };
  const [date, time] = value.split('T');
  return { date, time: time.slice(0, 5) };
}

export function joinDatetimeLocal(date: string, time: string): string {
  if (!date || !time) return '';
  return `${date}T${time}`;
}

export function todayYmd(): string {
  return formatYmd(new Date());
}

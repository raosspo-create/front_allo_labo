export type VisitDeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';

export function detectDeviceType(): VisitDeviceType {
  if (typeof window === 'undefined') {
    return 'unknown';
  }
  const width = window.innerWidth;
  if (width < 768) {
    return 'mobile';
  }
  if (width < 1024) {
    return 'tablet';
  }
  return 'desktop';
}

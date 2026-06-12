let audioContext: AudioContext | null = null;
let unlocked = false;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!audioContext) {
    const Ctx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) {
      return null;
    }
    audioContext = new Ctx();
  }
  return audioContext;
}

/** Débloque l’audio après un geste utilisateur (politique autoplay des navigateurs). */
export function unlockNotificationSound(): void {
  if (unlocked) {
    return;
  }
  const ctx = getContext();
  if (ctx?.state === 'suspended') {
    void ctx.resume();
  }
  unlocked = true;
}

/** Son court type « cloche » pour une nouvelle notification. */
export async function playNotificationSound(): Promise<void> {
  const ctx = getContext();
  if (!ctx) {
    return;
  }
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      return;
    }
  }

  const start = ctx.currentTime;
  const tones = [
    { freq: 880, at: 0, duration: 0.12 },
    { freq: 1318.5, at: 0.1, duration: 0.18 },
  ];

  for (const tone of tones) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(tone.freq, start + tone.at);
    gain.gain.setValueAtTime(0.0001, start + tone.at);
    gain.gain.exponentialRampToValueAtTime(0.12, start + tone.at + 0.02);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      start + tone.at + tone.duration,
    );
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start + tone.at);
    osc.stop(start + tone.at + tone.duration + 0.05);
  }
}

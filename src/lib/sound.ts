let ctx: AudioContext | null = null;

function context() {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
  return ctx;
}

/** A tiny synthesized flip sound — no audio assets shipped. */
export function playFlip() {
  const audio = context();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(340, audio.currentTime);
  osc.frequency.exponentialRampToValueAtTime(170, audio.currentTime + 0.09);
  gain.gain.setValueAtTime(0.08, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.11);
  osc.connect(gain).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + 0.12);
}

export function playChime() {
  const audio = context();
  if (!audio) return;
  const notes = [523.25, 659.25, 783.99];
  notes.forEach((freq, index) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = audio.currentTime + index * 0.09;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.07, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + 0.55);
  });
}

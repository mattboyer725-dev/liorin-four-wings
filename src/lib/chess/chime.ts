let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  return ctx;
}

export function unlockChime() {
  const a = audio();
  if (!a) return;
  if (a.state === "suspended") void a.resume();
}

function beep(freq: number, dur: number, type: OscillatorType = "square", gain = 0.05) {
  const a = audio();
  if (!a) return;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(a.destination);
  const now = a.currentTime;
  osc.start(now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.stop(now + dur + 0.02);
}

export function chimeMove() {
  beep(330, 0.07);
}

export function chimeCapture() {
  beep(220, 0.08);
  window.setTimeout(() => beep(440, 0.08), 70);
}

export function chimeCheck() {
  beep(880, 0.1);
  window.setTimeout(() => beep(660, 0.12), 90);
}

export function chimeMate() {
  beep(523, 0.12);
  window.setTimeout(() => beep(659, 0.12), 120);
  window.setTimeout(() => beep(784, 0.18), 240);
}

export function chimeStart() {
  beep(392, 0.08);
  window.setTimeout(() => beep(523, 0.1), 90);
  window.setTimeout(() => beep(659, 0.14), 180);
}

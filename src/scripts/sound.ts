// Tiny synthesized UI sounds (no audio files). Off by default.
let ctx: AudioContext | null = null;
let on = false;

function tone(freq: number, dur: number, type: OscillatorType, gain: number, slide = 0) {
  if (!on) return;
  ctx ??= new AudioContext();
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur);
}

export const sound = {
  play(kind: 'pop' | 'tick' | 'thud') {
    if (kind === 'pop') tone(520, 0.18, 'sine', 0.18, 2.2);
    else if (kind === 'tick') tone(1400, 0.05, 'triangle', 0.04);
    else tone(140, 0.12, 'sine', 0.12, 0.5);
  },
  bind() {
    const btn = document.querySelector<HTMLButtonElement>('.sound');
    btn?.addEventListener('click', () => {
      on = !on;
      btn.setAttribute('aria-pressed', String(on));
      if (on) sound.play('pop');
    });
  },
};

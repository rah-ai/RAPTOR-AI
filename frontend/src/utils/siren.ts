export function playSiren() {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  // Wailing siren effect
  osc.type = 'sawtooth';
  
  const now = ctx.currentTime;
  
  // Modulate frequency up and down to sound like a warning siren
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.linearRampToValueAtTime(800, now + 0.5);
  osc.frequency.linearRampToValueAtTime(400, now + 1.0);
  osc.frequency.linearRampToValueAtTime(800, now + 1.5);
  osc.frequency.linearRampToValueAtTime(400, now + 2.0);
  osc.frequency.linearRampToValueAtTime(800, now + 2.5);
  osc.frequency.linearRampToValueAtTime(400, now + 3.0);

  // Volume envelope
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.1); // Not too loud!
  gain.gain.setValueAtTime(0.3, now + 2.9);
  gain.gain.linearRampToValueAtTime(0, now + 3.0);

  osc.start(now);
  osc.stop(now + 3.0);
}

/**
 * Web Audio API synthesizer for Google notifications, polyphonic melodies,
 * nature ambient tones, and long peaceful alarm chimes.
 * 100% offline, zero copyright infringements.
 */
import { SoundTone } from '../types';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return null;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (err) {
    console.warn('AudioContext initialization notice:', err);
    return null;
  }
}

export function playCustomAudio(dataUrl: string) {
  try {
    const audio = new Audio(dataUrl);
    audio.play().catch((e) => console.warn('Custom audio playback notice:', e));
  } catch (err) {
    console.warn('Audio tag error:', err);
  }
}

let currentToneTimeout: ReturnType<typeof setTimeout> | null = null;

export function playTone(tone: SoundTone, customData?: string) {
  if (currentToneTimeout) {
    clearTimeout(currentToneTimeout);
    currentToneTimeout = null;
  }

  // Defer execution slightly to avoid freezing native Android select dropdowns and UI threads
  currentToneTimeout = setTimeout(() => {
    if (tone === 'custom' && customData) {
      playCustomAudio(customData);
      return;
    }

    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      switch (tone) {
      case 'google_chime': {
        [1046.5, 783.99, 1318.51].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.14;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.4, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.62);
        });
        break;
      }

      case 'google_eureka': {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.11;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.35, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.62);
        });
        break;
      }

      case 'google_crystal': {
        [1567.98, 1174.66, 1760.0].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.15;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.4, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 1.25);
        });
        break;
      }

      case 'google_fresh': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(1380, now + 0.14);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.36);
        break;
      }

      case 'pixel_dawn': {
        // Soft Google Pixel style dawn melody (longer, soothing)
        const notes = [440, 554.37, 659.25, 880, 1108.73, 880];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.18;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.82);
        });
        break;
      }

      case 'pixel_horizon': {
        // Pixel ambient horizon chime
        const notes = [587.33, 739.99, 880, 1174.66, 1479.98];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.16;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.28, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.72);
        });
        break;
      }

      case 'morning_birds': {
        // Chirping morning birds harmonic frequency sweep
        for (let i = 0; i < 3; i++) {
          const t = now + i * 0.35;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(2400, t);
          osc.frequency.exponentialRampToValueAtTime(3200, t + 0.08);
          osc.frequency.exponentialRampToValueAtTime(2200, t + 0.18);
          gain.gain.setValueAtTime(0.25, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.24);
        }
        break;
      }

      case 'cathedral_bells': {
        // Deep resonant church cathedral bell melody
        const bells = [392, 440, 349.23, 261.63];
        bells.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.45;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.5, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 1.7);
        });
        break;
      }

      case 'cosmic_synth': {
        // Warm 80s space synth pad chord
        [261.63, 329.63, 392, 523.25].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 2.6);
        });
        break;
      }

      case 'rainfall_chime': {
        // Relaxing wind chimes and raindrops
        const chimes = [1200, 1400, 950, 1600, 1100, 1800];
        chimes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.18;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.95);
        });
        break;
      }

      case 'acoustic_guitar': {
        // Warm acoustic guitar fingerpicking arpeggio (E, G#, B, E5, G#5)
        const guitar = [329.63, 415.3, 493.88, 659.25, 830.61];
        guitar.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.13;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.35, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.88);
        });
        break;
      }

      case 'retro_arcade': {
        // Fun joyful 8-bit game level-up jingle
        const notes = [261.63, 329.63, 392, 523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.08;
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.18, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.38);
        });
        break;
      }

      case 'over_horizon': {
        // Samsung style majestic upbeat acoustic motif
        const notes = [392, 440, 523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.12;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.35, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.75);
        });
        break;
      }

      case 'meditation_gong': {
        // Low warm deep gong / singing bowl (around 216Hz and 432Hz)
        [216, 432, 648].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.4 / (i + 1), now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 3.3);
        });
        break;
      }

      case 'zen_bowl': {
        [432, 864, 1296].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.3 / (i + 1), now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 2.3);
        });
        break;
      }

      case 'harpa': {
        const harp = [523.25, 659.25, 783.99, 1046.5, 1318.51];
        harp.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.08;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.25, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.62);
        });
        break;
      }

      case 'water': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.18);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.36);
        break;
      }

      case 'samsung': {
        const notes = [392, 523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.08;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.35, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.36);
        });
        break;
      }

      case 'huawei': {
        const notes = [659.25, 493.88, 554.37, 739.99];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.11;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.4, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.46);
        });
        break;
      }

      case 'nokia': {
        const melody = [
          { f: 659.25, d: 0.12 },
          { f: 587.33, d: 0.12 },
          { f: 369.99, d: 0.22 },
          { f: 415.3, d: 0.22 },
          { f: 554.37, d: 0.12 },
          { f: 493.88, d: 0.12 },
          { f: 293.66, d: 0.22 },
          { f: 329.63, d: 0.35 },
        ];
        let curT = now;
        melody.forEach((note) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(note.f, curT);
          gain.gain.setValueAtTime(0.2, curT);
          gain.gain.exponentialRampToValueAtTime(0.001, curT + note.d);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(curT);
          osc.stop(curT + note.d);
          curT += note.d + 0.02;
        });
        break;
      }

      case 'crescendo_alarm': {
        // Melodía suave que sube progresivamente en volumen
        const notes = [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const t = now + idx * 0.45;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          const vol = 0.1 + (idx / notes.length) * 0.35;
          gain.gain.setValueAtTime(0.01, t);
          gain.gain.linearRampToValueAtTime(vol, t + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.85);
        });
        break;
      }

      case 'zen_flute': {
        // Sonido de flauta zen con vibrato suave
        const freqs = [440, 523.25, 587.33, 659.25, 880];
        freqs.forEach((freq, idx) => {
          const t = now + idx * 0.65;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          osc.frequency.linearRampToValueAtTime(freq * 1.01, t + 0.3);
          osc.frequency.linearRampToValueAtTime(freq, t + 0.6);
          gain.gain.setValueAtTime(0.01, t);
          gain.gain.linearRampToValueAtTime(0.3, t + 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 1.15);
        });
        break;
      }

      case 'celestial_harp': {
        // Cascada de arpa celestial de 8 notas
        const harpNotes = [392, 493.88, 587.33, 659.25, 783.99, 987.77, 1174.66, 1318.51];
        harpNotes.forEach((freq, idx) => {
          const t = now + idx * 0.2;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.35, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 1.45);
        });
        break;
      }

      case 'digital_pulse': {
        // Clásico pulso de reloj digital beep-beep (3 ciclos)
        for (let cycle = 0; cycle < 3; cycle++) {
          const cycleStart = now + cycle * 0.8;
          [0, 0.15].forEach((offset) => {
            const t = cycleStart + offset;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(2093, t); // C7
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.09);
          });
        }
        break;
      }

      case 'ocean_waves': {
        // Ondas relajantes con armónicos oceánicos
        const chords = [
          [220, 277.18, 329.63],
          [261.63, 329.63, 392],
          [293.66, 369.99, 440],
        ];
        chords.forEach((chord, cIdx) => {
          const t = now + cIdx * 1.5;
          chord.forEach((freq) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.01, t);
            gain.gain.linearRampToValueAtTime(0.18, t + 0.6);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 2.1);
          });
        });
        break;
      }

      case 'forest_sunrise': {
        // Pájaros del bosque y acorde de amanecer
        const birds = [2800, 3400, 3100, 3800, 2900];
        birds.forEach((freq, idx) => {
          const t = now + idx * 0.3;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.3, t + 0.07);
          osc.frequency.exponentialRampToValueAtTime(freq * 0.9, t + 0.16);
          gain.gain.setValueAtTime(0.2, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.22);
        });
        // Acorde de fondo cálido
        [329.63, 415.3, 493.88].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + 0.5);
          gain.gain.setValueAtTime(0.01, now + 0.5);
          gain.gain.linearRampToValueAtTime(0.2, now + 1.0);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + 0.5);
          osc.stop(now + 3.1);
        });
        break;
      }

      case 'tibetan_singing_bowls': {
        // Cuencos tibetanos de larga resonancia (frecuencias sagradas 432 y 528 Hz)
        [432, 528, 648, 864].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          osc.frequency.linearRampToValueAtTime(freq + (i % 2 === 0 ? 0.5 : -0.5), now + 3.0);
          gain.gain.setValueAtTime(0.3 / (i + 1), now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 4.6);
        });
        break;
      }

      case 'romantic_piano': {
        // Progresión de piano romántico (Cmaj7 -> Am9 -> Fadd9)
        const sequence = [
          { chord: [261.63, 329.63, 392, 493.88], delay: 0 },
          { chord: [220, 261.63, 329.63, 392], delay: 1.2 },
          { chord: [174.61, 261.63, 329.63, 392], delay: 2.4 },
        ];
        sequence.forEach(({ chord, delay }) => {
          const t = now + delay;
          chord.forEach((freq, noteIdx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t + noteIdx * 0.04);
            gain.gain.setValueAtTime(0.25, t + noteIdx * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, t + noteIdx * 0.04 + 1.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t + noteIdx * 0.04);
            osc.stop(t + noteIdx * 0.04 + 1.45);
          });
        });
        break;
      }

      case 'energetic_marimba': {
        // Marimba alegre y rítmica
        const melody = [523.25, 659.25, 783.99, 659.25, 1046.5, 783.99, 659.25, 523.25];
        melody.forEach((freq, idx) => {
          const t = now + idx * 0.14;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.35, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.3);
        });
        break;
      }

      case 'space_odyssey': {
        // Onda espacial de sintetizador cósmico
        [220, 329.63, 440, 554.37, 659.25].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          gain.gain.setValueAtTime(0.01, now + idx * 0.1);
          gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.1 + 0.3);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 3.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 3.3);
        });
        break;
      }

      case 'clock_bell_tower': {
        // Campanadas de torre de reloj (Westminster style)
        const bells = [659.25, 523.25, 587.33, 392, 392, 587.33, 659.25, 523.25];
        bells.forEach((freq, idx) => {
          const t = now + idx * 0.42;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.4, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 1.25);
        });
        break;
      }

      case 'peaceful_chime': {
        // Campanas de viento pacíficas
        const chimes = [1046.5, 1318.51, 1567.98, 1760, 2093, 1567.98];
        chimes.forEach((freq, idx) => {
          const t = now + idx * 0.25;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 1.85);
        });
        break;
      }
      }
    } catch (err) {
      console.warn('Audio playback notice:', err);
    }
  }, 80);
}

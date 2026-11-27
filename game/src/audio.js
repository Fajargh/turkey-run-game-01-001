// All sound is synthesized with WebAudio — no audio files, no network.
// A little banjo-ish pluck loop for music, and one-shot effects for jumps,
// pickups, hits, the farmer's shout and the win/lose stingers.
export function createAudio() {
  let context = null;
  let musicTimer = null;
  let musicStep = 0;
  let muted = false;

  function ensure() {
    if (context) return context;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
    } catch {
      context = null;
    }
    return context;
  }

  function tone({ frequency = 440, end = null, duration = 0.15, type = 'sine', volume = 0.2, when = 0, slide = null }) {
    const ctx = ensure();
    if (!ctx || muted) return;
    const start = ctx.currentTime + when;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (slide) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, slide), start + duration);
    else if (end) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, end), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }

  function noise({ duration = 0.2, volume = 0.2, when = 0, lowpass = 1200 }) {
    const ctx = ensure();
    if (!ctx || muted) return;
    const start = ctx.currentTime + when;
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(start);
  }

  // A cheerful country pluck: C major pentatonic, two bars that loop.
  const MELODY = [
    523, 0, 659, 784, 0, 659, 523, 0,
    587, 0, 698, 880, 0, 698, 587, 0,
  ];
  const BASS = [131, 0, 0, 0, 98, 0, 0, 0, 131, 0, 0, 0, 98, 0, 123, 0];

  function musicTick() {
    const note = MELODY[musicStep % MELODY.length];
    if (note) tone({ frequency: note, duration: 0.22, type: 'triangle', volume: 0.07 });
    const bass = BASS[musicStep % BASS.length];
    if (bass) tone({ frequency: bass, duration: 0.3, type: 'sine', volume: 0.09 });
    musicStep += 1;
  }

  return {
    unlock() {
      const ctx = ensure();
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    },
    startMusic() {
      if (musicTimer !== null) return;
      musicStep = 0;
      musicTick();
      musicTimer = window.setInterval(musicTick, 210);
    },
    stopMusic() {
      if (musicTimer !== null) {
        window.clearInterval(musicTimer);
        musicTimer = null;
      }
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    jump() {
      tone({ frequency: 280, end: 620, duration: 0.16, type: 'sine', volume: 0.16 });
    },
    gobble() {
      // Two quick descending gobbles: the turkey's signature sound.
      tone({ frequency: 320, end: 180, duration: 0.09, type: 'square', volume: 0.1 });
      tone({ frequency: 260, end: 140, duration: 0.12, type: 'square', volume: 0.1, when: 0.1 });
    },
    pickup() {
      tone({ frequency: 880, duration: 0.09, type: 'triangle', volume: 0.16 });
      tone({ frequency: 1318, duration: 0.14, type: 'triangle', volume: 0.14, when: 0.07 });
    },
    feather() {
      tone({ frequency: 1046, duration: 0.1, type: 'triangle', volume: 0.16 });
      tone({ frequency: 1568, duration: 0.18, type: 'triangle', volume: 0.14, when: 0.08 });
      tone({ frequency: 2093, duration: 0.2, type: 'sine', volume: 0.1, when: 0.16 });
    },
    hit() {
      noise({ duration: 0.25, volume: 0.3, lowpass: 700 });
      tone({ frequency: 140, end: 60, duration: 0.25, type: 'sawtooth', volume: 0.2 });
    },
    farmerShout() {
      tone({ frequency: 220, end: 330, duration: 0.14, type: 'sawtooth', volume: 0.16 });
      tone({ frequency: 330, end: 180, duration: 0.2, type: 'sawtooth', volume: 0.16, when: 0.14 });
    },
    stumble() {
      noise({ duration: 0.18, volume: 0.22, lowpass: 900 });
    },
    escaped() {
      const notes = [523, 659, 784, 1046, 1318];
      notes.forEach((frequency, index) => {
        tone({ frequency, duration: 0.3, type: 'triangle', volume: 0.16, when: index * 0.13 });
      });
    },
    caught() {
      const notes = [392, 370, 349, 311];
      notes.forEach((frequency, index) => {
        tone({ frequency, duration: 0.35, type: 'sawtooth', volume: 0.12, when: index * 0.22 });
      });
    },
  };
}

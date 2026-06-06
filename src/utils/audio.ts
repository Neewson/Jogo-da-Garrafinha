// Web Audio API Synthesizer for Bottle Flip Game Sound Effects
let audioCtx: AudioContext | null = null;
let isMutedGlobal = false;

function getAudioContext(): AudioContext | null {
  if (isMutedGlobal) return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API not supported in this browser.", e);
    }
  }
  // Resume context if suspended (common browser security policy)
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export const toggleGlobalMute = (mute: boolean) => {
  isMutedGlobal = mute;
  if (mute && audioCtx) {
    audioCtx.close().then(() => {
      audioCtx = null;
    });
  }
};

export const playThrowSound = (force: number) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  // Frequency sweeps up as the bottle climbs
  osc.frequency.exponentialRampToValueAtTime(350 + Math.min(force * 0.5, 400), ctx.currentTime + 0.15);

  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.2);
};

export const playBounceSound = (intensity: number, objectMaterial: "water" | "metal" | "wood" | "glass" | "plastic") => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const volume = Math.min(intensity * 0.1, 0.4);
  if (volume < 0.02) return; // Too soft to hear

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  if (objectMaterial === "glass") {
    // Glass clink: high pitch, quick decay
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.02);
    
    // Add micro harmonics
    const oscHarmonic = ctx.createOscillator();
    oscHarmonic.type = "sine";
    oscHarmonic.frequency.setValueAtTime(2400, ctx.currentTime);
    const harmonicGain = ctx.createGain();
    harmonicGain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
    harmonicGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    oscHarmonic.connect(harmonicGain);
    harmonicGain.connect(ctx.destination);
    oscHarmonic.start();
    oscHarmonic.stop(ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
  } else if (objectMaterial === "metal") {
    // Metal clang
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(volume * 0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  } else if (objectMaterial === "wood" || objectMaterial === "plastic") {
    // Solid organic impact
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  } else {
    // Liquid slosh and plastic bounce combo
    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  }

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.2);
};

export const playGlassShatterSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Let's make a rich explosion/shatter noise using a buffer of random noise and multiple rapid oscillators
  const bufferSize = ctx.sampleRate * 0.5; // Half second noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noiseNode = ctx.createBufferSource();
  noiseNode.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1500, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.3);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

  noiseNode.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noiseNode.start();
  noiseNode.stop(ctx.currentTime + 0.5);

  // Add 3 high-frequency chime pings for glass shards flying
  for (let i = 0; i < 3; i++) {
    const shardOsc = ctx.createOscillator();
    const shardGain = ctx.createGain();
    shardOsc.type = "sine";
    shardOsc.frequency.setValueAtTime(2000 + Math.random() * 2000, ctx.currentTime + i * 0.05);
    shardGain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.05);
    shardGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.05 + 0.15);
    
    shardOsc.connect(shardGain);
    shardGain.connect(ctx.destination);
    shardOsc.start(ctx.currentTime + i * 0.05);
    shardOsc.stop(ctx.currentTime + i * 0.05 + 0.2);
  }
};

export const playLandSuccessSound = (multiplier: number = 1.0) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 major chord
  const baseTime = ctx.currentTime;

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    // Increase frequency slightly for that retro synthesizer shine
    osc.frequency.setValueAtTime(freq, baseTime + idx * 0.06);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.01, baseTime + idx * 0.06 + 0.2);

    gain.gain.setValueAtTime(0.12, baseTime + idx * 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, baseTime + idx * 0.06 + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(baseTime + idx * 0.06);
    osc.stop(baseTime + idx * 0.06 + 0.4);
  });
};

export const playFanfareSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const progression = [392.00, 523.25, 659.25, 783.99, 1046.50]; // G4, C5, E5, G5, C6 triumph rising
  progression.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now + idx * 0.08);

    gain.gain.setValueAtTime(0.15, now + idx * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.08);
    osc.stop(now + idx * 0.08 + 0.4);
  });
};

export const playFailSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.3);

  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.4);
};

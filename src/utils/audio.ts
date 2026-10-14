// Audio feedback utilities using Web Audio API and Speech Synthesis
// SSR-safe: all browser APIs are strictly guarded

let audioCtx: AudioContext | null = null;
let selectedVoice: SpeechSynthesisVoice | null = null;
let voiceInitialized = false;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function getAudioContext(): AudioContext | null {
  if (!isBrowser()) return null;
  try {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtx = new AudioCtx();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
}

export function playAlexaChime() {
  if (!isBrowser()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Tone 1: Gentle pleasant sine 523.25 Hz (C5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.12, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: Harmonious tone 783.99 Hz (G5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, now + 0.12);
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.14, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (e) {
    // Graceful fallback without console error
  }
}

export function playEmergencyAlertChime() {
  if (!isBrowser()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Pulse 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Pulse 2
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.3);
    gain2.gain.setValueAtTime(0, now + 0.3);
    gain2.gain.linearRampToValueAtTime(0.2, now + 0.35);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.3);
    osc2.stop(now + 0.55);
  } catch (e) {
    // Graceful fallback
  }
}

export function playSensorChime() {
  if (!isBrowser()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch (e) {
    // Graceful fallback
  }
}


/**
 * Finds and locks to ONE consistent female Alexa-style voice throughout the entire session.
 * Eliminates voice-switching between initial male voice and later female voice.
 */
export function findConsistentVoice(): SpeechSynthesisVoice | null {
  if (!isBrowser() || !window.speechSynthesis) return null;
  if (selectedVoice) return selectedVoice;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. First priority: Warm, friendly female voices common across platforms
  const femaleKeywords = ['samantha', 'victoria', 'karen', 'zira', 'jenny', 'aria', 'female', 'natural'];
  const femaleVoice = voices.find((v) => {
    if (!v.lang.startsWith('en')) return false;
    const lower = v.name.toLowerCase();
    return femaleKeywords.some((kw) => lower.includes(kw));
  });

  if (femaleVoice) {
    selectedVoice = femaleVoice;
    voiceInitialized = true;
    return femaleVoice;
  }

  // 2. Second priority: Standard English Google or Apple voice
  const googleOrApple = voices.find(
    (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Apple') || v.name.includes('Natural'))
  );
  if (googleOrApple) {
    selectedVoice = googleOrApple;
    voiceInitialized = true;
    return googleOrApple;
  }

  // 3. Third priority: First English voice
  const anyEnglish = voices.find((v) => v.lang.startsWith('en'));
  if (anyEnglish) {
    selectedVoice = anyEnglish;
    voiceInitialized = true;
    return anyEnglish;
  }

  // 4. Fallback to first voice
  if (voices[0]) {
    selectedVoice = voices[0];
    voiceInitialized = true;
    return voices[0];
  }

  return null;
}

// Pre-register voice listener so voices are resolved as early as possible
if (isBrowser() && window.speechSynthesis) {
  findConsistentVoice();
  if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
    window.speechSynthesis.onvoiceschanged = () => {
      findConsistentVoice();
    };
  }
}

export function getCurrentVoiceLabel(): string {
  const v = selectedVoice || findConsistentVoice();
  if (v) {
    return `${v.name} (${v.lang})`;
  }
  return 'Alexa Voice (Female, Warm)';
}

export function speakText(text: string, onEnd?: () => void) {
  if (!isBrowser() || !window.speechSynthesis) {
    if (onEnd) onEnd();
    return;
  }

  const executeSpeech = () => {
    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const cleanText = text.replace(/[*#_~`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Lock to consistent voice
      const voice = selectedVoice || findConsistentVoice();
      if (voice) {
        utterance.voice = voice;
      }
      utterance.pitch = 1.05;
      utterance.rate = 0.95; // Slightly slower, calm cadence suitable for elder care

      utterance.onend = () => {
        if (onEnd) onEnd();
      };
      utterance.onerror = () => {
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      if (onEnd) onEnd();
    }
  };

  // Guard against browser voice async load latency:
  // If voices have not populated yet, wait for voiceschanged or a short delay
  // so the first speech NEVER falls back to an unwanted male default voice!
  if (!selectedVoice && window.speechSynthesis.getVoices().length === 0) {
    let triggered = false;
    const voiceHandler = () => {
      if (!triggered) {
        triggered = true;
        findConsistentVoice();
        executeSpeech();
      }
    };

    window.speechSynthesis.onvoiceschanged = voiceHandler;

    // Timeout safety fallback (max 200ms)
    setTimeout(() => {
      if (!triggered) {
        triggered = true;
        findConsistentVoice();
        executeSpeech();
      }
    }, 200);
  } else {
    executeSpeech();
  }
}

export function stopSpeaking() {
  if (isBrowser() && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
}

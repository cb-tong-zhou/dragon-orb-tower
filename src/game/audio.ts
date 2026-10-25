let audioContext: AudioContext | null = null;
let soundEnabled = true;

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  if (!enabled && audioContext) {
    void audioContext.suspend();
  }
  if (enabled && audioContext && audioContext.state === "suspended") {
    void audioContext.resume();
  }
}

export function initAudio() {
  if (audioContext) {
    if (audioContext.state === "suspended") void audioContext.resume();
    return audioContext;
  }
  if (typeof window === "undefined") return null;
  const AudioCtor =
    window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!AudioCtor) return null;
  audioContext = new AudioCtor();
  return audioContext;
}

function tone(
  frequency: number,
  duration: number,
  options: {
    type?: OscillatorType;
    volume?: number;
    delay?: number;
    slideTo?: number;
  } = {},
) {
  if (!soundEnabled) return;
  const context = initAudio();
  if (!context) return;
  const { type = "sine", volume = 0.06, delay = 0, slideTo } = options;
  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (slideTo) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), start + duration);
  }
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

function chord(frequencies: number[], duration: number, delay = 0, volume = 0.045) {
  frequencies.forEach((frequency, index) => {
    tone(frequency, duration, {
      type: "triangle",
      volume,
      delay: delay + index * 0.025,
    });
  });
}

export function playTap() {
  tone(520, 0.05, { type: "sine", volume: 0.025 });
}

export function playStep() {
  tone(180, 0.035, { type: "triangle", volume: 0.014, slideTo: 140 });
}

export function playRescue() {
  chord([523.25, 659.25, 783.99], 0.22, 0);
  tone(1046.5, 0.3, { type: "triangle", volume: 0.05, delay: 0.18 });
}

export function playOrb() {
  chord([659.25, 830.61, 987.77, 1318.51], 0.3, 0, 0.035);
  tone(1567.98, 0.45, { type: "sine", volume: 0.03, delay: 0.15 });
}

export function playRadar() {
  tone(420, 0.2, { type: "sine", volume: 0.035, slideTo: 880 });
  tone(880, 0.14, { type: "sine", volume: 0.025, delay: 0.16 });
  tone(1320, 0.18, { type: "sine", volume: 0.018, delay: 0.3 });
}

export function playCoin() {
  tone(987.77, 0.08, { type: "triangle", volume: 0.028 });
  tone(1318.51, 0.16, { type: "triangle", volume: 0.025, delay: 0.06 });
}

export function playUnlock() {
  chord([392, 523.25, 659.25], 0.2, 0);
  tone(783.99, 0.35, { type: "triangle", volume: 0.045, delay: 0.2 });
}

export function playError() {
  tone(220, 0.12, { type: "square", volume: 0.025, slideTo: 165 });
}

export function playWin() {
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
  notes.forEach((note, index) => {
    tone(note, 0.28, {
      type: "triangle",
      volume: 0.055,
      delay: index * 0.1,
    });
  });
  chord([523.25, 659.25, 783.99, 1046.5], 0.8, 0.55, 0.035);
}

export function playPage() {
  tone(440, 0.06, { type: "sine", volume: 0.02 });
  tone(660, 0.08, { type: "sine", volume: 0.015, delay: 0.04 });
}

/** Soft double chalk scratch when a friend stamps a dead-end X. */
export function playChalk() {
  tone(190, 0.05, { type: "triangle", volume: 0.03, slideTo: 150 });
  tone(210, 0.05, { type: "triangle", volume: 0.026, delay: 0.09, slideTo: 160 });
}

/** Comedic poof when a grumblin is shooed away. */
export function playPoof() {
  tone(620, 0.16, { type: "sine", volume: 0.035, slideTo: 120 });
  tone(320, 0.12, { type: "triangle", volume: 0.02, delay: 0.1, slideTo: 90 });
}

export function speak(text: string, enabled: boolean) {
  if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.92;
  utterance.pitch = 1.08;
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

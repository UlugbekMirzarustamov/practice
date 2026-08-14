import type { AmbientSound, TypingSoundStyle } from './writingPrefs'

let ctx: AudioContext | null = null

/** Must be called from inside a real user-gesture handler (click) so the browser allows audio. */
export function primeAudio(): void {
  const Ctor = window.AudioContext ?? window.webkitAudioContext
  if (!Ctor) return
  if (!ctx) ctx = new Ctor()
  if (ctx.state === 'suspended') void ctx.resume()
}

function tone(freq: number, duration: number, type: OscillatorType, gainPeak: number, delay = 0) {
  if (!ctx) return
  const startAt = ctx.currentTime + delay
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, startAt)
  gain.gain.linearRampToValueAtTime(gainPeak, startAt + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(startAt)
  osc.stop(startAt + duration + 0.02)
}

/** A single shuffle-step tick, pitch rising slightly as the reveal decelerates. */
export function playTick(progress: number): void {
  tone(460 + progress * 260, 0.055, 'square', 0.025)
}

/** The satisfying two-note resolve when the topic lands. */
export function playSettleChime(): void {
  tone(660, 0.2, 'sine', 0.05)
  tone(880, 0.28, 'sine', 0.045, 0.09)
}

/** Short, subtle arpeggio for a normal session completion. Plays every session — kept brief on purpose. */
export function playCompleteChime(): void {
  tone(523.25, 0.15, 'sine', 0.05)
  tone(659.25, 0.15, 'sine', 0.045, 0.08)
  tone(783.99, 0.26, 'sine', 0.05, 0.16)
}

/** Bigger, distinct fanfare for milestone unlocks — still under a second, just brighter and longer than the normal chime. */
export function playMilestoneChime(): void {
  tone(523.25, 0.12, 'sine', 0.055)
  tone(659.25, 0.12, 'sine', 0.05, 0.09)
  tone(783.99, 0.12, 'sine', 0.05, 0.18)
  tone(1046.5, 0.4, 'sine', 0.06, 0.27)
}

/** Best-effort haptic tap. No-ops silently on browsers/devices without vibration support. */
export function vibrate(pattern: number | number[]): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  try {
    navigator.vibrate(pattern)
  } catch {
    // vibration blocked or unsupported; nothing to fall back to
  }
}

let noiseBuffer: AudioBuffer | null = null

function getNoiseBuffer(): AudioBuffer | null {
  if (!ctx) return null
  if (noiseBuffer) return noiseBuffer
  const length = ctx.sampleRate * 4
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  noiseBuffer = buffer
  return buffer
}

function playNoiseClick(duration: number, filterFreq: number, gainPeak: number) {
  if (!ctx) return
  const buffer = getNoiseBuffer()
  if (!buffer) return
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = filterFreq
  const gain = ctx.createGain()
  const startAt = ctx.currentTime
  gain.gain.setValueAtTime(gainPeak, startAt)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  const offset = Math.random() * Math.max(0.01, buffer.duration - duration - 0.02)
  source.start(startAt, offset)
  source.stop(startAt + duration + 0.01)
}

/** A single synthesized keystroke sound. No audio files, everything generated. */
export function playKeystroke(style: TypingSoundStyle): void {
  if (!ctx) return
  if (style === 'soft') {
    tone(620 + Math.random() * 80, 0.035, 'sine', 0.018)
  } else if (style === 'mechanical') {
    playNoiseClick(0.014, 1800, 0.05)
  } else if (style === 'typewriter') {
    playNoiseClick(0.02, 2400, 0.05)
    tone(140, 0.05, 'square', 0.025, 0.004)
  } else if (style === 'bubble') {
    tone(320 + Math.random() * 60, 0.05, 'sine', 0.03)
    tone(520 + Math.random() * 60, 0.04, 'sine', 0.02, 0.02)
  } else if (style === 'crisp') {
    playNoiseClick(0.008, 3400, 0.045)
  } else {
    playNoiseClick(0.03, 900, 0.014)
  }
}

interface AmbientState {
  nodes: (OscillatorNode | AudioBufferSourceNode)[]
  gain: GainNode
}

let activeAmbient: AmbientState | null = null

export function stopAmbient(): void {
  if (!activeAmbient) return
  for (const node of activeAmbient.nodes) {
    try {
      node.stop()
    } catch {
      // already stopped
    }
    node.disconnect()
  }
  activeAmbient.gain.disconnect()
  activeAmbient = null
}

export function setAmbientVolume(volume: number): void {
  if (activeAmbient && ctx) {
    activeAmbient.gain.gain.setTargetAtTime(volume * 0.35, ctx.currentTime, 0.15)
  }
}

/** Starts a looping, fully synthesized ambient bed. Stops whatever was already playing. */
export function startAmbient(kind: AmbientSound, volume: number): void {
  stopAmbient()
  if (kind === 'none' || !ctx) return

  const gain = ctx.createGain()
  gain.gain.value = volume * 0.35
  gain.connect(ctx.destination)
  const nodes: (OscillatorNode | AudioBufferSourceNode)[] = []

  if (kind === 'soft-pad') {
    const oscGain = ctx.createGain()
    oscGain.gain.value = 0.35
    oscGain.connect(gain)
    for (const freq of [130.81, 164.81, 196.0]) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(oscGain)
      osc.start()
      nodes.push(osc)
    }
  } else {
    const buffer = getNoiseBuffer()
    if (!buffer) return
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true

    if (kind === 'brown-noise') {
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 350
      source.connect(filter)
      filter.connect(gain)
    } else if (kind === 'rain') {
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 3200
      filter.Q.value = 0.6
      source.connect(filter)
      filter.connect(gain)
    } else if (kind === 'wind') {
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 700
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.15
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = 300
      lfo.connect(lfoGain)
      lfoGain.connect(filter.frequency)
      lfo.start()
      nodes.push(lfo)
      source.connect(filter)
      filter.connect(gain)
    }

    source.start()
    nodes.push(source)
  }

  activeAmbient = { nodes, gain }
}

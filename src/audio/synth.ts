import { midiToHz } from '../music/theory'
import type { InstrumentId } from '../catalog/lessons'

export type SynthVoice = InstrumentId

let sharedCtx: AudioContext | null = null
let currentVoice: SynthVoice = 'piano'

export function getAudioContext(): AudioContext {
  if (!sharedCtx) {
    sharedCtx = new AudioContext()
  }
  return sharedCtx
}

export async function ensureAudioRunning(): Promise<AudioContext> {
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }
  return ctx
}

export function setSynthVoice(voice: SynthVoice): void {
  currentVoice = voice
}

export function getSynthVoice(): SynthVoice {
  return currentVoice
}

type VoicePatch = {
  type: OscillatorType
  detune?: number
  gain: number
  filterHz?: number
  filterQ?: number
  attack: number
  release: number
}

function patchesFor(voice: SynthVoice, midi: number): VoicePatch[] {
  if (voice === 'bass') {
    // Fat low end: sine fundamental + soft saw
    return [
      {
        type: 'sine',
        gain: 0.55,
        filterHz: 420,
        filterQ: 0.7,
        attack: 0.02,
        release: 0.35,
      },
      {
        type: 'sawtooth',
        gain: 0.18,
        filterHz: 280,
        filterQ: 1.1,
        attack: 0.03,
        release: 0.4,
      },
    ]
  }
  if (voice === 'guitar') {
    const bright = midi > 60
    return [
      {
        type: 'sawtooth',
        gain: 0.22,
        filterHz: bright ? 2200 : 1400,
        filterQ: 0.9,
        attack: 0.01,
        release: 0.55,
      },
      {
        type: 'triangle',
        detune: 6,
        gain: 0.12,
        filterHz: 1800,
        attack: 0.015,
        release: 0.5,
      },
    ]
  }
  // piano-ish: triangle + soft square transient
  return [
    {
      type: 'triangle',
      gain: 0.28,
      filterHz: 3200,
      attack: 0.008,
      release: 0.7,
    },
    {
      type: 'square',
      gain: 0.06,
      filterHz: 1200,
      attack: 0.004,
      release: 0.25,
    },
  ]
}

export function playMidiNotes(
  midiNotes: number[],
  durationSec = 0.9,
  when = 0,
  voice: SynthVoice = currentVoice,
): void {
  const ctx = getAudioContext()
  const start = ctx.currentTime + when
  const master = ctx.createGain()
  const peak = voice === 'bass' ? 0.32 : 0.22
  master.gain.setValueAtTime(0.0001, start)
  master.gain.exponentialRampToValueAtTime(peak, start + 0.03)
  master.gain.exponentialRampToValueAtTime(0.0001, start + durationSec)
  master.connect(ctx.destination)

  const n = Math.max(midiNotes.length, 1)
  for (const midi of midiNotes) {
    const patches = patchesFor(voice, midi)
    for (const patch of patches) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = patch.type
      osc.frequency.value = midiToHz(midi)
      if (patch.detune) osc.detune.value = patch.detune

      let node: AudioNode = osc
      if (patch.filterHz) {
        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = patch.filterHz
        filter.Q.value = patch.filterQ ?? 0.8
        osc.connect(filter)
        node = filter
      }

      const g = (patch.gain / n) * (voice === 'bass' ? 1.15 : 1)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(g, start + patch.attack)
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        start + Math.max(durationSec, patch.release),
      )

      node.connect(gain)
      gain.connect(master)
      osc.start(start)
      osc.stop(start + durationSec + 0.08)
    }
  }
}

export function playSequence(
  chords: number[][],
  gapSec = 0.95,
  noteDuration = 0.85,
  voice: SynthVoice = currentVoice,
): void {
  void ensureAudioRunning().then(() => {
    chords.forEach((chord, i) => {
      playMidiNotes(chord, noteDuration, i * gapSec, voice)
    })
  })
}

import { midiToHz } from '../music/theory'

let sharedCtx: AudioContext | null = null

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

export function playMidiNotes(
  midiNotes: number[],
  durationSec = 0.9,
  when = 0,
): void {
  const ctx = getAudioContext()
  const start = ctx.currentTime + when
  const master = ctx.createGain()
  master.gain.setValueAtTime(0.0001, start)
  master.gain.exponentialRampToValueAtTime(0.22, start + 0.03)
  master.gain.exponentialRampToValueAtTime(0.0001, start + durationSec)
  master.connect(ctx.destination)

  for (const midi of midiNotes) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = midiToHz(midi)
    gain.gain.value = 1 / Math.max(midiNotes.length, 1)
    osc.connect(gain)
    gain.connect(master)
    osc.start(start)
    osc.stop(start + durationSec + 0.05)
  }
}

export function playSequence(
  chords: number[][],
  gapSec = 0.95,
  noteDuration = 0.85,
): void {
  void ensureAudioRunning().then(() => {
    chords.forEach((chord, i) => {
      playMidiNotes(chord, noteDuration, i * gapSec)
    })
  })
}

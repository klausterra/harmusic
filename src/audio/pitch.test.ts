import { describe, expect, it } from 'vitest'
import {
  centsBetween,
  detectPitchHz,
  hzToMidi,
  midiToHz,
  wrapCentsToNearestOctave,
} from './pitch'

describe('pitch math', () => {
  it('converts A4 440 ↔ midi 69', () => {
    expect(hzToMidi(440)).toBeCloseTo(69, 5)
    expect(midiToHz(69)).toBeCloseTo(440, 5)
  })

  it('measures cents', () => {
    expect(centsBetween(440, 440)).toBeCloseTo(0, 5)
    expect(Math.abs(centsBetween(midiToHz(70), 440))).toBeCloseTo(100, 0)
  })

  it('wraps to nearest octave of target pitch class', () => {
    const { cents } = wrapCentsToNearestOctave(440, 60) // C4 target, A4 sung
    expect(Math.abs(cents)).toBeGreaterThan(100)
    const onC = wrapCentsToNearestOctave(midiToHz(72), 60) // C5 vs C4
    expect(Math.abs(onC.cents)).toBeLessThan(1)
  })

  it('detects sine-like autocorrelation peak', () => {
    const sr = 44100
    const hz = 220
    const buf = new Float32Array(2048)
    for (let i = 0; i < buf.length; i++) {
      buf[i] = Math.sin((2 * Math.PI * hz * i) / sr) * 0.5
    }
    const detected = detectPitchHz(buf, sr)
    expect(detected).not.toBeNull()
    expect(detected!).toBeGreaterThan(200)
    expect(detected!).toBeLessThan(240)
  })
})

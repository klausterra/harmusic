/** Pure pitch helpers + live mic analyser (browser). */

export function hzToMidi(hz: number): number {
  return 69 + 12 * Math.log2(hz / 440)
}

export function midiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

export function centsBetween(hz: number, targetHz: number): number {
  if (hz <= 0 || targetHz <= 0) return 0
  return 1200 * Math.log2(hz / targetHz)
}

export function nearestMidi(hz: number): number {
  return Math.round(hzToMidi(hz))
}

export function wrapCentsToNearestOctave(
  hz: number,
  targetMidi: number,
): { cents: number; matchedMidi: number } {
  const midi = hzToMidi(hz)
  // Compare pitch class: find closest octave of target
  const targetPc = ((targetMidi % 12) + 12) % 12
  let bestMidi = targetMidi
  let bestCents = Infinity
  for (let oct = 2; oct <= 6; oct++) {
    const candidate = oct * 12 + targetPc
    const c = (midi - candidate) * 100
    if (Math.abs(c) < Math.abs(bestCents)) {
      bestCents = c
      bestMidi = candidate
    }
  }
  return { cents: bestCents, matchedMidi: bestMidi }
}

/**
 * Autocorrelation pitch estimate (YIN-inspired, simplified).
 * Returns Hz or null if no stable pitch.
 */
export function detectPitchHz(
  buffer: Float32Array,
  sampleRate: number,
  minHz = 70,
  maxHz = 1000,
): number | null {
  const size = buffer.length
  if (size < 64) return null

  let rms = 0
  for (let i = 0; i < size; i++) rms += buffer[i] * buffer[i]
  rms = Math.sqrt(rms / size)
  if (rms < 0.01) return null

  const maxLag = Math.min(Math.floor(sampleRate / minHz), size - 1)
  const minLag = Math.max(2, Math.floor(sampleRate / maxHz))

  const yin = new Float32Array(maxLag + 1)
  for (let tau = minLag; tau <= maxLag; tau++) {
    let sum = 0
    for (let i = 0; i < size - tau; i++) {
      const d = buffer[i] - buffer[i + tau]
      sum += d * d
    }
    yin[tau] = sum
  }

  // Cumulative mean normalized difference
  let running = 0
  yin[minLag] = 1
  for (let tau = minLag + 1; tau <= maxLag; tau++) {
    running += yin[tau]
    yin[tau] = yin[tau] * tau / running
  }

  const threshold = 0.15
  let tauEstimate = -1
  for (let tau = minLag + 1; tau < maxLag; tau++) {
    if (yin[tau] < threshold) {
      while (tau + 1 < maxLag && yin[tau + 1] < yin[tau]) tau++
      tauEstimate = tau
      break
    }
  }
  if (tauEstimate < 0) {
    // Fallback: absolute minimum
    let minVal = Infinity
    for (let tau = minLag; tau <= maxLag; tau++) {
      if (yin[tau] < minVal) {
        minVal = yin[tau]
        tauEstimate = tau
      }
    }
    if (minVal > 0.4) return null
  }

  // Parabolic interpolation
  const x0 = tauEstimate > 0 ? yin[tauEstimate - 1] : yin[tauEstimate]
  const x1 = yin[tauEstimate]
  const x2 = tauEstimate + 1 <= maxLag ? yin[tauEstimate + 1] : yin[tauEstimate]
  const denom = 2 * (2 * x1 - x2 - x0)
  const better =
    denom !== 0 ? tauEstimate + (x2 - x0) / denom : tauEstimate

  const hz = sampleRate / better
  if (hz < minHz || hz > maxHz) return null
  return hz
}

export type PitchSample = {
  hz: number | null
  midi: number | null
  cents: number | null
  inTune: boolean
  confidence: 'low' | 'ok'
}

export type PitchMonitor = {
  start: () => Promise<void>
  stop: () => void
  sample: () => PitchSample
}

export function createPitchMonitor(
  targetMidi: () => number,
  opts: { centsTolerance?: number } = {},
): PitchMonitor {
  const tolerance = opts.centsTolerance ?? 25
  let ctx: AudioContext | null = null
  let stream: MediaStream | null = null
  let analyser: AnalyserNode | null = null
  let buffer: Float32Array | null = null
  let last: PitchSample = {
    hz: null,
    midi: null,
    cents: null,
    inTune: false,
    confidence: 'low',
  }

  return {
    async start() {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      buffer = new Float32Array(analyser.fftSize)
    },
    stop() {
      stream?.getTracks().forEach((t) => t.stop())
      void ctx?.close()
      stream = null
      ctx = null
      analyser = null
      buffer = null
    },
    sample() {
      if (!analyser || !buffer || !ctx) return last
      // TS DOM lib: getFloatTimeDomainData accepts Float32Array
      analyser.getFloatTimeDomainData(buffer as Float32Array<ArrayBuffer>)
      const hz = detectPitchHz(buffer, ctx.sampleRate)
      if (hz == null) {
        last = {
          hz: null,
          midi: null,
          cents: null,
          inTune: false,
          confidence: 'low',
        }
        return last
      }
      const target = targetMidi()
      const { cents, matchedMidi } = wrapCentsToNearestOctave(hz, target)
      last = {
        hz,
        midi: matchedMidi,
        cents,
        inTune: Math.abs(cents) <= tolerance,
        confidence: Math.abs(cents) <= 50 ? 'ok' : 'low',
      }
      return last
    },
  }
}

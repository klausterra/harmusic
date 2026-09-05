import type { MidiNoteEvent, PlaybackRate } from './types'

export interface SchedulerSnapshot {
  songTime: number
  playing: boolean
  rate: PlaybackRate
  activeMidis: Set<number>
}

export interface MidiScheduler {
  play: () => void
  pause: () => void
  seek: (songTime: number) => void
  setRate: (rate: PlaybackRate) => void
  getSongTime: () => number
  isPlaying: () => boolean
  getRate: () => PlaybackRate
  dispose: () => void
  subscribe: (listener: (snap: SchedulerSnapshot) => void) => () => void
}

export interface SchedulerDeps {
  now: () => number
  duration: number
  notes: readonly MidiNoteEvent[]
  onScheduleNote: (midi: number, durationSec: number, whenSec: number) => void
  onCancelScheduled?: () => void
  /** How far ahead (in song-seconds) to schedule notes. */
  lookaheadSec?: number
}

/**
 * Pure timing core: songTime = anchorSong + (now - anchorWall) * rate
 * Schedules notes in a rolling lookahead window.
 */
export function createMidiScheduler(deps: SchedulerDeps): MidiScheduler {
  const lookahead = deps.lookaheadSec ?? 0.85
  let rate: PlaybackRate = 1
  let playing = false
  let songTime = 0
  let anchorWall = 0
  let anchorSong = 0
  let nextIndex = 0
  let raf = 0
  const listeners = new Set<(snap: SchedulerSnapshot) => void>()
  const sorted = [...deps.notes].sort((a, b) => a.time - b.time)
  const scheduledIds = new Set<string>()

  function currentSongTime(): number {
    if (!playing) return songTime
    const t = anchorSong + (deps.now() - anchorWall) * rate
    return Math.min(Math.max(0, t), deps.duration)
  }

  function activeMidisAt(t: number): Set<number> {
    const set = new Set<number>()
    for (const note of sorted) {
      if (note.time > t) break
      if (t >= note.time && t < note.time + note.duration) set.add(note.midi)
    }
    return set
  }

  function emit() {
    const t = currentSongTime()
    const snap: SchedulerSnapshot = {
      songTime: t,
      playing,
      rate,
      activeMidis: activeMidisAt(t),
    }
    for (const l of listeners) l(snap)
  }

  function findNextIndex(t: number): number {
    let i = 0
    while (i < sorted.length && sorted[i].time + sorted[i].duration < t) {
      i += 1
    }
    return i
  }

  /** Schedule notes that start (or are still sounding) within [t0, t0+lookahead]. */
  function scheduleWindow(t0: number) {
    const horizon = t0 + lookahead
    for (let i = nextIndex; i < sorted.length; i += 1) {
      const note = sorted[i]
      if (note.time > horizon) break
      if (scheduledIds.has(note.id)) continue
      const noteEnd = note.time + note.duration
      if (noteEnd <= t0) {
        nextIndex = i + 1
        continue
      }
      const when = Math.max(0, (note.time - t0) / rate)
      const remaining = (noteEnd - Math.max(t0, note.time)) / rate
      if (remaining <= 0.001) {
        nextIndex = i + 1
        continue
      }
      deps.onScheduleNote(note.midi, remaining, when)
      scheduledIds.add(note.id)
      if (note.time < t0) nextIndex = Math.max(nextIndex, i + 1)
    }
    // Advance nextIndex past fully finished notes
    while (
      nextIndex < sorted.length &&
      sorted[nextIndex].time + sorted[nextIndex].duration <= t0
    ) {
      nextIndex += 1
    }
  }

  function reanchorAndSchedule() {
    deps.onCancelScheduled?.()
    scheduledIds.clear()
    // `songTime` is already the desired position (caller updates it first).
    anchorWall = deps.now()
    anchorSong = songTime
    nextIndex = findNextIndex(songTime)
    scheduleWindow(songTime)
  }

  function tick() {
    songTime = currentSongTime()
    if (playing) scheduleWindow(songTime)
    emit()
    if (playing && songTime >= deps.duration - 0.001) {
      playing = false
      songTime = deps.duration
      deps.onCancelScheduled?.()
      scheduledIds.clear()
      emit()
      return
    }
    if (playing) raf = requestAnimationFrame(tick)
  }

  return {
    play() {
      if (playing) return
      if (songTime >= deps.duration) songTime = 0
      playing = true
      reanchorAndSchedule()
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(tick)
      emit()
    },
    pause() {
      if (!playing) return
      songTime = currentSongTime()
      playing = false
      deps.onCancelScheduled?.()
      scheduledIds.clear()
      cancelAnimationFrame(raf)
      emit()
    },
    seek(t: number) {
      songTime = Math.min(Math.max(0, t), deps.duration)
      if (playing) {
        reanchorAndSchedule()
      } else {
        deps.onCancelScheduled?.()
        scheduledIds.clear()
        nextIndex = findNextIndex(songTime)
        emit()
      }
    },
    setRate(r: PlaybackRate) {
      if (playing) {
        songTime = currentSongTime()
        rate = r
        reanchorAndSchedule()
      } else {
        rate = r
        emit()
      }
    },
    getSongTime: currentSongTime,
    isPlaying: () => playing,
    getRate: () => rate,
    dispose() {
      playing = false
      cancelAnimationFrame(raf)
      listeners.clear()
      scheduledIds.clear()
      deps.onCancelScheduled?.()
    },
    subscribe(listener) {
      listeners.add(listener)
      listener({
        songTime: currentSongTime(),
        playing,
        rate,
        activeMidis: activeMidisAt(currentSongTime()),
      })
      return () => listeners.delete(listener)
    },
  }
}

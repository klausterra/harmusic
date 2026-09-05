import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { InstrumentId } from '../catalog/lessons'
import {
  cancelScheduledNotes,
  ensureAudioRunning,
  playMidiNotes,
  setSynthVoice,
} from '../audio/synth'
import {
  awardXp,
  breakCombo,
  hitCombo,
  loadGame,
  saveGame,
  touchStreak,
  unlockBadge,
  type BadgeId,
  type GameState,
} from '../game/progress'
import {
  loadInstrumentPrefs,
  saveInstrumentPrefs,
  type InstrumentPrefs,
} from '../instrument/prefs'
import { MIDI_EXAMPLES } from '../midi/examples'
import {
  parseMidiArrayBuffer,
  pianoRangeForNotes,
  pickDefaultTrack,
} from '../midi/parseMidi'
import { analyzePolyphony, shouldWarnPolyphony } from '../midi/polyphony'
import {
  bonusXpForScore,
  followHighlightNotes,
  judgeHit,
  karaokeCoverage,
  perHitXp,
  scorePercent,
  soundingMidis,
  windowForMode,
} from '../midi/score'
import { createMidiScheduler, type MidiScheduler } from '../midi/scheduler'
import type {
  MidiPlayMode,
  ParsedMidi,
  PlaybackRate,
} from '../midi/types'
import { GameHud } from './GameHud'
import { InstrumentView } from './InstrumentView'
import './MidiPlayer.css'
import './LessonFlow.css'

interface MidiPlayerProps {
  instrument: InstrumentId
}

const RATES: PlaybackRate[] = [0.5, 1, 1.5]

function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

export function MidiPlayer({ instrument }: MidiPlayerProps) {
  const [prefs, setPrefs] = useState<InstrumentPrefs>(() =>
    loadInstrumentPrefs(),
  )
  const [parsed, setParsed] = useState<ParsedMidi | null>(null)
  const [trackIdx, setTrackIdx] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<MidiPlayMode>('listen')
  const [rate, setRate] = useState<PlaybackRate>(1)
  const [songTime, setSongTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [activeMidis, setActiveMidis] = useState<Set<number>>(() => new Set())
  const [pressed, setPressed] = useState<Set<number>>(() => new Set())
  const [hitIds, setHitIds] = useState<Set<string>>(() => new Set())
  const [playedPcs, setPlayedPcs] = useState<Set<number>>(() => new Set())
  const [misses, setMisses] = useState(0)
  const [finishedScore, setFinishedScore] = useState<number | null>(null)
  const [game, setGame] = useState<GameState>(() => loadGame())
  const [flashXp, setFlashXp] = useState<number | null>(null)
  const [newBadge, setNewBadge] = useState<BadgeId | null>(null)
  const [flash, setFlash] = useState<'good' | 'bad' | null>(null)

  const schedRef = useRef<MidiScheduler | null>(null)
  const hitIdsRef = useRef(hitIds)
  hitIdsRef.current = hitIds
  const playedPcsRef = useRef(playedPcs)
  playedPcsRef.current = playedPcs
  const modeRef = useRef(mode)
  modeRef.current = mode
  const finishedRef = useRef(false)
  const wasPlayingRef = useRef(false)

  const track = parsed?.tracks[trackIdx] ?? null
  const notes = useMemo(() => track?.notes ?? [], [track])
  const duration = track?.duration ?? 0

  const polyStats = useMemo(() => analyzePolyphony(notes), [notes])
  const showPolyWarn = shouldWarnPolyphony(instrument, polyStats)
  const pianoRange = useMemo(() => pianoRangeForNotes(notes), [notes])

  useEffect(() => {
    saveInstrumentPrefs(prefs)
  }, [prefs])

  useEffect(() => {
    setSynthVoice(instrument)
  }, [instrument])

  const reward = useCallback((base: number, badge?: BadgeId) => {
    setGame((prev) => {
      let next = touchStreak(prev)
      next = hitCombo(next)
      const before = next.xp
      next = awardXp(next, base)
      if (badge) next = unlockBadge(next, badge)
      if (next.combo >= 5) next = unlockBadge(next, 'combo_5')
      else if (next.combo >= 3) next = unlockBadge(next, 'combo_3')
      saveGame(next)
      setFlashXp(next.xp - before)
      if (badge && !prev.badges.includes(badge)) setNewBadge(badge)
      return next
    })
  }, [])

  const finalizeScore = useCallback(() => {
    const m = modeRef.current
    if (m === 'listen') return
    let score = 0
    if (m === 'karaoke') {
      score = karaokeCoverage(notes, playedPcsRef.current)
    } else {
      score = scorePercent(hitIdsRef.current.size, notes.length)
    }
    setFinishedScore(score)
    const bonus = bonusXpForScore(m, score)
    if (bonus > 0) reward(bonus)
  }, [notes, reward])

  // Single scheduler lifecycle (track / instrument / mode audio policy)
  useEffect(() => {
    schedRef.current?.dispose()
    schedRef.current = null
    cancelScheduledNotes()
    setSongTime(0)
    setPlaying(false)
    setActiveMidis(new Set())
    finishedRef.current = false

    if (!track || notes.length === 0) return

    const sched = createMidiScheduler({
      now: () =>
        typeof performance !== 'undefined'
          ? performance.now() / 1000
          : Date.now() / 1000,
      duration: track.duration,
      notes,
      onScheduleNote: (midi, durationSec, whenSec) => {
        if (modeRef.current === 'rhythm') return
        playMidiNotes([midi], durationSec, whenSec, instrument)
      },
      onCancelScheduled: () => cancelScheduledNotes(),
    })
    sched.setRate(rate)
    schedRef.current = sched

    const unsub = sched.subscribe((snap) => {
      setSongTime(snap.songTime)
      setPlaying(snap.playing)
      setActiveMidis(snap.activeMidis)
      if (
        wasPlayingRef.current &&
        !snap.playing &&
        snap.songTime >= track.duration - 0.05 &&
        !finishedRef.current
      ) {
        finishedRef.current = true
        finalizeScore()
      }
      wasPlayingRef.current = snap.playing
    })

    return () => {
      unsub()
      sched.dispose()
      if (schedRef.current === sched) schedRef.current = null
      cancelScheduledNotes()
    }
    // rate applied via separate effect to preserve position
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track, notes, instrument, finalizeScore])

  useEffect(() => {
    schedRef.current?.setRate(rate)
  }, [rate])

  // Reset game counters when track or mode changes
  useEffect(() => {
    setHitIds(new Set())
    setPlayedPcs(new Set())
    setMisses(0)
    setFinishedScore(null)
    finishedRef.current = false
    setPressed(new Set())
  }, [trackIdx, parsed, mode])

  async function loadBuffer(buffer: ArrayBuffer, name: string) {
    setLoading(true)
    setError(null)
    try {
      const result = await parseMidiArrayBuffer(buffer, name)
      if (result.tracks.length === 0) {
        setError('Nenhuma faixa com notas neste MIDI.')
        setParsed(null)
        return
      }
      setParsed(result)
      setTrackIdx(pickDefaultTrack(result))
    } catch {
      setError('Não foi possível ler o arquivo MIDI.')
      setParsed(null)
    } finally {
      setLoading(false)
    }
  }

  async function onUpload(file: File | null) {
    if (!file) return
    const buf = await file.arrayBuffer()
    await loadBuffer(buf, file.name.replace(/\.midi?$/i, ''))
  }

  async function loadExample(url: string, title: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error('fetch')
      await loadBuffer(await res.arrayBuffer(), title)
    } catch {
      setError('Falha ao carregar o exemplo.')
    } finally {
      setLoading(false)
    }
  }

  async function togglePlay() {
    await ensureAudioRunning()
    setSynthVoice(instrument)
    const sched = schedRef.current
    if (!sched) return
    finishedRef.current = false
    setFinishedScore(null)
    if (sched.isPlaying()) sched.pause()
    else sched.play()
  }

  function onSeek(value: number) {
    schedRef.current?.seek(value)
  }

  function onRate(r: PlaybackRate) {
    setRate(r)
  }

  function changeMode(next: MidiPlayMode) {
    schedRef.current?.pause()
    setMode(next)
    schedRef.current?.seek(0)
  }

  function punish() {
    setGame((prev) => {
      const next = breakCombo(prev)
      saveGame(next)
      return next
    })
  }

  function handleToggle(midi: number) {
    playMidiNotes([midi], 0.28, 0, instrument)
    setPressed((prev) => new Set(prev).add(midi))
    window.setTimeout(() => {
      setPressed((prev) => {
        const n = new Set(prev)
        n.delete(midi)
        return n
      })
    }, 180)

    const pc = ((midi % 12) + 12) % 12
    setPlayedPcs((prev) => new Set(prev).add(pc))

    if (mode === 'listen' || mode === 'karaoke') return

    const t = schedRef.current?.getSongTime() ?? songTime
    const result = judgeHit(
      notes,
      midi,
      t,
      windowForMode(mode),
      hitIdsRef.current,
    )
    if (result.hit && result.noteId) {
      setHitIds((prev) => new Set(prev).add(result.noteId!))
      reward(perHitXp(mode))
      setFlash('good')
      window.setTimeout(() => setFlash(null), 280)
    } else {
      setMisses((m) => m + 1)
      punish()
      setFlash('bad')
      window.setTimeout(() => setFlash(null), 280)
    }
  }

  const highlighted = useMemo(() => {
    if (mode === 'follow-along') {
      return followHighlightNotes(notes, songTime, 0.4, hitIds)
    }
    if (mode === 'rhythm') {
      const set = new Set<number>()
      for (const note of notes) {
        if (hitIds.has(note.id)) continue
        if (Math.abs(note.time - songTime) <= 0.15) set.add(note.midi)
      }
      return set
    }
    if (mode === 'karaoke') return soundingMidis(notes, songTime)
    return activeMidis
  }, [mode, notes, songTime, hitIds, activeMidis])

  const interactive = mode !== 'listen'

  return (
    <section
      className={`midi-player stage${flash === 'good' ? ' stage--good' : ''}${flash === 'bad' ? ' stage--bad' : ''}`}
      data-testid="midi-player"
    >
      <header className="midi-player__head">
        <div>
          <p className="page__kicker">MIDI</p>
          <h1 className="page__hero">Toque o arquivo</h1>
          <p className="page__lead">
            Envie um .mid, ouça no {instrument} e treine nos modos game.
          </p>
        </div>
        <GameHud game={game} flashXp={flashXp} newBadge={newBadge} />
      </header>

      <div className="midi-player__sources">
        <label className="midi-player__upload btn">
          Enviar MIDI
          <input
            type="file"
            accept=".mid,.midi,audio/midi,audio/x-midi"
            data-testid="midi-upload"
            onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
          />
        </label>
        <div className="midi-player__examples" role="group" aria-label="Exemplos">
          {MIDI_EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              type="button"
              className="btn btn--ghost"
              data-testid={`midi-example-${ex.id}`}
              onClick={() => void loadExample(ex.url, ex.title)}
            >
              {ex.title}
            </button>
          ))}
        </div>
      </div>

      {loading ? <p className="shell__muted">Carregando…</p> : null}
      {error ? (
        <p className="midi-player__error" role="alert">
          {error}
        </p>
      ) : null}

      {parsed && track ? (
        <>
          <div className="midi-player__meta">
            <strong>{parsed.name}</strong>
            {parsed.tracks.length > 1 ? (
              <label>
                Faixa{' '}
                <select
                  data-testid="midi-track"
                  value={trackIdx}
                  onChange={(e) => setTrackIdx(Number(e.target.value))}
                >
                  {parsed.tracks.map((t, i) => (
                    <option key={t.index} value={i}>
                      {t.name} ({t.notes.length} notas)
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <span>
                {track.name} · {notes.length} notas
              </span>
            )}
          </div>

          {showPolyWarn ? (
            <p
              className="midi-player__warn"
              role="status"
              data-testid="midi-poly-warn"
            >
              Esta faixa tem acordes densos; o braço pode ficar confuso. Prefira
              uma track melódica ou use piano.
            </p>
          ) : null}

          <div className="midi-player__modes" role="group" aria-label="Modo">
            {(
              [
                ['listen', 'Ouvir'],
                ['rhythm', 'Rhythm'],
                ['follow-along', 'Follow'],
                ['karaoke', 'Karaoke'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={mode === id ? 'is-on' : ''}
                data-testid={`midi-mode-${id}`}
                onClick={() => changeMode(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="midi-player__transport">
            <button
              type="button"
              className="btn"
              data-testid="midi-play"
              onClick={() => void togglePlay()}
            >
              {playing ? 'Pausar' : 'Play'}
            </button>
            <span className="midi-player__time">
              {formatTime(songTime)} / {formatTime(duration)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.01}
              value={Math.min(songTime, duration || 1)}
              data-testid="midi-scrubber"
              aria-label="Posição"
              onChange={(e) => onSeek(Number(e.target.value))}
            />
            <div
              className="midi-player__rates"
              role="group"
              aria-label="Velocidade"
            >
              {RATES.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={rate === r ? 'is-on' : ''}
                  data-testid={`midi-rate-${r}`}
                  onClick={() => onRate(r)}
                >
                  {r}×
                </button>
              ))}
            </div>
          </div>

          {mode !== 'listen' ? (
            <p className="midi-player__scoreline">
              Acertos {hitIds.size}/{notes.length}
              {misses ? ` · misses ${misses}` : ''}
              {finishedScore !== null ? ` · score final ${finishedScore}%` : ''}
            </p>
          ) : null}

          <InstrumentView
            instrument={instrument}
            prefs={prefs}
            onPrefsChange={setPrefs}
            highlighted={highlighted}
            pressed={pressed}
            showLabels
            interactive={interactive}
            onToggle={interactive ? handleToggle : undefined}
            pianoRange={instrument === 'piano' ? pianoRange : undefined}
          />
        </>
      ) : (
        <p className="page__lead">
          Escolha um exemplo ou envie um arquivo .mid / .midi para começar.
        </p>
      )}
    </section>
  )
}

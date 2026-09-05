import { useEffect, useMemo, useRef, useState } from 'react'
import { getLesson } from '../catalog/lessons'
import { buildProgression, noteToMidi } from '../music/theory'
import { ensureAudioRunning, getAudioContext, playMidiNotes } from '../audio/synth'
import { createPitchMonitor } from '../audio/pitch'
import {
  awardXp,
  clearLesson,
  loadGame,
  saveGame,
  touchStreak,
  unlockBadge,
} from '../game/progress'
import { PitchMeter } from './PitchMeter'
import { GameHud } from './GameHud'
import './LessonFlow.css'
import './VoiceModes.css'

const BEAT_SEC = 1.1
const PASS_SCORE = 55

export function VoiceKaraokePlayer({
  nodeId,
  lessonId,
  onExit,
  onCleared,
}: {
  nodeId: string
  lessonId: string
  onExit: () => void
  onCleared: (nodeId: string) => void
}) {
  const lesson = getLesson(lessonId)
  const chords = useMemo(
    () =>
      lesson
        ? buildProgression(lesson.tonic, lesson.sequence, lesson.mode)
        : [],
    [lesson],
  )

  const [phase, setPhase] = useState<'idle' | 'running' | 'result'>('idle')
  const [seg, setSeg] = useState(0)
  const [cents, setCents] = useState<number | null>(null)
  const [inTune, setInTune] = useState(false)
  const [score, setScore] = useState(0)
  const [micError, setMicError] = useState<string | null>(null)
  const [game, setGame] = useState(() => loadGame())

  const targetMidi = useMemo(() => {
    if (!lesson || !chords[seg]) return 60
    return noteToMidi(chords[seg].root, 4)
  }, [lesson, chords, seg])

  const targetRef = useRef(targetMidi)
  targetRef.current = targetMidi
  const monitorRef = useRef<ReturnType<typeof createPitchMonitor> | null>(null)
  const frames = useRef({ ok: 0, total: 0 })

  useEffect(() => () => monitorRef.current?.stop(), [])

  async function start() {
    setMicError(null)
    try {
      await ensureAudioRunning()
      const monitor = createPitchMonitor(() => targetRef.current, {
        centsTolerance: 35,
      })
      await monitor.start()
      monitorRef.current = monitor
      frames.current = { ok: 0, total: 0 }
      setSeg(0)
      setScore(0)
      setPhase('running')
      playSeg(0)
    } catch {
      setMicError('Permita o microfone para o karaoke.')
    }
  }

  function playSeg(i: number) {
    if (!chords[i]) return
    playMidiNotes(chords[i].midi, BEAT_SEC * 0.9)
  }

  useEffect(() => {
    if (phase !== 'running') return
    const sampleId = window.setInterval(() => {
      const s = monitorRef.current?.sample()
      if (!s) return
      setCents(s.cents)
      setInTune(s.inTune)
      frames.current.total += 1
      if (s.inTune) frames.current.ok += 1
    }, 40)

    const ctx = getAudioContext()
    const startAt = ctx.currentTime
    const timers: number[] = []
    chords.forEach((_, i) => {
      if (i === 0) return
      const t = window.setTimeout(
        () => {
          setSeg(i)
          playSeg(i)
        },
        i * BEAT_SEC * 1000,
      )
      timers.push(t)
    })
    const end = window.setTimeout(
      () => finish(),
      chords.length * BEAT_SEC * 1000 + 200,
    )
    timers.push(end)

    void startAt
    return () => {
      window.clearInterval(sampleId)
      timers.forEach((t) => window.clearTimeout(t))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  function finish() {
    monitorRef.current?.stop()
    monitorRef.current = null
    const { ok, total } = frames.current
    const pct = total === 0 ? 0 : Math.round((ok / total) * 100)
    setScore(pct)
    setPhase('result')
    if (pct >= PASS_SCORE) {
      setGame((prev) => {
        let next = touchStreak(prev)
        next = awardXp(next, 80)
        next = unlockBadge(next, 'lesson_clear')
        next = clearLesson(next)
        saveGame(next)
        return next
      })
      onCleared(nodeId)
    }
  }

  if (!lesson) {
    return (
      <div className="stage">
        <p>Progressão não encontrada.</p>
        <button type="button" className="btn" onClick={onExit}>
          Voltar
        </button>
      </div>
    )
  }

  if (phase === 'result') {
    const pass = score >= PASS_SCORE
    return (
      <div className={`stage ${pass ? 'stage--win' : 'stage--bad'}`}>
        <GameHud game={game} flashXp={null} newBadge={null} />
        <section className="panel panel--center">
          <p className="panel__kicker">Karaoke</p>
          <h1>{score}%</h1>
          <p className="panel__hint">
            {pass
              ? `Clear! (mínimo ${PASS_SCORE}%)`
              : `Precisa de ${PASS_SCORE}% — cante a root de cada acorde.`}
          </p>
          <div className="actions">
            {pass ? (
              <button type="button" className="btn" onClick={onExit}>
                Continuar trilha
              </button>
            ) : (
              <button type="button" className="btn" onClick={() => void start()}>
                Tentar de novo
              </button>
            )}
            <button type="button" className="btn btn--ghost" onClick={onExit}>
              Sair
            </button>
          </div>
        </section>
      </div>
    )
  }

  const label = chords[seg]?.label ?? '—'

  return (
    <div className="stage voice-stage">
      <GameHud game={game} flashXp={null} newBadge={null} />
      <section className="panel">
        <div className="panel__head">
          <p className="panel__kicker">Karaoke harmônico</p>
          <h1>{lesson.title}</h1>
          <p className="panel__hint">
            Cante a <strong>fundamental</strong> de cada acorde enquanto a
            progressão toca.
          </p>
        </div>

        {phase === 'idle' ? (
          <div className="actions">
            <button type="button" className="btn" onClick={() => void start()}>
              Começar (microfone)
            </button>
            {micError ? <p className="feedback feedback--bad">{micError}</p> : null}
          </div>
        ) : (
          <>
            <p className="karaoke-now">
              Agora: <strong>{label}</strong>
              <span>
                {seg + 1}/{chords.length}
              </span>
            </p>
            <PitchMeter cents={cents} inTune={inTune} label={label} />
          </>
        )}
      </section>
    </div>
  )
}

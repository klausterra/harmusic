import { useEffect, useMemo, useRef, useState } from 'react'
import { getLesson } from '../catalog/lessons'
import { getScaleDegrees, scaleMidiNotes, midiToHz as theoryMidiToHz } from '../music/theory'
import { ensureAudioRunning, playMidiNotes } from '../audio/synth'
import { createPitchMonitor } from '../audio/pitch'
import {
  awardXp,
  hitCombo,
  loadGame,
  saveGame,
  touchStreak,
  unlockBadge,
} from '../game/progress'
import { PitchMeter } from './PitchMeter'
import { GameHud } from './GameHud'
import './LessonFlow.css'
import './VoiceModes.css'

const HOLD_MS = 600
const DEGREES_TO_SING = [1, 3, 5, 1] as const

export function VoiceTunePlayer({
  nodeId,
  tonicLessonId,
  onExit,
  onCleared,
}: {
  nodeId: string
  tonicLessonId: string
  onExit: () => void
  onCleared: (nodeId: string) => void
}) {
  const lesson = getLesson(tonicLessonId)
  const degrees = useMemo(
    () => (lesson ? getScaleDegrees(lesson.tonic, lesson.mode) : []),
    [lesson],
  )
  const scale = useMemo(
    () => (lesson ? scaleMidiNotes(lesson.tonic, lesson.mode) : []),
    [lesson],
  )

  const [idx, setIdx] = useState(0)
  const [micError, setMicError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [cents, setCents] = useState<number | null>(null)
  const [inTune, setInTune] = useState(false)
  const [hold, setHold] = useState(0)
  const [done, setDone] = useState(false)
  const [game, setGame] = useState(() => loadGame())
  const [flashXp, setFlashXp] = useState<number | null>(null)

  const targetDegree = DEGREES_TO_SING[idx] ?? 1
  const targetMidi = scale[targetDegree - 1] ?? 60
  const targetLabel = degrees[targetDegree - 1]?.roman ?? String(targetDegree)

  const targetRef = useRef(targetMidi)
  targetRef.current = targetMidi
  const monitorRef = useRef<ReturnType<typeof createPitchMonitor> | null>(null)
  const holdStart = useRef<number | null>(null)

  useEffect(() => {
    return () => monitorRef.current?.stop()
  }, [])

  async function enableMic() {
    setMicError(null)
    try {
      await ensureAudioRunning()
      const monitor = createPitchMonitor(() => targetRef.current, {
        centsTolerance: 30,
      })
      await monitor.start()
      monitorRef.current = monitor
      setReady(true)
    } catch {
      setMicError('Permita o microfone para afinar a voz.')
    }
  }

  useEffect(() => {
    if (!ready || done) return
    const id = window.setInterval(() => {
      const sample = monitorRef.current?.sample()
      if (!sample) return
      setCents(sample.cents)
      setInTune(sample.inTune)
      if (sample.inTune && sample.confidence === 'ok') {
        if (holdStart.current == null) holdStart.current = performance.now()
        const elapsed = performance.now() - holdStart.current
        setHold(Math.min(1, elapsed / HOLD_MS))
        if (elapsed >= HOLD_MS) {
          holdStart.current = null
          setHold(0)
          if (idx >= DEGREES_TO_SING.length - 1) {
            finish()
          } else {
            setIdx((i) => i + 1)
            setGame((prev) => {
              let next = touchStreak(prev)
              next = hitCombo(next)
              next = awardXp(next, 20)
              saveGame(next)
              queueMicrotask(() => {
                setFlashXp(20)
                window.setTimeout(() => setFlashXp(null), 700)
              })
              return next
            })
          }
        }
      } else {
        holdStart.current = null
        setHold(0)
      }
    }, 50)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, done, idx])

  function finish() {
    setDone(true)
    setGame((prev) => {
      let next = touchStreak(prev)
      next = awardXp(next, 60)
      next = unlockBadge(next, 'ear_open')
      saveGame(next)
      return next
    })
    onCleared(nodeId)
  }

  async function playRef() {
    await ensureAudioRunning()
    playMidiNotes([targetMidi], 0.9)
  }

  if (!lesson) {
    return (
      <div className="stage">
        <p>Lição de referência não encontrada.</p>
        <button type="button" className="btn" onClick={onExit}>
          Voltar
        </button>
      </div>
    )
  }

  if (done) {
    return (
      <div className="stage stage--win">
        <GameHud game={game} flashXp={flashXp} newBadge={null} />
        <section className="panel panel--center">
          <p className="panel__kicker">Voz afinada</p>
          <h1>Graus cantados</h1>
          <p className="panel__hint">Você manteve o tom nos alvos.</p>
          <button type="button" className="btn" onClick={onExit}>
            Continuar trilha
          </button>
        </section>
      </div>
    )
  }

  return (
    <div className="stage voice-stage">
      <GameHud game={game} flashXp={flashXp} newBadge={null} />
      <section className="panel panel--lesson">
        <div className="panel__head">
          <p className="panel__kicker">
            Canto · {idx + 1} de {DEGREES_TO_SING.length}
          </p>
          <h1>Cante {targetLabel}</h1>
          <p className="panel__why">
            Ajuste a voz até o medidor ficar no centro e segure um instante.
          </p>
          <p className="panel__hint">
            Ouça a referência (~{Math.round(theoryMidiToHz(targetMidi))} Hz) e
            sustente a mesma altura.
          </p>
        </div>

        {!ready ? (
          <div className="actions voice-actions">
            <button
              type="button"
              className="btn btn--lg"
              onClick={() => void enableMic()}
            >
              Permitir microfone
            </button>
            {micError ? (
              <p className="feedback feedback--bad">{micError}</p>
            ) : (
              <p className="panel__hint">
                O navegador vai pedir acesso ao microfone — é só para afinar.
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => void playRef()}
              >
                Ouvir referência
              </button>
            </div>
            <PitchMeter cents={cents} inTune={inTune} label={targetLabel} />
            <div className="hold-bar" aria-hidden>
              <i style={{ width: `${hold * 100}%` }} />
            </div>
            <p className="panel__hint">Mantenha no tom por meio segundo.</p>
          </>
        )}
      </section>
    </div>
  )
}

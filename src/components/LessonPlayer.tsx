import type { InstrumentId, LessonDef } from '../catalog/lessons'
import {
  buildProgression,
  getScaleDegrees,
  pitchClassesMatch,
  scaleMidiNotes,
  triadForDegree,
  type Degree,
} from '../music/theory'
import { ensureAudioRunning, playMidiNotes, playSequence } from '../audio/synth'
import {
  awardXp,
  breakCombo,
  clearLesson,
  hitCombo,
  loadGame,
  saveGame,
  touchStreak,
  unlockBadge,
  type BadgeId,
  type GameState,
} from '../game/progress'
import { useMemo, useState } from 'react'
import { GameHud } from './GameHud'
import { InstrumentView } from './InstrumentView'
import './LessonFlow.css'

type StepId = 'see' | 'hear' | 'build' | 'find' | 'play'

const STEPS: { id: StepId; title: string; hint: string; cta: string }[] = [
  {
    id: 'see',
    title: 'Ver',
    hint: 'Olhe o grau / nota e ouça a sonoridade.',
    cta: 'Reconhecer',
  },
  {
    id: 'hear',
    title: 'Ouvir',
    hint: 'Grave o movimento na memória auditiva.',
    cta: 'Escuta ativa',
  },
  {
    id: 'build',
    title: 'Montar',
    hint: 'Monte a sequência na ordem certa.',
    cta: 'Sequenciar',
  },
  {
    id: 'find',
    title: 'Encontrar',
    hint: 'Ache no instrumento (qualquer oitava / casa).',
    cta: 'Localizar',
  },
  {
    id: 'play',
    title: 'Tocar',
    hint: 'Sem destaque. Você conduz.',
    cta: 'Performance',
  },
]

interface LessonPlayerProps {
  lesson: LessonDef
  instrument: InstrumentId
  onExit: () => void
  onCleared?: (lessonId: string) => void
}

export function LessonPlayer({
  lesson,
  instrument,
  onExit,
  onCleared,
}: LessonPlayerProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [focusDegree, setFocusDegree] = useState<Degree>(1)
  const [buildPicks, setBuildPicks] = useState<Degree[]>([])
  const [pressed, setPressed] = useState<Set<number>>(() => new Set())
  const [targetIndex, setTargetIndex] = useState(0)
  const [playIndex, setPlayIndex] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [mood, setMood] = useState<'idle' | 'good' | 'bad' | 'win'>('idle')
  const [game, setGame] = useState<GameState>(() => loadGame())
  const [flashXp, setFlashXp] = useState<number | null>(null)
  const [newBadge, setNewBadge] = useState<BadgeId | null>(null)
  const [seen, setSeen] = useState(false)
  const [heard, setHeard] = useState(false)
  const [celebrate, setCelebrate] = useState(false)

  const degrees = useMemo(
    () => getScaleDegrees(lesson.tonic, lesson.mode),
    [lesson.tonic, lesson.mode],
  )
  const progression = useMemo(
    () => buildProgression(lesson.tonic, lesson.sequence, lesson.mode),
    [lesson],
  )
  const scaleNotes = useMemo(
    () => scaleMidiNotes(lesson.tonic, lesson.mode),
    [lesson.tonic, lesson.mode],
  )

  const isScale = lesson.kind === 'scale'
  const targets = isScale
    ? scaleNotes.map((midi, i) => ({
        degree: lesson.sequence[i] ?? ((i + 1) as Degree),
        midi: [midi],
        label: degrees[i]?.roman ?? String(i + 1),
      }))
    : progression.map((c) => ({
        degree: c.degree,
        midi: c.midi,
        label: c.label,
      }))

  const step = STEPS[stepIndex]
  const findTarget = targets[targetIndex]
  const playTarget = targets[playIndex]

  const highlighted = useMemo(() => {
    if (step.id === 'see' || step.id === 'hear') {
      if (isScale) return new Set([scaleNotes[focusDegree - 1]])
      return new Set(triadForDegree(lesson.tonic, focusDegree, 4, lesson.mode).midi)
    }
    if (step.id === 'find') return new Set(findTarget.midi)
    return new Set<number>()
  }, [step.id, focusDegree, findTarget, isScale, scaleNotes, lesson])

  function reward(
    baseXp: number,
    opts: { hit?: boolean; miss?: boolean; badge?: BadgeId } = {},
  ) {
    setGame((prev) => {
      let next = touchStreak(prev)
      if (opts.miss) next = breakCombo(next)
      if (opts.hit) next = hitCombo(next)
      const beforeXp = next.xp
      next = awardXp(next, baseXp)
      const unlocked: BadgeId[] = []
      const tryBadge = (id: BadgeId) => {
        const n = next.badges.length
        next = unlockBadge(next, id)
        if (next.badges.length > n) unlocked.push(id)
      }
      if (opts.badge) tryBadge(opts.badge)
      if (next.combo >= 3) tryBadge('combo_3')
      if (next.combo >= 5) tryBadge('combo_5')
      if (next.streakDays >= 3) tryBadge('streak_3')
      saveGame(next)
      const gained = next.xp - beforeXp
      queueMicrotask(() => {
        if (gained > 0) {
          setFlashXp(gained)
          window.setTimeout(() => setFlashXp(null), 800)
        }
        if (unlocked[0]) {
          setNewBadge(unlocked[0])
          window.setTimeout(() => setNewBadge(null), 3200)
        }
      })
      return next
    })
  }

  function pulse(kind: 'good' | 'bad' | 'win') {
    setMood(kind)
    window.setTimeout(() => setMood((m) => (m === kind ? 'idle' : m)), 700)
  }

  function resetStep() {
    setBuildPicks([])
    setPressed(new Set())
    setTargetIndex(0)
    setPlayIndex(0)
    setFeedback(null)
    setFocusDegree(1)
    setMood('idle')
  }

  function goTo(i: number) {
    setStepIndex(i)
    resetStep()
  }

  async function hearDegree(degree: Degree) {
    await ensureAudioRunning()
    setFocusDegree(degree)
    if (isScale) playMidiNotes([scaleNotes[degree - 1]])
    else playMidiNotes(triadForDegree(lesson.tonic, degree, 4, lesson.mode).midi)
  }

  async function hearAll(fromStep = true) {
    await ensureAudioRunning()
    if (isScale) playSequence(scaleNotes.map((n) => [n]), 0.45, 0.4)
    else playSequence(progression.map((c) => c.midi))
    if (fromStep) {
      setHeard(true)
      reward(15, { hit: true, badge: 'ear_open' })
      pulse('good')
      setFeedback('Sequência na memória.')
    }
  }

  function pickBuild(degree: Degree) {
    const next = [...buildPicks, degree]
    setBuildPicks(next)
    void hearDegree(degree)
    const expected = lesson.sequence
    if (next.length === expected.length) {
      const ok = next.every((d, i) => d === expected[i])
      if (ok) {
        setFeedback('Ordem correta.')
        reward(40, { hit: true, badge: 'builder' })
        pulse('good')
      } else {
        setFeedback('Ordem errada — tente de novo.')
        reward(2, { miss: true })
        pulse('bad')
        window.setTimeout(() => setBuildPicks([]), 650)
      }
    }
  }

  function toggleKey(midi: number) {
    void ensureAudioRunning().then(() => playMidiNotes([midi], 0.32))
    setPressed((prev) => {
      const n = new Set(prev)
      if (n.has(midi)) n.delete(midi)
      else n.add(midi)
      return n
    })
  }

  function checkFind() {
    if (pitchClassesMatch(pressed, findTarget.midi)) {
      if (targetIndex >= targets.length - 1) {
        setFeedback('Mapa completo.')
        reward(50, { hit: true, badge: 'finder' })
        pulse('good')
      } else {
        setFeedback(`+ ${findTarget.label}`)
        reward(20, { hit: true })
        pulse('good')
        setTargetIndex((i) => i + 1)
        setPressed(new Set())
      }
    } else {
      setFeedback('Ajuste as notas.')
      reward(1, { miss: true })
      pulse('bad')
    }
  }

  function checkPlay() {
    if (pitchClassesMatch(pressed, playTarget.midi)) {
      if (playIndex >= targets.length - 1) {
        setFeedback('Clear!')
        setGame((prev) => {
          let next = touchStreak(prev)
          next = hitCombo(next)
          next = awardXp(next, lesson.xpReward)
          next = unlockBadge(next, 'freestyle')
          next = unlockBadge(next, 'lesson_clear')
          next = clearLesson(next)
          saveGame(next)
          queueMicrotask(() => {
            setFlashXp(lesson.xpReward)
            setNewBadge('lesson_clear')
            window.setTimeout(() => setFlashXp(null), 800)
            window.setTimeout(() => setNewBadge(null), 3200)
          })
          return next
        })
        onCleared?.(lesson.id)
        setMood('win')
        setCelebrate(true)
        window.setTimeout(() => setCelebrate(false), 2800)
      } else {
        setFeedback(`Segue · ${targets[playIndex + 1].label}`)
        reward(25, { hit: true })
        pulse('good')
        setPlayIndex((i) => i + 1)
        setPressed(new Set())
      }
    } else {
      setFeedback('Ouça a referência e tente de novo.')
      reward(1, { miss: true })
      pulse('bad')
    }
  }

  const buildDone =
    buildPicks.length === lesson.sequence.length &&
    buildPicks.every((d, i) => d === lesson.sequence[i])
  const findDone = Boolean(feedback?.includes('Mapa completo'))
  const playDone = Boolean(feedback?.includes('Clear'))
  const canAdvance =
    stepIndex < STEPS.length - 1 &&
    ((step.id === 'see' && seen) ||
      (step.id === 'hear' && heard) ||
      (step.id === 'build' && buildDone) ||
      (step.id === 'find' && findDone))

  const buildChoices = (
    isScale ? lesson.sequence : ([...new Set(lesson.sequence)] as Degree[])
  )

  return (
    <div className={`stage ${mood !== 'idle' ? `stage--${mood}` : ''}`}>
      {celebrate ? <div className="stage__burst" aria-hidden /> : null}

      <div className="lesson-bar">
        <button type="button" className="btn btn--ghost" onClick={onExit}>
          ← Catálogo
        </button>
        <div className="lesson-bar__meta">
          <strong>{lesson.title}</strong>
          <span>{instrument}</span>
        </div>
      </div>

      <GameHud game={game} flashXp={flashXp} newBadge={newBadge} />

      <nav className="steps" aria-label="Etapas">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={[
              'steps__item',
              i === stepIndex ? 'is-current' : '',
              i < stepIndex ? 'is-done' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => goTo(i)}
          >
            <span>{String(i + 1).padStart(2, '0')}</span>
            {s.title}
          </button>
        ))}
      </nav>

      <section className="panel">
        <div className="panel__head">
          <p className="panel__kicker">{step.cta}</p>
          <h1>{step.title}</h1>
          <p className="panel__hint">{step.hint}</p>
        </div>

        {step.id === 'see' ? (
          <div className="degrees">
            {degrees
              .filter((d) => lesson.sequence.includes(d.degree))
              .map((d) => (
                <button
                  key={d.degree}
                  type="button"
                  className={focusDegree === d.degree ? 'chip is-active' : 'chip'}
                  onClick={() => {
                    setSeen(true)
                    void hearDegree(d.degree)
                    reward(d.degree === 1 ? 10 : 6, {
                      hit: true,
                      badge: d.degree === 1 ? 'first_note' : undefined,
                    })
                  }}
                >
                  <strong>{d.roman}</strong>
                  <span>{d.root}</span>
                </button>
              ))}
          </div>
        ) : null}

        {step.id === 'hear' ? (
          <div className="actions">
            <button type="button" className="btn" onClick={() => void hearAll(true)}>
              Ouvir sequência
            </button>
          </div>
        ) : null}

        {step.id === 'build' ? (
          <div className="build">
            <div className="slots">
              {lesson.sequence.map((deg, i) => {
                const pick = buildPicks[i]
                return (
                  <span key={`${deg}-${i}`} className={pick ? 'slot is-filled' : 'slot'}>
                    {pick ? degrees[pick - 1].roman : '·'}
                  </span>
                )
              })}
            </div>
            <div className="degrees">
              {buildChoices.map((d) => (
                <button key={d} type="button" className="chip" onClick={() => pickBuild(d)}>
                  <strong>{degrees[d - 1].roman}</strong>
                  <span>{degrees[d - 1].root}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step.id === 'find' || step.id === 'play' ? (
          <div className="actions">
            <p className="target">
              Alvo{' '}
              <strong>
                {step.id === 'find' ? findTarget.label : playTarget.label}
              </strong>
            </p>
            {step.id === 'play' ? (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => void hearAll(false)}
              >
                Referência
              </button>
            ) : null}
            <button
              type="button"
              className="btn"
              onClick={step.id === 'find' ? checkFind : checkPlay}
            >
              Checar
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setPressed(new Set())}
            >
              Limpar
            </button>
          </div>
        ) : null}

        <div className="piano-wrap">
          <InstrumentView
            instrument={instrument}
            highlighted={highlighted}
            pressed={
              step.id === 'find' || step.id === 'play' ? pressed : new Set()
            }
            showLabels={step.id !== 'play'}
            interactive={step.id === 'find' || step.id === 'play'}
            onToggle={
              step.id === 'find' || step.id === 'play' ? toggleKey : undefined
            }
          />
        </div>

        {feedback ? (
          <p className={`feedback feedback--${mood}`} role="status">
            {feedback}
          </p>
        ) : null}

        <div className="nav">
          <button
            type="button"
            className="btn btn--ghost"
            disabled={stepIndex === 0}
            onClick={() => goTo(stepIndex - 1)}
          >
            Voltar
          </button>
          <button
            type="button"
            className="btn"
            disabled={stepIndex >= STEPS.length - 1 || !canAdvance}
            onClick={() => goTo(stepIndex + 1)}
          >
            {playDone ? 'Lição completa' : 'Avançar'}
          </button>
        </div>
      </section>
    </div>
  )
}

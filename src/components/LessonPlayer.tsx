import type { InstrumentId, LessonDef } from '../catalog/lessons'
import {
  buildProgression,
  getScaleDegrees,
  pitchClassesMatch,
  scaleMidiNotes,
  triadForDegree,
  type Degree,
} from '../music/theory'
import { ensureAudioRunning, playMidiNotes, playSequence, setSynthVoice } from '../audio/synth'
import {
  loadInstrumentPrefs,
  resolveVoicing,
  saveInstrumentPrefs,
  type InstrumentPrefs,
} from '../instrument/prefs'
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
import { useEffect, useMemo, useState } from 'react'
import { GameHud } from './GameHud'
import { InstrumentView } from './InstrumentView'
import { Hint } from './Hint'
import './LessonFlow.css'

type StepId = 'see' | 'hear' | 'build' | 'find' | 'play'

const STEPS: {
  id: StepId
  title: string
  why: string
  prompt: (lesson: LessonDef) => string
}[] = [
  {
    id: 'see',
    title: 'Ver os graus',
    why: 'Primeiro reconheça cada símbolo e o som dele.',
    prompt: () => 'Toque cada grau abaixo. Quando ouvir todos, seguimos sozinhos.',
  },
  {
    id: 'hear',
    title: 'Ouvir a sequência',
    why: 'Grave a progressão no ouvido antes de montar.',
    prompt: () => 'Ouça a sequência completa uma vez (pode repetir).',
  },
  {
    id: 'build',
    title: 'Montar a ordem',
    why: 'Prove que você sabe a sequência — sem olhar a resposta.',
    prompt: (l) =>
      `Monte na ordem: ${l.sequence.map((d) => romanFallback(d, l)).join(' → ')}`,
  },
  {
    id: 'find',
    title: 'Encontrar no instrumento',
    why: 'Localize as notas certas no seu instrumento.',
    prompt: () => 'Toque as notas destacadas e confirme com Checar.',
  },
  {
    id: 'play',
    title: 'Tocar sem ajuda',
    why: 'Mesma progressão, agora sem destaque — é o teste final.',
    prompt: () => 'Sem luzes. Toque cada alvo e confirme.',
  },
]

function romanFallback(d: Degree, lesson: LessonDef): string {
  const degrees = getScaleDegrees(lesson.tonic, lesson.mode)
  return degrees[d - 1]?.roman ?? String(d)
}

const MAX_HEARTS = 3

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
  const [seenDegrees, setSeenDegrees] = useState<Set<Degree>>(() => new Set())
  const [heard, setHeard] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const [hearts, setHearts] = useState(MAX_HEARTS)
  const [failed, setFailed] = useState(false)
  const [buildDone, setBuildDone] = useState(false)
  const [findDone, setFindDone] = useState(false)
  const [playDone, setPlayDone] = useState(false)
  const [prefs, setPrefs] = useState<InstrumentPrefs>(() => loadInstrumentPrefs())

  useEffect(() => {
    setSynthVoice(instrument)
  }, [instrument])

  function updatePrefs(next: InstrumentPrefs) {
    setPrefs(next)
    saveInstrumentPrefs(next)
  }

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
  const uniqueSeq = [...new Set(lesson.sequence)] as Degree[]
  const seeNeeded = uniqueSeq.length

  const targets = (isScale
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
  ).map((t) => ({
    ...t,
    midi: resolveVoicing(instrument, prefs, t.midi),
  }))

  const step = STEPS[stepIndex]
  const findTarget = targets[targetIndex]
  const playTarget = targets[playIndex]

  const styleHint =
    instrument === 'bass'
      ? `Baixo · ${prefs.bassFrets} trastes · timbre grave`
      : instrument === 'piano'
        ? `Teclado · modo ${prefs.pianoStyle === 'chord' ? 'acorde' : 'solo'}`
        : `Violão · modo ${prefs.guitarStyle === 'chord' ? 'acorde' : 'solo'}`

  const highlighted = useMemo(() => {
    if (step.id === 'see' || step.id === 'hear') {
      if (isScale) return new Set([scaleNotes[focusDegree - 1]])
      const triad = triadForDegree(lesson.tonic, focusDegree, 4, lesson.mode).midi
      return new Set(resolveVoicing(instrument, prefs, triad))
    }
    if (step.id === 'find') return new Set(findTarget.midi)
    return new Set<number>()
  }, [step.id, focusDegree, findTarget, isScale, scaleNotes, lesson, instrument, prefs])

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

  function loseHeart() {
    setHearts((h) => {
      const next = h - 1
      if (next <= 0) setFailed(true)
      return Math.max(0, next)
    })
  }

  function resetStepLocal() {
    setBuildPicks([])
    setPressed(new Set())
    setTargetIndex(0)
    setPlayIndex(0)
    setFeedback(null)
    setFocusDegree(1)
    setMood('idle')
    setBuildDone(false)
    setFindDone(false)
  }

  function goTo(i: number) {
    setStepIndex(i)
    resetStepLocal()
  }

  function restartLesson() {
    setStepIndex(0)
    setSeenDegrees(new Set())
    setHeard(false)
    setPlayDone(false)
    setHearts(MAX_HEARTS)
    setFailed(false)
    setCelebrate(false)
    resetStepLocal()
  }

  async function hearDegree(degree: Degree) {
    await ensureAudioRunning()
    setFocusDegree(degree)
    if (isScale) {
      playMidiNotes([scaleNotes[degree - 1]], 0.9, 0, instrument)
    } else {
      const triad = triadForDegree(lesson.tonic, degree, 4, lesson.mode).midi
      playMidiNotes(resolveVoicing(instrument, prefs, triad), 0.9, 0, instrument)
    }
  }

  async function hearAll(fromStep = true) {
    await ensureAudioRunning()
    if (isScale) {
      playSequence(
        scaleNotes.map((n) => [n]),
        0.45,
        0.4,
        instrument,
      )
    } else {
      playSequence(
        progression.map((c) => resolveVoicing(instrument, prefs, c.midi)),
        0.95,
        0.85,
        instrument,
      )
    }
    if (fromStep) {
      setHeard(true)
      reward(15, { hit: true, badge: 'ear_open' })
      pulse('good')
      setFeedback('Sequência na memória — avançando…')
    }
  }

  function pickBuild(degree: Degree) {
    if (buildDone || failed) return
    const next = [...buildPicks, degree]
    setBuildPicks(next)
    void hearDegree(degree)
    const expected = lesson.sequence
    if (next.length === expected.length) {
      const ok = next.every((d, i) => d === expected[i])
      if (ok) {
        setFeedback('Ordem correta — avançando…')
        setBuildDone(true)
        reward(40, { hit: true, badge: 'builder' })
        pulse('good')
      } else {
        setFeedback('Ordem errada.')
        reward(2, { miss: true })
        pulse('bad')
        loseHeart()
        window.setTimeout(() => setBuildPicks([]), 650)
      }
    }
  }

  function toggleKey(midi: number) {
    void ensureAudioRunning().then(() =>
      playMidiNotes([midi], 0.32, 0, instrument),
    )
    setPressed((prev) => {
      const n = new Set(prev)
      if (n.has(midi)) n.delete(midi)
      else n.add(midi)
      return n
    })
  }

  function checkFind() {
    if (findDone || failed) return
    if (pitchClassesMatch(pressed, findTarget.midi)) {
      if (targetIndex >= targets.length - 1) {
        setFeedback('Mapa completo — avançando…')
        setFindDone(true)
        reward(50, { hit: true, badge: 'finder' })
        pulse('good')
      } else {
        setFeedback(`Ache o próximo: ${targets[targetIndex + 1].label}`)
        reward(20, { hit: true })
        pulse('good')
        setTargetIndex((i) => i + 1)
        setPressed(new Set())
      }
    } else {
      setFeedback('Ajuste as notas do alvo.')
      reward(1, { miss: true })
      pulse('bad')
      loseHeart()
    }
  }

  function checkPlay() {
    if (playDone || failed) return
    if (pitchClassesMatch(pressed, playTarget.midi)) {
      if (playIndex >= targets.length - 1) {
        setFeedback('Clear!')
        setPlayDone(true)
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
      } else {
        setFeedback(`Próximo: ${targets[playIndex + 1].label}`)
        reward(25, { hit: true })
        pulse('good')
        setPlayIndex((i) => i + 1)
        setPressed(new Set())
      }
    } else {
      setFeedback('Ouça a referência e tente de novo.')
      reward(1, { miss: true })
      pulse('bad')
      loseHeart()
    }
  }

  const seenDone = seenDegrees.size >= seeNeeded
  const canAdvance =
    !failed &&
    !playDone &&
    stepIndex < STEPS.length - 1 &&
    ((step.id === 'see' && seenDone) ||
      (step.id === 'hear' && heard) ||
      (step.id === 'build' && buildDone) ||
      (step.id === 'find' && findDone))

  useEffect(() => {
    if (!canAdvance) return
    const t = window.setTimeout(() => goTo(stepIndex + 1), 900)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAdvance, stepIndex])

  const buildChoices = isScale ? lesson.sequence : uniqueSeq

  if (failed) {
    return (
      <div className="stage stage--bad">
        <section className="panel panel--center">
          <p className="panel__kicker">Sem vidas</p>
          <h1>Praticar de novo</h1>
          <p className="panel__hint">
            Três erros nesta lição. Refaça o fluxo — a trilha espera você.
          </p>
          <div className="actions">
            <button type="button" className="btn" onClick={restartLesson}>
              Recomeçar
            </button>
            <button type="button" className="btn btn--ghost" onClick={onExit}>
              Voltar à trilha
            </button>
          </div>
        </section>
      </div>
    )
  }

  if (playDone) {
    return (
      <div className="stage stage--win">
        {celebrate ? <div className="stage__burst" aria-hidden /> : null}
        <GameHud game={game} flashXp={flashXp} newBadge={newBadge} />
        <section className="panel panel--center">
          <p className="panel__kicker">Lição completa</p>
          <h1>{lesson.title}</h1>
          <p className="panel__hint">+{lesson.xpReward} XP · continue a trilha</p>
          <div className="actions">
            <button type="button" className="btn" onClick={onExit} data-testid="lesson-done">
              Continuar trilha
            </button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className={`stage stage--lesson ${mood !== 'idle' ? `stage--${mood}` : ''}`}>
      <div className="lesson-bar">
        <div className="lesson-bar__meta">
          <strong>{lesson.title}</strong>
          <span>
            {instrument === 'piano'
              ? 'Piano'
              : instrument === 'guitar'
                ? 'Violão'
                : 'Baixo'}{' '}
            · {styleHint}
            <Hint text="Acorde = tríade completa. Solo = só a nota raiz. No baixo, ajuste os trastes se precisar." />
          </span>
        </div>
        <div className="hearts" aria-label={`${hearts} vidas`}>
          {Array.from({ length: MAX_HEARTS }, (_, i) => (
            <span key={i} className={i < hearts ? 'heart is-on' : 'heart'}>
              ♥
            </span>
          ))}
        </div>
      </div>

      <GameHud game={game} flashXp={flashXp} newBadge={newBadge} />

      <div className="rail" aria-hidden>
        <i style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }} />
      </div>

      <ol className="steps steps--readonly" aria-label="Progresso da lição">
        {STEPS.map((s, i) => (
          <li
            key={s.id}
            className={[
              'steps__item',
              i === stepIndex ? 'is-current' : '',
              i < stepIndex ? 'is-done' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span>{String(i + 1).padStart(2, '0')}</span>
            {s.title.split(' ')[0]}
          </li>
        ))}
      </ol>

      <section className="panel panel--lesson">
        <div className="panel__head">
          <p className="panel__kicker">
            Etapa {stepIndex + 1} de {STEPS.length}
          </p>
          <h1>{step.title}</h1>
          <p className="panel__why">{step.why}</p>
          <p className="panel__hint" data-testid="lesson-prompt">
            {step.id === 'find'
              ? `Alvo agora: ${findTarget.label}. ${step.prompt(lesson)}`
              : step.id === 'play'
                ? `Alvo agora: ${playTarget.label}. ${step.prompt(lesson)}`
                : step.prompt(lesson)}
          </p>
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
                    setSeenDegrees((prev) => new Set(prev).add(d.degree))
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
            <button
              type="button"
              className="btn"
              onClick={() => void hearAll(true)}
              data-testid="hear-sequence"
            >
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
                  <span
                    key={`${deg}-${i}`}
                    className={pick ? 'slot is-filled' : 'slot'}
                  >
                    {pick ? degrees[pick - 1].roman : '·'}
                  </span>
                )
              })}
            </div>
            <div className="degrees">
              {buildChoices.map((d) => (
                <button
                  key={d}
                  type="button"
                  className="chip"
                  onClick={() => pickBuild(d)}
                >
                  <strong>{degrees[d - 1].roman}</strong>
                  <span>{degrees[d - 1].root}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step.id === 'find' || step.id === 'play' ? (
          <div className="actions">
            {step.id === 'play' ? (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => void hearAll(false)}
              >
                Ouvir referência
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
            prefs={prefs}
            onPrefsChange={updatePrefs}
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
      </section>
    </div>
  )
}

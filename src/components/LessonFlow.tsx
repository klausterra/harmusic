import { useMemo, useState } from 'react'
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
import {
  getScaleDegrees,
  pitchClassesMatch,
  progressionIVVI,
  triadForDegree,
  type Degree,
} from '../music/theory'
import { GameHud } from './GameHud'
import { PianoKeyboard } from './PianoKeyboard'
import './LessonFlow.css'

const TONIC = 'C' as const
type StepId = 'see' | 'hear' | 'build' | 'find' | 'play'

const STEPS: {
  id: StepId
  title: string
  hint: string
  cta: string
}[] = [
  {
    id: 'see',
    title: 'Ver o grau',
    hint: 'Cada número romano é um lugar na tonalidade. Toque e sinta a cor do acorde.',
    cta: 'Explorar graus',
  },
  {
    id: 'hear',
    title: 'Ouvir',
    hint: 'Grave o movimento I → IV → V → I. O ouvido guia o dedo.',
    cta: 'Ouvir progressão',
  },
  {
    id: 'build',
    title: 'Montar',
    hint: 'Escolha os graus na ordem certa. Ritmo mental > pressa.',
    cta: 'Sequenciar',
  },
  {
    id: 'find',
    title: 'Encontrar',
    hint: 'Três notas no piano. Qualquer oitava vale — foque nas classes de altura.',
    cta: 'Localizar no teclado',
  },
  {
    id: 'play',
    title: 'Tocar livre',
    hint: 'Sem luzes. Você é o metrônomo. Toque a progressão completa.',
    cta: 'Performance',
  },
]

export function LessonFlow() {
  const [stepIndex, setStepIndex] = useState(0)
  const [focusDegree, setFocusDegree] = useState<Degree>(1)
  const [buildPicks, setBuildPicks] = useState<Degree[]>([])
  const [pressed, setPressed] = useState<Set<number>>(() => new Set())
  const [findTargetIndex, setFindTargetIndex] = useState(0)
  const [playIndex, setPlayIndex] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [mood, setMood] = useState<'idle' | 'good' | 'bad' | 'win'>('idle')
  const [game, setGame] = useState<GameState>(() => defaultSafeGame())
  const [flashXp, setFlashXp] = useState<number | null>(null)
  const [newBadge, setNewBadge] = useState<BadgeId | null>(null)
  const [seenDegrees, setSeenDegrees] = useState(false)
  const [heardProg, setHeardProg] = useState(false)
  const [celebrate, setCelebrate] = useState(false)

  const degrees = useMemo(() => getScaleDegrees(TONIC), [])
  const progression = useMemo(() => progressionIVVI(TONIC), [])
  const step = STEPS[stepIndex]
  const targetChord = progression[findTargetIndex]
  const playTarget = progression[playIndex]
  const progressPct = ((stepIndex + (mood === 'win' ? 1 : 0)) / STEPS.length) * 100

  const highlighted = useMemo(() => {
    if (step.id === 'see' || step.id === 'hear') {
      return new Set(triadForDegree(TONIC, focusDegree).midi)
    }
    if (step.id === 'find') {
      return new Set(targetChord.midi)
    }
    return new Set<number>()
  }, [step.id, focusDegree, targetChord])

  function reward(
    baseXp: number,
    opts: { hit?: boolean; miss?: boolean; badge?: BadgeId } = {},
  ) {
    setGame((prev) => {
      const touched = touchStreak(prev)
      let next = touched
      if (opts.miss) next = breakCombo(next)
      if (opts.hit) next = hitCombo(next)
      const beforeXp = next.xp
      next = awardXp(next, baseXp)
      const unlocked: BadgeId[] = []
      const tryBadge = (id: BadgeId) => {
        const before = next.badges.length
        next = unlockBadge(next, id)
        if (next.badges.length > before) unlocked.push(id)
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

  function resetStepState() {
    setBuildPicks([])
    setPressed(new Set())
    setFindTargetIndex(0)
    setPlayIndex(0)
    setFeedback(null)
    setFocusDegree(1)
    setMood('idle')
  }

  function goTo(index: number) {
    setStepIndex(index)
    resetStepState()
  }

  async function hearChord(degree: Degree) {
    await ensureAudioRunning()
    setFocusDegree(degree)
    playMidiNotes(triadForDegree(TONIC, degree).midi)
  }

  async function hearProgression(fromStep = true) {
    await ensureAudioRunning()
    playSequence(progression.map((c) => c.midi))
    if (fromStep) {
      setHeardProg(true)
      reward(15, { hit: true, badge: 'ear_open' })
      pulse('good')
      setFeedback('Progressão na memória. Siga para montar.')
    }
  }

  function pickBuild(degree: Degree) {
    const next = [...buildPicks, degree]
    setBuildPicks(next)
    void hearChord(degree)
    const expected = progression.map((c) => c.degree)
    if (next.length === expected.length) {
      const ok = next.every((d, i) => d === expected[i])
      if (ok) {
        setFeedback('Sequência perfeita. Vai pro instrumento.')
        reward(40, { hit: true, badge: 'builder' })
        pulse('good')
      } else {
        setFeedback('Quase — limpe e refaça o caminho I–IV–V–I.')
        reward(2, { miss: true })
        pulse('bad')
        window.setTimeout(() => setBuildPicks([]), 650)
      }
    }
  }

  function toggleKey(midi: number) {
    void ensureAudioRunning().then(() => playMidiNotes([midi], 0.32))
    setPressed((prev) => {
      const next = new Set(prev)
      if (next.has(midi)) next.delete(midi)
      else next.add(midi)
      return next
    })
  }

  function checkFind() {
    if (pitchClassesMatch(pressed, targetChord.midi)) {
      if (findTargetIndex >= progression.length - 1) {
        setFeedback('Mapa completo. Hora de tocar sem luzes.')
        reward(50, { hit: true, badge: 'finder' })
        pulse('good')
      } else {
        setFeedback(`+ ${targetChord.label} · próximo acorde`)
        reward(20, { hit: true })
        pulse('good')
        setFindTargetIndex((i) => i + 1)
        setPressed(new Set())
      }
    } else {
      setFeedback('Ouça de novo as notas destacadas e ajuste.')
      reward(1, { miss: true })
      pulse('bad')
    }
  }

  function checkPlay() {
    if (pitchClassesMatch(pressed, playTarget.midi)) {
      if (playIndex >= progression.length - 1) {
        setFeedback('Clear! Você tocou I–IV–V–I sem auxílio.')
        setGame((prev) => {
          let next = touchStreak(prev)
          next = hitCombo(next)
          next = awardXp(next, 80)
          next = unlockBadge(next, 'freestyle')
          next = unlockBadge(next, 'lesson_clear')
          next = clearLesson(next)
          saveGame(next)
          queueMicrotask(() => {
            setFlashXp(80)
            setNewBadge('lesson_clear')
            window.setTimeout(() => setFlashXp(null), 800)
            window.setTimeout(() => setNewBadge(null), 3200)
          })
          return next
        })
        setMood('win')
        setCelebrate(true)
        window.setTimeout(() => setCelebrate(false), 2800)
      } else {
        setFeedback(`Segura o flow · ${progression[playIndex + 1].label}`)
        reward(25, { hit: true })
        pulse('good')
        setPlayIndex((i) => i + 1)
        setPressed(new Set())
      }
    } else {
      setFeedback('Respira. Ouça a referência e tente o acorde atual.')
      reward(1, { miss: true })
      pulse('bad')
    }
  }

  const buildDone =
    buildPicks.length === progression.length &&
    buildPicks.every((d, i) => d === progression[i].degree)
  const findDone = Boolean(feedback?.includes('Mapa completo'))
  const playDone = Boolean(feedback?.includes('Clear'))

  const canAdvance =
    stepIndex < STEPS.length - 1 &&
    ((step.id === 'see' && seenDegrees) ||
      (step.id === 'hear' && heardProg) ||
      (step.id === 'build' && buildDone) ||
      (step.id === 'find' && findDone) ||
      step.id === 'play')

  return (
    <div className={`stage ${mood !== 'idle' ? `stage--${mood}` : ''}`}>
      {celebrate ? <div className="stage__burst" aria-hidden /> : null}

      <header className="brand">
        <p className="brand__mark">Harmusic</p>
        <p className="brand__line">treino harmônico · piano</p>
      </header>

      <GameHud game={game} flashXp={flashXp} newBadge={newBadge} />

      <div className="rail" aria-hidden>
        <i style={{ width: `${Math.min(progressPct, 100)}%` }} />
      </div>

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

      <section className="panel" aria-labelledby="step-title">
        <div className="panel__head">
          <p className="panel__kicker">{step.cta}</p>
          <h1 id="step-title">{step.title}</h1>
          <p className="panel__hint">{step.hint}</p>
        </div>

        {step.id === 'see' ? (
          <div className="degrees">
            {degrees.map((d) => (
              <button
                key={d.degree}
                type="button"
                className={
                  focusDegree === d.degree ? 'chip is-active' : 'chip'
                }
                onClick={() => {
                  setSeenDegrees(true)
                  void hearChord(d.degree)
                  if (d.degree === 1) {
                    reward(10, { hit: true, badge: 'first_note' })
                  } else {
                    reward(6, { hit: true })
                  }
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
              onClick={() => void hearProgression(true)}
            >
              Play I–IV–V–I
            </button>
            {progression.map((c) => (
              <button
                key={`${c.degree}-${c.label}`}
                type="button"
                className="btn btn--ghost"
                onClick={() => void hearChord(c.degree)}
              >
                {c.label}
              </button>
            ))}
          </div>
        ) : null}

        {step.id === 'build' ? (
          <div className="build">
            <div className="slots" aria-live="polite">
              {progression.map((c, i) => {
                const pick = buildPicks[i]
                return (
                  <span
                    key={`${c.degree}-${i}`}
                    className={pick ? 'slot is-filled' : 'slot'}
                  >
                    {pick ? degrees[pick - 1].roman : '·'}
                  </span>
                )
              })}
            </div>
            <div className="degrees">
              {([1, 4, 5] as Degree[]).map((d) => (
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
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setBuildPicks([])
                setFeedback(null)
              }}
            >
              Reset
            </button>
          </div>
        ) : null}

        {step.id === 'find' ? (
          <div className="actions">
            <p className="target">
              Alvo <strong>{targetChord.label}</strong>
              <span>
                {findTargetIndex + 1}/{progression.length}
              </span>
            </p>
            <button type="button" className="btn" onClick={checkFind}>
              Checar acorde
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

        {step.id === 'play' ? (
          <div className="actions">
            <p className="target">
              Agora <strong>{playTarget.label}</strong>
              <span>
                {playIndex + 1}/{progression.length}
              </span>
            </p>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => void hearProgression(false)}
            >
              Referência
            </button>
            <button type="button" className="btn" onClick={checkPlay}>
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
          <PianoKeyboard
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

function defaultSafeGame(): GameState {
  if (typeof window === 'undefined') {
    return {
      xp: 0,
      combo: 0,
      bestCombo: 0,
      streakDays: 0,
      lastPlayDate: null,
      badges: [],
      lessonsCleared: 0,
      totalHits: 0,
    }
  }
  return loadGame()
}

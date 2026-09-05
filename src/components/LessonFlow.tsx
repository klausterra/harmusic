import { useMemo, useState } from 'react'
import { ensureAudioRunning, playMidiNotes, playSequence } from '../audio/synth'
import {
  getScaleDegrees,
  pitchClassesMatch,
  progressionIVVI,
  triadForDegree,
  type Degree,
} from '../music/theory'
import { PianoKeyboard } from './PianoKeyboard'
import './LessonFlow.css'

const TONIC = 'C' as const
type StepId = 'see' | 'hear' | 'build' | 'find' | 'play'

const STEPS: { id: StepId; title: string; hint: string }[] = [
  {
    id: 'see',
    title: 'Ver o grau',
    hint: 'Olhe o numeral romano e o acorde correspondente em C maior.',
  },
  {
    id: 'hear',
    title: 'Ouvir',
    hint: 'Escute cada acorde da progressão I–IV–V–I.',
  },
  {
    id: 'build',
    title: 'Montar a progressão',
    hint: 'Toque os graus na ordem certa: I, IV, V, I.',
  },
  {
    id: 'find',
    title: 'Encontrar no instrumento',
    hint: 'Monte no piano as três notas do acorde pedido (qualquer oitava).',
  },
  {
    id: 'play',
    title: 'Tocar sem auxílio',
    hint: 'Sem destaque no teclado: toque a progressão completa em sequência.',
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

  const degrees = useMemo(() => getScaleDegrees(TONIC), [])
  const progression = useMemo(() => progressionIVVI(TONIC), [])
  const step = STEPS[stepIndex]
  const targetChord = progression[findTargetIndex]
  const playTarget = progression[playIndex]

  const highlighted = useMemo(() => {
    if (step.id === 'see' || step.id === 'hear') {
      return new Set(triadForDegree(TONIC, focusDegree).midi)
    }
    if (step.id === 'find') {
      return new Set(targetChord.midi)
    }
    return new Set<number>()
  }, [step.id, focusDegree, targetChord])

  function resetStepState() {
    setBuildPicks([])
    setPressed(new Set())
    setFindTargetIndex(0)
    setPlayIndex(0)
    setFeedback(null)
    setFocusDegree(1)
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

  async function hearProgression() {
    await ensureAudioRunning()
    playSequence(progression.map((c) => c.midi))
  }

  function pickBuild(degree: Degree) {
    const next = [...buildPicks, degree]
    setBuildPicks(next)
    void hearChord(degree)
    const expected = progression.map((c) => c.degree)
    if (next.length === expected.length) {
      const ok = next.every((d, i) => d === expected[i])
      setFeedback(ok ? 'Progressão correta. Avance para o instrumento.' : 'Ordem errada — tente de novo.')
      if (!ok) setTimeout(() => setBuildPicks([]), 700)
    }
  }

  function toggleKey(midi: number) {
    void ensureAudioRunning().then(() => playMidiNotes([midi], 0.35))
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
        setFeedback('Todos os acordes encontrados. Pronto para tocar sem auxílio.')
      } else {
        setFeedback(`Acertou ${targetChord.label}. Próximo acorde…`)
        setFindTargetIndex((i) => i + 1)
        setPressed(new Set())
      }
    } else {
      setFeedback('Ainda não. Confira as notas do acorde no destaque.')
    }
  }

  function checkPlay() {
    if (pitchClassesMatch(pressed, playTarget.midi)) {
      if (playIndex >= progression.length - 1) {
        setFeedback('Lição concluída: você tocou I–IV–V–I sem auxílio.')
      } else {
        setFeedback(`Bom. Agora o ${progression[playIndex + 1].label}.`)
        setPlayIndex((i) => i + 1)
        setPressed(new Set())
      }
    } else {
      setFeedback('Ouça de novo a progressão e tente o acorde atual.')
    }
  }

  const buildDone =
    buildPicks.length === progression.length &&
    buildPicks.every((d, i) => d === progression[i].degree)
  const findDone =
    findTargetIndex >= progression.length - 1 &&
    feedback?.includes('Todos')
  const playDone = feedback?.includes('concluída')

  return (
    <div className="lesson">
      <header className="lesson__brand">
        <p className="lesson__wordmark">Harmusic</p>
        <p className="lesson__tagline">
          Ver → ouvir → montar → encontrar → tocar
        </p>
      </header>

      <nav className="lesson__steps" aria-label="Etapas da lição">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={[
              'lesson__step',
              i === stepIndex ? 'is-current' : '',
              i < stepIndex ? 'is-done' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => goTo(i)}
          >
            <span>{i + 1}</span>
            {s.title}
          </button>
        ))}
      </nav>

      <section className="lesson__panel" aria-labelledby="step-title">
        <h1 id="step-title">{step.title}</h1>
        <p className="lesson__hint">{step.hint}</p>

        {step.id === 'see' ? (
          <div className="lesson__degrees">
            {degrees.map((d) => (
              <button
                key={d.degree}
                type="button"
                className={
                  focusDegree === d.degree
                    ? 'degree-chip is-active'
                    : 'degree-chip'
                }
                onClick={() => {
                  setFocusDegree(d.degree)
                  void hearChord(d.degree)
                }}
              >
                <strong>{d.roman}</strong>
                <span>{d.root}</span>
              </button>
            ))}
          </div>
        ) : null}

        {step.id === 'hear' ? (
          <div className="lesson__actions">
            <button type="button" className="btn" onClick={() => void hearProgression()}>
              Ouvir I–IV–V–I
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
          <div className="lesson__build">
            <p className="lesson__slots">
              Sua ordem:{' '}
              {buildPicks.length
                ? buildPicks.map((d) => degrees[d - 1].roman).join(' → ')
                : '—'}
            </p>
            <div className="lesson__degrees">
              {([1, 4, 5] as Degree[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  className="degree-chip"
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
              Limpar
            </button>
          </div>
        ) : null}

        {step.id === 'find' ? (
          <div className="lesson__actions">
            <p>
              Monte: <strong>{targetChord.label}</strong>
            </p>
            <button type="button" className="btn" onClick={checkFind}>
              Verificar acorde
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setPressed(new Set())}
            >
              Limpar teclas
            </button>
          </div>
        ) : null}

        {step.id === 'play' ? (
          <div className="lesson__actions">
            <p>
              Toque agora: <strong>{playTarget.label}</strong> ({playIndex + 1}/
              {progression.length})
            </p>
            <button type="button" className="btn btn--ghost" onClick={() => void hearProgression()}>
              Ouvir referência
            </button>
            <button type="button" className="btn" onClick={checkPlay}>
              Verificar
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setPressed(new Set())}
            >
              Limpar teclas
            </button>
          </div>
        ) : null}

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

        {feedback ? <p className="lesson__feedback" role="status">{feedback}</p> : null}

        <div className="lesson__nav">
          <button
            type="button"
            className="btn btn--ghost"
            disabled={stepIndex === 0}
            onClick={() => goTo(stepIndex - 1)}
          >
            Anterior
          </button>
          <button
            type="button"
            className="btn"
            disabled={
              stepIndex >= STEPS.length - 1 ||
              (step.id === 'build' && !buildDone) ||
              (step.id === 'find' && !findDone) ||
              (step.id === 'play' && !playDone)
            }
            onClick={() => goTo(stepIndex + 1)}
          >
            Próxima etapa
          </button>
        </div>
      </section>
    </div>
  )
}

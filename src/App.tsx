import { useEffect, useState } from 'react'
import { useAuth } from './auth/useAuth'
import {
  getLesson,
  type InstrumentId,
  type LessonDef,
} from './catalog/lessons'
import { flatPathNodes, type PathNode } from './catalog/path'
import { AppShell, type AppRoute } from './components/AppShell'
import { LessonPlayer } from './components/LessonPlayer'
import { VoiceTunePlayer } from './components/VoiceTunePlayer'
import { VoiceKaraokePlayer } from './components/VoiceKaraokePlayer'
import {
  AdminPage,
  HomePage,
  LessonsPage,
  PracticePage,
  ProgressPage,
} from './pages/Pages'
import { LandingPage, type PlanId } from './pages/Landing'
import './components/LessonFlow.css'

const CLEARED_KEY = 'harmusic.cleared.v1'
const INSTRUMENT_KEY = 'harmusic.instrument.v1'
const PLAN_INTENT_KEY = 'harmusic.planIntent.v1'

function loadCleared(): string[] {
  try {
    const raw = localStorage.getItem(CLEARED_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export default function App() {
  const auth = useAuth()
  const [route, setRoute] = useState<AppRoute>({ name: 'home' })
  const [instrument, setInstrument] = useState<InstrumentId>(() => {
    const saved = localStorage.getItem(INSTRUMENT_KEY) as InstrumentId | null
    return saved === 'guitar' || saved === 'bass' || saved === 'piano'
      ? saved
      : 'piano'
  })
  const [cleared, setCleared] = useState<string[]>(() => loadCleared())
  const pathTotal = flatPathNodes().length

  useEffect(() => {
    localStorage.setItem(INSTRUMENT_KEY, instrument)
  }, [instrument])

  useEffect(() => {
    if (route.name === 'admin' && !auth.isAdmin && !auth.loading) {
      setRoute({ name: 'home' })
    }
  }, [route.name, auth.isAdmin, auth.loading])

  function playLesson(lesson: LessonDef) {
    setRoute({ name: 'play', lessonId: lesson.id, instrument })
  }

  function markCleared(nodeId: string) {
    setCleared((prev) => {
      if (prev.includes(nodeId)) return prev
      const next = [...prev, nodeId]
      localStorage.setItem(CLEARED_KEY, JSON.stringify(next))
      return next
    })
  }

  function openNode(node: PathNode) {
    if (node.kind === 'lesson' && node.lessonId) {
      const lesson = getLesson(node.lessonId)
      if (lesson) playLesson(lesson)
      return
    }
    if (node.kind === 'voice-tune') {
      setRoute({ name: 'voice-tune', nodeId: node.id })
      return
    }
    if (node.kind === 'voice-karaoke' && node.lessonId) {
      setRoute({
        name: 'voice-karaoke',
        nodeId: node.id,
        lessonId: node.lessonId,
      })
    }
  }

  const shell = (children: React.ReactNode) => (
    <AppShell
      route={route}
      instrument={instrument}
      cleared={cleared}
      pathTotal={pathTotal}
      onNavigate={setRoute}
      onInstrument={setInstrument}
    >
      {children}
    </AppShell>
  )

  if (auth.loading) {
    return (
      <div className="shell">
        <p className="shell__muted">Carregando sessão…</p>
      </div>
    )
  }

  if (!auth.user) {
    return (
      <div className="shell shell--landing">
        <LandingPage
          onLogin={() => void auth.signInWithGoogle()}
          onSubscribe={(plan: PlanId) => {
            localStorage.setItem(PLAN_INTENT_KEY, plan)
            void auth.signInWithGoogle()
          }}
          error={auth.error}
        />
      </div>
    )
  }

  if (route.name === 'play') {
    const lesson = getLesson(route.lessonId)
    if (!lesson) {
      return shell(<p>Lição não encontrada.</p>)
    }
    return shell(
      <LessonPlayer
        lesson={lesson}
        instrument={route.instrument}
        onExit={() => setRoute({ name: 'home' })}
        onCleared={markCleared}
      />,
    )
  }

  if (route.name === 'voice-tune') {
    const node = flatPathNodes().find((n) => n.id === route.nodeId)
    const tonicLessonId = node?.tonicLessonId ?? 'c-maj-scale'
    return shell(
      <VoiceTunePlayer
        nodeId={route.nodeId}
        tonicLessonId={tonicLessonId}
        onExit={() => setRoute({ name: 'home' })}
        onCleared={markCleared}
      />,
    )
  }

  if (route.name === 'voice-karaoke') {
    return shell(
      <VoiceKaraokePlayer
        nodeId={route.nodeId}
        lessonId={route.lessonId}
        onExit={() => setRoute({ name: 'home' })}
        onCleared={markCleared}
      />,
    )
  }

  return shell(
    <>
      {route.name === 'home' ? (
        <HomePage
          instrument={instrument}
          cleared={cleared}
          onOpenNode={openNode}
        />
      ) : null}
      {route.name === 'lessons' ? (
        <LessonsPage
          instrument={instrument}
          cleared={cleared}
          onPlay={playLesson}
        />
      ) : null}
      {route.name === 'practice' ? (
        <PracticePage
          instrument={instrument}
          cleared={cleared}
          onPick={playLesson}
        />
      ) : null}
      {route.name === 'progress' ? <ProgressPage cleared={cleared} /> : null}
      {route.name === 'admin' && auth.isAdmin ? <AdminPage /> : null}
    </>,
  )
}

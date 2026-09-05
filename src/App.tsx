import { useEffect, useState } from 'react'
import { useAuth } from './auth/useAuth'
import {
  getLesson,
  type InstrumentId,
  type LessonDef,
} from './catalog/lessons'
import { AppShell, type AppRoute } from './components/AppShell'
import { LessonPlayer } from './components/LessonPlayer'
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

  function markCleared(lessonId: string) {
    setCleared((prev) => {
      if (prev.includes(lessonId)) return prev
      const next = [...prev, lessonId]
      localStorage.setItem(CLEARED_KEY, JSON.stringify(next))
      return next
    })
  }

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
      return (
        <AppShell
          route={{ name: 'lessons' }}
          instrument={instrument}
          cleared={cleared}
          onNavigate={setRoute}
          onInstrument={setInstrument}
        >
          <p>Lição não encontrada.</p>
        </AppShell>
      )
    }
    return (
      <AppShell
        route={route}
        instrument={instrument}
        cleared={cleared}
        onNavigate={setRoute}
        onInstrument={setInstrument}
      >
        <LessonPlayer
          lesson={lesson}
          instrument={route.instrument}
          onExit={() => setRoute({ name: 'lessons' })}
          onCleared={markCleared}
        />
      </AppShell>
    )
  }

  return (
    <AppShell
      route={route}
      instrument={instrument}
      cleared={cleared}
      onNavigate={setRoute}
      onInstrument={setInstrument}
    >
      {route.name === 'home' ? (
        <HomePage
          instrument={instrument}
          onOpenLessons={() => setRoute({ name: 'lessons' })}
          onContinue={playLesson}
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
        <PracticePage instrument={instrument} onPick={playLesson} />
      ) : null}
      {route.name === 'progress' ? <ProgressPage cleared={cleared} /> : null}
      {route.name === 'admin' && auth.isAdmin ? <AdminPage /> : null}
    </AppShell>
  )
}

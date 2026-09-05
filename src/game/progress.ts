export type BadgeId =
  | 'first_note'
  | 'ear_open'
  | 'builder'
  | 'finder'
  | 'freestyle'
  | 'combo_3'
  | 'combo_5'
  | 'lesson_clear'
  | 'streak_3'

export interface BadgeDef {
  id: BadgeId
  title: string
  blurb: string
}

export const BADGES: Record<BadgeId, BadgeDef> = {
  first_note: {
    id: 'first_note',
    title: 'Primeira nota',
    blurb: 'Você tocou o primeiro grau.',
  },
  ear_open: {
    id: 'ear_open',
    title: 'Ouvido ligado',
    blurb: 'Ouviu a progressão completa.',
  },
  builder: {
    id: 'builder',
    title: 'Arquiteto harmônico',
    blurb: 'Montou I–IV–V–I na ordem certa.',
  },
  finder: {
    id: 'finder',
    title: 'Caçador de vozes',
    blurb: 'Achou todos os acordes no piano.',
  },
  freestyle: {
    id: 'freestyle',
    title: 'Sem rede',
    blurb: 'Tocou a progressão sem destaque.',
  },
  combo_3: {
    id: 'combo_3',
    title: 'Combo x3',
    blurb: 'Três acertos seguidos.',
  },
  combo_5: {
    id: 'combo_5',
    title: 'Combo x5',
    blurb: 'Cinco acertos seguidos — flow.',
  },
  lesson_clear: {
    id: 'lesson_clear',
    title: 'Clear',
    blurb: 'Completou a lição I–IV–V–I.',
  },
  streak_3: {
    id: 'streak_3',
    title: 'Streak 3',
    blurb: 'Praticou 3 dias seguidos.',
  },
}

export interface GameState {
  xp: number
  combo: number
  bestCombo: number
  streakDays: number
  lastPlayDate: string | null
  badges: BadgeId[]
  lessonsCleared: number
  totalHits: number
}

const STORAGE_KEY = 'harmusic.game.v1'
const XP_PER_LEVEL = 100

export function levelFromXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

export function xpIntoLevel(xp: number): number {
  return xp % XP_PER_LEVEL
}

export function defaultGameState(): GameState {
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

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayKey(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultGameState()
    const parsed = JSON.parse(raw) as Partial<GameState>
    return { ...defaultGameState(), ...parsed, badges: parsed.badges ?? [] }
  } catch {
    return defaultGameState()
  }
}

export function saveGame(state: GameState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function touchStreak(state: GameState): GameState {
  const today = todayKey()
  if (state.lastPlayDate === today) return state
  const nextStreak =
    state.lastPlayDate === yesterdayKey() ? state.streakDays + 1 : 1
  return {
    ...state,
    streakDays: nextStreak,
    lastPlayDate: today,
  }
}

export function awardXp(state: GameState, base: number): GameState {
  const mult = Math.min(1 + state.combo * 0.15, 2.5)
  const gained = Math.round(base * mult)
  return {
    ...state,
    xp: state.xp + gained,
    totalHits: state.totalHits + 1,
  }
}

export function hitCombo(state: GameState): GameState {
  const combo = state.combo + 1
  return {
    ...state,
    combo,
    bestCombo: Math.max(state.bestCombo, combo),
  }
}

export function breakCombo(state: GameState): GameState {
  return { ...state, combo: 0 }
}

export function unlockBadge(state: GameState, id: BadgeId): GameState {
  if (state.badges.includes(id)) return state
  return {
    ...state,
    badges: [...state.badges, id],
    xp: state.xp + 25,
  }
}

export function clearLesson(state: GameState): GameState {
  return {
    ...state,
    lessonsCleared: state.lessonsCleared + 1,
  }
}

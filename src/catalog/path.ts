import { getLesson, type LessonDef } from './lessons'

export type PathNodeKind = 'lesson' | 'voice-tune' | 'voice-karaoke'

export interface PathNode {
  /** Unique id in the learning path (may equal lesson id). */
  id: string
  kind: PathNodeKind
  title: string
  /** Instrument / theory lesson id when kind is lesson or karaoke. */
  lessonId?: string
  /** Tonic hint for voice-tune nodes. */
  tonicLessonId?: string
}

export interface PathUnit {
  id: string
  title: string
  blurb: string
  nodes: PathNode[]
}

/** Ordered Duolingo-style curriculum. */
export const PATH_UNITS: PathUnit[] = [
  {
    id: 'c-foundations',
    title: 'Fundamentos em C',
    blurb: 'Graus, escala e a cadência I–IV–V–I.',
    nodes: [
      {
        id: 'c-maj-degrees',
        kind: 'lesson',
        lessonId: 'c-maj-degrees',
        title: 'Graus de C maior',
      },
      {
        id: 'c-maj-scale',
        kind: 'lesson',
        lessonId: 'c-maj-scale',
        title: 'Escala de C maior',
      },
      {
        id: 'c-maj-1451',
        kind: 'lesson',
        lessonId: 'c-maj-1451',
        title: 'I–IV–V–I em C',
      },
      {
        id: 'voice-tune-c',
        kind: 'voice-tune',
        tonicLessonId: 'c-maj-scale',
        title: 'Cante os graus (C)',
      },
      {
        id: 'voice-karaoke-c1451',
        kind: 'voice-karaoke',
        lessonId: 'c-maj-1451',
        title: 'Cante a progressão I–IV–V–I',
      },
    ],
  },
  {
    id: 'c-progressions',
    title: 'Mais progressões em C',
    blurb: 'Jazz e pop no mesmo tom.',
    nodes: [
      {
        id: 'c-maj-251',
        kind: 'lesson',
        lessonId: 'c-maj-251',
        title: 'ii–V–I em C',
      },
      {
        id: 'c-maj-1645',
        kind: 'lesson',
        lessonId: 'c-maj-1645',
        title: 'I–vi–IV–V em C',
      },
    ],
  },
  {
    id: 'transpose',
    title: 'Transposição',
    blurb: 'Mesma forma, novos tons.',
    nodes: [
      {
        id: 'g-maj-1451',
        kind: 'lesson',
        lessonId: 'g-maj-1451',
        title: 'I–IV–V–I em G',
      },
      {
        id: 'f-maj-1451',
        kind: 'lesson',
        lessonId: 'f-maj-1451',
        title: 'I–IV–V–I em F',
      },
      {
        id: 'd-maj-251',
        kind: 'lesson',
        lessonId: 'd-maj-251',
        title: 'ii–V–I em D',
      },
    ],
  },
  {
    id: 'minor',
    title: 'Modo menor',
    blurb: 'Relativa de C e cadência menor.',
    nodes: [
      {
        id: 'a-min-scale',
        kind: 'lesson',
        lessonId: 'a-min-scale',
        title: 'Escala de A menor',
      },
      {
        id: 'a-min-1451',
        kind: 'lesson',
        lessonId: 'a-min-1451',
        title: 'i–iv–V–i em Am',
      },
      {
        id: 'voice-tune-a',
        kind: 'voice-tune',
        tonicLessonId: 'a-min-scale',
        title: 'Cante os graus (Am)',
      },
    ],
  },
]

export function flatPathNodes(): PathNode[] {
  return PATH_UNITS.flatMap((u) => u.nodes)
}

export function getPathNode(id: string): PathNode | undefined {
  return flatPathNodes().find((n) => n.id === id)
}

export type NodeStatus = 'locked' | 'available' | 'cleared'

export function nodeStatus(
  nodeId: string,
  cleared: readonly string[],
): NodeStatus {
  if (cleared.includes(nodeId)) return 'cleared'
  const node = flatPathNodes().find((n) => n.id === nodeId)
  // Voice practice is always open from the Voz menu / path.
  if (node?.kind === 'voice-tune' || node?.kind === 'voice-karaoke') {
    return 'available'
  }
  const nodes = flatPathNodes()
  const idx = nodes.findIndex((n) => n.id === nodeId)
  if (idx <= 0) return 'available'
  const prev = nodes[idx - 1]
  return cleared.includes(prev.id) ? 'available' : 'locked'
}

export function nextAvailableNode(
  cleared: readonly string[],
): PathNode | undefined {
  return flatPathNodes().find((n) => nodeStatus(n.id, cleared) === 'available')
}

export function unlockedLessons(cleared: readonly string[]): LessonDef[] {
  const ids = new Set<string>()
  for (const node of flatPathNodes()) {
    const status = nodeStatus(node.id, cleared)
    if (status === 'locked') break
    if (node.kind === 'lesson' && node.lessonId) {
      ids.add(node.lessonId)
    }
  }
  return [...ids]
    .map((id) => getLesson(id))
    .filter((l): l is LessonDef => Boolean(l))
}

export function unitProgress(
  unit: PathUnit,
  cleared: readonly string[],
): { done: number; total: number } {
  const total = unit.nodes.length
  const done = unit.nodes.filter((n) => cleared.includes(n.id)).length
  return { done, total }
}

export function voicePathNodes(): PathNode[] {
  return flatPathNodes().filter(
    (n) => n.kind === 'voice-tune' || n.kind === 'voice-karaoke',
  )
}

export function nextVoiceNode(
  cleared: readonly string[],
): PathNode | undefined {
  return voicePathNodes().find((n) => nodeStatus(n.id, cleared) === 'available')
}


import { describe, expect, it } from 'vitest'
import {
  flatPathNodes,
  nextAvailableNode,
  nextVoiceNode,
  nodeStatus,
  unlockedLessons,
  voicePathNodes,
} from './path'

describe('learning path', () => {
  it('starts with first node available', () => {
    expect(nodeStatus('c-maj-degrees', [])).toBe('available')
    expect(nodeStatus('c-maj-scale', [])).toBe('locked')
  })

  it('unlocks next after clear', () => {
    expect(nodeStatus('c-maj-scale', ['c-maj-degrees'])).toBe('available')
    expect(nextAvailableNode(['c-maj-degrees'])?.id).toBe('c-maj-scale')
  })

  it('lists unlocked instrument lessons only', () => {
    const lessons = unlockedLessons(['c-maj-degrees', 'c-maj-scale'])
    expect(lessons.map((l) => l.id)).toEqual([
      'c-maj-degrees',
      'c-maj-scale',
      'c-maj-1451',
    ])
  })

  it('has stable ordered nodes', () => {
    const ids = flatPathNodes().map((n) => n.id)
    expect(ids[0]).toBe('c-maj-degrees')
    expect(ids).toContain('voice-tune-c')
    expect(ids).toContain('voice-karaoke-c1451')
  })

  it('exposes voice nodes for Canto hub', () => {
    const voices = voicePathNodes()
    expect(voices.every((n) => n.kind !== 'lesson')).toBe(true)
    expect(nextVoiceNode([])?.id).toBe('voice-tune-c')
    expect(nodeStatus('voice-karaoke-c1451', [])).toBe('available')
    expect(nodeStatus('voice-tune-a', [])).toBe('available')
  })
})

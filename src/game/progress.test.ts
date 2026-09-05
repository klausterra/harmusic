import { describe, expect, it } from 'vitest'
import {
  awardXp,
  defaultGameState,
  hitCombo,
  levelFromXp,
  unlockBadge,
  xpIntoLevel,
} from './progress'

describe('progress', () => {
  it('levels every 100 xp', () => {
    expect(levelFromXp(0)).toBe(1)
    expect(levelFromXp(99)).toBe(1)
    expect(levelFromXp(100)).toBe(2)
    expect(xpIntoLevel(140)).toBe(40)
  })

  it('applies combo multiplier to xp', () => {
    let s = defaultGameState()
    s = hitCombo(s)
    s = hitCombo(s)
    s = awardXp(s, 10)
    expect(s.xp).toBeGreaterThan(10)
  })

  it('unlocks badge once', () => {
    let s = defaultGameState()
    s = unlockBadge(s, 'first_note')
    s = unlockBadge(s, 'first_note')
    expect(s.badges).toEqual(['first_note'])
  })
})

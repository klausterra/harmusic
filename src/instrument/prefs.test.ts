import { describe, expect, it } from 'vitest'
import { resolveVoicing, type InstrumentPrefs } from './prefs'

const prefsChord: InstrumentPrefs = {
  pianoStyle: 'chord',
  guitarStyle: 'chord',
  bassFrets: 12,
}

const prefsSolo: InstrumentPrefs = {
  pianoStyle: 'solo',
  guitarStyle: 'solo',
  bassFrets: 8,
}

const triad = [60, 64, 67]

describe('instrument voicing', () => {
  it('piano chord keeps triad', () => {
    expect(resolveVoicing('piano', prefsChord, triad)).toEqual(triad)
  })

  it('piano solo keeps root only', () => {
    expect(resolveVoicing('piano', prefsSolo, triad)).toEqual([60])
  })

  it('guitar mirrors piano styles', () => {
    expect(resolveVoicing('guitar', prefsSolo, triad)).toEqual([60])
    expect(resolveVoicing('guitar', prefsChord, triad)).toEqual(triad)
  })

  it('bass uses root (+ fifth when frets >= 12)', () => {
    expect(resolveVoicing('bass', prefsChord, triad)).toEqual([60, 64])
    expect(resolveVoicing('bass', prefsSolo, triad)).toEqual([60])
  })
})

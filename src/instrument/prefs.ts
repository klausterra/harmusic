import type { InstrumentId } from '../catalog/lessons'

/** Piano / violão: acorde (tríade) vs solo (nota/root). */
export type PlayStyle = 'chord' | 'solo'

export type BassFrets = 8 | 12 | 15 | 20

export type InstrumentPrefs = {
  pianoStyle: PlayStyle
  guitarStyle: PlayStyle
  bassFrets: BassFrets
}

const KEY = 'harmusic.instrumentPrefs.v1'

export const DEFAULT_PREFS: InstrumentPrefs = {
  pianoStyle: 'chord',
  guitarStyle: 'chord',
  bassFrets: 12,
}

export const BASS_FRET_OPTIONS: BassFrets[] = [8, 12, 15, 20]

export function loadInstrumentPrefs(): InstrumentPrefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    const parsed = JSON.parse(raw) as Partial<InstrumentPrefs>
    return {
      pianoStyle:
        parsed.pianoStyle === 'solo' || parsed.pianoStyle === 'chord'
          ? parsed.pianoStyle
          : DEFAULT_PREFS.pianoStyle,
      guitarStyle:
        parsed.guitarStyle === 'solo' || parsed.guitarStyle === 'chord'
          ? parsed.guitarStyle
          : DEFAULT_PREFS.guitarStyle,
      bassFrets: BASS_FRET_OPTIONS.includes(parsed.bassFrets as BassFrets)
        ? (parsed.bassFrets as BassFrets)
        : DEFAULT_PREFS.bassFrets,
    }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function saveInstrumentPrefs(prefs: InstrumentPrefs): void {
  localStorage.setItem(KEY, JSON.stringify(prefs))
}

export function playStyleFor(
  instrument: InstrumentId,
  prefs: InstrumentPrefs,
): PlayStyle {
  if (instrument === 'piano') return prefs.pianoStyle
  if (instrument === 'guitar') return prefs.guitarStyle
  // Bass is primarily root-focused; "solo" = root, "chord" still plays root+5th
  return 'solo'
}

export function resolveVoicing(
  instrument: InstrumentId,
  prefs: InstrumentPrefs,
  chordMidi: number[],
): number[] {
  if (chordMidi.length === 0) return chordMidi
  const root = chordMidi[0]
  if (instrument === 'bass') {
    // Bass: root always; optional fifth for fuller feel when frets allow
    const fifth = chordMidi[1] ?? root + 7
    return prefs.bassFrets >= 12 ? [root, fifth] : [root]
  }
  const style = playStyleFor(instrument, prefs)
  if (style === 'solo') return [root]
  return chordMidi
}

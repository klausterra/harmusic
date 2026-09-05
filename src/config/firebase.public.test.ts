import { describe, expect, it } from 'vitest'
import { ADMIN_EMAIL, isAdminEmail } from './firebase.public'

describe('admin email', () => {
  it('recognizes the sole admin', () => {
    expect(isAdminEmail(ADMIN_EMAIL)).toBe(true)
    expect(isAdminEmail('KlausQTerra@gmail.com')).toBe(true)
    expect(isAdminEmail('other@gmail.com')).toBe(false)
    expect(isAdminEmail(null)).toBe(false)
  })
})

export const E2E_USER_KEY = 'harmusic.e2e.user'

export type AppUser = {
  uid: string
  email: string | null
  displayName: string | null
}

export function isLocalHost(): boolean {
  if (typeof window === 'undefined') return false
  const h = window.location.hostname
  return h === 'localhost' || h === '127.0.0.1'
}

export function readE2EUser(): AppUser | null {
  if (!isLocalHost()) return null
  try {
    const raw = localStorage.getItem(E2E_USER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { email?: string; displayName?: string }
    if (!parsed.email) return null
    return {
      uid: `e2e-${parsed.email}`,
      email: parsed.email,
      displayName: parsed.displayName ?? parsed.email,
    }
  } catch {
    return null
  }
}

export function writeE2EUser(email: string, displayName?: string): void {
  if (!isLocalHost()) return
  localStorage.setItem(
    E2E_USER_KEY,
    JSON.stringify({ email, displayName: displayName ?? email }),
  )
}

export function clearE2EUser(): void {
  localStorage.removeItem(E2E_USER_KEY)
}

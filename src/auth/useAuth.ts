import { useSyncExternalStore } from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { isAdminEmail } from '../config/firebase.public'
import { getFirebaseAuth } from '../lib/firebase'
import {
  clearE2EUser,
  readE2EUser,
  type AppUser,
  writeE2EUser,
} from './e2e'

export type AuthSnapshot = {
  user: AppUser | null
  isAdmin: boolean
  loading: boolean
  error: string | null
}

let snapshot: AuthSnapshot = {
  user: null,
  isAdmin: false,
  loading: true,
  error: null,
}

const listeners = new Set<() => void>()

function emit(next: AuthSnapshot) {
  snapshot = next
  listeners.forEach((l) => l())
}

function toAppUser(user: {
  uid: string
  email: string | null
  displayName: string | null
}): AppUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  }
}

let started = false

function ensureAuthListener() {
  if (started) return
  started = true

  const e2e = readE2EUser()
  if (e2e) {
    emit({
      user: e2e,
      isAdmin: isAdminEmail(e2e.email),
      loading: false,
      error: null,
    })
    return
  }

  const auth = getFirebaseAuth()
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      emit({ user: null, isAdmin: false, loading: false, error: null })
      return
    }
    const appUser = toAppUser(user)
    emit({
      user: appUser,
      isAdmin: isAdminEmail(appUser.email),
      loading: false,
      error: null,
    })
  })
}

function subscribe(listener: () => void) {
  ensureAuthListener()
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return snapshot
}

export function useAuth(): AuthSnapshot & {
  signInWithGoogle: () => Promise<boolean>
  signOut: () => Promise<void>
  /** Localhost-only helper for automated tests. */
  signInE2E: (email: string, displayName?: string) => void
} {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  async function signInWithGoogle() {
    try {
      const auth = getFirebaseAuth()
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      const result = await signInWithPopup(auth, provider)
      const appUser = toAppUser(result.user)
      emit({
        user: appUser,
        isAdmin: isAdminEmail(appUser.email),
        loading: false,
        error: null,
      })
      return true
    } catch {
      emit({
        ...snapshot,
        loading: false,
        error: 'Não foi possível entrar com Google.',
      })
      return false
    }
  }

  function signInE2E(email: string, displayName?: string) {
    writeE2EUser(email, displayName)
    const user = readE2EUser()
    emit({
      user,
      isAdmin: isAdminEmail(email),
      loading: false,
      error: null,
    })
  }

  async function signOut() {
    clearE2EUser()
    try {
      await firebaseSignOut(getFirebaseAuth())
    } catch {
      /* e2e session may not have firebase user */
    }
    emit({ user: null, isAdmin: false, loading: false, error: null })
  }

  return { ...state, signInWithGoogle, signOut, signInE2E }
}

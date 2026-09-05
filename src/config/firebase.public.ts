/** Public Firebase web config (Harmusic). Not a secret — gated by Auth domains. */
export const FIREBASE_WEB_CONFIG = {
  apiKey: 'AIzaSyBPt7oNLt7FofARTLHGEdi9wgDDwXoys3g',
  authDomain: 'empreenderia.firebaseapp.com',
  projectId: 'empreenderia',
  storageBucket: 'empreenderia.firebasestorage.app',
  messagingSenderId: '761731202727',
  appId: '1:761731202727:web:cf76a2ab7539de7ae76582',
} as const

/** Sole platform administrator. */
export const ADMIN_EMAIL = 'klausqterra@gmail.com'

export function isAdminEmail(email: string | null | undefined): boolean {
  return (email ?? '').trim().toLowerCase() === ADMIN_EMAIL
}

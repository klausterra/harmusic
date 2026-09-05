import { useEffect, useState } from 'react'
import { BrandLogo } from './BrandLogo'
import './InstallPwa.css'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'harmusic.pwa.dismissed.v1'

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  )
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isDismissed(): boolean {
  try {
    const item = localStorage.getItem(DISMISS_KEY)
    if (!item) return false
    const ts = Number.parseInt(item, 10)
    // Re-show prompt after 7 days if user dismissed banner
    return Date.now() - ts < 7 * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

export function useInstallPwa() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(() => isStandalone())
  const [hint, setHint] = useState<'ios' | 'manual' | null>(null)

  useEffect(() => {
    function onBip(e: Event) {
      // Do NOT preventDefault() if we want Chrome's native mini-infobar / ambient prompt to appear automatically
      setDeferred(e as BeforeInstallPromptEvent)
    }
    function onInstalled() {
      setInstalled(true)
      setDeferred(null)
      setHint(null)
    }
    window.addEventListener('beforeinstallprompt', onBip)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBip)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function install() {
    if (deferred) {
      await deferred.prompt()
      const choice = await deferred.userChoice
      if (choice.outcome === 'accepted') {
        setInstalled(true)
      }
      setDeferred(null)
      return
    }
    if (isIos() && !isStandalone()) {
      setHint('ios')
      return
    }
    setHint('manual')
  }

  return {
    canOffer: !installed,
    hasNativePrompt: Boolean(deferred),
    installed,
    hint,
    install,
    dismissHint: () => setHint(null),
  }
}

export function InstallPwaBanner() {
  const { canOffer, install, installed } = useInstallPwa()
  const [dismissed, setDismissed] = useState(() => isDismissed())

  if (!canOffer || installed || dismissed) return null

  function handleDismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString())
    } catch {
      // ignore
    }
    setDismissed(true)
  }

  return (
    <aside className="pwa-banner" aria-label="Instalar aplicativo" data-testid="pwa-banner">
      <div className="pwa-banner__brand">
        <BrandLogo size="sm" showText={false} />
        <div>
          <strong className="pwa-banner__title">Instalar Harmusic</strong>
          <span className="pwa-banner__desc">Acesso rápido offline e sem barra de navegador</span>
        </div>
      </div>
      <div className="pwa-banner__actions">
        <button
          type="button"
          className="btn btn--sm pwa-banner__btn"
          onClick={() => void install()}
        >
          Instalar app
        </button>
        <button
          type="button"
          className="pwa-banner__close"
          onClick={handleDismiss}
          aria-label="Fechar aviso"
        >
          ✕
        </button>
      </div>
    </aside>
  )
}

export function InstallPwaButton({
  className = 'btn btn--ghost',
  label = 'Instalar app',
}: {
  className?: string
  label?: string
}) {
  const { canOffer, hint, install, dismissHint } = useInstallPwa()

  if (!canOffer) return null

  return (
    <div className="install-pwa" data-testid="install-pwa">
      <button
        type="button"
        className={className}
        data-testid="install-pwa-btn"
        onClick={() => void install()}
      >
        {label}
      </button>
      {hint === 'ios' ? (
        <p className="install-pwa__ios" role="status">
          No iPhone/iPad: toque em <strong>Compartilhar</strong> e depois em{' '}
          <strong>Adicionar à Tela de Início</strong>.
          <button
            type="button"
            className="install-pwa__dismiss"
            onClick={dismissHint}
          >
            Ok
          </button>
        </p>
      ) : null}
      {hint === 'manual' ? (
        <p className="install-pwa__ios" role="status">
          No Chrome/Edge: menu <strong>⋮</strong> →{' '}
          <strong>Instalar aplicativo</strong> /{' '}
          <strong>Adicionar à tela inicial</strong>.
          <button
            type="button"
            className="install-pwa__dismiss"
            onClick={dismissHint}
          >
            Ok
          </button>
        </p>
      ) : null}
    </div>
  )
}

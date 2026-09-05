import { useEffect, useState } from 'react'
import './InstallPwa.css'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

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

export function useInstallPwa() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  )
  const [installed, setInstalled] = useState(() => isStandalone())
  const [hint, setHint] = useState<'ios' | 'manual' | null>(null)

  useEffect(() => {
    function onBip(e: Event) {
      e.preventDefault()
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
    installed,
    hint,
    install,
    dismissHint: () => setHint(null),
  }
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

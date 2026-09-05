import { useState } from 'react'
import { BrandLogo } from './BrandLogo'
import './Onboarding.css'

const KEY = 'harmusic.onboarding.v1'

export function shouldShowOnboarding(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'done'
  } catch {
    return true
  }
}

export function markOnboardingDone(): void {
  localStorage.setItem(KEY, 'done')
}

export function Onboarding({
  onDone,
  onStart,
}: {
  onDone: () => void
  onStart: () => void
}) {
  const [step, setStep] = useState(0)

  const steps = [
    {
      title: 'O que é o Harmusic?',
      body: 'Você aprende harmonia tocando de verdade: ver o grau, ouvir, montar no instrumento e cantar — sem teoria solta.',
    },
    {
      title: 'Três caminhos',
      body: 'Início = sua próxima lição. Canto = afinador e karaoke de voz. MIDI = treinar com suas músicas no piano, violão ou baixo.',
    },
    {
      title: 'Como começar',
      body: 'Escolha o instrumento no topo. Toque “Começar agora” e siga uma lição por vez. Cadeado = ainda não liberou.',
    },
  ] as const

  const last = step === steps.length - 1

  function finish(start: boolean) {
    markOnboardingDone()
    onDone()
    if (start) onStart()
  }

  return (
    <div className="onboard" role="dialog" aria-modal="true" data-testid="onboarding">
      <div className="onboard__card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
          <BrandLogo size="lg" showText={false} />
        </div>
        <p className="onboard__kicker">
          Bem-vindo · {step + 1}/{steps.length}
        </p>
        <h2>{steps[step].title}</h2>
        <p>{steps[step].body}</p>
        <div className="onboard__dots" aria-hidden>
          {steps.map((_, i) => (
            <i key={i} className={i === step ? 'is-on' : ''} />
          ))}
        </div>
        <div className="onboard__actions">
          {!last ? (
            <>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => finish(false)}
              >
                Pular
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setStep((s) => s + 1)}
              >
                Próximo
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn"
              data-testid="onboarding-start"
              onClick={() => finish(true)}
            >
              Começar agora
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

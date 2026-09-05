import { InstallPwaButton } from '../components/InstallPwa'
import './Landing.css'

export type PlanId = 'monthly' | 'yearly'

export const PLANS = [
  {
    id: 'monthly' as const,
    name: 'Mensal',
    price: 'R$ 29,90',
    period: '/mês',
    blurb: 'Flexível. Cancele quando quiser.',
    highlight: false,
  },
  {
    id: 'yearly' as const,
    name: 'Anual',
    price: 'R$ 199',
    period: '/ano',
    blurb: '2 meses grátis. O caminho do aluno sério.',
    highlight: true,
    badge: 'Mais escolhido',
  },
] as const

export function LandingPage({
  onLogin,
  onSubscribe,
  error,
}: {
  onLogin: () => void
  onSubscribe: (plan: PlanId) => void
  error: string | null
}) {
  return (
    <div className="sell" data-testid="login-gate">
      <header className="sell__top">
        <span className="sell__logo">Harmusic</span>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          data-testid="login-google-gate"
          onClick={onLogin}
        >
          Entrar
        </button>
      </header>

      <section className="sell__hero" aria-label="Apresentação">
        <p className="sell__brand">Harmusic</p>
        <h1 className="sell__headline">Aprenda harmonia tocando — e cantando.</h1>
        <p className="sell__sub">
          Lições no piano, violão ou baixo, treino de voz e prática com MIDI.
          Fluxo claro: ver → ouvir → montar → encontrar → tocar.
        </p>
        <div className="sell__cta">
          <a className="btn" href="#planos" data-testid="cta-subscribe">
            Ver planos
          </a>
          <button type="button" className="btn btn--ghost" onClick={onLogin}>
            Já sou assinante
          </button>
        </div>
        {error ? <p className="feedback feedback--bad">{error}</p> : null}
      </section>

      <section className="sell__method" aria-labelledby="method-title">
        <h2 id="method-title">O método</h2>
        <p className="sell__section-lead">
          Cinco passos. Sem teoria solta — cada lição termina com você tocando.
        </p>
        <ol className="sell__steps">
          <li>
            <em>01</em> Ver o grau
          </li>
          <li>
            <em>02</em> Ouvir a sonoridade
          </li>
          <li>
            <em>03</em> Montar a progressão
          </li>
          <li>
            <em>04</em> Encontrar no instrumento
          </li>
          <li>
            <em>05</em> Tocar sem auxílio
          </li>
        </ol>
      </section>

      <section className="sell__plans" id="planos" aria-labelledby="plans-title">
        <h2 id="plans-title">Assinatura</h2>
        <p className="sell__section-lead">
          Acesso completo a piano, violão e baixo. App instalável no celular.
        </p>
        <div className="sell__plan-row">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`sell__plan${plan.highlight ? ' is-hot' : ''}`}
              data-testid={`plan-${plan.id}`}
            >
              {'badge' in plan && plan.badge ? (
                <span className="sell__plan-badge">{plan.badge}</span>
              ) : null}
              <h3>{plan.name}</h3>
              <p className="sell__price">
                <strong>{plan.price}</strong>
                <span>{plan.period}</span>
              </p>
              <p className="sell__plan-blurb">{plan.blurb}</p>
              <button
                type="button"
                className={plan.highlight ? 'btn' : 'btn btn--ghost'}
                data-testid={`subscribe-${plan.id}`}
                onClick={() => onSubscribe(plan.id)}
              >
                Assinar {plan.name.toLowerCase()}
              </button>
            </article>
          ))}
        </div>
        <p className="sell__fine">
          Pagamento após login com Google. Cancele quando quiser — sem multa.
        </p>
      </section>

      <footer className="sell__foot">
        <InstallPwaButton className="btn btn--ghost btn--sm" label="Instalar app" />
        <p>Harmusic — treino harmônico interativo</p>
      </footer>
    </div>
  )
}

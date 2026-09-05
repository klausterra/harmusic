import { useState } from 'react'
import { BrandLogo } from '../components/BrandLogo'
import { InstallPwaButton } from '../components/InstallPwa'
import './Landing.css'

export type PlanId = 'monthly' | 'yearly'

export const PLANS = [
  {
    id: 'monthly' as const,
    name: 'Mensal',
    price: 'R$ 29,90',
    period: '/mês',
    blurb: 'Flexível e sem fidelidade. Cancele quando quiser.',
    highlight: false,
    perks: ['Acesso ao Piano, Violão e Baixo', 'Treino vocal com Afinador & Karaoke', 'Player e Jogos MIDI ilimitados', 'Progresso sincronizado e XP'],
  },
  {
    id: 'yearly' as const,
    name: 'Anual',
    price: 'R$ 199',
    period: '/ano',
    blurb: 'Equivale a R$ 16,58/mês. 2 meses grátis.',
    highlight: true,
    badge: 'Mais escolhido',
    perks: ['Tudo do plano mensal', 'Economia de 44% no ano', 'Acesso antecipado a novas lições', 'Suporte prioritário'],
  },
] as const

const FAQS = [
  {
    q: 'Preciso saber ler partitura para usar o Harmusic?',
    a: 'Não! O foco é a harmonia prática de ouvido e no instrumento. Usamos graus romanos (I, IV, V, vi) e cifras diretas no teclado ou braço do violão/baixo.',
  },
  {
    q: 'Posso usar no celular sem baixar pela App Store/Play Store?',
    a: 'Sim. O Harmusic é um PWA completo de última geração: basta tocar em "Instalar app" para ter o ícone na tela inicial, modo tela cheia e carregamento instantâneo.',
  },
  {
    q: 'Como funciona o treino de voz?',
    a: 'O app escuta o microfone do seu dispositivo, detecta o tom exato da sua voz e dá feedback visual se você está cantando no centro da nota ou sustentando a escala da lição.',
  },
  {
    q: 'Como funciona a prática com arquivos MIDI?',
    a: 'Você pode subir qualquer arquivo .mid de música que quiser treinar, diminuir a velocidade, isolar faixas e jogar nos modos Ritmo, Notas e Acordes.',
  },
  {
    q: 'Como funciona o cancelamento?',
    a: 'Sem burocracia ou multas. Você cancela com 1 clique direto pelo painel da sua conta a qualquer momento.',
  },
]

export function LandingPage({
  onLogin,
  onSubscribe,
  error,
}: {
  onLogin: () => void
  onSubscribe: (plan: PlanId) => void
  error: string | null
}) {
  const [activeTab, setActiveTab] = useState<'piano' | 'guitar' | 'voice' | 'midi'>('piano')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="sell" data-testid="login-gate">
      {/* Top Bar */}
      <header className="sell__top">
        <BrandLogo size="md" />
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          data-testid="login-google-gate"
          onClick={onLogin}
        >
          Entrar
        </button>
      </header>

      {/* Hero Section */}
      <section className="sell__hero" aria-label="Apresentação">
        <div className="sell__hero-badge">
          <span className="sell__hero-badge-dot" />
          Harmonia Prática · Ouvido · Instrumento · Canto
        </div>
        <h1 className="sell__headline">
          Domine a harmonia tocando <span className="sell__accent-word">de verdade</span>.
        </h1>
        <p className="sell__sub">
          Sem decoreba nem teoria solta. Aprenda graus, escalas e progressões no piano, violão ou baixo com feedback em tempo real e prática interativa com MIDI.
        </p>

        <div className="sell__cta">
          <a className="btn btn--lg" href="#planos" data-testid="cta-subscribe">
            Começar agora
          </a>
          <button type="button" className="btn btn--ghost btn--lg" onClick={onLogin}>
            Já tenho conta
          </button>
        </div>
        {error ? <p className="feedback feedback--bad">{error}</p> : null}

        {/* Interactive App Mockup / Visual HUD */}
        <div className="sell__mockup" aria-label="Demonstração interativa">
          <div className="sell__mockup-bar">
            <div className="sell__mockup-tabs">
              <button
                type="button"
                className={`sell__mockup-tab ${activeTab === 'piano' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('piano')}
              >
                🎹 Piano
              </button>
              <button
                type="button"
                className={`sell__mockup-tab ${activeTab === 'guitar' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('guitar')}
              >
                🎸 Violão & Baixo
              </button>
              <button
                type="button"
                className={`sell__mockup-tab ${activeTab === 'voice' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('voice')}
              >
                🎤 Treino Vocal
              </button>
              <button
                type="button"
                className={`sell__mockup-tab ${activeTab === 'midi' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('midi')}
              >
                ⚡ Prática MIDI
              </button>
            </div>
            <span className="sell__mockup-pill">Interativo</span>
          </div>

          <div className="sell__mockup-screen">
            {activeTab === 'piano' && (
              <div className="mockup-content">
                <div className="mockup-chord-hud">
                  <div className="mockup-chord-chip is-active">
                    <span className="deg">I</span>
                    <strong>Cmaj</strong>
                    <small>Tônica</small>
                  </div>
                  <div className="mockup-chord-chip">
                    <span className="deg">vi</span>
                    <strong>Am</strong>
                    <small>Relativa</small>
                  </div>
                  <div className="mockup-chord-chip">
                    <span className="deg">IV</span>
                    <strong>Fmaj</strong>
                    <small>Subdominante</small>
                  </div>
                  <div className="mockup-chord-chip">
                    <span className="deg">V</span>
                    <strong>Gdom</strong>
                    <small>Dominante</small>
                  </div>
                </div>

                <div className="mockup-keys" aria-hidden="true">
                  <div className="m-key m-white is-hit"><span>C4</span></div>
                  <div className="m-key m-black" />
                  <div className="m-key m-white"><span>D4</span></div>
                  <div className="m-key m-black" />
                  <div className="m-key m-white is-hit"><span>E4</span></div>
                  <div className="m-key m-white"><span>F4</span></div>
                  <div className="m-key m-black" />
                  <div className="m-key m-white is-hit"><span>G4</span></div>
                  <div className="m-key m-black" />
                  <div className="m-key m-white"><span>A4</span></div>
                  <div className="m-key m-black" />
                  <div className="m-key m-white"><span>B4</span></div>
                  <div className="m-key m-white"><span>C5</span></div>
                </div>
                <p className="mockup-caption">Tríade Maior (1 - 3 - 5) acesa e tocando em sincronia com o metrônomo.</p>
              </div>
            )}

            {activeTab === 'guitar' && (
              <div className="mockup-content">
                <div className="mockup-fretboard" aria-hidden="true">
                  <div className="fret-string">
                    <span className="fret-note is-root" style={{ left: '20%' }}>C</span>
                    <span className="fret-note" style={{ left: '55%' }}>E</span>
                    <span className="fret-note" style={{ left: '85%' }}>G</span>
                  </div>
                  <div className="fret-string">
                    <span className="fret-note" style={{ left: '35%' }}>G</span>
                    <span className="fret-note is-root" style={{ left: '70%' }}>C</span>
                  </div>
                  <div className="fret-string">
                    <span className="fret-note" style={{ left: '55%' }}>E</span>
                    <span className="fret-note" style={{ left: '85%' }}>G</span>
                  </div>
                  <div className="fret-string">
                    <span className="fret-note is-root" style={{ left: '20%' }}>C</span>
                  </div>
                </div>
                <p className="mockup-caption">Mapeamento de formas (CAGED/Tríades) no braço inteiro para violão e baixo.</p>
              </div>
            )}

            {activeTab === 'voice' && (
              <div className="mockup-content">
                <div className="mockup-tuner">
                  <div className="mockup-tuner-gauge">
                    <div className="tuner-needle" />
                    <div className="tuner-center-target">Perfeito</div>
                  </div>
                  <div className="tuner-note-display">
                    <strong>G3</strong>
                    <span>196.0 Hz · 5º Grau da Escala</span>
                  </div>
                </div>
                <p className="mockup-caption">Afinador cromático por microfone que valida se a sua afinação sustenta o grau correto.</p>
              </div>
            )}

            {activeTab === 'midi' && (
              <div className="mockup-content">
                <div className="mockup-midi-timeline">
                  <div className="midi-track">
                    <div className="midi-block" style={{ left: '10%', width: '18%' }}>C4</div>
                    <div className="midi-block" style={{ left: '32%', width: '14%' }}>E4</div>
                    <div className="midi-block" style={{ left: '50%', width: '22%' }}>G4</div>
                    <div className="midi-block is-gold" style={{ left: '76%', width: '20%' }}>C5</div>
                  </div>
                  <div className="midi-playhead" />
                </div>
                <p className="mockup-caption">Suba qualquer arquivo .mid e treine em tempo real nos modos Ritmo, Notas e Acordes.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3 Main Pillars Section */}
      <section className="sell__pillars">
        <h2 className="sell__section-title">Três caminhos de prática contínua</h2>
        <p className="sell__section-lead">
          Um ambiente unificado para você desenvolver ouvido harmônico, técnica e repertório.
        </p>

        <div className="sell__pillars-grid">
          <div className="pillar-card">
            <div className="pillar-card__icon">🎹</div>
            <h3>Harmonia no Instrumento</h3>
            <p>Trilhas estruturadas em piano, violão ou baixo. Aprenda a montar campos harmônicos, tríades, tétrades e entender as progressões mais famosas.</p>
            <ul>
              <li>Visualização simultânea em cifras e graus</li>
              <li>Prática ativa nota por nota com som real</li>
              <li>Avanço progressivo com trava de pré-requisito</li>
            </ul>
          </div>

          <div className="pillar-card is-highlight">
            <div className="pillar-card__icon">🎤</div>
            <h3>Treino de Ouvido & Voz</h3>
            <p>Cantar os graus ancora a harmonia na sua cabeça. Treine afinação, intervalos e cante junto com progressões harmônicas no karaoke.</p>
            <ul>
              <li>Afinador com detecção de pitch pelo microfone</li>
              <li>Exercícios de sustentação de notas da escala</li>
              <li>Karaoke harmônico com arpejos e guias</li>
            </ul>
          </div>

          <div className="pillar-card">
            <div className="pillar-card__icon">⚡</div>
            <h3>Laboratório MIDI & Gamificação</h3>
            <p>Importe suas músicas favoritas em formato MIDI e transforme qualquer canção num jogo de ritmo, precisão de notas ou treino de acordes.</p>
            <ul>
              <li>Controle de velocidade (0.5x até 1.5x)</li>
              <li>Gamificação com Streak, XP diário e Níveis</li>
              <li>Modo offline e instalação direta (PWA)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* The 5-Step Method */}
      <section className="sell__method" aria-labelledby="method-title">
        <h2 id="method-title">O Método Harmusic</h2>
        <p className="sell__section-lead">
          Cinco etapas sequenciais em cada lição para você fixar de verdade na memória muscular e no ouvido.
        </p>
        <ol className="sell__steps">
          <li>
            <em>01</em>
            <div>
              <strong>Ver o grau</strong>
              <p>Entenda a função harmônica na tonalidade (I, ii, iii, IV, V, vi, vii°).</p>
            </div>
          </li>
          <li>
            <em>02</em>
            <div>
              <strong>Ouvir a sonoridade</strong>
              <p>Sinta a tensão, repouso ou brilho do acorde antes de encostar na tecla.</p>
            </div>
          </li>
          <li>
            <em>03</em>
            <div>
              <strong>Montar a progressão</strong>
              <p>Construa as notas que formam o acorde respeitando a armadura de clave.</p>
            </div>
          </li>
          <li>
            <em>04</em>
            <div>
              <strong>Encontrar no instrumento</strong>
              <p>Localize a digitação correta no piano, violão ou baixo.</p>
            </div>
          </li>
          <li>
            <em>05</em>
            <div>
              <strong>Tocar com fluidez</strong>
              <p>Execute no tempo certo sem apoio visual e registre seu XP.</p>
            </div>
          </li>
        </ol>
      </section>

      {/* Plans & Pricing */}
      <section className="sell__plans" id="planos" aria-labelledby="plans-title">
        <h2 id="plans-title">Escolha seu plano</h2>
        <p className="sell__section-lead">
          Acesso ilimitado a todos os instrumentos, lições e modo MIDI.
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
              
              <ul className="sell__plan-perks">
                {plan.perks.map((perk, i) => (
                  <li key={i}>✓ {perk}</li>
                ))}
              </ul>

              <button
                type="button"
                className={plan.highlight ? 'btn btn--lg' : 'btn btn--ghost btn--lg'}
                data-testid={`subscribe-${plan.id}`}
                onClick={() => onSubscribe(plan.id)}
              >
                Assinar {plan.name.toLowerCase()}
              </button>
            </article>
          ))}
        </div>
        <p className="sell__fine">
          Pagamento seguro via Stripe/Google. Cancele quando quiser com 1 clique.
        </p>
      </section>

      {/* FAQ Accordion */}
      <section className="sell__faq" aria-labelledby="faq-title">
        <h2 id="faq-title">Perguntas Frequentes</h2>
        <div className="sell__faq-list">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx
            return (
              <div key={idx} className={`faq-item ${isOpen ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <span className="faq-toggle">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && <p className="faq-answer">{faq.a}</p>}
              </div>
            )
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="sell__foot">
        <div className="sell__foot-brand">
          <BrandLogo size="md" />
          <p>O jeito mais intuitivo de aprender harmonia musical.</p>
        </div>
        <div className="sell__foot-actions">
          <InstallPwaButton className="btn btn--ghost btn--sm" label="Instalar app (PWA)" />
        </div>
        <p className="sell__copyright">
          © {new Date().getFullYear()} Harmusic. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  )
}

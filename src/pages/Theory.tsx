import { Hint } from '../components/Hint'
import './pages.css'
import './theory.css'

const TOPICS = [
  {
    id: 'degrees',
    title: 'Graus',
    lead: 'Os números romanos da harmonia',
    body: `Na tonalidade, cada nota da escala vira um grau: I, ii, iii, IV, V, vi, vii°.
O grau I é a “casa” (tônica). IV e V criam tensão e resolução — a base do rock, pop e MPB.`,
  },
  {
    id: 'progression',
    title: 'Progressões',
    lead: 'Sequências de acordes com função',
    body: `Uma progressão é uma ordem de graus. I–IV–V–I é a cadência clássica: afirma, afasta, tensiona e volta.
ii–V–I é o motor do jazz. I–vi–IV–V é o ciclo do pop.`,
  },
  {
    id: 'method',
    title: 'O método Harmusic',
    lead: 'Ver → ouvir → montar → encontrar → tocar',
    body: `Cada lição passa por cinco micro-objetivos: reconhecer o grau, gravar no ouvido, montar a ordem,
achar no instrumento e tocar sem destaque. Assim a teoria vira hábito motor e auditivo.`,
  },
  {
    id: 'voice',
    title: 'Voz e afinação',
    lead: 'Cantar a root e sentir o centro tonal',
    body: `No afinador, você sustenta o grau alvo enquanto a barra mostra se está grave ou agudo.
No karaoke, a progressão toca e você canta a fundamental de cada acorde no tempo.`,
  },
  {
    id: 'path',
    title: 'Como usar a trilha',
    lead: 'Uma lição por vez',
    body: `Toque Continuar para a próxima lição liberada. Nós com cadeado desbloqueiam na ordem.
Praticar revisa o que já liberou. Teoria (esta página) explica os conceitos sem cronômetro.`,
  },
] as const

export function TheoryPage() {
  return (
    <section className="page page--theory" data-testid="theory-page">
      <header className="theory__hero">
        <p className="page__kicker">área de teoria</p>
        <h1 className="page__hero">
          Entenda antes de tocar
          <Hint text="Leia no seu ritmo. Isso não gasta vidas nem XP — é material de apoio." />
        </h1>
        <p className="page__lead">
          Glossário curto do que aparece nas lições. Passe o mouse (ou toque no ?)
          nos ícones de ajuda pelo app.
        </p>
      </header>

      <div className="theory__grid">
        {TOPICS.map((topic) => (
          <article key={topic.id} className="theory-card" id={topic.id}>
            <h2>
              {topic.title}
              <Hint text={topic.lead} />
            </h2>
            <p className="theory-card__lead">{topic.lead}</p>
            <p className="theory-card__body">{topic.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

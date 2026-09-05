import { Hint, TipBanner } from '../components/Hint'
import './pages.css'
import './theory.css'

const THEORY = [
  {
    id: 'scale',
    title: 'Escala e tonalidade',
    body: `Uma tonalidade é um “centro de gravidade” sonoro. Em C maior, a nota C é a casa: quando a música volta para ela, o ouvido sente conclusão.
A escala maior sobe em intervalos T–T–S–T–T–T–S (tom, tom, semitom…). Em C: C D E F G A B. A menor natural usa a mesma forma a partir de outro ponto — A menor relativa de C usa as mesmas notas (A B C D E F G), mas o centro passa a ser A. Por isso Am e C “parecem parentes”: compartilham o material, mudam a casa.`,
  },
  {
    id: 'degrees',
    title: 'Graus e função',
    body: `Cada degrau da escala vira um grau numerado em romano: I, ii, iii, IV, V, vi, vii°.
Maiúsculo = acorde maior; minúsculo = menor; o ° marca o diminuto.
Função harmônica (o que o grau “quer” fazer):
• I (tônica) — estabilidade, descanso.
• IV (subdominante) — afasta um pouco da casa, prepara movimento.
• V (dominante) — tensão que pede resolução no I.
• ii / vi — coloridos; o ii costuma preparar o V; o vi é o “relativo emocional” do I.
No Harmusic você vê esses romanos nas lições antes de tocar as notas no instrumento.`,
  },
  {
    id: 'triads',
    title: 'Tríades (os acordes de três notas)',
    body: `Um acorde básico empilha a nota do grau + a 3ª + a 5ª acima dela na escala.
Em C maior: I = C–E–G (maior), ii = D–F–A (menor), iii = E–G–B, IV = F–A–C, V = G–B–D, vi = A–C–E, vii° = B–D–F (diminuto).
No piano você monta isso em teclas; no violão/baixo, em posições no braço. O app destaca as notas-alvo; na etapa final o destaque some e você toca de memória.`,
  },
  {
    id: 'progressions',
    title: 'Progressões que você vai treinar',
    body: `I–IV–V–I — cadência clássica do rock, blues e MPB: afirma, afasta, tensiona, volta.
ii–V–I — motor do jazz: o ii prepara o V, o V resolve no I com elegância.
I–vi–IV–V — ciclo do pop; o vi dá cor antes de IV–V.
i–iv–V–i (menor) — no modo menor o V costuma ficar maior (dominante) para a resolução “puxar” com mais força para o i.
Transpor (mesma forma em G, F, D…) não muda a lógica dos graus — só muda as notas absolutas. Por isso o app ensina primeiro em C e depois troca o tom.`,
  },
] as const

const TUTORIAL = [
  {
    id: 'nav',
    title: '1. Navegação',
    body: `• Trilha — sua sequência principal. Use Continuar para a próxima lição liberada.
• Teoria — esta página (conceitos sem cronômetro, sem gastar vidas/XP).
• Praticar — revisa nós que você já desbloqueou.
• MIDI — envia um .mid ou abre um exemplo: ouvir, rhythm, follow ou karaoke no instrumento escolhido.
• Progresso — XP, streak e unidades concluídas.
• Catálogo — lista todas as lições (as bloqueadas só abrem quando a trilha liberar).`,
  },
  {
    id: 'instrument',
    title: '2. Escolha o instrumento',
    body: `No topo do app, alterne Piano, Violão ou Baixo. A mesma lição de graus/progressão adapta o visual (teclado ou braço) e o que conta como acerto. Troque quando quiser — o progresso da trilha é compartilhado.`,
  },
  {
    id: 'method',
    title: '3. As cinco etapas de cada lição',
    body: `1. Ver — reconheça o grau / a sequência em romanos.
2. Ouvir — grave a sonoridade (o app toca a referência).
3. Montar — ordenar a progressão ou o mapa de graus.
4. Encontrar — localizar as notas no instrumento com destaque.
5. Tocar — repetir sem auxílio.
Avance quando a etapa estiver ok; o app passa sozinho após o feedback. No fim você ganha XP e a trilha libera o próximo nó.`,
  },
  {
    id: 'path',
    title: '4. Como a trilha funciona',
    body: `Os nós vêm em unidades (Fundamentos em C → mais progressões → transposição → menor…). Cadeado = ainda não liberou. Conclua o nó atual para abrir o seguinte. Há também nós de voz: cantar graus com o afinador e karaoke da progressão (cantar a fundamental no tempo).`,
  },
  {
    id: 'midi-voice',
    title: '5. Voz e MIDI (extras)',
    body: `Voz (na trilha): o afinador mostra se você está grave/agudo no grau alvo; no karaoke a harmonia toca e você canta a root de cada acorde.
MIDI (menu): carregue um arquivo ou use um exemplo embutido. Modos Ouvir / Rhythm / Follow / Karaoke usam o instrumento selecionado no shell e destacam as notas em sync. Útil para treinar repertório depois das lições guiadas.`,
  },
  {
    id: 'tips',
    title: '6. Dicas rápidas',
    body: `• Os ? no app abrem dicas curtas no contexto.
• Prefira terminar uma unidade em C antes de saltar para outros tons.
• Se travar numa etapa de instrumento, volte a Ouvir e depois Encontrar com o destaque.
• Esta página de Teoria não consome vidas nem XP — leia no seu ritmo e volte para a Trilha.`,
  },
] as const

export function TheoryPage() {
  return (
    <section className="page page--theory" data-testid="theory-page">
      <header className="theory__hero">
        <p className="page__kicker">área de teoria</p>
        <h1 className="page__hero">
          Teoria e como usar o Harmusic
          <Hint text="Leia no seu ritmo. Isso não gasta vidas nem XP — é material de apoio." />
        </h1>
        <p className="page__lead">
          Primeiro o essencial de harmonia tonal. Depois, um tutorial do app:
          trilha, etapas da lição, instrumentos, voz e MIDI.
        </p>
        <TipBanner
          title="O que fazer aqui"
          body="Leia a teoria no seu ritmo (não gasta XP). Use o tutorial abaixo se for a primeira vez no app. Depois volte à Trilha e toque Continuar."
        />
        <nav className="theory__toc" aria-label="Nesta página">
          <a href="#teoria-musical">Teoria musical</a>
          <a href="#tutorial-sistema">Tutorial do sistema</a>
        </nav>
      </header>

      <section className="theory__section" id="teoria-musical" aria-labelledby="teoria-title">
        <h2 id="teoria-title" className="theory__section-title">
          Teoria musical
        </h2>
        <p className="theory__section-lead">
          O mínimo para entender o que os romanos e as lições pedem — sem
          virar um livro de harmonia.
        </p>
        <div className="theory__stack">
          {THEORY.map((topic) => (
            <article key={topic.id} className="theory-block" id={topic.id}>
              <h3>{topic.title}</h3>
              <p className="theory-block__body">{topic.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="theory__section"
        id="tutorial-sistema"
        aria-labelledby="tutorial-title"
      >
        <h2 id="tutorial-title" className="theory__section-title">
          Tutorial do sistema
        </h2>
        <p className="theory__section-lead">
          Como navegar, estudar e praticar no Harmusic do zero ao fim da
          unidade.
        </p>
        <div className="theory__stack">
          {TUTORIAL.map((step) => (
            <article key={step.id} className="theory-block theory-block--tutorial" id={step.id}>
              <h3>{step.title}</h3>
              <p className="theory-block__body">{step.body}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

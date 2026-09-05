# Arquitetura — Harmusic

## Visão
SPA educativa: o aluno percorre um pipeline fixo (ver → ouvir → montar → encontrar → tocar) sobre teoria tonal aplicada a um instrumento.

## Camadas

| Camada | Responsabilidade | Onde |
|--------|------------------|------|
| UI da lição | Etapas, feedback, navegação | `src/components/LessonFlow.tsx` |
| Instrumento | Teclado visual + input | `src/components/PianoKeyboard.tsx` |
| Teoria | Escalas, graus, tríades, progressões | `src/music/theory.ts` |
| Áudio | Osciladores Web Audio | `src/audio/synth.ts` |

## Fluxo de dados
1. `theory` deriva graus e voicings a partir do tônico.
2. `LessonFlow` escolhe o acorde-alvo da etapa.
3. `synth` toca MIDI → Hz sob demanda (AudioContext resumido no gesto do usuário).
4. No piano, pitch classes comparam input do aluno com o alvo.

## Decisões
- **Sem backend no MVP** — estado 100% client-side.
- **Pitch class matching** nas etapas de instrumento — aceita qualquer oitava.
- **Um tom / uma progressão** no MVP para fechar o loop pedagógico.

## Extensões previstas
- Novos instrumentos (violão, baixo) como adapters de input/visual.
- Catálogo de lições (tom, modo, progressão) sem mudar o shell da UI.
- Persistência local de progresso (localStorage) antes de conta/sync.

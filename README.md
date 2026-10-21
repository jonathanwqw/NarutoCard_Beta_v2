# Naruto Card (v2) — jogo local, 100% offline

Jogo de cartas estilo Naruto com criação de personagem, loja, craft, baús e
combate. **Roda só na sua máquina:** não existe servidor de jogo, matchmaking,
Socket.IO, CDN ou qualquer chamada de rede. O jogo inteiro vive nesta pasta e
o progresso fica no `localStorage` do navegador.

## Como jogar (do jeito mais fácil)

| Sistema | O que fazer |
| --- | --- |
| Windows | dê dois cliques em `iniciar-jogo.bat` |
| Linux / macOS | `./iniciar-jogo.sh` (ou `bash iniciar-jogo.sh`) |
| Qualquer um | `npm run dev` |

O script sobe o servidor local em **http://localhost:4173** e abre o navegador
sozinho. Para fechar, basta encerrar a janela/terminal.

> Abra sempre por `http://localhost:4173`. Abrir o `index.html` direto pelo
> explorer não funciona: o navegador bloqueia módulos ES em `file://` (a tela
> explica isso se acontecer).

## Scripts

| Script | O que faz |
| --- | --- |
| `npm run dev` | Servidor estático local (abre o navegador) |
| `npm run build` | Gera `dist/` (roda arte + validador antes) — a pasta final do jogo |
| `npm run art` | Gera a arte SVG procedural de todas as cartas em `assets/cards/` |
| `npm run validate` | Valida dados, efeitos, arte e personagens (falha se algo ficar "sem designer") |
| `npm test` | Suíte de testes do motor, dos dados e da UI (`node --test`) |

Sem dependências: o projeto usa apenas Node (>= 18) para as ferramentas.
`npm install` não instala nada.

## Estrutura da pasta

```
iniciar-jogo.bat / .sh    atalho: sobe o servidor local e abre o navegador
src/
  index.html          página do menu (criação de personagem, loja, deck, inventário…)
  pages/battle.html   página de combate
  data/               FONTE ÚNICA DE DADOS
    cards.js          registro das 81 cartas (id imutável, tipo, custo, efeito…)
    effects.js        catálogo de efeitos + efeitos de equipamento
    elements.js       elementos, cores e multiplicadores
    clans.js          clãs, personagens e atributos
    catalog.js        loja, baús, receitas de craft, fusões e rivais
  core/               motor e infraestrutura (sem DOM, testável)
    engine.js         loop de turnos, dano, defesa, status, fusão e IA local
    effect-runtime.js handlers de todos os efeitos
    card.js           instâncias de carta, fusão e XP
    equipment.js      bônus e efeitos de equipamento
    rng.js            PRNG determinístico (mulberry32)
    save.js           perfil, coleção, deck e moedas (localStorage)
  ui/                 renderização (DOM)
    card-view.js  menu.js  battle.js  audio.js
  styles/             base.css  menu.css  battle.css
assets/cards/         81 artes SVG geradas (uma por carta) + fusion.svg
tools/                build.js  serve.js  generate-art.js  validate.js
tests/                engine.test.js  ui.test.js
dist/                 (opcional) saída do `npm run build`
```

Copie a pasta inteira para outro computador e o jogo continua funcionando —
não há banco de dados, servidor nem instalação.

## Regras do projeto (resumo)

1. **Uma fonte de dados só.** Cartas, efeitos e personagens vivem em `src/data/`.
   A interface nunca inventa números: ela lê do registro.
2. **ID é imutável.** O `id` de uma carta (`jutsu001`, `item005`…) nunca muda,
   porque o `localStorage` e a arte referenciam ele. Para renomear, use o
   campo `aliases` e mantenha o id antigo.
3. **Nenhuma carta sem designer.** Toda carta tem arte, efeito descrito e
   handler implementado. `npm run validate` e `npm test` garantem isso.
4. **Motor sem DOM.** Regras de combate vivem em `src/core/engine.js`; a UI
   só desenha. Efeitos usam o contexto (`draw`, `heal`, `addStatus`…) e nunca
   tocam no HTML.
5. **Modo offline.** Proibido adicionar dependência de rede, WebSocket,
   backend ou CDN ao projeto. O estado do jogador é local.

# Naruto Card (v2) — site estático e local

Jogo de cartas estilo Naruto com criação de personagem, loja, craft, baús e
combate. **Versão 100% local:** não existe servidor de jogo, matchmaking,
Socket.IO nem dependência de rede — tudo roda no navegador e o progresso
fica no `localStorage` do jogador.

## Rodar localmente

```bash
npm run dev      # http://localhost:4173
```

Sem dependências: o projeto usa apenas Node (>= 18) para as ferramentas.
`npm install` não instala nada.

## Scripts

| Script | O que faz |
| --- | --- |
| `npm run dev` | Servidor estático de desenvolvimento (espelha o layout do build) |
| `npm run build` | Gera `dist/` (roda arte + validador antes) — é o que o Render publica |
| `npm run art` | Gera a arte SVG procedural de todas as cartas em `assets/cards/` |
| `npm run validate` | Valida dados, efeitos, arte e personagens (falha se algo ficar "sem designer") |
| `npm test` | Suíte de testes do motor, dos dados e da UI (`node --test`) |

## Estrutura

```
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
```

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
5. **Modo offline.** Proibido adicionar dependência de rede, WebSocket ou
   backend ao projeto. O estado do jogador é local.

## Deploy (Render — site estático)

O `render.yaml` já está configurado:

```yaml
services:
  - type: web
    runtime: static
    buildCommand: npm run build
    staticPublishPath: ./dist
```

1. Suba a branch para o GitHub e conecte o repositório no Render como
   *Static Site*.
2. O Render executa `npm run build` e publica a pasta `dist/`.
3. `npm run build` roda o validador: se qualquer carta ficar sem arte ou sem
   efeito, o deploy falha.

Para publicar em outro lugar (GitHub Pages, Netlify, nginx), basta servir a
pasta `dist/` na raiz do site.

# AGENTS.md — regras para quem mexe neste projeto

Objetivo do repositório: **jogo de cartas local e estático**. Sem online, sem
backend, sem dependências externas. Se uma mudança introduzir rede, servidor
de partida ou matchmaking, ela está fora do escopo.

## Antes de tocar em qualquer coisa

```bash
npm run validate   # dados, efeitos, arte, personagens
npm test           # motor + dados + fumaça da UI
```

Os dois precisam passar. O build (`npm run build`) roda os dois antes de
gerar `dist/`.

## Onde mexer em quê

| Mudança | Arquivo |
| --- | --- |
| Carta nova / ajustar carta | `src/data/cards.js` |
| Efeito novo | `src/data/effects.js` (+ handler em `src/core/effect-runtime.js`) |
| Regra de combate | `src/core/engine.js` |
| Efeito de equipamento | `src/data/effects.js` (`EQUIP_EFFECTS`) + `src/core/equipment.js` |
| Tela do menu | `src/ui/menu.js` + `src/index.html` + `src/styles/menu.css` |
| Tela de combate | `src/ui/battle.js` + `src/pages/battle.html` + `src/styles/battle.css` |
| Arte | `npm run art` (SVG determinístico em `assets/cards/<id>.svg`) |

## Regras invioláveis

1. **Fonte única de dados.** Números de carta (custo, ataque, defesa, efeito)
   existem em `src/data/cards.js` e em mais nenhum lugar. A UI apenas lê.
2. **ID imutável.** Nunca renomeie o `id` de uma carta — o `localStorage` e a
   arte apontam para ele. Para renomear o nome visível, use `aliases` e
   mantenha o id.
3. **Carta sempre "com designer".** Toda carta precisa de:
   - arte em `assets/cards/<id>.svg` (gerada por `npm run art`);
   - efeito descrito em `effects` **ou** `effect` (efeitos de equipamento usam
     `equip_effect`);
   - handler do efeito em `src/core/effect-runtime.js`;
   - se for carta de personagem: `effect`, `cost`, `attack`, `element` e
     `defensePercent` compatíveis com a ficha do personagem.
4. **Motor sem DOM.** `src/core/engine.js` não pode tocar em `document` nem em
   elementos de tela. Efeitos recebem `ctx` com `draw`, `addStatus`,
   `removeStatus`, `heal`, `restoreChakra`, `dealDamage`,
   `discardRandomCard`, `emit` e `log`.
5. **PRNG determinístico.** Partidas reproduzíveis usam `createRng(seed)`; não
   usar `Math.random()` dentro do motor.
6. **Zero dependências.** O projeto roda só com Node >= 18 e o navegador.
7. **Estilo do código:** ESM (`"type": "module"`), 4 espaços, sem comentários
   desnecessários, nomes em português no domínio do jogo (custo, efeitos,
   baús) e em inglês no código de infra.

## Como adicionar uma carta (checklist)

1. Escolha o id seguindo o prefixo do tipo (`jutsu`, `taijutsu`, `item`,
   `genjutsu`, `armor`, `weapon`, `material`, `clone`, `summon`).
2. Registre a carta em `src/data/cards.js` com **todos** os campos
   obrigatórios que o validador exige.
3. Se o efeito é novo, cadastre-o em `src/data/effects.js` e implemente o
   handler em `src/core/effect-runtime.js`.
4. Se é carta de personagem, atualize também `src/data/clans.js`
   (mesmo efeito, custo, ataque, elemento e defesa) e o alias do id.
5. Rode `npm run art && npm run validate && npm test`.
6. Se o efeito é de equipamento, use `equip_effect` e registre o handler em
   `src/core/equipment.js`.

## Deploy

`render.yaml` publica `dist/` (site estático). O `buildCommand` é
`npm run build` — nunca publique a raiz do repositório, e sim `dist/`.

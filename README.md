# NarutoCard_Beta_v2

Jogo de cartas estilo Naruto com criação de personagem e **modo online 1v1 em tempo real**.

## Jogue online (Railway + servidor serve tudo)
O servidor Node.js + Express + Socket.IO serve todo o site e gerencia o matchmaking.

### Rodar localmente
```bash
npm install
npm start
# Acesse http://localhost:3000
```

### Deploy no Railway
1. Suba este repositório no GitHub (ou conecte direto).
2. Crie um novo projeto no [Railway](https://railway.app/) e conecte o repo.
3. Railway detecta o `package.json` e roda `npm start` (porta via `PORT`).
4. O site ficará disponível no domínio `.railway.app` gerado.

**Fluxo:** Crie seu personagem → "Entrar em Batalha" → Entra na fila → Ao encontrar oponente, partida começa (server autoritativo, sincronizado por turnos).

## Estrutura
- `server/server.js` - Servidor online, matchmaking, lógica de partida
- `online/` - Cliente do modo online (reutiliza UI de combate)
- `interface/` - Criação de personagem e menu
- `combate/` - Modo local/legado

/*
 * Naruto Pixel Card Game - Servidor Online (1v1)
 * Node + Express + Socket.IO
 *
 * Responsabilidades:
 *  - Servir o site inteiro (estático)
 *  - Fila de matchmaking 1v1
 *  - Sincronizar a partida por turnos (estado autoritativo no servidor)
 */
"use strict";

const path = require("path");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const ROOT = path.join(__dirname, "..");
app.use(express.static(ROOT));
app.get("/health", (_req, res) => res.json({ ok: true }));

// ---------------------------------------------------------------------------
// Tabela de cartas (subconjunto usado no combate online).
// Tipo: jutsu (dano/efeito). Mantida simples e alinhada ao cardDatabase client.
// ---------------------------------------------------------------------------
const CARDS = {
    jutsu001: { name: "Rasengan", cost: 30, attack: 40, element: "Vento" },
    jutsu002: { name: "Chidori", cost: 35, attack: 45, element: "Raio", critChance: 0.15 },
    jutsu003: { name: "Kage Bunshin", cost: 20, effect: "draw", value: 1 },
    jutsu004: { name: "Bola de Fogo", cost: 25, attack: 35, element: "Fogo" },
    jutsu005: { name: "Dragão de Água", cost: 40, attack: 50, element: "Água" },
    jutsu006: { name: "Parede de Lama", cost: 20, effect: "defense_percent", value: 0.30, duration: 2 },
    jutsu008: { name: "Amaterasu", cost: 55, effect: "burn", value: 30, duration: 3, element: "Fogo" },
    jutsu009: { name: "Susanoo Ribcage", cost: 50, effect: "block_all", duration: 1 },
    jutsu010: { name: "Kamui", cost: 70, effect: "discard", value: 1 },
    jutsu012: { name: "Jutsu Médico", cost: 25, effect: "heal", value: 40 },
    jutsu013: { name: "Genjutsu Sharingan", cost: 30, effect: "discard", value: 1 },
    jutsu014: { name: "Grande Brecha", cost: 35, attack: 40, element: "Vento" },
    jutsu015: { name: "Lança de Pedra", cost: 30, attack: 40, element: "Terra" },
    jutsu016: { name: "Pantera Negra", cost: 45, attack: 55, element: "Raio" },
    jutsu018: { name: "Tsukuyomi", cost: 75, attack: 20, effect: "stun", duration: 1 },
    jutsu019: { name: "Chidori Senbon", cost: 25, attack: 30, element: "Raio" },
    jutsu020: { name: "Chidori Sharp Spear", cost: 35, attack: 45, effect: "ignore_defense", value: 5, element: "Raio" },
    jutsu030: { name: "Oodama Rasengan", cost: 50, attack: 60, element: "Vento" },
    jutsu031: { name: "Clone das Sombras", cost: 25, effect: "draw", value: 2 },
    jutsu032: { name: "Bola de Vácuo", cost: 30, attack: 38, element: "Vento" },
    jutsu033: { name: "Flor de Fênix", cost: 30, attack: 55, hits: 5, element: "Fogo" },
    jutsu034: { name: "Grande Bola de Fogo", cost: 45, attack: 60, effect: "burn", value: 15, duration: 2, element: "Fogo" },
    jutsu035: { name: "Chamas do Dragão", cost: 40, attack: 50, effect: "burn", value: 10, duration: 2, element: "Fogo" },
    jutsu036: { name: "Dragão de Água Explosivo", cost: 45, attack: 55, element: "Água" },
    jutsu037: { name: "Ondas de Água", cost: 30, attack: 40, element: "Água" },
    jutsu038: { name: "Prisão de Água", cost: 35, effect: "discard", value: 1 },
    jutsu039: { name: "Espelhos de Gelo", cost: 45, attack: 60, hits: 3, element: "Água" },
    jutsu040: { name: "Lâmina de Vento", cost: 35, attack: 45, element: "Vento" },
    jutsu042: { name: "Muralha de Terra", cost: 30, effect: "defense_percent", value: 0.30, duration: 2 },
    jutsu043: { name: "Dragão de Terra", cost: 40, attack: 52, element: "Terra" },
    jutsu044: { name: "Fissura Terrestre", cost: 35, attack: 48, element: "Terra" },
    jutsu045: { name: "Poeira Explosiva", cost: 55, attack: 70, effect: "ignore_defense" },
    jutsu046: { name: "Trovão Assassino", cost: 40, attack: 55, element: "Raio" },
    jutsu047: { name: "Armadura de Raio", cost: 30, effect: "defense_flat", value: 40, duration: 2 },
    jutsu048: { name: "Lariat de Raio", cost: 45, attack: 65, effect: "stun", duration: 1, element: "Raio" },
    jutsu049: { name: "Tubarão Faminto", cost: 35, attack: 45, effect: "drain", value: 10, element: "Água" },
    jutsu050: { name: "Bijuu Dama", cost: 70, attack: 90, effect: "ignore_defense" },
    jutsu051: { name: "Flores Demôniacas", cost: 30, effect: "fail_chance", value: 0.5, duration: 1 },
    jutsu052: { name: "Amaterasu Negra", cost: 55, effect: "burn", value: 35, duration: 3, element: "Fogo" },
    jutsu053: { name: "Shinra Tensei", cost: 50, effect: "block_all", duration: 1 },
    jutsu054: { name: "Lâminas de Papel", cost: 25, attack: 35, element: "Vento" },
    jutsu056: { name: "Rasengan Gigante", cost: 55, attack: 75, element: "Vento" },
    taijutsu001: { name: "Chute Dinâmico", cost: 10, attack: 20 },
    taijutsu002: { name: "Rajada Leões", cost: 15, attack: 25 },
    taijutsu003: { name: "Lótus Primária", cost: 40, attack: 60, selfDamage: 10 },
    item001: { name: "Kunai", cost: 5, attack: 10 },
    item003: { name: "Shuriken", cost: 8, attack: 12 },
    item006: { name: "Bandagem", cost: 5, effect: "heal", value: 10 },
    item007: { name: "Veneno", cost: 20, effect: "poison", value: 5, duration: 3 },
    buff001: { name: "Força Interior", cost: 20, effect: "atk_buff", value: 10, duration: 1 },
    buff002: { name: "Concentração", cost: 10, effect: "cost_reduce", value: 10, duration: 1 },
    buff003: { name: "Visão Sharingan", cost: 25, effect: "crit_buff", value: 0.20, duration: 2 },
    debuff001: { name: "Redução de Defesa", cost: 15, effect: "def_down", value: 20, duration: 2 },
    debuff002: { name: "Lentidão", cost: 15, effect: "slow", value: 1, duration: 1 },
    debuff003: { name: "Confusão", cost: 20, effect: "fail_chance", value: 0.5, duration: 1 },
    mode001: { name: "Modo Sábio", cost: 50, effect: "atk_buff", value: 20, duration: 3 },
    mode003: { name: "Manto de Chakra", cost: 40, effect: "atk_def_buff", value: 15, duration: 3 }
};

const ELEMENT_CHART = {
    Fogo: { strong: "Vento", weak: "Água" },
    Água: { strong: "Fogo", weak: "Terra" },
    Vento: { strong: "Terra", weak: "Raio" },
    Terra: { strong: "Raio", weak: "Vento" },
    Raio: { strong: "Água", weak: "Terra" },
    Nenhum: { strong: null, weak: null }
};

function elementMultiplier(attackerEl, defenderEl) {
    if (!attackerEl || attackerEl === "Nenhum") return 1;
    const c = ELEMENT_CHART[attackerEl];
    if (!c) return 1;
    if (c.strong === defenderEl) return 1.3;
    if (c.weak === defenderEl) return 0.7;
    return 1;
}

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------
let queue = []; // { socket, character }
const matches = new Map(); // matchId -> match

function makeDeckFromCharacter(character) {
    const deck = [];
    const sig = character && character.jutsu && character.jutsu.cardId;
    const picks = (character && character.jutsuPicks) || [];
    if (sig && CARDS[sig]) deck.push(sig);
    picks.forEach((id) => { if (CARDS[id]) deck.push(id); });
    // Preenche com cartas genéricas do clã/curinga para chegar a 20.
    const filler = ["jutsu001", "jutsu004", "taijutsu001", "taijutsu002", "item001", "item003", "jutsu012", "jutsu015", "jutsu037", "jutsu037"];
    while (deck.length < 20) deck.push(filler[Math.floor(Math.random() * filler.length)]);
    return deck.slice(0, 20);
}

function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function createFighter(character) {
    const d = (character && character.derived) || {};
    return {
        character: {
            name: (character && character.name) || "Ninja",
            clanName: (character && character.clanName) || "",
            element: (character && character.element) || "Nenhum",
            signature: (character && character.signature) || null
        },
        maxHealth: d.maxHealth || 500,
        health: d.maxHealth || 500,
        maxChakra: d.maxChakra || 380,
        chakra: d.maxChakra || 380,
        maxDefense: d.maxDefense || 80,
        defense: 0,
        attackBonus: d.attackBonus || 0,
        jutsuPower: (character && character.jutsu && character.jutsu.power) || 0,
        dodgeChance: d.dodgeChance || 0.10,
        accuracy: d.accuracy || 0.85,
        critChanceBonus: Math.max(0, (d.critChance || 0.05) - 0.05),
        statusEffects: [],
        deck: shuffled(makeDeckFromCharacter(character)),
        hand: [],
        discardPile: []
    };
}

function drawCards(f, n) {
    for (let i = 0; i < n; i++) {
        if (f.deck.length === 0) {
            if (f.discardPile.length === 0) break;
            f.deck = shuffled(f.discardPile);
            f.discardPile = [];
        }
        if (f.hand.length >= 8) { f.deck.pop(); continue; }
        const id = f.deck.pop();
        if (id) f.hand.push(id);
    }
}

function publicFighter(f) {
    return {
        name: f.character.name,
        clanName: f.character.clanName,
        element: f.character.element,
        signature: f.character.signature,
        health: Math.max(0, f.health),
        maxHealth: f.maxHealth,
        chakra: f.chakra,
        maxChakra: f.maxChakra,
        defense: f.defense,
        maxDefense: f.maxDefense,
        hand: f.hand.slice(),
        handCount: f.hand.length,
        deckCount: f.deck.length,
        discardCount: f.discardPile.length,
        statusEffects: f.statusEffects.map((e) => ({ name: e.name, type: e.type, duration: e.duration }))
    };
}

function emitState(match) {
    const payload = {
        matchId: match.id,
        turn: match.turn,
        currentPlayer: match.currentPlayer,
        playerA: { id: match.a.socket.id, view: publicFighter(match.a.fighter) },
        playerB: { id: match.b.socket.id, view: publicFighter(match.b.fighter) },
        log: match.log.slice(-40)
    };
    match.a.socket.emit("match:state", payload);
    match.b.socket.emit("match:state", payload);
}

function startMatch(a, b) {
    const id = "m_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const fa = createFighter(a.character);
    const fb = createFighter(b.character);
    drawCards(fa, 5);
    drawCards(fb, 5);
    const match = {
        id,
        a: { socket: a.socket, fighter: fa },
        b: { socket: b.socket, fighter: fb },
        turn: 1,
        currentPlayer: "a",
        log: [],
        over: false
    };
    matches.set(id, match);
    a.socket.join(id);
    b.socket.join(id);

    a.socket.emit("match:found", { matchId: id, role: "a", opponent: fa.character.name === fb.character.name ? fb.character : fb.character });
    b.socket.emit("match:found", { matchId: id, role: "b", opponent: fa.character });
    // envia os nomes corretos
    emitState(match);
}

function fighterOf(match, socketId) {
    if (match.a.socket.id === socketId) return { self: match.a.fighter, foe: match.b.fighter, role: "a" };
    if (match.b.socket.id === socketId) return { self: match.b.fighter, foe: match.a.fighter, role: "b" };
    return null;
}

function pushLog(match, text) {
    match.log.push(text);
}

function hasEffect(f, type) {
    return f.statusEffects.find((e) => e.type === type && e.duration > 0);
}

function playCard(match, socketId, cardIndex) {
    if (match.over) return;
    const f = fighterOf(match, socketId);
    if (!f) return;
    const { self, foe, role } = f;
    if (match.currentPlayer !== role) {
        match.a.socket.emit("match:error", "Não é seu turno.");
        match.b.socket.emit("match:error", "Não é seu turno.");
        return;
    }
    const cardId = self.hand[cardIndex];
    if (!cardId) return;
    const card = CARDS[cardId];
    if (!card) return;
    if (self.chakra < card.cost) {
        match.a.socket.emit("match:error", "Chakra insuficiente.");
        match.b.socket.emit("match:error", "Chakra insuficiente.");
        return;
    }
    self.chakra -= card.cost;
    self.hand.splice(cardIndex, 1);
    self.discardPile.push(cardId);
    pushLog(match, `${self.character.name} usou ${card.name}.`);

    applyCard(match, self, foe, card);

    checkOver(match);
    if (!match.over) emitState(match);
}

function applyCard(match, self, foe, card) {
    // Efeitos utilitários
    if (card.effect === "heal") {
        self.health = Math.min(self.maxHealth, self.health + card.value);
        pushLog(match, `${self.character.name} recuperou ${card.value} de vida.`);
        return;
    }
    if (card.effect === "draw") { drawCards(self, card.value); return; }
    if (card.effect === "defense_percent") {
        self.statusEffects.push({ name: card.name, type: "defense_percent", value: card.value, duration: card.duration });
        return;
    }
    if (card.effect === "defense_flat") {
        self.defense = Math.min(self.maxDefense, self.defense + card.value);
        return;
    }
    if (card.effect === "atk_buff") {
        self.statusEffects.push({ name: card.name, type: "atk_buff", value: card.value, duration: card.duration });
        return;
    }
    if (card.effect === "atk_def_buff") {
        self.statusEffects.push({ name: card.name, type: "atk_def_buff", value: card.value, duration: card.duration });
        self.defense = Math.min(self.maxDefense, self.defense + card.value);
        return;
    }
    if (card.effect === "crit_buff") {
        self.statusEffects.push({ name: card.name, type: "crit_buff", value: card.value, duration: card.duration });
        return;
    }
    if (card.effect === "discard") {
        for (let i = 0; i < card.value && foe.hand.length > 0; i++) {
            const idx = Math.floor(Math.random() * foe.hand.length);
            const removed = foe.hand.splice(idx, 1)[0];
            foe.discardPile.push(removed);
        }
        pushLog(match, `${foe.character.name} perdeu ${card.value} carta(s).`);
        return;
    }
    if (card.effect === "fail_chance") {
        foe.statusEffects.push({ name: card.name, type: "fail_chance", value: card.value, duration: card.duration });
        self.statusEffects.push({ name: card.name, type: "fail_chance", value: card.value, duration: card.duration });
        return;
    }
    if (card.effect === "block_all") {
        self.statusEffects.push({ name: card.name, type: "block_all", duration: card.duration });
        return;
    }
    if (card.effect === "stun") {
        foe.statusEffects.push({ name: card.name, type: "stun", duration: card.duration });
        pushLog(match, `${foe.character.name} foi atordoado!`);
        // stun também pode causar dano
    }
    if (card.effect === "burn" || card.effect === "poison") {
        foe.statusEffects.push({ name: card.name, type: card.effect, value: card.value, duration: card.duration });
        return;
    }
    if (card.effect === "drain") {
        foe.chakra = Math.max(0, foe.chakra - card.value);
        self.chakra = Math.min(self.maxChakra, self.chakra + card.value);
        return;
    }
    if (card.effect === "def_down" || card.effect === "slow") {
        foe.statusEffects.push({ name: card.name, type: card.type, value: card.value, duration: card.duration });
        return;
    }

    // Dano (com desvio estilo Elden Ring)
    if (card.attack > 0) {
        const jutsuScale = (card.attack + self.jutsuPower * 0.4) / 100;
        let dodgeRoll = foe.dodgeChance * (foe.accuracy || 0.85) * (1 - Math.min(0.6, jutsuScale * 0.5));
        dodgeRoll = Math.max(0, Math.min(0.6, dodgeRoll));
        if (dodgeRoll > 0 && Math.random() < dodgeRoll) {
            pushLog(match, `${foe.character.name} DESVIOU de ${card.name}!`);
            return;
        }
        const hits = card.hits || 1;
        let total = 0;
        let crit = false;
        for (let h = 0; h < hits; h++) {
            let dmg = card.attack + self.attackBonus;
            const atkBuff = hasEffect(self, "atk_buff") || hasEffect(self, "atk_def_buff");
            if (atkBuff) dmg += atkBuff.value;
            const critBonus = hasEffect(self, "crit_buff");
            if (Math.random() < ((card.critChance || 0) + self.critChanceBonus + (critBonus ? critBonus.value : 0))) {
                dmg = Math.round(dmg * 1.5);
                crit = true;
            }
            let dr = 0;
            foe.statusEffects.forEach((e) => { if (e.type === "defense_percent") dr += e.value; });
            dmg = Math.round(dmg * (1 - dr));
            dmg = Math.round(dmg * elementMultiplier(card.element, foe.character.element));
            total += dmg;
        }
        if (hasEffect(foe, "block_all")) {
            pushLog(match, `${foe.character.name} bloqueou o ataque!`);
            return;
        }
        let toShield = Math.min(total, foe.defense);
        gripShield(foe, toShield);
        const toHealth = total - toShield;
        foe.health -= toHealth;
        pushLog(match, `${card.name} causou ${total} de dano${crit ? " (CRÍTICO)" : ""}.`);
        if (card.selfDamage) self.health -= card.selfDamage;
    }
}

function gripShield(foe, amount) {
    if (amount > 0) foe.defense = Math.max(0, foe.defense - amount);
}

function checkOver(match) {
    if (match.a.fighter.health <= 0 && match.b.fighter.health <= 0) {
        match.over = true;
        match.a.socket.emit("match:over", { result: "draw" });
        match.b.socket.emit("match:over", { result: "draw" });
    } else if (match.a.fighter.health <= 0) {
        match.over = true;
        match.a.socket.emit("match:over", { result: "lose" });
        match.b.socket.emit("match:over", { result: "win" });
    } else if (match.b.fighter.health <= 0) {
        match.over = true;
        match.b.socket.emit("match:over", { result: "lose" });
        match.a.socket.emit("match:over", { result: "win" });
    }
}

function tickStatus(f) {
    // dano ao longo do tempo (burn/poison)
    f.statusEffects.forEach((e) => {
        if ((e.type === "burn" || e.type === "poison") && e.duration > 0) {
            f.health -= e.value;
        }
    });
    f.statusEffects = f.statusEffects.filter((e) => {
        if (e.type === "burn" || e.type === "poison" || e.type === "stun") return false;
        e.duration -= 1;
        return e.duration > 0;
    });
}

function endTurn(match, socketId) {
    if (match.over) return;
    const f = fighterOf(match, socketId);
    if (!f) return;
    if (match.currentPlayer !== f.role) return;

    // aplica status no fim do turno do jogador atual
    tickStatus(f.self);
    checkOver(match);
    if (match.over) { emitState(match); return; }

    // troca de turno
    match.currentPlayer = match.currentPlayer === "a" ? "b" : "a";
    if (match.currentPlayer === "a") match.turn += 1;
    const next = match.currentPlayer === "a" ? match.a.fighter : match.b.fighter;

    // atordoado pula o turno
    if (hasEffect(next, "stun")) {
        pushLog(match, `${next.character.name} está atordoado e perdeu o turno.`);
        match.currentPlayer = match.currentPlayer === "a" ? "b" : "a";
    }
    const active = match.currentPlayer === "a" ? match.a.fighter : match.b.fighter;
    active.chakra = Math.min(active.maxChakra, active.chakra + 30);
    drawCards(active, 1);
    emitState(match);
}

// ---------------------------------------------------------------------------
// Socket handlers
// ---------------------------------------------------------------------------
io.on("connection", (socket) => {
    socket.data.character = null;

    socket.on("queue:join", (character) => {
        socket.data.character = character || null;
        // remove de fila anterior
        queue = queue.filter((q) => q.socket.id !== socket.id);
        queue.push({ socket, character });
        socket.emit("queue:waiting");
        tryMatch();
    });

    socket.on("queue:leave", () => {
        queue = queue.filter((q) => q.socket.id !== socket.id);
    });

    socket.on("match:play", (payload) => {
        const match = matches.get(payload && payload.matchId);
        if (!match) return;
        playCard(match, socket.id, payload.cardIndex);
    });

    socket.on("match:endTurn", (payload) => {
        const match = matches.get(payload && payload.matchId);
        if (!match) return;
        endTurn(match, socket.id);
    });

    socket.on("disconnect", () => {
        queue = queue.filter((q) => q.socket.id !== socket.id);
        for (const [id, match] of matches) {
            if (match.a.socket.id === socket.id || match.b.socket.id === socket.id) {
                match.over = true;
                const other = match.a.socket.id === socket.id ? match.b : match.a;
                other.socket.emit("match:opponentLeft");
                matches.delete(id);
            }
        }
    });
});

function tryMatch() {
    while (queue.length >= 2) {
        const a = queue.shift();
        const b = queue.shift();
        if (!a.socket.connected) { if (b.socket.connected) queue.unshift(b); continue; }
        if (!b.socket.connected) { if (a.socket.connected) queue.unshift(a); continue; }
        startMatch(a, b);
    }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Naruto Card online rodando na porta ${PORT}`);
});

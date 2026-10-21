/*
 * Naruto Pixel Card Game - Modo Online 1v1
 * Usa Socket.IO para matchmaking e sincronização
 */
"use strict";

const socket = io();
let matchId = null;
let role = null;
let myCharacter = null;
let isMyTurn = false;

const cardNames = {
    jutsu001: "Rasengan", jutsu002: "Chidori", jutsu003: "Kage Bunshin", jutsu004: "Bola de Fogo",
    jutsu005: "Dragão de Água", jutsu006: "Parede de Lama", jutsu008: "Amaterasu", jutsu009: "Susanoo Ribcage",
    jutsu010: "Kamui", jutsu012: "Jutsu Médico", jutsu013: "Genjutsu Sharingan", jutsu014: "Grande Brecha",
    jutsu015: "Lança de Pedra", jutsu016: "Pantera Negra", jutsu018: "Tsukuyomi", jutsu019: "Chidori Senbon",
    jutsu020: "Chidori Sharp Spear", jutsu030: "Oodama Rasengan", jutsu031: "Clone das Sombras",
    jutsu032: "Bola de Vácuo", jutsu033: "Flor de Fênix", jutsu034: "Grande Bola de Fogo",
    jutsu035: "Chamas do Dragão", jutsu036: "Dragão de Água Explosivo", jutsu037: "Ondas de Água",
    jutsu038: "Prisão de Água", jutsu039: "Espelhos de Gelo", jutsu040: "Lâmina de Vento",
    jutsu042: "Muralha de Terra", jutsu043: "Dragão de Terra", jutsu044: "Fissura Terrestre",
    jutsu045: "Poeira Explosiva", jutsu046: "Trovão Assassino", jutsu047: "Armadura de Raio",
    jutsu048: "Lariat de Raio", jutsu049: "Tubarão Faminto", jutsu050: "Bijuu Dama",
    jutsu051: "Flores Demôniacas", jutsu052: "Amaterasu Negra", jutsu053: "Shinra Tensei",
    jutsu054: "Lâminas de Papel", jutsu056: "Rasengan Gigante",
    taijutsu001: "Chute Dinâmico", taijutsu002: "Rajada Leões", taijutsu003: "Lótus Primária",
    item001: "Kunai", item003: "Shuriken", item006: "Bandagem", item007: "Veneno",
    buff001: "Força Interior", buff002: "Concentração", buff003: "Visão Sharingan",
    debuff001: "Redução de Defesa", debuff002: "Lentidão", debuff003: "Confusão",
    mode001: "Modo Sábio", mode003: "Manto de Chakra"
};

function loadMyCharacter() {
    try {
        const raw = localStorage.getItem("narutoCard_character_v1");
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) { return null; }
}

function renderBar(fillId, value, max) {
    const el = document.getElementById(fillId);
    if (!el) return;
    const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
    el.style.width = pct + "%";
}

function renderHand(containerId, cards) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    if (!cards || cards.length === 0) {
        container.innerHTML = "<p>Mão Vazia</p>";
        return;
    }
    cards.forEach((cardId, idx) => {
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `<div class="card-name">${cardNames[cardId] || cardId}</div><div class="card-cost">${cardId.startsWith("jutsu") ? "C" : cardId.startsWith("item") ? "I" : "T"}</div>`;
        if (containerId === "player-hand") {
            div.style.cursor = "pointer";
            div.addEventListener("click", () => {
                if (!isMyTurn) return;
                socket.emit("match:play", { matchId, cardIndex: idx });
            });
        }
        container.appendChild(div);
    });
}

function renderStatusEffects(containerId, effects) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = "";
    (effects || []).forEach((e) => {
        const span = document.createElement("span");
        span.className = "status-effect";
        span.textContent = e.name + (e.duration ? " (" + e.duration + ")" : "");
        el.appendChild(span);
    });
}

document.addEventListener("click", () => { if (window.gameAudio) { gameAudio.init(); gameAudio.resume(); } }, { passive: true });

socket.on("connect", () => {
    document.getElementById("online-status-text").textContent = "Conectado. Entrando na fila...";
    myCharacter = loadMyCharacter();
    socket.emit("queue:join", myCharacter);
});

socket.on("queue:waiting", () => {
    document.getElementById("queue-title").textContent = "Procurando partida...";
    document.getElementById("queue-text").textContent = "Aguardando outro jogador entrar na fila.";
    document.getElementById("queue-overlay").classList.remove("hidden");
});

socket.on("queue:info", (info) => {
    const el = document.getElementById("queue-text");
    if (!el) return;
    if (info && info.count > 0) {
        el.textContent = `Na fila: ${info.count} jogador(es). Aguardando oponente...`;
    } else {
        el.textContent = "Aguardando outro jogador entrar na fila.";
    }
});

socket.on("match:found", (data) => {
    matchId = data.matchId;
    role = data.role;
    document.getElementById("queue-overlay").classList.add("hidden");
    document.getElementById("online-status-text").textContent = "Partida encontrada!";
    setTimeout(() => document.getElementById("online-status").classList.add("hidden"), 1500);
    if (data.opponent && data.opponent.name) {
        document.getElementById("opponent-name-display").textContent = data.opponent.name;
    }
    if (myCharacter && myCharacter.name) {
        document.getElementById("player-name-display").textContent = myCharacter.name;
    }
});

socket.on("match:state", (state) => {
    const me = role === "a" ? state.playerA.view : state.playerB.view;
    const foe = role === "a" ? state.playerB.view : state.playerA.view;
    isMyTurn = state.currentPlayer === role;
    
    document.getElementById("turn-counter").textContent = state.turn;
    document.getElementById("phase-label").textContent = isMyTurn ? "Sua Vez" : "Vez do Oponente";
    
    renderBar("player-health-bar-fill", me.health, me.maxHealth);
    renderBar("player-chakra-bar-fill", me.chakra, me.maxChakra);
    renderBar("player-defense-bar-fill", me.defense, me.maxDefense);
    renderBar("opponent-health-bar-fill", foe.health, foe.maxHealth);
    renderBar("opponent-chakra-bar-fill", foe.chakra, foe.maxChakra);
    renderBar("opponent-defense-bar-fill", foe.defense, foe.maxDefense);
    
    renderHand("player-hand", me.hand);
    renderHand("opponent-hand", Array(foe.handCount).fill("back"));
    
    document.getElementById("player-deck-count").textContent = "Deck: " + me.deckCount;
    document.getElementById("player-discard-count").textContent = "Descarte: " + me.discardCount;
    document.getElementById("opponent-deck-count").textContent = "Deck: " + foe.deckCount;
    document.getElementById("opponent-discard-count").textContent = "Descarte: " + foe.discardCount;
    
    renderStatusEffects("player-status-effects", me.statusEffects);
    renderStatusEffects("opponent-status-effects", foe.statusEffects);
    
    const logEl = document.getElementById("message-log");
    if (logEl && state.log) {
        logEl.textContent = "Log da Batalha: " + state.log.slice(-5).join(" | ");
    }
});

socket.on("match:error", (msg) => {
    const logEl = document.getElementById("message-log");
    if (logEl) logEl.textContent = "Log da Batalha: " + msg;
});

socket.on("match:over", (data) => {
    document.getElementById("result-title").textContent = data.result === "win" ? "VITÓRIA!" : data.result === "lose" ? "DERROTA" : "EMPATE";
    document.getElementById("result-overlay").classList.remove("hidden");
});

socket.on("match:opponentLeft", () => {
    document.getElementById("result-title").textContent = "Oponente saiu da partida";
    document.getElementById("result-overlay").classList.remove("hidden");
});

document.getElementById("end-turn-button").addEventListener("click", () => {
    if (!matchId) return;
    socket.emit("match:endTurn", { matchId });
});

document.getElementById("cancel-queue").addEventListener("click", () => {
    socket.emit("queue:leave");
    window.location.href = "../interface/interface.html";
});

document.getElementById("leave-match-button").addEventListener("click", () => {
    socket.emit("queue:leave");
    window.location.href = "../interface/interface.html";
});

document.getElementById("back-to-menu").addEventListener("click", () => {
    window.location.href = "../interface/interface.html";
});

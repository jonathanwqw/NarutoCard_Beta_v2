/**
 * Tela de batalha — consome o motor (src/core/engine.js) e desenha o estado.
 *
 * Não há servidor: o oponente é uma IA local e tudo acontece no navegador.
 */

import { createBattle, PHASES } from "../core/engine.js";
import { getProfile, saveProfile, battleDeck, combatStats, gainXp } from "../core/save.js";
import { RIVALS, rivalStats } from "../data/catalog.js";
import { elementIcon } from "../data/elements.js";
import { renderCard } from "./card-view.js";
import { play } from "./audio.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

let profile = getProfile();
let battle = null;
let rival = null;
let startedAt = Date.now();
let fusionSelection = [];

function escapeHtml(text) {
    return String(text ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ------------------------------------------------------------------- setup
function pickRival() {
    return RIVALS[Math.floor(Math.random() * RIVALS.length)];
}

function startBattle() {
    rival = pickRival();
    startedAt = Date.now();
    fusionSelection = [];

    const stats = combatStats(profile);
    const playerConfig = {
        ...stats,
        name: profile.character ? profile.character.name : "Jogador",
        element: profile.character ? profile.character.element : "Nenhum",
        deck: battleDeck(profile)
    };
    const opponentConfig = rivalStats(rival);

    battle = createBattle({
        player: playerConfig,
        opponent: opponentConfig,
        seed: Date.now() % 100000,
        emit: handleEvent
    });

    $("#opponent-name-display").textContent = rival.name;
    $("#rival-name-display").textContent = `Rival: ${rival.name}`;
    $("#battle-results-screen").classList.add("battle-results-screen-hidden");
    $("#message-log").innerHTML = "Log da Batalha:";

    battle.start();
    render();
}

function handleEvent(type, payload) {
    switch (type) {
        case "log":
            appendLog(payload.message, payload.cssClass);
            break;
        case "damage":
            flashScreen("damage");
            floatingNumber(payload.key, `-${payload.amount}`, payload.isCrit ? "crit" : "damage");
            play(payload.isCrit ? "crit" : "hit");
            break;
        case "dot":
            floatingNumber(payload.key, `-${payload.amount}`, "dot");
            play(payload.effectType === "burn" ? "burn" : "poison");
            break;
        case "heal":
            floatingNumber(payload.key, `+${payload.amount}`, "heal");
            play("heal");
            break;
        case "chakra":
            floatingNumber(payload.key, `${payload.gained ? "+" : "-"}${payload.amount}`, "chakra");
            if (payload.gained) play("chakra");
            break;
        case "defense":
            floatingNumber(payload.key, `+${payload.amount}`, "defense");
            play("shield");
            break;
        case "status":
            play("stun");
            break;
        case "effect":
            play("draw");
            break;
        case "draw":
            play("draw");
            break;
        case "combo":
            showBanner(`COMBO ${payload.element} x${payload.count}!`);
            break;
        case "stun":
            showBanner("ATORDOADO!");
            break;
        case "dodge":
            showBanner("DESVIOU!");
            break;
        case "turn":
            showBanner(payload.currentPlayer === "player" ? `Turno ${payload.turn}` : "Vez do Oponente");
            break;
        case "end":
            finishBattle(payload.winner);
            break;
        default:
            break;
    }
    render();
}

// ------------------------------------------------------------------- render
function render() {
    if (!battle) return;
    const snapshot = battle.getSnapshot();

    renderSide(snapshot.player, "player");
    renderSide(snapshot.opponent, "opponent");
    renderHand(snapshot.player, "player-hand");
    const revealed = snapshot.player.statusEffects.some((effect) => effect.type === "reveal_hand" && effect.duration > 0);
    renderHand(snapshot.opponent, "opponent-hand", !revealed);
    const handNote = $("#opponent-hand-note");
    if (handNote) handNote.textContent = revealed ? "Byakugan: mão do oponente revelada!" : "";

    $("#turn-counter").textContent = snapshot.turn;
    const phaseLabel = $("#phase-label");
    if (phaseLabel) {
        phaseLabel.textContent = snapshot.phase === PHASES.GAME_OVER
            ? "Fim"
            : snapshot.currentPlayer === "player" ? "Sua Vez" : "Vez do Oponente";
    }
    $("#player-deck-count").textContent = `Deck: ${snapshot.player.deckCount}`;
    $("#player-discard-count").textContent = `Descarte: ${snapshot.player.discardCount}`;
    $("#opponent-deck-count").textContent = `Deck: ${snapshot.opponent.deckCount}`;
    $("#opponent-discard-count").textContent = `Descarte: ${snapshot.opponent.discardCount}`;

    const endButton = $("#end-turn-button");
    if (endButton) {
        endButton.disabled = snapshot.phase !== PHASES.PLAYER_TURN;
        endButton.textContent = snapshot.player.isStunned ? "Atordoado — pular turno" : "Finalizar Turno";
    }
}

function renderSide(side, key) {
    const healthFill = $(`#${key}-health-bar-fill`);
    if (healthFill) healthFill.style.width = `${Math.max(0, (side.health / side.maxHealth) * 100)}%`;
    const chakraFill = $(`#${key}-chakra-bar-fill`);
    if (chakraFill) chakraFill.style.width = `${Math.max(0, (side.chakra / side.maxChakra) * 100)}%`;
    const defenseFill = $(`#${key}-defense-bar-fill`);
    if (defenseFill) defenseFill.style.width = `${Math.max(0, (side.defense / Math.max(1, side.maxDefense)) * 100)}%`;

    const stats = $(`#${key}-temp-stats`);
    if (stats) {
        const combo = side.combo && side.combo.count > 1
            ? `<span title="Combo">Combo ${escapeHtml(side.combo.element)} x${side.combo.count}</span>`
            : "";
        stats.innerHTML = `${combo}<span title="Defesa">🛡 ${side.defense}</span>`;
    }

    const comboDisplay = $(`#${key}-combo`);
    if (comboDisplay) {
        comboDisplay.textContent = side.combo && side.combo.count > 1
            ? `${elementIcon(side.combo.element)} ${side.combo.element} x${side.combo.count}`
            : "";
    }

    const statusContainer = $(`#${key}-status-effects`);
    if (statusContainer) {
        statusContainer.innerHTML = side.statusEffects.map((status) => `
            <span class="status-effect-icon effect-${status.type}" title="${escapeHtml(status.name)}: ${escapeHtml(status.description)} (${status.duration}t)">
                ${escapeHtml(status.name.slice(0, 2))}<sup>${status.duration}</sup>
            </span>`).join("");
    }
}

function renderHand(side, containerId, hidden = false) {
    const container = $(`#${containerId}`);
    if (!container) return;
    if (hidden) {
        container.innerHTML = side.hand.map(() => `<div class="card card-back"></div>`).join("");
        return;
    }
    container.innerHTML = side.hand.map((card, index) => renderCard(card, {
        size: "",
        dataAttrs: { index, id: card.id }
    })).join("");

    // só a mão do jogador é clicável (a do oponente pode estar revelada)
    if (containerId !== "player-hand") return;
    $$(`#${containerId} .card`).forEach((element) => {
        element.addEventListener("click", () => onCardClick(Number(element.dataset.index)));
    });
}

function onCardClick(index) {
    if (!battle) return;
    const snapshot = battle.getSnapshot();
    if (snapshot.phase !== PHASES.PLAYER_TURN) return;

    if (fusionSelection.length === 1 && fusionSelection[0] === index) {
        fusionSelection = [];
        updateFusionHint();
        return;
    }

    if (fusionSelection.length === 1) {
        const recipe = battle.canFuse(fusionSelection[0], index);
        if (recipe) {
            const result = battle.fuse(fusionSelection[0], index);
            fusionSelection = [];
            updateFusionHint();
            if (result.ok) {
                showBanner(`FUSÃO: ${result.card.name}`);
                play("crit");
            }
            render();
            return;
        }
    }

    if (fusionSelection.length > 0) {
        fusionSelection = [];
        updateFusionHint();
    }

    const result = battle.playCard("player", index);
    if (!result.ok) {
        appendLog(result.reason, "log-damage");
        return;
    }
    render();
}

function updateFusionHint() {
    const hint = $("#fusion-hint");
    if (!hint) return;
    hint.textContent = fusionSelection.length === 1
        ? "Agora escolha a segunda carta"
        : "Selecione duas cartas compatíveis";
}

// --------------------------------------------------------------- feedback
function appendLog(message, cssClass) {
    const log = $("#message-log");
    if (!log) return;
    const entry = document.createElement("div");
    entry.className = cssClass || "log-system";
    entry.textContent = message;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}

function floatingNumber(key, text, kind) {
    const container = $(`#${key}-${kind === "crit" ? "health" : kind}-feedback`)
        || $(`#${key}-health-feedback`);
    if (!container) return;
    const element = document.createElement("div");
    element.className = `floating-number float-${kind}`;
    element.textContent = text;
    element.style.left = `${20 + Math.random() * 60}%`;
    container.appendChild(element);
    setTimeout(() => element.remove(), 1100);
}

function flashScreen(kind) {
    const flash = $("#screen-flash");
    if (!flash) return;
    flash.className = `screen-flash flash-${kind}`;
    setTimeout(() => { flash.className = "screen-flash"; }, 220);
}

function showBanner(text) {
    const banner = $("#turn-banner");
    if (!banner) return;
    banner.textContent = text;
    banner.classList.remove("hidden");
    clearTimeout(banner._timer);
    banner._timer = setTimeout(() => banner.classList.add("hidden"), 1200);
}

// ------------------------------------------------------------------ final
function finishBattle(winner) {
    const won = winner === "player";
    const turns = battle ? battle.state.turn : 1;
    const stars = won ? (turns <= 4 ? 3 : turns <= 8 ? 2 : 1) : 0;
    const trophies = won ? 10 + stars * 5 : 0;
    const coins = won ? 80 + stars * 20 : 20;

    profile.stats = profile.stats || { battles: 0, wins: 0, losses: 0 };
    profile.stats.battles += 1;
    if (won) profile.stats.wins += 1;
    else profile.stats.losses += 1;
    profile.currency += coins;
    const levels = gainXp(profile, won ? 60 + stars * 20 : 20);
    saveProfile(profile);

    const screen = $("#battle-results-screen");
    $("#battle-result-title").textContent = won ? "Vitória!" : "Derrota...";
    $("#result-trophies").textContent = trophies;
    $("#result-coins").textContent = coins;
    $("#result-time").textContent = formatTime(Date.now() - startedAt);
    $("#result-stars").textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
    if (levels) appendLog(`Você subiu para o nível ${profile.level}!`, "log-critical");
    screen.classList.remove("battle-results-screen-hidden");
    play(won ? "victory" : "defeat");
}

function formatTime(ms) {
    const total = Math.floor(ms / 1000);
    const minutes = String(Math.floor(total / 60)).padStart(2, "0");
    const seconds = String(total % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
}

// -------------------------------------------------------------------- boot
function bind() {
    $("#end-turn-button")?.addEventListener("click", () => {
        if (!battle) return;
        battle.endTurn();
        render();
    });
    $("#restart-battle-button")?.addEventListener("click", () => startBattle());
    $("#close-results-button")?.addEventListener("click", () => {
        $("#battle-results-screen").classList.add("battle-results-screen-hidden");
    });
    $("#next-level-button")?.addEventListener("click", () => {
        window.location.href = "../index.html";
    });
    $("#fusion-button")?.addEventListener("click", () => {
        if (!battle) return;
        const snapshot = battle.getSnapshot();
        if (snapshot.phase !== PHASES.PLAYER_TURN) return;
        if (fusionSelection.length === 0) {
            appendLog("Selecione uma carta para começar a fusão.", "log-system");
            return;
        }
        const recipe = battle.canFuse(fusionSelection[0], fusionSelection[0]);
        appendLog(recipe
            ? "Agora escolha a segunda carta da fusão."
            : "Essa carta não tem fusão.", "log-system");
    });
    $$(".scroll-arrow").forEach((button) => {
        button.addEventListener("click", () => {
            const target = document.getElementById(button.dataset.target);
            if (!target) return;
            target.scrollLeft += button.classList.contains("left-arrow") ? -220 : 220;
        });
    });
    const sound = document.getElementById("sound-toggle");
    if (sound) {
        sound.addEventListener("click", () => {
            import("./audio.js").then((module) => {
                sound.textContent = module.toggle() ? "🔊" : "🔇";
            });
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (!profile.character) {
        window.location.href = "../index.html";
        return;
    }
    bind();
    startBattle();
});

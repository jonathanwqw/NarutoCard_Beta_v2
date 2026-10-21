/**
 * Menu principal (criação de personagem, inventário, loja, equipamentos,
 * craft, baús, deck) — versão estática e local.
 *
 * Toda a lógica aqui é de interface: os dados vêm de src/data e o perfil é
 * salvo em localStorage (src/core/save.js).
 */

import { CARDS, CARD_LIST, CARD_TYPES, getCard, isDeckable } from "../data/cards.js";
import { EFFECTS } from "../data/effects.js";
import { CLANS, CLAN_LIST, ATTRIBUTE_DEFS, ATTRIBUTE_KEYS, ATTR_POINTS_CREATION, MAX_JUTSU_PICKS, STARTING_COINS, deriveStats, getCharacter } from "../data/clans.js";
import { shopStock, ARMOR_SLOTS, TOOL_SLOTS, CRAFTING_RECIPES, CHESTS } from "../data/catalog.js";
import { elementIcon } from "../data/elements.js";
import {
    getProfile, saveProfile, createEmptyProfile, applyCharacterCreation,
    addCardToCollection, removeCardFromCollection, addCardToDeck, removeCardFromDeck,
    equipItem, unequipSlot, gainXp
} from "../core/save.js";
import { renderCard, renderCardList } from "./card-view.js";
import { play, toggle as toggleAudio, isEnabled } from "./audio.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

let profile = getProfile();
const cart = new Map();

const creation = {
    step: 0,
    clanId: null,
    characterId: null,
    attributes: {},
    picks: []
};

const STEPS = ["clan", "character", "attributes", "shop", "review"];

// ------------------------------------------------------------------- utils
function escapeHtml(text) {
    return String(text ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function persist() {
    saveProfile(profile);
    renderProfileDisplay();
}

function section(id) {
    $$(`#${id}`).forEach((element) => element.classList.add("active-section"));
}

// ------------------------------------------------------------------- perfil
function renderProfileDisplay() {
    const level = $("#player-level");
    const xp = $("#player-xp");
    const currency = $("#player-currency");
    if (level) level.textContent = profile.level;
    if (xp) xp.textContent = `${profile.xp} / ${profile.xpToNextLevel}`;
    if (currency) currency.textContent = profile.currency;
    const shopCurrency = $("#shop-currency");
    if (shopCurrency) shopCurrency.textContent = `Moedas: ${profile.currency}`;
}

function showCharacterResult() {
    const container = $("#cc-result");
    if (!container) return;
    const character = getCharacter(creation.clanId, creation.characterId);
    const stats = deriveStats(creation.clanId, creation.characterId, creation.attributes);
    container.innerHTML = `
        <h2>${escapeHtml(character.name)} criado!</h2>
        <div class="cc-result-card">${renderCard(character.jutsu.cardId, { size: "md" })}</div>
        <p class="cc-result-derived">
            Vida ${stats.maxHealth} · Chakra ${stats.maxChakra} · Defesa ${stats.maxDefense} ·
            Ataque +${stats.attackBonus} · Desvio ${Math.round(stats.dodgeChance * 100)}%
        </p>
        <p class="cc-result-stats">Deck inicial com ${profile.deck.length} cartas. Bonsistema, ninja!</p>
        <button id="cc-continue" class="game-button">Continuar</button>`;
    container.hidden = false;
    $("#cc-continue").addEventListener("click", () => {
        container.hidden = true;
        $("#character-creator").hidden = false;
        switchSection("nav-inventory", "inventory-area");
    });
}

// ----------------------------------------------------------------- criação
function renderCreation() {
    const step = creation.step;
    $$(".cc-step").forEach((element) => {
        element.classList.toggle("active", element.dataset.step === STEPS[step]);
    });
    $("#cc-title").textContent = `Criação de Personagem — passo ${step + 1} de ${STEPS.length}`;
    $("#cc-nav").style.display = step === STEPS.length - 1 ? "none" : "flex";
    $("#cc-back").disabled = step === 0;

    const used = ATTRIBUTE_KEYS.reduce((total, key) => total + (creation.attributes[key] || 0), 0);
    $("#cc-points-left").textContent = Math.max(0, ATTR_POINTS_CREATION - used);
    $("#cc-picks-row").hidden = step !== 3;
    $("#cc-coins-left").textContent = `${creation.picks.length} / ${MAX_JUTSU_PICKS}`;

    renderClanView();
    renderCharacterView();
    renderAttributesView();
    renderShopView();
    renderReviewView();
}

function renderClanView() {
    const view = $("#cc-clan-view");
    view.innerHTML = CLAN_LIST.map((clan) => `
        <div class="cc-clan-card" data-clan="${clan.id}" style="border-color:${clan.color}">
            <div class="cc-clan-symbol">${clan.symbol}</div>
            <div class="cc-clan-village">${escapeHtml(clan.village)}</div>
            <strong>${escapeHtml(clan.name)}</strong>
            <p>${escapeHtml(clan.desc)}</p>
            <span class="cc-clan-count">${Object.keys(clan.characters).length} personagens</span>
        </div>`).join("");
    view.hidden = creation.step !== 0;
    $$("#cc-clan-view .cc-clan-card").forEach((element) => {
        element.addEventListener("click", () => {
            creation.clanId = element.dataset.clan;
            creation.characterId = null;
            play("click");
            renderCreation();
        });
    });
}

function renderCharacterView() {
    const view = $("#cc-character-view");
    const clan = CLANS[creation.clanId];
    if (!clan) {
        view.innerHTML = "<p>Escolha um clã primeiro.</p>";
        view.hidden = true;
        return;
    }
    view.innerHTML = Object.values(clan.characters).map((character) => `
        <div class="cc-char-card" data-character="${character.id}" style="border-color:${character.color}">
            <div class="cc-char-avatar" style="background:${character.color}">${escapeHtml(character.name[0])}</div>
            <div class="cc-char-element">${elementIcon(character.element)} ${escapeHtml(character.element)}</div>
            <div class="cc-char-title">${escapeHtml(character.name)}</div>
            <div class="cc-char-sig"><span class="cc-sig-label">Assinatura</span> ${escapeHtml(character.signature.name)}</div>
            <div class="cc-char-desc">${escapeHtml(character.desc)}</div>
        </div>`).join("");
    view.hidden = creation.step !== 1;
    $$("#cc-character-view .cc-char-card").forEach((element) => {
        element.addEventListener("click", () => {
            creation.characterId = element.dataset.character;
            const character = getCharacter(creation.clanId, creation.characterId);
            creation.attributes = { ...character.baseAttributes };
            creation.picks = [];
            play("click");
            renderCreation();
        });
    });
}

function renderAttributesView() {
    const view = $("#cc-attributes-view");
    const character = getCharacter(creation.clanId, creation.characterId);
    if (!character) {
        view.innerHTML = "<p>Escolha um personagem primeiro.</p>";
        view.hidden = true;
        return;
    }
    const used = ATTRIBUTE_KEYS.reduce((total, key) => total + (creation.attributes[key] || 0), 0);
    const remaining = ATTR_POINTS_CREATION - used;

    view.innerHTML = `
        <div class="cc-attr-list">
        ${ATTRIBUTE_KEYS.map((key) => {
            const definition = ATTRIBUTE_DEFS[key];
            return `<div class="cc-attr-row" data-attribute="${key}">
                <div class="cc-attr-info">
                    <span class="cc-attr-name">${definition.icon} ${definition.label}</span>
                    <span class="cc-attr-header">${definition.desc}</span>
                </div>
                <div class="cc-attr-controls">
                    <button class="cc-attr-btn" data-delta="-1" data-attribute="${key}">−</button>
                    <span class="cc-attr-value" data-value="${key}">${creation.attributes[key]}</span>
                    <button class="cc-attr-btn" data-delta="1" data-attribute="${key}">+</button>
                </div>
            </div>`;
        }).join("")}
        </div>
        <p class="cc-attr-added">Pontos restantes: <strong>${Math.max(0, remaining)}</strong></p>`;
    view.hidden = creation.step !== 2;

    $$("#cc-attributes-view .cc-attr-btn").forEach((button) => {
        button.addEventListener("click", () => {
            const key = button.dataset.attribute;
            const delta = Number(button.dataset.delta);
            const base = getCharacter(creation.clanId, creation.characterId).baseAttributes[key] || 0;
            const next = creation.attributes[key] + delta;
            if (next < base) return;
            if (delta > 0 && remaining <= 0) return;
            creation.attributes[key] = next;
            play("click");
            renderCreation();
        });
    });
}

function renderShopView() {
    const view = $("#cc-shop-view");
    const clan = CLANS[creation.clanId];
    if (!clan) {
        view.innerHTML = "<p>Escolha um clã primeiro.</p>";
        view.hidden = true;
        return;
    }
    const pool = clan.cardPool
        .map((cardId) => getCard(cardId))
        .filter((card) => card && card.type === "Jutsu" && isDeckable(card));

    view.innerHTML = `<div class="cc-shop-grid">${pool.map((card) => `
        <div class="cc-shop-bar ${creation.picks.includes(card.id) ? "cc-picked" : ""}" data-pick="${card.id}">
            ${renderCard(card, { size: "md" })}
            <button class="game-button btn-small" data-pick="${card.id}">
                ${creation.picks.includes(card.id) ? "Remover" : "Escolher"}
            </button>
        </div>`).join("")}</div>`;
    view.hidden = creation.step !== 3;

    $$("#cc-shop-view [data-pick]").forEach((element) => {
        element.addEventListener("click", () => {
            const cardId = element.dataset.pick;
            const index = creation.picks.indexOf(cardId);
            if (index >= 0) {
                creation.picks.splice(index, 1);
            } else if (creation.picks.length < MAX_JUTSU_PICKS) {
                creation.picks.push(cardId);
            }
            play("click");
            renderCreation();
        });
    });
}

function renderReviewView() {
    const view = $("#cc-review-view");
    const character = getCharacter(creation.clanId, creation.characterId);
    if (!character) {
        view.innerHTML = "<p>Escolha um personagem primeiro.</p>";
        view.hidden = true;
        return;
    }
    const stats = deriveStats(creation.clanId, creation.characterId, creation.attributes);
    const deckCards = [...character.startCards, ...creation.picks].map((cardId) => getCard(cardId)).filter(Boolean);

    view.innerHTML = `
        <div class="cc-review">
            <div class="cc-review-head">
                <strong>${escapeHtml(character.name)}</strong> — ${escapeHtml(character.title)}
            </div>
            <div class="cc-review-attrs">
                ${ATTRIBUTE_KEYS.map((key) => `<span>${ATTRIBUTE_DEFS[key].icon} ${creation.attributes[key]}</span>`).join("")}
            </div>
            <div class="cc-review-derived">
                Vida ${stats.maxHealth} · Chakra ${stats.maxChakra} · Defesa ${stats.maxDefense} ·
                Ataque +${stats.attackBonus} · Desvio ${Math.round(stats.dodgeChance * 100)}% ·
                Crítico ${Math.round(stats.critChance * 100)}%
            </div>
            <div class="cc-review-cards">${renderCardList(deckCards, { size: "sm" })}</div>
            <button id="cc-confirm" class="game-button">Confirmar personagem</button>
        </div>`;
    view.hidden = creation.step !== 4;

    const confirm = $("#cc-confirm");
    if (confirm) {
        confirm.addEventListener("click", () => {
            const character = getCharacter(creation.clanId, creation.characterId);
            profile = createEmptyProfile();
            profile.currency = STARTING_COINS;
            applyCharacterCreation(profile, character, creation.attributes, creation.picks);
            persist();
            $("#character-creator").hidden = true;
            showCharacterResult();
            play("crit");
        });
    }
}

// ----------------------------------------------------------------- seções
function switchSection(navId, areaId) {
    $$(".nav-button").forEach((element) => element.classList.remove("active"));
    const nav = document.getElementById(navId);
    if (nav) nav.classList.add("active");
    $$(".game-section").forEach((element) => element.classList.remove("active-section"));
    const area = document.getElementById(areaId);
    if (area) area.classList.add("active-section");
    if (areaId === "inventory-area") renderInventory();
    if (areaId === "shop-area") renderShop();
    if (areaId === "equipment-area") renderEquipment();
    if (areaId === "craft-area") renderCraft();
    if (areaId === "chests-area") renderChests();
    if (areaId === "deck-area") renderDeck();
    if (areaId === "character-area") renderCreation();
}

// -------------------------------------------------------------- inventário
function renderInventory() {
    const container = $("#inventory-display");
    if (!container) return;
    const owned = Object.entries(profile.cardCollection).filter(([, info]) => info.quantity > 0);
    if (!owned.length) {
        container.innerHTML = "<p class=\"cc-empty\">Nenhuma carta ainda. Crie um personagem para começar.</p>";
        return;
    }
    const groups = new Map();
    owned.forEach(([cardId, info]) => {
        const card = getCard(cardId);
        if (!card) return;
        if (!groups.has(card.type)) groups.set(card.type, []);
        groups.get(card.type).push({ card, info });
    });

    container.innerHTML = CARD_TYPES.filter((type) => groups.has(type)).map((type) => `
        <div class="inventory-category">
            <h3>${escapeHtml(type)}</h3>
            <div class="inventory-items">
                ${groups.get(type).map(({ card, info }) => renderCard(card, {
                    size: "md",
                    quantity: info.quantity,
                    dataAttrs: { quantity: info.quantity, level: info.level }
                })).join("")}
            </div>
        </div>`).join("");
}

// -------------------------------------------------------------------- loja
function renderShop() {
    const display = $("#shop-display");
    if (!display) return;
    const stock = shopStock();
    display.innerHTML = stock.map((item) => `
        <div class="shop-item" data-buy="${item.id}">
            ${renderCard(item, { size: "md" })}
            <div class="shop-item-price">${item.price} 🪙</div>
            <button class="cc-buy-btn" data-buy="${item.id}">Adicionar</button>
        </div>`).join("");

    $$("#shop-display [data-buy]").forEach((element) => {
        element.addEventListener("click", () => {
            const cardId = element.dataset.buy;
            cart.set(cardId, (cart.get(cardId) || 0) + 1);
            play("click");
            renderCart();
        });
    });
    renderCart();
}

function renderCart() {
    const items = $("#cart-items");
    const total = $("#cart-total");
    if (!items) return;
    const entries = Array.from(cart.entries());
    if (!entries.length) {
        items.innerHTML = "<p>Seu carrinho está vazio.</p>";
        if (total) total.textContent = "Total: 0 Moedas";
        return;
    }
    const sum = entries.reduce((acc, [cardId, quantity]) => {
        const card = getCard(cardId);
        return acc + (card ? card.price * quantity : 0);
    }, 0);
    items.innerHTML = entries.map(([cardId, quantity]) => {
        const card = getCard(cardId);
        if (!card) return "";
        return `<div class="cart-item">
            ${escapeHtml(card.name)} x${quantity} — ${card.price * quantity} 🪙
            <button class="remove-cart-item-btn" data-remove="${cardId}">remover</button>
        </div>`;
    }).join("");
    if (total) total.textContent = `Total: ${sum} Moedas`;

    $$("#cart-items [data-remove]").forEach((element) => {
        element.addEventListener("click", () => {
            const cardId = element.dataset.remove;
            if ((cart.get(cardId) || 0) <= 1) cart.delete(cardId);
            else cart.set(cardId, cart.get(cardId) - 1);
            renderCart();
        });
    });
}

function finalizePurchase() {
    const entries = Array.from(cart.entries());
    const sum = entries.reduce((acc, [cardId, quantity]) => {
        const card = getCard(cardId);
        return acc + (card ? card.price * quantity : 0);
    }, 0);
    if (!entries.length) return;
    if (profile.currency < sum) {
        alert("Moedas insuficientes.");
        return;
    }
    entries.forEach(([cardId, quantity]) => addCardToCollection(profile, cardId, quantity));
    profile.currency -= sum;
    cart.clear();
    persist();
    renderShop();
    play("heal");
}

// ------------------------------------------------------------- equipamentos
function renderEquipment() {
    const container = $("#equipment-content") || $("#equipment-area");
    if (!container) return;
    const slots = [...ARMOR_SLOTS.map((slot) => ({ slot, type: "Armadura" })), ...TOOL_SLOTS.map((slot) => ({ slot, type: "Arma" }))];
    const equipment = { ...profile.equippedArmor, ...profile.equippedTools };

    container.innerHTML = `
        <div id="equipment-slots">
            ${slots.map(({ slot, type }) => {
                const cardId = equipment[slot];
                const card = cardId ? getCard(cardId) : null;
                return `<div class="equipment-slot-display" data-slot="${slot}" data-type="${type}">
                    <span>${escapeHtml(slot)}</span>
                    ${card ? renderCard(card, { size: "sm" }) : "<p class=\"cc-empty\">vazio</p>"}
                    <button class="game-button btn-small" data-slot="${slot}">Trocar</button>
                </div>`;
            }).join("")}
        </div>
        <div id="equipment-inventory"><h3>Meus equipamentos</h3><div class="inventory-items">
            ${renderInventoryByType("Armadura")}
            ${renderInventoryByType("Arma")}
        </div></div>`;

    $$("#equipment-slots [data-slot]").forEach((element) => {
        element.addEventListener("click", () => {
            const slot = element.dataset.slot;
            const type = element.dataset.type;
            const options = Object.entries(profile.cardCollection)
                .filter(([cardId, info]) => info.quantity > 0 && getCard(cardId) && getCard(cardId).type === type);
            if (!options.length) {
                alert("Você não tem equipamentos desse tipo.");
                return;
            }
            const chosen = prompt(`Equipar em ${slot}:\n${options.map(([cardId]) => getCard(cardId).name).join("\n")}\n\nDigite o número da carta:`);
            const index = Number(chosen) - 1;
            const option = options[index];
            if (!option) return;
            unequipSlot(profile, slot);
            equipItem(profile, option[0]);
            persist();
            renderEquipment();
        });
    });
}

function renderInventoryByType(type) {
    const cards = Object.entries(profile.cardCollection)
        .filter(([cardId, info]) => info.quantity > 0 && getCard(cardId) && getCard(cardId).type === type)
        .map(([cardId, info]) => renderCard(getCard(cardId), { size: "sm", quantity: info.quantity }));
    return cards.join("");
}

// ------------------------------------------------------------------- craft
function renderCraft() {
    const container = $("#craft-content") || $("#craft-area");
    if (!container) return;
    container.innerHTML = CRAFTING_RECIPES.map((recipe) => {
        const result = getCard(recipe.resultCardId);
        const materials = Object.entries(recipe.materialsNeeded)
            .map(([materialId, amount]) => {
                const material = getCard(materialId);
                const owned = profile.materials[materialId] || 0;
                return `${escapeHtml(material ? material.name : materialId)}: ${owned}/${amount}`;
            }).join(" · ");
        return `<div class="crafting-recipe" data-recipe="${recipe.id}">
            ${result ? renderCard(result, { size: "sm" }) : ""}
            <div>
                <strong>${escapeHtml(recipe.description)}</strong>
                <div class="cc-shop-footer">${materials}</div>
            </div>
            <button class="game-button btn-small" data-recipe="${recipe.id}">Criar</button>
        </div>`;
    }).join("");

    $$("#craft-content [data-recipe], #craft-area [data-recipe]").forEach((element) => {
        element.addEventListener("click", () => craft(element.dataset.recipe));
    });
}

function craft(recipeId) {
    const recipe = CRAFTING_RECIPES.find((item) => item.id === recipeId);
    if (!recipe) return;
    const missing = Object.entries(recipe.materialsNeeded)
        .filter(([materialId, amount]) => (profile.materials[materialId] || 0) < amount);
    if (missing.length) {
        alert(`Faltam materiais: ${missing.map(([materialId]) => getCard(materialId).name).join(", ")}.`);
        return;
    }
    Object.entries(recipe.materialsNeeded).forEach(([materialId, amount]) => {
        profile.materials[materialId] -= amount;
    });
    addCardToCollection(profile, recipe.resultCardId, recipe.resultQuantity);
    persist();
    renderCraft();
    play("heal");
}

// ------------------------------------------------------------------ baús
function renderChests() {
    const container = $("#chests-content") || $("#chests-area");
    if (!container) return;
    const chests = Object.values(CHESTS);
    container.innerHTML = chests.map((chest) => {
        const owned = profile.chests[chest.id] || 0;
        return `<div class="crafting-recipe" data-chest="${chest.id}">
            <div>
                <strong>${escapeHtml(chest.name)}</strong>
                <div class="cc-shop-footer">${escapeHtml(chest.description)}</div>
                <div>Quantidade: ${owned}</div>
            </div>
            <button class="game-button btn-small" data-chest="${chest.id}">Abrir</button>
        </div>`;
    }).join("");

    $$("#chests-content [data-chest], #chests-area [data-chest]").forEach((element) => {
        element.addEventListener("click", () => openChest(element.dataset.chest));
    });
}

function openChest(chestId) {
    const chest = CHESTS[chestId];
    if (!chest) return;
    if ((profile.chests[chestId] || 0) <= 0) {
        alert("Você não tem esse baú.");
        return;
    }
    profile.chests[chestId] -= 1;
    const rewardId = chest.pool[Math.floor(Math.random() * chest.pool.length)];
    const reward = getCard(rewardId);
    addCardToCollection(profile, rewardId, 1);
    profile.currency += chest.currency || 0;
    persist();
    renderChests();
    play("summon");
    alert(`Você abriu o ${chest.name} e ganhou: ${reward ? reward.name : rewardId} (+${chest.currency || 0} moedas)!`);
}

// ------------------------------------------------------------------- deck
function renderDeck() {
    const container = $("#deck-content") || $("#deck-area");
    if (!container) return;
    const deckCards = profile.deck.map((cardId) => getCard(cardId)).filter(Boolean);
    const available = Object.entries(profile.cardCollection)
        .filter(([cardId, info]) => {
            const used = profile.deck.filter((id) => id === cardId).length;
            return info.quantity > used && isDeckable(getCard(cardId));
        })
        .map(([cardId, info]) => getCard(cardId));

    container.innerHTML = `
        <h3>Deck de batalha (${profile.deck.length}/20)</h3>
        <div class="inventory-items" id="deck-cards">
            ${deckCards.length
                ? deckCards.map((card) => renderCard(card, { size: "sm", dataAttrs: { remove: card.id } })).join("")
                : "<p class=\"cc-empty\">Deck vazio.</p>"}
        </div>
        <h3>Adicionar ao deck</h3>
        <div class="inventory-items">
            ${available.length
                ? available.map((card) => renderCard(card, { size: "sm", dataAttrs: { add: card.id } })).join("")
                : "<p class=\"cc-empty\">Sem cartas disponíveis.</p>"}
        </div>`;

    $$("#deck-cards [data-remove]").forEach((element) => {
        element.addEventListener("click", () => {
            removeCardFromDeck(profile, element.dataset.remove);
            persist();
            renderDeck();
        });
    });
    $$("#deck-content [data-add], #deck-area [data-add]").forEach((element) => {
        element.addEventListener("click", () => {
            if (!addCardToDeck(profile, element.dataset.add)) {
                alert("Deck cheio ou carta indisponível.");
                return;
            }
            persist();
            renderDeck();
        });
    });
}

// -------------------------------------------------------------------- boot
function bindNavigation() {
    const navMap = {
        "nav-character": "character-area",
        "nav-inventory": "inventory-area",
        "nav-shop": "shop-area",
        "nav-equipment": "equipment-area",
        "nav-craft": "craft-area",
        "nav-chests": "chests-area",
        "nav-deck": "deck-area"
    };
    Object.entries(navMap).forEach(([navId, areaId]) => {
        const button = document.getElementById(navId);
        if (button) button.addEventListener("click", () => switchSection(navId, areaId));
    });

    const battle = document.getElementById("nav-battle");
    if (battle) {
        battle.addEventListener("click", () => {
            if (!profile.character) {
                alert("Crie um personagem antes de entrar em batalha.");
                return;
            }
            persist();
        });
    }

    const sound = document.getElementById("sound-toggle");
    if (sound) {
        sound.textContent = isEnabled() ? "🔊" : "🔇";
        sound.addEventListener("click", () => {
            const enabled = toggleAudio();
            sound.textContent = enabled ? "🔊" : "🔇";
        });
    }

    $("#finalize-purchase-button")?.addEventListener("click", finalizePurchase);
    $("#cc-next")?.addEventListener("click", () => {
        if (creation.step < STEPS.length - 1) {
            creation.step += 1;
            renderCreation();
        }
    });
    $("#cc-back")?.addEventListener("click", () => {
        if (creation.step > 0) {
            creation.step -= 1;
            renderCreation();
        }
    });
}

function boot() {
    bindNavigation();
    renderProfileDisplay();
    renderCreation();
    if (profile.character) {
        $("#character-creator").hidden = true;
        switchSection("nav-inventory", "inventory-area");
    }
    // sanity check: o perfil salvo sempre tem as coleções básicas
    if (!profile.cardCollection) profile = createEmptyProfile();
    if (!profile.materials) profile.materials = {};
    if (!profile.chests) profile.chests = {};
    persist();
}

document.addEventListener("DOMContentLoaded", boot);

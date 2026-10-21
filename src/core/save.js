/**
 * Persistência local do perfil do jogador.
 *
 * Tudo fica no localStorage do navegador: o jogo é 100% local/offline.
 * Nenhum servidor, nenhum backend, nenhuma conta.
 */

import { createStartingProfile } from "../data/catalog.js";
import { CARDS } from "../data/cards.js";
import { deriveStats, getCharacter } from "../data/clans.js";
import { buildCharacterDeck } from "../data/catalog.js";
import { applyEquipment } from "./equipment.js";

const STORAGE_KEY = "narutocard.profile.v2";

/** Perfil novo (sem personagem escolhido ainda). */
export function createEmptyProfile() {
    const base = createStartingProfile();
    return {
        version: 2,
        createdAt: Date.now(),
        character: null,
        level: base.level,
        xp: base.xp,
        xpToNextLevel: base.xpToNextLevel,
        currency: base.currency,
        cardCollection: base.cardCollection,
        deck: [],
        equippedArmor: base.equippedArmor,
        equippedTools: base.equippedTools,
        materials: base.materials,
        chests: base.chests,
        stats: { battles: 0, wins: 0, losses: 0 }
    };
}

/** Lê o perfil salvo (ou null). */
export function loadProfile() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const profile = JSON.parse(raw);
        if (!profile || profile.version !== 2) return null;
        return profile;
    } catch (error) {
        console.warn("Perfil corrompido, começando do zero.", error);
        return null;
    }
}

/** Salva o perfil. */
export function saveProfile(profile) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        return true;
    } catch (error) {
        console.warn("Não foi possível salvar o perfil.", error);
        return false;
    }
}

/** Apaga o perfil. */
export function clearProfile() {
    localStorage.removeItem(STORAGE_KEY);
}

/** Perfil atual ou novo. */
export function getProfile() {
    return loadProfile() || createEmptyProfile();
}

/** Adiciona uma carta à coleção (soma quantidade). */
export function addCardToCollection(profile, cardId, quantity = 1) {
    if (!CARDS[cardId]) return profile;
    const current = profile.cardCollection[cardId] || { quantity: 0, level: 1, xp: 0 };
    current.quantity += quantity;
    profile.cardCollection[cardId] = current;
    return profile;
}

/** Remove (ou não) uma carta da coleção. */
export function removeCardFromCollection(profile, cardId, quantity = 1) {
    const current = profile.cardCollection[cardId];
    if (!current) return false;
    current.quantity = Math.max(0, current.quantity - quantity);
    if (current.quantity === 0) delete profile.cardCollection[cardId];
    return true;
}

/** Coloca a carta no deck (respeitando o limite de 20 cartas). */
export function addCardToDeck(profile, cardId, limit = 20) {
    if (!CARDS[cardId]) return false;
    const owned = profile.cardCollection[cardId];
    const inDeck = profile.deck.filter((id) => id === cardId).length;
    if (!owned || owned.quantity <= inDeck) return false;
    if (profile.deck.length >= limit) return false;
    profile.deck.push(cardId);
    return true;
}

export function removeCardFromDeck(profile, cardId) {
    const index = profile.deck.indexOf(cardId);
    if (index === -1) return false;
    profile.deck.splice(index, 1);
    return true;
}

/**
 * Cria o perfil final de um personagem escolhido.
 * @param {object} profile perfil atual
 * @param {object} character personagem (data/clans.js)
 * @param {object} attributes atributos distribuídos
 * @param {string[]} jutsuPicks ids dos jutsus escolhidos
 */
export function applyCharacterCreation(profile, character, attributes, jutsuPicks = []) {
    const deck = buildCharacterDeck(character, jutsuPicks);

    deck.forEach((cardId) => addCardToCollection(profile, cardId, 1));
    (character.startEquipment || []).forEach((cardId) => {
        addCardToCollection(profile, cardId, 1);
        equipItem(profile, cardId);
    });

    profile.character = {
        clanId: character.clan,
        characterId: character.id,
        name: character.name,
        title: character.title,
        element: character.element,
        attributes: { ...attributes }
    };
    profile.deck = deck.slice();
    profile.level = 1;
    profile.xp = 0;
    profile.xpToNextLevel = 100;
    return profile;
}

/** Equipa um item (arma/armadura) no slot definido pela carta. */
export function equipItem(profile, cardId) {
    const card = CARDS[cardId];
    if (!card || !card.slot) return false;
    const target = card.type === "Arma" ? profile.equippedTools : profile.equippedArmor;
    if (!Object.prototype.hasOwnProperty.call(target, card.slot)) return false;
    target[card.slot] = cardId;
    return true;
}

/** Desequipa um slot. */
export function unequipSlot(profile, slot) {
    if (Object.prototype.hasOwnProperty.call(profile.equippedArmor || {}, slot)) {
        profile.equippedArmor[slot] = null;
        return true;
    }
    if (Object.prototype.hasOwnProperty.call(profile.equippedTools || {}, slot)) {
        profile.equippedTools[slot] = null;
        return true;
    }
    return false;
}

/** Estatísticas de combate do personagem (base + equipamento). */
export function combatStats(profile) {
    if (!profile || !profile.character) {
        return {
            maxHealth: 500,
            maxChakra: 300,
            maxDefense: 60,
            attackBonus: 0,
            jutsuBonus: 0,
            dodgeChance: 0.1,
            accuracy: 0.85,
            critChance: 0.1
        };
    }
    const character = getCharacter(profile.character.clanId, profile.character.characterId);
    const base = deriveStats(profile.character.clanId, profile.character.characterId, profile.character.attributes);
    return applyEquipment(base, profile);
}

/** Deck pronto para a batalha (usa o deck montado; se estiver vazio, usa o do personagem). */
export function battleDeck(profile) {
    if (profile.deck && profile.deck.length) return profile.deck.slice();
    if (!profile.character) return ["jutsu001", "taijutsu001", "item001", "item002"];
    const character = getCharacter(profile.character.clanId, profile.character.characterId);
    return character ? buildCharacterDeck(character, []) : ["jutsu001", "taijutsu001"];
}

/** Soma XP do jogador e sobe de nível quando enche. */
export function gainXp(profile, amount) {
    profile.xp += amount;
    let levels = 0;
    while (profile.xp >= profile.xpToNextLevel) {
        profile.xp -= profile.xpToNextLevel;
        profile.level += 1;
        profile.xpToNextLevel = Math.round(profile.xpToNextLevel * 1.25);
        levels += 1;
    }
    return levels;
}

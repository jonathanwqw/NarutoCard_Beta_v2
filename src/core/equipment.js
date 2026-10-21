/**
 * Equipamento — aplica os bônus passivos de Armaduras e Armas.
 *
 * REGRA: todo `equip_effect` usado por uma carta precisa existir em
 * data/effects.js (EQUIP_EFFECTS) e ter handler implementado aqui
 * (o validador falha o build caso falte).
 */

import { EQUIP_EFFECTS } from "../data/effects.js";
import { ARMOR_SLOTS, TOOL_SLOTS } from "../data/catalog.js";
import { getCard } from "../data/cards.js";

export { ARMOR_SLOTS, TOOL_SLOTS };

/** Handlers de bônus de equipamento: valor -> { health, defense, attack, defensePercent }. */
export const equipEffectHandlers = {
    increase_max_health_and_defense_percent: (value) => ({
        health: (value && value.health) || 0,
        defense: 0,
        attack: 0,
        defensePercent: (value && value.defensePercent) || 0
    }),
    increase_base_defense: (value) => ({
        health: 0,
        defense: Number(value) || 0,
        attack: 0,
        defensePercent: 0
    }),
    increase_base_attack: (value) => ({
        health: 0,
        defense: 0,
        attack: Number(value) || 0,
        defensePercent: 0
    })
};

const EMPTY_BONUS = { health: 0, defense: 0, attack: 0, defensePercent: 0 };

/** Bônus de um equipamento individual. */
export function equipBonus(cardId) {
    const card = getCard(cardId);
    if (!card) return { ...EMPTY_BONUS };
    const effectId = card.equip_effect;
    const handler = equipEffectHandlers[effectId];
    if (!handler) return { ...EMPTY_BONUS };
    const value = card.effectValue !== undefined ? card.effectValue : EQUIP_EFFECTS[effectId].effectValue;
    return handler(value);
}

/**
 * Soma os bônus de todos os equipamentos equipados.
 * @param {object} equipment { equippedArmor: {...}, equippedTools: {...} }
 */
export function totalEquipBonus(equipment = {}) {
    const total = { ...EMPTY_BONUS };
    const slots = [
        ...Object.values(equipment.equippedArmor || {}),
        ...Object.values(equipment.equippedTools || {})
    ].filter(Boolean);

    slots.forEach((cardId) => {
        const bonus = equipBonus(cardId);
        total.health += bonus.health;
        total.defense += bonus.defense;
        total.attack += bonus.attack;
        total.defensePercent += bonus.defensePercent;
    });
    return total;
}

/**
 * Aplica o bônus de equipamento sobre as estatísticas de combate.
 * @param {object} stats estatísticas base (ver data/clans.js deriveStats)
 * @param {object} equipment equipamento do perfil
 */
export function applyEquipment(stats, equipment) {
    const bonus = totalEquipBonus(equipment);
    return {
        ...stats,
        maxHealth: (stats.maxHealth || 0) + bonus.health,
        maxDefense: (stats.maxDefense || 0) + bonus.defense,
        attackBonus: (stats.attackBonus || 0) + bonus.attack,
        defensePercent: bonus.defensePercent
    };
}

/** O item pode ser equipado no slot informado? */
export function canEquip(cardId, slot) {
    const card = getCard(cardId);
    if (!card) return false;
    if (!["Armadura", "Arma"].includes(card.type)) return false;
    if (card.slot && card.slot !== slot) return false;
    if (ARMOR_SLOTS.includes(slot)) return card.type === "Armadura";
    if (TOOL_SLOTS.includes(slot)) return card.type === "Arma";
    return false;
}

/** Ids de efeito de equipamento sem handler (usado pelo validador). */
export function missingEquipHandlers(equipEffectIds = Object.keys(EQUIP_EFFECTS)) {
    return equipEffectIds.filter((effectId) => typeof equipEffectHandlers[effectId] !== "function");
}

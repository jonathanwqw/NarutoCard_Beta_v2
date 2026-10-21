/**
 * Instâncias de carta em partida.
 *
 * A instância é uma cópia da carta do registro + nível/XP do jogador.
 * Todo escalonamento acontece aqui (uma fonte só de verdade).
 */

import { getCard, cardArtPath, cardRarity } from "../data/cards.js";
import { effectInfo } from "../data/effects.js";

/** Multiplicador de nível: +5% de poder por nível acima do 1. */
export function levelMultiplier(level) {
    return 1 + (Math.max(1, level || 1) - 1) * 0.05;
}

/**
 * Cria uma instância de carta. Retorna null se o id não existir no registro
 * (nunca inventa carta "sem designer").
 */
export function createCardInstance(cardId, level = 1, xp = 0) {
    const base = getCard(cardId);
    if (!base) return null;

    const multiplier = levelMultiplier(level);
    const instance = {
        ...base,
        level: Math.max(1, level || 1),
        xp: xp || 0,
        isFusion: false
    };

    instance.attack = Math.round((base.attack || 0) * multiplier);
    instance.defenseBuff = Math.round((base.defenseBuff || 0) * multiplier);
    instance.defensePercent = base.defensePercent ? Math.round(base.defensePercent * 100 * multiplier) / 100 : 0;
    instance.summonDotDamage = Math.round((base.summonDotDamage || 0) * multiplier);
    // valores fracionários são percentuais (ex.: 0.5 = 50%) e NÃO podem ser arredondados
    instance.effectValue = typeof base.effectValue === "number"
        ? (Number.isInteger(base.effectValue)
            ? Math.round(base.effectValue * multiplier)
            : base.effectValue * multiplier)
        : base.effectValue;
    instance.art = cardArtPath(cardId, base);
    instance.rarity = cardRarity(base);
    instance.effectInfo = effectInfo(base.effect || null);
    return instance;
}

/** Cria a instância de uma carta de fusão (não existe no registro). */
export function createFusionInstance(recipe) {
    return {
        id: recipe.id,
        name: recipe.name,
        type: "Jutsu",
        element: recipe.element || "Nenhum",
        cost: recipe.cost,
        description: recipe.description,
        price: 0,
        attack: recipe.attack || 0,
        defenseBuff: 0,
        defensePercent: 0,
        critChance: 0,
        effect: recipe.effect || null,
        effectValue: recipe.effectValue || 0,
        duration: recipe.duration || 0,
        hits: recipe.hits || 1,
        summonDotDamage: 0,
        level: 1,
        xp: 0,
        isFusion: true,
        art: "/assets/cards/fusion.svg",
        rarity: "Lendária",
        effectInfo: effectInfo(recipe.effect || null)
    };
}

/** Soma XP à carta e devolve quantos níveis subiram. */
export function addCardXp(card, amount) {
    card.xp += amount;
    let levelsGained = 0;
    while (card.xp >= card.level * 100) {
        card.xp -= card.level * 100;
        card.level += 1;
        levelsGained += 1;
    }
    return levelsGained;
}

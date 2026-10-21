/**
 * Catálogo de conteúdo: loja, materiais, receitas de craft, baús,
 * fusões e rivais. Tudo aqui referencia ids do registro de cartas.
 */

import { CARDS, isDeckable } from "./cards.js";
import { CLANS } from "./clans.js";

/** Itens vendidos na loja (derivado: tem preço e não é jutsu/material). */
export function shopStock() {
    return Object.entries(CARDS)
        .filter(([, card]) => card.price > 0 && card.type !== "Material" && card.type !== "Jutsu")
        .map(([id, card]) => ({ id, ...card }));
}

/** Perfil inicial de um jogador novo. */
export function createStartingProfile() {
    return {
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        currency: 500,
        cardCollection: {
            jutsu001: { quantity: 2, level: 1, xp: 0 },
            taijutsu001: { quantity: 3, level: 1, xp: 0 },
            item001: { quantity: 5, level: 1, xp: 0 },
            item002: { quantity: 3, level: 1, xp: 0 },
            jutsu004: { quantity: 2, level: 1, xp: 0 },
            armor001: { quantity: 1, level: 1, xp: 0 },
            weapon001: { quantity: 1, level: 1, xp: 0 },
            material001: { quantity: 10, level: 1, xp: 0 }
        },
        deck: [],
        equippedArmor: {
            Cabeça: "armor002",
            Peito: "armor001",
            Pernas: null,
            Pés: null,
            Acessório1: null,
            Acessório2: null
        },
        equippedTools: {
            Ferramenta1: "weapon001",
            Ferramenta2: null,
            Ferramenta3: null
        },
        materials: {
            material001: 10
        },
        chests: {
            common_chest: 1
        }
    };
}

/** Slots de equipamento aceitos por tipo de item. */
export const ARMOR_SLOTS = ["Cabeça", "Peito", "Pernas", "Pés", "Acessório1", "Acessório2"];
export const TOOL_SLOTS = ["Ferramenta1", "Ferramenta2", "Ferramenta3"];

/** Receitas de craft. */
export const CRAFTING_RECIPES = [
    {
        id: "recipe001",
        resultCardId: "item006",
        resultQuantity: 2,
        materialsNeeded: { material001: 3 },
        description: "Cria 2 Bandagens usando 3 Ervas Medicinais."
    },
    {
        id: "recipe002",
        resultCardId: "item010",
        resultQuantity: 1,
        materialsNeeded: { material001: 2, material003: 2 },
        description: "Cria 1 Pílula Chakra usando 2 Ervas Medicinais e 2 Pós de Chakra."
    },
    {
        id: "recipe003",
        resultCardId: "weapon001",
        resultQuantity: 1,
        materialsNeeded: { material002: 5, material003: 3 },
        description: "Forja a Espada Kusanagi usando 5 Fragmentos de Metal e 3 Pós de Chakra."
    },
    {
        id: "recipe004",
        resultCardId: "armor001",
        resultQuantity: 1,
        materialsNeeded: { material002: 6, material001: 2 },
        description: "Costura o Colete Chūnin usando 6 Fragmentos de Metal e 2 Ervas Medicinais."
    }
];

/** Baús e suas recompensas possíveis. */
export const CHESTS = {
    common_chest: {
        id: "common_chest",
        name: "Baú Comum",
        description: "Contém cartas e itens comuns.",
        pool: ["item001", "item003", "item006", "taijutsu001", "taijutsu002", "item002", "item010", "buff002"],
        currency: 40
    }
};

/** Fusões: duas cartas da mão viram um jutsu mais forte. */
export const FUSION_RECIPES = [
    {
        id: "fusion_rasengan_gigante",
        req: ["jutsu001", "jutsu001"],
        name: "Rasengan Gigante",
        cost: 50,
        attack: 90,
        effect: "knockback",
        effectValue: 25,
        duration: 2,
        element: "Vento",
        description: "Fusão de 2 Rasengan: 90 de dano massivo que empurra o alvo."
    },
    {
        id: "fusion_rasenshuriken",
        req: ["jutsu002", "jutsu001"],
        name: "Rasenshuriken",
        cost: 65,
        attack: 110,
        effect: "ignore_defense",
        element: "Vento",
        description: "Chidori + Rasengan: 110 de dano, ignora a defesa."
    },
    {
        id: "fusion_grande_bola_de_fogo",
        req: ["jutsu004", "jutsu004"],
        name: "Grande Bola de Fogo",
        cost: 45,
        attack: 80,
        effect: "burn",
        effectValue: 20,
        duration: 2,
        element: "Fogo",
        description: "2 Bolas de Fogo: 80 de dano + queimadura de 20 por turno."
    },
    {
        id: "fusion_chidori_nagashi",
        req: ["jutsu002", "jutsu002"],
        name: "Chidori Nagashi Bolts",
        cost: 55,
        attack: 95,
        effect: "stun",
        duration: 1,
        element: "Raio",
        description: "2 Chidori: 95 de dano + atordoa por 1 turno."
    },
    {
        id: "fusion_vapor_escaldante",
        req: ["jutsu005", "jutsu004"],
        name: "Vapor Escaldante",
        cost: 60,
        attack: 100,
        effect: "burn",
        effectValue: 25,
        duration: 2,
        element: "Água",
        description: "Água + Fogo: 100 de dano + queimadura vaporizada."
    },
    {
        id: "fusion_combo_multiplo",
        req: ["taijutsu001", "taijutsu002"],
        name: "Combo Múltiplo",
        cost: 30,
        attack: 60,
        effect: "multi_hit",
        hits: 3,
        element: "Nenhum",
        description: "Golpes rápidos: 60 de dano em 3 acertos."
    },
    {
        id: "fusion_bencao_medica",
        req: ["jutsu012", "jutsu012"],
        name: "Bênção Médica",
        cost: 40,
        effect: "heal",
        effectValue: 100,
        element: "Nenhum",
        description: "2 Jutsus Médicos: recupera 100 de vida."
    }
];

/** Encontra a fusão possíveis para um par de cartas. */
export function findFusion(idA, idB) {
    return FUSION_RECIPES.find((recipe) =>
        (recipe.req[0] === idA && recipe.req[1] === idB) ||
        (recipe.req[0] === idB && recipe.req[1] === idA)
    ) || null;
}

/** Rivais da arena (IA local). */
export const RIVALS = [
    { name: "Sasuke Uchiha", element: "Raio", clan: "folha" },
    { name: "Gaara", element: "Terra", clan: "areia" },
    { name: "Neji Hyuga", element: "Vento", clan: "folha" },
    { name: "Rock Lee", element: "Nenhum", clan: "folha" },
    { name: "Orochimaru", element: "Terra", clan: "akatsuki" },
    { name: "Kabuto Yakushi", element: "Nenhum", clan: "pedra" },
    { name: "Kimimaro", element: "Terra", clan: "pedra" },
    { name: "Zabuza Momochi", element: "Água", clan: "nevoa" },
    { name: "Haku", element: "Água", clan: "nevoa" },
    { name: "Itachi Uchiha", element: "Fogo", clan: "akatsuki" },
    { name: "Kisame Hoshigaki", element: "Água", clan: "nevoa" },
    { name: "Deidara", element: "Terra", clan: "pedra" },
    { name: "Sasori", element: "Nenhum", clan: "areia" },
    { name: "Pain (Tendo)", element: "Vento", clan: "akatsuki" },
    { name: "Konan", element: "Vento", clan: "akatsuki" }
];

/** Deck inicial do oponente (IA). */
export const OPPONENT_DECK = [
    "jutsu004", "taijutsu001", "item001", "jutsu001", "taijutsu002",
    "item003", "jutsu004", "taijutsu001", "item001", "jutsu001",
    "taijutsu002", "item003", "jutsu004", "taijutsu001", "item001",
    "jutsu001", "taijutsu002", "item003", "jutsu004", "taijutsu001"
];

/**
 * Deck temático de um rival: usa o cardPool do clã dele.
 * @param {object} rival item de RIVALS
 * @param {function} randomFonte () => número em [0,1)
 */
export function buildRivalDeck(rival, randomFonte = Math.random) {
    const clan = CLANS[rival && rival.clan];
    const pool = clan
        ? clan.cardPool.filter((cardId) => CARDS[cardId] && isDeckable(CARDS[cardId]))
        : [];
    const basics = ["taijutsu001", "taijutsu002", "item001", "item003"].filter((id) => CARDS[id]);
    const deck = [];
    const source = pool.length ? pool : basics;
    while (deck.length < 16) {
        deck.push(source[Math.floor(randomFonte() * source.length)]);
    }
    while (deck.length < 20) {
        deck.push(basics[Math.floor(randomFonte() * basics.length)]);
    }
    return deck;
}

/** Estatísticas de combate de um rival (sem equipamento). */
export function rivalStats(rival) {
    const element = rival.element || "Nenhum";
    const elementStats = {
        Vento: { health: 500, chakra: 320 },
        Fogo: { health: 480, chakra: 340 },
        Raio: { health: 470, chakra: 360 },
        Água: { health: 520, chakra: 300 },
        Terra: { health: 560, chakra: 280 },
        Nenhum: { health: 500, chakra: 320 }
    }[element] || { health: 500, chakra: 320 };

    return {
        name: rival.name,
        element,
        maxHealth: elementStats.health,
        maxChakra: elementStats.chakra,
        maxDefense: 60,
        attackBonus: 10,
        critChanceBonus: 0.05,
        dodgeChance: 0.1,
        accuracy: 0.85,
        jutsuPower: 0,
        deck: buildRivalDeck(rival)
    };
}

/** Deck de um personagem: cartas iniciais + jutsus escolhidos na criação. */
export function buildCharacterDeck(character, extraCardIds = []) {
    const counts = {};
    const add = (id, amount = 1) => {
        if (!CARDS[id] || !isDeckable(CARDS[id])) return;
        counts[id] = (counts[id] || 0) + amount;
    };
    (character.startCards || []).forEach((id) => add(id));
    (extraCardIds || []).forEach((id) => add(id));
    (character.jutsuPicks || []).forEach((id) => add(id));
    const deck = [];
    Object.entries(counts).forEach(([id, amount]) => {
        for (let i = 0; i < amount; i++) deck.push(id);
    });
    return deck;
}

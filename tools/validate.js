#!/usr/bin/env node
/**
 * VALIDADOR DE CONTEÚDO — npm run validate
 *
 * Este é o arquivo que materializa as regras do projeto. Ele falha (exit 1)
 * quando encontra conteúdo "sem designer": carta sem arte, carta com efeito
 * que não existe no catálogo, carta com efeito sem handler na partida,
 * personagem que promete um jutsu diferente da carta, id reaproveitado,
 * material que não existe, etc.
 *
 * Uso:
 *   node tools/validate.js            # valida tudo
 *   node tools/validate.js --no-art   # ignora a checagem de arte (ex.: CI sem assets)
 */

import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { CARDS, CARD_TYPES, getCard, isDeckable, cardArtPath } from "../src/data/cards.js";
import { EFFECTS, EFFECT_IDS, EQUIP_EFFECTS, EQUIP_EFFECT_IDS, PERCENT_EFFECTS } from "../src/data/effects.js";
import { ELEMENT_IDS } from "../src/data/elements.js";
import { CLANS, CHARACTER_LIST } from "../src/data/clans.js";
import {
    FUSION_RECIPES,
    CRAFTING_RECIPES,
    CHESTS,
    RIVALS,
    shopStock
} from "../src/data/catalog.js";
import { missingEffectHandlers, orphanEffectHandlers, MODIFIER_EFFECTS } from "../src/core/effect-runtime.js";
import { missingEquipHandlers } from "../src/core/equipment.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skipArt = process.argv.includes("--no-art");

const errors = [];
const warnings = [];
const stats = [];

function error(message) {
    errors.push(message);
}

function warn(message) {
    warnings.push(message);
}

function count(label, value) {
    stats.push({ label, value });
}

// ------------------------------------------------------------------ cartas
function validateCards() {
    const ids = Object.keys(CARDS);
    count("Cartas", ids.length);

    const seenIds = new Set();
    ids.forEach((id) => {
        if (seenIds.has(id)) error(`Carta duplicada no registro: "${id}".`);
        seenIds.add(id);

        const card = CARDS[id];
        const where = `Carta ${id} (${card.name || "sem nome"})`;

        if (!card.name || typeof card.name !== "string") error(`${where}: campo "name" ausente.`);
        if (!CARD_TYPES.includes(card.type)) {
            error(`${where}: type "${card.type}" inválido. Use um de: ${CARD_TYPES.join(", ")}.`);
        }
        if (!ELEMENT_IDS.includes(card.element)) {
            error(`${where}: element "${card.element}" inválido. Use um de: ${ELEMENT_IDS.join(", ")}.`);
        }
        if (typeof card.cost !== "number" || card.cost < 0) error(`${where}: "cost" precisa ser um número >= 0.`);
        if (typeof card.price !== "number" || card.price < 0) error(`${where}: "price" precisa ser um número >= 0.`);
        if (!card.description || card.description.trim().length < 8) {
            error(`${where}: "description" vazia ou curta demais — a carta precisa contar o que faz.`);
        }
        if (card.attack === undefined && card.defenseBuff === undefined && !card.effect && !card.defensePercent) {
            if (card.type === "Material") {
                if (!card.craft_use) error(`${where}: material sem "craft_use" — diz onde ele é usado?`);
            } else {
                error(`${where}: não faz nada (sem ataque, defesa nem efeito) — carta sem designer.`);
            }
        }
        if (card.critChance !== undefined && (card.critChance < 0 || card.critChance > 1)) {
            error(`${where}: "critChance" precisa estar entre 0 e 1.`);
        }
        if (card.hits !== undefined && (card.hits < 1 || !Number.isInteger(card.hits))) {
            error(`${where}: "hits" precisa ser um inteiro >= 1.`);
        }
        if (card.effect && !EFFECTS[card.effect]) {
            error(`${where}: efeito "${card.effect}" não existe em data/effects.js.`);
        }
        if (card.aliases !== undefined && (!Array.isArray(card.aliases) || card.aliases.length === 0)) {
            error(`${where}: "aliases" deve ser uma lista não vazia (ou o campo não deve existir).`);
        }
        if (card.aliases && card.aliases.includes(card.name)) {
            error(`${where}: alias duplicando o nome próprio ("${card.name}").`);
        }
        if (card.equip_effect && !EQUIP_EFFECTS[card.equip_effect]) {
            error(`${where}: equip_effect "${card.equip_effect}" não existe em data/effects.js (EQUIP_EFFECTS).`);
        }
        if (["Armadura", "Arma"].includes(card.type) && !card.equip_effect) {
            error(`${where}: equipamento sem "equip_effect" — não dá para saber o bônus.`);
        }
        if (card.effect === "multi_hit" && !card.hits) {
            error(`${where}: multi_hit sem "hits".`);
        }
        if (card.effect === "chakra_drain" && typeof card.effectValue !== "number") {
            error(`${where}: chakra_drain sem "effectValue" numérico.`);
        }
        if (PERCENT_EFFECTS.includes(card.effect)) {
            const value = card.effectValue;
            if (typeof value !== "number" || value <= 0 || value > 1) {
                error(`${where}: "${card.effect}" é um efeito percentual — effectValue precisa ser uma fração entre 0 e 1 (ex.: 0.5 = 50%), mas é ${value}.`);
            }
        }
    });

    // arte
    if (!skipArt) {
        const missingArt = [];
        ids.forEach((id) => {
            const artPath = path.join(ROOT, cardArtPath(id, CARDS[id]));
            if (!existsSync(artPath)) missingArt.push(id);
        });
        if (missingArt.length) {
            error(`Arte ausente para ${missingArt.length} carta(s): ${missingArt.join(", ")}. ` +
                "Gere com `npm run art` ou substitua por arte real com o mesmo nome.");
        }
        count("Cartas com arte", ids.length - missingArt.length);
    }
}

// ----------------------------------------------------------------- efeitos
function validateEffects() {
    count("Efeitos", EFFECT_IDS.length);

    const missing = missingEffectHandlers(EFFECT_IDS);
    if (missing.length) {
        error(`Efeito(s) no catálogo sem handler em src/core/effect-runtime.js: ${missing.join(", ")}.`);
    }
    const orphans = orphanEffectHandlers(EFFECT_IDS);
    if (orphans.length) {
        error(`Handler(s) sem entrada no catálogo de efeitos: ${orphans.join(", ")}.`);
    }

    const missingEquip = missingEquipHandlers(EQUIP_EFFECT_IDS);
    if (missingEquip.length) {
        error(`Efeito(s) de equipamento sem handler em src/core/equipment.js: ${missingEquip.join(", ")}.`);
    }

    // efeitos usados por cartas x catálogo
    const used = new Set();
    Object.values(CARDS).forEach((card) => {
        if (card.effect) used.add(card.effect);
    });
    FUSION_RECIPES.forEach((recipe) => {
        if (recipe.effect) used.add(recipe.effect);
    });
    const unused = EFFECT_IDS.filter((id) => !used.has(id));
    if (unused.length) {
        warn(`Efeito(s) no catálogo sem nenhuma carta usando: ${unused.join(", ")}.`);
    }

    // modifier effects precisam ter os campos de cálculo
    Object.entries(CARDS).forEach(([id, card]) => {
        if (card.effect === "ignore_defense_value" && typeof card.effectValue !== "number") {
            error(`Carta ${id}: ignore_defense_value precisa de "effectValue" numérico.`);
        }
    });
    if (!MODIFIER_EFFECTS.has("multi_hit")) error("MODIFIER_EFFECTS deveria conter multi_hit.");
}

// -------------------------------------------------------------- clãs/chars
function validateClans() {
    count("Personagens", CHARACTER_LIST.length);
    const ids = new Set(Object.keys(CARDS));

    Object.entries(CLANS).forEach(([clanId, clan]) => {
        if (!clan.name) error(`Clã ${clanId}: sem nome.`);
        (clan.cardPool || []).forEach((cardId) => {
            if (!ids.has(cardId)) error(`Clã ${clanId}: cardPool aponta para carta inexistente "${cardId}".`);
            else if (!isDeckable(CARDS[cardId])) warn(`Clã ${clanId}: cardPool inclui "${cardId}", que não vai para o deck.`);
        });
        (clan.rewardPool || []).forEach((cardId) => {
            if (!ids.has(cardId)) error(`Clã ${clanId}: rewardPool aponta para carta inexistente "${cardId}".`);
        });

        Object.entries(clan.characters || {}).forEach(([charId, character]) => {
            const where = `Personagem ${character.name || charId}`;
            const signatureId = character.signature && character.signature.cardId;
            if (!signatureId || !ids.has(signatureId)) {
                error(`${where}: signature.cardId "${signatureId}" não existe no registro de cartas.`);
            } else {
                const signatureCard = getCard(signatureId);
                const knownNames = [signatureCard.name, ...(signatureCard.aliases || [])];
                if (!knownNames.includes(character.signature.name)) {
                    error(`${where}: signature.name "${character.signature.name}" não é um nome conhecido da ` +
                        `carta ${signatureId} (conhecidos: ${knownNames.join(", ")}).`);
                }
            }
            const jutsu = character.jutsu || {};
            if (!jutsu.cardId || !ids.has(jutsu.cardId)) {
                error(`${where}: jutsu.cardId "${jutsu.cardId}" não existe no registro de cartas.`);
            } else {
                const card = getCard(jutsu.cardId);
                const cardEffect = card.effect || null;
                const charEffect = jutsu.effect || null;
                if (cardEffect !== charEffect) {
                    error(`${where}: jutsu.effect "${charEffect}" não bate com o efeito real da carta ` +
                        `${jutsu.cardId} ("${cardEffect}").`);
                }
                if (typeof jutsu.cost === "number" && jutsu.cost !== card.cost) {
                    error(`${where}: jutsu.cost ${jutsu.cost} != custo real da carta ${jutsu.cardId} (${card.cost}).`);
                }
                if (typeof jutsu.attack === "number" && jutsu.attack !== (card.attack || 0)) {
                    error(`${where}: jutsu.attack ${jutsu.attack} != ataque real da carta ${jutsu.cardId} (${card.attack || 0}).`);
                }
                if (jutsu.element && jutsu.element !== card.element) {
                    error(`${where}: jutsu.element "${jutsu.element}" != elemento real da carta ${jutsu.cardId} ("${card.element}").`);
                }
                const cardDefensePercent = card.defensePercent || 0;
                const charDefensePercent = jutsu.defensePercent || 0;
                if (cardDefensePercent !== charDefensePercent) {
                    error(`${where}: jutsu.defensePercent ${charDefensePercent} != redução real da carta ` +
                        `${jutsu.cardId} (${cardDefensePercent}).`);
                }
            }
            (character.startCards || []).forEach((cardId) => {
                if (!ids.has(cardId)) error(`${where}: startCards inclui carta inexistente "${cardId}".`);
                else if (!isDeckable(CARDS[cardId])) error(`${where}: startCards inclui "${cardId}", que não entra no deck.`);
            });
            (character.startEquipment || []).forEach((cardId) => {
                if (!ids.has(cardId)) error(`${where}: startEquipment inclui item inexistente "${cardId}".`);
                else if (!["Armadura", "Arma"].includes(CARDS[cardId].type)) {
                    error(`${where}: startEquipment inclui "${cardId}", que não é equipamento.`);
                }
            });
        });
    });
}

// -------------------------------------------------------------- conteúdo
function validateContent() {
    const ids = new Set(Object.keys(CARDS));

    FUSION_RECIPES.forEach((recipe) => {
        const where = `Fusão ${recipe.name}`;
        if (!recipe.req || recipe.req.length !== 2) error(`${where}: "req" precisa ter exatamente 2 cartas.`);
        (recipe.req || []).forEach((cardId) => {
            if (!ids.has(cardId)) error(`${where}: req aponta para carta inexistente "${cardId}".`);
        });
        if (recipe.effect && !EFFECTS[recipe.effect]) error(`${where}: efeito "${recipe.effect}" não existe no catálogo.`);
        if (recipe.attack === undefined && !recipe.effect) error(`${where}: fusão sem ataque nem efeito.`);
    });

    CRAFTING_RECIPES.forEach((recipe) => {
        const where = `Receita ${recipe.id}`;
        if (!ids.has(recipe.resultCardId)) error(`${where}: resultCardId "${recipe.resultCardId}" inexistente.`);
        Object.entries(recipe.materialsNeeded || {}).forEach(([materialId, amount]) => {
            if (!ids.has(materialId)) error(`${where}: material "${materialId}" inexistente.`);
            else if (CARDS[materialId].type !== "Material") error(`${where}: "${materialId}" não é do tipo Material.`);
            if (amount <= 0) error(`${where}: quantidade inválida para "${materialId}".`);
        });
    });

    Object.values(CHESTS).forEach((chest) => {
        (chest.pool || []).forEach((cardId) => {
            if (!ids.has(cardId)) error(`Baú ${chest.id}: pool com carta inexistente "${cardId}".`);
        });
    });

    RIVALS.forEach((rival) => {
        if (!rival.name) error("Rival sem nome.");
        if (!ELEMENT_IDS.includes(rival.element)) error(`Rival ${rival.name}: elemento inválido "${rival.element}".`);
    });

    shopStock().forEach((item) => {
        if (!item.name || !item.description) error(`Loja: item "${item.id}" sem nome/descrição.`);
    });
}

// ------------------------------------------------------------------ saída
function report() {
    const lines = [];
    lines.push("");
    lines.push("╔══════════════════════════════════════════════════════════╗");
    lines.push("║            VALIDADOR DE CONTEÚDO — NarutoCard           ║");
    lines.push("╚══════════════════════════════════════════════════════════╝");
    stats.forEach(({ label, value }) => {
        lines.push(`  ${label.padEnd(28)} ${String(value).padStart(5)}`);
    });
    lines.push("");

    if (warnings.length) {
        lines.push(`⚠️  ${warnings.length} aviso(s):`);
        warnings.forEach((message) => lines.push(`   - ${message}`));
        lines.push("");
    }

    if (errors.length) {
        lines.push(`❌ ${errors.length} erro(s):`);
        errors.forEach((message) => lines.push(`   - ${message}`));
        lines.push("");
        lines.push("Resultado: FALHOU. Corrija os itens acima antes de commitar.");
        console.error(lines.join("\n"));
        process.exit(1);
    }

    lines.push("✅ Tudo certo: nenhuma carta/efeito sem designer.");
    console.log(lines.join("\n"));
}

validateCards();
validateEffects();
validateClans();
validateContent();
report();

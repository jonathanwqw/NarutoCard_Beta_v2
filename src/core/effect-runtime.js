/**
 * Runtime dos efeitos — o SEMPREXISTO de como cada efeito se comporta.
 *
 * REGRA (ver AGENTS.md): este arquivo é o único lugar onde a semântica de um
 * efeito é implementada. Se uma carta declara um efeito, este arquivo precisa
 * ter o handler — o validador (npm run validate) falha o build caso falte.
 * É essa regra que impede carta/efeito "sem designer" (efeito que nunca
 * acontece em partida).
 *
 * Dois grupos:
 *  - MODIFIER_EFFECTS: alteram o cálculo de dano (chamados antes do dano).
 *  - os demais: são aplicados quando a carta é jogada (chamados depois).
 */

import { EFFECTS } from "../data/effects.js";

/** Efeitos que apenas modificam o cálculo de dano. */
export const MODIFIER_EFFECTS = new Set([
    "ignore_defense",
    "ignore_defense_value",
    "piercing_attack",
    "area_attack",
    "multi_hit"
]);

/**
 * Handlers de efeito.
 * Cada handler recebe o contexto da jogada e devolve (opcionalmente) um
 * modificador de dano.
 */
export const effectHandlers = {
    // ------------------------------------------------------- modificadores
    ignore_defense: () => ({ ignoreDefense: true }),
    ignore_defense_value: (ctx) => ({ ignoreDefenseValue: ctx.card.effectValue || 0 }),
    piercing_attack: () => ({ pierceDefensePercent: 0.5 }),
    area_attack: () => ({ areaPiercePercent: 0.4 }),
    multi_hit: (ctx) => ({ hits: ctx.card.hits || 1 }),

    // ------------------------------------------------------------ utilidade
    draw_card: (ctx) => {
        ctx.draw(ctx.card.effectValue || 1, ctx.casterKey);
        ctx.log(`${ctx.caster.name} comprou ${ctx.card.effectValue || 1} carta(s).`, "log-system");
    },
    heal: (ctx) => {
        const amount = ctx.card.effectValue || 0;
        const healed = ctx.heal(ctx.casterKey, amount);
        ctx.log(`${ctx.caster.name} recuperou ${healed} de Vida.`, "log-heal");
    },
    recover_chakra: (ctx) => {
        const amount = ctx.card.effectValue || 0;
        const restored = ctx.restoreChakra(ctx.casterKey, amount);
        ctx.log(`${ctx.caster.name} recuperou ${restored} de Chakra.`, "log-status");
    },
    remove_debuffs: (ctx) => {
        const removed = ctx.removeStatus(ctx.casterKey, (effect) =>
            ["debuff", "dot", "burn", "poison", "bleed", "summon_dot", "fail_attack", "draw_less", "reduce_attack_percent", "defense_flat"].includes(effect.type)
        );
        ctx.log(removed.length
            ? `${ctx.caster.name} removeu ${removed.length} efeito(s) negativo(s).`
            : `${ctx.card.name} usado, mas não havia efeito negativo.`,
        removed.length ? "log-heal" : "log-status");
    },

    // --------------------------------------------------------------- dano
    burn: (ctx) => {
        ctx.addStatus(ctx.targetKey, {
            name: ctx.card.name,
            type: "burn",
            effect: "burn",
            value: ctx.card.effectValue || 0,
            duration: ctx.card.duration || 1,
            sourceCardId: ctx.card.id,
            description: ctx.card.description
        });
        ctx.log(`${ctx.target.name} foi queimado por ${ctx.card.name}!`, "log-damage");
    },
    poison: (ctx) => {
        ctx.addStatus(ctx.targetKey, {
            name: ctx.card.name,
            type: "poison",
            effect: "poison",
            value: ctx.card.effectValue || 0,
            duration: ctx.card.duration || 1,
            sourceCardId: ctx.card.id,
            description: ctx.card.description
        });
        ctx.log(`${ctx.target.name} foi envenenado por ${ctx.card.name}!`, "log-damage");
    },
    bleed: (ctx) => {
        ctx.addStatus(ctx.targetKey, {
            name: ctx.card.name,
            type: "bleed",
            effect: "bleed",
            value: ctx.card.effectValue || 0,
            duration: ctx.card.duration || 1,
            sourceCardId: ctx.card.id,
            description: ctx.card.description
        });
        ctx.log(`${ctx.target.name} está SANGRANDO por ${ctx.card.name}!`, "log-critical");
    },
    summon_dot: (ctx) => {
        ctx.addStatus(ctx.targetKey, {
            name: ctx.card.name,
            type: "summon_dot",
            effect: "summon_dot",
            value: ctx.card.summonDotDamage || 0,
            duration: ctx.card.duration || 1,
            sourceCardId: ctx.card.id,
            description: ctx.card.description
        });
        ctx.log(`${ctx.card.name} invocada! Dano contínuo em ${ctx.target.name}.`, "log-damage");
    },

    // ------------------------------------------------------------ controle
    stun: (ctx) => {
        ctx.addStatus(ctx.targetKey, {
            name: ctx.card.name,
            type: "stun",
            effect: "stun",
            value: 1,
            duration: ctx.card.duration || 1,
            sourceCardId: ctx.card.id,
            description: "Atordoado"
        });
        ctx.log(`${ctx.target.name} foi ATORDOADO!`, "log-critical");
    },
    opponent_discard: (ctx) => {
        const amount = ctx.card.effectValue || 1;
        for (let i = 0; i < amount; i++) {
            const discarded = ctx.discardRandomCard(ctx.targetKey);
            if (!discarded) break;
            ctx.log(`${ctx.target.name} descartou ${discarded.name}.`, "log-damage");
        }
    },
    opponent_draw_less: (ctx) => {
        ctx.addStatus(ctx.targetKey, {
            name: ctx.card.name,
            type: "draw_less",
            effect: "opponent_draw_less",
            value: ctx.card.effectValue || 1,
            duration: ctx.card.duration || 1,
            sourceCardId: ctx.card.id,
            description: ctx.card.description
        });
        ctx.log(`${ctx.target.name} foi atingido por ${ctx.card.name}!`, "log-damage");
    },
    enemy_attack_fail_chance: (ctx) => {
        ctx.addStatus(ctx.targetKey, {
            name: ctx.card.name,
            type: "fail_attack",
            effect: "enemy_attack_fail_chance",
            value: ctx.card.effectValue || 0.5,
            duration: ctx.card.duration || 1,
            sourceCardId: ctx.card.id,
            description: ctx.card.description
        });
        ctx.log(`${ctx.target.name} está confuso por ${ctx.card.name}!`, "log-damage");
    },
    self_damage: (ctx) => {
        const amount = ctx.card.effectValue || 0;
        ctx.dealDamage(ctx.casterKey, amount, { source: "self_damage" });
        ctx.log(`${ctx.caster.name} sofreu ${amount} de dano colateral.`, "log-damage");
    },

    // -------------------------------------------------------------- defesa
    reduce_defense: (ctx) => {
        ctx.addStatus(ctx.targetKey, {
            name: ctx.card.name,
            type: "defense_flat",
            effect: "reduce_defense",
            value: ctx.card.effectValue || 0,
            duration: ctx.card.duration || 1,
            sourceCardId: ctx.card.id,
            description: `-${ctx.card.effectValue || 0} de Defesa`
        });
        ctx.log(`${ctx.target.name} perdeu ${ctx.card.effectValue || 0} de Defesa!`, "log-damage");
    },
    reduce_next_enemy_attack_percent: (ctx) => {
        ctx.addStatus(ctx.targetKey, {
            name: ctx.card.name,
            type: "reduce_attack_percent",
            effect: "reduce_next_enemy_attack_percent",
            value: ctx.card.effectValue || 0.5,
            // +1 turno: o motor reduz a duração no início do turno do alvo,
            // e o efeito precisa sobreviver até o próximo ataque dele.
            duration: (ctx.card.duration || 1) + 1,
            sourceCardId: ctx.card.id,
            description: ctx.card.description
        });
        ctx.log(`${ctx.target.name} foi encoberto pela ${ctx.card.name}!`, "log-status");
    },
    block_all_damage: (ctx) => {
        ctx.addStatus(ctx.casterKey, {
            name: ctx.card.name,
            type: "block_all_damage",
            effect: "block_all_damage",
            value: 1,
            duration: ctx.card.duration || 1,
            sourceCardId: ctx.card.id,
            description: "Bloqueia todo o dano"
        });
        ctx.log(`${ctx.caster.name} ativou ${ctx.card.name}!`, "log-status");
    },
    knockback: (ctx) => {
        ctx.target.defense = 0;
        ctx.addStatus(ctx.targetKey, {
            name: ctx.card.name,
            type: "defense_flat",
            effect: "knockback",
            value: ctx.card.effectValue || 0,
            duration: ctx.card.duration || 1,
            sourceCardId: ctx.card.id,
            description: `Defesa quebrada (-${ctx.card.effectValue || 0})`
        });
        ctx.log(`${ctx.target.name} teve a defesa quebrada por ${ctx.card.name}!`, "log-critical");
    },

    // ---------------------------------------------------------------- buffs
    buff_next_taijutsu: (ctx) => {
        ctx.addStatus(ctx.casterKey, {
            name: ctx.card.name,
            type: "buff_taijutsu_atk",
            effect: "buff_next_taijutsu",
            value: ctx.card.effectValue || 0,
            duration: ctx.card.duration || 99,
            sourceCardId: ctx.card.id,
            description: `+${ctx.card.effectValue || 0} de Ataque no próximo Taijutsu`
        });
        ctx.log(`${ctx.caster.name} ativou ${ctx.card.name}!`, "log-status");
    },
    reduce_next_jutsu_cost: (ctx) => {
        ctx.addStatus(ctx.casterKey, {
            name: ctx.card.name,
            type: "reduce_next_jutsu_cost",
            effect: "reduce_next_jutsu_cost",
            value: ctx.card.effectValue || 0,
            duration: ctx.card.duration || 1,
            sourceCardId: ctx.card.id,
            description: `-${ctx.card.effectValue || 0} de Chakra no próximo Jutsu`
        });
        ctx.log(`${ctx.caster.name} ativou ${ctx.card.name}!`, "log-status");
    },
    increase_crit_chance: (ctx) => {
        ctx.addStatus(ctx.casterKey, {
            name: ctx.card.name,
            type: "crit_chance",
            effect: "increase_crit_chance",
            value: ctx.card.effectValue || 0,
            duration: ctx.card.duration || 1,
            sourceCardId: ctx.card.id,
            description: `+${Math.round((ctx.card.effectValue || 0) * 100)}% de crítico`
        });
        ctx.log(`${ctx.caster.name} ativou ${ctx.card.name}!`, "log-status");
    },
    stat_boost: (ctx) => {
        ctx.addStatus(ctx.casterKey, {
            name: ctx.card.name,
            type: "stat_boost",
            effect: "stat_boost",
            value: ctx.card.boost || {},
            duration: ctx.card.duration || 1,
            sourceCardId: ctx.card.id,
            description: ctx.card.description
        });
        ctx.log(`${ctx.caster.name} ativou ${ctx.card.name}!`, "log-status");
    },
    stat_boost_regen: (ctx) => {
        ctx.addStatus(ctx.casterKey, {
            name: ctx.card.name,
            type: "stat_boost",
            effect: "stat_boost_regen",
            value: ctx.card.boost || {},
            duration: ctx.card.duration || 1,
            sourceCardId: ctx.card.id,
            regen: ctx.card.regen || {},
            description: ctx.card.description
        });
        ctx.log(`${ctx.caster.name} ativou ${ctx.card.name}!`, "log-status");
    },
    stat_boost_self_dmg: (ctx) => {
        ctx.addStatus(ctx.casterKey, {
            name: ctx.card.name,
            type: "stat_boost",
            effect: "stat_boost_self_dmg",
            value: ctx.card.boost || {},
            duration: ctx.card.duration || 1,
            sourceCardId: ctx.card.id,
            self_dmg: ctx.card.self_dmg || 0,
            description: ctx.card.description
        });
        ctx.log(`${ctx.caster.name} ativou ${ctx.card.name}!`, "log-status");
    },
    reveal_hand_accuracy_boost: (ctx) => {
        ctx.addStatus(ctx.casterKey, {
            name: ctx.card.name,
            type: "reveal_hand",
            effect: "reveal_hand_accuracy_boost",
            value: ctx.card.boost || {},
            duration: ctx.card.duration || 1,
            sourceCardId: ctx.card.id,
            description: ctx.card.description
        });
        ctx.log(`${ctx.caster.name} ativou ${ctx.card.name}!`, "log-status");
    },

    // ---------------------------------------------------------------- dreno
    chakra_drain: (ctx) => {
        const amount = ctx.card.effectValue || 0;
        const drained = Math.min(ctx.target.chakra, amount);
        ctx.target.chakra -= drained;
        if (drained > 0) {
            ctx.emit("chakra", { key: ctx.targetKey, amount: drained, gained: false });
            ctx.restoreChakra(ctx.casterKey, drained);
            ctx.log(`${ctx.target.name} perdeu ${drained} de Chakra para ${ctx.caster.name}!`, "log-damage");
        }
    },

    // -------------------------------------------------------------- passivo
    equip_passive: (ctx) => {
        // O bônus de equipamento é aplicado no momento de equipar
        // (ver core/equipment.js). Em partida, a carta é apenas informativa.
        ctx.log(`${ctx.card.name} está equipado.`, "log-status");
    }
};

/** Ids de efeito presentes no catálogo e sem handler (usado pelo validador). */
export function missingEffectHandlers(effectIds = Object.keys(EFFECTS)) {
    return effectIds.filter((effectId) => typeof effectHandlers[effectId] !== "function");
}

/** Ids de efeito com handler mas fora do catálogo (efeito órfão). */
export function orphanEffectHandlers(catalogIds = Object.keys(EFFECTS)) {
    return Object.keys(effectHandlers).filter((effectId) => !catalogIds.includes(effectId));
}

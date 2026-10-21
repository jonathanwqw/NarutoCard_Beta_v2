/**
 * Catálogo de efeitos — fonte única de verdade.
 *
 * REGRA (ver AGENTS.md): todo efeito usado por uma carta PRECISA existir
 * neste catálogo E ter um handler implementado em src/core/effect-runtime.js.
 * O validador (npm run validate) falha o build se um dos dois estiver faltando.
 * É essa regra que impede carta/efeito "sem designer" (efeito declarado que
 * nunca acontece em partida).
 */

export const EFFECT_KINDS = {
    damage: { id: "damage", label: "Dano", color: "#e74c3c" },
    control: { id: "control", label: "Controle", color: "#9b59b6" },
    buff: { id: "buff", label: "Buff", color: "#2ecc71" },
    debuff: { id: "debuff", label: "Debuff", color: "#e67e22" },
    defense: { id: "defense", label: "Defesa", color: "#3498db" },
    utility: { id: "utility", label: "Utilidade", color: "#95a5a6" },
    passive: { id: "passive", label: "Passivo", color: "#f1c40f" }
};

export const EFFECTS = {
    draw_card: {
        id: "draw_card",
        label: "Compra de Carta",
        icon: "🃏",
        kind: "utility",
        sfx: "draw",
        description: "Compra N carta(s) do próprio deck."
    },
    heal: {
        id: "heal",
        label: "Cura",
        icon: "💚",
        kind: "utility",
        sfx: "heal",
        description: "Recupera N pontos de Vida."
    },
    recover_chakra: {
        id: "recover_chakra",
        label: "Recuperação de Chakra",
        icon: "💠",
        kind: "utility",
        sfx: "chakra",
        description: "Recupera N pontos de Chakra."
    },
    remove_debuffs: {
        id: "remove_debuffs",
        label: "Purificação",
        icon: "💧",
        kind: "utility",
        sfx: "cleanse",
        description: "Remove debuffs, veneno, queimadura e sangramento do próprio personagem."
    },
    burn: {
        id: "burn",
        label: "Queimadura",
        icon: "🔥",
        kind: "damage",
        sfx: "burn",
        description: "Causa N de dano de Fogo por turno durante a duração do efeito."
    },
    poison: {
        id: "poison",
        label: "Veneno",
        icon: "☠️",
        kind: "damage",
        sfx: "poison",
        description: "Causa N de dano por turno durante a duração do efeito."
    },
    bleed: {
        id: "bleed",
        label: "Sangramento",
        icon: "🩸",
        kind: "damage",
        sfx: "bleed",
        description: "Causa N de dano a cada ciclo durante a duração do efeito."
    },
    summon_dot: {
        id: "summon_dot",
        label: "Invocação",
        icon: "🐸",
        kind: "damage",
        sfx: "summon",
        description: "A invocação causa N de dano por turno durante a duração do efeito."
    },
    stun: {
        id: "stun",
        label: "Atordoamento",
        icon: "💫",
        kind: "control",
        sfx: "stun",
        description: "Atordoa o alvo, impedindo-o de jogar cartas."
    },
    opponent_discard: {
        id: "opponent_discard",
        label: "Descarte Forçado",
        icon: "🗑️",
        kind: "control",
        sfx: "discard",
        description: "Faz o alvo descartar N carta(s) aleatória(s) da mão."
    },
    opponent_draw_less: {
        id: "opponent_draw_less",
        label: "Lentidão",
        icon: "🐌",
        kind: "debuff",
        sfx: "poison",
        description: "O alvo compra N carta(s) a menos por turno."
    },
    enemy_attack_fail_chance: {
        id: "enemy_attack_fail_chance",
        label: "Confusão",
        icon: "🎭",
        kind: "debuff",
        sfx: "poison",
        description: "Dá N (0-1) de chance do ataque do alvo falhar."
    },
    self_damage: {
        id: "self_damage",
        label: "Dano Colateral",
        icon: "💢",
        kind: "debuff",
        sfx: "hit",
        description: "Causa N de dano no próprio usuário."
    },
    reduce_defense: {
        id: "reduce_defense",
        label: "Redução de Defesa",
        icon: "🪨",
        kind: "debuff",
        sfx: "poison",
        description: "Reduz a defesa do alvo em N pontos."
    },
    reduce_next_enemy_attack_percent: {
        id: "reduce_next_enemy_attack_percent",
        label: "Cortina de Fumaça",
        icon: "💨",
        kind: "debuff",
        sfx: "shield",
        description: "Reduz em N (0-1) o próximo ataque recebido."
    },
    block_all_damage: {
        id: "block_all_damage",
        label: "Bloqueio Total",
        icon: "🛡️",
        kind: "defense",
        sfx: "shield",
        description: "Bloqueia todo o dano recebido durante a duração do efeito."
    },
    knockback: {
        id: "knockback",
        label: "Empurro",
        icon: "💥",
        kind: "damage",
        sfx: "crit",
        description: "Zera a defesa atual do alvo e reduz sua defesa em N pontos."
    },
    buff_next_taijutsu: {
        id: "buff_next_taijutsu",
        label: "Foco Interior",
        icon: "👊",
        kind: "buff",
        sfx: "crit",
        description: "Concede +N de Ataque ao próximo Taijutsu."
    },
    reduce_next_jutsu_cost: {
        id: "reduce_next_jutsu_cost",
        label: "Concentração",
        icon: "🎯",
        kind: "buff",
        sfx: "chakra",
        description: "O próximo Jutsu custa N de Chakra a menos."
    },
    increase_crit_chance: {
        id: "increase_crit_chance",
        label: "Visão Sharingan",
        icon: "✨",
        kind: "buff",
        sfx: "crit",
        description: "Aumenta a chance crítica em N (0-1)."
    },
    stat_boost: {
        id: "stat_boost",
        label: "Aumento de Atributos",
        icon: "⬆️",
        kind: "buff",
        sfx: "crit",
        description: "Aumenta os atributos definidos em boost durante a duração do efeito."
    },
    stat_boost_regen: {
        id: "stat_boost_regen",
        label: "Modo de Regeneração",
        icon: "♻️",
        kind: "buff",
        sfx: "crit",
        description: "Aumenta atributos e regenera Chakra por turno."
    },
    stat_boost_self_dmg: {
        id: "stat_boost_self_dmg",
        label: "Modo Brutal",
        icon: "💥",
        kind: "buff",
        sfx: "crit",
        description: "Aumenta atributos e causa dano a si mesmo por turno."
    },
    reveal_hand_accuracy_boost: {
        id: "reveal_hand_accuracy_boost",
        label: "Visão Perfurante",
        icon: "👁️",
        kind: "buff",
        sfx: "crit",
        description: "Revela a mão do oponente e aumenta a precisão em N (0-1)."
    },
    equip_passive: {
        id: "equip_passive",
        label: "Equipamento",
        icon: "🛡️",
        kind: "passive",
        sfx: "shield",
        description: "Bônus passivo aplicado enquanto o item está equipado."
    },
    ignore_defense: {
        id: "ignore_defense",
        label: "Ignorar Defesa",
        icon: "💥",
        kind: "damage",
        sfx: "crit",
        description: "O dano ignora completamente a defesa do alvo."
    },
    ignore_defense_value: {
        id: "ignore_defense_value",
        label: "Perfuração Fixa",
        icon: "🗡️",
        kind: "damage",
        sfx: "crit",
        description: "Ignora N pontos de defesa do alvo."
    },
    piercing_attack: {
        id: "piercing_attack",
        label: "Ataque Perfurante",
        icon: "🗡️",
        kind: "damage",
        sfx: "crit",
        description: "Ignora 50% da defesa do alvo."
    },
    multi_hit: {
        id: "multi_hit",
        label: "Multi Acertos",
        icon: "💥",
        kind: "damage",
        sfx: "hit",
        description: "O ataque acerta N vezes (hits)."
    },
    area_attack: {
        id: "area_attack",
        label: "Ataque em Área",
        icon: "🌀",
        kind: "damage",
        sfx: "crit",
        description: "40% do dano do ataque ignora a defesa do alvo."
    },
    chakra_drain: {
        id: "chakra_drain",
        label: "Drenagem de Chakra",
        icon: "💧",
        kind: "damage",
        sfx: "chakra",
        description: "Drena N pontos de Chakra do alvo."
    }
};

/**
 * Efeitos cujo `effectValue` é uma FRACÇÃO (0.5 = 50%).
 * O validador exige que esses valores fiquem entre 0 e 1: são percentuais e
 * nunca devem ser arredondados para inteiro.
 */
export const PERCENT_EFFECTS = [
    "increase_crit_chance",
    "enemy_attack_fail_chance",
    "reduce_next_enemy_attack_percent"
];

export const EFFECT_IDS = Object.keys(EFFECTS);

/**
 * Catálogo de efeitos de EQUIPAMENTO (campo `equip_effect` das cartas de
 * Armadura/Arma). Mesma regra dos efeitos: tudo aqui precisa ter
 * implementação em src/core/equipment.js.
 */
export const EQUIP_EFFECTS = {
    increase_max_health_and_defense_percent: {
        id: "increase_max_health_and_defense_percent",
        label: "Resistência",
        description: "+N de Vida Máxima e N% de redução de dano recebido.",
        effectValue: { health: 20, defensePercent: 0.1 }
    },
    increase_base_defense: {
        id: "increase_base_defense",
        label: "Defesa Base",
        description: "+N de Defesa base.",
        effectValue: 5
    },
    increase_base_attack: {
        id: "increase_base_attack",
        label: "Ataque Base",
        description: "+N de Ataque base.",
        effectValue: 10
    }
};

export const EQUIP_EFFECT_IDS = Object.keys(EQUIP_EFFECTS);

/** Ficha resumida de um efeito (usada em tooltips e no log). */
export function effectInfo(effectId) {
    const effect = EFFECTS[effectId];
    if (!effect) {
        return {
            id: effectId || "none",
            label: "Sem Efeito",
            icon: "✦",
            kind: "utility",
            sfx: null,
            description: "Carta sem efeito especial."
        };
    }
    return effect;
}

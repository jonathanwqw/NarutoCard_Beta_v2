/**
 * REGISTRO ÚNICO DE CARTAS — fonte única de verdade do jogo.
 *
 * Não existe mais uma segunda base de cartas: menu, loja, criação de
 * personagem e combate leem TODOS deste arquivo.
 *
 * REGRAS (ver AGENTS.md e tools/validate.js):
 *  1. Todo id é único e único por carta. Nunca reaproveitar um id antigo
 *     com outro significado (foi o que quebrava jutsu020/item004).
 *  2. Todo campo obrigatório precisa estar preenchido: id, name, type,
 *     element, cost, description, price.
 *  3. Se `effect` existir, ele precisa existir em data/effects.js E ter
 *     handler em core/effect-runtime.js.
 *  4. A arte é derivada do id (assets/cards/<id>.svg). Para usar arte real
 *     basta substituir o arquivo pelo mesmo nome — ou definir `art`.
 *  5. A descrição tem que contar o que a carta realmente faz.
 */

import { ELEMENT_IDS } from "./elements.js";

/** Tipos de carta válidos. */
export const CARD_TYPES = [
    "Jutsu",
    "Taijutsu",
    "Defesa",
    "Item",
    "Buff",
    "Debuff",
    "Armadura",
    "Arma",
    "Modo",
    "Invocação",
    "Material"
];

/** Tipos que NÃO entram no deck de batalha (equipamento e material de craft). */
export const NON_DECK_TYPES = ["Material", "Armadura", "Arma"];

export const CARDS = {
    // ---------------------------------------------------------------- Jutsu
    jutsu001: {
        name: "Rasengan",
        type: "Jutsu",
        element: "Vento",
        cost: 30,
        description: "Causa 40 de dano de Vento e empurra o alvo, quebrando sua defesa.",
        price: 150,
        attack: 40,
        effect: "knockback",
        effectValue: 20,
        duration: 2
    },
    jutsu002: {
        name: "Chidori",
        type: "Jutsu",
        element: "Raio",
        cost: 35,
        description: "Causa 45 de dano de Raio perfurante. Chance Crítica: 15%.",
        price: 160,
        attack: 45,
        critChance: 0.15,
        effect: "piercing_attack"
    },
    jutsu003: {
        name: "Kage Bunshin",
        type: "Jutsu",
        element: "Nenhum",
        cost: 20,
        description: "Compra 1 carta.",
        price: 80,
        effect: "draw_card",
        effectValue: 1
    },
    jutsu004: {
        name: "Bola de Fogo",
        type: "Jutsu",
        element: "Fogo",
        cost: 25,
        description: "Causa 35 de dano de Fogo.",
        price: 100,
        attack: 35
    },
    jutsu005: {
        name: "Dragão de Água",
        type: "Jutsu",
        element: "Água",
        cost: 40,
        description: "Causa 50 de dano de Água e empurra o alvo, quebrando sua defesa.",
        price: 180,
        attack: 50,
        effect: "knockback",
        effectValue: 25,
        duration: 2
    },
    jutsu006: {
        name: "Parede de Lama",
        aliases: ["Areia Absoluta"],
        type: "Defesa",
        element: "Terra",
        cost: 20,
        description: "Ganha 30% de redução de dano por 2 turnos.",
        price: 100,
        defensePercent: 0.30,
        duration: 2
    },
    jutsu007: {
        name: "Rasenshuriken",
        type: "Jutsu",
        element: "Vento",
        cost: 60,
        description: "Causa 70 de dano de Vento. Ignora completamente a defesa.",
        price: 300,
        attack: 70,
        effect: "ignore_defense"
    },
    jutsu008: {
        name: "Amaterasu",
        type: "Jutsu",
        element: "Fogo",
        cost: 55,
        description: "Causa 30 de dano de Fogo por 3 turnos.",
        price: 280,
        effect: "burn",
        effectValue: 30,
        duration: 3
    },
    jutsu009: {
        name: "Susanoo Ribcage",
        aliases: ["Shinra Tensei"],
        type: "Defesa",
        element: "Nenhum",
        cost: 50,
        description: "Bloqueia todo o dano recebido no próximo turno.",
        price: 250,
        effect: "block_all_damage",
        duration: 1
    },
    jutsu010: {
        name: "Kamui (Curto Alcance)",
        type: "Jutsu",
        element: "Nenhum",
        cost: 70,
        description: "Remove 1 carta aleatória da mão do oponente.",
        price: 350,
        effect: "opponent_discard",
        effectValue: 1
    },
    jutsu012: {
        name: "Jutsu Médico",
        type: "Jutsu",
        element: "Nenhum",
        cost: 25,
        description: "Recupera 40 de Vida.",
        price: 100,
        effect: "heal",
        effectValue: 40
    },
    jutsu013: {
        name: "Genjutsu: Sharingan",
        type: "Jutsu",
        element: "Nenhum",
        cost: 30,
        description: "Oponente descarta 1 carta aleatória.",
        price: 120,
        effect: "opponent_discard",
        effectValue: 1
    },
    jutsu014: {
        name: "Liberação de Vento: Grande Brecha",
        aliases: ["Corte de Vento"],
        type: "Jutsu",
        element: "Vento",
        cost: 35,
        description: "Causa 40 de dano de Vento e empurra o alvo, quebrando sua defesa.",
        price: 150,
        attack: 40,
        effect: "knockback",
        effectValue: 20,
        duration: 2
    },
    jutsu015: {
        name: "Liberação de Terra: Lança de Pedra",
        aliases: ["Lança de Pedra"],
        type: "Jutsu",
        element: "Terra",
        cost: 30,
        description: "Causa 40 de dano de Terra perfurante.",
        price: 130,
        attack: 40,
        effect: "piercing_attack"
    },
    jutsu016: {
        name: "Liberação de Raio: Pantera Negra",
        aliases: ["Tigre de Raio"],
        type: "Jutsu",
        element: "Raio",
        cost: 45,
        description: "Causa 55 de dano de Raio perfurante.",
        price: 200,
        attack: 55,
        effect: "piercing_attack"
    },
    jutsu017: {
        name: "Espelhos Demoníacos de Gelo",
        type: "Jutsu",
        element: "Água",
        cost: 40,
        description: "Causa 50 de dano de Água em 3 acertos.",
        price: 180,
        attack: 50,
        effect: "multi_hit",
        hits: 3
    },
    jutsu018: {
        name: "Tsukuyomi",
        type: "Jutsu",
        element: "Nenhum",
        cost: 75,
        description: "Causa 20 de dano e atordoa o oponente por 1 turno.",
        price: 320,
        attack: 20,
        effect: "stun",
        duration: 1
    },
    jutsu019: {
        name: "Chidori Senbon",
        type: "Jutsu",
        element: "Raio",
        cost: 25,
        description: "Causa 30 de dano de Raio perfurante.",
        price: 130,
        attack: 30,
        effect: "piercing_attack"
    },
    jutsu020: {
        name: "Chidori Sharp Spear",
        aliases: ["Raikiri"],
        type: "Jutsu",
        element: "Raio",
        cost: 35,
        description: "Causa 45 de dano de Raio. Ignora 5 pontos de Defesa.",
        price: 170,
        attack: 45,
        effect: "ignore_defense_value",
        effectValue: 5
    },
    jutsu021: {
        name: "Chidori Nagashi",
        type: "Jutsu",
        element: "Raio",
        cost: 40,
        description: "Causa 20 de dano de Raio em área (parte do dano ignora a defesa).",
        price: 190,
        attack: 20,
        effect: "area_attack"
    },
    jutsu030: {
        name: "Oodama Rasengan",
        type: "Jutsu",
        element: "Vento",
        cost: 50,
        description: "Causa 60 de dano de Vento massivo.",
        price: 240,
        attack: 60
    },
    jutsu031: {
        name: "Clone das Sombras Múltiplo",
        type: "Jutsu",
        element: "Nenhum",
        cost: 25,
        description: "Compra 2 cartas.",
        price: 140,
        effect: "draw_card",
        effectValue: 2
    },
    jutsu032: {
        name: "Liberação de Vento: Bola de Vácuo",
        type: "Jutsu",
        element: "Vento",
        cost: 30,
        description: "Causa 38 de dano de Vento.",
        price: 150,
        attack: 38
    },
    jutsu033: {
        name: "Flor de Fênix",
        type: "Jutsu",
        element: "Fogo",
        cost: 30,
        description: "Causa 55 de dano de Fogo dividido em 5 projéteis.",
        price: 190,
        attack: 55,
        effect: "multi_hit",
        hits: 5
    },
    jutsu034: {
        name: "Grande Bola de Fogo",
        type: "Jutsu",
        element: "Fogo",
        cost: 45,
        description: "Causa 60 de dano de Fogo e queima por 2 turnos.",
        price: 230,
        attack: 60,
        effect: "burn",
        effectValue: 15,
        duration: 2
    },
    jutsu035: {
        name: "Chamas do Dragão",
        type: "Jutsu",
        element: "Fogo",
        cost: 40,
        description: "Causa 50 de dano de Fogo e queima por 2 turnos.",
        price: 200,
        attack: 50,
        effect: "burn",
        effectValue: 10,
        duration: 2
    },
    jutsu036: {
        name: "Dragão de Água Explosivo",
        type: "Jutsu",
        element: "Água",
        cost: 45,
        description: "Causa 55 de dano de Água em área (parte do dano ignora a defesa).",
        price: 220,
        attack: 55,
        effect: "area_attack"
    },
    jutsu037: {
        name: "Ondas de Água",
        type: "Jutsu",
        element: "Água",
        cost: 30,
        description: "Causa 40 de dano de Água.",
        price: 150,
        attack: 40
    },
    jutsu038: {
        name: "Prisão de Água",
        type: "Jutsu",
        element: "Água",
        cost: 35,
        description: "Prende o inimigo: descarta 1 carta da mão do oponente.",
        price: 150,
        effect: "opponent_discard",
        effectValue: 1
    },
    jutsu039: {
        name: "Espelhos de Gelo",
        type: "Jutsu",
        element: "Água",
        cost: 45,
        description: "Causa 60 de dano de Água em 3 acertos.",
        price: 230,
        attack: 60,
        effect: "multi_hit",
        hits: 3
    },
    jutsu040: {
        name: "Corte de Lâmina de Vento",
        type: "Jutsu",
        element: "Vento",
        cost: 35,
        description: "Causa 45 de dano de Vento perfurante.",
        price: 180,
        attack: 45,
        effect: "piercing_attack"
    },
    jutsu041: {
        name: "Grande Queda de Vento",
        type: "Jutsu",
        element: "Vento",
        cost: 40,
        description: "Causa 55 de dano de Vento em área (parte do dano ignora a defesa).",
        price: 210,
        attack: 55,
        effect: "area_attack"
    },
    jutsu042: {
        name: "Liberação de Terra: Grande Muralha",
        type: "Defesa",
        element: "Terra",
        cost: 30,
        description: "Ganha 30% de redução de dano por 2 turnos.",
        price: 140,
        defensePercent: 0.30,
        duration: 2
    },
    jutsu043: {
        name: "Dragão de Terra",
        type: "Jutsu",
        element: "Terra",
        cost: 40,
        description: "Causa 52 de dano de Terra.",
        price: 200,
        attack: 52
    },
    jutsu044: {
        name: "Fissura Terrestre",
        type: "Jutsu",
        element: "Terra",
        cost: 35,
        description: "Causa 48 de dano de Terra e ignora 5 pontos de Defesa.",
        price: 190,
        attack: 48,
        effect: "ignore_defense_value",
        effectValue: 5
    },
    jutsu045: {
        name: "Poeira Explosiva",
        type: "Jutsu",
        element: "Terra",
        cost: 55,
        description: "Causa 70 de dano de Terra que ignora a defesa.",
        price: 280,
        attack: 70,
        effect: "ignore_defense"
    },
    jutsu046: {
        name: "Trovão Assassino",
        type: "Jutsu",
        element: "Raio",
        cost: 40,
        description: "Causa 55 de dano de Raio.",
        price: 210,
        attack: 55
    },
    jutsu047: {
        name: "Armadura de Raio",
        type: "Defesa",
        element: "Raio",
        cost: 30,
        description: "Ganha 40 de Defesa por 2 turnos.",
        price: 150,
        defenseBuff: 40,
        duration: 2
    },
    jutsu048: {
        name: "Lariat de Raio",
        type: "Jutsu",
        element: "Raio",
        cost: 45,
        description: "Causa 65 de dano de Raio e atordoa por 1 turno.",
        price: 260,
        attack: 65,
        effect: "stun",
        duration: 1
    },
    jutsu049: {
        name: "Estilo Água: Tubarão Faminto",
        type: "Jutsu",
        element: "Água",
        cost: 35,
        description: "Causa 45 de dano de Água e drena 10 de Chakra.",
        price: 200,
        attack: 45,
        effect: "chakra_drain",
        effectValue: 10
    },
    jutsu050: {
        name: "Bijuu Dama",
        type: "Jutsu",
        element: "Nenhum",
        cost: 70,
        description: "Causa 90 de dano massivo que ignora a defesa.",
        price: 320,
        attack: 90,
        effect: "ignore_defense"
    },
    jutsu051: {
        name: "Genjutsu: Flores Demôniacas",
        type: "Jutsu",
        element: "Nenhum",
        cost: 30,
        description: "Confunde o inimigo: 50% de chance de errar o ataque.",
        price: 130,
        effect: "enemy_attack_fail_chance",
        effectValue: 0.5,
        duration: 1
    },
    jutsu052: {
        name: "Amaterasu Negra",
        type: "Jutsu",
        element: "Fogo",
        cost: 55,
        description: "Causa 35 de dano de Fogo por 3 turnos.",
        price: 280,
        effect: "burn",
        effectValue: 35,
        duration: 3
    },
    jutsu053: {
        name: "Shinra Tensei",
        type: "Defesa",
        element: "Nenhum",
        cost: 50,
        description: "Bloqueia todo o dano recebido no próximo turno.",
        price: 250,
        effect: "block_all_damage",
        duration: 1
    },
    jutsu054: {
        name: "Lâminas de Papel",
        type: "Jutsu",
        element: "Vento",
        cost: 25,
        description: "Causa 35 de dano de Vento perfurante.",
        price: 150,
        attack: 35,
        effect: "piercing_attack"
    },
    jutsu055: {
        name: "Punho Suave: Palmas Gêmeas",
        aliases: ["Palmas Gêmeas"],
        type: "Jutsu",
        element: "Nenhum",
        cost: 25,
        description: "Causa 30 de dano e reduz a defesa inimiga em 15 por 2 turnos.",
        price: 150,
        attack: 30,
        effect: "reduce_defense",
        effectValue: 15,
        duration: 2
    },
    jutsu056: {
        name: "Rasengan Gigante",
        type: "Jutsu",
        element: "Vento",
        cost: 55,
        description: "Causa 75 de dano de Vento.",
        price: 300,
        attack: 75
    },
    jutsu057: {
        name: "Bomba Tubarão",
        type: "Jutsu",
        element: "Água",
        cost: 40,
        description: "Causa 50 de dano de Água e drena 12 de Chakra do oponente.",
        price: 200,
        attack: 50,
        effect: "chakra_drain",
        effectValue: 12
    },
    jutsu058: {
        name: "Kunai Envenenada",
        type: "Jutsu",
        element: "Nenhum",
        cost: 20,
        description: "Causa 10 de dano e provoca sangramento: 2 de dano por turno durante 4 turnos.",
        price: 110,
        attack: 10,
        effect: "bleed",
        effectValue: 2,
        duration: 4
    },
    jutsu059: {
        name: "Corte Profundo",
        type: "Jutsu",
        element: "Nenhum",
        cost: 30,
        description: "Causa 15 de dano e provoca sangramento forte: 3 de dano por turno durante 4 turnos.",
        price: 160,
        attack: 15,
        effect: "bleed",
        effectValue: 3,
        duration: 4
    },

    // ------------------------------------------------------------ Taijutsu
    taijutsu001: {
        name: "Chute Dinâmico",
        type: "Taijutsu",
        element: "Nenhum",
        cost: 10,
        description: "Causa 20 de dano físico.",
        price: 50,
        attack: 20
    },
    taijutsu002: {
        name: "Rajada Leões",
        type: "Taijutsu",
        element: "Nenhum",
        cost: 15,
        description: "Causa 25 de dano físico.",
        price: 60,
        attack: 25
    },
    taijutsu003: {
        name: "Lótus Primária",
        aliases: ["Ritual de Jashin"],
        type: "Taijutsu",
        element: "Nenhum",
        cost: 40,
        description: "Causa 60 de dano físico e 10 de dano em si mesmo.",
        price: 180,
        attack: 60,
        effect: "self_damage",
        effectValue: 10
    },

    // -------------------------------------------------------------- Itens
    item001: {
        name: "Kunai",
        type: "Item",
        item_subtype: "Arma",
        element: "Nenhum",
        cost: 5,
        description: "Causa 10 de dano físico.",
        price: 20,
        attack: 10
    },
    item002: {
        name: "Pílula Soldado",
        type: "Item",
        item_subtype: "Consumível",
        element: "Nenhum",
        cost: 10,
        description: "Recupera 15 de Chakra.",
        price: 30,
        effect: "recover_chakra",
        effectValue: 15
    },
    item003: {
        name: "Shuriken",
        type: "Item",
        item_subtype: "Arma",
        element: "Nenhum",
        cost: 8,
        description: "Causa 12 de dano físico.",
        price: 25,
        attack: 12
    },
    item004: {
        name: "Bomba de Fumaça",
        type: "Item",
        item_subtype: "Consumível",
        element: "Nenhum",
        cost: 10,
        description: "Reduz o próximo ataque inimigo em 50%.",
        price: 40,
        effect: "reduce_next_enemy_attack_percent",
        effectValue: 0.5,
        duration: 1
    },
    item005: {
        name: "Bomba de Argila",
        aliases: ["Argila Explosiva"],
        type: "Item",
        item_subtype: "Arma",
        element: "Fogo",
        cost: 15,
        description: "Causa 25 de dano de Fogo em área (parte do dano ignora a defesa).",
        price: 50,
        attack: 25,
        effect: "area_attack"
    },
    item006: {
        name: "Bandagem",
        type: "Item",
        item_subtype: "Consumível",
        element: "Nenhum",
        cost: 5,
        description: "Recupera 10 de Vida.",
        price: 15,
        effect: "heal",
        effectValue: 10
    },
    item007: {
        name: "Veneno",
        aliases: ["Marionete Humana"],
        type: "Item",
        item_subtype: "Consumível",
        element: "Nenhum",
        cost: 20,
        description: "Aplica veneno (5 de dano por turno) por 3 turnos.",
        price: 60,
        effect: "poison",
        effectValue: 5,
        duration: 3
    },
    item008: {
        name: "Antídoto",
        type: "Item",
        item_subtype: "Consumível",
        element: "Nenhum",
        cost: 10,
        description: "Remove efeitos negativos (veneno, queimadura, sangramento, invocação).",
        price: 35,
        effect: "remove_debuffs"
    },
    item009: {
        name: "Pergaminho Selado",
        type: "Item",
        item_subtype: "Consumível",
        element: "Nenhum",
        cost: 25,
        description: "Compra 2 cartas.",
        price: 70,
        effect: "draw_card",
        effectValue: 2
    },
    item010: {
        name: "Pílula Chakra",
        type: "Item",
        item_subtype: "Consumível",
        element: "Nenhum",
        cost: 30,
        description: "Recupera 50 de Chakra.",
        price: 80,
        effect: "recover_chakra",
        effectValue: 50
    },

    // ------------------------------------------------------ Buffs / Debuffs
    buff001: {
        name: "Força Interior",
        type: "Buff",
        element: "Nenhum",
        cost: 20,
        description: "+10 de Ataque no próximo Taijutsu.",
        price: 75,
        effect: "buff_next_taijutsu",
        effectValue: 10,
        duration: 1
    },
    buff002: {
        name: "Concentração de Chakra",
        type: "Buff",
        element: "Nenhum",
        cost: 10,
        description: "O próximo Jutsu custa 10 de Chakra a menos.",
        price: 45,
        effect: "reduce_next_jutsu_cost",
        effectValue: 10,
        duration: 1
    },
    buff003: {
        name: "Visão Sharingan",
        type: "Buff",
        element: "Nenhum",
        cost: 25,
        description: "+20% de chance crítica por 2 turnos.",
        price: 110,
        effect: "increase_crit_chance",
        effectValue: 0.20,
        duration: 2
    },
    debuff001: {
        name: "Redução de Defesa",
        aliases: ["Punho Suave"],
        type: "Debuff",
        element: "Nenhum",
        cost: 15,
        description: "Reduz a defesa do oponente em 20 por 2 turnos.",
        price: 65,
        effect: "reduce_defense",
        effectValue: 20,
        duration: 2
    },
    debuff002: {
        name: "Lentidão",
        aliases: ["Manipulação de Sombras"],
        type: "Debuff",
        element: "Nenhum",
        cost: 15,
        description: "O oponente compra 1 carta a menos no próximo turno.",
        price: 55,
        effect: "opponent_draw_less",
        effectValue: 1,
        duration: 1
    },
    debuff003: {
        name: "Confusão",
        aliases: ["Dança dos Shikigami"],
        type: "Debuff",
        element: "Nenhum",
        cost: 20,
        description: "50% de chance do ataque inimigo falhar no próximo turno.",
        price: 85,
        effect: "enemy_attack_fail_chance",
        effectValue: 0.5,
        duration: 1
    },

    // ------------------------------------------------------------- Defesas
    defesa001: {
        name: "Escudo de Terra",
        type: "Defesa",
        element: "Terra",
        cost: 15,
        description: "Ganha 25 de Defesa por 2 turnos.",
        price: 90,
        defenseBuff: 25,
        duration: 2
    },

    // ----------------------------------------------------------- Modos
    mode001: {
        name: "Modo Sábio (Sapo)",
        type: "Modo",
        element: "Nenhum",
        cost: 50,
        description: "+20 de Ataque e +10 de Chakra por regeneração durante 3 turnos.",
        price: 260,
        effect: "stat_boost_regen",
        boost: { attack: 20 },
        regen: { chakra: 10 },
        duration: 3
    },
    mode002: {
        name: "Oito Portões (Portão 1)",
        type: "Modo",
        element: "Nenhum",
        cost: 30,
        description: "+30 de Ataque Taijutsu por 2 turnos. Causa 5 de dano por turno.",
        price: 190,
        effect: "stat_boost_self_dmg",
        boost: { taijutsu_attack: 30 },
        self_dmg: 5,
        duration: 2
    },
    mode003: {
        name: "Manto de Chakra (1 Cauda)",
        type: "Modo",
        element: "Nenhum",
        cost: 40,
        description: "+15 de Ataque e +15 de Defesa por 3 turnos.",
        price: 220,
        effect: "stat_boost",
        boost: { attack: 15, defense: 15 },
        duration: 3
    },
    mode004: {
        name: "Byakugan",
        type: "Modo",
        element: "Nenhum",
        cost: 30,
        description: "Revela a mão do oponente por 1 turno e +10% de precisão.",
        price: 140,
        effect: "reveal_hand_accuracy_boost",
        boost: { accuracy: 0.10 },
        duration: 1
    },

    // -------------------------------------------------------- Equipamentos
    armor001: {
        name: "Colete Chūnin",
        type: "Armadura",
        item_subtype: "Armadura",
        slot: "Peito",
        element: "Nenhum",
        cost: 0,
        description: "Equipamento: +20 de Vida Máxima e 10% de redução de dano recebido.",
        price: 0,
        effect: "equip_passive",
        equip_effect: "increase_max_health_and_defense_percent",
        effectValue: { health: 20, defensePercent: 0.10 }
    },
    armor002: {
        name: "Protetor Testa (Folha)",
        type: "Armadura",
        item_subtype: "Armadura",
        slot: "Cabeça",
        element: "Nenhum",
        cost: 0,
        description: "Equipamento: +5 de Defesa base.",
        price: 0,
        effect: "equip_passive",
        equip_effect: "increase_base_defense",
        effectValue: 5
    },
    weapon001: {
        name: "Espada Kusanagi",
        type: "Arma",
        item_subtype: "Arma",
        slot: "Ferramenta1",
        element: "Nenhum",
        cost: 0,
        description: "Equipamento: +10 de Ataque base.",
        price: 0,
        effect: "equip_passive",
        equip_effect: "increase_base_attack",
        effectValue: 10
    },

    // --------------------------------------------------------- Invocações
    invoc001: {
        name: "Invocação",
        type: "Invocação",
        element: "Nenhum",
        cost: 30,
        description: "Invoca uma criatura: 15 de dano por turno durante 3 turnos.",
        price: 140,
        effect: "summon_dot",
        summonDotDamage: 15,
        duration: 3
    },

    // ---------------------------------------------------------- Materiais
    material001: {
        name: "Erva Medicinal",
        type: "Material",
        element: "Nenhum",
        cost: 0,
        description: "Usada para criar itens de cura.",
        price: 5,
        craft_use: "Receita de Bandagem e Pílula de Chakra"
    },
    material002: {
        name: "Fragmento de Metal",
        type: "Material",
        element: "Nenhum",
        cost: 0,
        description: "Usado para criar armas e armaduras.",
        price: 10,
        craft_use: "Receita de Espada Kusanagi e Colete Chūnin"
    },
    material003: {
        name: "Pó de Chakra",
        type: "Material",
        element: "Nenhum",
        cost: 0,
        description: "Usado para encantar equipamentos ou criar jutsus.",
        price: 15,
        craft_use: "Receita de Pílula de Chakra e Espada Kusanagi"
    }
};

/** Lista de cartas em formato de array, com o id preenchido. */
export const CARD_LIST = Object.entries(CARDS).map(([id, card]) => ({ id, ...card }));

export const CARD_IDS = Object.keys(CARDS);

/** Ficha completa de uma carta (id + dados). */
export function getCard(cardId) {
    const card = CARDS[cardId];
    return card ? { id: cardId, ...card } : null;
}

/**
 * Caminho da arte de uma carta.
 * Convenção: assets/cards/<id>.svg — para usar arte real, substitua o arquivo
 * mantendo o nome (ou defina `art` no registro).
 */
export function cardArtPath(cardId, card) {
    const file = (card && card.art) || `${cardId}.svg`;
    // caminho absoluto na raiz do site (funciona em / e em /pages/)
    return `/assets/cards/${file}`;
}

/** Raridade derivada do preço (nunca pode ficar inconsistente com a carta). */
export function cardRarity(card) {
    const price = card.price || 0;
    if (card.type === "Material") return "Material";
    if (card.type === "Armadura" || card.type === "Arma") return "Equipamento";
    if (price <= 0) return "Inicial";
    if (price < 40) return "Comum";
    if (price < 100) return "Incomum";
    if (price < 180) return "Rara";
    if (price < 260) return "Épica";
    return "Lendária";
}

/** Carta entra no deck de batalha? */
export function isDeckable(card) {
    return card && !NON_DECK_TYPES.includes(card.type);
}

/** Validação estrutural usada pelo validador e pelos testes. */
export function validateCardShape(cardId, card) {
    const errors = [];
    const required = ["name", "type", "element", "cost", "description", "price"];
    for (const field of required) {
        if (card[field] === undefined || card[field] === null || card[field] === "") {
            errors.push(`${cardId}: campo obrigatório ausente -> ${field}`);
        }
    }
    if (card.type && !CARD_TYPES.includes(card.type)) {
        errors.push(`${cardId}: tipo inválido -> ${card.type}`);
    }
    if (card.element && !ELEMENT_IDS.includes(card.element)) {
        errors.push(`${cardId}: elemento inválido -> ${card.element}`);
    }
    if (typeof card.cost !== "number" || card.cost < 0) {
        errors.push(`${cardId}: custo inválido -> ${card.cost}`);
    }
    if (typeof card.price !== "number" || card.price < 0) {
        errors.push(`${cardId}: preço inválido -> ${card.price}`);
    }
    if (card.effect && !card.description) {
        errors.push(`${cardId}: carta com efeito sem descrição`);
    }
    if (card.effectValue !== undefined && card.effectValue === null) {
        errors.push(`${cardId}: effectValue nulo`);
    }
    return errors;
}

/**
 * Motor de batalha — independente de DOM (roda igual no navegador e no Node).
 *
 * A UI só assina eventos; toda regra de combate mora aqui.
 * Isso permite testar automaticamente que TODA carta e TODO efeito do
 * registro realmente faz alguma coisa (ver tests/engine.test.js).
 */

import { createRng } from "./rng.js";
import { createCardInstance, createFusionInstance } from "./card.js";
import { effectHandlers, MODIFIER_EFFECTS } from "./effect-runtime.js";
import { elementMultiplier } from "../data/elements.js";
import { findFusion } from "../data/catalog.js";

export const PHASES = {
    SETUP: "setup",
    PLAYER_TURN: "player_turn",
    OPPONENT_TURN: "opponent_turn",
    GAME_OVER: "game_over"
};

const HAND_LIMIT = 8;
const INITIAL_HAND = 4;
const MAX_AI_ACTIONS = 3;

function createFighter(key, config) {
    return {
        key,
        name: config.name || (key === "player" ? "Jogador" : "Oponente"),
        element: config.element || "Nenhum",
        health: config.maxHealth || 500,
        maxHealth: config.maxHealth || 500,
        chakra: config.maxChakra || 50,
        maxChakra: config.maxChakra || 50,
        defense: 0,
        maxDefense: config.maxDefense || 80,
        baseAttackBonus: config.attackBonus || 0,
        baseCritBonus: config.critChanceBonus || 0,
        dodgeChance: config.dodgeChance ?? 0.1,
        accuracy: config.accuracy ?? 0.85,
        jutsuPower: config.jutsuPower || 0,
        defensePercent: config.defensePercent || 0,
        attackBoost: 0,
        critChanceBoost: 0,
        accuracyBoost: 0,
        deck: [...(config.deck || [])],
        hand: [],
        discard: [],
        statusEffects: [],
        combo: { element: null, count: 0 },
        isStunned: false,
        canPlayCard: true,
        fusionMode: false,
        fusionSelected: [],
        cardLevels: config.cardLevels || {}
    };
}

/**
 * Cria uma batalha.
 * @param {object} options
 * @param {object} options.player  { name, element, maxHealth, maxChakra, maxDefense, attackBonus, critChanceBonus, dodgeChance, accuracy, jutsuPower, deck:[ids], cardLevels }
 * @param {object} options.opponent idem
 * @param {number|string} options.seed  semente do RNG (reproduzível)
 * @param {function} options.emit  (evento, payload) => void
 */
export function createBattle({ player, opponent, seed = 1, emit = () => {} } = {}) {
    const rng = createRng(seed);
    const state = {
        turn: 1,
        currentPlayer: "player",
        phase: PHASES.SETUP,
        player: createFighter("player", player || {}),
        opponent: createFighter("opponent", opponent || {})
    };

    const battle = {
        state,
        rng,
        emit,
        start,
        playCard,
        endTurn,
        runOpponentTurn,
        canFuse,
        fuse,
        getSnapshot
    };

    // ------------------------------------------------------------ helpers
    function log(message, cssClass = "") {
        emit("log", { message, cssClass });
    }

    function fighter(key) {
        return state[key];
    }

    function other(key) {
        return key === "player" ? "opponent" : "player";
    }

    function label(key) {
        return fighter(key).name;
    }

    function statusValue(key, type) {
        return fighter(key).statusEffects
            .filter((effect) => effect.type === type && effect.duration > 0)
            .reduce((total, effect) => total + (typeof effect.value === "number" ? effect.value : 0), 0);
    }

    /**
     * Soma um atributo de todos os buffs ativos (boost.attack, boost.defense,
     * boost.accuracy, boost.taijutsu_attack...). Buffs guardam objeto em `value`.
     */
    function boostTotal(key, stat) {
        return fighter(key).statusEffects.reduce((total, effect) => {
            if (!effect.value || typeof effect.value !== "object") return total;
            const value = effect.value[stat];
            return total + (typeof value === "number" ? value : 0);
        }, 0);
    }

    function hasStatus(key, type) {
        return fighter(key).statusEffects.some((effect) => effect.type === type && effect.duration > 0);
    }

    function addStatus(key, status) {
        const target = fighter(key);
        const existing = target.statusEffects.find(
            (effect) => effect.effect === status.effect && effect.sourceCardId === status.sourceCardId && effect.type === status.type
        );
        if (existing && ["dot", "burn", "poison", "bleed", "summon_dot"].includes(status.type)) {
            existing.duration += status.duration;
        } else {
            target.statusEffects.push({
                id: `status_${state.turn}_${target.statusEffects.length}_${Math.floor(rng.next() * 1e6)}`,
                ...status
            });
        }
        emit("status", { key, status });
    }

    function removeStatus(key, predicate) {
        const target = fighter(key);
        const removed = target.statusEffects.filter((effect) => predicate(effect));
        target.statusEffects = target.statusEffects.filter((effect) => !predicate(effect));
        return removed;
    }

    function heal(key, amount) {
        const target = fighter(key);
        const before = target.health;
        target.health = Math.min(target.maxHealth, target.health + Math.max(0, amount));
        const healed = target.health - before;
        if (healed > 0) emit("heal", { key, amount: healed });
        return healed;
    }

    function restoreChakra(key, amount) {
        const target = fighter(key);
        const before = target.chakra;
        target.chakra = Math.min(target.maxChakra, target.chakra + Math.max(0, amount));
        const restored = target.chakra - before;
        if (restored > 0) emit("chakra", { key, amount: restored, gained: true });
        return restored;
    }

    function draw(count, key) {
        const target = fighter(key);
        const drawLess = statusValue(key, "draw_less");
        let drawn = 0;
        for (let i = 0; i < count; i++) {
            if (target.hand.length >= HAND_LIMIT) {
                log(`${label(key)} não pode comprar mais (mão cheia).`, "log-system");
                break;
            }
            if (target.deck.length === 0) {
                if (target.discard.length === 0) {
                    log(`${label(key)} não tem mais cartas para comprar.`, "log-system");
                    break;
                }
                target.deck = rng.shuffle(target.discard);
                target.discard = [];
                log(`${label(key)} embaralhou o descarte no deck.`, "log-system");
            }
            const cardId = target.deck.pop();
            const levelInfo = target.cardLevels[cardId];
            const instance = createCardInstance(cardId, levelInfo ? levelInfo.level : 1, levelInfo ? levelInfo.xp : 0);
            if (!instance) {
                log(`Carta desconhecida ignorada: ${cardId}`, "log-damage");
                continue;
            }
            target.hand.push(instance);
            drawn += 1;
            emit("draw", { key, card: instance });
        }
        if (drawLess > 0 && drawn > 0) {
            log(`${label(key)} comprou ${drawn - Math.min(drawLess, drawn)} carta(s) (lentidão).`, "log-status");
        }
        return drawn;
    }

    function discardRandomCard(key) {
        const target = fighter(key);
        if (target.hand.length === 0) return null;
        const index = rng.int(0, target.hand.length - 1);
        const [card] = target.hand.splice(index, 1);
        target.discard.push(card.id);
        emit("discard", { key, card });
        return card;
    }

    /**
     * Aplica dano no alvo.
     * @returns {number} dano total causado (vida + defesa)
     */
    function dealDamage(key, amount, options = {}) {
        const target = fighter(key);
        if (amount <= 0) return 0;

        if (hasStatus(key, "block_all_damage")) {
            log(`${label(key)} bloqueou todo o dano!`, "log-status");
            emit("blocked", { key });
            return 0;
        }

        let damage = amount;

        // Mitigação percentual (Parede de Lama / Manto de Chakra / equipamento)
        const mitigation = statusValue(key, "defense_percent") + (target.defensePercent || 0);
        if (mitigation !== 0) {
            damage = Math.max(0, Math.round(damage * (1 - mitigation)));
        }

        // Defesa plana acumulada (Redução de Defesa / knockback)
        const flatReduction = Math.max(0, statusValue(key, "defense_flat"));

        let piercePart = 0;
        let directPart = damage;

        if (options.areaPiercePercent > 0) {
            piercePart = Math.round(damage * options.areaPiercePercent);
            directPart = damage - piercePart;
        }

        let availableDefense = target.defense + boostTotal(key, "defense");
        if (options.ignoreDefense) {
            availableDefense = 0;
        } else {
            if (options.ignoreDefenseValue > 0) {
                availableDefense = Math.max(0, availableDefense - options.ignoreDefenseValue);
            }
            if (options.pierceDefensePercent > 0) {
                availableDefense = Math.max(0, availableDefense * (1 - options.pierceDefensePercent));
            }
        }

        const effectiveDefense = Math.max(0, availableDefense - flatReduction);
        const absorbed = Math.min(effectiveDefense, directPart);
        const toHealth = directPart - absorbed + piercePart;

        if (absorbed > 0) {
            target.defense = Math.max(0, target.defense - absorbed);
            emit("defense", { key, amount: absorbed });
            log(`${absorbed} de dano foi absorvido pela defesa de ${label(key)}.`, "log-status");
        }
        if (toHealth > 0) {
            target.health = Math.max(0, target.health - toHealth);
            emit("damage", { key, amount: toHealth, isCrit: !!options.isCrit });
            log(`${toHealth} de dano em ${label(key)}.`, options.isCrit ? "log-critical" : "log-damage");
        }
        return absorbed + toHealth;
    }

    function registerCombo(key, element) {
        const target = fighter(key);
        if (!element || element === "Nenhum") {
            target.combo = { element: null, count: 0 };
            return { active: false, bonus: 0, count: 0 };
        }
        if (target.combo.element === element) {
            target.combo.count += 1;
        } else {
            target.combo = { element, count: 1 };
        }
        const bonus = target.combo.count >= 2 ? Math.min(0.15 * (target.combo.count - 1), 0.45) : 0;
        return { active: target.combo.count >= 2, bonus, count: target.combo.count };
    }

    // ------------------------------------------------------------- início
    function start() {
        ["player", "opponent"].forEach((key) => {
            const target = fighter(key);
            target.deck = rng.shuffle(target.deck);
            target.hand = [];
            target.discard = [];
            target.statusEffects = [];
            target.defense = 0;
            target.health = target.maxHealth;
            target.chakra = target.maxChakra;
            target.combo = { element: null, count: 0 };
        });
        state.turn = 1;
        state.currentPlayer = "player";
        state.phase = PHASES.PLAYER_TURN;
        draw(INITIAL_HAND, "player");
        draw(INITIAL_HAND, "opponent");
        emit("start", { turn: state.turn, currentPlayer: state.currentPlayer });
        log(`Turno ${state.turn} — vez do jogador.`, "log-system");
    }

    // ------------------------------------------------------- jogar carta
    function playCard(key, handIndex) {
        if (state.phase === PHASES.GAME_OVER) return { ok: false, reason: "A batalha já terminou." };
        if (key !== state.currentPlayer) return { ok: false, reason: "Não é a sua vez." };
        if (state.phase !== PHASES.PLAYER_TURN) return { ok: false, reason: "Aguarde o turno do oponente." };

        const caster = fighter(key);
        if (caster.isStunned) return { ok: false, reason: "Você está atordoado." };
        if (!caster.canPlayCard) return { ok: false, reason: "Você não pode jogar cartas agora." };

        const card = caster.hand[handIndex];
        if (!card) return { ok: false, reason: "Carta inválida." };

        const discount = statusValue(key, "reduce_next_jutsu_cost");
        const cost = Math.max(0, card.cost - discount);
        if (caster.chakra < cost) return { ok: false, reason: "Chakra insuficiente." };

        caster.chakra -= cost;
        if (cost > 0) emit("chakra", { key, amount: cost, gained: false });
        if (discount > 0) removeStatus(key, (effect) => effect.type === "reduce_next_jutsu_cost");

        caster.hand.splice(handIndex, 1);
        caster.discard.push(card.id);
        log(`${label(key)} usou ${card.name}.`, "log-system");
        emit("attack", { key, card });

        applyCard(card, key, other(key));
        checkGameOver();
        return { ok: true, card };
    }

    /**
     * Aplica uma carta: modificadores de dano -> dano -> efeito especial.
     */
    function applyCard(card, casterKey, targetKey) {
        const caster = fighter(casterKey);
        const target = fighter(targetKey);

        const ctx = {
            battle,
            card,
            casterKey,
            targetKey,
            caster,
            target,
            rng,
            log,
            emit,
            draw,
            addStatus,
            removeStatus,
            heal,
            restoreChakra,
            dealDamage,
            discardRandomCard
        };

        // 1) modificadores de dano
        let modifier = {};
        if (card.effect && MODIFIER_EFFECTS.has(card.effect)) {
            modifier = effectHandlers[card.effect](ctx) || {};
        }

        // 2) combo elemental
        let combo = { active: false, bonus: 0, count: 0 };
        if (card.attack > 0 && card.element && card.element !== "Nenhum") {
            combo = registerCombo(casterKey, card.element);
            if (combo.active) {
                log(`COMBO ${card.element} x${combo.count}! +${Math.round(combo.bonus * 100)}% de dano.`, "log-critical");
                emit("combo", { key: casterKey, element: card.element, count: combo.count, bonus: combo.bonus });
            }
        }

        // 3) defesa conquistada pela própria carta
        if (card.defenseBuff > 0) {
            const before = caster.defense;
            caster.defense = Math.min(caster.maxDefense, caster.defense + card.defenseBuff);
            const gained = caster.defense - before;
            if (gained > 0) emit("defense", { key: casterKey, amount: gained, gained: true });
            log(`${label(casterKey)} ganhou ${gained} de Defesa com ${card.name}.`, "log-status");
        }
        if (card.defensePercent > 0) {
            addStatus(casterKey, {
                name: card.name,
                type: "defense_percent",
                effect: "apply_defense_percent_buff",
                value: card.defensePercent,
                duration: card.duration || 1,
                sourceCardId: card.id,
                description: `+${Math.round(card.defensePercent * 100)}% de redução de dano`
            });
            log(`${label(casterKey)} ativou ${card.name} (+${Math.round(card.defensePercent * 100)}% de redução de dano).`, "log-status");
        }

        // 4) dano
        if (card.attack > 0) {
            // falha de ataque (Confusão / Flores Demôniacas)
            const failChance = statusValue(casterKey, "fail_attack");
            if (failChance > 0 && rng.chance(failChance)) {
                removeStatus(casterKey, (effect) => effect.type === "fail_attack");
                log(`${label(casterKey)} falhou o ataque por confusão!`, "log-critical");
                emit("fail", { key: casterKey });
            } else {
                applyAttack(card, casterKey, targetKey, modifier, combo);
            }
        }

        // 5) efeito especial
        if (card.effect && !MODIFIER_EFFECTS.has(card.effect) && effectHandlers[card.effect]) {
            effectHandlers[card.effect](ctx);
        }
        if (card.effect) {
            emit("effect", { key: casterKey, effectId: card.effect, cardId: card.id });
        }

        // 6) consumo do buff de Taijutsu
        if (card.type === "Taijutsu") {
            const buff = caster.statusEffects.find((effect) => effect.type === "buff_taijutsu_atk" && effect.duration > 0);
            if (buff) {
                caster.attackBoost -= buff.value || 0;
                removeStatus(casterKey, (effect) => effect === buff);
                log(`${label(casterKey)} consumiu ${buff.name}!`, "log-critical");
            }
        }
    }

    function applyAttack(card, casterKey, targetKey, modifier, combo) {
        const caster = fighter(casterKey);
        const target = fighter(targetKey);

        // desvio
        const defenderDodge = target.dodgeChance || 0;
        const attackerAccuracy = Math.min(0.99, (caster.accuracy || 0.85) + caster.accuracyBoost + boostTotal(casterKey, "accuracy"));
        const jutsuScale = (card.attack + (caster.jutsuPower || 0) * 0.4) / 100;
        const dodgeRoll = Math.max(0, Math.min(0.6, defenderDodge * attackerAccuracy * (1 - Math.min(0.6, jutsuScale * 0.5))));
        if (dodgeRoll > 0 && rng.chance(dodgeRoll)) {
            log(`${label(targetKey)} DESVIOU de ${card.name}!`, "log-status");
            emit("dodge", { key: targetKey });
            return;
        }

        const hits = modifier.hits || card.hits || 1;
        const elementResult = elementMultiplier(card.element, target.element);
        if (elementResult.label) {
            log(elementResult.label, elementResult.mult > 1 ? "log-critical" : "log-damage");
        }

        const taijutsuBonus = statusValue(casterKey, "buff_taijutsu_atk")
            + (card.type === "Taijutsu" ? boostTotal(casterKey, "taijutsu_attack") : 0);
        const statAttackBonus = boostTotal(casterKey, "attack");
        const critBonus = statusValue(casterKey, "crit_chance");

        // Cortina de fumaça: reduz o próximo ataque de quem está encoberto
        const smoke = caster.statusEffects.find((effect) => effect.type === "reduce_attack_percent" && effect.duration > 0);
        const smokeFactor = smoke ? Math.max(0, 1 - (smoke.value || 0)) : 1;

        let totalDamage = 0;
        let anyCrit = false;

        for (let hit = 0; hit < hits; hit++) {
            let hitDamage = card.attack + caster.attackBoost + statAttackBonus + caster.baseAttackBonus + taijutsuBonus;
            const isCrit = rng.chance(Math.min(0.95, (card.critChance || 0) + caster.baseCritBonus + caster.critChanceBoost + critBonus));
            if (isCrit) {
                hitDamage = Math.round(hitDamage * 1.5);
                anyCrit = true;
            }
            hitDamage = Math.round(hitDamage * (1 + (combo.bonus || 0)) * elementResult.mult * smokeFactor);
            if (hitDamage < 0) hitDamage = 0;

            totalDamage += dealDamage(targetKey, hitDamage, {
                ignoreDefense: !!modifier.ignoreDefense,
                ignoreDefenseValue: modifier.ignoreDefenseValue || 0,
                pierceDefensePercent: modifier.pierceDefensePercent || 0,
                areaPiercePercent: modifier.areaPiercePercent || 0,
                isCrit
            });
        }

        if (smoke) {
            removeStatus(casterKey, (effect) => effect === smoke);
            log(`${label(casterKey)} teve o ataque reduzido em ${Math.round((smoke.value || 0) * 100)}%!`, "log-status");
        }
        if (anyCrit) log("ACERTO CRÍTICO!", "log-critical");
        if (hits > 1) {
            log(`${card.name} golpeia ${hits}x (${totalDamage} total)!`, "log-damage");
        }
    }

    // ---------------------------------------------------------- fim de turno
    function endTurn() {
        if (state.phase === PHASES.GAME_OVER) return;
        const finished = state.currentPlayer;
        fighter(finished).isStunned = false;
        log(`Fim do turno de ${label(finished)}.`, "log-system");

        if (finished === "player") {
            state.currentPlayer = "opponent";
            state.phase = PHASES.OPPONENT_TURN;
            emit("turn", { turn: state.turn, currentPlayer: state.currentPlayer });
            applyTurnStartEffects("opponent");
            if (checkGameOver()) return;
            draw(1, "opponent");
            if (checkGameOver()) return;
            // a IA é local: joga o turno inteiro aqui (a UI só re-renderiza)
            runOpponentTurn();
            return;
        }

        state.currentPlayer = "player";
        state.phase = PHASES.PLAYER_TURN;
        state.turn += 1;
        emit("turn", { turn: state.turn, currentPlayer: state.currentPlayer });
        applyTurnStartEffects("player");
        if (checkGameOver()) return;
        draw(1, "player");
        fighter("player").canPlayCard = true;
    }

    function applyTurnStartEffects(key) {
        const target = fighter(key);
        const expired = [];

        target.statusEffects.forEach((effect) => {
            if (effect.duration <= 0) {
                expired.push(effect);
                return;
            }
            switch (effect.type) {
                case "burn":
                case "poison":
                case "summon_dot":
                case "bleed": {
                    const dotDamage = effect.value || 0;
                    if (dotDamage > 0) {
                        target.health = Math.max(0, target.health - dotDamage);
                        emit("dot", { key, amount: dotDamage, effectType: effect.type });
                        log(`${label(key)} sofreu ${dotDamage} de dano de ${effect.name}.`, "log-damage");
                    }
                    break;
                }
                case "stat_boost": {
                    const boost = effect.value || {};
                    if (boost.taijutsu_attack) {
                        // bônus de Taijutsu é aplicado na hora do golpe
                    }
                    if (effect.regen && effect.regen.chakra) {
                        restoreChakra(key, effect.regen.chakra);
                        log(`${label(key)} regenerou ${effect.regen.chakra} de Chakra.`, "log-status");
                    }
                    if (effect.self_dmg) {
                        target.health = Math.max(0, target.health - effect.self_dmg);
                        emit("dot", { key, amount: effect.self_dmg, effectType: "self_damage" });
                        log(`${label(key)} sofre ${effect.self_dmg} de dano por esforço excessivo.`, "log-damage");
                    }
                    break;
                }
                case "stun":
                    target.isStunned = true;
                    emit("stun", { key });
                    log(`${label(key)} está ATORDOADO!`, "log-critical");
                    break;
                default:
                    break;
            }
        });

        // buff de Taijutsu expira com a duração (o consumo é no uso)
        target.statusEffects = target.statusEffects.filter((effect) => {
            if (expired.includes(effect)) return false;
            if (effect.type === "buff_taijutsu_atk") return effect.duration > 0;
            effect.duration -= 1;
            return effect.duration > 0;
        });
    }

    function checkGameOver() {
        if (state.phase === PHASES.GAME_OVER) return true;
        if (state.player.health <= 0) {
            state.phase = PHASES.GAME_OVER;
            log("Você foi derrotado!", "log-damage");
            emit("end", { winner: "opponent" });
            return true;
        }
        if (state.opponent.health <= 0) {
            state.phase = PHASES.GAME_OVER;
            log("Oponente foi derrotado!", "log-critical");
            emit("end", { winner: "player" });
            return true;
        }
        return false;
    }

    // ------------------------------------------------------------------ IA
    function runOpponentTurn() {
        if (state.phase === PHASES.GAME_OVER) return;
        if (state.currentPlayer !== "opponent" || state.phase !== PHASES.OPPONENT_TURN) return;
        const opponent = fighter("opponent");
        if (opponent.isStunned) {
            log("Oponente está ATORDOADO e perde o turno!", "log-critical");
            opponent.isStunned = false;
            emit("stun", { key: "opponent" });
            endTurn();
            return;
        }
        takeOpponentAction(MAX_AI_ACTIONS);
    }

    function takeOpponentAction(actionsLeft) {
        if (state.phase === PHASES.GAME_OVER) return;
        if (actionsLeft <= 0) {
            log("Oponente encerra suas ações.", "log-system");
            endTurn();
            return;
        }
        const opponent = fighter("opponent");
        const playable = opponent.hand
            .map((card, index) => ({ card, index }))
            .filter(({ card }) => opponent.chakra >= card.cost);

        if (playable.length === 0) {
            log("Oponente não tem chakra para jogar e encerra o turno.", "log-system");
            endTurn();
            return;
        }

        const chosen = pickOpponentCard(playable, opponent, state.player);
        if (!chosen) {
            endTurn();
            return;
        }

        const { card, index } = chosen;
        opponent.chakra -= card.cost;
        if (card.cost > 0) emit("chakra", { key: "opponent", amount: card.cost, gained: false });
        opponent.hand.splice(index, 1);
        opponent.discard.push(card.id);
        log(`Oponente usou ${card.name}!`, "log-damage");
        emit("attack", { key: "opponent", card });
        applyCard(card, "opponent", "player");
        if (checkGameOver()) return;
        takeOpponentAction(actionsLeft - 1);
    }

    function pickOpponentCard(playable, opponent, player) {
        const hpPercent = opponent.health / opponent.maxHealth;

        // 1) limpa efeitos negativos
        const bleeding = opponent.statusEffects.some((effect) => ["bleed", "poison", "burn"].includes(effect.type));
        if (bleeding) {
            const cleanse = playable.find(({ card }) => card.effect === "remove_debuffs");
            if (cleanse) return cleanse;
        }
        // 2) cura emergencial
        if (hpPercent < 0.35) {
            const heal = playable.find(({ card }) => card.effect === "heal");
            if (heal) return heal;
        }
        // 3) golpe letal
        const lethal = playable.find(({ card }) => card.attack > 0 && estimateDamage(card, opponent, player) >= player.health);
        if (lethal) {
            log("Oponente busca o golpe final!", "log-critical");
            return lethal;
        }
        // 4) mantém combo elemental
        if (opponent.combo.element && opponent.combo.count >= 1) {
            const sameElement = playable.filter(({ card }) => card.element === opponent.combo.element && card.attack > 0);
            if (sameElement.length > 0) {
                return sameElement.reduce((a, b) => (b.card.attack > a.card.attack ? b : a));
            }
        }
        // 5) perfura a defesa do jogador
        if (player.defense > 15) {
            const pierce = playable.find(({ card }) =>
                ["ignore_defense", "ignore_defense_value", "piercing_attack", "area_attack"].includes(card.effect)
            );
            if (pierce) return pierce;
        }
        // 6) aplica DoT
        if (!player.statusEffects.some((effect) => ["burn", "poison", "summon_dot"].includes(effect.type))) {
            const dot = playable.find(({ card }) => ["burn", "poison", "summon_dot"].includes(card.effect));
            if (dot) return dot;
        }
        // 7) agressivo: melhor eficiência de dano por chakra
        return playable.reduce((best, current) => {
            const bestEff = (estimateDamage(best.card, opponent, player) + best.card.attack * 0.1) / Math.max(1, best.card.cost);
            const currentEff = (estimateDamage(current.card, opponent, player) + current.card.attack * 0.1) / Math.max(1, current.card.cost);
            return currentEff > bestEff ? current : best;
        });
    }

    function estimateDamage(card, caster, target) {
        if (!card.attack) return 0;
        const taijutsuBonus = card.type === "Taijutsu" ? boostTotal(caster.key, "taijutsu_attack") : 0;
        let damage = (card.attack + caster.attackBoost + boostTotal(caster.key, "attack")
            + caster.baseAttackBonus + taijutsuBonus) * (card.hits || 1);
        const mitigation = target.statusEffects
            .filter((effect) => effect.type === "defense_percent" && effect.duration > 0)
            .reduce((total, effect) => total + effect.value, 0) + (target.defensePercent || 0);
        damage *= (1 - mitigation);
        const element = elementMultiplier(card.element, target.element);
        damage *= element.mult;
        const absorb = Math.min(damage, target.defense + boostTotal(target.key, "defense"));
        return Math.round(damage - absorb);
    }

    // --------------------------------------------------------------- fusão
    function canFuse(handIndexA, handIndexB) {
        const hand = state.player.hand;
        const cardA = hand[handIndexA];
        const cardB = hand[handIndexB];
        if (!cardA || !cardB) return null;
        return findFusion(cardA.id, cardB.id);
    }

    function fuse(handIndexA, handIndexB) {
        const recipe = canFuse(handIndexA, handIndexB);
        if (!recipe) return { ok: false, reason: "Essas cartas não se fundem." };
        const player = state.player;
        if (player.chakra < recipe.cost) return { ok: false, reason: "Chakra insuficiente para a fusão." };

        const sorted = [handIndexA, handIndexB].sort((a, b) => b - a);
        sorted.forEach((index) => {
            const [removed] = player.hand.splice(index, 1);
            player.discard.push(removed.id);
        });
        player.chakra -= recipe.cost;
        const fusionCard = createFusionInstance(recipe);
        player.hand.push(fusionCard);
        emit("fusion", { card: fusionCard });
        log(`FUSÃO! ${fusionCard.name} criado (custo ${recipe.cost}).`, "log-critical");
        return { ok: true, card: fusionCard };
    }

    // ----------------------------------------------------------- snapshot
    function getSnapshot() {
        const serialize = (key) => {
            const f = fighter(key);
            return {
                key,
                name: f.name,
                element: f.element,
                health: f.health,
                maxHealth: f.maxHealth,
                chakra: f.chakra,
                maxChakra: f.maxChakra,
                defense: f.defense,
                maxDefense: f.maxDefense,
                deckCount: f.deck.length,
                discardCount: f.discard.length,
                hand: f.hand.map((card) => ({
                    id: card.id,
                    name: card.name,
                    type: card.type,
                    element: card.element,
                    cost: card.cost,
                    description: card.description,
                    art: card.art,
                    rarity: card.rarity,
                    attack: card.attack,
                    defenseBuff: card.defenseBuff,
                    defensePercent: card.defensePercent,
                    effect: card.effect,
                    effectValue: card.effectValue,
                    effectIcon: card.effectInfo ? card.effectInfo.icon : "✦",
                    effectLabel: card.effectInfo ? card.effectInfo.label : "",
                    duration: card.duration,
                    hits: card.hits || 1,
                    critChance: card.critChance || 0,
                    isFusion: !!card.isFusion,
                    level: card.level
                })),
                statusEffects: f.statusEffects.map((effect) => ({
                    id: effect.id,
                    name: effect.name,
                    type: effect.type,
                    duration: effect.duration,
                    description: effect.description || ""
                })),
                combo: { ...f.combo },
                isStunned: f.isStunned
            };
        };
        return {
            turn: state.turn,
            currentPlayer: state.currentPlayer,
            phase: state.phase,
            player: serialize("player"),
            opponent: serialize("opponent")
        };
    }

    return battle;
}

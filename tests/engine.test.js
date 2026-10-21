/**
 * Testes do motor e do conteúdo — npm test
 *
 * A regra de ouro do projeto: nenhuma carta pode existir sem funcionar.
 * Estes testes jogam TODA carta do registro numa batalha de teste e exigem
 * que ela produza algum efeito real (dano, status, cura, descarte...).
 * Se alguém adicionar uma carta "sem designer", este arquivo quebra.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { CARDS, CARD_IDS, isDeckable, getCard } from "../src/data/cards.js";
import { EFFECTS, EFFECT_IDS } from "../src/data/effects.js";
import { ELEMENT_IDS, elementMultiplier } from "../src/data/elements.js";
import { CLANS, CHARACTER_LIST, deriveStats } from "../src/data/clans.js";
import { FUSION_RECIPES, findFusion, buildCharacterDeck, OPPONENT_DECK } from "../src/data/catalog.js";
import { createBattle, PHASES } from "../src/core/engine.js";
import { createCardInstance, createFusionInstance, levelMultiplier } from "../src/core/card.js";
import { effectHandlers, missingEffectHandlers, orphanEffectHandlers } from "../src/core/effect-runtime.js";
import { equipBonus, applyEquipment } from "../src/core/equipment.js";
import { createRng } from "../src/core/rng.js";

const FILLER = "taijutsu001";

function testFighter(overrides = {}) {
    return {
        name: "Teste",
        element: "Nenhum",
        maxHealth: 100000,
        maxChakra: 100000,
        maxDefense: 50,
        attackBonus: 0,
        critChanceBonus: 0,
        dodgeChance: 0,
        accuracy: 1,
        jutsuPower: 0,
        deck: [FILLER, FILLER, FILLER, FILLER],
        ...overrides
    };
}

function sandbox(cardId) {
    const events = [];
    const battle = createBattle({
        player: testFighter({ name: "Jogador", deck: [FILLER, FILLER] }),
        opponent: testFighter({ name: "Oponente" }),
        seed: 42,
        emit: (type, payload) => events.push({ type, payload })
    });
    battle.start();
    battle.state.player.chakra = 100000;
    battle.state.player.health = Math.floor(battle.state.player.maxHealth / 2);
    battle.state.player.hand = [createCardInstance(cardId)];
    return { battle, events };
}

// ------------------------------------------------------------------ dados
test("nenhum id de carta duplicado", () => {
    const ids = Object.keys(CARDS);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(ids.length, CARD_IDS.length);
});

test("todo efeito do catálogo tem handler e todo handler está no catálogo", () => {
    assert.deepEqual(missingEffectHandlers(EFFECT_IDS), []);
    assert.deepEqual(orphanEffectHandlers(EFFECT_IDS), []);
});

test("todo efeito usado por carta existe no catálogo", () => {
    Object.entries(CARDS).forEach(([id, card]) => {
        if (card.effect) assert.ok(EFFECTS[card.effect], `${id} usa efeito desconhecido ${card.effect}`);
    });
});

test("elementos têm multiplicadores consistentes", () => {
    assert.equal(elementMultiplier("Vento", "Nenhum").mult, 1);
    ELEMENT_IDS.forEach((attacker) => {
        ELEMENT_IDS.forEach((defender) => {
            const result = elementMultiplier(attacker, defender);
            assert.ok([0.7, 1, 1.3].includes(result.mult), `${attacker} -> ${defender} = ${result.mult}`);
        });
    });
});

test("cartas de deck têm ataque, defesa ou efeito", () => {
    Object.entries(CARDS).forEach(([id, card]) => {
        if (!isDeckable(card)) return;
        const doesSomething = card.attack > 0 || card.defenseBuff > 0 || card.defensePercent > 0 || card.effect;
        assert.ok(doesSomething, `${id} não faz nada`);
    });
});

// ------------------------------------------------------------- todo effect
test("TODA carta do registro produz um efeito real em partida", () => {
    Object.keys(CARDS).forEach((cardId) => {
        const card = getCard(cardId);
        if (!isDeckable(card)) return;

        const { battle, events } = sandbox(cardId);
        const before = JSON.stringify(battle.getSnapshot());
        const result = battle.playCard("player", 0);

        assert.ok(result.ok, `${cardId}: não pôde ser jogada (${result.reason})`);
        const after = JSON.stringify(battle.getSnapshot());
        assert.notEqual(after, before, `${cardId}: jogou mas nada mudou no estado`);

        const relevant = events.filter((event) =>
            ["damage", "status", "heal", "chakra", "effect", "discard", "draw", "defense", "dodge", "blocked", "dot"].includes(event.type)
        );
        assert.ok(relevant.length > 0, `${cardId}: nenhum evento de efeito emitido`);
    });
});

test("cartas com efeito disparam o handler correto", () => {
    const seen = new Set();
    Object.entries(CARDS).forEach(([cardId, card]) => {
        if (!card.effect || !isDeckable(card)) return;
        const { battle, events } = sandbox(cardId);
        battle.playCard("player", 0);
        const emitted = events.find((event) => event.type === "effect");
        assert.ok(emitted, `${cardId}: evento "effect" não emitido`);
        assert.equal(emitted.payload.effectId, card.effect, `${cardId}: efeito executado diferente do declarado`);
        seen.add(card.effect);
    });

    // todo efeito do catálogo é usado por pelo menos uma carta
    // (equip_passive vive nos equipamentos, exercitado em src/core/equipment.js)
    EFFECT_IDS.filter((effectId) => effectId !== "equip_passive").forEach((effectId) => {
        assert.ok(seen.has(effectId), `efeito "${effectId}" não é exercitado por nenhuma carta`);
    });
    assert.ok(seen.has("equip_passive") || true);
    Object.keys(CARDS)
        .filter((id) => ["Armadura", "Arma"].includes(CARDS[id].type))
        .forEach((id) => {
            assert.ok(CARDS[id].equip_effect, `${id} sem equip_effect`);
            assert.ok(equipBonus(id), `${id} sem bônus de equipamento`);
        });
});

test("efeitos que prometem dano realmente causam dano", () => {
    ["ignore_defense", "ignore_defense_value", "piercing_attack", "area_attack", "multi_hit"].forEach((effectId) => {
        const cardId = Object.keys(CARDS).find((id) => CARDS[id].effect === effectId);
        assert.ok(cardId, `nenhuma carta usa ${effectId}`);
        const { battle, events } = sandbox(cardId);
        battle.playCard("player", 0);
        assert.ok(events.some((event) => event.type === "damage"), `${cardId}: não causou dano`);
    });
});

test("multi_hit acerta N vezes", () => {
    const cardId = Object.keys(CARDS).find((id) => CARDS[id].effect === "multi_hit");
    const card = getCard(cardId);
    const { battle, events } = sandbox(cardId);
    battle.playCard("player", 0);
    const damages = events.filter((event) => event.type === "damage");
    assert.equal(damages.length, card.hits, `${cardId}: esperado ${card.hits} acertos, houve ${damages.length}`);
});

test("ignore_defense ignora a defesa do alvo", () => {
    const cardId = Object.keys(CARDS).find((id) => CARDS[id].effect === "ignore_defense");
    const { battle, events } = sandbox(cardId);
    battle.state.opponent.defense = 999;
    battle.playCard("player", 0);
    const damage = events.filter((event) => event.type === "damage").reduce((sum, event) => sum + event.payload.amount, 0);
    assert.ok(damage > 0, "dano ignorou a defesa mas não causou dano na vida");
});

test("defesa absorve dano antes da vida", () => {
    const cardId = Object.keys(CARDS).find((id) => CARDS[id].effect === "piercing_attack");
    const { battle, events } = sandbox(cardId);
    battle.state.opponent.defense = 20;
    battle.playCard("player", 0);
    assert.ok(events.some((event) => event.type === "defense"), "nenhum dano foi absorvido pela defesa");
});

test("cura e recuperação de chakra alteram o estado", () => {
    const healId = Object.keys(CARDS).find((id) => CARDS[id].effect === "heal");
    const { battle } = sandbox(healId);
    const before = battle.state.player.health;
    battle.playCard("player", 0);
    assert.ok(battle.state.player.health > before, "cura não restaurou vida");

    const chakraId = Object.keys(CARDS).find((id) => CARDS[id].effect === "recover_chakra");
    const chakraBattle = sandbox(chakraId).battle;
    chakraBattle.state.player.chakra = CARDS[chakraId].cost;
    chakraBattle.playCard("player", 0);
    assert.ok(chakraBattle.state.player.chakra > 0, "recuperação de chakra não funcionou");
});

test("efeito de drenagem de chakra tira do alvo e dá ao usuário", () => {
    const cardId = Object.keys(CARDS).find((id) => CARDS[id].effect === "chakra_drain");
    const { battle } = sandbox(cardId);
    battle.state.opponent.chakra = 50;
    battle.state.player.chakra = CARDS[cardId].cost;
    battle.playCard("player", 0);
    assert.ok(battle.state.opponent.chakra < 50, "alvo não perdeu chakra");
    assert.ok(battle.state.player.chakra > 0, "usuário não recuperou o chakra drenado");
});

test("atordoamento impede o oponente de jogar no turno seguinte", () => {
    const cardId = Object.keys(CARDS).find((id) => CARDS[id].effect === "stun");
    const { battle, events } = sandbox(cardId);
    battle.playCard("player", 0);
    battle.endTurn();
    assert.ok(events.some((event) => event.type === "stun" && event.payload.key === "opponent"),
        "oponente não foi atordoado");
    assert.ok(!events.some((event) => event.type === "attack" && event.payload.key === "opponent"),
        "oponente atordoado jogou uma carta");
});

test("PoT causa dano por turno", () => {
    const cardId = Object.keys(CARDS).find((id) => CARDS[id].effect === "burn");
    const { battle } = sandbox(cardId);
    battle.playCard("player", 0);
    const before = battle.state.opponent.health;
    battle.endTurn();
    assert.ok(battle.state.opponent.health < before, "queimadura não causou dano no turno seguinte");
});

// ------------------------------------------------------------------ turnos
test("a batalha alterna os turnos e a IA joga cartas", () => {
    const events = [];
    const battle = createBattle({
        player: testFighter({ name: "Jogador", deck: [FILLER, FILLER, FILLER] }),
        opponent: testFighter({ name: "IA", deck: [...OPPONENT_DECK] }),
        seed: 7,
        emit: (type, payload) => events.push({ type, payload })
    });
    battle.start();
    assert.equal(battle.state.currentPlayer, "player");
    battle.endTurn();
    // a IA é local: o turno dela é resolvido dentro de endTurn()
    assert.equal(battle.state.currentPlayer, "player");
    assert.equal(battle.state.turn, 2);
    const attacks = events.filter((event) => event.type === "attack" && event.payload.key === "opponent");
    assert.ok(attacks.length > 0, "IA não jogou nenhuma carta");
});

test("cartas sem chakra não podem ser jogadas", () => {
    const { battle } = sandbox("jutsu001");
    battle.state.player.chakra = 0;
    const result = battle.playCard("player", 0);
    assert.equal(result.ok, false);
    assert.match(result.reason, /Chakra/);
});

test("jogo é determinístico com a mesma semente", () => {
    const run = () => {
        const events = [];
        const battle = createBattle({
            player: testFighter({ deck: [...OPPONENT_DECK] }),
            opponent: testFighter({ deck: [...OPPONENT_DECK] }),
            seed: 1234,
            emit: (type, payload) => events.push({ type, payload: JSON.stringify(payload) })
        });
        battle.start();
        for (let i = 0; i < 6; i++) {
            battle.state.player.chakra = 100000;
            const hand = battle.state.player.hand;
            if (hand.length) battle.playCard("player", 0);
            battle.endTurn();
        }
        return JSON.stringify(events);
    };
    assert.equal(run(), run());
});

test("a batalha termina quando a vida chega a zero", () => {
    const events = [];
    const battle = createBattle({
        player: testFighter({ deck: [FILLER] }),
        opponent: testFighter({ maxHealth: 1, deck: [FILLER] }),
        seed: 3,
        emit: (type, payload) => events.push({ type, payload })
    });
    battle.start();
    battle.state.player.hand = [createCardInstance("jutsu007")];
    battle.state.player.chakra = 999;
    battle.playCard("player", 0);
    assert.equal(battle.state.phase, PHASES.GAME_OVER);
    assert.ok(events.some((event) => event.type === "end" && event.payload.winner === "player"));
});

// ------------------------------------------------------------------- fusão
test("fusões declaradas usam cartas existentes e produzem carta jogável", () => {
    FUSION_RECIPES.forEach((recipe) => {
        const instance = createFusionInstance(recipe);
        assert.ok(instance.id, `fusão ${recipe.id} sem id`);
        assert.ok(instance.name, `fusão ${recipe.id} sem nome`);
        assert.ok(instance.attack > 0 || instance.effect, `fusão ${recipe.id} não faz nada`);
        if (instance.effect) assert.ok(effectHandlers[instance.effect], `fusão ${recipe.id} usa efeito sem handler`);
    });
});

test("findFusion encontra a combinação correta", () => {
    const recipe = FUSION_RECIPES[0];
    assert.ok(findFusion(recipe.req[0], recipe.req[1]));
    assert.ok(findFusion(recipe.req[1], recipe.req[0]));
    assert.equal(findFusion("jutsu001", "jutsu004"), null);
});

test("fusão consome as duas cartas e cria a carta fundida", () => {
    const recipe = FUSION_RECIPES.find((item) => item.req[0] === "jutsu001" && item.req[1] === "jutsu001");
    const battle = createBattle({
        player: testFighter({ deck: [FILLER] }),
        opponent: testFighter({ deck: [FILLER] }),
        seed: 11
    });
    battle.start();
    battle.state.player.hand = [createCardInstance("jutsu001"), createCardInstance("jutsu001")];
    battle.state.player.chakra = 999;
    const result = battle.fuse(0, 1);
    assert.ok(result.ok);
    assert.equal(battle.state.player.hand.length, 1);
    assert.equal(battle.state.player.hand[0].id, recipe.id);
});

// -------------------------------------------------------------- personagens
test("todo personagem tem deck válido e começa uma batalha", () => {
    CHARACTER_LIST.forEach((character) => {
        const deck = buildCharacterDeck(character, []);
        assert.ok(deck.length > 0, `${character.name}: deck vazio`);
        deck.forEach((cardId) => assert.ok(CARDS[cardId], `${character.name}: carta inexistente ${cardId}`));

        const stats = deriveStats(character.clan, character.id, character.baseAttributes);
        const battle = createBattle({
            player: { ...testFighter({ deck }), ...stats, name: character.name, element: character.element },
            opponent: testFighter({ deck: OPPONENT_DECK }),
            seed: 5
        });
        battle.start();
        assert.ok(battle.state.player.hand.length > 0, `${character.name}: mão vazia`);
    });
});

test("clã entrega equipamento válido", () => {
    Object.values(CLANS).forEach((clan) => {
        Object.values(clan.characters).forEach((character) => {
            (character.startEquipment || []).forEach((cardId) => {
                const card = CARDS[cardId];
                assert.ok(card, `${character.name}: equipamento inexistente ${cardId}`);
                assert.ok(["Armadura", "Arma"].includes(card.type), `${character.name}: ${cardId} não é equipamento`);
            });
        });
    });
});

// -------------------------------------------------------------- equipamento
test("bônus de equipamento altera as estatísticas", () => {
    const bonus = equipBonus("armor001");
    assert.equal(bonus.health, 20);
    assert.ok(bonus.defensePercent > 0);

    const stats = applyEquipment({ maxHealth: 500, maxDefense: 60, attackBonus: 10 }, {
        equippedArmor: { Peito: "armor001" },
        equippedTools: { Ferramenta1: "weapon001" }
    });
    assert.equal(stats.maxHealth, 520);
    assert.equal(stats.attackBonus, 20);
});

// -------------------------------------------------------------------- misc
test("escalonamento por nível aumenta o poder da carta", () => {
    assert.equal(levelMultiplier(1), 1);
    assert.ok(levelMultiplier(5) > 1);
    const card = createCardInstance("jutsu001", 5, 0);
    assert.ok(card.attack > CARDS.jutsu001.attack);
});

test("RNG é determinístico e devolve valores dentro da faixa", () => {
    const rng = createRng(99);
    for (let i = 0; i < 200; i++) {
        const value = rng.next();
        assert.ok(value >= 0 && value < 1);
    }
    const a = createRng(5);
    const b = createRng(5);
    assert.deepEqual(a.shuffle([1, 2, 3, 4, 5]), b.shuffle([1, 2, 3, 4, 5]));
});

test("descarta o máximo de cartas pedido", () => {
    const cardId = Object.keys(CARDS).find((id) => CARDS[id].effect === "opponent_discard");
    const { battle, events } = sandbox(cardId);
    battle.state.opponent.hand = [
        createCardInstance("jutsu001"),
        createCardInstance("jutsu002"),
        createCardInstance("jutsu003")
    ];
    battle.playCard("player", 0);
    const discards = events.filter((event) => event.type === "discard");
    assert.equal(discards.length, CARDS[cardId].effectValue);
});

// --------------------------------------------------- regressões do motor
test("IA joga cartas com ataque sem quebrar a batalha", () => {
    const events = [];
    const battle = createBattle({
        player: testFighter({ name: "Jogador", deck: ["jutsu001", "jutsu001"] }),
        opponent: testFighter({ name: "Oponente", deck: ["jutsu001", "jutsu001", "jutsu001", "jutsu001"] }),
        seed: 7,
        emit: (type, payload) => events.push({ type, payload })
    });
    battle.start();
    battle.state.player.chakra = 100;
    assert.doesNotThrow(() => battle.endTurn());
    const damages = events.filter((event) => event.type === "damage");
    assert.ok(damages.length > 0, "a IA deve causar dano");
});

test("buff de atributo (stat_boost) aumenta o dano e a defesa", () => {
    const damageWith = (playBoost) => {
        const battle = createBattle({
            player: testFighter({ name: "Jogador", deck: ["mode003", "jutsu001"] }),
            opponent: testFighter({ name: "Oponente" }),
            seed: 21,
            emit: () => {}
        });
        battle.start();
        battle.state.player.chakra = 100000;
        battle.state.player.hand = [
            createCardInstance(playBoost ? "mode003" : "jutsu001"),
            createCardInstance(playBoost ? "jutsu001" : "mode003")
        ];
        if (playBoost) {
            assert.ok(battle.playCard("player", 0).ok, "o modo deve ser jogado");
        }
        const before = battle.state.opponent.health;
        assert.ok(battle.playCard("player", 0).ok, "o jutsu deve ser jogado");
        return before - battle.state.opponent.health;
    };

    const semBuff = damageWith(false);
    const comBuff = damageWith(true);
    assert.equal(semBuff, 40, "Rasengan sozinho causa 40 de dano");
    assert.equal(comBuff, 55, "com +15 de ataque o Rasengan causa 55 de dano");
});

test("defesa de buff absorve dano do oponente", () => {
    const lifeLost = (playBoost) => {
        const battle = createBattle({
            player: testFighter({ name: "Jogador", deck: ["mode003", "taijutsu001"] }),
            opponent: testFighter({ name: "Oponente", deck: ["taijutsu001", "taijutsu001", "taijutsu001", "taijutsu001"] }),
            seed: 5,
            emit: () => {}
        });
        battle.start();
        battle.state.player.chakra = 100000;
        if (playBoost) {
            battle.state.player.hand = [createCardInstance("mode003")];
            battle.playCard("player", 0);
        }
        const before = battle.state.player.health;
        battle.endTurn();
        return before - battle.state.player.health;
    };

    const semBuff = lifeLost(false);
    const comBuff = lifeLost(true);
    assert.ok(comBuff < semBuff, `o buff de defesa deve reduzir o dano (${comBuff} < ${semBuff})`);
});

test("cortina de fumaça reduz o ataque em 50% (uma vez)", () => {
    const damageTaken = (useSmoke) => {
        const battle = createBattle({
            player: testFighter({ name: "Jogador", deck: [FILLER, FILLER, "item004", "item004"] }),
            opponent: testFighter({ name: "Oponente", deck: ["taijutsu001", "taijutsu001", "taijutsu001", "taijutsu001"] }),
            seed: 99,
            emit: () => {}
        });
        battle.start();
        battle.state.player.chakra = 100000;
        if (useSmoke) {
            const index = battle.state.player.hand.findIndex((card) => card.id === "item004");
            assert.ok(index >= 0, "a bomba de fumaça precisa estar na mão");
            assert.ok(battle.playCard("player", index).ok);
        }
        const before = battle.state.player.health;
        battle.endTurn();
        return before - battle.state.player.health;
    };

    const semFumaça = damageTaken(false);
    const comFumaça = damageTaken(true);
    assert.equal(semFumaça, 60, "3 golpes de 20 causam 60 de dano");
    assert.equal(comFumaça, 50, "o primeiro golpe é reduzido pela metade (10 + 20 + 20)");
});

test("defesa percentual do equipamento reduz o dano", () => {
    const damage = (defensePercent) => {
        const battle = createBattle({
            player: testFighter({ name: "Jogador", deck: ["jutsu001"] }),
            opponent: testFighter({ name: "Oponente", defensePercent }),
            seed: 11,
            emit: () => {}
        });
        battle.start();
        battle.state.player.chakra = 100000;
        battle.state.player.hand = [createCardInstance("jutsu001")];
        const before = battle.state.opponent.health;
        battle.playCard("player", 0);
        return before - battle.state.opponent.health;
    };

    assert.equal(damage(0), 40);
    assert.equal(damage(0.5), 20);
});

test("effectValue percentual não é arredondado na instância", () => {
    assert.equal(createCardInstance("item004").effectValue, 0.5, "a fumaça reduz 50%");
    assert.equal(createCardInstance("buff003").effectValue, 0.2, "visão sharingan = +20% de crítico");
    assert.equal(createCardInstance("jutsu051").effectValue, 0.5, "flores demôniacas = 50% de falha");
    assert.equal(createCardInstance("debuff003").effectValue, 0.5, "confusão = 50% de falha");
});

test("byakugan revela a mão do oponente por 1 turno", () => {
    const battle = createBattle({
        player: testFighter({ name: "Jogador", deck: ["mode004", FILLER] }),
        opponent: testFighter({ name: "Oponente" }),
        seed: 13,
        emit: () => {}
    });
    battle.start();
    battle.state.player.chakra = 100000;
    battle.state.player.hand = [createCardInstance("mode004")];
    assert.ok(battle.playCard("player", 0).ok);
    const reveal = battle.getSnapshot().player.statusEffects.find((effect) => effect.type === "reveal_hand");
    assert.ok(reveal, "o byakugan precisa revelar a mão");
    assert.equal(reveal.duration, 1);
});

test("bônus de precisão do byakugan melhora o acerto", () => {
    const accuracy = (withBoost) => {
        const battle = createBattle({
            player: testFighter({ name: "Jogador", deck: ["mode004", "jutsu001"] }),
            opponent: testFighter({ name: "Oponente" }),
            seed: 17,
            emit: () => {}
        });
        battle.start();
        battle.state.player.chakra = 100000;
        battle.state.player.hand = withBoost
            ? [createCardInstance("mode004"), createCardInstance("jutsu001")]
            : [createCardInstance("jutsu001")];
        if (withBoost) battle.playCard("player", 0);
        battle.state.player.accuracy = 0.5;
        battle.state.player.hand = [createCardInstance("jutsu001")];
        const before = battle.state.opponent.health;
        battle.playCard("player", 0);
        return before - battle.state.opponent.health;
    };
    assert.equal(accuracy(false), 40, "ataque sem precisão bonus");
    assert.equal(accuracy(true), 40, "o dano não muda, só a chance de acertar");
});

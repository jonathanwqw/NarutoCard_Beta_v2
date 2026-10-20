// Naruto Pixel Card Game - Módulo de Combate v3
// Sons + Animações + IA Melhorada + Jogabilidade Aprimorada

document.addEventListener("DOMContentLoaded", () => {
    console.log("Módulo de Combate - Naruto Pixel Card Game v3 iniciado!");

    let ambientSoundActive = false;
    let battleStartTime = 0;

    const rivalNames = [
        "Sasuke Uchiha", "Gaara", "Neji Hyuga", "Rock Lee", "Orochimaru",
        "Kabuto Yakushi", "Kimimaro", "Zabuza Momochi", "Haku", "Itachi Uchiha",
        "Kisame Hoshigaki", "Deidara", "Sasori", "Pain (Tendo)", "Konan"
    ];
    let currentRivalName = "Oponente Desconhecido";

    // --- Sistema de Elementos (vantagem/desvantagem) ---
    const elementChart = {
        "Fogo":   { strong: "Vento",  weak: "Água" },
        "Água":   { strong: "Fogo",   weak: "Terra" },
        "Vento":  { strong: "Terra",  weak: "Raio"  },
        "Terra":  { strong: "Raio",   weak: "Vento" },
        "Raio":   { strong: "Água",   weak: "Terra" },
        "Nenhum": { strong: null,     weak: null    }
    };

    function getElementMultiplier(attackerElement, defenderElement) {
        if (!attackerElement || attackerElement === "Nenhum") return { mult: 1, label: "" };
        const chart = elementChart[attackerElement];
        if (!chart) return { mult: 1, label: "" };
        if (chart.strong === defenderElement) return { mult: 1.25, label: " VANTAGEM ELEMENTAL!" };
        if (chart.weak === defenderElement) return { mult: 0.75, label: " desvantagem elemental..." };
        return { mult: 1, label: "" };
    }

    // --- Definição da Estrutura das Cartas ---
    class Card {
        constructor(id, name, type, cost, description, image, attack = 0, defenseBuff = 0, effect = null, duration = 0, critChance = 0, effectValue = 0, defensePercent = 0, summonDotDamage = 0, element = "Nenhum") {
            this.id = id;
            this.name = name;
            this.type = type;
            this.cost = cost;
            this.description = description;
            this.image = image;
            this.attack = attack;
            this.defenseBuff = defenseBuff;
            this.defensePercent = defensePercent;
            this.effect = effect;
            this.duration = duration;
            this.critChance = critChance;
            this.effectValue = effectValue;
            this.summonDotDamage = summonDotDamage;
            this.element = element;
            this.level = 1;
            this.xp = 0;
        }

        getHTMLElement() {
            const cardElement = document.createElement("div");
            cardElement.classList.add("card");
            cardElement.classList.add(`type-${this.type.toLowerCase()}`);
            cardElement.dataset.cardId = this.id;

            let imagePlaceholder = this.type.substring(0, 3).toUpperCase();
            if (this.type === "Jutsu") imagePlaceholder = "JUT";
            if (this.type === "Taijutsu") imagePlaceholder = "TAI";
            if (this.type === "Defesa") imagePlaceholder = "DEF";
            if (this.type === "Item") imagePlaceholder = "ITM";
            if (this.type === "Buff") imagePlaceholder = "BUF";
            if (this.type === "Debuff") imagePlaceholder = "DEB";
            if (this.type === "Invocação") imagePlaceholder = "INV";
            if (this.type === "Modo") imagePlaceholder = "MOD";

            let statsHTML = "";
            if (this.attack > 0) {
                statsHTML += `<span>Atk: ${this.attack}${this.critChance > 0 ? ` (${Math.round(this.critChance * 100)}%C)` : ""}</span>`;
            }
            if (this.defenseBuff > 0) statsHTML += `<span>Def: +${this.defenseBuff}</span>`;
            if (this.defensePercent > 0) statsHTML += `<span>Def%: ${Math.round(this.defensePercent * 100)}% (${this.duration}t)</span>`;
            if (this.summonDotDamage > 0) statsHTML += `<span>DoT: ${this.summonDotDamage}/${this.duration}t</span>`;
            if (statsHTML === "") statsHTML = "<span></span>";

            const elementBadge = this.element && this.element !== "Nenhum"
                ? `<span class="card-element">${this.element}</span>` : "";

            cardElement.innerHTML = `
                <div class="card-name">${this.name}</div>
                <div class="card-cost">${this.cost > 0 ? this.cost : ""}</div>
                <div class="card-image-placeholder">${imagePlaceholder}${elementBadge}</div>
                <div class="card-type">${this.type}</div>
                <div class="card-desc">${this.description}</div>
                <div class="card-stats">${statsHTML}</div>
            `;
            return cardElement;
        }
    }

    const cardDatabase = {
        "jutsu001": { name: "Rasengan", type: "Jutsu", cost: 30, description: "Causa 40 de dano de Vento.", attack: 40, element: "Vento" },
        "jutsu002": { name: "Chidori", type: "Jutsu", cost: 35, description: "Causa 45 de dano de Raio. Crítico: 15%", attack: 45, critChance: 0.15, element: "Raio" },
        "jutsu003": { name: "Kage Bunshin", type: "Jutsu", cost: 20, description: "Compra 1 carta.", effect: "draw_card", effectValue: 1 },
        "jutsu004": { name: "Bola de Fogo", type: "Jutsu", cost: 25, description: "Causa 35 de dano de Fogo.", attack: 35, element: "Fogo" },
        "taijutsu001": { name: "Chute Dinâmico", type: "Taijutsu", cost: 10, description: "Causa 20 de dano físico.", attack: 20 },
        "taijutsu002": { name: "Rajada Leões", type: "Taijutsu", cost: 15, description: "Causa 25 de dano físico.", attack: 25 },
        "defesa001": { name: "Escudo de Terra", type: "Defesa", cost: 15, description: "Ganha 25 de Defesa.", defenseBuff: 25 },
        "jutsu006": { name: "Parede de Lama", type: "Buff", cost: 20, description: "Ganha 30% de Redução de Dano por 2 turnos.", defensePercent: 0.30, duration: 2, effect: "apply_defense_percent_buff" },
        "jutsu008": { name: "Amaterasu", type: "Jutsu", cost: 55, description: "Causa 30 de dano por 3 turnos.", effect: "burn", effectValue: 30, duration: 3, element: "Fogo" },
        "jutsu005": { name: "Dragão de Água", type: "Jutsu", cost: 40, description: "Causa 50 de dano de Água.", attack: 50, element: "Água" },
        "invoc001": { name: "Invocação: Sapo", type: "Invocação", cost: 30, description: "Causa 15 dano/turno por 3 turnos.", effect: "summon_dot", summonDotDamage: 15, duration: 3 },
        "jutsu012": { name: "Jutsu Médico", type: "Jutsu", cost: 25, description: "Recupera 40 de Vida.", effect: "heal", effectValue: 40 },
        "item001": { name: "Kunai", type: "Item", cost: 5, description: "Causa 10 de dano.", attack: 10 },
        "item002": { name: "Pílula Soldado", type: "Item", cost: 10, description: "Recupera 15 Chakra.", effect: "recover_chakra", effectValue: 15 },
        "item003": { name: "Shuriken", type: "Item", cost: 8, description: "Causa 12 de dano.", attack: 12 },
        "buff001": { name: "Força Interior", type: "Buff", cost: 20, description: "+10 Atk próximo Taijutsu.", effect: "buff_next_taijutsu", duration: 1, effectValue: 10 },
        "debuff001": { name: "Redução de Defesa", type: "Debuff", cost: 15, description: "Reduz Defesa% do oponente em 20% por 2t.", effect: "reduce_opponent_defense_percent", effectValue: 0.20, duration: 2 },
        "mode001": { name: "Modo Sábio (Sapo)", type: "Modo", cost: 50, description: "+20 Atk, +10 Chakra Regen por 3t.", effect: "stat_boost_regen", boost: { attack: 20 }, regen: { chakra: 10 }, duration: 3 },
        "jutsu018": { name: "Tsukuyomi", type: "Jutsu", cost: 75, description: "Atordoa oponente por 1 turno. Causa 20 dano.", effect: "stun", duration: 1, attack: 20 },
        "jutsu019": { name: "Chidori Senbon", type: "Jutsu", cost: 25, description: "Causa 30 de dano de Raio.", attack: 30, element: "Raio" },
    };

    const battleState = {
        turn: 0,
        currentPlayer: "player",
        gamePhase: "setup",
        player: {
            health: 500, maxHealth: 500, chakra: 50, maxChakra: 380, defense: 0, maxDefense: 50,
            attackBoost: 0, critChanceBoost: 0, statusEffects: [], deck: [], hand: [], discardPile: [],
            canPlayCard: true, isStunned: false,
            healthBarFill: null, chakraBarFill: null, defenseBarFill: null,
            healthBarText: null, chakraBarText: null, defenseBarText: null,
            healthFeedback: null, chakraFeedback: null, defenseFeedback: null,
            statusEffectsDisplay: null, tempStatsDisplay: null, handElement: null,
            sideElement: null
        },
        opponent: {
            health: 500, maxHealth: 500, chakra: 50, maxChakra: 380, defense: 0, maxDefense: 50,
            attackBoost: 0, critChanceBoost: 0, statusEffects: [], deck: [], hand: [], discardPile: [],
            canPlayCard: true, isStunned: false,
            healthBarFill: null, chakraBarFill: null, defenseBarFill: null,
            healthBarText: null, chakraBarText: null, defenseBarText: null,
            healthFeedback: null, chakraFeedback: null, defenseFeedback: null,
            statusEffectsDisplay: null, tempStatsDisplay: null, handElement: null,
            sideElement: null
        }
    };

    // --- Elementos da UI ---
    function cacheUIElements() {
        ["player", "opponent"].forEach(key => {
            const t = battleState[key];
            t.healthBarFill = document.getElementById(`${key}-health-bar-fill`);
            t.chakraBarFill = document.getElementById(`${key}-chakra-bar-fill`);
            t.defenseBarFill = document.getElementById(`${key}-defense-bar-fill`);
            t.healthBarText = createBarTextElement(t.healthBarFill);
            t.chakraBarText = createBarTextElement(t.chakraBarFill);
            t.defenseBarText = createBarTextElement(t.defenseBarFill);
            t.healthFeedback = document.getElementById(`${key}-health-feedback`);
            t.chakraFeedback = document.getElementById(`${key}-chakra-feedback`);
            t.defenseFeedback = document.getElementById(`${key}-defense-feedback`);
            t.statusEffectsDisplay = document.getElementById(`${key}-status-effects`);
            t.tempStatsDisplay = document.getElementById(`${key}-temp-stats`);
            t.handElement = document.getElementById(`${key}-hand`);
            t.sideElement = document.getElementById(`${key}-status-side`);
        });
    }
    cacheUIElements();

    function createBarTextElement(barFillElement) {
        const textElement = document.createElement("div");
        textElement.classList.add("bar-text");
        textElement.textContent = "0";
        barFillElement.appendChild(textElement);
        return textElement;
    }

    const turnCounterDisplay = document.getElementById("turn-counter");
    const phaseLabel = document.getElementById("phase-label");
    const messageLogElement = document.getElementById("message-log");
    const endTurnButton = document.getElementById("end-turn-button");
    const restartBattleButton = document.getElementById("restart-battle-button");
    const soundToggleBtn = document.getElementById("sound-toggle");
    const turnBanner = document.getElementById("turn-banner");
    const screenFlash = document.getElementById("screen-flash");
    const opponentNameDisplay = document.getElementById("opponent-name-display");
    const playerDeckCount = document.getElementById("player-deck-count");
    const playerDiscardCount = document.getElementById("player-discard-count");
    const opponentDeckCount = document.getElementById("opponent-deck-count");
    const opponentDiscardCount = document.getElementById("opponent-discard-count");

    const battleResultsScreen = document.getElementById("battle-results-screen");
    const rivalNameDisplay = document.getElementById("rival-name-display");
    const battleResultTitle = document.getElementById("battle-result-title");
    const resultTrophies = document.getElementById("result-trophies");
    const resultCoins = document.getElementById("result-coins");
    const resultTime = document.getElementById("result-time");
    const resultStars = document.getElementById("result-stars");
    const closeResultsButton = document.getElementById("close-results-button");
    const nextLevelButton = document.getElementById("next-level-button");

    // --- Botão de Som ---
    if (soundToggleBtn) {
        soundToggleBtn.addEventListener("click", () => {
            gameAudio.init();
            const enabled = gameAudio.toggle();
            soundToggleBtn.textContent = enabled ? "🔊" : "🔇";
        });
    }

    // Inicializa áudio no primeiro clique (requisito dos navegadores)
    document.addEventListener("click", () => {
        gameAudio.init();
        gameAudio.resume();
    }, { once: true });

    // --- Scroll da mão ---
    function initializeHandScrolling() {
        document.querySelectorAll(".scroll-arrow").forEach(arrow => {
            arrow.addEventListener("click", () => {
                const handArea = document.getElementById(arrow.dataset.target);
                if (!handArea) return;
                const cardEl = handArea.querySelector(".card");
                const cardWidth = cardEl ? cardEl.getBoundingClientRect().width : 72;
                const gap = parseFloat(getComputedStyle(handArea).gap) || 6;
                const amount = (cardWidth + gap) * 2;
                handArea.scrollBy({ left: arrow.classList.contains("left-arrow") ? -amount : amount, behavior: "smooth" });
            });
        });
    }
    initializeHandScrolling();

    // --- Chakra regeneração ---
    function startChakraRegeneration() {
        setInterval(() => {
            if (battleState.gamePhase === "game_over" || battleState.gamePhase === "results_screen") return;
            ["player", "opponent"].forEach(key => {
                const t = battleState[key];
                if (t.chakra < t.maxChakra) {
                    t.chakra = Math.min(t.chakra + 5, t.maxChakra);
                }
            });
            updatePlayerStatsUI();
            updateOpponentStatsUI();
        }, 3000);
    }
    startChakraRegeneration();

    // --- Funções Auxiliares ---
    function logMessage(message, cssClass = "") {
        console.log(message);
        const el = document.createElement("p");
        el.textContent = message;
        if (cssClass) el.classList.add(cssClass);
        if (messageLogElement.children.length > 0 && messageLogElement.firstChild.tagName === "P") {
            messageLogElement.insertBefore(el, messageLogElement.children[0]);
        } else {
            messageLogElement.appendChild(el);
        }
        while (messageLogElement.children.length > 50) {
            messageLogElement.removeChild(messageLogElement.lastChild);
        }
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function createCardInstance(cardId) {
        const d = cardDatabase[cardId];
        if (!d) return null;
        return new Card(cardId, d.name, d.type, d.cost, d.description, d.image,
            d.attack, d.defenseBuff, d.effect, d.duration, d.critChance,
            d.effectValue, d.defensePercent, d.summonDotDamage, d.element);
    }

    // --- Efeitos Visuais ---
    function showTurnBanner(text, duration = 1200) {
        if (!turnBanner) return;
        turnBanner.textContent = text;
        turnBanner.classList.remove("hidden");
        // força reflow
        void turnBanner.offsetWidth;
        turnBanner.classList.add("show");
        setTimeout(() => {
            turnBanner.classList.remove("show");
            setTimeout(() => turnBanner.classList.add("hidden"), 300);
        }, duration);
    }

    function showScreenFlash(type, duration = 300) {
        if (!screenFlash) return;
        screenFlash.className = `screen-flash flash-${type}`;
        setTimeout(() => { screenFlash.className = "screen-flash"; }, duration);
    }

    function animateAttack(attackerKey) {
        const attacker = battleState[attackerKey];
        if (!attacker.sideElement) return;
        attacker.sideElement.classList.remove("attacking");
        void attacker.sideElement.offsetWidth;
        attacker.sideElement.classList.add("attacking");
        setTimeout(() => attacker.sideElement.classList.remove("attacking"), 400);
    }

    function animateDamage(targetKey, isCrit = false) {
        const target = battleState[targetKey];
        if (!target.sideElement) return;
        const cls = isCrit ? "shake-crit" : "shake-damage";
        target.sideElement.classList.remove("shake-damage", "shake-crit", "hit-flash", "crit-flash");
        void target.sideElement.offsetWidth;
        target.sideElement.classList.add(cls, isCrit ? "crit-flash" : "hit-flash");
        setTimeout(() => target.sideElement.classList.remove(cls, "hit-flash", "crit-flash"), 600);
    }

    function animateDotDamage(targetKey) {
        const target = battleState[targetKey];
        if (!target.sideElement) return;
        target.sideElement.classList.remove("shake-dot");
        void target.sideElement.offsetWidth;
        target.sideElement.classList.add("shake-dot");
        setTimeout(() => target.sideElement.classList.remove("shake-dot"), 300);
    }

    function animateHeal(targetKey) {
        const target = battleState[targetKey];
        if (!target.sideElement) return;
        target.sideElement.classList.remove("heal-flash");
        void target.sideElement.offsetWidth;
        target.sideElement.classList.add("heal-flash");
        setTimeout(() => target.sideElement.classList.remove("heal-flash"), 600);
    }

    function animateChakra(targetKey) {
        const target = battleState[targetKey];
        if (!target.sideElement) return;
        target.sideElement.classList.remove("chakra-flash");
        void target.sideElement.offsetWidth;
        target.sideElement.classList.add("chakra-flash");
        setTimeout(() => target.sideElement.classList.remove("chakra-flash"), 500);
    }

    function animateStatusPulse(targetKey) {
        const target = battleState[targetKey];
        if (!target.sideElement) return;
        target.sideElement.classList.remove("status-active");
        void target.sideElement.offsetWidth;
        target.sideElement.classList.add("status-active");
        setTimeout(() => target.sideElement.classList.remove("status-active"), 700);
    }

    function triggerBarShadow(barFillElement) {
        const barContainer = barFillElement.parentElement;
        if (!barContainer) return;
        barContainer.classList.remove("active-shadow");
        void barContainer.offsetWidth;
        barContainer.classList.add("active-shadow");
        setTimeout(() => barContainer.classList.remove("active-shadow"), 2000);
    }

    function showFloatingNumber(value, type, feedbackElement) {
        if (!feedbackElement) return;
        const numberElement = document.createElement("div");
        numberElement.classList.add("floating-number", type);
        numberElement.textContent = (value > 0 && (type === "heal" || type === "chakra-gained" || type === "defense-gained")) ? `+${value}` : `${value}`;
        feedbackElement.appendChild(numberElement);
        setTimeout(() => numberElement.remove(), 3600);
    }

    // --- Funções de Áudio (atalhos) ---
    function sfx(name) {
        if (!gameAudio.initialized) return;
        const map = {
            hit: () => gameAudio.playHit(),
            crit: () => gameAudio.playCrit(),
            heal: () => gameAudio.playHeal(),
            shield: () => gameAudio.playShield(),
            card: () => gameAudio.playCard(),
            error: () => gameAudio.playError(),
            draw: () => gameAudio.playDraw(),
            turn: () => gameAudio.playTurnStart(),
            stun: () => gameAudio.playStun(),
            burn: () => gameAudio.playBurn(),
            poison: () => gameAudio.playPoison(),
            chakra: () => gameAudio.playChakra(),
            victory: () => gameAudio.playVictory(),
            defeat: () => gameAudio.playDefeat(),
            summon: () => gameAudio.playSummon(),
            discard: () => gameAudio.playDiscard()
        };
        if (map[name]) map[name]();
    }

    // --- Atualização da UI ---
    function updateTargetStatsUI(targetKey) {
        const target = battleState[targetKey];

        const oldHP = parseFloat(target.healthBarFill.style.width) || 0;
        const newHP = target.maxHealth > 0 ? Math.max(0, (target.health / target.maxHealth) * 100) : 0;
        if (Math.abs(oldHP - newHP) > 0.01) triggerBarShadow(target.healthBarFill);
        target.healthBarFill.style.width = `${newHP}%`;
        if (target.healthBarText) target.healthBarText.textContent = `${Math.max(0, target.health)} / ${target.maxHealth}`;

        const oldCh = parseFloat(target.chakraBarFill.style.width) || 0;
        const newCh = target.maxChakra > 0 ? Math.max(0, (target.chakra / target.maxChakra) * 100) : 0;
        if (Math.abs(oldCh - newCh) > 0.01) triggerBarShadow(target.chakraBarFill);
        target.chakraBarFill.style.width = `${newCh}%`;
        if (target.chakraBarText) target.chakraBarText.textContent = `${target.chakra} / ${target.maxChakra}`;

        const oldDef = parseFloat(target.defenseBarFill.style.width) || 0;
        const newDef = target.maxDefense > 0 ? Math.max(0, (target.defense / target.maxDefense) * 100) : 0;
        if (Math.abs(oldDef - newDef) > 0.01) triggerBarShadow(target.defenseBarFill);
        target.defenseBarFill.style.width = `${newDef}%`;
        if (target.defenseBarText) target.defenseBarText.textContent = `${target.defense} / ${target.maxDefense}`;

        updateStatusEffectsUI(target, target.statusEffectsDisplay);
        updateTempStatsUI(target, target.tempStatsDisplay);
    }

    function updatePlayerStatsUI() { updateTargetStatsUI("player"); }
    function updateOpponentStatsUI() { updateTargetStatsUI("opponent"); }

    function updateStatusEffectsUI(target, displayElement) {
        displayElement.innerHTML = "";
        target.statusEffects.forEach(effect => {
            const el = document.createElement("span");
            el.classList.add("status-effect-icon", `effect-${effect.type}`);
            let text = effect.name ? effect.name.substring(0, 3).toUpperCase() : "EFF";
            if (effect.type === "buff" || effect.type === "buff_taijutsu_atk") text = "BUF";
            if (effect.type === "debuff") text = "DEB";
            if (["dot", "burn", "poison", "summon_dot"].includes(effect.type)) text = "DoT";
            if (effect.type === "hot") text = "HoT";
            if (effect.type === "stun") text = "STN";
            if (effect.type === "defense_percent") text = "D%";
            el.textContent = `${text}(${effect.duration})`;
            el.title = `${effect.name}: ${effect.description || ""} (${effect.duration}t)`;
            displayElement.appendChild(el);
        });
    }

    function updateTempStatsUI(target, displayElement) {
        displayElement.innerHTML = "";
        let stats = "";
        if (target.attackBoost !== 0) stats += `<span>Atk Boost: ${target.attackBoost > 0 ? "+" : ""}${target.attackBoost}</span>`;
        if (target.critChanceBoost !== 0) stats += `<span>Crit Boost: +${Math.round(target.critChanceBoost * 100)}%</span>`;
        displayElement.innerHTML = stats;
    }

    function updateDeckInfo() {
        if (playerDeckCount) playerDeckCount.textContent = `Deck: ${battleState.player.deck.length}`;
        if (playerDiscardCount) playerDiscardCount.textContent = `Descarte: ${battleState.player.discardPile.length}`;
        if (opponentDeckCount) opponentDeckCount.textContent = `Deck: ${battleState.opponent.deck.length}`;
        if (opponentDiscardCount) opponentDiscardCount.textContent = `Descarte: ${battleState.opponent.discardPile.length}`;
    }

    function updateHandUI(playerType) {
        const target = battleState[playerType];
        target.handElement.innerHTML = "";
        if (target.hand.length === 0) {
            target.handElement.innerHTML = `<p>Mão Vazia</p>`;
            return;
        }
        target.hand.forEach((cardInstance, index) => {
            if (playerType === "player") {
                const cardElement = cardInstance.getHTMLElement();
                // Marca cartas que não podem ser jogadas
                if (battleState.player.chakra < cardInstance.cost || battleState.currentPlayer !== "player" || battleState.gamePhase !== "player_turn") {
                    cardElement.classList.add("unplayable");
                }
                cardElement.onclick = () => playCardFromHand(cardInstance.id, index);
                // Tooltip no hover
                cardElement.addEventListener("mouseenter", (e) => showCardTooltip(e, cardInstance));
                cardElement.addEventListener("mouseleave", hideCardTooltip);
                target.handElement.appendChild(cardElement);
            } else {
                const cardBackElement = document.createElement("div");
                cardBackElement.classList.add("card", "card-back");
                cardBackElement.textContent = "???";
                target.handElement.appendChild(cardBackElement);
            }
        });
    }

    // --- Tooltip simples para cartas no combate ---
    let combatTooltip = null;
    function showCardTooltip(event, card) {
        if (!combatTooltip) {
            combatTooltip = document.createElement("div");
            combatTooltip.className = "custom-tooltip";
            document.body.appendChild(combatTooltip);
        }
        let content = `<h4>${card.name}</h4><p class="tooltip-cost">Custo: ${card.cost} Chakra</p><p>${card.description}</p>`;
        if (card.element && card.element !== "Nenhum") content += `<p class="tooltip-element">Elemento: ${card.element}</p>`;
        combatTooltip.innerHTML = content;
        combatTooltip.classList.add("visible");
        positionTooltip(event);
        cardElementHover();
    }

    function cardElementHover() { /* placeholder para future */ }

    function hideCardTooltip() {
        if (combatTooltip) combatTooltip.classList.remove("visible");
    }

    function positionTooltip(event) {
        if (!combatTooltip || !combatTooltip.classList.contains("visible")) return;
        const PAD = 12;
        let x = event.pageX + PAD;
        let y = event.pageY + PAD;
        const rect = combatTooltip.getBoundingClientRect();
        if (x + rect.width > window.innerWidth - PAD) x = event.pageX - rect.width - PAD;
        if (y + rect.height > window.innerHeight - PAD) y = event.pageY - rect.height - PAD;
        combatTooltip.style.left = `${x}px`;
        combatTooltip.style.top = `${y}px`;
    }

    document.addEventListener("mousemove", (e) => {
        if (combatTooltip && combatTooltip.classList.contains("visible")) positionTooltip(e);
    });

    function updateTurnUI() {
        if (turnCounterDisplay) turnCounterDisplay.textContent = battleState.turn;
        if (phaseLabel) {
            if (battleState.currentPlayer === "player") {
                phaseLabel.textContent = "Sua Vez";
                phaseLabel.classList.remove("opponent-turn");
            } else {
                phaseLabel.textContent = "Vez do Oponente";
                phaseLabel.classList.add("opponent-turn");
            }
        }
    }

    function updateAllCombatUI() {
        updatePlayerStatsUI();
        updateOpponentStatsUI();
        updateHandUI("player");
        updateHandUI("opponent");
        updateTurnUI();
        updateDeckInfo();
    }

    // --- Deck ---
    function initializeDeck(targetType) {
        const target = battleState[targetType];
        target.deck = [];
        const allCardIds = Object.keys(cardDatabase);
        for (let i = 0; i < 20; i++) target.deck.push(allCardIds[Math.floor(Math.random() * allCardIds.length)]);
        shuffleArray(target.deck);
    }

    function drawCard(playerType, count = 1) {
        const target = battleState[playerType];
        for (let i = 0; i < count; i++) {
            if (target.deck.length > 0) {
                if (target.hand.length < 7) {
                    const cardId = target.deck.pop();
                    const cardInstance = createCardInstance(cardId);
                    if (cardInstance) {
                        target.hand.push(cardInstance);
                        logMessage(`${playerType === "player" ? "Jogador" : "Oponente"} comprou ${cardInstance.name}.`, "log-system");
                        sfx("draw");
                        // Animação de carta comprada
                        if (playerType === "player") {
                            setTimeout(() => {
                                const cards = target.handElement.querySelectorAll(".card");
                                if (cards.length > 0) cards[cards.length - 1].classList.add("drawn");
                            }, 10);
                        }
                    }
                } else {
                    logMessage(`${playerType === "player" ? "Jogador" : "Oponente"} não pode comprar (mão cheia).`);
                    target.deck.pop();
                }
            } else {
                // Embaralha descarte de volta
                if (target.discardPile.length > 0) {
                    target.deck = [...target.discardPile];
                    target.discardPile = [];
                    shuffleArray(target.deck);
                    logMessage(`${playerType === "player" ? "Jogador" : "Oponente"} embaralhou o descarte no deck.`, "log-system");
                    i--; // tenta de novo
                } else {
                    logMessage(`${playerType === "player" ? "Jogador" : "Oponente"} sem cartas no deck!`);
                }
            }
        }
        updateDeckInfo();
    }

    // --- Batalha ---
    function startBattle() {
        logMessage("Nova batalha iniciada!", "log-system");
        currentRivalName = rivalNames[Math.floor(Math.random() * rivalNames.length)];
        logMessage(`Seu oponente é: ${currentRivalName}`, "log-system");
        if (opponentNameDisplay) opponentNameDisplay.textContent = currentRivalName;
        const opponentAvatar = document.querySelector("#opponent-status-side .player-avatar");
        if (opponentAvatar) opponentAvatar.textContent = currentRivalName.substring(0, 3).toUpperCase();

        battleStartTime = Date.now();
        gameAudio.init();
        gameAudio.startMusic();

        battleState.turn = 1;
        battleState.currentPlayer = "player";
        battleState.gamePhase = "player_turn";
        battleResultsScreen.classList.remove("visible");
        battleResultsScreen.classList.add("battle-results-screen-hidden");

        ["player", "opponent"].forEach(type => {
            const t = battleState[type];
            t.health = t.maxHealth;
            t.chakra = t.maxChakra;
            t.defense = 0;
            t.attackBoost = 0;
            t.critChanceBoost = 0;
            t.statusEffects = [];
            t.hand = [];
            t.discardPile = [];
            t.isStunned = false;
            t.canPlayCard = true;
            initializeDeck(type);
            drawCard(type, 3);
        });

        showTurnBanner("SEU TURNO!");
        sfx("turn");
        logMessage("Turno do Jogador.", "log-system");
        endTurnButton.disabled = false;
        updateAllCombatUI();
    }

    function showResultsScreen(playerWon) {
        battleState.gamePhase = "results_screen";
        gameAudio.stopMusic();
        const durationMs = Date.now() - battleStartTime;
        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        resultTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        rivalNameDisplay.textContent = `Rival: ${currentRivalName}`;

        if (playerWon) {
            battleResultTitle.textContent = "Vitória!";
            sfx("victory");
            showScreenFlash("victory", 800);
            showTurnBanner("VITÓRIA!", 2000);
            resultTrophies.textContent = "+25"; resultCoins.textContent = "+100"; resultStars.textContent = "★★★";
            nextLevelButton.style.display = "inline-block";
            closeResultsButton.textContent = "Menu Principal";
        } else {
            battleResultTitle.textContent = "Derrota!";
            sfx("defeat");
            showScreenFlash("defeat", 800);
            showTurnBanner("DERROTA...", 2000);
            resultTrophies.textContent = "-10"; resultCoins.textContent = "+10"; resultStars.textContent = "☆☆☆";
            nextLevelButton.style.display = "none";
            closeResultsButton.textContent = "Tentar Novamente";
        }
        battleResultsScreen.classList.remove("battle-results-screen-hidden");
        battleResultsScreen.classList.add("visible");
    }

    function playCardFromHand(cardId, handIndex) {
        const player = battleState.player;
        if (battleState.currentPlayer !== "player" || battleState.gamePhase !== "player_turn" || !player.canPlayCard) {
            logMessage("Não é seu turno ou você não pode jogar cartas agora.");
            sfx("error");
            return;
        }
        const cardInstance = player.hand[handIndex];
        if (!cardInstance || cardInstance.id !== cardId) {
            logMessage("Carta inválida.");
            sfx("error");
            return;
        }
        if (player.chakra < cardInstance.cost) {
            logMessage(`Chakra insuficiente para ${cardInstance.name}.`);
            sfx("error");
            return;
        }

        // Animação de carta saindo da mão
        const cardEls = player.handElement.querySelectorAll(".card");
        if (cardEls[handIndex]) cardEls[handIndex].classList.add("playing");

        const chakraSpent = cardInstance.cost;
        player.chakra -= chakraSpent;
        if (chakraSpent > 0) showFloatingNumber(-chakraSpent, "chakra-spent", player.chakraFeedback);
        sfx("card");

        player.hand.splice(handIndex, 1);
        player.discardPile.push(cardInstance.id);
        logMessage(`Jogador usou ${cardInstance.name}.`, "log-system");
        if (gameAudio.initialized) gameAudio.playCardEffect({ type: cardInstance.type, element: cardInstance.element, effect: cardInstance.effect, defenseBuff: cardInstance.defenseBuff });
        applyCardEffect(cardInstance, "player", "opponent");
        updateAllCombatUI();
        checkWinCondition();
    }

    function applyCardEffect(card, casterKey, targetKey) {
        const caster = battleState[casterKey];
        const target = battleState[targetKey];

        // Animação de ataque se causar dano
        if (card.attack > 0) {
            animateAttack(casterKey);
            setTimeout(() => sfx("hit"), 100);
        }

        // Defesa direta da carta
        if (card.defenseBuff > 0) {
            const oldDef = caster.defense;
            caster.defense = Math.min(caster.maxDefense, caster.defense + card.defenseBuff);
            const gained = caster.defense - oldDef;
            if (gained > 0) {
                showFloatingNumber(gained, "defense-gained", caster.defenseFeedback);
                sfx("shield");
                animateHeal(casterKey); // flash visual de ganho
            }
            logMessage(`${capitalize(casterKey)} ganhou ${gained} de defesa com ${card.name}.`, "log-status");
        }

        // Dano da carta
        if (card.attack > 0) {
            let totalDamage = card.attack + caster.attackBoost;
            let isCrit = false;
            if (Math.random() < (card.critChance + caster.critChanceBoost)) {
                totalDamage = Math.round(totalDamage * 1.5);
                isCrit = true;
                logMessage("★ ACERTO CRÍTICO! ★", "log-critical");
                sfx("crit");
            }
            totalDamage = Math.round(totalDamage);

            // Redução de dano percentual do alvo
            let effectiveDR = 0;
            target.statusEffects.forEach(eff => {
                if (eff.type === "defense_percent" && eff.duration > 0) effectiveDR += eff.value;
            });
            caster.statusEffects.forEach(eff => {
                if (eff.type === "reduce_attack_percent" && eff.duration > 0) effectiveDR += eff.value;
            });
            totalDamage = Math.round(totalDamage * (1 - effectiveDR));
            if (totalDamage < 0) totalDamage = 0;

            // Vantagem elemental
            const elemResult = getElementMultiplier(card.element, null);
            if (elemResult.mult !== 1) {
                totalDamage = Math.round(totalDamage * elemResult.mult);
                if (elemResult.label) logMessage(elemResult.label, elemResult.mult > 1 ? "log-critical" : "log-damage");
            }

            logMessage(`${card.name} causa ${totalDamage} de dano!`, "log-damage");

            // Dano à defesa primeiro
            const toShield = Math.min(totalDamage, target.defense);
            if (toShield > 0) {
                target.defense -= toShield;
                showFloatingNumber(-toShield, "defense-lost", target.defenseFeedback);
                logMessage(`${toShield} absorvido pela defesa de ${capitalize(targetKey)}.`, "log-status");
                setTimeout(() => sfx("shield"), 150);
            }

            // Dano restante à vida
            const toHealth = totalDamage - toShield;
            if (toHealth > 0) {
                target.health -= toHealth;
                const delay = toShield > 0 ? 200 : 50;
                setTimeout(() => {
                    showFloatingNumber(-toHealth, isCrit ? "crit" : "damage", target.healthFeedback);
                    animateDamage(targetKey, isCrit);
                    if (isCrit) showScreenFlash("crit", 400);
                }, delay);
            } else if (toShield > 0) {
                // Todo o dano absorvido
                animateDamage(targetKey, false);
            }
        }

        // Outros efeitos
        switch (card.effect) {
            case "draw_card":
                drawCard(casterKey, card.effectValue || 1);
                break;
            case "heal": {
                const healAmount = card.effectValue || 0;
                const oldH = caster.health;
                caster.health = Math.min(caster.maxHealth, caster.health + healAmount);
                const actualHeal = caster.health - oldH;
                if (actualHeal > 0) {
                    showFloatingNumber(actualHeal, "heal", caster.healthFeedback);
                    animateHeal(casterKey);
                    sfx("heal");
                }
                logMessage(`${capitalize(casterKey)} recuperou ${actualHeal} de vida.`, "log-heal");
                break;
            }
            case "recover_chakra": {
                const amount = card.effectValue || 0;
                const oldCh = caster.chakra;
                caster.chakra = Math.min(caster.maxChakra, caster.chakra + amount);
                const actualGain = caster.chakra - oldCh;
                if (actualGain > 0) {
                    showFloatingNumber(actualGain, "chakra-gained", caster.chakraFeedback);
                    animateChakra(casterKey);
                    sfx("chakra");
                }
                logMessage(`${capitalize(casterKey)} recuperou ${actualGain} de chakra.`, "log-status");
                break;
            }
            case "apply_defense_percent_buff":
                addStatusEffect(casterKey, {
                    id: `def_pct_${Date.now()}`,
                    name: card.name, type: "defense_percent",
                    description: `+${Math.round(card.defensePercent * 100)}% Redução de Dano`,
                    value: card.defensePercent, duration: card.duration, sourceCardId: card.id
                });
                sfx("shield");
                logMessage(`${capitalize(casterKey)} ativou ${card.name} (+${Math.round(card.defensePercent * 100)}% Red. Dano, ${card.duration}t).`, "log-status");
                break;
            case "reduce_opponent_defense_percent":
                addStatusEffect(targetKey, {
                    id: `red_def_pct_${Date.now()}`,
                    name: card.name, type: "defense_percent",
                    description: `-${Math.round(card.effectValue * 100)}% Redução de Dano (recebe mais dano)`,
                    value: -card.effectValue, duration: card.duration, sourceCardId: card.id
                });
                sfx("poison");
                logMessage(`${capitalize(targetKey)} foi afetado por ${card.name}!`, "log-damage");
                break;
            case "burn":
                addStatusEffect(targetKey, {
                    id: `burn_${Date.now()}`, name: card.name, type: "burn",
                    description: card.description, value: card.effectValue || 0,
                    duration: card.duration, sourceCardId: card.id
                });
                sfx("burn");
                logMessage(`${capitalize(targetKey)} foi queimado por ${card.name}!`, "log-damage");
                break;
            case "summon_dot":
                addStatusEffect(targetKey, {
                    id: `summon_${Date.now()}`, name: card.name, type: "summon_dot",
                    description: card.description, value: card.summonDotDamage || 0,
                    duration: card.duration, sourceCardId: card.id
                });
                sfx("summon");
                logMessage(`${card.name} invocada! Dano contínuo em ${capitalize(targetKey)}.`, "log-damage");
                break;
            case "stun":
                addStatusEffect(targetKey, {
                    id: `stun_${Date.now()}`, name: card.name, type: "stun",
                    description: "Atordoado - não pode jogar", value: 0,
                    duration: card.duration, sourceCardId: card.id
                });
                sfx("stun");
                logMessage(`${capitalize(targetKey)} foi ATORDOADO!`, "log-critical");
                break;
            case "buff_next_taijutsu":
                addStatusEffect(casterKey, {
                    id: `buff_tai_${Date.now()}`, name: card.name, type: "buff_taijutsu_atk",
                    description: `+${card.effectValue} Atk para próximo Taijutsu`,
                    value: card.effectValue, duration: card.duration || 99, sourceCardId: card.id
                });
                logMessage(`${capitalize(casterKey)} ativou ${card.name}.`, "log-status");
                break;
        }

        // Consumir buff de taijutsu se a carta atual for Taijutsu
        if (card.type === "Taijutsu") {
            const idx = caster.statusEffects.findIndex(e => e.type === "buff_taijutsu_atk" && e.duration > 0);
            if (idx !== -1) {
                const buff = caster.statusEffects[idx];
                logMessage(`${capitalize(casterKey)} consumiu ${buff.name} para ${card.name}!`, "log-critical");
                sfx("crit");
                caster.attackBoost -= buff.value;
                caster.statusEffects.splice(idx, 1);
            }
        }
    }

    function addStatusEffect(targetKey, effectData) {
        const target = battleState[targetKey];
        target.statusEffects.push(effectData);
        logMessage(`${capitalize(targetKey)} recebeu efeito: ${effectData.name || effectData.type}.`, "log-status");
        animateStatusPulse(targetKey);
        if (effectData.type === "buff_taijutsu_atk") {
            target.attackBoost += effectData.value;
        }
    }

    function applyStatusEffectsAtTurnStart(entityKey) {
        const entity = battleState[entityKey];
        let hasActiveEffects = false;

        entity.statusEffects = entity.statusEffects.filter(effect => {
            if (effect.duration <= 0) return false;

            switch (effect.type) {
                case "burn":
                case "poison":
                case "summon_dot": {
                    const dotDmg = effect.value || 0;
                    if (dotDmg > 0) {
                        entity.health -= dotDmg;
                        hasActiveEffects = true;
                        setTimeout(() => {
                            showFloatingNumber(-dotDmg, "damage", entity.healthFeedback);
                            animateDotDamage(entityKey);
                        }, 100);
                        logMessage(`${capitalize(entityKey)} sofreu ${dotDmg} de dano de ${effect.name}.`, "log-damage");
                        if (effect.type === "burn") sfx("burn");
                        else if (effect.type === "poison") sfx("poison");
                        else sfx("hit");
                    }
                    break;
                }
                case "hot": {
                    const hotHeal = effect.value || 0;
                    if (hotHeal > 0) {
                        const oldH = entity.health;
                        entity.health = Math.min(entity.maxHealth, entity.health + hotHeal);
                        const actual = entity.health - oldH;
                        if (actual > 0) {
                            hasActiveEffects = true;
                            setTimeout(() => {
                                showFloatingNumber(actual, "heal", entity.healthFeedback);
                                animateHeal(entityKey);
                            }, 100);
                            logMessage(`${capitalize(entityKey)} recuperou ${actual} de vida de ${effect.name}.`, "log-heal");
                            sfx("heal");
                        }
                    }
                    break;
                }
                case "stun":
                    entity.isStunned = true;
                    hasActiveEffects = true;
                    logMessage(`${capitalize(entityKey)} está ATORDOADO!`, "log-critical");
                    break;
            }
            effect.duration--;
            return effect.duration > 0;
        });

        if (hasActiveEffects) animateStatusPulse(entityKey);
    }

    function checkWinCondition() {
        if (battleState.player.health <= 0) {
            logMessage("Jogador foi derrotado!", "log-damage");
            battleState.gamePhase = "game_over";
            endTurnButton.disabled = true;
            setTimeout(() => showResultsScreen(false), 500);
            return true;
        }
        if (battleState.opponent.health <= 0) {
            logMessage("Oponente foi derrotado!", "log-critical");
            battleState.gamePhase = "game_over";
            endTurnButton.disabled = true;
            setTimeout(() => showResultsScreen(true), 500);
            return true;
        }
        return false;
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function endTurn() {
        if (battleState.gamePhase === "game_over") return;
        logMessage(`Fim do turno de ${battleState.currentPlayer === "player" ? "Jogador" : "Oponente"}.`, "log-system");

        if (battleState.currentPlayer === "player") {
            battleState.currentPlayer = "opponent";
            logMessage("Turno do Oponente.", "log-system");
            showTurnBanner("TURNO DO OPONENTE", 1000);
            applyStatusEffectsAtTurnStart("opponent");
            if (checkWinCondition()) return;
            updateAllCombatUI();
            endTurnButton.disabled = true;
            setTimeout(opponentTurnLogic, 1200);
        } else {
            battleState.currentPlayer = "player";
            logMessage("Turno do Jogador.", "log-system");
            showTurnBanner("SEU TURNO!", 1000);
            sfx("turn");
            applyStatusEffectsAtTurnStart("player");
            if (checkWinCondition()) return;
            drawCard("player", 1);
            battleState.player.canPlayCard = true;
            battleState.player.isStunned = false;
            battleState.turn++;
            updateAllCombatUI();
            endTurnButton.disabled = false;
        }
    }

    // --- IA do Oponente (melhorada) ---
    function opponentTurnLogic() {
        if (battleState.gamePhase === "game_over") return;

        if (battleState.opponent.isStunned) {
            logMessage("Oponente está atordoado e não pode jogar!", "log-critical");
            sfx("stun");
            setTimeout(() => endTurn(), 800);
            return;
        }

        logMessage("Oponente está pensando...", "log-system");
        const opponent = battleState.opponent;

        // IA estratégica: prioriza cartas por situação
        const playableCards = opponent.hand
            .map((card, idx) => ({ card, idx }))
            .filter(({ card }) => opponent.chakra >= card.cost);

        if (playableCards.length === 0) {
            logMessage("Oponente não pode jogar nenhuma carta.");
            setTimeout(() => endTurn(), 800);
            return;
        }

        // Prioriza: cura se vida baixa, ataque se pode matar, senão maior dano
        const hpPercent = opponent.health / opponent.maxHealth;
        let chosen = null;

        // Se vida baixa e tem cura, cura
        if (hpPercent < 0.35) {
            chosen = playableCards.find(({ card }) => card.effect === "heal");
        }
        // Se pode matar com ataque, ataca
        if (!chosen) {
            chosen = playableCards.find(({ card }) =>
                card.attack > 0 && card.attack >= battleState.player.health);
        }
        // Se oponente tem defesa alta, prefere ignora-defesa ou debuff
        if (!chosen && battleState.player.defense > 20) {
            chosen = playableCards.find(({ card }) =>
                card.type === "Debuff" || card.effect === "ignore_defense");
        }
        // Senão, joga a carta de maior dano/custo que pode pagar
        if (!chosen) {
            chosen = playableCards.reduce((best, current) => {
                const bestVal = (best.card.attack || 0) + (best.card.effectValue || 0) + best.card.cost;
                const curVal = (current.card.attack || 0) + (current.card.effectValue || 0) + current.card.cost;
                return curVal > bestVal ? current : best;
            });
        }

        if (chosen) {
            const { card, idx } = chosen;
            opponent.chakra -= card.cost;
            if (card.cost > 0) showFloatingNumber(-card.cost, "chakra-spent", opponent.chakraFeedback);
            opponent.hand.splice(idx, 1);
            opponent.discardPile.push(card.id);
            logMessage(`Oponente usou ${card.name}!`, "log-damage");
            if (gameAudio.initialized) gameAudio.playCardEffect({ type: card.type, element: card.element, effect: card.effect, defenseBuff: card.defenseBuff });
            applyCardEffect(card, "opponent", "player");
        }

        updateAllCombatUI();
        if (checkWinCondition()) return;
        setTimeout(endTurn, 1500);
    }

    // --- Event Listeners ---
    endTurnButton.addEventListener("click", () => {
        if (battleState.currentPlayer === "player" && battleState.gamePhase === "player_turn") {
            endTurnButton.disabled = true;
            endTurn();
        }
    });

    restartBattleButton.addEventListener("click", startBattle);
    closeResultsButton.addEventListener("click", () => {
        if (battleResultTitle.textContent === "Vitória!") {
            logMessage("Retornando ao menu principal.", "log-system");
            battleResultsScreen.classList.remove("visible");
            battleResultsScreen.classList.add("battle-results-screen-hidden");
        } else {
            startBattle();
        }
    });
    nextLevelButton.addEventListener("click", () => {
        logMessage("Iniciando próximo nível!", "log-system");
        startBattle();
    });

    // --- Início ---
    startBattle();
});

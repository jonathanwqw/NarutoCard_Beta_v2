// Naruto Pixel Card Game - Módulo de Combate v4
// Combos elementais, fusão de jutsus, IA agressiva e combate aprofundado

document.addEventListener("DOMContentLoaded", () => {
    console.log("Módulo de Combate - Naruto Pixel Card Game v4 iniciado!");

    let battleStartTime = 0;
    let comboChargeActive = false;

    const rivalNames = [
        "Sasuke Uchiha", "Gaara", "Neji Hyuga", "Rock Lee", "Orochimaru",
        "Kabuto Yakushi", "Kimimaro", "Zabuza Momochi", "Haku", "Itachi Uchiha",
        "Kisame Hoshigaki", "Deidara", "Sasori", "Pain (Tendo)", "Konan"
    ];
    let currentRivalName = "Oponente Desconhecido";

    // Elemento temático de cada rival (usado para vantagem/desvantagem elemental)
    const rivalElements = {
        "Sasuke Uchiha": "Raio", "Gaara": "Terra", "Neji Hyuga": "Vento", "Rock Lee": "Nenhum",
        "Orochimaru": "Terra", "Kabuto Yakushi": "Nenhum", "Kimimaro": "Terra", "Zabuza Momochi": "Água",
        "Haku": "Água", "Itachi Uchiha": "Fogo", "Kisame Hoshigaki": "Água", "Deidara": "Terra",
        "Sasori": "Nenhum", "Pain (Tendo)": "Vento", "Konan": "Vento"
    };

    // --- Sistema de Elementos ---
    const elementChart = {
        "Fogo":   { strong: "Vento",  weak: "Água" },
        "Água":   { strong: "Fogo",   weak: "Terra" },
        "Vento":  { strong: "Terra",  weak: "Raio"  },
        "Terra":  { strong: "Raio",   weak: "Vento" },
        "Raio":   { strong: "Água",   weak: "Terra" },
        "Nenhum": { strong: null,     weak: null    }
    };

    // Combos elementais: jutsus do mesmo elemento em sequência
    const ELEMENT_COLORS = {
        "Fogo": "#e67e22", "Água": "#3498db", "Vento": "#1abc9c",
        "Terra": "#8e6e53", "Raio": "#f1c40f", "Nenhum": "#95a5a6"
    };

    // Fusões disponíveis: 2 cartas + chakra extra = jutsu poderoso
    const fusionRecipes = [
        { req: ["jutsu001", "jutsu001"], name: "Rasengan Gigante", cost: 50, attack: 90, effect: "aoe_bonus", element: "Vento",
          desc: "Fusão de 2 Rasengan: 90 de dano massivo." },
        { req: ["jutsu002", "jutsu001"], name: "Rasenshuriken", cost: 65, attack: 110, effect: "ignore_defense", element: "Vento",
          desc: "Chidori + Rasengan: 110 de dano, ignora defesa." },
        { req: ["jutsu004", "jutsu004"], name: "Grande Bola de Fogo", cost: 45, attack: 80, effect: "burn", effectValue: 20, duration: 2, element: "Fogo",
          desc: "2 Bolas de Fogo: 80 de dano + queimadura 20/turno." },
        { req: ["jutsu002", "jutsu002"], name: "Chidori Nagashi Bolts", cost: 55, attack: 95, effect: "stun", duration: 1, element: "Raio",
          desc: "2 Chidori: 95 de dano + atordoa 1 turno." },
        { req: ["jutsu005", "jutsu004"], name: "Vapor Escaldante", cost: 60, attack: 100, effect: "burn", effectValue: 25, duration: 2, element: "Água",
          desc: "Água + Fogo: 100 de dano + queimadura vapor." },
        { req: ["taijutsu001", "taijutsu002"], name: "Combo Múltiplo", cost: 30, attack: 60, effect: "multi_hit", hits: 3, element: "Nenhum",
          desc: "Golpes rápidos: 60 dividido em 3 acertos." },
        { req: ["jutsu012", "jutsu012"], name: "Bênção Médica", cost: 40, effect: "heal", effectValue: 100, element: "Nenhum",
          desc: "2 Jutsus Médicos: recupera 100 de vida." },
    ];

    function findFusion(idA, idB) {
        return fusionRecipes.find(r =>
            (r.req[0] === idA && r.req[1] === idB) || (r.req[0] === idB && r.req[1] === idA));
    }

    function getElementMultiplier(attackerElement, defenderElement) {
        if (!attackerElement || attackerElement === "Nenhum") return { mult: 1, label: "" };
        const chart = elementChart[attackerElement];
        if (!chart) return { mult: 1, label: "" };
        if (chart.strong === defenderElement) return { mult: 1.3, label: "⚡ VANTAGEM ELEMENTAL!" };
        if (chart.weak === defenderElement) return { mult: 0.7, label: " desvantagem elemental..." };
        return { mult: 1, label: "" };
    }

    // --- Estrutura das Cartas ---
    class Card {
        constructor(id, name, type, cost, description, image, attack = 0, defenseBuff = 0, effect = null, duration = 0, critChance = 0, effectValue = 0, defensePercent = 0, summonDotDamage = 0, element = "Nenhum", hits = 1, isFusion = false) {
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
            this.hits = hits;
            this.isFusion = isFusion;
            this.level = 1;
            this.xp = 0;
        }

        getHTMLElement() {
            const cardElement = document.createElement("div");
            cardElement.classList.add("card");
            cardElement.classList.add(`type-${this.type.toLowerCase()}`);
            if (this.isFusion) cardElement.classList.add("card-fusion");
            cardElement.dataset.cardId = this.id;

            const typeIcons = {
                "Jutsu": "🌀", "Taijutsu": "👊", "Defesa": "🛡️", "Item": "📦",
                "Buff": "⬆️", "Debuff": "⬇️", "Invocação": "🐸", "Modo": "⚡"
            };
            const elementIcons = {
                "Fogo": "🔥", "Água": "💧", "Vento": "🌪️",
                "Terra": "🪨", "Raio": "⚡", "Nenhum": "✦"
            };
            const icon = typeIcons[this.type] || "✦";
            const elementIcon = this.element && this.element !== "Nenhum"
                ? `<span class="card-element-icon" style="color:${ELEMENT_COLORS[this.element]}">${elementIcons[this.element] || ""}</span>` : "";

            let statsHTML = "";
            if (this.attack > 0) statsHTML += `<span>⚔ ${this.attack}${this.critChance > 0 ? ` (${Math.round(this.critChance * 100)}%C)` : ""}</span>`;
            if (this.defenseBuff > 0) statsHTML += `<span>🛡 +${this.defenseBuff}</span>`;
            if (this.defensePercent > 0) statsHTML += `<span>🛡 ${Math.round(this.defensePercent * 100)}% (${this.duration}t)</span>`;
            if (this.summonDotDamage > 0) statsHTML += `<span>☠ ${this.summonDotDamage}/${this.duration}t</span>`;
            if (this.effect === "bleed") statsHTML += `<span>🩸 ${this.effectValue || 2}/3s</span>`;
            if (statsHTML === "") statsHTML = "<span></span>";

            const elementBadge = this.element && this.element !== "Nenhum"
                ? `<span class="card-element" style="border-color:${ELEMENT_COLORS[this.element]};color:${ELEMENT_COLORS[this.element]}">${this.element}</span>` : "";
            const fusionBadge = this.isFusion ? `<span class="card-fusion-badge">FUSÃO</span>` : "";

            cardElement.innerHTML = `
                <div class="card-cost">${this.cost > 0 ? this.cost : ""}</div>
                <div class="card-name">${this.name}</div>
                <div class="card-image-placeholder">${icon}${elementIcon}${elementBadge}${fusionBadge}</div>
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
        "jutsu014": { name: "Grande Brecha de Vento", type: "Jutsu", cost: 35, description: "Causa 40 de dano de Vento.", attack: 40, element: "Vento" },
        "jutsu015": { name: "Lança de Pedra", type: "Jutsu", cost: 30, description: "Causa 40 de dano de Terra.", attack: 40, element: "Terra" },
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
        "jutsu020": { name: "Kunai Envenenada", type: "Jutsu", cost: 20, description: "Causa sangramento: 2 PV a cada 3s por 4 ciclos.", effect: "bleed", effectValue: 2, duration: 4, attack: 10 },
        "jutsu021": { name: "Corte Profundo", type: "Jutsu", cost: 30, description: "Sangramento forte: 3 PV a cada 3s por 4 ciclos.", effect: "bleed", effectValue: 3, duration: 4, attack: 15 },
        "item004": { name: "Antídoto", type: "Item", cost: 15, description: "Remove sangramento e venenos.", effect: "cleanse_bleed" },
        "item005": { name: "Bandagem Ninja", type: "Item", cost: 20, description: "Remove sangramento e cura 25 de Vida.", effect: "cleanse_bleed", effectValue: 25 },
    };

    const battleState = {
        turn: 0,
        currentPlayer: "player",
        gamePhase: "setup",
        combo: { player: { element: null, count: 0 }, opponent: { element: null, count: 0 } },
        lastElement: { player: null, opponent: null },
        player: createFighterState(),
        opponent: createFighterState()
    };

    function createFighterState() {
        return {
            health: 500, maxHealth: 500, chakra: 50, maxChakra: 380, defense: 0, maxDefense: 80,
            attackBoost: 0, critChanceBoost: 0, statusEffects: [], deck: [], hand: [], discardPile: [],
            canPlayCard: true, isStunned: false, fusionMode: false, fusionSelected: [],
            element: "Nenhum",
            healthBarFill: null, chakraBarFill: null, defenseBarFill: null,
            healthBarText: null, chakraBarText: null, defenseBarText: null,
            healthFeedback: null, chakraFeedback: null, defenseFeedback: null,
            statusEffectsDisplay: null, tempStatsDisplay: null, handElement: null,
            sideElement: null, comboDisplay: null
        };
    }

    // --- Cache de UI ---
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
            t.comboDisplay = document.getElementById(`${key}-combo`);
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
    const fusionButton = document.getElementById("fusion-button");
    const fusionHint = document.getElementById("fusion-hint");

    const battleResultsScreen = document.getElementById("battle-results-screen");
    const rivalNameDisplay = document.getElementById("rival-name-display");
    const battleResultTitle = document.getElementById("battle-result-title");
    const resultTrophies = document.getElementById("result-trophies");
    const resultCoins = document.getElementById("result-coins");
    const resultTime = document.getElementById("result-time");
    const resultStars = document.getElementById("result-stars");
    const closeResultsButton = document.getElementById("close-results-button");
    const nextLevelButton = document.getElementById("next-level-button");

    if (soundToggleBtn) {
        soundToggleBtn.addEventListener("click", () => {
            gameAudio.init();
            const enabled = gameAudio.toggle();
            soundToggleBtn.textContent = enabled ? "🔊" : "🔇";
            if (!enabled) { gameAudio.stopChakraCharge(); comboChargeActive = false; }
            else { updateComboChargeSound(); }
        });
    }
    document.addEventListener("click", () => { gameAudio.init(); gameAudio.resume(); }, { once: true });

    // --- Scroll ---
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

    // --- Chakra regeneração (mais generosa) + sangramento por tempo ---
    function startChakraRegeneration() {
        setInterval(() => {
            if (battleState.gamePhase === "game_over" || battleState.gamePhase === "results_screen") return;
            ["player", "opponent"].forEach(key => {
                const t = battleState[key];
                const regen = key === "player" ? 8 : 10; // IA regenera um pouco mais rápido
                if (t.chakra < t.maxChakra) t.chakra = Math.min(t.chakra + regen, t.maxChakra);
            });
            updatePlayerStatsUI();
            updateOpponentStatsUI();
            tickBleed();
        }, 3000);
    }
    startChakraRegeneration();

    // --- Sangramento: 2 PV a cada 3s (em tempo real), acumulável por stacks ---
    function tickBleed() {
        ["player", "opponent"].forEach(key => {
            const entity = battleState[key];
            if (entity.health <= 0) return;
            const bleeds = entity.statusEffects.filter(e => e.type === "bleed" && e.duration > 0);
            if (bleeds.length === 0) return;
            let total = 0;
            bleeds.forEach(e => { total += (e.value || 0); });
            entity.health = Math.max(0, entity.health - total);
            showFloatingNumber(-total, "bleed", entity.healthFeedback);
            animateDotDamage(key);
            sfx("bleed");
            logMessage(`${capitalize(key)} SANGRANDO: -${total} PV (${bleeds.length} stack${bleeds.length > 1 ? "s" : ""}).`, "log-damage");
            // Decrementa a duração de cada stack de sangramento
            bleeds.forEach(e => { e.duration--; });
            entity.statusEffects = entity.statusEffects.filter(e => !(e.type === "bleed" && e.duration <= 0));
        });
        updatePlayerStatsUI();
        updateOpponentStatsUI();
        checkWinCondition();
    }

    // --- Auxiliares ---
    function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

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
        while (messageLogElement.children.length > 60) messageLogElement.removeChild(messageLogElement.lastChild);
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
            d.effectValue, d.defensePercent, d.summonDotDamage, d.element, d.hits || 1);
    }

    function createFusionCard(recipe) {
        const c = new Card("fusion_" + recipe.name.replace(/\s/g, ""), recipe.name, "Jutsu",
            recipe.cost, recipe.desc, null, recipe.attack || 0, 0, recipe.effect,
            recipe.duration || 0, 0, recipe.effectValue || 0, 0, 0, recipe.element || "Nenhum",
            recipe.hits || 1, true);
        return c;
    }

    // --- Efeitos visuais ---
    function showTurnBanner(text, duration = 1200) {
        if (!turnBanner) return;
        turnBanner.textContent = text;
        turnBanner.classList.remove("hidden");
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

    function animateAttack(key, dir) {
        const t = battleState[key];
        if (!t.sideElement) return;
        const cls = dir === "right" ? "attacking-right" : "attacking-left";
        t.sideElement.classList.remove("attacking-right", "attacking-left");
        void t.sideElement.offsetWidth;
        t.sideElement.classList.add(cls);
        setTimeout(() => t.sideElement.classList.remove(cls), 400);
    }

    function animateDamage(key, isCrit = false) {
        const t = battleState[key];
        if (!t.sideElement) return;
        const cls = isCrit ? "shake-crit" : "shake-damage";
        t.sideElement.classList.remove("shake-damage", "shake-crit", "hit-flash", "crit-flash");
        void t.sideElement.offsetWidth;
        t.sideElement.classList.add(cls, isCrit ? "crit-flash" : "hit-flash");
        setTimeout(() => t.sideElement.classList.remove(cls, "hit-flash", "crit-flash"), 600);
    }

    function animateDotDamage(key) {
        const t = battleState[key];
        if (!t.sideElement) return;
        t.sideElement.classList.remove("shake-dot");
        void t.sideElement.offsetWidth;
        t.sideElement.classList.add("shake-dot");
        setTimeout(() => t.sideElement.classList.remove("shake-dot"), 300);
    }

    function animateHeal(key) {
        const t = battleState[key];
        if (!t.sideElement) return;
        t.sideElement.classList.remove("heal-flash");
        void t.sideElement.offsetWidth;
        t.sideElement.classList.add("heal-flash");
        setTimeout(() => t.sideElement.classList.remove("heal-flash"), 600);
    }

    function animateChakra(key) {
        const t = battleState[key];
        if (!t.sideElement) return;
        t.sideElement.classList.remove("chakra-flash");
        void t.sideElement.offsetWidth;
        t.sideElement.classList.add("chakra-flash");
        setTimeout(() => t.sideElement.classList.remove("chakra-flash"), 500);
    }

    function animateCombo(key) {
        const t = battleState[key];
        if (!t.sideElement) return;
        t.sideElement.classList.remove("combo-glow");
        void t.sideElement.offsetWidth;
        t.sideElement.classList.add("combo-glow");
        setTimeout(() => t.sideElement.classList.remove("combo-glow"), 800);
    }

    function animateStatusPulse(key) {
        const t = battleState[key];
        if (!t.sideElement) return;
        t.sideElement.classList.remove("status-active");
        void t.sideElement.offsetWidth;
        t.sideElement.classList.add("status-active");
        setTimeout(() => t.sideElement.classList.remove("status-active"), 700);
    }

    function triggerBarShadow(barFillElement) {
        const barContainer = barFillElement.parentElement;
        if (!barContainer) return;
        barContainer.classList.remove("active-shadow");
        void barContainer.offsetWidth;
        barContainer.classList.add("active-shadow");
        setTimeout(() => barContainer.classList.remove("active-shadow"), 2000);
    }

    function showFloatingNumber(value, type, feedbackElement, delay = 0) {
        if (!feedbackElement) return;
        const doIt = () => {
            const el = document.createElement("div");
            el.classList.add("floating-number", type);
            el.textContent = (value > 0 && (type === "heal" || type === "chakra-gained" || type === "defense-gained")) ? `+${value}` : `${value}`;
            feedbackElement.appendChild(el);
            setTimeout(() => el.remove(), 3600);
        };
        if (delay > 0) setTimeout(doIt, delay); else doIt();
    }

    function sfx(name) {
        if (!gameAudio.initialized) return;
        const map = {
            hit: () => gameAudio.playHit(), crit: () => gameAudio.playCrit(),
            heal: () => gameAudio.playHeal(), shield: () => gameAudio.playShield(),
            card: () => gameAudio.playCard(), error: () => gameAudio.playError(),
            draw: () => gameAudio.playDraw(), turn: () => gameAudio.playTurnStart(),
            stun: () => gameAudio.playStun(), burn: () => gameAudio.playBurn(),
            poison: () => gameAudio.playPoison(), chakra: () => gameAudio.playChakra(),
            victory: () => gameAudio.playVictory(), defeat: () => gameAudio.playDefeat(),
            summon: () => gameAudio.playSummon(), discard: () => gameAudio.playDiscard(),
            bleed: () => gameAudio.playBleed(), cleanse: () => gameAudio.playCleanse(),
            combo: () => gameAudio.playCombo(2), fusion: () => gameAudio.playFusion()
        };
        if (map[name]) map[name]();
    }

    // --- Combos ---
    function registerElementPlay(key, element) {
        if (!element || element === "Nenhum") {
            battleState.combo[key] = { element: null, count: 0 };
            return { active: false, bonus: 0, count: 0 };
        }
        const combo = battleState.combo[key];
        if (combo.element === element) {
            combo.count++;
        } else {
            combo.element = element;
            combo.count = 1;
        }
        // Bônus crescente: 2º jutsu +15%, 3º +30%, 4º+ +45%
        const bonus = combo.count >= 2 ? Math.min(0.15 * (combo.count - 1), 0.45) : 0;
        return { active: combo.count >= 2, bonus, count: combo.count };
    }

    function resetCombo(key) {
        battleState.combo[key] = { element: null, count: 0 };
        updateComboUI(key);
    }

    function updateComboUI(key) {
        const t = battleState[key];
        if (!t.comboDisplay) return;
        const combo = battleState.combo[key];
        if (combo.count >= 2 && combo.element) {
            const pct = Math.round(Math.min(0.15 * (combo.count - 1), 0.45) * 100);
            t.comboDisplay.textContent = `🔥 COMBO ${combo.element} x${combo.count} (+${pct}%)`;
            t.comboDisplay.style.color = ELEMENT_COLORS[combo.element] || "#f1c40f";
            t.comboDisplay.classList.add("active");
        } else {
            t.comboDisplay.textContent = "";
            t.comboDisplay.classList.remove("active");
        }
    }

    // --- Atualização da UI ---
    function updateTargetStatsUI(key) {
        const target = battleState[key];

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
            if (effect.type === "bleed") text = "SGR";
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

    // --- Detecção de cartas comboáveis na mão (fusão ou par elemental) ---
    function computeComboableIndices(hand) {
        const comboable = new Set();
        // 1) Fusão: procura pares (ou duplicatas) que formem uma receita
        for (let i = 0; i < hand.length; i++) {
            for (let j = i + 1; j < hand.length; j++) {
                if (findFusion(hand[i].id, hand[j].id)) {
                    comboable.add(i);
                    comboable.add(j);
                }
            }
        }
        // 2) Fusão com cópias do mesmo id (req [x,x]): precisa de >= 2 cópias
        const idCounts = {};
        hand.forEach(c => { idCounts[c.id] = (idCounts[c.id] || 0) + 1; });
        for (let i = 0; i < hand.length; i++) {
            if (idCounts[hand[i].id] >= 2 && findFusion(hand[i].id, hand[i].id)) {
                comboable.add(i);
            }
        }
        // 3) Combo elemental: >= 2 cartas de dano do mesmo elemento
        const byElement = {};
        hand.forEach((c, idx) => {
            if (c.element && c.element !== "Nenhum" && c.attack > 0) {
                (byElement[c.element] = byElement[c.element] || []).push(idx);
            }
        });
        Object.values(byElement).forEach(arr => {
            if (arr.length >= 2) arr.forEach(idx => comboable.add(idx));
        });
        return comboable;
    }

    function updateHandUI(playerType) {
        const target = battleState[playerType];
        target.handElement.innerHTML = "";
        if (target.hand.length === 0) {
            target.handElement.innerHTML = `<p>Mão Vazia</p>`;
            if (playerType === "player") updateComboChargeSound();
            return;
        }
        const comboableIndices = playerType === "player" ? computeComboableIndices(target.hand) : new Set();
        target.hand.forEach((cardInstance, index) => {
            if (playerType === "player") {
                const cardElement = cardInstance.getHTMLElement();
                const notYourTurn = battleState.currentPlayer !== "player" || battleState.gamePhase !== "player_turn";
                const cantAfford = battleState.player.chakra < cardInstance.cost;
                if (notYourTurn || (cantAfford && !target.fusionMode)) cardElement.classList.add("unplayable");
                if (target.fusionMode && target.fusionSelected.includes(index)) cardElement.classList.add("fusion-selected");
                if (comboableIndices.has(index)) cardElement.classList.add("comboable");
                cardElement.onclick = () => handleCardClick(cardInstance.id, index);
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
        if (playerType === "player") updateComboChargeSound();
    }

    // --- Som contínuo de chakra sendo carregado quando há cartas comboáveis ---
    function updateComboChargeSound() {
        const p = battleState.player;
        const onMyTurn = battleState.currentPlayer === "player" && battleState.gamePhase === "player_turn";
        const hasCombo = onMyTurn && p.hand.length > 0 && computeComboableIndices(p.hand).size > 0;
        if (hasCombo && !comboChargeActive) {
            comboChargeActive = true;
            if (gameAudio.initialized) gameAudio.startChakraCharge();
        } else if (!hasCombo && comboChargeActive) {
            comboChargeActive = false;
            if (gameAudio.initialized) gameAudio.stopChakraCharge();
        }
    }

    // --- Modo Fusão ---
    function toggleFusionMode() {
        const p = battleState.player;
        if (battleState.currentPlayer !== "player" || battleState.gamePhase !== "player_turn") {
            logMessage("Só pode fundir no seu turno.");
            sfx("error");
            return;
        }
        p.fusionMode = !p.fusionMode;
        p.fusionSelected = [];
        if (fusionButton) fusionButton.classList.toggle("active", p.fusionMode);
        if (fusionHint) {
            fusionHint.textContent = p.fusionMode
                ? "Selecione 2 cartas para fundir"
                : "";
            fusionHint.classList.toggle("visible", p.fusionMode);
        }
        updateHandUI("player");
        if (p.fusionMode) logMessage("Modo Fusão ativado! Selecione 2 cartas.", "log-system");
    }

    function handleCardClick(cardId, handIndex) {
        const p = battleState.player;
        if (p.fusionMode) {
            handleFusionSelection(handIndex);
        } else {
            playCardFromHand(cardId, handIndex);
        }
    }

    function handleFusionSelection(handIndex) {
        const p = battleState.player;
        const alreadyIdx = p.fusionSelected.indexOf(handIndex);
        if (alreadyIdx !== -1) {
            p.fusionSelected.splice(alreadyIdx, 1);
        } else {
            if (p.fusionSelected.length >= 2) p.fusionSelected.shift();
            p.fusionSelected.push(handIndex);
        }

        if (p.fusionSelected.length === 2) {
            const [i1, i2] = p.fusionSelected;
            const c1 = p.hand[i1], c2 = p.hand[i2];
            if (!c1 || !c2) { p.fusionSelected = []; updateHandUI("player"); return; }
            const recipe = findFusion(c1.id, c2.id);
            if (recipe) {
                attemptFusion(recipe, [i1, i2]);
            } else {
                logMessage(`Não há fusão entre ${c1.name} e ${c2.name}.`, "log-damage");
                sfx("error");
                p.fusionSelected = [];
            }
        }
        updateHandUI("player");
    }

    function attemptFusion(recipe, indices) {
        const p = battleState.player;
        if (p.chakra < recipe.cost) {
            logMessage(`Chakra insuficiente para fundir ${recipe.name} (precisa ${recipe.cost}).`, "log-damage");
            sfx("error");
            p.fusionSelected = [];
            return;
        }

        // Remove as 2 cartas (maior índice primeiro)
        const sorted = [...indices].sort((a, b) => b - a);
        const removed = sorted.map(i => p.hand.splice(i, 1)[0]);
        removed.forEach(c => p.discardPile.push(c.id));

        // Adiciona a carta fundida
        const fusionCard = createFusionCard(recipe);
        p.hand.push(fusionCard);

        p.fusionMode = false;
        p.fusionSelected = [];
        if (fusionButton) fusionButton.classList.remove("active");
        if (fusionHint) fusionHint.classList.remove("visible");

        sfx("fusion");
        showScreenFlash("crit", 600);
        showTurnBanner("FUSÃO!", 1200);
        logMessage(`★ FUSÃO! ${fusionCard.name} criada (custo ${recipe.cost}). ★`, "log-critical");
        updateAllCombatUI();
    }

    function updateTurnUI() {
        if (turnCounterDisplay) turnCounterDisplay.textContent = battleState.turn;
        const playerSide = document.getElementById("player-status-side");
        const opponentSide = document.getElementById("opponent-status-side");
        const isPlayerTurn = battleState.currentPlayer === "player";
        if (phaseLabel) {
            if (isPlayerTurn) {
                phaseLabel.textContent = "Sua Vez";
                phaseLabel.classList.remove("opponent-turn");
            } else {
                phaseLabel.textContent = "Vez do Oponente";
                phaseLabel.classList.add("opponent-turn");
            }
        }
        const inBattle = battleState.gamePhase !== "game_over" && battleState.gamePhase !== "results_screen" && battleState.gamePhase !== "setup";
        if (playerSide) playerSide.classList.toggle("turn-active", isPlayerTurn && inBattle);
        if (opponentSide) opponentSide.classList.toggle("turn-active", !isPlayerTurn && inBattle);
    }

    function updateAllCombatUI() {
        updatePlayerStatsUI();
        updateOpponentStatsUI();
        updateHandUI("player");
        updateHandUI("opponent");
        updateTurnUI();
        updateDeckInfo();
        updateComboUI("player");
        updateComboUI("opponent");
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
                if (target.hand.length < 8) {
                    const cardId = target.deck.pop();
                    const cardInstance = createCardInstance(cardId);
                    if (cardInstance) {
                        target.hand.push(cardInstance);
                        logMessage(`${capitalize(playerType) === "Player" ? "Jogador" : "Oponente"} comprou ${cardInstance.name}.`, "log-system");
                        sfx("draw");
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
            } else if (target.discardPile.length > 0) {
                target.deck = [...target.discardPile];
                target.discardPile = [];
                shuffleArray(target.deck);
                logMessage(`${playerType === "player" ? "Jogador" : "Oponente"} embaralhou o descarte no deck.`, "log-system");
                i--;
            } else {
                logMessage(`${playerType === "player" ? "Jogador" : "Oponente"} sem cartas no deck!`);
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
        battleState.combo = { player: { element: null, count: 0 }, opponent: { element: null, count: 0 } };
        battleState.opponent.element = rivalElements[currentRivalName] || "Nenhum";
        battleState.player.element = "Nenhum";
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
            t.fusionMode = false;
            t.fusionSelected = [];
            initializeDeck(type);
            drawCard(type, 4);
        });

        if (fusionButton) fusionButton.classList.remove("active");
        if (fusionHint) fusionHint.classList.remove("visible");

        showTurnBanner("SEU TURNO!");
        sfx("turn");
        logMessage("Turno do Jogador.", "log-system");
        endTurnButton.disabled = false;
        updateAllCombatUI();
    }

    function showResultsScreen(playerWon) {
        battleState.gamePhase = "results_screen";
        gameAudio.stopMusic();
        gameAudio.stopChakraCharge();
        comboChargeActive = false;
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
        if (!cardInstance || cardInstance.id !== cardId) { logMessage("Carta inválida."); sfx("error"); return; }
        if (player.chakra < cardInstance.cost) { logMessage(`Chakra insuficiente para ${cardInstance.name}.`); sfx("error"); return; }

        const cardEls = player.handElement.querySelectorAll(".card");
        if (cardEls[handIndex]) cardEls[handIndex].classList.add("playing");

        const chakraSpent = cardInstance.cost;
        player.chakra -= chakraSpent;
        if (chakraSpent > 0) showFloatingNumber(-chakraSpent, "chakra-spent", player.chakraFeedback);
        if (gameAudio.initialized) gameAudio.playCardEffect({ type: cardInstance.type, element: cardInstance.element, effect: cardInstance.effect, defenseBuff: cardInstance.defenseBuff });

        player.hand.splice(handIndex, 1);
        player.discardPile.push(cardInstance.id);
        logMessage(`Jogador usou ${cardInstance.name}.`, "log-system");
        applyCardEffect(cardInstance, "player", "opponent");
        updateAllCombatUI();
        checkWinCondition();
    }

    // --- Efeito Principal da Carta ---
    function applyCardEffect(card, casterKey, targetKey) {
        const caster = battleState[casterKey];
        const target = battleState[targetKey];

        // Registra combo elemental (apenas para cartas com elemento e que causam dano)
        let comboData = { active: false, bonus: 0, count: 0 };
        if (card.attack > 0 && card.element && card.element !== "Nenhum") {
            comboData = registerElementPlay(casterKey, card.element);
            if (comboData.active) {
                logMessage(`🔥 COMBO ${card.element} x${comboData.count}! +${Math.round(comboData.bonus * 100)}% de dano.`, "log-critical");
                sfx("combo");
                animateCombo(casterKey);
            }
            updateComboUI(casterKey);
        }

        if (card.attack > 0) {
            animateAttack(casterKey, casterKey === "player" ? "right" : "left");
            setTimeout(() => sfx("hit"), 100);
        }

        // Defesa direta
        if (card.defenseBuff > 0) {
            const oldDef = caster.defense;
            caster.defense = Math.min(caster.maxDefense, caster.defense + card.defenseBuff);
            const gained = caster.defense - oldDef;
            if (gained > 0) {
                showFloatingNumber(gained, "defense-gained", caster.defenseFeedback);
                sfx("shield");
                animateHeal(casterKey);
            }
            logMessage(`${capitalize(casterKey)} ganhou ${gained} de defesa com ${card.name}.`, "log-status");
        }

        // Dano
        if (card.attack > 0) {
            const defenderElement = null; // elemento do defensor (poderíamos ter um por lutador)
            const elemResult = getElementMultiplier(card.element, defenderElement);
            const hits = card.hits || 1;
            let totalDamage = 0;
            let anyCrit = false;

            for (let h = 0; h < hits; h++) {
                let hitDamage = card.attack + caster.attackBoost;
                let isCrit = false;
                if (Math.random() < (card.critChance + caster.critChanceBoost)) {
                    hitDamage = Math.round(hitDamage * 1.5);
                    isCrit = true;
                    anyCrit = true;
                }
                hitDamage = Math.round(hitDamage);
                // Redução de dano
                let effectiveDR = 0;
                target.statusEffects.forEach(eff => { if (eff.type === "defense_percent" && eff.duration > 0) effectiveDR += eff.value; });
                caster.statusEffects.forEach(eff => { if (eff.type === "reduce_attack_percent" && eff.duration > 0) effectiveDR += eff.value; });
                hitDamage = Math.round(hitDamage * (1 - effectiveDR));
                // Combo
                hitDamage = Math.round(hitDamage * (1 + comboData.bonus));
                // Elemento
                hitDamage = Math.round(hitDamage * elemResult.mult);
                if (hitDamage < 0) hitDamage = 0;
                totalDamage += hitDamage;

                if (hits > 1) {
                    // Aplica cada hit com delay
                    const dmg = hitDamage;
                    setTimeout(() => dealDamageToTarget(dmg, target, targetKey, isCrit), h * 180);
                }
            }

            if (anyCrit) { logMessage("★ ACERTO CRÍTICO! ★", "log-critical"); sfx("crit"); }
            if (elemResult.label) logMessage(elemResult.label, elemResult.mult > 1 ? "log-critical" : "log-damage");

            if (hits === 1) {
                logMessage(`${card.name} causa ${totalDamage} de dano!`, "log-damage");
                dealDamageToTarget(totalDamage, target, targetKey, anyCrit);
            } else {
                logMessage(`${card.name} golpeia ${hits}x (${totalDamage} total)!`, "log-damage");
            }
        }

        // Outros efeitos
        switch (card.effect) {
            case "draw_card":
                drawCard(casterKey, card.effectValue || 1);
                break;
            case "heal": {
                const amt = card.effectValue || 0;
                const oldH = caster.health;
                caster.health = Math.min(caster.maxHealth, caster.health + amt);
                const actual = caster.health - oldH;
                if (actual > 0) { showFloatingNumber(actual, "heal", caster.healthFeedback); animateHeal(casterKey); sfx("heal"); }
                logMessage(`${capitalize(casterKey)} recuperou ${actual} de vida.`, "log-heal");
                break;
            }
            case "recover_chakra": {
                const amt = card.effectValue || 0;
                const oldCh = caster.chakra;
                caster.chakra = Math.min(caster.maxChakra, caster.chakra + amt);
                const actual = caster.chakra - oldCh;
                if (actual > 0) { showFloatingNumber(actual, "chakra-gained", caster.chakraFeedback); animateChakra(casterKey); sfx("chakra"); }
                logMessage(`${capitalize(casterKey)} recuperou ${actual} de chakra.`, "log-status");
                break;
            }
            case "apply_defense_percent_buff":
                addStatusEffect(casterKey, { id: `def_pct_${Date.now()}`, name: card.name, type: "defense_percent",
                    description: `+${Math.round(card.defensePercent * 100)}% Redução de Dano`, value: card.defensePercent, duration: card.duration, sourceCardId: card.id });
                sfx("shield");
                logMessage(`${capitalize(casterKey)} ativou ${card.name} (+${Math.round(card.defensePercent * 100)}% Red. Dano, ${card.duration}t).`, "log-status");
                break;
            case "reduce_opponent_defense_percent":
                addStatusEffect(targetKey, { id: `red_def_pct_${Date.now()}`, name: card.name, type: "defense_percent",
                    description: `-${Math.round(card.effectValue * 100)}% Redução de Dano`, value: -card.effectValue, duration: card.duration, sourceCardId: card.id });
                sfx("poison");
                logMessage(`${capitalize(targetKey)} foi afetado por ${card.name}!`, "log-damage");
                break;
            case "burn":
                addStatusEffect(targetKey, { id: `burn_${Date.now()}`, name: card.name, type: "burn",
                    description: card.description, value: card.effectValue || 0, duration: card.duration, sourceCardId: card.id });
                sfx("burn");
                logMessage(`${capitalize(targetKey)} foi queimado por ${card.name}!`, "log-damage");
                break;
            case "summon_dot":
                addStatusEffect(targetKey, { id: `summon_${Date.now()}`, name: card.name, type: "summon_dot",
                    description: card.description, value: card.summonDotDamage || 0, duration: card.duration, sourceCardId: card.id });
                sfx("summon");
                logMessage(`${card.name} invocada! Dano contínuo em ${capitalize(targetKey)}.`, "log-damage");
                break;
            case "bleed":
                addStatusEffect(targetKey, { id: `bleed_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name: card.name, type: "bleed",
                    description: `Sangramento ${card.effectValue || 2} PV/3s`, value: card.effectValue || 2, duration: card.duration || 4, sourceCardId: card.id });
                sfx("bleed");
                logMessage(`${capitalize(targetKey)} está SANGRANDO com ${card.name}! (-${card.effectValue || 2} PV a cada 3s)`, "log-critical");
                break;
            case "cleanse_bleed": {
                const before = caster.statusEffects.length;
                caster.statusEffects = caster.statusEffects.filter(e => !["bleed", "poison"].includes(e.type));
                const removed = before - caster.statusEffects.length;
                let healed = 0;
                if (card.effectValue > 0) {
                    const oldH = caster.health;
                    caster.health = Math.min(caster.maxHealth, caster.health + card.effectValue);
                    healed = caster.health - oldH;
                }
                sfx("cleanse");
                if (removed > 0) logMessage(`${capitalize(casterKey)} removeu ${removed} sangramento(s)/veneno(s) com ${card.name}.`, "log-heal");
                else logMessage(`${card.name} usado, mas nada a remover.`, "log-status");
                if (healed > 0) { showFloatingNumber(healed, "heal", caster.healthFeedback); animateHeal(casterKey); logMessage(`${capitalize(casterKey)} recuperou ${healed} de vida.`, "log-heal"); }
                break;
            }
            case "stun":
                addStatusEffect(targetKey, { id: `stun_${Date.now()}`, name: card.name, type: "stun",
                    description: "Atordoado", value: 0, duration: card.duration, sourceCardId: card.id });
                sfx("stun");
                logMessage(`${capitalize(targetKey)} foi ATORDOADO!`, "log-critical");
                break;
            case "buff_next_taijutsu":
                addStatusEffect(casterKey, { id: `buff_tai_${Date.now()}`, name: card.name, type: "buff_taijutsu_atk",
                    description: `+${card.effectValue} Atk próximo Taijutsu`, value: card.effectValue, duration: card.duration || 99, sourceCardId: card.id });
                logMessage(`${capitalize(casterKey)} ativou ${card.name}.`, "log-status");
                break;
        }

        // Consome buff de taijutsu
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

    function dealDamageToTarget(damage, target, targetKey, isCrit) {
        if (damage <= 0) return;
        const toShield = Math.min(damage, target.defense);
        if (toShield > 0) {
            target.defense -= toShield;
            showFloatingNumber(-toShield, "defense-lost", target.defenseFeedback);
            logMessage(`${toShield} absorvido pela defesa de ${capitalize(targetKey)}.`, "log-status");
            sfx("shield");
        }
        const toHealth = damage - toShield;
        if (toHealth > 0) {
            target.health -= toHealth;
            setTimeout(() => {
                showFloatingNumber(-toHealth, isCrit ? "crit" : "damage", target.healthFeedback);
                animateDamage(targetKey, isCrit);
                if (isCrit) showScreenFlash("crit", 400);
            }, toShield > 0 ? 150 : 0);
        }
        updateAllCombatUI();
        checkWinCondition();
    }

    function addStatusEffect(targetKey, effectData) {
        const target = battleState[targetKey];
        target.statusEffects.push(effectData);
        logMessage(`${capitalize(targetKey)} recebeu efeito: ${effectData.name || effectData.type}.`, "log-status");
        animateStatusPulse(targetKey);
        if (effectData.type === "buff_taijutsu_atk") target.attackBoost += effectData.value;
    }

    function applyStatusEffectsAtTurnStart(entityKey) {
        const entity = battleState[entityKey];
        let hasActiveEffects = false;
        entity.statusEffects = entity.statusEffects.filter(effect => {
            if (effect.duration <= 0) return false;
            switch (effect.type) {
                case "burn": case "poison": case "summon_dot": {
                    const dotDmg = effect.value || 0;
                    if (dotDmg > 0) {
                        entity.health -= dotDmg;
                        hasActiveEffects = true;
                        setTimeout(() => { showFloatingNumber(-dotDmg, "damage", entity.healthFeedback); animateDotDamage(entityKey); }, 100);
                        logMessage(`${capitalize(entityKey)} sofreu ${dotDmg} de dano de ${effect.name}.`, "log-damage");
                        if (effect.type === "burn") sfx("burn"); else if (effect.type === "poison") sfx("poison"); else sfx("hit");
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
                            setTimeout(() => { showFloatingNumber(actual, "heal", entity.healthFeedback); animateHeal(entityKey); }, 100);
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
                case "bleed":
                    // Sangramento decai por TEMPO (tick de 3s), não por turno.
                    // Mantém ativo enquanto durar; não decrementa aqui.
                    return true;
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

    function endTurn() {
        if (battleState.gamePhase === "game_over") return;
        logMessage(`Fim do turno de ${battleState.currentPlayer === "player" ? "Jogador" : "Oponente"}.`, "log-system");

        if (battleState.currentPlayer === "player") {
            battleState.currentPlayer = "opponent";
            logMessage("Turno do Oponente.", "log-system");
            showTurnBanner("TURNO DO OPONENTE", 1000);
            applyStatusEffectsAtTurnStart("opponent");
            if (checkWinCondition()) return;
            drawCard("opponent", 1);
            battleState.opponent.isStunned = false;
            updateAllCombatUI();
            endTurnButton.disabled = true;
            setTimeout(opponentTurnLogic, 1000);
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

    // --- IA do Oponente AGRESSIVA ---
    // A IA sempre age: prioriza eficiência de chakra, sangramento, cura e agressão,
    // e nunca "trava" — se não puder jogar nada, encerra o turno corretamente.
    function opponentTurnLogic() {
        if (battleState.gamePhase === "game_over") return;

        if (battleState.opponent.isStunned) {
            logMessage("Oponente está atordoado e não pode jogar!", "log-critical");
            battleState.opponent.isStunned = false;
            sfx("stun");
            setTimeout(() => endTurn(), 800);
            return;
        }

        logMessage("Oponente está avaliando o campo...", "log-system");
        takeOpponentAction();
    }

    // A IA pode jogar até N cartas por turno (loop de decisões)
    function takeOpponentAction(actionsLeft = 3) {
        const opponent = battleState.opponent;

        if (battleState.gamePhase === "game_over") return;
        if (battleState.gamePhase === "results_screen") return;

        if (actionsLeft <= 0) {
            logMessage("Oponente encerra suas ações.", "log-system");
            setTimeout(() => endTurn(), 1200);
            return;
        }

        // Cartas jogáveis com eficiência (dano por chakra) para decisões inteligentes
        const playable = opponent.hand
            .map((card, idx) => ({ card, idx }))
            .filter(({ card }) => opponent.chakra >= card.cost);

        // Se não há carta jogável, encerra o turno (nunca trava)
        if (playable.length === 0) {
            logMessage("Oponente não tem chakra para jogar e encerra o turno.", "log-system");
            setTimeout(() => endTurn(), 900);
            return;
        }

        const chosen = pickOpponentCard(playable, opponent, battleState.player);
        if (!chosen) { setTimeout(() => endTurn(), 600); return; }

        const { card, idx } = chosen;
        opponent.chakra -= card.cost;
        if (card.cost > 0) showFloatingNumber(-card.cost, "chakra-spent", opponent.chakraFeedback);
        opponent.hand.splice(idx, 1);
        opponent.discardPile.push(card.id);
        logMessage(`Oponente usou ${card.name}!`, "log-damage");
        if (gameAudio.initialized) gameAudio.playCardEffect({ type: card.type, element: card.element, effect: card.effect, defenseBuff: card.defenseBuff });
        applyCardEffect(card, "opponent", "player");
        updateAllCombatUI();
        if (checkWinCondition()) return;

        // Continua suas ações com um pequeno delay
        setTimeout(() => takeOpponentAction(actionsLeft - 1), 1000);
    }

    // Heurística de escolha: agressiva, valoriza dano final, sangramento, cura e combo
    function pickOpponentCard(playable, opponent, player) {
        const hpPercent = opponent.health / opponent.maxHealth;
        const playerHp = player.health;
        const oppCombo = battleState.combo.opponent;

        // 0. Se estiver sangrando, usa antídoto/bandagem para estancar
        const bleeding = opponent.statusEffects.some(e => ["bleed", "poison"].includes(e.type));
        if (bleeding) {
            const cleanse = playable.find(({ card }) => card.effect === "cleanse_bleed");
            if (cleanse) return cleanse;
        }

        // 1. Cura emergencial
        if (hpPercent < 0.35) {
            const heal = playable.find(({ card }) => card.effect === "heal");
            if (heal) return heal;
        }

        // 2. Golpe letal (pode matar agora)
        const lethal = playable.find(({ card }) => card.attack > 0 && estimateDamage(card, opponent, player) >= playerHp);
        if (lethal) {
            logMessage("Oponente busca o golpe final!", "log-critical");
            return lethal;
        }

        // 3. Manter/estender combo elemental
        if (oppCombo.element && oppCombo.count >= 1) {
            const sameElement = playable.filter(({ card }) => card.element === oppCombo.element && card.attack > 0);
            if (sameElement.length > 0) {
                return sameElement.reduce((a, b) => b.card.attack > a.card.attack ? b : a);
            }
        }

        // 4. Se o jogador tem defesa alta, procura ignorar defesa ou debuff de defesa
        if (player.defense > 15) {
            const ignoreDef = playable.find(({ card }) => card.effect === "ignore_defense" || card.effect === "reduce_opponent_defense_percent");
            if (ignoreDef) return ignoreDef;
        }

        // 5. Aplica sangramento se o jogador ainda não estiver sangrando
        if (!player.statusEffects.some(e => e.type === "bleed")) {
            const bleed = playable.find(({ card }) => card.effect === "bleed");
            if (bleed && playerHp > 100) return bleed;
        }

        // 6. Aplica DoT (queimadura/veneno/invocação) se ainda não houver
        if (!player.statusEffects.some(e => ["burn", "poison", "summon_dot"].includes(e.type))) {
            const dot = playable.find(({ card }) => ["burn", "summon_dot"].includes(card.effect));
            if (dot && playerHp > 120) return dot;
        }

        // 7. Agressivo: melhor eficiência (dano por chakra), pequeno bônus para dano bruto
        return playable.reduce((best, current) => {
            const bEff = (estimateDamage(best.card, opponent, player) + best.card.attack * 0.1) / Math.max(1, best.card.cost);
            const cEff = (estimateDamage(current.card, opponent, player) + current.card.attack * 0.1) / Math.max(1, current.card.cost);
            return cEff > bEff ? current : best;
        });
    }

    function estimateDamage(card, caster, target) {
        if (!card.attack) return 0;
        let dmg = (card.attack + caster.attackBoost) * (card.hits || 1);
        let dr = 0;
        target.statusEffects.forEach(e => { if (e.type === "defense_percent") dr += e.value; });
        dmg *= (1 - dr);
        const elem = getElementMultiplier(card.element, target.element);
        dmg *= elem.mult;
        // considera defesa do alvo
        const absorb = Math.min(dmg, target.defense);
        return Math.round(dmg - absorb);
    }

    // --- Event Listeners ---
    endTurnButton.addEventListener("click", () => {
        if (battleState.currentPlayer === "player" && battleState.gamePhase === "player_turn") {
            if (battleState.player.fusionMode) toggleFusionMode();
            endTurnButton.disabled = true;
            endTurn();
        }
    });
    if (fusionButton) fusionButton.addEventListener("click", toggleFusionMode);
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
    nextLevelButton.addEventListener("click", () => { logMessage("Iniciando próximo nível!", "log-system"); startBattle(); });

    // --- Tooltip ---
    let combatTooltip = null;
    function showCardTooltip(event, card) {
        if (!combatTooltip) {
            combatTooltip = document.createElement("div");
            combatTooltip.className = "custom-tooltip";
            document.body.appendChild(combatTooltip);
        }
        let content = `<h4>${card.name}${card.isFusion ? " ★" : ""}</h4><p class="tooltip-cost">Custo: ${card.cost} Chakra</p><p>${card.description}</p>`;
        if (card.element && card.element !== "Nenhum") content += `<p class="tooltip-element" style="color:${ELEMENT_COLORS[card.element]}">Elemento: ${card.element}</p>`;
        combatTooltip.innerHTML = content;
        combatTooltip.classList.add("visible");
        positionTooltip(event);
    }
    function hideCardTooltip() { if (combatTooltip) combatTooltip.classList.remove("visible"); }
    function positionTooltip(event) {
        if (!combatTooltip || !combatTooltip.classList.contains("visible")) return;
        const PAD = 12;
        let x = event.pageX + PAD, y = event.pageY + PAD;
        const rect = combatTooltip.getBoundingClientRect();
        if (x + rect.width > window.innerWidth - PAD) x = event.pageX - rect.width - PAD;
        if (y + rect.height > window.innerHeight - PAD) y = event.pageY - rect.height - PAD;
        combatTooltip.style.left = `${x}px`;
        combatTooltip.style.top = `${y}px`;
    }
    document.addEventListener("mousemove", (e) => { if (combatTooltip && combatTooltip.classList.contains("visible")) positionTooltip(e); });

    // --- Início ---
    startBattle();
});

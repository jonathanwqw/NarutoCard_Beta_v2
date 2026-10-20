// Naruto Card Game - Motor de Áudio via Web Audio API
// Gera todos os sons programaticamente (sem arquivos externos)

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.musicPlaying = false;
        this.musicOscillators = [];
        this.enabled = true;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.ctx.destination);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.8;
            this.sfxGain.connect(this.masterGain);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.25;
            this.musicGain.connect(this.masterGain);

            this.initialized = true;
        } catch (e) {
            console.warn("Web Audio API não disponível:", e);
            this.enabled = false;
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume();
        }
    }

    _noise(duration) {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        return source;
    }

    _playTone(freq, type, duration, gainVal, dest, detune = 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        if (detune) osc.detune.value = detune;
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(dest || this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
        return osc;
    }

    playHit() {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        const t = this.ctx.currentTime;
        // Ruído curto com filtro passa-baixa = impacto
        const noise = this._noise(0.12);
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(2000, t);
        filter.frequency.exponentialRampToValueAtTime(200, t + 0.12);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start(t);
        noise.stop(t + 0.12);
        // Tom grave de impacto
        this._playTone(150, "sine", 0.1, 0.4);
    }

    playCrit() {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        this.playHit();
        // Soma brilho metálico
        setTimeout(() => {
            this._playTone(880, "square", 0.15, 0.15);
            this._playTone(1320, "sine", 0.25, 0.12);
            this._playTone(660, "sine", 0.2, 0.15);
        }, 40);
    }

    playHeal() {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        // Soma ascendente suave
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => this._playTone(freq, "sine", 0.25, 0.15), i * 70);
        });
    }

    playShield() {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        // Ping metálico de escudo
        this._playTone(440, "triangle", 0.2, 0.25);
        this._playTone(880, "sine", 0.15, 0.1);
        const noise = this._noise(0.08);
        const filter = this.ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 3000;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start();
        noise.stop(this.ctx.currentTime + 0.08);
    }

    playCard() {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        // Swoosh de carta
        const noise = this._noise(0.15);
        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(800, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(3000, this.ctx.currentTime + 0.15);
        filter.Q.value = 2;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start();
        noise.stop(this.ctx.currentTime + 0.15);
    }

    playError() {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        this._playTone(150, "square", 0.15, 0.2);
        setTimeout(() => this._playTone(120, "square", 0.2, 0.15), 120);
    }

    playDraw() {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        this._playTone(600, "sine", 0.08, 0.1);
        setTimeout(() => this._playTone(900, "sine", 0.08, 0.08), 60);
    }

    playTurnStart() {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        this._playTone(523, "sine", 0.12, 0.12);
        setTimeout(() => this._playTone(784, "sine", 0.2, 0.12), 100);
    }

    playStun() {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        // Wobble desorientado
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 300;
        lfo.type = "sine";
        lfo.frequency.value = 12;
        lfoGain.gain.value = 150;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        lfo.start();
        osc.stop(this.ctx.currentTime + 0.5);
        lfo.stop(this.ctx.currentTime + 0.5);
    }

    playBurn() {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        // Crepitar de fogo
        const noise = this._noise(0.3);
        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 1500;
        filter.Q.value = 0.5;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start();
        noise.stop(this.ctx.currentTime + 0.3);
        this._playTone(200, "sawtooth", 0.2, 0.08);
    }

    playPoison() {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        this._playTone(350, "sine", 0.15, 0.1);
        setTimeout(() => this._playTone(280, "sine", 0.2, 0.08), 100);
    }

    playChakra() {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        // Bloop de chakra
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    playVictory() {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        this.stopMusic();
        // Fanfarra de vitória
        const melody = [523, 659, 784, 1047, 784, 1047, 1319];
        const durations = [0.15, 0.15, 0.15, 0.3, 0.15, 0.15, 0.5];
        let time = 0;
        melody.forEach((freq, i) => {
            setTimeout(() => this._playTone(freq, "square", durations[i] + 0.05, 0.12), time * 1000);
            setTimeout(() => this._playTone(freq / 2, "sine", durations[i] + 0.05, 0.1), time * 1000);
            time += durations[i];
        });
    }

    playDefeat() {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        this.stopMusic();
        const melody = [400, 350, 300, 200];
        melody.forEach((freq, i) => {
            setTimeout(() => {
                this._playTone(freq, "sawtooth", 0.4, 0.12);
                this._playTone(freq * 0.5, "sine", 0.4, 0.08);
            }, i * 350);
        });
    }

    playSummon() {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        // Rumble de invocação
        this._playTone(80, "sawtooth", 0.4, 0.15);
        const noise = this._noise(0.3);
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 400;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start();
        noise.stop(this.ctx.currentTime + 0.3);
    }

    playDiscard() {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        const noise = this._noise(0.1);
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 800;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start();
        noise.stop(this.ctx.currentTime + 0.1);
    }

    // ====== SONS POR ELEMENTO / TIPO ======

    // Água: som de água corrente / splash
    playWater() {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        const t = this.ctx.currentTime;
        const noise = this._noise(0.5);
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(3000, t);
        filter.frequency.exponentialRampToValueAtTime(400, t + 0.5);
        filter.Q.value = 1;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.35, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start(t);
        noise.stop(t + 0.5);
        // Tom grave de "onda"
        const osc = this.ctx.createOscillator();
        const og = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(90, t + 0.4);
        og.gain.setValueAtTime(0.2, t);
        og.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(og);
        og.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.4);
    }

    // Fogo: crepitar + whoosh
    playFire() {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        const t = this.ctx.currentTime;
        const noise = this._noise(0.45);
        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(600, t);
        filter.frequency.exponentialRampToValueAtTime(2500, t + 0.45);
        filter.Q.value = 0.7;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start(t);
        noise.stop(t + 0.45);
        this._playTone(120, "sawtooth", 0.35, 0.1);
    }

    // Vento: rajada
    playWind() {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        const t = this.ctx.currentTime;
        const noise = this._noise(0.55);
        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(500, t);
        filter.frequency.linearRampToValueAtTime(4000, t + 0.3);
        filter.frequency.linearRampToValueAtTime(1500, t + 0.55);
        filter.Q.value = 0.5;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start(t);
        noise.stop(t + 0.55);
    }

    // Raio: crackle elétrico + zap
    playLightning() {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        const t = this.ctx.currentTime;
        // Zap agudo
        const osc = this.ctx.createOscillator();
        const og = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(1800, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.2);
        og.gain.setValueAtTime(0.25, t);
        og.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(og);
        og.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.2);
        // Crackle (ruído agudo)
        const noise = this._noise(0.18);
        const filter = this.ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 2000;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start(t);
        noise.stop(t + 0.18);
    }

    // Terra: impacto pesado / tremor
    playEarth() {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const og = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(90, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.4);
        og.gain.setValueAtTime(0.4, t);
        og.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(og);
        og.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.4);
        const noise = this._noise(0.3);
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 300;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start(t);
        noise.stop(t + 0.3);
    }

    // Taijutsu: impacto seco corpo-a-corpo
    playTaijutsu() {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        const t = this.ctx.currentTime;
        const noise = this._noise(0.08);
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1500, t);
        filter.frequency.exponentialRampToValueAtTime(300, t + 0.08);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start(t);
        noise.stop(t + 0.08);
        this._playTone(110, "sine", 0.12, 0.35);
    }

    // Item/arma: som metálico de arma
    playWeapon() {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        const t = this.ctx.currentTime;
        [1400, 2100, 2800].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = "triangle";
            osc.frequency.value = freq;
            g.gain.setValueAtTime(0.001, t);
            g.gain.linearRampToValueAtTime(0.12 - i * 0.03, t + 0.005);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.15 + i * 0.05);
            osc.connect(g);
            g.connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + 0.25);
        });
    }

    // Defesa: escudo de barreira
    playDefense() {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(600, t + 0.25);
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.connect(g);
        g.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.35);
        this._playTone(800, "triangle", 0.2, 0.15);
    }

    // Invocação: rugido grave
    playSummonVoice() {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const lfo = this.ctx.createOscillator();
        const lfoG = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(70, t);
        osc.frequency.linearRampToValueAtTime(50, t + 0.6);
        lfo.type = "sine";
        lfo.frequency.value = 25;
        lfoG.gain.value = 12;
        lfo.connect(lfoG);
        lfoG.connect(osc.frequency);
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.3, t + 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
        osc.connect(g);
        g.connect(this.sfxGain);
        osc.start(t);
        lfo.start(t);
        osc.stop(t + 0.7);
        lfo.stop(t + 0.7);
    }

    // ====== LOGICA PRINCIPAL DE EFEITO ======
    // Toca o som correto de acordo com o tipo/elemento da carta
    playCardEffect(card) {
        if (!this.enabled || !this.initialized) return;
        const type = (card.type || "").toLowerCase();
        const element = card.element || "Nenhum";
        const effect = card.effect || "";

        // Efeitos específicos primeiro
        if (effect === "heal" || effect === "remove_debuffs") { this.playHeal(); return; }
        if (effect === "recover_chakra") { this.playChakra(); return; }
        if (effect === "burn") { this.playFire(); return; }
        if (effect === "poison") { this.playPoison(); return; }
        if (effect === "summon_dot") { this.playSummonVoice(); return; }
        if (effect === "stun") { this.playStun(); return; }
        if (type === "defesa" || effect === "apply_defense_percent_buff" || card.defenseBuff > 0) { this.playDefense(); return; }
        if (effect === "buff_next_taijutsu" || effect === "stat_boost_regen" || effect === "stat_boost") { this.playChakra(); return; }

        // Por tipo
        if (type === "taijutsu") { this.playTaijutsu(); return; }
        if (type === "item") { this.playWeapon(); return; }
        if (type === "invocação") { this.playSummonVoice(); return; }

        // Por elemento (jutsus)
        switch (element) {
            case "Água": this.playWater(); return;
            case "Fogo": this.playFire(); return;
            case "Vento": this.playWind(); return;
            case "Raio": this.playLightning(); return;
            case "Terra": this.playEarth(); return;
        }

        // Fallback
        this.playCard();
    }

    startMusic() {
        if (!this.enabled || !this.initialized || this.musicPlaying) return;
        this.resume();
        this.musicPlaying = true;
        this._musicLoop();
    }

    _musicLoop() {
        if (!this.musicPlaying || !this.ctx) return;
        // Progressão musical simples de batalha (Am - F - C - G)
        const chords = [
            [220, 262, 330],
            [175, 220, 262],
            [196, 247, 294],
            [165, 196, 247]
        ];
        const beatDuration = 0.8;
        let timeOffset = 0;

        chords.forEach((chord) => {
            chord.forEach(freq => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = "triangle";
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0, this.ctx.currentTime + timeOffset);
                gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + timeOffset + 0.05);
                gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + timeOffset + beatDuration);
                osc.connect(gain);
                gain.connect(this.musicGain);
                osc.start(this.ctx.currentTime + timeOffset);
                osc.stop(this.ctx.currentTime + timeOffset + beatDuration);
                this.musicOscillators.push(osc);
            });
            timeOffset += beatDuration;
        });

        // Repete o loop
        this._musicTimeout = setTimeout(() => {
            if (this.musicPlaying) this._musicLoop();
        }, timeOffset * 1000);
    }

    stopMusic() {
        this.musicPlaying = false;
        if (this._musicTimeout) clearTimeout(this._musicTimeout);
        this.musicOscillators.forEach(osc => {
            try { osc.stop(); } catch (e) { /* já parado */ }
        });
        this.musicOscillators = [];
    }

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) this.stopMusic();
        return this.enabled;
    }
}

// Instância global
const gameAudio = new AudioEngine();

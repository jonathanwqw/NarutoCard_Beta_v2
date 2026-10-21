/**
 * Áudio procedural (WebAudio) — sem arquivos de som.
 *
 * O jogo roda offline e sem assets binários: cada efeito é sintetizado.
 */

let ctx = null;
let enabled = true;
let master = null;

function audioContext() {
    if (!ctx) {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtor) return null;
        ctx = new AudioCtor();
        master = ctx.createGain();
        master.gain.value = 0.25;
        master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
}

export function setEnabled(value) {
    enabled = !!value;
    if (master) master.gain.value = enabled ? 0.25 : 0;
    return enabled;
}

export function isEnabled() {
    return enabled;
}

function tone({ frequency = 440, duration = 0.12, type = "square", volume = 0.6, slideTo = null, delay = 0 }) {
    if (!enabled) return;
    const audio = audioContext();
    if (!audio) return;
    const start = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), start + duration);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
}

function noise({ duration = 0.15, volume = 0.4, filter = 1200, delay = 0 }) {
    if (!enabled) return;
    const audio = audioContext();
    if (!audio) return;
    const start = audio.currentTime + delay;
    const frames = Math.floor(audio.sampleRate * duration);
    const buffer = audio.createBuffer(1, frames, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    }
    const source = audio.createBufferSource();
    source.buffer = buffer;
    const lowpass = audio.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = filter;
    const gain = audio.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(master);
    source.start(start);
}

/** Efeitos do catálogo (data/effects.js -> sfx). */
export const SFX = {
    hit: () => {
        noise({ duration: 0.16, volume: 0.5, filter: 900 });
        tone({ frequency: 180, slideTo: 70, duration: 0.16, type: "sawtooth", volume: 0.4 });
    },
    crit: () => {
        noise({ duration: 0.22, volume: 0.6, filter: 2200 });
        tone({ frequency: 880, slideTo: 220, duration: 0.25, type: "square", volume: 0.5 });
    },
    draw: () => tone({ frequency: 620, slideTo: 880, duration: 0.09, type: "triangle", volume: 0.35 }),
    heal: () => {
        tone({ frequency: 520, duration: 0.12, type: "sine", volume: 0.4 });
        tone({ frequency: 780, duration: 0.14, type: "sine", volume: 0.35, delay: 0.1 });
    },
    shield: () => tone({ frequency: 300, slideTo: 460, duration: 0.16, type: "triangle", volume: 0.4 }),
    chakra: () => tone({ frequency: 900, slideTo: 1300, duration: 0.12, type: "sine", volume: 0.3 }),
    poison: () => tone({ frequency: 240, slideTo: 120, duration: 0.3, type: "sawtooth", volume: 0.3 }),
    burn: () => noise({ duration: 0.3, volume: 0.35, filter: 700 }),
    bleed: () => noise({ duration: 0.22, volume: 0.3, filter: 500 }),
    stun: () => {
        tone({ frequency: 1200, slideTo: 300, duration: 0.4, type: "square", volume: 0.35 });
    },
    cleanse: () => tone({ frequency: 400, slideTo: 900, duration: 0.25, type: "sine", volume: 0.35 }),
    discard: () => noise({ duration: 0.12, volume: 0.3, filter: 600 }),
    summon: () => tone({ frequency: 160, slideTo: 320, duration: 0.35, type: "triangle", volume: 0.4 }),
    victory: () => {
        [523, 659, 784, 1047].forEach((frequency, index) =>
            tone({ frequency, duration: 0.18, type: "square", volume: 0.4, delay: index * 0.12 })
        );
    },
    defeat: () => {
        [392, 330, 262].forEach((frequency, index) =>
            tone({ frequency, duration: 0.22, type: "sawtooth", volume: 0.35, delay: index * 0.16 })
        );
    },
    click: () => tone({ frequency: 700, duration: 0.05, type: "square", volume: 0.25 })
};

/** Toca um efeito pelo nome (silencioso se não existir). */
export function play(sfxName) {
    const sfx = SFX[sfxName];
    if (sfx) sfx();
}

/** Liga/desliga e devolve o estado. */
export function toggle() {
    return setEnabled(!enabled);
}

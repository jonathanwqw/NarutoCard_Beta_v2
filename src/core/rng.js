/**
 * Gerador de números pseudoaleatórios determinístico (mulberry32).
 * Permite reproduzir partidas para depurar e para os testes automatizados.
 */

export function hashSeed(text) {
    let hash = 2166136261;
    const value = String(text);
    for (let i = 0; i < value.length; i++) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

export function createRng(seed = 1) {
    let state = (typeof seed === "number" ? seed : hashSeed(seed)) >>> 0;

    function next() {
        state = (state + 0x6D2B79F5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    return {
        next,
        /** Inteiro no intervalo [min, max]. */
        int(min, max) {
            if (max < min) return min;
            return Math.floor(next() * (max - min + 1)) + min;
        },
        /** Chance booleana (0-1). */
        chance(probability) {
            return next() < probability;
        },
        /** Elemento aleatório de uma lista. */
        pick(list) {
            if (!list || list.length === 0) return null;
            return list[Math.floor(next() * list.length)];
        },
        /** Cópia embaralhada (Fisher-Yates, sem mutar a original). */
        shuffle(list) {
            const copy = [...list];
            for (let i = copy.length - 1; i > 0; i--) {
                const j = Math.floor(next() * (i + 1));
                [copy[i], copy[j]] = [copy[j], copy[i]];
            }
            return copy;
        }
    };
}

/**
 * Elementos do universo Naruto.
 * Fonte única de verdade para cores, ícones e o gráfico de vantagens.
 *
 * REGRA (ver AGENTS.md): todo elemento usado por uma carta precisa existir
 * aqui e ter cor + ícone. O validador falha o build caso contrário.
 */

export const ELEMENTS = {
    Vento: {
        id: "Vento",
        icon: "🌪️",
        color: "#1abc9c",
        dark: "#127a68",
        light: "#a8f0e4",
        strong: "Terra",
        weak: "Raio"
    },
    Fogo: {
        id: "Fogo",
        icon: "🔥",
        color: "#e67e22",
        dark: "#8a4409",
        light: "#ffd0a8",
        strong: "Vento",
        weak: "Água"
    },
    Raio: {
        id: "Raio",
        icon: "⚡",
        color: "#f1c40f",
        dark: "#8a6c00",
        light: "#fff3a8",
        strong: "Água",
        weak: "Terra"
    },
    Água: {
        id: "Água",
        icon: "💧",
        color: "#3498db",
        dark: "#1b527d",
        light: "#bde3ff",
        strong: "Fogo",
        weak: "Terra"
    },
    Terra: {
        id: "Terra",
        icon: "🪨",
        color: "#8e6e53",
        dark: "#4c3a29",
        light: "#dcc7b0",
        strong: "Raio",
        weak: "Vento"
    },
    Nenhum: {
        id: "Nenhum",
        icon: "✦",
        color: "#95a5a6",
        dark: "#4a5455",
        light: "#e4eaeb",
        strong: null,
        weak: null
    }
};

export const ELEMENT_IDS = Object.keys(ELEMENTS);

/** Cor de um elemento (fallback seguro para elemento desconhecido). */
export function elementColor(element) {
    return (ELEMENTS[element] || ELEMENTS.Nenhum).color;
}

/** Ícone de um elemento. */
export function elementIcon(element) {
    return (ELEMENTS[element] || ELEMENTS.Nenhum).icon;
}

/**
 * Multiplicador de dano entre elementos do atacante e do defensor.
 * Retorna { mult, label } — label é "" quando não há vantagem.
 */
export function elementMultiplier(attackerElement, defenderElement) {
    if (!attackerElement || attackerElement === "Nenhum") return { mult: 1, label: "" };
    const chart = ELEMENTS[attackerElement];
    if (!chart) return { mult: 1, label: "" };
    if (chart.strong === defenderElement) {
        return { mult: 1.3, label: "⚡ VANTAGEM ELEMENTAL!" };
    }
    if (chart.weak === defenderElement) {
        return { mult: 0.7, label: "desvantagem elemental..." };
    }
    return { mult: 1, label: "" };
}

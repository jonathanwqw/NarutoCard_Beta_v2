#!/usr/bin/env node
/**
 * GERADOR DE ARTE PROCEDURAL — npm run art
 *
 * Cada carta ganha um SVG determinístico em assets/cards/<id>.svg.
 * Para usar arte real basta substituir o arquivo pelo mesmo nome
 * (o jogo sempre procura assets/cards/<id>.svg).
 *
 * Nenhuma dependência externa: só strings SVG.
 *
 * Uso:
 *   node tools/generate-art.js           # gera (ou regenera) todas as artes
 *   node tools/generate-art.js --check   # só verifica se todas existem
 */

import { existsSync, mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { CARDS, cardArtPath } from "../src/data/cards.js";
import { ELEMENTS } from "../src/data/elements.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "assets", "cards");
const checkOnly = process.argv.includes("--check");

const WIDTH = 200;
const HEIGHT = 280;

/** Hash determinístico (string -> int 32 bits). */
function hash(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
}

function elementPalette(elementId) {
    const element = ELEMENTS[elementId] || ELEMENTS.Nenhum;
    return {
        main: element.color || "#6b7280",
        dark: element.dark || "#1f2430",
        light: element.light || "#cbd5f5",
        icon: element.icon || "✦"
    };
}

/** Desenho de fundo por tipo de carta. */
function backgroundPattern(type, palette, seed) {
    const { main, dark, light } = palette;
    const parts = [];

    if (type === "Jutsu" || type === "Invocação") {
        const count = 5 + (seed % 4);
        for (let i = 0; i < count; i++) {
            const x = 8 + ((seed * (i + 3) * 37) % (WIDTH - 16));
            const width = 4 + ((seed + i) % 10);
            const y = 10 + ((seed * (i + 5) * 29) % (HEIGHT - 40));
            const height = 30 + ((seed * (i + 7) * 17) % 90);
            parts.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${light}" opacity="0.12" rx="2"/>`);
        }
    } else if (type === "Taijutsu") {
        for (let i = 0; i < 4; i++) {
            const r = 30 + i * 18 + (seed % 7);
            parts.push(`<circle cx="${WIDTH / 2}" cy="${HEIGHT / 2}" r="${r}" fill="none" stroke="${light}" stroke-width="2" opacity="0.16"/>`);
        }
    } else if (type === "Defesa" || type === "Armadura") {
        parts.push(`<path d="M${WIDTH / 2} 40 L150 70 V140 Q150 200 ${WIDTH / 2} 235 Q50 200 50 140 V70 Z" fill="${light}" opacity="0.10"/>`);
        parts.push(`<path d="M${WIDTH / 2} 40 L150 70 V140 Q150 200 ${WIDTH / 2} 235 Q50 200 50 140 V70 Z" fill="none" stroke="${light}" stroke-width="3" opacity="0.35"/>`);
    } else if (type === "Item") {
        const cx = WIDTH / 2;
        const cy = HEIGHT / 2;
        const pts = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
            const r = 82 + (seed % 12);
            pts.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`);
        }
        parts.push(`<polygon points="${pts.join(" ")}" fill="${light}" opacity="0.10"/>`);
        parts.push(`<polygon points="${pts.join(" ")}" fill="none" stroke="${light}" stroke-width="3" opacity="0.32"/>`);
    } else if (type === "Buff") {
        parts.push(`<path d="M${WIDTH / 2} 60 L${WIDTH / 2 + 46} 150 H${WIDTH / 2 + 18} V220 H${WIDTH / 2 - 18} V150 H${WIDTH / 2 - 46} Z" fill="${light}" opacity="0.14"/>`);
    } else if (type === "Debuff") {
        parts.push(`<path d="M${WIDTH / 2} 220 L${WIDTH / 2 + 46} 130 H${WIDTH / 2 + 18} V60 H${WIDTH / 2 - 18} V130 H${WIDTH / 2 - 46} Z" fill="${light}" opacity="0.14"/>`);
    } else if (type === "Arma") {
        parts.push(`<path d="M100 30 L120 150 L100 230 L80 150 Z" fill="${light}" opacity="0.14"/>`);
        parts.push(`<rect x="55" y="146" width="90" height="10" rx="4" fill="${light}" opacity="0.22"/>`);
    } else if (type === "Modo") {
        for (let i = 0; i < 4; i++) {
            parts.push(`<circle cx="${WIDTH / 2}" cy="${HEIGHT / 2}" r="${28 + i * 22}" fill="none" stroke="${main}" stroke-width="${3 - i * 0.5}" opacity="${0.35 - i * 0.06}"/>`);
        }
    } else if (type === "Material") {
        parts.push(`<rect x="60" y="80" width="80" height="120" rx="8" fill="${light}" opacity="0.10"/>`);
        parts.push(`<path d="M100 100 L130 140 L100 180 L70 140 Z" fill="${light}" opacity="0.2"/>`);
    }

    return parts.join("\n        ");
}

/** Glifo central: iniciais do nome da carta. */
function glyph(card) {
    const words = String(card.name || "?").split(/\s+/).filter(Boolean);
    const text = words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
    const size = text.length > 1 ? 54 : 66;
    return `<text x="${WIDTH / 2}" y="${HEIGHT / 2 + size * 0.34}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${size}" font-weight="700" fill="#ffffff" opacity="0.85">${escapeXml(text)}</text>`;
}

function escapeXml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function buildSvg(card, id) {
    const palette = elementPalette(card.element);
    const seed = hash(id);
    const tilt = (seed % 9) - 4;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" role="img" aria-label="${escapeXml(card.name || id)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${palette.main}"/>
      <stop offset="100%" stop-color="${palette.dark}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="60%">
      <stop offset="0%" stop-color="${palette.light}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${palette.light}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M20 0 H0 V20" fill="none" stroke="#ffffff" stroke-width="0.6" opacity="0.07"/>
    </pattern>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid)"/>
  <g transform="rotate(${tilt} ${WIDTH / 2} ${HEIGHT / 2})">
        ${backgroundPattern(card.type, palette, seed)}
  </g>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
  ${glyph(card)}
  <rect x="3" y="3" width="${WIDTH - 6}" height="${HEIGHT - 6}" fill="none" stroke="${palette.light}" stroke-width="3" opacity="0.45" rx="8"/>
  <text x="${WIDTH - 12}" y="${HEIGHT - 14}" text-anchor="end" font-family="monospace" font-size="14" fill="#ffffff" opacity="0.55">${escapeXml(id)}</text>
</svg>
`;
}

function ensureDir() {
    if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
}

function main() {
    const ids = Object.keys(CARDS);
    ensureDir();

    if (checkOnly) {
        const missing = ids.filter((id) => !existsSync(path.join(ROOT, cardArtPath(id, CARDS[id]))));
        if (missing.length) {
            console.error(`Faltam ${missing.length} arte(s): ${missing.join(", ")}`);
            process.exit(1);
        }
        console.log(`✅ ${ids.length} arte(s) presentes em assets/cards/.`);
        return;
    }

    let created = 0;
    ids.forEach((id) => {
        const card = CARDS[id];
        const file = path.join(ROOT, cardArtPath(id, card));
        if (!existsSync(path.dirname(file))) mkdirSync(path.dirname(file), { recursive: true });
        writeFileSync(file, buildSvg(card, id), "utf-8");
        created += 1;
    });

    // arte genérica para fusões (criadas em partida, fora do registro)
    const fusionFile = path.join(OUT_DIR, "fusion.svg");
    if (!existsSync(fusionFile)) {
        writeFileSync(fusionFile, buildSvg({ name: "Fusão", element: "Nenhum", type: "Jutsu" }, "fusion"), "utf-8");
    }

    const total = existsSync(OUT_DIR) ? readdirSync(OUT_DIR).length : 0;
    console.log(`🎨 ${created} arte(s) gerada(s) em assets/cards/ (${total} arquivos no total).`);
}

main();

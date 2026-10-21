/**
 * Renderização de cartas (HTML) — usado no menu, inventário, loja e combate.
 *
 * A arte vem sempre de assets/cards/<id>.svg (gerada pelo tools/generate-art.js
 * ou substituída por arte real com o mesmo nome).
 */

import { getCard, cardRarity, cardArtPath } from "../data/cards.js";
import { elementIcon, elementColor } from "../data/elements.js";
import { effectInfo } from "../data/effects.js";

function escapeHtml(text) {
    return String(text === undefined || text === null ? "" : text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function typeClass(type) {
    return `type-${String(type || "jutsu").toLowerCase()}`;
}

/**
 * Renderiza uma carta.
 * @param {object|string} card carta ou id
 * @param {object} options { size: "sm"|"md"|"", quantity: number, selected: boolean, extraClass: string, dataAttrs: object }
 */
export function renderCard(card, options = {}) {
    const base = typeof card === "string" ? getCard(card) : card;
    if (!base) return `<div class="card card--md card--empty">Carta inexistente</div>`;

    const id = base.id;
    const size = options.size ? ` card--${options.size}` : "";
    const extra = options.extraClass ? ` ${options.extraClass}` : "";
    const selected = options.selected ? " card-picked" : "";
    const quantity = options.quantity ? `<span class="card-quantity">x${options.quantity}</span>` : "";

    const dataAttrs = Object.entries(options.dataAttrs || {})
        .map(([key, value]) => ` data-${key}="${escapeHtml(value)}"`)
        .join("");

    const art = cardArtPath(id, base);
    const effect = effectInfo(base.effect || null);
    const stats = [];
    if (base.attack) stats.push(`<span title="Ataque">⚔${base.attack}</span>`);
    if (base.defenseBuff) stats.push(`<span title="Defesa">🛡${base.defenseBuff}</span>`);
    if (base.defensePercent) stats.push(`<span title="Redução de dano">◈${Math.round(base.defensePercent * 100)}%</span>`);
    if (base.hits > 1) stats.push(`<span title="Acertos">✦${base.hits}</span>`);

    const effectBadge = base.effect
        ? `<span title="${escapeHtml(effect.label)}: ${escapeHtml(effect.description)}">${effect.icon}</span>`
        : "";

    return `<div class="card${size}${extra}${selected} ${typeClass(base.type)}" data-card-id="${escapeHtml(id)}"${dataAttrs}>
  <div class="card-cost" title="Custo de Chakra">${base.cost}</div>
  <div class="card-name" title="${escapeHtml(base.name)}">${escapeHtml(base.name)}</div>
  <div class="card-image-placeholder">
    <img src="${escapeHtml(art)}" alt="${escapeHtml(base.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;">
    <span class="card-element-icon">${elementIcon(base.element)}</span>
  </div>
  <div class="card-type">${escapeHtml(base.type)}</div>
  <div class="card-desc">${escapeHtml(base.description)}</div>
  <div class="card-stats">${stats.join("")}${effectBadge}</div>
  <div class="card-element" style="border-color:${elementColor(base.element)};color:${elementColor(base.element)}">${escapeHtml(base.element || "Nenhum")}</div>
  ${quantity}
</div>`;
}

/** Lista de cartas (usada em inventário, loja, baús). */
export function renderCardList(cards, options = {}) {
    return cards.map((card) => renderCard(card, options)).join("");
}

/** Rótulo legível de raridade. */
export function rarityLabel(cardId) {
    return cardRarity(getCard(cardId));
}

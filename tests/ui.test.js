/**
 * Testes de fumaça da UI — npm test
 *
 * Não substituem um navegador de verdade, mas garantem que os módulos da
 * interface carregam (grafo de imports correto), que o card-view renderiza
 * e que o perfil salvo volta intacto do localStorage.
 */

import test from "node:test";
import assert from "node:assert/strict";

// stub mínimo de DOM (a UI só é exercitada de verdade no navegador)
globalThis.document = {
    addEventListener() {},
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ classList: { add() {}, remove() {}, toggle() {} }, style: {}, appendChild() {}, addEventListener() {} })
};
globalThis.window = { addEventListener() {}, location: { href: "" }, AudioContext: null };
globalThis.localStorage = {
    store: new Map(),
    getItem(key) { return this.store.has(key) ? this.store.get(key) : null; },
    setItem(key, value) { this.store.set(key, value); },
    removeItem(key) { this.store.delete(key); }
};

test("módulos da interface carregam sem erro", async () => {
    await import("../src/ui/card-view.js");
    await import("../src/ui/audio.js");
    await import("../src/ui/menu.js");
    await import("../src/ui/battle.js");
});

test("card-view renderiza nome, arte e custo", async () => {
    const { renderCard } = await import("../src/ui/card-view.js");
    const html = renderCard("jutsu001");
    assert.match(html, /Rasengan/);
    assert.match(html, /\/assets\/cards\/jutsu001\.svg/);
    assert.match(html, /class="card-cost"[^>]*>30</);
    assert.match(html, /type-jutsu/);
});

test("card-view devolve aviso para carta inexistente", async () => {
    const { renderCard } = await import("../src/ui/card-view.js");
    assert.match(renderCard("nao_existe"), /inexistente/);
});

test("perfil é salvo e lido do localStorage", async () => {
    const save = await import("../src/core/save.js");
    save.clearProfile();
    assert.equal(save.loadProfile(), null);

    const profile = save.createEmptyProfile();
    profile.currency = 777;
    save.addCardToCollection(profile, "jutsu002", 2);
    assert.ok(save.saveProfile(profile));

    const loaded = save.loadProfile();
    assert.equal(loaded.currency, 777);
    assert.equal(loaded.cardCollection.jutsu002.quantity, 2);
});

test("deck respeita a coleção e o limite", async () => {
    const save = await import("../src/core/save.js");
    const profile = save.createEmptyProfile();
    save.addCardToCollection(profile, "jutsu002", 2);
    assert.ok(save.addCardToDeck(profile, "jutsu002"));
    assert.ok(save.addCardToDeck(profile, "jutsu002"));
    assert.equal(profile.deck.length, 2);
    assert.equal(save.addCardToDeck(profile, "jutsu002"), false, "não pode adicionar além da quantidade possuída");
    assert.ok(save.removeCardFromDeck(profile, "jutsu002"));
});

test("deck de batalha usa o deck montado", async () => {
    const save = await import("../src/core/save.js");
    const profile = save.createEmptyProfile();
    profile.deck = ["jutsu001", "taijutsu001"];
    assert.deepEqual(save.battleDeck(profile), ["jutsu001", "taijutsu001"]);
});

// ------------------------------------------------------- boot da interface
function makeElement(selector) {
    const element = {
        selector,
        id: selector.replace(/[^a-zA-Z0-9_-]/g, ""),
        innerHTML: "",
        textContent: "",
        value: "",
        hidden: false,
        dataset: {},
        style: {},
        classList: {
            add() {},
            remove() {},
            toggle() {},
            contains() { return false; }
        },
        addEventListener() {},
        removeEventListener() {},
        appendChild() {},
        removeChild() {},
        querySelector: () => null,
        querySelectorAll: () => [],
        getAttribute: () => null,
        setAttribute() {},
        focus() {},
        click() {},
        closest: () => null,
        getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 })
    };
    return element;
}

test("menu inicializa sem erro", async () => {
    const cache = new Map();
    const listeners = [];
    globalThis.document = {
        addEventListener(type, callback) { listeners.push(callback); },
        querySelector: (selector) => {
            if (!cache.has(selector)) cache.set(selector, makeElement(selector));
            return cache.get(selector);
        },
        querySelectorAll: () => [],
        getElementById: (id) => {
            if (!cache.has(`#${id}`)) cache.set(`#${id}`, makeElement(`#${id}`));
            return cache.get(`#${id}`);
        },
        createElement: (tag) => makeElement(tag),
        body: makeElement("body")
    };
    globalThis.window = { addEventListener() {}, location: { href: "" } };

    const save = await import("../src/core/save.js");
    save.clearProfile();
    globalThis.localStorage = {
        store: new Map(),
        getItem(key) { return this.store.has(key) ? this.store.get(key) : null; },
        setItem(key, value) { this.store.set(key, value); },
        removeItem(key) { this.store.delete(key); }
    };

    await import(`../src/ui/menu.js?boot=${Date.now()}`);
    assert.ok(listeners.length > 0, "o menu precisa se registrar no DOMContentLoaded");
    assert.doesNotThrow(() => listeners.forEach((callback) => callback({ type: "DOMContentLoaded" })));
});

test("tela de batalha inicializa sem erro", async () => {
    const cache = new Map();
    const listeners = [];
    globalThis.document = {
        addEventListener(type, callback) { listeners.push(callback); },
        querySelector: (selector) => {
            if (!cache.has(selector)) cache.set(selector, makeElement(selector));
            return cache.get(selector);
        },
        querySelectorAll: () => [],
        getElementById: (id) => {
            if (!cache.has(`#${id}`)) cache.set(`#${id}`, makeElement(`#${id}`));
            return cache.get(`#${id}`);
        },
        createElement: (tag) => makeElement(tag),
        body: makeElement("body")
    };
    globalThis.window = { addEventListener() {}, location: { href: "" } };
    globalThis.localStorage = {
        store: new Map(),
        getItem(key) { return this.store.has(key) ? this.store.get(key) : null; },
        setItem(key, value) { this.store.set(key, value); },
        removeItem(key) { this.store.delete(key); }
    };

    const save = await import("../src/core/save.js");
    save.clearProfile();
    const profile = save.createEmptyProfile();
    profile.character = {
        clanId: "folha",
        characterId: "naruto",
        name: "Naruto Uzumaki",
        element: "Vento",
        attributes: { forca: 6, agilidade: 6, chakra: 9, vitalidade: 8, controle: 5 }
    };
    profile.deck = ["jutsu001", "taijutsu001", "item001", "item002"];
    save.saveProfile(profile);

    await import(`../src/ui/battle.js?boot=${Date.now()}`);
    assert.ok(listeners.length > 0, "a batalha precisa se registrar no DOMContentLoaded");
    assert.doesNotThrow(() => listeners.forEach((callback) => callback({ type: "DOMContentLoaded" })));
});

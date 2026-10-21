#!/usr/bin/env node
/**
 * SERVIDOR DE DESENVOLVIMENTO — npm run dev
 *
 * Servidor estático, sem dependências, que espelha o layout do build:
 *   /              -> src/index.html
 *   /pages/*       -> src/pages/*
 *   /styles/*      -> src/styles/*
 *   /ui/*          -> src/ui/*
 *   /data/*        -> src/data/*
 *   /core/*        -> src/core/*
 *   /assets/*      -> assets/*
 */

import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const PORT = Number(process.env.PORT) || 4173;
const HOST = process.env.HOST || "0.0.0.0";

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".woff2": "font/woff2"
};

function resolveFile(urlPath) {
    const clean = decodeURIComponent(urlPath.split("?")[0]);
    if (clean === "/" || clean === "/index.html") return path.join(SRC, "index.html");

    const segments = clean.split("/").filter(Boolean);
    const [first, ...rest] = segments;
    if (!rest.length) return null;

    const bases = { pages: SRC, styles: SRC, ui: SRC, data: SRC, core: SRC, assets: ROOT };
    const base = bases[first];
    if (!base) return null;

    const candidate = path.join(base, first, ...rest);
    // impede sair da pasta permitida
    if (!candidate.startsWith(base)) return null;
    return candidate;
}

const server = createServer((request, response) => {
    const file = resolveFile(request.url || "/");
    if (!file || !existsSync(file) || !statSync(file).isFile()) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("404 — não encontrado");
        return;
    }
    const extension = path.extname(file).toLowerCase();
    response.writeHead(200, {
        "Content-Type": MIME[extension] || "application/octet-stream",
        "Cache-Control": "no-cache"
    });
    response.end(readFileSync(file));
});

server.listen(PORT, HOST, () => {
    console.log(`\n  Naruto Card (dev) rodando em http://localhost:${PORT}`);
    console.log(`  Modo: local e offline — sem servidor de jogo, sem online.\n`);
});

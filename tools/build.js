#!/usr/bin/env node
/**
 * BUILD — npm run build
 *
 * Gera a pasta dist/ com o site estático pronto para o Render:
 *   dist/index.html
 *   dist/pages/battle.html
 *   dist/styles, dist/ui, dist/data, dist/core
 *   dist/assets/cards/*.svg
 *
 * O build também roda o gerador de arte e o validador: se alguma carta
 * estiver sem designer, o build falha.
 */

import { cpSync, existsSync, mkdirSync, rmSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const DIST = path.join(ROOT, "dist");
const ASSETS = path.join(ROOT, "assets");

function run(script) {
    console.log(`\n▶ ${script}`);
    execFileSync(process.execPath, [path.join(ROOT, "tools", script)], { stdio: "inherit", cwd: ROOT });
}

function copyDir(from, to) {
    if (!existsSync(from)) return 0;
    mkdirSync(to, { recursive: true });
    cpSync(from, to, { recursive: true });
    return readdirSync(to).length;
}

function countFiles(dir) {
    if (!existsSync(dir)) return 0;
    return readdirSync(dir).reduce((total, entry) => {
        const full = path.join(dir, entry);
        return total + (statSync(full).isDirectory() ? countFiles(full) : 1);
    }, 0);
}

function main() {
    console.log("╔══════════════════════════════════════╗");
    console.log("║        BUILD — Naruto Card (v2)      ║");
    console.log("╚══════════════════════════════════════╝");

    run("generate-art.js");
    run("validate.js");

    if (existsSync(DIST)) rmSync(DIST, { recursive: true, force: true });
    mkdirSync(DIST, { recursive: true });

    copyDir(SRC, DIST);
    copyDir(ASSETS, path.join(DIST, "assets"));

    console.log("\n✔ Build concluído:");
    console.log(`  dist/index.html          (menu principal)`);
    console.log(`  dist/pages/battle.html   (combate)`);
    console.log(`  ${countFiles(DIST)} arquivos no total`);
    console.log("\n  Sirva localmente com: npm run dev  (ou copie a pasta dist/ para outro PC)");
}

main();

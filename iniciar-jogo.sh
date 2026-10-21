#!/usr/bin/env bash
# ============================================================
#  Naruto Card - inicia o servidor local e abre o navegador
#  Linux / macOS: ./iniciar-jogo.sh
# ============================================================
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
    echo "Node.js nao encontrado! Instale a versao 18 ou maior: https://nodejs.org"
    exit 1
fi

# abre o navegador assim que o servidor subir
(sleep 1; (xdg-open "http://localhost:4173" || open "http://localhost:4173") >/dev/null 2>&1 || true) &

node tools/serve.js

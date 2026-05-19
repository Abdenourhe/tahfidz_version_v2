#!/bin/bash
# Coller et exécuter dans le terminal VS Code à la racine du projet
echo "🧹 Nettoyage du cache webpack corrompu..."
rm -rf .next
rm -rf node_modules/.cache
echo "✅ Cache supprimé. Relancer avec : pnpm dev"

#!/usr/bin/env bash
# Baixa os builds oficiais do app mobile do Practice Software Testing (integrado à API v4).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p apps

BASE=https://testsmith.ams3.cdn.digitaloceanspaces.com/artifacts

if [ ! -f apps/practice-software-testing.apk ]; then
  echo "Baixando APK Android..."
  curl -fL --progress-bar -o apps/practice-software-testing.apk "$BASE/practice-software-testing.apk"
fi

if [ ! -d apps/ToolShop.app ]; then
  echo "Baixando build do simulador iOS..."
  curl -fL --progress-bar -o apps/ios-simulator.zip "$BASE/practice-software-testing.zip"
  unzip -q -o apps/ios-simulator.zip -d apps
  rm apps/ios-simulator.zip
fi

echo "Apps disponíveis em ./apps"

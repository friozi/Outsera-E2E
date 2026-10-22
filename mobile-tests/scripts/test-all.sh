#!/usr/bin/env bash
# Executa a suíte em Android e iOS e gera um único relatório Allure com as duas plataformas.
set -uo pipefail
cd "$(dirname "$0")/.."

rm -rf allure-results
export ALLURE_APPEND=true

npx wdio run config/wdio.android.conf.ts; android=$?
npx wdio run config/wdio.ios.conf.ts; ios=$?

echo "Resultado: Android=$([ $android -eq 0 ] && echo OK || echo FALHOU)  iOS=$([ $ios -eq 0 ] && echo OK || echo FALHOU)"
exit $(( android || ios ))

#!/usr/bin/env bash
# Corre las pruebas de lógica (Node) y las de DOM (Edge headless sobre tests/dom/*.html).
cd "$(dirname "$0")/.."
fail=0
node --test tests/unit/ || fail=1
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
# Perfil con ruta corta: con más de 260 caracteres fallan storage e IndexedDB.
PROFILE="C:/Users/artur/AppData/Local/Temp/cps-t"
for f in tests/dom/*.html; do
  out=$("$EDGE" --headless --disable-gpu --allow-file-access-from-files --virtual-time-budget=5000 \
    --user-data-dir="$PROFILE" --dump-dom "file:///$(cygpath -m "$PWD/$f")" 2>/dev/null \
    | grep -E '^(PASS|FAIL|RESULT)')
  echo "== $f"
  echo "$out"
  if ! echo "$out" | grep -q '^RESULT'; then echo "FAIL (sin RESULT)"; fail=1; fi
  if echo "$out" | grep -q '^FAIL'; then fail=1; fi
done
exit $fail

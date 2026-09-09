#!/bin/bash
cd "$(dirname "$0")" || exit 1
falhas=0

echo "═══ PLACEHOLDERS ═══"
achou=0
while IFS= read -r linha; do
  echo "  $linha"; achou=1
done < <(grep -rn "PLACEHOLDER\|data-placeholder" --include=*.html --include=*.js --include=*.css . 2>/dev/null | grep -v verificar.sh)
[ $achou -eq 0 ] && echo "  nenhum." || falhas=1
echo

echo "═══ NOINDEX (obrigatório até a Locaweb) ═══"
while IFS= read -r f; do
  if grep -q 'name="robots" content="noindex' "$f"; then echo "  ok     $f"; else echo "  FALTA  $f"; falhas=1; fi
done < <(find . -name "*.html" -not -path "./backup/*" -not -path "*/chrome-profile/*" | sort)
echo

echo "═══ LINKS INTERNOS QUEBRADOS ═══"
quebrou=0
for f in *.html; do
  for alvo in $(grep -o 'href="[a-z0-9_./-]*\.html[#a-zA-Z0-9_-]*"' "$f" | sed 's/href="//;s/"//;s/#.*//' | sort -u); do
    [ -e "$alvo" ] || { echo "  FALTA  $f -> $alvo"; quebrou=1; }
  done
done
for f in blog/*.html; do
  [ -e "$f" ] || continue
  for alvo in $(grep -o 'href="[a-z0-9_./-]*\.html[#a-zA-Z0-9_-]*"' "$f" | sed 's/href="//;s/"//;s/#.*//' | sort -u); do
    [ -e "blog/$alvo" ] || { echo "  FALTA  $f -> $alvo"; quebrou=1; }
  done
done
[ $quebrou -eq 0 ] && echo "  nenhum." || falhas=1
echo

echo "═══ ÂNCORAS QUEBRADAS ═══"
quebrou=0
for f in *.html blog/*.html; do
  [ -e "$f" ] || continue
  for a in $(grep -o 'href="#[a-zA-Z0-9_-]*"' "$f" | sed 's/href="#//;s/"//' | sort -u); do
    [ -z "$a" ] && continue
    grep -q "id=\"$a\"" "$f" || { echo "  QUEBRA  $f -> #$a"; quebrou=1; }
  done
  for a in $(grep -o 'href="index\.html#[a-zA-Z0-9_-]*"' "$f" | sed 's/.*#//;s/"//' | sort -u); do
    grep -q "id=\"$a\"" index.html || { echo "  QUEBRA  $f -> index.html#$a"; quebrou=1; }
  done
done
[ $quebrou -eq 0 ] && echo "  nenhuma." || falhas=1
echo

echo "═══ HEADER E RODAPÉ IGUAIS AO index.html ═══"
if python3 _moldura.py --conferir | sed 's/^/  /'; then :; else falhas=1; fi
echo

echo "═══ VERSÕES DE site.css E site.js ═══"
paginas=$(ls *.html blog/*.html 2>/dev/null | grep -v '^_')
vs=$(grep -ho 'href="css/site\.css?v=[^"]*"' $paginas 2>/dev/null | sort -u)
vj=$(grep -ho 'src="js/site\.js?v=[^"]*"' $paginas 2>/dev/null | sort -u)
sem=$(grep -l 'css/site\.css"' $paginas 2>/dev/null)
if [ "$(echo "$vs" | wc -l | tr -d ' ')" = "1" ] && [ "$(echo "$vj" | wc -l | tr -d ' ')" = "1" ] && [ -z "$sem" ]; then
  echo "  ok     $vs · $vj"
else
  echo "  DESALINHADO (rode ./_versionar.sh):"; echo "$vs" | sed 's/^/    /'; echo "$vj" | sed 's/^/    /'
  [ -n "$sem" ] && echo "    sem ?v=: $sem"
  falhas=1
fi
echo

echo "═══ ROBOTS ═══"
if [ -e robots.txt ]; then echo "  ok     robots.txt ($(grep -c Disallow robots.txt) Disallow)"; else echo "  FALTA  robots.txt"; falhas=1; fi
echo

[ $falhas -eq 0 ] && echo "✔ Tudo certo. Pode subir." || { echo "✘ Há pendência acima."; exit 1; }

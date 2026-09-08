#!/bin/bash
# Sobe o ?v= dos arquivos COMPARTILHADOS (css/site.css e js/site.js) em todas
# as páginas de uma vez — raiz e blog/. Duas páginas com versões diferentes do
# mesmo arquivo já renderam um "bug" que não existia (06_CENTRAL §7).
#
# Uso: ./_versionar.sh            (carimbo de hoje, sufixo -1)
#      ./_versionar.sh 20260908-3 (carimbo explícito)
#
# Arquivos de uma página só (central.css, hero.js, consolidacao.js,
# cadastro.js…) continuam versionados à mão, no próprio HTML.
cd "$(dirname "$0")" || exit 1
V="${1:-$(date +%Y%m%d)-1}"
for f in *.html blog/*.html; do
  [ -e "$f" ] || continue
  case "$(basename "$f")" in _*) continue ;; esac   # ferramenta, não página
  sed -i '' -E \
    -e "s#(href=\"css/site\.css)(\?v=[^\"]*)?\"#\1?v=$V\"#g" \
    -e "s#(src=\"js/site\.js)(\?v=[^\"]*)?\"#\1?v=$V\"#g" "$f"
done
echo "site.css e site.js em ?v=$V em: $(ls *.html blog/*.html 2>/dev/null | tr '\n' ' ')"

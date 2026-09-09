#!/bin/bash
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

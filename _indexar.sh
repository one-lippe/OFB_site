#!/bin/bash
cd "$(dirname "$0")" || exit 1
META='<meta name="robots" content="noindex, nofollow">'
case "$1" in
  off)
    while IFS= read -r f; do
      grep -q 'name="robots" content="noindex' "$f" || \
        sed -i '' "s#</title>#</title>\n$META#" "$f"
    done < <(find . -name "*.html" -not -path "./backup/*")
    printf 'User-agent: *\nDisallow: /\n' > robots.txt
    echo "prévia: noindex em todo HTML, robots.txt fechado"
    ;;
  on)
    while IFS= read -r f; do
      sed -i '' '/name="robots" content="noindex/d' "$f"
    done < <(find . -name "*.html" -not -path "./backup/*")
    printf 'User-agent: *\nAllow: /\nSitemap: https://www.ofb.com.br/sitemap.xml\n' > robots.txt
    echo "produção: noindex removido, robots.txt aberto com sitemap"
    ;;
  *) echo "uso: $0 on|off"; exit 1 ;;
esac

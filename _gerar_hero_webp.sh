#!/bin/bash
# Fallback WebP da sequência do hero, para navegador sem AVIF (Safari < 16.4,
# ~6% em 09/2026). Decidido em 03_HERO_ANALISE_TECNICA.md §9: o WebP não
# precisa de qualidade equivalente, precisa existir e pesar pouco. Por isso
# sai menor (1440×810) e em q80, não em q92.
#
# O intermediário é o próprio decodificador do ffmpeg (raw → webp), sem
# JPEG no meio — a regra do _gerar_hero.sh continua valendo.
#
# Uso: ./_gerar_hero_webp.sh        (gera hero/dw e hero/mw)
set -e
AQUI="$(cd "$(dirname "$0")" && pwd)"
VIDEO="$(dirname "$AQUI")/01_hero/HERO VIDEO.mp4"
Q="${1:-80}"
[ -f "$VIDEO" ] || { echo "vídeo não encontrado: $VIDEO"; exit 1; }

gerar () {   # nome filtro destino
  echo "── $1 ──"
  mkdir -p "$3"; rm -f "$3"/*.webp
  ffmpeg -v error -y -i "$VIDEO" -vf "$2" -c:v libwebp -quality "$Q" \
         -compression_level 6 -preset picture "$3/%04d.webp"
  echo "   $(ls "$3" | wc -l | tr -d ' ') quadros · $(du -sh "$3" | cut -f1)"
}
gerar "dw" "scale=1440:810" "$AQUI/hero/dw"
gerar "mw" "crop=720:1080:'600+140*clip((n-396)/92,0,1)':0,scale=540:810" "$AQUI/hero/mw"
echo "pronto · q$Q"

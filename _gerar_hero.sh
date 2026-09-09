#!/bin/bash
set -e
AQUI="$(cd "$(dirname "$0")" && pwd)"
VIDEO="$(dirname "$AQUI")/01_hero/HERO VIDEO.mp4"
CRF="${1:-24}"
TMP="/tmp/hero-ofb-$$"

[ -f "$VIDEO" ] || { echo "vídeo não encontrado: $VIDEO"; exit 1; }

gerar () {          # nome  filtro-de-escala  pasta-destino
  local nome="$1" filtro="$2" destino="$3"
  echo "── $nome ──"
  rm -rf "$TMP/$nome" "$TMP/out_$nome"
  mkdir -p "$TMP/$nome" "$TMP/out_$nome"
  ffmpeg -v error -y -i "$VIDEO" -vf "$filtro" "$TMP/$nome/%04d.png"
  echo "   $(ls "$TMP/$nome" | wc -l | tr -d ' ') quadros em PNG"
  ( cd "$TMP/$nome"
    n=0
    for f in *.png; do
      ffmpeg -v error -y -i "$f" -c:v libaom-av1 -crf "$CRF" -cpu-used 4 \
             -still-picture 1 -pix_fmt yuv444p10le \
             -f avif "../out_$nome/${f%.png}.avif" 2>/dev/null &
      n=$((n+1)); [ $((n % 8)) -eq 0 ] && wait
    done
    wait )
  mkdir -p "$destino"
  rm -f "$destino"/*.avif
  cp "$TMP/out_$nome"/*.avif "$destino/"
  echo "   $(ls "$destino" | wc -l | tr -d ' ') quadros · $(du -sh "$destino" | cut -f1)"
}

gerar "d" "scale=1920:1080" "$AQUI/hero/d"

gerar "m" "crop=720:1080:'600+140*clip((n-396)/92,0,1)':0,scale=720:1080" "$AQUI/hero/m"

ffmpeg -v error -y -i "$VIDEO" -vf "select='eq(n\,0)',scale=1920:1080" -vsync 0 -frames:v 1 -q:v 2 "$AQUI/hero/poster-d.jpg"
ffmpeg -v error -y -i "$VIDEO" -vf "select='eq(n\,0)',crop=720:1080:600:0,scale=720:1080" -vsync 0 -frames:v 1 -q:v 2 "$AQUI/hero/poster-m.jpg"

rm -rf "$TMP"
echo "pronto · crf $CRF"

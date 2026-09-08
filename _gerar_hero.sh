#!/bin/bash
# Gera a sequência de quadros do hero a partir do HERO VIDEO.mp4.
#
# A REGRA QUE NÃO SE QUEBRA: o intermediário é PNG, nunca JPEG.
# A primeira versão desta sequência usava JPEG entre o vídeo e o AVIF,
# e isso sozinho custava 7,7 dB de PSNR — mais do que a resolução e a
# compressão AVIF somadas. Medido em 03/09/2026:
#
#   vídeo → JPEG → AVIF   PSNR 36,0 dB   SSIM 0,969
#   vídeo → PNG  → AVIF   PSNR 43,7 dB   SSIM 0,979   (mesma resolução e crf)
#
# A SEGUNDA REGRA: o AVIF sai em 10 bits, não em 8.
# A cena da cabine fechada vive em 36 dos 255 níveis de cinza — 8 bits
# não tem precisão para um gradiente tão estreito e o resultado embanda.
# Em 10 bits o encoder trabalha com folga, devolve os 36 níveis inteiros
# e ainda pesa MENOS. Medido em 03/09/2026:
#
#   quadro    8 bits crf32        10 bits crf24
#      0      12 KB / 47,1 dB     8 KB / 48,1 dB
#     96      32 KB / 44,2 dB    24 KB / 45,0 dB
#    216      24 KB / 45,4 dB    20 KB / 45,7 dB
#    470     148 KB / 38,3 dB   148 KB / 39,6 dB
#
# Uso:  ./_gerar_hero.sh [crf]        (padrão 24, na escala de 10 bits)
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

# Desktop: resolução nativa do arquivo. Não adianta pedir mais do que o
# vídeo tem — para ganhar acima disso, o .aep precisa ser re-renderizado.
gerar "d" "scale=1920:1080" "$AQUI/hero/d"

# Celular: corte 2:3 com deslocamento, para o Farol da Barra não sair do
# quadro na chegada. Ver 03_HERO_ANALISE_TECNICA.md §5.
gerar "m" "crop=720:1080:'600+140*clip((n-396)/92,0,1)':0,scale=720:1080" "$AQUI/hero/m"

# Pôsteres. TEM QUE SER O QUADRO 0, que é onde a página abre — com o
# quadro 60 (janela aberta) o visitante via a janela abrir e a página
# "voltar" para a cabine fechada assim que o canvas assumia.
ffmpeg -v error -y -i "$VIDEO" -vf "select='eq(n\,0)',scale=1920:1080" -vsync 0 -frames:v 1 -q:v 2 "$AQUI/hero/poster-d.jpg"
ffmpeg -v error -y -i "$VIDEO" -vf "select='eq(n\,0)',crop=720:1080:600:0,scale=720:1080" -vsync 0 -frames:v 1 -q:v 2 "$AQUI/hero/poster-m.jpg"

rm -rf "$TMP"
echo "pronto · crf $CRF"

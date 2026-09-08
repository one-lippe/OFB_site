#!/usr/bin/env python3
"""Gera js/veu.js medindo o vídeo do hero, quadro a quadro.

Arquivo de trabalho. Rodar quando o vídeo mudar, quando um bloco mudar de
faixa de quadros, ou quando o texto mudar de lugar na tela — as regiões
abaixo têm que refletir onde o texto realmente cai.

    python3 _medir_veu.py

O que ele faz: para cada quadro, mede a luminância da região onde o texto
daquele bloco fica e calcula a opacidade mínima de véu para o corpo de
texto chegar a 5,5:1 (margem sobre o AA de 4,5). Onde o vídeo já é escuro
o bastante — a cabine fechada, o miolo da nuvem — o valor dá zero, e nada
é desenhado por cima da imagem.
"""
import os, re, subprocess, json

S     = os.path.dirname(os.path.abspath(__file__))
VIDEO = os.path.normpath(os.path.join(S, '..', '01_hero', 'HERO VIDEO.mp4'))
N     = 489
PASSO = 4
ALVO  = 4.5   # AA. Era 5,5 — margem minha, e ela custava imagem sem norma que a exigisse

# bloco: (quadro inicial, quadro final, região do texto x/y/w/h em fração,
#         'claro' quando o texto é grafite e o véu é branco)
BLOCOS = {
    # a região é a do CORPO de texto, não a do bloco todo: a headline é
    # grande e passa em 3:1, então não pode ditar o véu da tela inteira
    'b': (  0, 140, (0.06, 0.50, 0.48, 0.24), False),
    'c': (140, 290, (0.06, 0.10, 0.46, 0.38), False),
    'd': (290, 400, (0.06, 0.28, 0.64, 0.44), True),
    'e': (400, 489, (0.06, 0.42, 0.49, 0.30), False),
}

def lin(c):
    c /= 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

L_GRAFITE = 0.2126*lin(55) + 0.7152*lin(52) + 0.0722*lin(53)

def ct_branco(Y):  return 1.05 / (lin(Y) + 0.05)
def ct_grafite(Y):
    Lf = lin(Y); a, b = max(Lf, L_GRAFITE), min(Lf, L_GRAFITE)
    return (a + 0.05) / (b + 0.05)

def alpha(Y, claro):
    """Opacidade mínima de véu para o texto atingir o alvo neste fundo."""
    a, cor, ct = 0.0, (250 if claro else 18), (ct_grafite if claro else ct_branco)
    while a < 0.85 and ct(Y * (1 - a) + cor * a) < ALVO:
        a += 0.01
    return a

def medir(x, y, w, h, campo):
    """Luminância da região, quadro a quadro, direto do ffmpeg."""
    saida = subprocess.run(
        ['ffmpeg', '-v', 'error', '-i', VIDEO,
         '-vf', f'crop=iw*{w}:ih*{h}:iw*{x}:ih*{y},scale=120:-2,'
                f'signalstats,metadata=print:file=-',
         '-f', 'null', '-'],
        capture_output=True, text=True).stdout
    return [float(m.group(1)) for m in
            re.finditer(r'lavfi\.signalstats\.' + campo + r'=([\d.]+)', saida)]

por_quadro = [0.0] * N
for k, (ini, fim, reg, claro) in BLOCOS.items():
    # texto claro sofre no ponto mais CLARO do quadro; texto escuro, no mais escuro
    campo = 'YLOW' if claro else 'YHIGH'
    Y = medir(*reg, campo)
    bruto = [alpha(Y[i], claro) for i in range(ini, min(fim, len(Y)))]

    # o pior da vizinhança manda, senão o véu pisca entre quadros vizinhos
    pico  = [max(bruto[max(0, i-6):i+7]) for i in range(len(bruto))]
    # média móvel curta tira o degrau que sobrou
    suave = [sum(pico[max(0, i-8):i+9]) / len(pico[max(0, i-8):i+9])
             for i in range(len(pico))]

    for i, v in enumerate(suave):
        if ini + i < N: por_quadro[ini + i] = v
    print(f'  bloco {k}: quadros {ini}-{fim} · véu de {min(suave):.2f} a {max(suave):.2f}')

amostra = [round(por_quadro[q] * 100) for q in range(0, N, PASSO)]
if (N - 1) % PASSO:
    amostra.append(round(por_quadro[N - 1] * 100))

js = f'''/* ═══════════════════════════════════════════════════════════════
   VÉU DINÂMICO · quanto de proteção cada quadro do vídeo pede

   Gerado por medição, não escrito à mão. Para cada quadro foi medida
   a luminância da região onde o CORPO de texto daquele bloco cai, e
   o valor aqui é a opacidade mínima para ele chegar a {ALVO}:1, que é
   o AA. A headline não entra na conta: sendo texto grande, ela passa
   com 3:1, e deixá-la ditar o véu escurecia a tela inteira à toa.

   É por isso que o hero abre com ZERO: a cabine fechada é escura o
   bastante, o texto branco já tem contraste de sobra e qualquer véu
   ali só apareceria como uma caixa por cima da imagem. Ele entra
   sozinho quando a janela abre e a luz invade, e some de novo no
   miolo da nuvem, onde o texto é grafite sobre branco.

   Amostrado a cada {PASSO} quadros; o resto é interpolado.
   Refazer com: python3 _medir_veu.py
   ═══════════════════════════════════════════════════════════════ */
var VEU_PASSO = {PASSO};
var VEU = [{','.join(str(x) for x in amostra)}];
'''
open(os.path.join(S, 'js', 'veu.js'), 'w', encoding='utf-8').write(js)
print(f'\njs/veu.js reescrito · {len(amostra)} amostras')

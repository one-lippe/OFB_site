#!/usr/bin/env python3
"""Regenera _provas_fases.html a partir do index.html.

Arquivo de trabalho. As provas são uma CÓPIA dos blocos do index, então
precisam ser regeradas a cada mudança no HTML — senão mostram a versão
velha e a conferência mente. Rodar:  python3 _gerar_provas.py
"""
import os, re

S = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(S, 'index.html'), encoding='utf-8').read()


def bloco(fase):
    i = html.index('data-fase="%s"' % fase)
    i = html.rindex('<div class="fase ', 0, i)
    n = 0
    for m in re.finditer(r'</?div\b', html[i:]):
        n += 1 if html[i + m.start() + 1] != '/' else -1
        if n == 0:
            return html[i:html.index('>', i + m.end()) + 1]
    return ''

# (fase, nome, quadro do meio da faixa, PIOR quadro da faixa)
CASOS = [('b', '1 · Hero',              70, 140),
         ('c', '2 · Quem é a OFB',     215, 290),
         ('d', '6 · Portfólio',        330, 380)]

partes = []
for f, nome, meio, pior in CASOS:
    def conteudo(fase, t):
        if fase == 'd':
            if t < 0.58: return 1.0
            if t < 0.82: return 1 - (t - 0.58) / 0.24
            return 0.0
        return 1.0
    def camada(fase, t):
        if fase == 'c': return min(t / 0.14, 1)
        if fase == 'd':
            if t < 0.18: return (t / 0.18) * 0.62
            if t < 0.58: return 0.62
            if t < 0.90: return 0.62 * (1 - (t - 0.58) / 0.32)
            return 0.0
        return 0.0
    FAIXA = {'b': (0, 140), 'c': (140, 290), 'd': (290, 400)}
    casos = [('meio', 'meio da faixa', meio), ('pior', 'PIOR quadro da faixa', pior)]
    if f == 'b':
        casos.insert(0, ('abertura', 'ABERTURA · a janela fechada', 0))
    for q_id, rot, q in casos:
        ini, fim = FAIXA[f]
        t = (q - ini) / (fim - ini) if fim > ini else 0
        tt = max(0.0, min(1.0, t))
        c = camada(f, tt); k = conteudo(f, tt)
        corpo = bloco(f).replace('class="fase fase--', 'class="fase no-ar fase--')
        # o reveal roda no site pelo evento de fase; aqui a prova é parada,
        # então os grupos já entram revelados
        corpo = corpo.replace('class="pilares"', 'class="pilares revelado"')
        corpo = corpo.replace('class="secundarios"', 'class="secundarios revelado"')
        corpo = corpo.replace('data-fase="%s"' % f,
                              'data-fase="%s" style="--camada:%.3f;--conteudo:%.3f"' % (f, c, k), 1)
        partes.append(f'''
<div class="prova" data-f="{f}" data-q="{q_id}">
  <p class="prova-rotulo">BLOCO {nome} · {rot} · quadro {q} · camada {c:.2f} · conteúdo {k:.2f}</p>
  <div class="prova-tela">
    <img class="prova-fundo" src="hero/d/{q+1:04d}.avif" alt="">
    <div class="hero-palco">{corpo}</div>
  </div>
</div>''')

pagina = '''<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Provas · os quatro blocos sobre o vídeo</title>
<link rel="stylesheet" href="css/site.css">
<style>
  body { padding-top: 0; background: var(--cinza-fundo); }
  .prova { padding: 22px var(--gutter) 6px; }
  .prova-rotulo { font-size: 12.5px; font-weight: 600; color: var(--cinza-texto);
                  letter-spacing: .04em; text-transform: uppercase; margin-bottom: 9px; max-width: none; }
  .prova-tela { position: relative; height: 78vh; min-height: 540px; overflow: hidden;
                border-radius: var(--raio); background: var(--grafite); }
  .prova-fundo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .prova .hero-palco { position: absolute; inset: 0; z-index: 2; }
  .prova .fase { position: absolute; inset: 0; transition: none; }
  .aviso { padding: 26px var(--gutter); color: var(--cinza-texto); font-size: 14px; }
  .aviso b { color: var(--grafite); }
</style></head><body>
<div class="aviso"><b>Arquivo de trabalho.</b> Cada bloco aparece duas vezes: no meio da faixa de
vídeo dele e no <b>pior quadro</b> dessa faixa, que é onde o scrim precisa aguentar. Não é o site:
aqui não há scrubbing. Regerar com <code>python3 _gerar_provas.py</code> a cada mudança no
index.html. Apagar quando os blocos estiverem aprovados.<br>
Filtros: <code>?f=b|c|d|e</code> e <code>?q=meio|pior</code></div>
''' + "\n".join(partes) + '''
<script>
var u=new URLSearchParams(location.search), f=u.get('f'), q=u.get('q');
if(f||q){document.querySelectorAll('.prova').forEach(function(el){
  if((f&&el.dataset.f!==f)||(q&&el.dataset.q!==q)) el.remove();});
  var a=document.querySelector('.aviso'); if(a) a.remove();}
</script>
</body></html>'''

open(os.path.join(S, '_provas_fases.html'), 'w', encoding='utf-8').write(pagina)
print('_provas_fases.html regenerado a partir do index.html')

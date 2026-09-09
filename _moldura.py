#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, re, sys

AQUI = os.path.dirname(os.path.abspath(__file__))

PAGINAS = {
    "central.html":  "central.html",
    "cadastro.html": None,
    "blog.html":     "blog.html",
}

def recortar(texto, inicio, fim):
    a = texto.index(inicio)
    b = texto.index(fim, a) + len(fim)
    return a, b

def adaptar_header(header, ativo):
    header = re.sub(r'href="#([a-z0-9-]+)"', r'href="index.html#\1"', header)
    header = header.replace('href="index.html#pista"', 'href="index.html"')
    if ativo:
        header = header.replace(
            '<a href="%s">' % ativo,
            '<a class="ativo" href="%s" aria-current="page">' % ativo)
    return header

def main():
    fonte = open(os.path.join(AQUI, "index.html"), encoding="utf-8").read()
    ha, hb = recortar(fonte, '<header class="cabecalho">', "</header>")
    ra, rb = recortar(fonte, '<footer class="rodape"', "</footer>")
    header, rodape = fonte[ha:hb], fonte[ra:rb]

    so_conferir = "--conferir" in sys.argv
    diferentes = 0

    for pagina, ativo in PAGINAS.items():
        caminho = os.path.join(AQUI, pagina)
        if not os.path.exists(caminho):
            continue
        html = open(caminho, encoding="utf-8").read()
        novo = html

        pa, pb = recortar(novo, '<header class="cabecalho">', "</header>")
        novo = novo[:pa] + adaptar_header(header, ativo) + novo[pb:]

        pa, pb = recortar(novo, '<footer class="rodape"', "</footer>")
        novo = novo[:pa] + rodape + novo[pb:]

        if novo != html:
            diferentes += 1
            if so_conferir:
                print("DIFERE  %s (rode python3 _moldura.py)" % pagina)
            else:
                open(caminho, "w", encoding="utf-8").write(novo)
                print("ok      %s atualizado" % pagina)
        else:
            print("igual   %s" % pagina)

    if so_conferir and diferentes:
        sys.exit(1)

if __name__ == "__main__":
    main()

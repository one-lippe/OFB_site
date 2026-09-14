#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse, html, json, os, re, shutil, subprocess, sys
from datetime import datetime, timezone

AQUI  = os.path.dirname(os.path.abspath(__file__))
SITE  = "https://www.ofb.com.br"
TETO  = 300 * 1024

TRILHAS = {
    "noticia": "Notícia de turismo",
    "ofb":     "Conteúdo OFB",
}

CATEGORIAS = ["Destino", "Companhia aérea", "Tendência",
              "Produto", "Promoção", "Capacitação"]

MESES = ["", "janeiro", "fevereiro", "março", "abril", "maio", "junho",
         "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]

def recortar(texto, inicio, fim):
    a = texto.index(inicio)
    b = texto.index(fim, a) + len(fim)
    return texto[a:b]

def moldura(profundidade):
    fonte  = open(os.path.join(AQUI, "index.html"), encoding="utf-8").read()
    header = recortar(fonte, '<header class="cabecalho">', "</header>")
    veu    = '<div class="veu" aria-hidden="true"></div>'
    rodape = recortar(fonte, '<footer class="rodape"', "</footer>")

    sys.path.insert(0, AQUI)
    from _moldura import adaptar_header
    header = adaptar_header(header, "blog.html")

    if profundidade:
        sobe = "../"
        for bloco in ("header", "rodape"):
            pass
        header = re.sub(r'(href|src)="(?!https?:|#|mailto:|tel:)', r'\1="' + sobe, header)
        rodape = re.sub(r'(href|src)="(?!https?:|#|mailto:|tel:)', r'\1="' + sobe, rodape)

    return header + "\n" + veu, rodape

def preparar_imagem(origem, destino_rel, largura=1200):
    destino = os.path.join(AQUI, destino_rel)
    os.makedirs(os.path.dirname(destino), exist_ok=True)

    qualidade = 80
    while True:
        subprocess.run(["sips", "-s", "format", "jpeg",
                        "-s", "formatOptions", str(qualidade),
                        "--resampleWidth", str(largura),
                        origem, "--out", destino],
                       check=True, capture_output=True)
        if os.path.getsize(destino) <= TETO or qualidade <= 45:
            break
        qualidade -= 12

    return destino_rel, os.path.getsize(destino)

def escapar(t):
    return html.escape(t, quote=False)

def rico(texto):
    t = escapar(texto)
    t = re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)',
               r'<a href="\2" target="_blank" rel="noopener">\1</a>', t)
    t = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', t)
    return t

def corpo_html(blocos, slug, imagens):
    saida, lista_aberta = [], False

    for bloco in blocos:
        tipo = bloco["tipo"]

        if tipo != "item" and lista_aberta:
            saida.append("</ul>"); lista_aberta = False

        if tipo == "paragrafo":
            saida.append("<p>%s</p>" % rico(bloco["texto"]))

        elif tipo == "subtitulo":
            saida.append("<h2>%s</h2>" % escapar(bloco["texto"]))

        elif tipo == "item":
            if not lista_aberta:
                saida.append("<ul>"); lista_aberta = True
            saida.append("<li>%s</li>" % rico(bloco["texto"]))

        elif tipo == "citacao":
            saida.append("<blockquote><p>%s</p></blockquote>" % rico(bloco["texto"]))

        elif tipo == "imagem":
            rel, _ = preparar_imagem(
                os.path.join(AQUI, bloco["arquivo"]),
                "blog/img/%s-%d.jpg" % (slug, len(imagens) + 1))
            imagens.append(rel)
            legenda = bloco.get("legenda", "")
            saida.append(
                '<figure><img src="img/%s" alt="%s" loading="lazy">%s</figure>' % (
                    os.path.basename(rel), escapar(bloco.get("alt", legenda)),
                    "<figcaption>%s</figcaption>" % escapar(legenda) if legenda else ""))

    if lista_aberta:
        saida.append("</ul>")
    return "\n            ".join(saida)

def data_extenso(iso):
    d = datetime.strptime(iso, "%Y-%m-%d")
    return "%d de %s de %d" % (d.day, MESES[d.month], d.year)

def cabeca(titulo, descricao, css, capa=None, url=None, artigo=False):
    og = ""
    if capa:
        og = ('\n<meta property="og:image" content="%s/%s">' % (SITE, capa))
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

<title>{escapar(titulo)}</title>
<meta name="description" content="{escapar(descricao)}">

<meta name="robots" content="noindex, nofollow">

<meta property="og:type" content="{'article' if artigo else 'website'}">
<meta property="og:title" content="{escapar(titulo)}">
<meta property="og:description" content="{escapar(descricao)}">{og}
<meta property="og:url" content="{SITE}/{url}">

<link rel="icon" type="image/png" href="{css['raiz']}img/favicon.png">
<link rel="alternate" type="application/rss+xml" title="Blog da OFB" href="{css['raiz']}feed.xml">

<link rel="preload" href="{css['raiz']}fonts/Montserrat-ExtraBold.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{css['raiz']}fonts/Montserrat-Regular.woff2"   as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{css['site']}?v={css['v_css']}">
<link rel="stylesheet" href="{css['blog']}?v={css['v_blog']}">
</head>
<body>

<a class="pular" href="#conteudo">Pular para o conteúdo</a>
"""

def gerar_post(post, header, rodape, css):
    imagens = []
    capa_rel, _ = preparar_imagem(os.path.join(AQUI, post["capa"]),
                                  "blog/img/%s-capa.jpg" % post["slug"], 1600)
    corpo = corpo_html(post["corpo"], post["slug"], imagens)

    pagina = cabeca(post["titulo"] + " · Blog da OFB", post["trecho"], css,
                    capa=capa_rel, url="blog/%s.html" % post["slug"], artigo=True)

    pagina += f"""{header}

<main id="conteudo">

<article class="post">

    <header class="post-topo">
        <div class="container">
            <p class="post-migalha"><a href="../blog.html">Blog</a></p>
            <p class="post-etiquetas">
                <span class="post-trilha">{TRILHAS[post['trilha']]}</span>
                <span class="post-categoria">{escapar(post['categoria'])}</span>
            </p>
            <h1>{escapar(post['titulo'])}</h1>
            <p class="post-trecho">{escapar(post['trecho'])}</p>
            <p class="post-data">
                <time datetime="{post['data']}">{data_extenso(post['data'])}</time>
                <span class="post-assina">por OFB</span>
            </p>
        </div>
    </header>

    <figure class="post-capa">
        <img src="img/{os.path.basename(capa_rel)}" alt="{escapar(post.get('capa_alt', ''))}"
             width="1600" height="900">
    </figure>

    <div class="post-corpo">
        <div class="container">
            {corpo}
        </div>
    </div>

    <footer class="post-fim">
        <div class="container">
            <a class="btn btn--secundario" href="../blog.html">Ver todos os posts</a>
        </div>
    </footer>

</article>

</main>

{rodape}

<script src="{css['raiz']}js/site.js?v={css['v_js']}"></script>
</body>
</html>
"""
    destino = os.path.join(AQUI, "blog", post["slug"] + ".html")
    open(destino, "w", encoding="utf-8").write(pagina)
    return capa_rel

def simplificar(t):
    import unicodedata
    t = unicodedata.normalize("NFD", t.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9 ]+", " ", t).strip()


def slug_categoria(c):
    return simplificar(c).replace(" ", "-")


SCRIPT_LISTAGEM = """
(function () {
'use strict';
var trilhas    = Array.prototype.slice.call(document.querySelectorAll('[data-trilha][type]'));
var categorias = Array.prototype.slice.call(document.querySelectorAll('[data-categoria][type]'));
var itens      = Array.prototype.slice.call(document.querySelectorAll('.lista-item'));
var busca      = document.querySelector('[data-busca]');
var vazio      = document.querySelector('[data-vazio]');
var conta      = document.querySelector('[data-contagem]');
if (!itens.length) return;

var trilha = 'todas', categoria = 'todas', termo = '';

function simplificar(t) {
    return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]+/g, ' ').trim();
}

itens.forEach(function (item) {
    item.setAttribute('data-indice', simplificar(item.getAttribute('data-termos') || item.textContent));
});

function aplicar() {
    var palavras = termo ? termo.split(/\s+/) : [];
    var vistos = 0;
    itens.forEach(function (item) {
        var fica = (trilha === 'todas' || item.getAttribute('data-trilha') === trilha)
                && (categoria === 'todas' || item.getAttribute('data-categoria') === categoria);
        if (fica && palavras.length) {
            var indice = item.getAttribute('data-indice');
            fica = palavras.every(function (p) { return indice.indexOf(p) >= 0; });
        }
        item.hidden = !fica;
        if (fica) vistos++;
    });
    if (vazio) {
        vazio.hidden = vistos > 0;
        vazio.textContent = termo ? 'Nada encontrado para \u201c' + busca.value.trim() + '\u201d.' : 'Nenhum post deste tipo ainda.';
    }
    if (conta) conta.textContent = vistos === 0 ? 'Nenhum post na tela.' : vistos + (vistos === 1 ? ' post na tela.' : ' posts na tela.');
}

function ligar(botoes, atributo, definir) {
    botoes.forEach(function (botao) {
        botao.addEventListener('click', function () {
            botoes.forEach(function (b) { b.setAttribute('aria-pressed', b === botao ? 'true' : 'false'); });
            definir(botao.getAttribute(atributo));
            aplicar();
        });
    });
}
ligar(trilhas, 'data-trilha', function (v) { trilha = v; });
ligar(categorias, 'data-categoria', function (v) { categoria = v; });

if (busca) {
    busca.addEventListener('input', function () { termo = simplificar(busca.value.trim()); aplicar(); });
    busca.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && busca.value) { busca.value = ''; termo = ''; aplicar(); }
    });
}
aplicar();
})();
"""


def gerar_listagem(posts, capas, header, rodape, css):
    cartoes = []
    for post in posts:
        termos = " ".join([post["titulo"], post["trecho"], post["categoria"],
                           TRILHAS[post["trilha"]], post.get("termos", "")])
        cartoes.append(f"""
            <li class="lista-item" data-trilha="{post['trilha']}" data-categoria="{slug_categoria(post['categoria'])}"
                data-termos="{escapar(simplificar(termos))}">
                <a class="lista-cartao" href="blog/{post['slug']}.html">
                    <span class="lista-capa">
                        <img src="{capas[post['slug']]}" alt="" loading="lazy"
                             width="1600" height="900">
                    </span>
                    <span class="lista-texto">
                        <span class="lista-etiquetas">
                            <span class="post-trilha">{TRILHAS[post['trilha']]}</span>
                            <span class="post-categoria">{escapar(post['categoria'])}</span>
                        </span>
                        <span class="lista-titulo">{escapar(post['titulo'])}</span>
                        <span class="lista-trecho">{escapar(post['trecho'])}</span>
                        <time datetime="{post['data']}">{data_extenso(post['data'])}</time>
                    </span>
                </a>
            </li>""")

    presentes = []
    for post in posts:
        if post["categoria"] not in presentes:
            presentes.append(post["categoria"])
    assuntos = ['\n            <button class="filtro filtro--assunto" type="button" data-categoria="%s" aria-pressed="false">%s</button>'
                % (slug_categoria(c), escapar(c)) for c in CATEGORIAS if c in presentes]

    pagina = cabeca("Blog · OFB",
                    "Notícias de turismo e conteúdo da OFB para agências de viagens.",
                    css, url="blog.html")

    pagina += f"""{header}

<main id="conteudo">

<section class="secao" id="blog" aria-labelledby="blog-titulo">
    <div class="container">

        <div class="secao-cabeca" data-revela>
            <h1 id="blog-titulo">Blog</h1>
            <p class="subtitulo">Notícia de turismo e conteúdo da OFB, para quem vende viagem.</p>
        </div>

        <div class="controles">
            <div class="filtros" role="group" aria-label="Filtrar por tipo">
                <button class="filtro" type="button" data-trilha="todas"    aria-pressed="true">Todos</button>
                <button class="filtro" type="button" data-trilha="noticia"  aria-pressed="false">Notícia de turismo</button>
                <button class="filtro" type="button" data-trilha="ofb"      aria-pressed="false">Conteúdo OFB</button>
            </div>
            <div class="busca">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="7"/>
                    <path d="M20 20l-3.5-3.5"/>
                </svg>
                <label class="sr-only" for="busca-blog">Buscar post por assunto, destino ou título</label>
                <input id="busca-blog" type="search" data-busca autocomplete="off"
                       placeholder="Buscar assunto, destino ou título">
            </div>
        </div>

        <div class="filtros filtros--assuntos" role="group" aria-label="Filtrar por assunto">
            <button class="filtro filtro--assunto" type="button" data-categoria="todas" aria-pressed="true">Todos os assuntos</button>{''.join(assuntos)}
        </div>

        <p class="sr-only" role="status" data-contagem></p>

        <ul class="lista">{''.join(cartoes)}
        </ul>

        <p class="vazio" data-vazio hidden>Nenhum post deste tipo ainda.</p>

    </div>
</section>

</main>

{rodape}

<script src="js/site.js?v={css['v_js']}"></script>
<script>{SCRIPT_LISTAGEM}</script>
</body>
</html>
"""
    open(os.path.join(AQUI, "blog.html"), "w", encoding="utf-8").write(pagina)

def gerar_creditos(posts):
    linhas = ["Créditos das imagens do blog. Gerado por _gerar_blog.py — não editar à mão.",
              ""]
    for post in posts:
        if post.get("credito"):
            linhas.append("%s-capa.jpg: %s" % (post["slug"], post["credito"]))
    open(os.path.join(AQUI, "blog", "img", "CREDITS.txt"), "w",
         encoding="utf-8").write("\n".join(linhas) + "\n")

def gerar_sitemap(posts):
    hoje = datetime.now().strftime("%Y-%m-%d")
    urls = ['  <url><loc>%s/</loc><lastmod>%s</lastmod></url>' % (SITE, hoje),
            '  <url><loc>%s/central.html</loc><lastmod>%s</lastmod></url>' % (SITE, hoje),
            '  <url><loc>%s/cadastro.html</loc><lastmod>%s</lastmod></url>' % (SITE, hoje),
            '  <url><loc>%s/blog.html</loc><lastmod>%s</lastmod></url>' % (SITE, hoje)]
    for post in posts:
        urls.append('  <url><loc>%s/blog/%s.html</loc><lastmod>%s</lastmod></url>'
                    % (SITE, post["slug"], post["data"]))
    open(os.path.join(AQUI, "sitemap.xml"), "w", encoding="utf-8").write(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls) + "\n</urlset>\n")

def gerar_feed(posts):
    agora = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")
    itens = []
    for post in posts:
        pub = datetime.strptime(post["data"], "%Y-%m-%d").strftime("%a, %d %b %Y 09:00:00 +0000")
        itens.append("""    <item>
      <title>%s</title>
      <link>%s/blog/%s.html</link>
      <guid>%s/blog/%s.html</guid>
      <description>%s</description>
      <pubDate>%s</pubDate>
    </item>""" % (escapar(post["titulo"]), SITE, post["slug"], SITE, post["slug"],
                  escapar(post["trecho"]), pub))

    open(os.path.join(AQUI, "feed.xml"), "w", encoding="utf-8").write(
        """<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Blog da OFB</title>
    <link>%s/blog.html</link>
    <description>Notícia de turismo e conteúdo da OFB, para quem vende viagem.</description>
    <language>pt-BR</language>
    <lastBuildDate>%s</lastBuildDate>
%s
  </channel>
</rss>
""" % (SITE, agora, "\n".join(itens)))

def ler_exemplo():
    caminho = os.path.join(AQUI, "_blog_fonte", "posts.json")
    return json.load(open(caminho, encoding="utf-8"))

NOTION_DB = "c7ef994d89c24c988e800c2723060952"
NOTION_TRILHA = {"Notícia de turismo": "noticia", "Conteúdo OFB": "ofb"}

def notion_api(caminho, token, corpo=None):
    import urllib.request
    req = urllib.request.Request(
        "https://api.notion.com/v1/" + caminho,
        data=json.dumps(corpo).encode() if corpo is not None else None,
        headers={"Authorization": "Bearer " + token,
                 "Notion-Version": "2022-06-28",
                 "Content-Type": "application/json"},
        method="POST" if corpo is not None else "GET")
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)

def notion_texto(rich):
    partes = []
    for t in rich:
        txt = t.get("plain_text", "")
        if t.get("annotations", {}).get("bold"):
            txt = "**%s**" % txt
        if t.get("href"):
            txt = "[%s](%s)" % (txt, t["href"])
        partes.append(txt)
    return "".join(partes)

def notion_baixar(url, destino_rel):
    import urllib.request
    destino = os.path.join(AQUI, destino_rel)
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    urllib.request.urlretrieve(url, destino)
    return destino_rel

def notion_blocos(page_id, token, slug):
    blocos, cursor, n_img = [], None, 0
    while True:
        q = "blocks/%s/children?page_size=100" % page_id + ("&start_cursor=" + cursor if cursor else "")
        r = notion_api(q, token)
        for b in r.get("results", []):
            tipo = b["type"]
            dado = b.get(tipo, {})
            if tipo == "paragraph":
                txt = notion_texto(dado.get("rich_text", []))
                if txt.strip():
                    blocos.append({"tipo": "paragrafo", "texto": txt})
            elif tipo in ("heading_1", "heading_2", "heading_3"):
                blocos.append({"tipo": "subtitulo", "texto": notion_texto(dado.get("rich_text", []))})
            elif tipo in ("bulleted_list_item", "numbered_list_item"):
                blocos.append({"tipo": "item", "texto": notion_texto(dado.get("rich_text", []))})
            elif tipo == "quote":
                blocos.append({"tipo": "citacao", "texto": notion_texto(dado.get("rich_text", []))})
            elif tipo == "image":
                n_img += 1
                url = (dado.get("file") or dado.get("external") or {}).get("url", "")
                if not url:
                    continue
                ext = os.path.splitext(url.split("?")[0])[1] or ".jpg"
                rel = notion_baixar(url, "_blog_fonte/notion_cache/%s-%d%s" % (slug, n_img, ext))
                legenda = notion_texto(dado.get("caption", []))
                blocos.append({"tipo": "imagem", "arquivo": rel, "legenda": legenda, "alt": legenda})

        if not r.get("has_more"):
            break
        cursor = r.get("next_cursor")
    return blocos

def notion_prop(props, nome, tipo):
    p = props.get(nome, {})
    if tipo == "title":
        return "".join(t.get("plain_text", "") for t in p.get("title", []))
    if tipo == "rich_text":
        return "".join(t.get("plain_text", "") for t in p.get("rich_text", []))
    if tipo == "select":
        return (p.get("select") or {}).get("name", "")
    if tipo == "date":
        return (p.get("date") or {}).get("start", "")
    if tipo == "files":
        arqs = p.get("files", [])
        if not arqs:
            return ""
        a = arqs[0]
        return (a.get("file") or a.get("external") or {}).get("url", "")
    return ""

def ler_notion_rest(token):
    r = notion_api("databases/%s/query" % NOTION_DB, token, {
        "filter": {"property": "Status", "select": {"equals": "Publicado"}},
        "sorts": [{"property": "Data de publicação", "direction": "descending"}],
        "page_size": 100})
    posts = []
    for pg in r.get("results", []):
        pr = pg["properties"]
        slug = notion_prop(pr, "Slug", "rich_text").strip()
        titulo = notion_prop(pr, "Título", "title")
        if not slug:
            print("  pulado (sem slug): %s" % titulo)
            continue
        capa_url = notion_prop(pr, "Capa", "files")
        capa = notion_baixar(capa_url, "_blog_fonte/notion_cache/%s-capa.jpg" % slug) if capa_url else ""
        posts.append({
            "titulo":    titulo,
            "slug":      slug,
            "trilha":    NOTION_TRILHA.get(notion_prop(pr, "Tipo", "select"), "ofb"),
            "categoria": notion_prop(pr, "Categoria", "select"),
            "data":      notion_prop(pr, "Data de publicação", "date")[:10],
            "status":    "publicado",
            "capa":      capa,
            "capa_alt":  "",
            "trecho":    notion_prop(pr, "Trecho", "rich_text"),
            "corpo":     notion_blocos(pg["id"], token, slug),
        })
    return posts

def ler_notion():
    token = os.environ.get("NOTION_TOKEN", "").strip()
    if token:
        print("fonte: Notion pela API (NOTION_TOKEN)")
        return ler_notion_rest(token)

    export = os.path.join(AQUI, "_blog_fonte", "notion.json")
    if os.path.exists(export):
        print("fonte: %s (export do Notion no contrato da §3.2)" % os.path.relpath(export, AQUI))
        return json.load(open(export, encoding="utf-8"))

    raise SystemExit(
        "Sem NOTION_TOKEN no ambiente e sem _blog_fonte/notion.json.\n"
        "Dois caminhos: exportar NOTION_TOKEN (integração interna do Notion com a base\n"
        "'Posts do Blog' compartilhada) ou pedir a uma sessão do Claude para gravar\n"
        "_blog_fonte/notion.json a partir da base, no contrato de _blog_fonte/posts.json.")

def main():
    ap = argparse.ArgumentParser(description="Gera o blog da OFB.")
    ap.add_argument("--fonte", choices=["exemplo", "notion"], default="exemplo")
    ap.add_argument("--listar", action="store_true",
                    help="só mostra o que a fonte tem (inclusive rascunho), sem escrever nada")
    args = ap.parse_args()

    posts = (ler_exemplo() if args.fonte == "exemplo" else ler_notion())

    if args.listar:
        for p in posts:
            print("%-10s %s  %-32s %s" % (p.get("status", "?"), p.get("data", "?"), p.get("slug", "?"), p.get("titulo", "")))
        return

    posts = [p for p in posts if p.get("status") == "publicado"]
    posts.sort(key=lambda p: p["data"], reverse=True)

    if not posts:
        raise SystemExit("Nenhum post publicado na fonte. Nada foi escrito.")

    fonte = open(os.path.join(AQUI, "index.html"), encoding="utf-8").read()
    v_css = re.search(r'css/site\.css\?v=([^"\']+)', fonte)
    v_js  = re.search(r'js/site\.js\?v=([^"\']+)', fonte)
    versoes = {"v_css": v_css.group(1) if v_css else "1",
               "v_js":  v_js.group(1)  if v_js  else "1",
               "v_blog": datetime.now().strftime("%Y%m%d")}
    css_raiz  = dict(raiz="",    site="css/site.css",    blog="blog/blog.css", **versoes)
    css_dentro= dict(raiz="../", site="../css/site.css", blog="blog.css",      **versoes)

    header_raiz,   rodape_raiz   = moldura(0)
    header_dentro, rodape_dentro = moldura(1)

    capas = {}
    for post in posts:
        capa = gerar_post(post, header_dentro, rodape_dentro, css_dentro)
        capas[post["slug"]] = capa

    gerar_listagem(posts, capas, header_raiz, rodape_raiz, css_raiz)
    gerar_creditos(posts)
    gerar_sitemap(posts)
    gerar_feed(posts)

    print("blog.html          %d post%s" % (len(posts), "" if len(posts) == 1 else "s"))
    for post in posts:
        print("blog/%-28s %s · %s" % (post["slug"] + ".html", post["data"], TRILHAS[post["trilha"]]))
    print("sitemap.xml, feed.xml, blog/img/CREDITS.txt")
    total = sum(os.path.getsize(os.path.join(AQUI, "blog/img", f))
                for f in os.listdir(os.path.join(AQUI, "blog/img")))
    print("blog/img/          %d arquivos, %.0f KB" % (
        len(os.listdir(os.path.join(AQUI, "blog/img"))), total / 1024))

if __name__ == "__main__":
    main()

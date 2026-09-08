# Fontes do blog

O `_gerar_blog.py` lê os posts de uma destas fontes e escreve `blog.html`, `blog/<slug>.html`,
`blog/img/`, `sitemap.xml` e `feed.xml`. O contrato de campos é sempre o mesmo, o da §3.2 do
`07_BLOG_CENTRAL_E_HUB_decisoes.md` — só o adaptador muda.

| Fonte | Comando | O que é |
|---|---|---|
| `posts.json` | `python3 _gerar_blog.py` (ou `--fonte exemplo`) | **Três posts de exemplo, não aprovados.** Serviram para desenhar e testar o gerador. É o que está no ar na prévia enquanto a base do Notion não tem post publicado |
| Notion pela API | `NOTION_TOKEN=… python3 _gerar_blog.py --fonte notion` | Lê direto a base **Posts do Blog** (Notion › OFB › Blog do Site). Precisa de um token de integração interna do Notion, com a base compartilhada com a integração. Só `Status = Publicado` entra; imagens são baixadas para `notion_cache/` |
| `notion.json` | `python3 _gerar_blog.py --fonte notion` (sem token) | Export da base no mesmo contrato, gravado por uma sessão do Claude pela conexão MCP do Notion. Hoje contém só o post `[TESTE]`, em rascunho — e por isso o gerador recusa gerar a partir dele, que é o comportamento certo |

`--listar` mostra o que a fonte tem, inclusive rascunho, sem escrever nada.

**Para o blog subir com conteúdo real:** escrever o post no Notion, pôr em `Publicado`, e rodar o
gerador com uma das duas fontes do Notion. Publicar (FTP) continua sendo o passo que só existe
depois que o site estiver na Locaweb (§3.4 das decisões).

As imagens de `unsplash/` vêm do que já existia no projeto, com os créditos de `unsplash/CREDITS.txt`.

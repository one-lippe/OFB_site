# Publicar o site OFB · o passo a passo das etapas 2 e 3

> Escrito em 08/09/2026. Segue o plano de `03_TECNOLOGIA_E_PUBLICACAO.md`.
> **Nada aqui roda sem o "pode" explícito do Lippe.** Este arquivo prepara; quem aperta é ele.

---

## Antes de qualquer subida

```bash
cd 05_site
./verificar.sh          # tem que terminar em "✔ Tudo certo"
```

O `verificar.sh` confere placeholder, `noindex` em todo HTML, link e âncora quebrados, header
e rodapé iguais ao `index.html`, `?v=` alinhado e `robots.txt`. Se acusar versão desalinhada,
`./_versionar.sh`; se acusar header ou rodapé, `python3 _moldura.py`.

O hero mostra em Safari defeito que o Chrome esconde: conferência em Chrome vale para layout, não para o scrubbing.

---

## Etapa 2 · GitHub Pages, a prévia para os decisores

O que já está pronto para esta etapa:

| Item | Estado |
|---|---|
| `noindex` em todo HTML | ✔ (`./_indexar.sh off` repõe se algo escapar) |
| `robots.txt` bloqueando tudo | ✔ |
| `.gitignore` deixando de fora `_teste/`, provas, originais do Unsplash, cache do Notion | ✔ |
| Repositório git em `05_site/`, branch `main` | ✔ `one-lippe/OFB_site` |
| Fallback WebP do hero para Safari antigo | ✔ `hero/dw` e `hero/mw` |
| Formulário de cadastro | funciona em modo prévia: abre o e-mail do agente com a ficha preenchida |

### Feito em 08/09/2026, com o "pode" do Lippe

- Repositório **`one-lippe/OFB_site`** (público), remoto `origin` por HTTPS, credencial no keychain
  do macOS (`git credential-osxkeychain`, usuário `one-lippe`)
- `main` no ar e Pages ligado pela API (branch `main`, pasta raiz)
- **Prévia: `https://one-lippe.github.io/OFB_site/`**

Para atualizar a prévia depois de qualquer mudança:
```bash
cd 05_site
./verificar.sh && git add <caminhos> && git commit -m "…" && git push
```
O Pages reconstrói sozinho em um ou dois minutos.

⚠️ Em site de projeto do Pages o `robots.txt` fica em `/OFB_site/robots.txt`, e os buscadores só
leem o da raiz do domínio. Quem segura a indexação na prévia é o `<meta name="robots" noindex>`
de cada página — e é por isso que o `verificar.sh` confere página por página.

O Lippe confere no Safari e no celular: hero, Central, blog, cadastro (o envio abre o e-mail com
a ficha; é o esperado na prévia).

**Peso do repositório:** ~60 MB, quase tudo hero (`d` 18 MB, `m` 8,5 MB, `dw` 20 MB, `mw` 8,5 MB).
Dentro do limite do Pages (1 GB), mas o primeiro push demora.

**O que não é para fazer na prévia:** tirar o `noindex`, abrir o `robots.txt`, apontar domínio.

---

## Etapa 3 · Locaweb + DNS, o site no ar em ofb.com.br

### 3.1 Conferir antes

- [ ] Hospedagem Locaweb da OFB: qual plano, **roda PHP?** (o `cadastro.php` precisa), tem painel/cPanel, qual a pasta pública (`public_html/` ou equivalente)
- [ ] Credenciais de FTP: as mesmas da skill `email-mkt-ofb`. Reutilizar, não duplicar
- [ ] `cadastro.php`, linha `REMETENTE`: precisa ser um e-mail do domínio `ofb.com.br` que exista
  (a Locaweb recusa `From` de fora do domínio). Confirmar com a OFB qual
- [ ] `cadastro.php`, linha `DESTINO`: `comercial@ofb.com.br` recebe as fichas? Confirmar
- [ ] O post `[TESTE]` do Notion segue em Rascunho; o blog no ar sobe com os três posts de
  exemplo **ou** com posts reais já em `Publicado` na base. Decidir e regerar
  (`python3 _gerar_blog.py --fonte notion`; ver `_blog_fonte/LEIA.md`)

### 3.2 Preparar os arquivos

```bash
cd 05_site
./_indexar.sh on        # tira o noindex de todo HTML, abre o robots.txt com o sitemap
./_versionar.sh         # carimbo novo, para ninguém pegar cache da prévia
./verificar.sh          # vai acusar "FALTA noindex" em tudo — nesta etapa é o certo
```

Subir por FTP **tudo que não está no `.gitignore`**, com a pasta `hero/` inteira.
Depois, abrir `https://www.ofb.com.br/cadastro.html` e enviar uma ficha de teste: o e-mail
tem que chegar no `DESTINO`. Se não chegar, é `REMETENTE` ou PHP desligado — ver 3.1.

### 3.3 DNS · o único passo com risco real

O domínio hoje aponta para o Wix. O e-mail da OFB (`comercial@ofb.com.br`) vive no mesmo DNS.

**Antes de mudar qualquer coisa**, exportar a zona atual e guardar:

```bash
dig ofb.com.br ANY +noall +answer
dig ofb.com.br MX  +noall +answer
dig ofb.com.br TXT +noall +answer          # SPF, verificações
dig _dmarc.ofb.com.br TXT +noall +answer
dig default._domainkey.ofb.com.br TXT +noall +answer   # DKIM, se houver
dig www.ofb.com.br CNAME +noall +answer
```

Depois, no painel de DNS, mudar **só**:

| Registro | De | Para |
|---|---|---|
| `A` @ (raiz) | IP do Wix | IP da hospedagem Locaweb |
| `CNAME` www | Wix | o que a Locaweb indicar |

**Não tocar:** `MX`, `TXT` (SPF/DKIM/DMARC), qualquer CNAME de serviço (Google Workspace,
verificação de domínio, etc.). Se o painel de DNS for o do próprio Wix, migrar a zona inteira
para o registrador **copiando os MX primeiro** e conferindo com `dig` antes de trocar o NS.

Propagação leva de minutos a 48h. Nesse intervalo o site pode alternar entre Wix e Locaweb;
não é defeito.

### 3.4 Depois que estiver no ar

- [ ] `https://www.ofb.com.br/robots.txt` mostra `Allow: /` e o sitemap
- [ ] Nenhuma página com `noindex` (`view-source`, procurar `robots`)
- [ ] Google Search Console: enviar `sitemap.xml`
- [ ] Wix: **não** cancelar o plano no mesmo dia; esperar o DNS assentar e o e-mail comprovado
- [ ] Ligar a Etapa 5 das promoções e a skill de publicar o blog (`07_BLOG_CENTRAL_E_HUB_decisoes.md`
  §3.4): só agora o caminho de publicação existe

---

## Ferramentas desta pasta

| Arquivo | O que faz |
|---|---|
| `verificar.sh` | roda antes de qualquer subida |
| `_versionar.sh` | sobe o `?v=` de `site.css` e `site.js` em todas as páginas |
| `_moldura.py` | copia header e rodapé do `index.html` para `central.html`, `cadastro.html`, `blog.html` |
| `_indexar.sh on\|off` | liga ou desliga `noindex` + `robots.txt` no site inteiro |
| `_gerar_blog.py` | regera o blog (`--fonte exemplo` ou `--fonte notion`, `--listar` para conferir) |
| `_gerar_hero.sh` | regera a sequência AVIF do hero |
| `_gerar_hero_webp.sh` | regera o fallback WebP |

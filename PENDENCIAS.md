# Pendências do site OFB

Atualizado em 08/09/2026, ao fim da sessão que fechou as pendências da v1 e preparou a publicação.
Cada item diz de quem é a bola. O site continua em **modo prévia**: `noindex` em tudo, `robots.txt` fechado.

---

## Estado do site hoje

| Página | Estado |
|---|---|
| **Home** `index.html` | hero em scrubbing (4 telas) → Consolidação aérea (bilhete e carimbo) → agente.tur (3 telas reais) → **Central do Agente + Promoções** (dois cartões, feito em 08/09) → rodapé |
| **Central** `central.html` | banner com foto e texto em HTML (v2, 08/09) → 24 promoções com filtro, busca, lupa e download com logo → "Área em construção" (foto `img/central-construcao.jpg` e título trocados pelo Codex em 08/09 à noite; a foto antiga `central-embreve.jpg` foi apagada e continua nos backups) → rodapé |
| **Blog** `blog.html` + `blog/` | listagem com filtro das duas trilhas e 3 posts. **Os 3 posts são exemplo, não conteúdo aprovado** (`_blog_fonte/LEIA.md`) |
| **Cadastro** `cadastro.html` | **feito em 08/09**: abertura com Salvador, ficha com validação (máscara, dígito do CNPJ, mensagem por campo), `cadastro.php` para a Locaweb. Na prévia, "Cadastrar" abre o e-mail do agente com a ficha preenchida |

**Hero:** pista de 4 telas sobre o vídeo, AVIF 10 bits, **com fallback WebP** desde 08/09 (`hero/dw`, `hero/mw`; o `hero.js` testa AVIF e troca sozinho).

**Menu:** Home · Quem somos · O que oferecemos · Central do Agente · Blog · [Cadastre sua agência]

**Header e rodapé** são escritos por extenso em cada página (decisão do Lippe, 04/09), e desde 08/09 quem os copia do `index.html` é o `_moldura.py`. O `verificar.sh` acusa se alguma página ficar para trás.

**Git:** `05_site/` → `one-lippe/OFB_site`, branch `main`, prévia em `https://one-lippe.github.io/OFB_site/`.

**Revisão de texto de 08/09 à tarde (Codex, aprovada pelo Lippe e publicada):** título do
portfólio "Tudo o que o seu cliente precisa, em um só lugar"; Consolidação em uma linha ("Emita com
o respaldo da OFB, representante da TP Air no Nordeste."); legendas curtas nas telas do agente.tur;
cartões da Central reescritos; banner da Central em branco sobre véu escuro; legendas do cadastro
"Dados da empresa" e "Seu contato". Detalhe em `03_copy/03_REVISAO_LOCAL_2026-09-08.md`.
**O Codex edita sem commit e sem subir `?v=`**: ao retomar, `git status` primeiro.

**Leva de 14/09/2026 (Lippe), aplicada e corrigida na mesma tarde:** barra "Acessar" sempre
visível, acessos em texto com só a seta colorida (verde do agente.tur, azul do portal), e o hero
começando abaixo das duas barras em qualquer tela. Cadastro reescrito: coluna da esquerda com
"Depois do envio" em três linhas e "Fale conosco"; no formulário, bloco "Documentos" com a lista
dos cinco (Cartão CNPJ, contrato social, comprovante de endereço, RG do sócio, dados bancários) e
**um único campo de arquivos** (até 8, PDF/JPG/PNG, 4 MB cada, 15 MB no total), **que vão anexados
no e-mail e não ficam no servidor**. Foco de campo com brilho vermelho, erro por campo só no envio
e sem deslocar a grade, aviso vermelho no rodapé do formulário quando falta campo.
CEP preenche endereço, bairro, cidade e UF pelo **ViaCEP** (única chamada externa do site, feita
pelo navegador só quando o CEP completa; se falhar, nada muda e os campos seguem editáveis).
A caixa de documentos aceita arrastar e soltar. Seção "Receba nossos
informativos" na home, abaixo da Central, com `informativos.php`. Um só script para os dois
formulários (`js/formularios.js`), um só motor de e-mail (`_envio.php`) com e-mail em HTML
espaçado, rótulo em cima e valor embaixo, e versão em texto. Captcha reCAPTCHA v2 nos dois,
ligado só quando houver chave (`js/config.js`). Hero: "Bem-vindo (a) à OFB.". Blog com busca por
assunto, no mesmo desenho da Central; filtro e busca viraram padrão da `site.css`.
Estilos de campo de formulário também (`.campo`, `.form-bloco`, `.form-resultado`).

**Faixa de benefícios no agente.tur (15/09/2026):** três itens (Cote junto com a OFB · Responda
na hora · Salve como Ideia) fechando a seção depois da grade, em três cartões no desenho do site
do agente.tur: ícone vermelho num círculo sobre a borda, título e texto centralizados. Mesmo
reveal com stagger da página. Copy aprovada, registrada no `01_COPY_BASE_HOME.md` bloco 5.
`site.css` em `?v=20260914-6`. Commit local, **não publicado**: push depende do ok do Lippe.

**Revisão no iPhone (Lippe, 08/09 à tarde), aplicada e publicada:** no celular o hero começa
abaixo das duas barras do header (antes 40 px de cada tela sumiam atrás da barra de cima); tela 2
com os três números em linhas alinhadas; tela 3 com três cartões lado a lado sem descrição e o
título sem quebra forçada (cabe em iPhone com as barras do Safari); tela 4 com degradê escuro na
base para a leitura; Consolidação com os dois botões lado a lado **depois** do bilhete; agente.tur
com o botão por último, depois das telas. As duas cópias móveis dos botões vivem no `index.html`
marcadas `--movel`; o desktop não muda. Bloco "CELULAR · revisão do Lippe" no fim da `site.css`. `.gitignore` deixa fora `_teste/`, provas, originais do Unsplash e cache do Notion.

---

## Com o Lippe

### 1. Ajustes de gosto no que foi construído em 08/09
Tudo construído sem perguntar, como pedido. O que é decisão sua e pode mudar:
- **Cadastro:** entraram dois campos além dos nove do formulário atual — **"Seu nome"** (o mapa
  §1.3 já apontava que o comercial ligava sem saber com quem falar) e **UF** (cidade sozinha é
  ambígua). Tirar é apagar dois blocos no `cadastro.html` e duas linhas no `cadastro.php`
- **Cadastro, coluna da esquerda:** "O que acontece depois" em três passos e o contato direto.
  Copy nova, minha, dentro das 7 regras; o parágrafo de abertura é o bloco 9 aprovado
- **Central na home:** dois cartões (branco + grafite com três lâminas em leque). Copy é a dos
  blocos 7 e 8, intacta. As três lâminas do leque são fixas (`img/promos/mini/`); trocar é trocar
  três `src`
- **Banner da Central:** foto gerada no Magnific, texto em HTML. Copy revista a seu pedido em
  08/09 ("o ponto de apoio da sua agência na OFB…"): diz o que a Central é, não o que se baixa.
  Você faz a foto definitiva no Photoshop; ao trocar, manter o texto fora da imagem (`06_CENTRAL` §2b)

### 2. Antes da Locaweb, confirmar com a OFB
- `_envio.php`: **`REMETENTE`** precisa ser um e-mail real do domínio `ofb.com.br`. **`DESTINO`**
  está em `philippe@ofb.com.br` para teste (decisão de 14/09) e vira `comercial@ofb.com.br` na
  subida. Está tudo em `PUBLICAR.md` §3.1, junto com HTTPS, limites de upload e captcha
- A hospedagem Locaweb **roda PHP?** Sem isso os dois formulários não enviam em produção
- **Chaves do reCAPTCHA** (v2, "Não sou um robô"): você cria, eu ponho no lugar. Até lá o
  captcha fica escondido e os formulários funcionam sem ele

### 3. GitHub Pages · no ar desde 08/09
`https://one-lippe.github.io/OFB_site/`, repositório `one-lippe/OFB_site`. Atualizar é commit + push
(`PUBLICAR.md` §2). Abrir no Safari e no celular antes de mandar para os decisores.

### 4. Blog: fonte de verdade
A base do Notion está de pé e o gerador já lê dela (`--fonte notion`), por dois caminhos: um
token de integração (`NOTION_TOKEN`) ou um export gravado por sessão do Claude. Falta **post real
em `Publicado`**. Enquanto isso o ar tem os três de exemplo. Decidir se a prévia sobe com eles.

### 5. Re-render do hero, se quiser qualidade máxima em retina
Como antes: o `.aep` em 2880×1620 ou 3840×2160, 10 bits, e rodar `_gerar_hero.sh` e
`_gerar_hero_webp.sh`. Nada mudou aqui.

### 6. Direito de imagem do navio e peso do cruzeiros
`img/portfolio/cruzeiros.jpg` continua material da Royal Caribbean (884 KB). Você pediu para
não mexer; fica registrado.

### 7. Duplicata em 04_assets
`04_assets/Icon copiar.jpg` (3 MB) parece cópia de `Icon.jpg`. Fora do site; não mexi.

---

## Com quem pegar o projeto

### 8. O que não deu para testar nesta máquina
- **`_envio.php`, `cadastro.php` e `informativos.php`**: não há PHP local. Sintaxe conferida a olho,
  lógica espelha o JS. Testar na Locaweb com uma ficha real com os cinco anexos e um cadastro
  de informativo (`PUBLICAR.md` §3.2). O e-mail em HTML foi desenhado sem cliente de e-mail
  para abrir: conferir no Gmail e no Outlook
- **Fallback WebP no Safari antigo**: não há Safari < 16.4 aqui. O caminho foi conferido no
  código (detecção por imagem AVIF de 1×1, troca de pasta e extensão); a prova real é abrir num
  iPhone com iOS 15
- **Hero**: as capturas desta sessão foram no Chrome headless, e o Chrome esconde o defeito de
  scrubbing. Valem como prova de layout, não do hero

### 9. Quando o site sair de prévia
`./_indexar.sh on` tira o `noindex` de tudo e abre o `robots.txt`. O `_gerar_blog.py` escreve
`noindex` por padrão: depois de regerar o blog em produção, rodar `on` de novo.

### 10. Etapa 5 das promoções e a skill do blog
Continuam esperando o site na Locaweb (`05_CADASTRO_DE_PROMOCOES.md` §7, `07_BLOG_CENTRAL_E_HUB_decisoes.md` §3.4).

---

## Ferramentas no projeto

| Arquivo | O que faz |
|---|---|
| `verificar.sh` | roda antes de qualquer subida: placeholder, `noindex` (subpastas incluídas), links, âncoras, header/rodapé, `?v=`, `robots.txt` |
| `_versionar.sh [carimbo]` | sobe o `?v=` de `site.css` e `site.js` em todas as páginas de uma vez |
| `_moldura.py [--conferir]` | copia header e rodapé do `index.html` para `central.html`, `cadastro.html` e `blog.html` |
| `_indexar.sh on\|off` | liga/desliga indexação no site inteiro |
| `_gerar_blog.py [--fonte exemplo\|notion] [--listar]` | regera o blog, sitemap e feed |
| `_gerar_hero.sh` | refaz a sequência AVIF do hero (regras do PNG e dos 10 bits dentro) |
| `_gerar_hero_webp.sh` | refaz o fallback WebP (1440×810 q80) |
| `_medir_veu.py` | mede o vídeo e refaz `js/veu.js` (sem uso hoje) |
| `_gerar_provas.py` | refaz `_provas_fases.html`; cópia do index, fica para trás |
| `_teste/medir-avif.html` | mede o custo de AVIF e WebP no navegador em que abrir |
| `_teste/capturar.mjs` | captura de tela pelo DevTools Protocol do Chrome (`node _teste/capturar.mjs '<json>'`): celular, movimento reduzido, JS antes da foto. O `chrome --screenshot` travava neste site |
| `js/consolidacao.js` | bilhete e carimbo. `TESTE=true` põe em ciclo |
| `js/formularios.js` | máscaras, validação (inclusive anexos), captcha e envio de qualquer `form[data-formulario]` |
| `js/config.js` | chave do site do reCAPTCHA e o e-mail de destino da prévia |
| `_envio.php` | motor de e-mail dos formulários: validação, anexos, HTML + texto, captcha. `cadastro.php` e `informativos.php` usam |

**Versões de arquivo por página (a mão):** `central.css` 20260908-4 · `cadastro.css` 20260908-1 ·
`hero.js` 20260908-1 · `consolidacao.js` 20260904-2 · `cadastro.js` 20260908-1.

---

## Divisão de propriedade

Desde 08/09/2026 **uma sessão só** cuida da pasta inteira; a divisão home/Central de 03–04/09
acabou junto com a task anterior. Continua valendo: commit por caminho explícito, nunca
`git add -A`.

---

## Regras que não podem se perder

O hero é scrubbing de AVIF, e a regra que governa tudo está em
`02_mapa_e_wireframe/03_HERO_ANALISE_TECNICA.md` §8, com os números medidos. Em uma linha:
**o gargalo é decodificar, não baixar**, e por isso os quadros carregam e decodificam em ordem,
um por vez.

- conferir scrubbing no Chrome não prova nada — ele decodifica adiantado e esconde o defeito
- subir o `?v=` em toda mudança, senão o Safari serve o antigo. Para `site.css` e `site.js`,
  `./_versionar.sh`; os demais, à mão
- **AVIF vs WebP já foi decidido** (§9). O WebP entrou só como reserva para quem não tem AVIF
- **16 fps foi testado e reprovado** (§9). O vídeo é 24 fps exatos, 489 quadros, e fica assim
- **header e rodapé: editar só no `index.html`** e rodar `python3 _moldura.py`
- **copy aprovada não se reescreve**; texto novo desta sessão está listado no item 1 acima

A §8 da análise do hero também lista três tentativas que pioraram, para não se repetirem.

# Pendências do site OFB

Atualizado em 08/09/2026, ao fim da sessão que fechou as pendências da v1 e preparou a publicação.
Cada item diz de quem é a bola. O site continua em **modo prévia**: `noindex` em tudo, `robots.txt` fechado.

---

## Estado do site hoje

| Página | Estado |
|---|---|
| **Home** `index.html` | hero em scrubbing (4 telas) → Consolidação aérea (bilhete e carimbo) → agente.tur (3 telas reais) → **Central do Agente + Promoções** (dois cartões, feito em 08/09) → rodapé |
| **Central** `central.html` | banner com foto e texto em HTML (v2, 08/09) → 24 promoções com filtro, busca, lupa e download com logo → "o que vem" → rodapé |
| **Blog** `blog.html` + `blog/` | listagem com filtro das duas trilhas e 3 posts. **Os 3 posts são exemplo, não conteúdo aprovado** (`_blog_fonte/LEIA.md`) |
| **Cadastro** `cadastro.html` | **feito em 08/09**: abertura com Salvador, ficha com validação (máscara, dígito do CNPJ, mensagem por campo), `cadastro.php` para a Locaweb. Na prévia, "Cadastrar" abre o e-mail do agente com a ficha preenchida |

**Hero:** pista de 4 telas sobre o vídeo, AVIF 10 bits, **com fallback WebP** desde 08/09 (`hero/dw`, `hero/mw`; o `hero.js` testa AVIF e troca sozinho).

**Menu:** Home · Quem somos · O que oferecemos · Central do Agente · Blog · [Cadastre sua agência]

**Header e rodapé** são escritos por extenso em cada página (decisão do Lippe, 04/09), e desde 08/09 quem os copia do `index.html` é o `_moldura.py`. O `verificar.sh` acusa se alguma página ficar para trás.

**Git:** repositório local em `05_site/`, branch `main`, sem remoto. `.gitignore` deixa fora `_teste/`, provas, originais do Unsplash e cache do Notion.

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
- **Banner da Central:** foto gerada no Magnific, texto em HTML. Você faz o definitivo no
  Photoshop; ao trocar, manter o texto fora da imagem (regra do `06_CENTRAL` §2b)

### 2. Antes da Locaweb, confirmar com a OFB
- `cadastro.php`: **`REMETENTE`** precisa ser um e-mail real do domínio `ofb.com.br`, e
  **`DESTINO`** (`comercial@ofb.com.br`) precisa ser quem recebe ficha. Está tudo em
  `PUBLICAR.md` §3.1
- A hospedagem Locaweb **roda PHP?** Sem isso o formulário não envia em produção

### 3. GitHub Pages
Criar o repositório público e apontar o remoto. Passo a passo em `PUBLICAR.md` §2. Nada sobe sem o seu "pode".

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
- **`cadastro.php`**: não há PHP local. Sintaxe conferida a olho, lógica espelha o JS. Testar na
  Locaweb com uma ficha real (`PUBLICAR.md` §3.2)
- **Fallback WebP no Safari antigo**: não há Safari < 16.4 aqui. O caminho foi conferido no
  código (detecção por imagem AVIF de 1×1, troca de pasta e extensão); a prova real é abrir num
  iPhone com iOS 15
- **Safari atual**: as capturas desta sessão foram no Chrome headless. **Testar no Safari antes
  de mostrar a alguém** (regra que não se perde, abaixo)

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
| `js/cadastro.js` | máscaras, validação e envio da ficha |

**Versões de arquivo por página (a mão):** `central.css` 20260908-1 · `cadastro.css` 20260908-1 ·
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

- testar scrubbing só no Chrome não prova nada — ele decodifica adiantado e esconde o defeito.
  O navegador de teste do Lippe é o **Safari**
- subir o `?v=` em toda mudança, senão o Safari serve o antigo. Para `site.css` e `site.js`,
  `./_versionar.sh`; os demais, à mão
- **AVIF vs WebP já foi decidido** (§9). O WebP entrou só como reserva para quem não tem AVIF
- **16 fps foi testado e reprovado** (§9). O vídeo é 24 fps exatos, 489 quadros, e fica assim
- **header e rodapé: editar só no `index.html`** e rodar `python3 _moldura.py`
- **copy aprovada não se reescreve**; texto novo desta sessão está listado no item 1 acima

A §8 da análise do hero também lista três tentativas que pioraram, para não se repetirem.

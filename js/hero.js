/* ═══════════════════════════════════════════════════════════════
   HERO EM SCRUBBING · site OFB

   Sequência de quadros em dois canvas, não <video>. O motivo é
   medido, não preferência: a sequência AVIF pesa 6,4 MB contra
   15 MB do mesmo vídeo reencodado com todo quadro em keyframe, que
   é o que o seek preciso exige. E dispensa o play()+pause() por
   gesto que o Safari no iPhone impõe antes de deixar buscar tempo
   em um <video>.

   O desenho segue a v4 do hero do Cruzeirista, já calibrada:
   suavização corrigida por tempo, mesclagem entre quadros vizinhos
   e borrão proporcional à velocidade da rolagem.

   Cada bloco tem a camada que a cena dele pede, e a intensidade é
   escrita aqui ao longo da rolagem — ver `camadaDaFase`. O Hero e a
   chegada não têm nenhuma.
   ═══════════════════════════════════════════════════════════════ */
(function () {
'use strict';

var pista   = document.getElementById('pista');
var hero    = document.getElementById('hero');
if (!pista || !hero) return;

var camadas = document.getElementById('quadros');
var cvA = document.getElementById('cv-a');
var cvB = document.getElementById('cv-b');
var rolar = document.querySelector('.rolar');
var fases = Array.prototype.slice.call(document.querySelectorAll('.fase'));

var reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var ehMobile = window.matchMedia('(max-width: 900px)').matches;

/* ── O vídeo, medido ──────────────────────────────────────────── */
var N = 489;                                  /* quadros, 20,375s a 24fps */
var CONJ = ehMobile
    ? { dir: 'm', w: 720,  h: 1080 }
    : { dir: 'd', w: 1920, h: 1080 };   /* resolução nativa do vídeo */

/* ── AVIF, com WebP de reserva ─────────────────────────────────────
   A sequência é AVIF (03_HERO §9: empata com o WebP em qualidade e
   pesa 3,1× menos). Navegador sem AVIF — Safari abaixo do 16.4, na
   prática — recebe a mesma sequência em WebP, gerada pelo
   _gerar_hero_webp.sh em hero/dw e hero/mw: menor (1440×810) e mais
   leve, porque plano B não precisa de qualidade equivalente. O canvas
   continua em 1920×1080 e o quadro é esticado para caber.

   O teste é uma imagem AVIF de 1×1 embutida: se decodifica, há AVIF. */
var EXT = 'avif';
function detectarAvif(depois) {
    var img = new Image();
    var respondeu = false;
    function fim(tem) {
        if (respondeu) return;
        respondeu = true;
        if (!tem) { EXT = 'webp'; CONJ.dir += 'w'; }
        depois();
    }
    img.onload  = function () { fim(img.width > 0); };
    img.onerror = function () { fim(false); };
    setTimeout(function () { fim(true); }, 800);   /* na dúvida, AVIF */
    img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
}

/* ── As fases ─────────────────────────────────────────────────────
   `de` e `ate` são posições na PISTA DE ROLAGEM (0 a 1);
   `quadroDe`/`quadroAte`, os quadros do vídeo que aquele trecho
   percorre. A rolagem não avança o vídeo em ritmo constante: as
   gêmeas, que têm o dobro de leitura, recebem mais pista.
   ── */
var FASES = [
    /* BLOCO 1 · Hero · a cabine e a janela abrindo.
       Começa no quadro 0: a primeira tela já abre com a headline. */
    { id: 'b', de: 0.000, ate: 0.250, quadroDe:   0, quadroAte: 140 },

    /* BLOCO 2 · Quem é a OFB · a asa acima das nuvens */
    { id: 'c', de: 0.250, ate: 0.560, quadroDe: 140, quadroAte: 290 },

    /* BLOCO 6 · Portfólio · a travessia da nuvem, o trecho mais
       branco e mais liso do vídeo. */
    { id: 'd', de: 0.560, ate: 0.820, quadroDe: 290, quadroAte: 400 },

    /* O PUNCH · a cidade aparece primeiro sem interferência. */
    { id: null, de: 0.820, ate: 0.880, quadroDe: 400, quadroAte: 440 },

    /* FECHAMENTO · Salvador já reconhecível. A frase conclui a
       viagem e permanece até o hero soltar. */
    { id: 'e', de: 0.880, ate: 1.000, quadroDe: 440, quadroAte: N - 1 }
];

/* Altura da pista: 440vh, o ritmo que o Lippe escolheu. */
var PISTA_VH = ehMobile ? 380 : 440;

function alturaHero() {
    return hero.offsetHeight || window.innerHeight;
}

function aplicarPista() {
    var altura = reduzido ? 0 : (PISTA_VH / 100) * window.innerHeight;
    pista.style.height = (alturaHero() + altura) + 'px';
}

/* ── Carga dos quadros ────────────────────────────────────────────
   Em ordem, do 0 ao último, e decodificando um de cada vez na mesma
   ordem. Aqui não se trata de rede: baixar um quadro custa 1ms, e
   decodificá-lo custa 14. O gargalo é o processador, não o cabo.

   O que decide se a rolagem fica lisa é o quadro estar DECODIFICADO no
   instante em que o olho pede por ele. Medido no Safari 26:

       desenhar um quadro ainda não decodificado ... 18,4 ms
       depois de `await decode()` ................... 2,0 ms

   18,4 ms não cabe num quadro de tela de 60 Hz (16,7 ms). Cada quadro
   inédito custa a tela inteira, e é exatamente isso que se vê como
   stutter. O Chrome decodifica sozinho quando a imagem carrega e por
   isso nunca mostrou o defeito — foi o que escondeu o problema.

   A ordem entrelaçada que estava aqui (1 de cada 32, depois 16, depois
   8) serve para imagem progressiva, onde a versão grossa já é útil.
   Para scrubbing ela é o pior arranjo possível: espalha o trabalho de
   decodificação por toda a linha do tempo, e o ponto de leitura do
   visitante — que anda em ordem, do começo para o fim — cai quase
   sempre num quadro que ainda não foi decodificado.

   Em ordem, os dois andam no mesmo sentido, e a decodificação anda mais
   rápido: o Safari prepara 51 quadros por segundo, e uma rolagem de
   leitura consome uns 25. Ele nunca é alcançado.
   ── */
var quadros = new Array(N);
var carregados = 0;
var pronto = false;

/* Decodificação em fila, um por vez. Concorrente elas competem entre
   si e nenhuma termina primeiro — o que interessa aqui é justamente
   que os primeiros quadros fiquem prontos antes dos últimos. */
var filaDecode = [];
var decodificando = false;

function enfileirarDecode(img) {
    filaDecode.push(img);
    if (!decodificando) girarDecode();
}

function girarDecode() {
    var img = filaDecode.shift();
    if (!img) { decodificando = false; return; }
    decodificando = true;

    var seguiu = false;
    var seguir = function () {
        if (seguiu) return;
        seguiu = true;
        girarDecode();
    };

    if (img.decode) {
        img.decode().then(seguir, seguir);
        /* Rede ou navegador em que decode() não resolve não pode parar a
           fila: 500ms e segue para o próximo. */
        setTimeout(seguir, 500);
    } else {
        seguir();
    }
}

function caminho(i) {
    return 'hero/' + CONJ.dir + '/' + String(i + 1).padStart(4, '0') + '.' + EXT;
}

function carregar(aoPrimeiro) {
    /* Em movimento reduzido não há scrubbing: um quadro basta. */
    var seq = [];
    /* O quadro 0 é o mesmo que o pôster mostra: sem scrubbing, a tela
       fica na cabine fechada, e não há troca visível. */
    if (reduzido) seq = [0];
    else for (var q = 0; q < N; q++) seq.push(q);
    var fila = 0, SIMULTANEOS = 10;

    function proximo() {
        if (fila >= seq.length) return;
        var i = seq[fila++];
        var img = new Image();
        img.decoding = 'async';
        img.onload = function () {
            quadros[i] = img;
            carregados++;
            if (!pronto) { pronto = true; aoPrimeiro(); }
            proximo();
            enfileirarDecode(img);
        };
        img.onerror = proximo;
        img.src = caminho(i);
    }
    for (var k = 0; k < SIMULTANEOS; k++) proximo();
}

/* ── A camada de cada bloco, ao longo da rolagem ────────────────
   `t` é a posição dentro da fase, de 0 a 1. Cada bloco tem a sua
   curva, e onde não há curva não há camada.
   ── */
function conteudoDaFase(id, t) {
    /* O bloco sai junto com o branco, um pouco antes. Se ficasse, os
       cards terminariam sozinhos sobre a cidade — o quadro mais
       detalhado do vídeo — e pareceriam esquecidos na tela. */
    if (id === 'd') {
        if (t < 0.58) return 1;
        if (t < 0.82) return 1 - (t - 0.58) / 0.24;
        return 0;
    }
    return 1;
}

function camadaDaFase(id, t) {
    if (id === 'd') {
        /* O branco vem do zero, segura enquanto a grade é lida e
           volta ao zero antes de a cidade aparecer. */
        if (t < 0.18) return (t / 0.18) * 0.62;
        if (t < 0.58) return 0.62;
        if (t < 0.90) return 0.62 * (1 - (t - 0.58) / 0.32);
        return 0;
    }
    if (id === 'c') {
        /* O azul desce do topo na entrada e fica. A subida é curta
           para o texto nunca aparecer antes do fundo dele. */
        return Math.min(t / 0.14, 1);
    }
    return 0;   /* Hero e chegada: nada por cima do vídeo. */
}

/* Quadro mais próximo já carregado, para nunca desenhar buraco. */
function pegar(i) {
    i = Math.max(0, Math.min(Math.round(i), N - 1));
    if (quadros[i]) return quadros[i];
    for (var d = 1; d < N; d++) {
        if (quadros[i - d]) return quadros[i - d];
        if (quadros[i + d]) return quadros[i + d];
    }
    return null;
}

/* ── Progresso da pista, e o quadro que ele pede ── */
function progresso() {
    var corrida = pista.offsetHeight - alturaHero();
    if (corrida <= 0) return 0;
    var y = window.scrollY - pista.offsetTop;
    return Math.min(Math.max(y / corrida, 0), 1);
}

/* Mapeia progresso da pista -> quadro do vídeo, fase a fase. */
function quadroDoProgresso(p) {
    for (var i = 0; i < FASES.length; i++) {
        var f = FASES[i];
        if (p <= f.ate || i === FASES.length - 1) {
            var t = (p - f.de) / (f.ate - f.de);
            t = Math.min(Math.max(t, 0), 1);
            return { quadro: f.quadroDe + (f.quadroAte - f.quadroDe) * t, fase: f };
        }
    }
    return { quadro: 0, fase: FASES[0] };
}

/* ── Desenho ──────────────────────────────────────────────────── */
var ctxA = cvA.getContext('2d', { alpha: false });
var ctxB = cvB.getContext('2d', { alpha: false });
cvA.width = cvB.width = CONJ.w;
cvA.height = cvB.height = CONJ.h;

var SUAVIZACAO = 0.16;
var BORRAO_MAX = 2.4;    /* px — acima disso fica caro no Safari */
var BORRAO_GANHO = 0.5;

var indiceSuave = 0, anterior = 0, ultimoDesenho = -1, blurAtual = -1;
var faseAtual = null, tPrev = 0;

function pintar(t) {
    var dt = tPrev ? Math.min(t - tPrev, 100) : 16.667;
    tPrev = t;

    var p = progresso();
    var r = quadroDoProgresso(p);
    var alvo = r.quadro;

    /* Suavização corrigida pelo tempo: 0.16 dá a mesma sensação em
       tela de 60 e de 120 Hz. Sem a correção, a de 120 converge duas
       vezes mais rápido com o mesmo número. */
    var k = 1 - Math.pow(1 - SUAVIZACAO, dt / 16.667);
    indiceSuave += (alvo - indiceSuave) * k;
    if (Math.abs(alvo - indiceSuave) < 0.01) indiceSuave = alvo;

    var i0 = Math.floor(indiceSuave);
    var fr = indiceSuave - i0;

    /* Repinta o canvas só quando o índice inteiro muda. Em todo
       quadro de tela mexe apenas em opacity e filter, que ficam no
       compositor e não custam layout. */
    if (i0 !== ultimoDesenho) {
        var a = pegar(i0);
        if (a) {
            ctxA.drawImage(a, 0, 0, CONJ.w, CONJ.h);
            var b = pegar(i0 + 1);
            if (b) ctxB.drawImage(b, 0, 0, CONJ.w, CONJ.h);
            ultimoDesenho = i0;
        }
    }
    cvB.style.opacity = fr.toFixed(3);

    /* Borrão proporcional à velocidade, normalizado para 60 Hz.
       A mesclagem sobrepõe dois quadros; em rolagem rápida o olho
       veria duas posições da asa ao mesmo tempo. O borrão funde as
       duas e o cérebro lê como movimento, não como imagem dupla.
       Zero quando parado, então não custa nada na leitura. */
    var vel = Math.abs(indiceSuave - anterior) * (16.667 / dt);
    anterior = indiceSuave;
    var blur = Math.min(vel * BORRAO_GANHO, BORRAO_MAX);
    if (blur < 0.08) blur = 0;
    if (Math.abs(blur - blurAtual) > 0.06 || (blur === 0 && blurAtual !== 0)) {
        camadas.style.filter = blur ? 'blur(' + blur.toFixed(2) + 'px)' : '';
        blurAtual = blur;
    }

    /* Camada do bloco, escrita a cada quadro */
    if (r.fase.id) {
        var tFase = (p - r.fase.de) / (r.fase.ate - r.fase.de);
        var el = document.querySelector('.fase[data-fase="' + r.fase.id + '"]');
        var tf = Math.min(Math.max(tFase, 0), 1);
        if (el) {
            el.style.setProperty('--camada',   camadaDaFase(r.fase.id, tf).toFixed(3));
            el.style.setProperty('--conteudo', conteudoDaFase(r.fase.id, tf).toFixed(3));
        }
    }

    /* Troca de fase */
    if (r.fase !== faseAtual) {
        faseAtual = r.fase;
        fases.forEach(function (el) {
            el.classList.toggle('no-ar', el.dataset.fase === r.fase.id);
        });
        /* Quem depende de "o bloco apareceu" ouve daqui: dentro do
           hero a troca é por opacity, no mesmo lugar da tela, e um
           IntersectionObserver não enxerga isso. */
        document.dispatchEvent(new CustomEvent('fase-no-ar', { detail: r.fase.id }));
    }

    if (rolar) rolar.style.opacity = Math.max(0, 1 - p / 0.06);

    requestAnimationFrame(pintar);
}

/* ── Âncoras do menu: rolam até o meio da fase, não até um elemento.
      A fase não é um bloco no fluxo — é um trecho da pista. ── */
var ANCORA_DA_FASE = { 'a-ofb': 'c', 'portfolio': 'd' };

document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var alvo = a.getAttribute('href').slice(1);
    var faseId = ANCORA_DA_FASE[alvo];
    if (!faseId || reduzido) return;

    var f = FASES.filter(function (x) { return x.id === faseId; })[0];
    if (!f) return;

    e.preventDefault();
    /* Um pouco depois da entrada da fase, para chegar com ela já lida. */
    var ponto = f.de + (f.ate - f.de) * 0.35;
    var corrida = pista.offsetHeight - alturaHero();
    window.scrollTo({
        top: pista.offsetTop + corrida * ponto,
        behavior: reduzido ? 'auto' : 'smooth'
    });
}, true);

/* ── Partida ─────────────────────────────────────────────────────
   O navegador guarda a posição da rolagem e a devolve no recarregar.
   Numa página comum isso é bom. Aqui é um defeito visível: o hero
   volta no meio da pista e a primeira coisa que aparece é a janela
   já aberta, em vez da cabine fechada. A viagem tem que começar do
   começo.

   Quem chega por link com âncora é exceção: ali a posição foi pedida
   de propósito.
   ── */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (!location.hash) {
    window.scrollTo(0, 0);
    /* Alguns navegadores só restauram depois do load, então repõe. */
    window.addEventListener('load', function () {
        if (!location.hash) window.scrollTo(0, 0);
    });
}

aplicarPista();
window.addEventListener('resize', function () {
    if (window.matchMedia('(max-width: 900px)').matches !== ehMobile) { location.reload(); return; }
    aplicarPista();
});

detectarAvif(function () {
    carregar(function () { hero.classList.add('pronto'); });
});

if (reduzido) {
    /* Sem pista e sem scrubbing: as fases viram seções empilhadas. */
    fases.forEach(function (el) { el.classList.add('no-ar'); });
} else {
    requestAnimationFrame(pintar);
}

})();


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

var N = 489;
var CONJ = ehMobile
    ? { dir: 'm', w: 720,  h: 1080 }
    : { dir: 'd', w: 1920, h: 1080 };

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
    setTimeout(function () { fim(true); }, 800);
    img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
}

var FASES = [

    { id: 'b', de: 0.000, ate: 0.250, quadroDe:   0, quadroAte: 140 },

    { id: 'c', de: 0.250, ate: 0.560, quadroDe: 140, quadroAte: 290 },

    { id: 'd', de: 0.560, ate: 0.820, quadroDe: 290, quadroAte: 400 },

    { id: null, de: 0.820, ate: 0.880, quadroDe: 400, quadroAte: 440 },

    { id: 'e', de: 0.880, ate: 1.000, quadroDe: 440, quadroAte: N - 1 }
];

var PISTA_VH = ehMobile ? 380 : 440;

function alturaHero() {
    return hero.offsetHeight || window.innerHeight;
}

function aplicarPista() {
    var altura = reduzido ? 0 : (PISTA_VH / 100) * window.innerHeight;
    pista.style.height = (alturaHero() + altura) + 'px';
}

var quadros = new Array(N);
var carregados = 0;
var pronto = false;

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

        setTimeout(seguir, 500);
    } else {
        seguir();
    }
}

function caminho(i) {
    return 'hero/' + CONJ.dir + '/' + String(i + 1).padStart(4, '0') + '.' + EXT;
}

function carregar(aoPrimeiro) {

    var seq = [];

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

function conteudoDaFase(id, t) {

    if (id === 'd') {
        if (t < 0.58) return 1;
        if (t < 0.82) return 1 - (t - 0.58) / 0.24;
        return 0;
    }
    return 1;
}

function camadaDaFase(id, t) {
    if (id === 'd') {

        if (t < 0.18) return (t / 0.18) * 0.62;
        if (t < 0.58) return 0.62;
        if (t < 0.90) return 0.62 * (1 - (t - 0.58) / 0.32);
        return 0;
    }
    if (id === 'c') {

        return Math.min(t / 0.14, 1);
    }
    return 0;
}

function pegar(i) {
    i = Math.max(0, Math.min(Math.round(i), N - 1));
    if (quadros[i]) return quadros[i];
    for (var d = 1; d < N; d++) {
        if (quadros[i - d]) return quadros[i - d];
        if (quadros[i + d]) return quadros[i + d];
    }
    return null;
}

function progresso() {
    var corrida = pista.offsetHeight - alturaHero();
    if (corrida <= 0) return 0;
    var y = window.scrollY - pista.offsetTop;
    return Math.min(Math.max(y / corrida, 0), 1);
}

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

var ctxA = cvA.getContext('2d', { alpha: false });
var ctxB = cvB.getContext('2d', { alpha: false });
cvA.width = cvB.width = CONJ.w;
cvA.height = cvB.height = CONJ.h;

var SUAVIZACAO = 0.16;
var BORRAO_MAX = 2.4;
var BORRAO_GANHO = 0.5;

var indiceSuave = 0, anterior = 0, ultimoDesenho = -1, blurAtual = -1;
var faseAtual = null, tPrev = 0;

function pintar(t) {
    var dt = tPrev ? Math.min(t - tPrev, 100) : 16.667;
    tPrev = t;

    var p = progresso();
    var r = quadroDoProgresso(p);
    var alvo = r.quadro;

    var k = 1 - Math.pow(1 - SUAVIZACAO, dt / 16.667);
    indiceSuave += (alvo - indiceSuave) * k;
    if (Math.abs(alvo - indiceSuave) < 0.01) indiceSuave = alvo;

    var i0 = Math.floor(indiceSuave);
    var fr = indiceSuave - i0;

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

    var vel = Math.abs(indiceSuave - anterior) * (16.667 / dt);
    anterior = indiceSuave;
    var blur = Math.min(vel * BORRAO_GANHO, BORRAO_MAX);
    if (blur < 0.08) blur = 0;
    if (Math.abs(blur - blurAtual) > 0.06 || (blur === 0 && blurAtual !== 0)) {
        camadas.style.filter = blur ? 'blur(' + blur.toFixed(2) + 'px)' : '';
        blurAtual = blur;
    }

    if (r.fase.id) {
        var tFase = (p - r.fase.de) / (r.fase.ate - r.fase.de);
        var el = document.querySelector('.fase[data-fase="' + r.fase.id + '"]');
        var tf = Math.min(Math.max(tFase, 0), 1);
        if (el) {
            el.style.setProperty('--camada',   camadaDaFase(r.fase.id, tf).toFixed(3));
            el.style.setProperty('--conteudo', conteudoDaFase(r.fase.id, tf).toFixed(3));
        }
    }

    if (r.fase !== faseAtual) {
        faseAtual = r.fase;
        fases.forEach(function (el) {
            el.classList.toggle('no-ar', el.dataset.fase === r.fase.id);
        });

        document.dispatchEvent(new CustomEvent('fase-no-ar', { detail: r.fase.id }));
    }

    if (rolar) rolar.style.opacity = Math.max(0, 1 - p / 0.06);

    requestAnimationFrame(pintar);
}

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

    var ponto = f.de + (f.ate - f.de) * 0.35;
    var corrida = pista.offsetHeight - alturaHero();
    window.scrollTo({
        top: pista.offsetTop + corrida * ponto,
        behavior: reduzido ? 'auto' : 'smooth'
    });
}, true);

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (!location.hash) {
    window.scrollTo(0, 0);

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

    fases.forEach(function (el) { el.classList.add('no-ar'); });
} else {
    requestAnimationFrame(pintar);
}

})();

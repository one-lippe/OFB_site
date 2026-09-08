/* ═══════════════════════════════════════════════════════════════
   SEÇÃO CONSOLIDAÇÃO AÉREA · bilhete e carimbo
   O desenho e os tempos estão em 03_copy/02_SECAO_CONSOLIDACAO_HOME.md
   §4, e a referência de comportamento é o mockup v31 em
   02_mapa_e_wireframe/04_MOCKUP_CONSOLIDACAO_BILHETE.html.

   Quatro coisas acontecem aqui, e só aqui:
   1. a data do carimbo, que é o dia em que a página é aberta
   2. a haste do carimbo, um cilindro de facetas
   3. a sombra do bilhete, que é a silhueta dele desenhada em SVG
   4. a sequência, disparada uma vez quando a seção aparece
   ═══════════════════════════════════════════════════════════ */
(function () {
'use strict';

/* true põe a sequência em ciclo, para conseguir ver várias vezes sem
   recarregar. Em produção é false: roda uma vez por carregamento. */
var TESTE = false;

var secao = document.getElementById('consolidacao');
if (!secao) return;

var bilhete = secao.querySelector('.consol-bilhete');
var carimbo = secao.querySelector('.consol-carimbo');
var reduz   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* ── 1. A data do carimbo ────────────────────────────────────────
   Formato 04.09.2026. Nada além disso no arco de baixo: mais
   caracteres embaralham o desenho.
   ── */
(function () {
    var alvo = secao.querySelector('[data-carimbo-data]');
    if (!alvo) return;
    var d = new Date();
    var dd = function (n) { return (n < 10 ? '0' : '') + n; };
    alvo.textContent = dd(d.getDate()) + '.' + dd(d.getMonth() + 1) + '.' + d.getFullYear();
})();


/* ── 2. A haste do carimbo ───────────────────────────────────────
   Cilindro de verdade: n tiras verticais em volta do eixo, cada uma
   com o tom que a luz de cima-à-esquerda daria nela. Duas peças — a
   haste fina e o pescoço mais largo do botão.
   ── */
(function () {
    var corpo = secao.querySelector('.consol-carimbo-corpo');
    if (!corpo || reduz) return;

    function cilindro(raio, altura, z0, base, n) {
        var largura = Math.ceil(2 * Math.PI * raio / n) + 1.5;   /* +folga, senão aparece fresta */
        for (var i = 0; i < n; i++) {
            var ang = 360 * i / n;
            var luz = Math.cos((ang - 300) * Math.PI / 180);      /* luz vindo de cima-esquerda */
            var f = document.createElement('div');
            f.className = 'consol-faceta';
            f.style.cssText =
                'width:' + largura + 'px;height:' + altura + 'px;' +
                'margin:' + (-altura) + 'px 0 0 ' + (-largura / 2) + 'px;' +
                'background:hsl(' + base[0] + ' ' + base[1] + '% ' + (base[2] + luz * 16) + '%);' +
                'transform:translateZ(' + z0 + 'px) rotateZ(' + ang + 'deg) ' +
                          'translateY(' + raio + 'px) rotateX(-90deg);';
            corpo.appendChild(f);
        }
        var tampa = document.createElement('div');
        tampa.className = 'consol-tampa';
        tampa.style.cssText =
            'width:' + (2 * raio) + 'px;height:' + (2 * raio) + 'px;' +
            'margin:' + (-raio) + 'px 0 0 ' + (-raio) + 'px;' +
            'background:hsl(' + base[0] + ' ' + base[1] + '% ' + (base[2] + 8) + '%);' +
            'transform:translateZ(' + (z0 + altura) + 'px);';
        corpo.appendChild(tampa);
    }

    cilindro(28, 140,   0, [32, 42, 58], 32);   /* haste */
    cilindro(44,  34, 140, [32, 44, 62], 32);   /* pescoço do botão */
})();


/* ── 3. Onde caem os picotes, e a sombra do bilhete ──────────────
   As duas linhas de picote são a borda de baixo do cabeçalho e a de
   cima do rodapé, e a altura das duas depende da fonte — que carrega
   depois. Por isso a posição é medida, nunca fixada: o mockup fixava
   70px e no site o cabeçalho dá 80, o que punha os furos 10px acima
   da linha. A máscara e os discos leem de --picote-a/--picote-b, e a
   sombra usa os mesmos números.

   A sombra não é box-shadow nem drop-shadow: os dois dão artefato no
   Safari quando o elemento tem máscara e rotação, e nenhum dos dois
   reproduz as mordidas laterais. Aqui ela é a silhueta exata do papel
   — cantos de 14px e as quatro mordidas de raio 12 — desenhada em SVG
   por baixo e desfocada em duas camadas pelo CSS. Os arcos das
   mordidas vão com sweep 0 (curvam para dentro do papel); os dos
   cantos, com sweep 1.
   ── */
(function () {
    var svg   = secao.querySelector('.consol-sombra');
    var wrap  = secao.querySelector('.consol-bilhete-wrap');
    var topo  = secao.querySelector('.consol-bilhete-topo');
    var roda  = secao.querySelector('.consol-bilhete-rodape');
    if (!svg || !bilhete || !wrap || !topo || !roda) return;

    var paths = svg.querySelectorAll('path');

    function silhueta() {
        var W = bilhete.offsetWidth;
        var H = bilhete.offsetHeight;
        if (!W || !H) return;

        var R = 14;                              /* canto */
        var r = 12;                              /* mordida */
        var yA = topo.offsetHeight;              /* picote de cima */
        var dB = H - roda.offsetTop;             /* picote de baixo, contado da base */
        var yB = H - dB;

        wrap.style.setProperty('--picote-a', yA + 'px');
        wrap.style.setProperty('--picote-b', dB + 'px');

        var d =
            'M' + R + ',0' +
            'L' + (W - R) + ',0' +
            'A' + R + ',' + R + ' 0 0 1 ' + W + ',' + R +
            'L' + W + ',' + (yA - r) +
            'A' + r + ',' + r + ' 0 0 0 ' + W + ',' + (yA + r) +
            'L' + W + ',' + (yB - r) +
            'A' + r + ',' + r + ' 0 0 0 ' + W + ',' + (yB + r) +
            'L' + W + ',' + (H - R) +
            'A' + R + ',' + R + ' 0 0 1 ' + (W - R) + ',' + H +
            'L' + R + ',' + H +
            'A' + R + ',' + R + ' 0 0 1 0,' + (H - R) +
            'L0,' + (yB + r) +
            'A' + r + ',' + r + ' 0 0 0 0,' + (yB - r) +
            'L0,' + (yA + r) +
            'A' + r + ',' + r + ' 0 0 0 0,' + (yA - r) +
            'L0,' + R +
            'A' + R + ',' + R + ' 0 0 1 ' + R + ',0' +
            'Z';

        for (var i = 0; i < paths.length; i++) paths[i].setAttribute('d', d);
    }

    silhueta();
    /* A altura do bilhete muda quando a Montserrat troca a fonte de
       fallback, e muda de novo em qualquer resize. */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(silhueta);
    var espera;
    window.addEventListener('resize', function () {
        clearTimeout(espera);
        espera = setTimeout(silhueta, 120);
    });
})();


/* ── 4. A sequência ──────────────────────────────────────────────
   0,5s parado → o avião cruza SSA-LIS em 1,65s → o carimbo entra
   (2s, impacto aos 1,32s) → a marca fica. Dispara quando metade da
   seção está na tela, e roda uma vez por carregamento: F5 ou voltar
   para a home roda de novo, mas não fica em ciclo.
   ── */
if (!bilhete || !carimbo) return;

if (reduz) {
    /* Nada anima: o avião já chegou e a marca já está impressa. */
    bilhete.classList.add('consol-emitido');
    return;
}

var T_DECOLA = 500, T_VOO = 1650, T_IMPACTO = 1320, T_SELO = 2000, T_SEGURA = 3000;

function roda() {
    bilhete.className = 'consol-bilhete consol-reset';
    carimbo.className = 'consol-carimbo';

    setTimeout(function () {
        bilhete.className = 'consol-bilhete consol-voando';
    }, T_DECOLA);

    setTimeout(function () {
        carimbo.className = 'consol-carimbo consol-ativo';
    }, T_DECOLA + T_VOO);

    setTimeout(function () {
        bilhete.className = 'consol-bilhete consol-voando consol-emitido consol-impacto';
        setTimeout(function () {
            bilhete.className = 'consol-bilhete consol-voando consol-emitido';
        }, 140);
    }, T_DECOLA + T_VOO + T_IMPACTO);

    if (TESTE) setTimeout(roda, T_DECOLA + T_VOO + T_SELO + T_SEGURA);
}

/* Metade da seção, quando a seção cabe na tela. Quando ela é mais
   alta que a tela — o caso do mobile, com texto e bilhete empilhados —
   metade dela nunca fica visível e o gatilho de 0,5 nunca dispararia.
   Nesse caso o critério passa a ser meia tela preenchida pela seção,
   que é a mesma ideia medida pelo lado que existe. */
function razaoAlvo() {
    var alt = secao.offsetHeight || 1;
    if (alt <= window.innerHeight) return 0.5;
    return Math.max(0.1, Math.min(0.5, (window.innerHeight * 0.5) / alt));
}

if ('IntersectionObserver' in window) {
    var alvo = razaoAlvo();
    var jaRodou = false;
    var olho = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
            if (!e.isIntersecting || e.intersectionRatio < alvo || jaRodou) return;
            jaRodou = true;
            roda();
            olho.disconnect();
        });
    }, { threshold: [alvo, 0.5] });
    olho.observe(secao);
} else {
    roda();
}

})();

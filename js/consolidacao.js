
(function () {
'use strict';

var TESTE = false;

var secao = document.getElementById('consolidacao');
if (!secao) return;

var bilhete = secao.querySelector('.consol-bilhete');
var carimbo = secao.querySelector('.consol-carimbo');
var reduz   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

(function () {
    var alvo = secao.querySelector('[data-carimbo-data]');
    if (!alvo) return;
    var d = new Date();
    var dd = function (n) { return (n < 10 ? '0' : '') + n; };
    alvo.textContent = dd(d.getDate()) + '.' + dd(d.getMonth() + 1) + '.' + d.getFullYear();
})();

(function () {
    var corpo = secao.querySelector('.consol-carimbo-corpo');
    if (!corpo || reduz) return;

    function cilindro(raio, altura, z0, base, n) {
        var largura = Math.ceil(2 * Math.PI * raio / n) + 1.5;
        for (var i = 0; i < n; i++) {
            var ang = 360 * i / n;
            var luz = Math.cos((ang - 300) * Math.PI / 180);
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

    cilindro(28, 140,   0, [32, 42, 58], 32);
    cilindro(44,  34, 140, [32, 44, 62], 32);
})();

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

        var R = 14;
        var r = 12;
        var yA = topo.offsetHeight;
        var dB = H - roda.offsetTop;
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

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(silhueta);
    var espera;
    window.addEventListener('resize', function () {
        clearTimeout(espera);
        espera = setTimeout(silhueta, 120);
    });
})();

if (!bilhete || !carimbo) return;

if (reduz) {

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

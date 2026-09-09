
(function () {
'use strict';

var alvos = Array.prototype.slice.call(document.querySelectorAll('[data-contador]'));
if (!alvos.length) return;

var reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduzido || !('IntersectionObserver' in window)) return;

var DURACAO = 1100;

function saida(t) { var u = 1 - t; return 1 - u * u * u; }

function formatar(n, prefixo) {
    return (prefixo || '') + n.toLocaleString('pt-BR');
}

function contar(el) {
    var fim     = parseInt(el.getAttribute('data-contador'), 10);
    var prefixo = el.getAttribute('data-prefixo') || '';
    if (isNaN(fim)) return;

    el.style.minWidth = el.getBoundingClientRect().width + 'px';
    el.setAttribute('aria-label', formatar(fim, prefixo));

    var inicio = null;
    function passo(t) {
        if (inicio === null) inicio = t;
        var p = Math.min((t - inicio) / DURACAO, 1);
        el.textContent = formatar(Math.round(fim * saida(p)), prefixo);
        if (p < 1) requestAnimationFrame(passo);
        else el.textContent = formatar(fim, prefixo);
    }
    requestAnimationFrame(passo);
}

var observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        observador.unobserve(e.target);
        contar(e.target);
    });
}, { threshold: 0.6 });

alvos.forEach(function (el) { observador.observe(el); });

document.addEventListener('fase-no-ar', function (e) {
    if (e.detail !== 'c') return;
    alvos.forEach(function (el) {
        if (el.dataset.contado) return;
        el.dataset.contado = '1';
        observador.unobserve(el);
        contar(el);
    });
});

})();

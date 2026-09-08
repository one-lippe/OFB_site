/* ═══════════════════════════════════════════════════════════════
   CONTADOR DOS NÚMEROS · bloco 2

   Regras que valem aqui, da régua de movimento:

   · O valor final já está escrito no HTML. Com o JS desligado, ou
     se este arquivo falhar, o número certo continua na tela. A
     animação só assume o que já existe.
   · Dispara uma vez, quando o bloco entra em cena. Não repete a
     cada rolagem — repetir transforma informação em enfeite.
   · ease-out: começa rápido e assenta. É a curva de entrada, e o
     ease-in nunca entra em interface.
   · Com prefers-reduced-motion, o número aparece direto no valor
     final. Movimento reduzido é menos movimento, não menos
     informação.
   ═══════════════════════════════════════════════════════════════ */
(function () {
'use strict';

var alvos = Array.prototype.slice.call(document.querySelectorAll('[data-contador]'));
if (!alvos.length) return;

var reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduzido || !('IntersectionObserver' in window)) return;  /* o HTML já traz o valor certo */

var DURACAO = 1100;   /* dentro da faixa que o Lippe pediu, 900–1200ms */

/* ease-out forte, a mesma curva do resto do site (--ease-out).
   Cúbica: 1 − (1 − t)³ */
function saida(t) { var u = 1 - t; return 1 - u * u * u; }

function formatar(n, prefixo) {
    return (prefixo || '') + n.toLocaleString('pt-BR');
}

function contar(el) {
    var fim     = parseInt(el.getAttribute('data-contador'), 10);
    var prefixo = el.getAttribute('data-prefixo') || '';
    if (isNaN(fim)) return;

    /* Reserva a largura do valor final antes de começar, senão o
       bloco todo dança enquanto o número cresce de 1 para 15.000. */
    el.style.minWidth = el.getBoundingClientRect().width + 'px';
    el.setAttribute('aria-label', formatar(fim, prefixo));

    var inicio = null;
    function passo(t) {
        if (inicio === null) inicio = t;
        var p = Math.min((t - inicio) / DURACAO, 1);
        el.textContent = formatar(Math.round(fim * saida(p)), prefixo);
        if (p < 1) requestAnimationFrame(passo);
        else el.textContent = formatar(fim, prefixo);   /* fecha no valor exato */
    }
    requestAnimationFrame(passo);
}

var observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        observador.unobserve(e.target);   /* uma vez só */
        contar(e.target);
    });
}, { threshold: 0.6 });

alvos.forEach(function (el) { observador.observe(el); });

/* Dentro do hero os números não entram na viewport rolando: o bloco
   troca por opacity, no mesmo lugar da tela. O IntersectionObserver
   não vê isso, então a troca de fase avisa. */
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


(function () {
'use strict';

var cabecalho = document.querySelector('.cabecalho');
var ticking   = false;

function aoRolar() {
    cabecalho.classList.toggle('rolado', window.scrollY > 8);
    ticking = false;
}

window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(aoRolar); ticking = true; }
}, { passive: true });
aoRolar();

var toggle = document.querySelector('.menu-toggle');
var menu   = document.querySelector('.menu');
var veu    = document.querySelector('.veu');

function abrirMenu(abrir) {
    toggle.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    menu.classList.toggle('aberto', abrir);
    veu.classList.toggle('visivel', abrir);
    document.body.style.overflow = abrir ? 'hidden' : '';
}

toggle.addEventListener('click', function () {
    abrirMenu(toggle.getAttribute('aria-expanded') !== 'true');
});
veu.addEventListener('click', function () { abrirMenu(false); });

menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) abrirMenu(false);
});
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        abrirMenu(false);
        toggle.focus();
    }
});

window.matchMedia('(min-width: 901px)').addEventListener('change', function (mq) {
    if (mq.matches) abrirMenu(false);
});

var abasAgenteTur = Array.prototype.slice.call(
    document.querySelectorAll('[data-agentetur-aba]')
);
var paineisAgenteTur = Array.prototype.slice.call(
    document.querySelectorAll('[data-agentetur-painel]')
);

function ativarAbaAgenteTur(aba, levarFoco) {
    if (!aba) return;
    var nome = aba.getAttribute('data-agentetur-aba');

    abasAgenteTur.forEach(function (item) {
        var ativa = item === aba;
        item.classList.toggle('ativo', ativa);
        item.setAttribute('aria-selected', ativa ? 'true' : 'false');
        item.setAttribute('tabindex', ativa ? '0' : '-1');
    });

    paineisAgenteTur.forEach(function (painel) {
        var ativo = painel.getAttribute('data-agentetur-painel') === nome;
        painel.classList.toggle('ativo', ativo);
        painel.setAttribute('aria-hidden', ativo ? 'false' : 'true');
    });

    if (levarFoco) aba.focus();
}

abasAgenteTur.forEach(function (aba, indice) {
    aba.addEventListener('click', function () {
        ativarAbaAgenteTur(aba, false);
    });

    aba.addEventListener('keydown', function (e) {
        var proximo = indice;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') proximo = (indice + 1) % abasAgenteTur.length;
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') proximo = (indice - 1 + abasAgenteTur.length) % abasAgenteTur.length;
        else if (e.key === 'Home') proximo = 0;
        else if (e.key === 'End') proximo = abasAgenteTur.length - 1;
        else return;

        e.preventDefault();
        ativarAbaAgenteTur(abasAgenteTur[proximo], true);
    });
});

var links = Array.prototype.slice.call(document.querySelectorAll('.menu a[href^="#"]'));
var pista = document.getElementById('pista');

function acender(link) {
    links.forEach(function (l) { l.classList.toggle('ativo', l === link); });
}

var primeiraFase = document.querySelector('.fase[data-fase]');
var linkDaFase = {};
var foraDoHero = [];

links.forEach(function (a) {
    var el = document.querySelector(a.getAttribute('href'));
    if (!el) return;
    if (el === pista) {
        if (primeiraFase) linkDaFase[primeiraFase.dataset.fase] = a;
    } else if (el.dataset && el.dataset.fase) {
        linkDaFase[el.dataset.fase] = a;
    } else {
        foraDoHero.push({ link: a, el: el });
    }
});

document.addEventListener('fase-no-ar', function (e) {

    acender(linkDaFase[e.detail] || null);
});

if (foraDoHero.length && 'IntersectionObserver' in window) {
    var observador = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (entrada) {
            if (!entrada.isIntersecting) return;
            var par = foraDoHero.filter(function (p) { return p.el === entrada.target; })[0];
            if (par) acender(par.link);
        });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

    foraDoHero.forEach(function (p) { observador.observe(p.el); });
}

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches
    && 'IntersectionObserver' in window) {

    var grupos = document.querySelectorAll('[data-revela]');
    var olho = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
            if (!e.isIntersecting) return;
            e.target.classList.add('revelado');
            olho.unobserve(e.target);
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    Array.prototype.forEach.call(grupos, function (g) { olho.observe(g); });

    document.addEventListener('fase-no-ar', function (e) {
        var fase = document.querySelector('.fase[data-fase="' + e.detail + '"]');
        if (!fase) return;
        fase.querySelectorAll('[data-revela]').forEach(function (g) {
            g.classList.add('revelado');
        });
    });
}

})();

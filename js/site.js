/* ═══════════════════════════════════════════════════════════════
   SITE OFB · comportamento
   Vanilla, sem dependência. Cada bloco é independente do outro.
   ═══════════════════════════════════════════════════════════════ */
(function () {
'use strict';

/* ── Header: encolhe ao rolar ─────────────────────────────────────
   O bloco fixo sobe pela altura da barra utilitária. Só transform,
   feito no CSS; aqui só entra e sai a classe.
   Histerese: encolhe passando de 60px, volta só abaixo de 20px.
   Sem isso, uma rolagem parada no limiar fica piscando.
   ── */
var cabecalho = document.querySelector('.cabecalho');
var encolhido = false;
var ticking   = false;

function aoRolar() {
    var y = window.scrollY;

    if (!encolhido && y > 60)      { encolhido = true;  cabecalho.classList.add('encolhido'); }
    else if (encolhido && y < 20)  { encolhido = false; cabecalho.classList.remove('encolhido'); }

    cabecalho.classList.toggle('rolado', y > 8);
    ticking = false;
}

window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(aoRolar); ticking = true; }
}, { passive: true });
aoRolar();


/* ── Menu do celular ─────────────────────────────────────────── */
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

/* Fecha ao escolher um destino e ao apertar Esc. */
menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) abrirMenu(false);
});
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        abrirMenu(false);
        toggle.focus();
    }
});
/* Ao voltar para o desktop, desfaz qualquer estado de drawer. */
window.matchMedia('(min-width: 901px)').addEventListener('change', function (mq) {
    if (mq.matches) abrirMenu(false);
});


/* ── agente.tur: demonstração guiada ────────────────────────────
   Três abas trocam apenas a prova visual. O conteúdo continua todo
   no HTML, inclusive sem JavaScript; aqui entram estado, foco e a
   navegação por setas prevista para um tablist acessível.
   ── */
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


/* ── Item de menu ativo conforme a seção na tela ────────────────
   Os três destinos do menu — Home, Quem somos, O que oferecemos —
   moram todos dentro do hero, empilhados no mesmo ponto da tela e
   trocando por opacity. Para um IntersectionObserver os três estão
   visíveis o tempo todo e nunca deixam de estar: ele acende o último
   que disparar e nunca mais apaga. Era o "O que oferecemos" preso.

   Quem sabe qual bloco está no ar é o hero, e ele avisa por
   `fase-no-ar`. O observador fica só para destinos fora do hero, que
   hoje não existem — mas existirão quando o menu ganhar uma seção de
   verdade abaixo dele.
   ── */
var links = Array.prototype.slice.call(document.querySelectorAll('.menu a[href^="#"]'));
var pista = document.getElementById('pista');

function acender(link) {
    links.forEach(function (l) { l.classList.toggle('ativo', l === link); });
}

/* Cada link do menu, pela fase que ele representa. O Home aponta para a
   pista inteira, então vale pela primeira fase dela. */
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
    /* Nas fases sem bloco — o punch e o fechamento — nada fica aceso:
       não são seções do menu. */
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

/* ── Reveal ao rolar ─────────────────────────────────────────────
   Dispara uma vez por grupo, quando ele entra em cena. O atraso entre
   os irmãos é do CSS; aqui só entra a classe. Com movimento reduzido
   não observa nada: o CSS já deixa tudo visível.
   ── */
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches
    && 'IntersectionObserver' in window) {

    var grupos = document.querySelectorAll('[data-revela]');
    var olho = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
            if (!e.isIntersecting) return;
            e.target.classList.add('revelado');
            olho.unobserve(e.target);      /* uma vez só */
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    Array.prototype.forEach.call(grupos, function (g) { olho.observe(g); });

    /* Dentro do hero o bloco não entra em cena rolando: ele troca por
       opacity, no mesmo lugar da tela, e o IntersectionObserver não vê
       isso. A troca de fase avisa. */
    document.addEventListener('fase-no-ar', function (e) {
        var fase = document.querySelector('.fase[data-fase="' + e.detail + '"]');
        if (!fase) return;
        fase.querySelectorAll('[data-revela]').forEach(function (g) {
            g.classList.add('revelado');
        });
    });
}

})();

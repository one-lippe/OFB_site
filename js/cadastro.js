
(function () {
'use strict';

var form = document.getElementById('cad-form');
if (!form) return;

var DESTINO   = 'comercial@ofb.com.br';
var resultado = form.querySelector('.cad-resultado');
var botao     = form.querySelector('.cad-enviar');

var h = location.hostname;
var PREVIA = (h === 'localhost' || h === '127.0.0.1' || h === '' || /\.github\.io$/.test(h));

var MASCARAS = {
    cnpj: function (d) {
        d = d.slice(0, 14);
        return d.replace(/^(\d{2})(\d)/, '$1.$2')
                .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                .replace(/\.(\d{3})(\d)/, '.$1/$2')
                .replace(/(\d{4})(\d)/, '$1-$2');
    },
    telefone: function (d) {
        d = d.slice(0, 11);
        if (d.length <= 10) {
            return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
        }
        return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
    },
    cep: function (d) {
        return d.slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
    }
};

Array.prototype.forEach.call(form.querySelectorAll('[data-mascara]'), function (campo) {
    var f = MASCARAS[campo.getAttribute('data-mascara')];
    if (!f) return;
    campo.addEventListener('input', function () {
        var digitos = campo.value.replace(/\D/g, '');
        campo.value = f(digitos);
    });
});

function cnpjValido(v) {
    var d = v.replace(/\D/g, '');
    if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
    function dv(base, pesos) {
        var soma = 0;
        for (var i = 0; i < pesos.length; i++) soma += parseInt(base[i], 10) * pesos[i];
        var r = soma % 11;
        return r < 2 ? 0 : 11 - r;
    }
    var p1 = [5,4,3,2,9,8,7,6,5,4,3,2];
    var p2 = [6].concat(p1);
    return dv(d, p1) === parseInt(d[12], 10) && dv(d, p2) === parseInt(d[13], 10);
}

var MENSAGENS = {
    vazio:    'Preencha este campo.',
    cnpj:     'Confira o CNPJ: são 14 dígitos e o número não bateu.',
    telefone: 'Informe o DDD e o número, com 10 ou 11 dígitos.',
    email:    'Informe um e-mail válido, como nome@agencia.com.br.',
    cep:      'O CEP tem 8 dígitos.'
};

function mensagemDe(campo) {
    var v = campo.value.trim();
    if (campo.required && !v) return MENSAGENS.vazio;
    if (!v) return '';
    var m = campo.getAttribute('data-mascara');
    if (m === 'cnpj'     && !cnpjValido(v))                        return MENSAGENS.cnpj;
    if (m === 'telefone' && !/^\d{10,11}$/.test(v.replace(/\D/g, ''))) return MENSAGENS.telefone;
    if (m === 'cep'      && !/^\d{8}$/.test(v.replace(/\D/g, '')))   return MENSAGENS.cep;
    if (campo.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return MENSAGENS.email;
    return '';
}

function marcar(campo, msg) {
    var caixa = campo.closest('.cad-campo');
    var erro  = caixa && caixa.querySelector('.cad-erro');
    caixa.classList.toggle('invalido', !!msg);
    campo.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (erro) {
        erro.textContent = msg;
        if (msg) campo.setAttribute('aria-describedby', erro.id);
        else campo.removeAttribute('aria-describedby');
    }
    return !msg;
}

var campos = Array.prototype.slice.call(form.querySelectorAll('.cad-campo input, .cad-campo select'));

campos.forEach(function (campo) {

    campo.addEventListener('blur', function () { marcar(campo, mensagemDe(campo)); });
    campo.addEventListener('input', function () {
        if (campo.closest('.cad-campo').classList.contains('invalido')) marcar(campo, mensagemDe(campo));
    });
});

function validarTudo() {
    var primeiro = null;
    campos.forEach(function (campo) {
        if (!marcar(campo, mensagemDe(campo)) && !primeiro) primeiro = campo;
    });
    if (primeiro) primeiro.focus();
    return !primeiro;
}

function dados() {
    var o = {};
    campos.forEach(function (c) { o[c.name] = c.value.trim(); });
    return o;
}

function mostrar(classe, html) {
    resultado.className = 'cad-resultado ' + classe;
    resultado.innerHTML = html;
    resultado.hidden = false;
    if (classe === 'ok') form.classList.add('enviado');
    resultado.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function corpoEmail(d) {
    return [
        'Ficha de cadastro de agência — site OFB', '',
        'Razão social: ' + d.razao_social,
        'Nome fantasia: ' + d.nome_fantasia,
        'CNPJ: ' + d.cnpj, '',
        'Responsável: ' + d.responsavel,
        'Telefone: ' + d.telefone,
        'E-mail: ' + d.email, '',
        'CEP: ' + d.cep,
        'Endereço: ' + d.endereco,
        'Bairro: ' + d.bairro,
        'Cidade/UF: ' + d.cidade + '/' + d.uf
    ].join('\n');
}

function enviarPrevia(d) {
    var mailto = 'mailto:' + DESTINO
        + '?subject=' + encodeURIComponent('Cadastro de agência: ' + d.nome_fantasia)
        + '&body='    + encodeURIComponent(corpoEmail(d));
    mostrar('ok',
        '<p><b>Ficha pronta.</b> Nesta prévia o envio automático ainda não está ligado: '
        + 'ele passa a funcionar quando o site subir para ofb.com.br.</p>'
        + '<p>Enquanto isso, <a href="' + mailto + '">envie a ficha por e-mail</a> para '
        + DESTINO + ' — ela já vai preenchida.</p>');
}

function enviarServidor(d) {
    botao.classList.add('enviando');
    botao.setAttribute('aria-busy', 'true');

    var fd = new FormData(form);
    fetch(form.action, { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (j) {
            if (j && j.ok) {
                mostrar('ok',
                    '<p><b>Ficha enviada.</b> O comercial da OFB entra em contato com '
                    + 'você em horário comercial.</p>');
            } else {
                throw new Error((j && j.erro) || 'resposta inesperada');
            }
        })
        .catch(function () {
            var mailto = 'mailto:' + DESTINO
                + '?subject=' + encodeURIComponent('Cadastro de agência: ' + d.nome_fantasia)
                + '&body='    + encodeURIComponent(corpoEmail(d));
            mostrar('falha',
                '<p><b>Não foi possível enviar agora.</b> Tente de novo em instantes ou '
                + '<a href="' + mailto + '">mande a ficha por e-mail</a> para ' + DESTINO + '.</p>');
        })
        .then(function () {
            botao.classList.remove('enviando');
            botao.removeAttribute('aria-busy');
        });
}

form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.querySelector('[name="site"]').value) return;
    if (!validarTudo()) return;
    var d = dados();
    if (PREVIA) enviarPrevia(d);
    else        enviarServidor(d);
});

})();

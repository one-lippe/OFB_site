(function () {
'use strict';

var forms = Array.prototype.slice.call(document.querySelectorAll('form[data-formulario]'));
if (!forms.length) return;

var CFG     = window.OFB || {};
var DESTINO = CFG.destino || 'comercial@ofb.com.br';
var h       = location.hostname;
var PREVIA  = (h === 'localhost' || h === '127.0.0.1' || h === '' || /\.github\.io$/.test(h));

var ANEXO_MAX_CADA  = 4 * 1024 * 1024;
var ANEXO_MAX_TOTAL = 15 * 1024 * 1024;
var ANEXO_TIPOS     = ['application/pdf', 'image/jpeg', 'image/png'];
var ANEXO_MAX_QTD   = 8;

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
        if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
        return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
    },
    cep: function (d) {
        return d.slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
    }
};

var MENSAGENS = {
    vazio:    'Preencha este campo.',
    arquivo:  'Anexe os documentos.',
    quantidade: 'No máximo 8 arquivos.',
    cnpj:     'Confira o CNPJ: são 14 dígitos e o número não bateu.',
    telefone: 'Informe o DDD e o número, com 10 ou 11 dígitos.',
    email:    'Informe um e-mail válido, como nome@agencia.com.br.',
    cep:      'O CEP tem 8 dígitos.',
    tipo:     'Envie em PDF, JPG ou PNG.',
    tamanho:  'O arquivo passa de 4 MB.',
    total:    'Os documentos juntos passam de 15 MB.',
    captcha:  'Confirme que você não é um robô.'
};

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

function mensagemDe(campo, noEnvio) {
    if (campo.type === 'file') {
        var lista = campo.files ? Array.prototype.slice.call(campo.files) : [];
        if (campo.required && !lista.length) return noEnvio ? MENSAGENS.arquivo : '';
        if (lista.length > ANEXO_MAX_QTD) return MENSAGENS.quantidade;
        var total = 0;
        for (var i = 0; i < lista.length; i++) {
            if (ANEXO_TIPOS.indexOf(lista[i].type) < 0) return MENSAGENS.tipo;
            if (lista[i].size > ANEXO_MAX_CADA) return MENSAGENS.tamanho;
            total += lista[i].size;
        }
        if (total > ANEXO_MAX_TOTAL) return MENSAGENS.total;
        return '';
    }
    var v = campo.value.trim();
    if (campo.required && !v) return noEnvio ? MENSAGENS.vazio : '';
    if (!v) return '';
    var m = campo.getAttribute('data-mascara');
    if (m === 'cnpj'     && !cnpjValido(v))                                  return MENSAGENS.cnpj;
    if (m === 'telefone' && !/^\d{10,11}$/.test(v.replace(/\D/g, '')))       return MENSAGENS.telefone;
    if (m === 'cep'      && !/^\d{8}$/.test(v.replace(/\D/g, '')))           return MENSAGENS.cep;
    if (campo.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return MENSAGENS.email;
    return '';
}

function marcar(campo, msg) {
    var caixa = campo.closest('.campo');
    var erro  = caixa && caixa.querySelector('.campo-erro');
    if (!caixa) return !msg;
    caixa.classList.toggle('invalido', !!msg);
    campo.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (erro) {
        erro.textContent = msg;
        if (msg) campo.setAttribute('aria-describedby', erro.id);
        else campo.removeAttribute('aria-describedby');
    }
    return !msg;
}

function rotuloDe(campo) {
    var l = campo.closest('.campo') && campo.closest('.campo').querySelector('label');
    return l ? l.textContent.trim() : campo.name;
}

function captchaToken(form) {
    var caixa = form.querySelector('.g-recaptcha');
    if (!caixa || !CFG.recaptchaSiteKey || !window.grecaptcha) return null;
    var id = caixa.getAttribute('data-widget');
    return id === null ? '' : grecaptcha.getResponse(parseInt(id, 10));
}

function carregarCaptcha() {
    if (!CFG.recaptchaSiteKey) return;
    var caixas = document.querySelectorAll('.g-recaptcha');
    if (!caixas.length) return;
    window.ofbCaptchaPronto = function () {
        Array.prototype.forEach.call(caixas, function (caixa) {
            var id = grecaptcha.render(caixa, { sitekey: CFG.recaptchaSiteKey, hl: 'pt-BR' });
            caixa.setAttribute('data-widget', id);
        });
    };
    var s = document.createElement('script');
    s.src = 'https://www.google.com/recaptcha/api.js?onload=ofbCaptchaPronto&render=explicit';
    s.async = true; s.defer = true;
    document.head.appendChild(s);
}

forms.forEach(function (form) {
    var resultado = form.querySelector('.form-resultado');
    var botao     = form.querySelector('.form-enviar');
    var captcha   = form.querySelector('.captcha');
    var aviso     = form.querySelector('.form-aviso');
    var assunto   = form.getAttribute('data-assunto') || 'Formulário do site OFB';
    var campos    = Array.prototype.slice.call(form.querySelectorAll('.campo input, .campo select, .campo textarea'));

    if (captcha && !CFG.recaptchaSiteKey) captcha.hidden = true;

    campos.forEach(function (campo) {
        var f = MASCARAS[campo.getAttribute('data-mascara')];
        if (f) campo.addEventListener('input', function () { campo.value = f(campo.value.replace(/\D/g, '')); });
        if (campo.type === 'file') campo.addEventListener('change', function () { marcar(campo, mensagemDe(campo)); });
        campo.addEventListener('blur', function () { marcar(campo, mensagemDe(campo)); });
        campo.addEventListener('input', function () {
            if (campo.closest('.campo').classList.contains('invalido')) marcar(campo, mensagemDe(campo));
        });
    });

    function validarTudo() {
        var primeiro = null;
        campos.forEach(function (campo) {
            if (!marcar(campo, mensagemDe(campo, true)) && !primeiro) primeiro = campo;
        });
        if (!primeiro && captcha && !captcha.hidden) {
            var token = captchaToken(form);
            var erro = captcha.querySelector('.campo-erro');
            if (token === '') {
                if (erro) erro.textContent = MENSAGENS.captcha;
                captcha.classList.add('invalido');
                primeiro = captcha;
            } else {
                if (erro) erro.textContent = '';
                captcha.classList.remove('invalido');
            }
        }
        if (aviso) aviso.textContent = primeiro ? (form.getAttribute('data-aviso') || 'Preencha os campos obrigatórios.') : '';
        if (primeiro && primeiro.focus) primeiro.focus();
        if (primeiro && primeiro.scrollIntoView && !primeiro.focus) primeiro.scrollIntoView({ block: 'center' });
        return !primeiro;
    }

    function linhas() {
        var out = [assunto, ''];
        campos.forEach(function (c) {
            if (c.type === 'file') {
                var nomes = c.files ? Array.prototype.map.call(c.files, function (f) { return f.name; }) : [];
                out.push('Documentos: ' + (nomes.length ? nomes.join(', ') + ' (anexar a este e-mail)' : 'não enviados'));
            } else if (c.type !== 'hidden') {
                out.push(rotuloDe(c) + ': ' + c.value.trim());
            }
        });
        return out.join('\n');
    }

    function tituloDoAssunto() {
        var chave = form.getAttribute('data-assunto-campo');
        var c = chave && form.querySelector('[name="' + chave + '"]');
        return assunto + (c && c.value.trim() ? ': ' + c.value.trim() : '');
    }

    function mostrar(classe, html) {
        resultado.className = 'form-resultado ' + classe;
        resultado.innerHTML = html;
        resultado.hidden = false;
        if (classe === 'ok') form.classList.add('enviado');
        resultado.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function mailto() {
        return 'mailto:' + DESTINO + '?subject=' + encodeURIComponent(tituloDoAssunto())
             + '&body=' + encodeURIComponent(linhas());
    }

    function enviarPrevia() {
        var temAnexo = campos.some(function (c) { return c.type === 'file' && c.files && c.files.length; });
        mostrar('ok',
            '<p><b>' + (form.getAttribute('data-previa-titulo') || 'Pronto.') + '</b> Nesta prévia o envio automático '
            + 'ainda não está ligado: ele passa a funcionar quando o site subir para ofb.com.br.</p>'
            + '<p>Enquanto isso, <a href="' + mailto() + '">envie por e-mail</a> para ' + DESTINO
            + (temAnexo ? ', anexando os documentos escolhidos' : '') + ' — o texto já vai preenchido.</p>');
    }

    function enviarServidor() {
        botao.classList.add('enviando');
        botao.setAttribute('aria-busy', 'true');
        fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
            .then(function (r) { return r.json(); })
            .then(function (j) {
                if (j && j.ok) mostrar('ok', '<p><b>' + (form.getAttribute('data-ok') || 'Enviado.') + '</b></p>');
                else throw new Error((j && j.erro) || 'resposta inesperada');
            })
            .catch(function (e) {
                mostrar('falha',
                    '<p><b>Não foi possível enviar agora.</b> ' + (e && e.message ? e.message.charAt(0).toUpperCase() + e.message.slice(1) + '. ' : '')
                    + 'Tente de novo em instantes ou <a href="' + mailto() + '">mande por e-mail</a> para ' + DESTINO + '.</p>');
                if (window.grecaptcha && captcha && !captcha.hidden) {
                    var id = captcha.querySelector('.g-recaptcha').getAttribute('data-widget');
                    if (id !== null) grecaptcha.reset(parseInt(id, 10));
                }
            })
            .then(function () {
                botao.classList.remove('enviando');
                botao.removeAttribute('aria-busy');
            });
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var armadilha = form.querySelector('[name="site"]');
        if (armadilha && armadilha.value) return;
        if (!validarTudo()) return;
        if (PREVIA) enviarPrevia();
        else        enviarServidor();
    });
});

carregarCaptcha();

})();

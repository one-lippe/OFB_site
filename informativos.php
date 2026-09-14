<?php
require __DIR__ . '/_envio.php';

exigir_post('index.html');

if (!captcha_ok()) responder(false, 'confirme que você não é um robô', 'index.html');

$f = [
    'nome'     => campo('nome', 80),
    'agencia'  => campo('agencia', 120),
    'email'    => campo('email', 120),
    'telefone' => campo('telefone', 15),
];

foreach ($f as $nome => $valor) {
    if ($valor === '') responder(false, "campo obrigatório vazio: $nome", 'index.html');
}
if (!filter_var($f['email'], FILTER_VALIDATE_EMAIL)) responder(false, 'e-mail inválido', 'index.html');
if (!telefone_valido($f['telefone']))                responder(false, 'telefone inválido', 'index.html');

$enviou = enviar_email(
    'Informativos: ' . $f['agencia'],
    $f['nome'] . ' <' . $f['email'] . '>',
    'Novo cadastro para os informativos',
    $f['agencia'] . ' · recebido em ' . date('d/m/Y \à\s H:i'),
    ['Quem pediu' => [
        'Nome'     => $f['nome'],
        'Agência'  => $f['agencia'],
        'E-mail'   => $f['email'],
        'Telefone' => $f['telefone'],
    ]],
    "Enviado pelo formulário Receba nossos informativos, na home de ofb.com.br.\nIncluir este e-mail na lista de disparos da OFB."
);

responder((bool)$enviou, $enviou ? '' : 'o servidor não conseguiu enviar o e-mail', 'index.html');

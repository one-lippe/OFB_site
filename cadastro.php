<?php

const DESTINO   = 'comercial@ofb.com.br';
const REMETENTE = 'site@ofb.com.br';
const ASSUNTO   = 'Cadastro de agência pelo site';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$quer_json = strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

function responder($ok, $erro = '') {
    global $quer_json;
    if (!$quer_json) {
        header('Location: cadastro.html?' . ($ok ? 'enviado=1' : 'erro=1'), true, 303);
        exit;
    }
    echo json_encode(['ok' => $ok, 'erro' => $erro], JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    responder(false, 'método não permitido');
}

if (!empty($_POST['site'])) {
    responder(true);
}

function campo($nome, $max = 160) {
    $v = trim((string)($_POST[$nome] ?? ''));
    $v = preg_replace('/[\r\n\t]+/', ' ', $v);
    return mb_substr($v, 0, $max);
}

function cnpj_valido($v) {
    $d = preg_replace('/\D/', '', $v);
    if (strlen($d) !== 14 || preg_match('/^(\d)\1{13}$/', $d)) return false;
    $dv = function ($base, $pesos) {
        $soma = 0;
        foreach ($pesos as $i => $p) $soma += (int)$base[$i] * $p;
        $r = $soma % 11;
        return $r < 2 ? 0 : 11 - $r;
    };
    $p1 = [5,4,3,2,9,8,7,6,5,4,3,2];
    $p2 = array_merge([6], $p1);
    return $dv($d, $p1) === (int)$d[12] && $dv($d, $p2) === (int)$d[13];
}

$f = [
    'razao_social'  => campo('razao_social', 120),
    'nome_fantasia' => campo('nome_fantasia', 120),
    'cnpj'          => campo('cnpj', 18),
    'responsavel'   => campo('responsavel', 80),
    'telefone'      => campo('telefone', 15),
    'email'         => campo('email', 120),
    'cep'           => campo('cep', 9),
    'endereco'      => campo('endereco', 160),
    'bairro'        => campo('bairro', 80),
    'cidade'        => campo('cidade', 80),
    'uf'            => strtoupper(campo('uf', 2)),
];

foreach ($f as $nome => $valor) {
    if ($valor === '') responder(false, "campo obrigatório vazio: $nome");
}
if (!cnpj_valido($f['cnpj']))                                   responder(false, 'CNPJ inválido');
if (!preg_match('/^\d{10,11}$/', preg_replace('/\D/', '', $f['telefone']))) responder(false, 'telefone inválido');
if (!filter_var($f['email'], FILTER_VALIDATE_EMAIL))            responder(false, 'e-mail inválido');
if (!preg_match('/^\d{8}$/', preg_replace('/\D/', '', $f['cep']))) responder(false, 'CEP inválido');
if (!preg_match('/^[A-Z]{2}$/', $f['uf']))                      responder(false, 'UF inválida');

$corpo = implode("\n", [
    'Ficha de cadastro de agência — site OFB',
    'Recebida em ' . date('d/m/Y H:i') . ' (' . ($_SERVER['REMOTE_ADDR'] ?? '') . ')',
    '',
    'Razão social:  ' . $f['razao_social'],
    'Nome fantasia: ' . $f['nome_fantasia'],
    'CNPJ:          ' . $f['cnpj'],
    '',
    'Responsável:   ' . $f['responsavel'],
    'Telefone:      ' . $f['telefone'],
    'E-mail:        ' . $f['email'],
    '',
    'CEP:           ' . $f['cep'],
    'Endereço:      ' . $f['endereco'],
    'Bairro:        ' . $f['bairro'],
    'Cidade/UF:     ' . $f['cidade'] . '/' . $f['uf'],
]);

$cabecalhos = implode("\r\n", [
    'From: OFB Site <' . REMETENTE . '>',
    'Reply-To: ' . $f['responsavel'] . ' <' . $f['email'] . '>',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: site-ofb',
]);

$assunto = '=?UTF-8?B?' . base64_encode(ASSUNTO . ': ' . $f['nome_fantasia']) . '?=';

$enviou = @mail(DESTINO, $assunto, $corpo, $cabecalhos, '-f' . REMETENTE);

responder((bool)$enviou, $enviou ? '' : 'o servidor não conseguiu enviar o e-mail');

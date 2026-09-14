<?php
require __DIR__ . '/_envio.php';

exigir_post('cadastro.html');

if (!captcha_ok()) responder(false, 'confirme que você não é um robô', 'cadastro.html');

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
    if ($valor === '') responder(false, "campo obrigatório vazio: $nome", 'cadastro.html');
}
if (!cnpj_valido($f['cnpj']))                                    responder(false, 'CNPJ inválido', 'cadastro.html');
if (!telefone_valido($f['telefone']))                            responder(false, 'telefone inválido', 'cadastro.html');
if (!filter_var($f['email'], FILTER_VALIDATE_EMAIL))             responder(false, 'e-mail inválido', 'cadastro.html');
if (!preg_match('/^\d{8}$/', preg_replace('/\D/', '', $f['cep']))) responder(false, 'CEP inválido', 'cadastro.html');
if (!preg_match('/^[A-Z]{2}$/', $f['uf']))                       responder(false, 'UF inválida', 'cadastro.html');

$DOCUMENTOS = [
    'doc_cartao_cnpj'  => 'Cartão CNPJ',
    'doc_endereco'     => 'Comprovante de endereço',
    'doc_rg_socio'     => 'RG do sócio',
    'doc_contrato'     => 'Contrato social',
    'doc_bancarios'    => 'Dados bancários',
];
list($anexos, $erro_anexo) = anexos($DOCUMENTOS);
if ($erro_anexo !== '') responder(false, $erro_anexo, 'cadastro.html');

$recebidos = [];
foreach ($DOCUMENTOS as $nome => $rotulo) {
    $tem = false;
    foreach ($anexos as $a) if ($a['rotulo'] === $rotulo) { $tem = true; $recebidos[$rotulo] = $a['nome'] . ' · ' . round($a['tamanho'] / 1024) . ' KB'; }
    if (!$tem) $recebidos[$rotulo] = 'não enviado';
}

$grupos = [
    'Dados da empresa' => [
        'Razão social'  => $f['razao_social'],
        'Nome fantasia' => $f['nome_fantasia'],
        'CNPJ'          => $f['cnpj'],
    ],
    'Contato' => [
        'Responsável' => $f['responsavel'],
        'Telefone'    => $f['telefone'],
        'E-mail'      => $f['email'],
    ],
    'Endereço' => [
        'Endereço'  => $f['endereco'],
        'Bairro'    => $f['bairro'],
        'Cidade/UF' => $f['cidade'] . '/' . $f['uf'],
        'CEP'       => $f['cep'],
    ],
    'Documentos anexados' => $recebidos,
];

$enviou = enviar_email(
    'Cadastro de agência: ' . $f['nome_fantasia'],
    $f['responsavel'] . ' <' . $f['email'] . '>',
    'Nova ficha de cadastro',
    $f['nome_fantasia'] . ' · recebida em ' . date('d/m/Y \à\s H:i'),
    $grupos,
    "Enviada pelo formulário Cadastre sua agência em ofb.com.br.\nResponder este e-mail fala direto com " . $f['responsavel'] . '.',
    $anexos
);

responder((bool)$enviou, $enviou ? '' : 'o servidor não conseguiu enviar o e-mail', 'cadastro.html');

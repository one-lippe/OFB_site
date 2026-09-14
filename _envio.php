<?php

const DESTINO_TESTE = 'philippe@ofb.com.br';
const DESTINO_FINAL = 'comercial@ofb.com.br';
const DESTINO       = DESTINO_TESTE;
const REMETENTE     = 'site@ofb.com.br';

const ANEXO_MAX_CADA  = 4 * 1024 * 1024;
const ANEXO_MAX_TOTAL = 15 * 1024 * 1024;
const ANEXO_MAX_QTD   = 8;
const ANEXO_TIPOS     = ['application/pdf' => 'pdf', 'image/jpeg' => 'jpg', 'image/png' => 'png'];

$RECAPTCHA_SECRET = '';
if (is_file(__DIR__ . '/_segredos.php')) {
    include __DIR__ . '/_segredos.php';
}

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$QUER_JSON = strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

function responder($ok, $erro = '', $volta = 'index.html') {
    global $QUER_JSON;
    if (!$QUER_JSON) {
        header('Location: ' . $volta . '?' . ($ok ? 'enviado=1' : 'erro=1'), true, 303);
        exit;
    }
    echo json_encode(['ok' => $ok, 'erro' => $erro], JSON_UNESCAPED_UNICODE);
    exit;
}

function exigir_post($volta) {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        http_response_code(405);
        responder(false, 'método não permitido', $volta);
    }
    if (!empty($_POST['site'])) {
        responder(true, '', $volta);
    }
}

function campo($nome, $max = 160) {
    $v = trim((string)($_POST[$nome] ?? ''));
    $v = preg_replace('/[\r\n\t]+/', ' ', $v);
    return mb_substr($v, 0, $max);
}

function telefone_valido($v) {
    return (bool)preg_match('/^\d{10,11}$/', preg_replace('/\D/', '', $v));
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

function captcha_ok() {
    global $RECAPTCHA_SECRET;
    if ($RECAPTCHA_SECRET === '') return true;
    $token = trim((string)($_POST['g-recaptcha-response'] ?? ''));
    if ($token === '') return false;
    $ctx = stream_context_create(['http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/x-www-form-urlencoded\r\n",
        'content' => http_build_query(['secret' => $RECAPTCHA_SECRET, 'response' => $token,
                                       'remoteip' => $_SERVER['REMOTE_ADDR'] ?? '']),
        'timeout' => 8,
    ]]);
    $r = @file_get_contents('https://www.google.com/recaptcha/api/siteverify', false, $ctx);
    $j = $r ? json_decode($r, true) : null;
    return !empty($j['success']);
}

function anexos($campo) {
    $lista = [];
    $total = 0;
    $arq = $_FILES[$campo] ?? null;
    if (!$arq || !is_array($arq['name'])) return [$lista, ''];
    if (count($arq['name']) > ANEXO_MAX_QTD) return [null, 'no máximo ' . ANEXO_MAX_QTD . ' arquivos'];
    $finfo = function_exists('finfo_open') ? finfo_open(FILEINFO_MIME_TYPE) : null;
    foreach ($arq['name'] as $i => $nome_original) {
        if (($arq['error'][$i] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) continue;
        $rotulo = mb_substr(preg_replace('/[^\w.\- ]+/u', '_', (string)$nome_original), 0, 80);
        if ($arq['error'][$i] !== UPLOAD_ERR_OK)        return [null, "falha ao receber: $rotulo"];
        if ($arq['size'][$i] > ANEXO_MAX_CADA)          return [null, "$rotulo passa de 4 MB"];
        if (!is_uploaded_file($arq['tmp_name'][$i]))     return [null, "arquivo inválido: $rotulo"];
        $mime = $finfo ? finfo_file($finfo, $arq['tmp_name'][$i]) : ($arq['type'][$i] ?? '');
        if (!isset(ANEXO_TIPOS[$mime]))                  return [null, "$rotulo precisa ser PDF, JPG ou PNG"];
        $total += $arq['size'][$i];
        if ($total > ANEXO_MAX_TOTAL)                    return [null, 'os documentos juntos passam de 15 MB'];
        $base = preg_replace('/\.[^.]+$/', '', $rotulo);
        $lista[] = [
            'nome'     => ($base !== '' ? $base : 'documento-' . ($i + 1)) . '.' . ANEXO_TIPOS[$mime],
            'rotulo'   => $rotulo,
            'mime'     => $mime,
            'conteudo' => file_get_contents($arq['tmp_name'][$i]),
            'tamanho'  => $arq['size'][$i],
        ];
    }
    if ($finfo) finfo_close($finfo);
    return [$lista, ''];
}

function h($t) {
    return htmlspecialchars((string)$t, ENT_QUOTES, 'UTF-8');
}

function email_html($titulo, $subtitulo, $grupos, $rodape) {
    $blocos = '';
    foreach ($grupos as $nome => $linhas) {
        $itens = '';
        foreach ($linhas as $rotulo => $valor) {
            $itens .= '<tr><td style="padding:10px 0;border-bottom:1px solid #E2E2E2;">'
                . '<div style="font:600 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#6B6768;">' . h($rotulo) . '</div>'
                . '<div style="font:500 16px/1.5 Arial,Helvetica,sans-serif;color:#373435;margin-top:3px;">' . nl2br(h($valor)) . '</div>'
                . '</td></tr>';
        }
        $blocos .= '<tr><td style="padding:22px 0 6px;font:800 14px/1.3 Arial,Helvetica,sans-serif;color:#373435;">' . h($nome) . '</td></tr>' . $itens;
    }
    return '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"></head>'
        . '<body style="margin:0;padding:0;background:#F5F5F5;">'
        . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F5F5;"><tr><td align="center" style="padding:28px 16px;">'
        . '<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:10px;overflow:hidden;">'
        . '<tr><td style="height:6px;background:#E03236;font-size:0;line-height:0;">&nbsp;</td></tr>'
        . '<tr><td style="padding:28px 32px 8px;">'
        . '<div style="font:600 12px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#E03236;">Site OFB</div>'
        . '<div style="font:800 24px/1.2 Arial,Helvetica,sans-serif;color:#373435;margin-top:8px;">' . h($titulo) . '</div>'
        . '<div style="font:400 14px/1.5 Arial,Helvetica,sans-serif;color:#6B6768;margin-top:6px;">' . h($subtitulo) . '</div>'
        . '</td></tr>'
        . '<tr><td style="padding:0 32px 24px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0">' . $blocos . '</table></td></tr>'
        . '<tr><td style="padding:16px 32px 24px;border-top:1px solid #E2E2E2;font:400 12px/1.6 Arial,Helvetica,sans-serif;color:#6B6768;">' . nl2br(h($rodape)) . '</td></tr>'
        . '</table></td></tr></table></body></html>';
}

function email_texto($titulo, $subtitulo, $grupos, $rodape) {
    $linhas = [$titulo, $subtitulo, ''];
    foreach ($grupos as $nome => $itens) {
        $linhas[] = strtoupper($nome);
        foreach ($itens as $rotulo => $valor) $linhas[] = $rotulo . ': ' . $valor;
        $linhas[] = '';
    }
    $linhas[] = $rodape;
    return implode("\n", $linhas);
}

function enviar_email($assunto, $responder_a, $titulo, $subtitulo, $grupos, $rodape, $anexos = []) {
    $html  = email_html($titulo, $subtitulo, $grupos, $rodape);
    $texto = email_texto($titulo, $subtitulo, $grupos, $rodape);

    $alt = 'alt_' . md5(uniqid('', true));
    $mix = 'mix_' . md5(uniqid('', true));

    $corpo  = "--$alt\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($texto));
    $corpo .= "--$alt\r\nContent-Type: text/html; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($html));
    $corpo .= "--$alt--\r\n";

    if ($anexos) {
        $corpo = "--$mix\r\nContent-Type: multipart/alternative; boundary=\"$alt\"\r\n\r\n" . $corpo;
        foreach ($anexos as $a) {
            $corpo .= "--$mix\r\nContent-Type: {$a['mime']}; name=\"{$a['nome']}\"\r\n"
                    . "Content-Disposition: attachment; filename=\"{$a['nome']}\"\r\n"
                    . "Content-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($a['conteudo']));
        }
        $corpo .= "--$mix--\r\n";
        $tipo = "multipart/mixed; boundary=\"$mix\"";
    } else {
        $tipo = "multipart/alternative; boundary=\"$alt\"";
    }

    $cabecalhos = implode("\r\n", [
        'From: OFB Site <' . REMETENTE . '>',
        'Reply-To: ' . $responder_a,
        'MIME-Version: 1.0',
        'Content-Type: ' . $tipo,
        'X-Mailer: site-ofb',
    ]);
    $assunto_mime = '=?UTF-8?B?' . base64_encode($assunto) . '?=';
    return @mail(DESTINO, $assunto_mime, $corpo, $cabecalhos, '-f' . REMETENTE);
}

<?php
declare(strict_types=1);


require __DIR__ . '/../src/bootstrap.php';


use App\Auth;
use App\Events;


header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . (getenv('CORS_ORIGIN') ?: '*'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }


$path = strtok($_SERVER['REQUEST_URI'], '?');
$path = preg_replace('~^/api~', '', $path); // allow reverse proxy at /api


try {
if ($path === '/auth/login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
$data = json_input();
$user = Auth::login($data['email'] ?? '', $data['password'] ?? '');
echo json_encode(success($user));
}
elseif ($path === '/auth/logout' && $_SERVER['REQUEST_METHOD'] === 'POST') {
Auth::logout();
echo json_encode(success(['ok' => true]));
}
elseif ($path === '/auth/session') {
$user = Auth::session();
echo json_encode(success($user));
}
elseif ($path === '/events' && $_SERVER['REQUEST_METHOD'] === 'GET') {
$start = new DateTime($_GET['start'] ?? 'now');
$days = (int)($_GET['days'] ?? 7);
$userId = Auth::optionalUserId();
$rows = Events::list($start, $days, $userId);
echo json_encode(success($rows));
}
elseif ($path === '/events' && $_SERVER['REQUEST_METHOD'] === 'POST') {
Auth::requireLogin();
$data = json_input();
$id = Events::create(Auth::userId(), $data);
echo json_encode(success(['id'=>$id]));
}
elseif (preg_match('~^/events/(\d+)$~', $path, $m)) {
$id = (int)$m[1];
if ($_SERVER['REQUEST_METHOD'] === 'PUT') { Auth::requireLogin(); Events::update(Auth::userId(), $id, json_input()); echo json_encode(success(['id'=>$id])); }
elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') { Auth::requireLogin(); Events::delete(Auth::userId(), $id); echo json_encode(success(['id'=>$id])); }
else { http_response_code(405); echo json_encode(error('Méthode non autorisée')); }
}
else {
echo json_encode(error('Endpoint inconnu: ' . $path));
}
}
catch(Throwable $e){ http_response_code(400); echo json_encode(error($e->getMessage())); }


function json_input(): array { $raw=file_get_contents('php://input'); return $raw? (json_decode($raw,true) ?: []): []; }
function success($data){ return ['success'=>true,'data'=>$data]; }
function error($msg){ return ['success'=>false,'message'=>$msg]; }
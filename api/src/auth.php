<?php
namespace App;
use App\Database; use PDO; use Exception;


class Auth {
public static function login(string $email, string $password): array {
$pdo = Database::pdo();
$stmt = $pdo->prepare('SELECT id, email, password_hash FROM users WHERE email = ?');
$stmt->execute([$email]);
$u = $stmt->fetch(PDO::FETCH_ASSOC);
if(!$u || !password_verify($password, $u['password_hash'])) throw new Exception('Identifiants invalides');
$_SESSION['uid'] = (int)$u['id'];
$_SESSION['email'] = $u['email'];
return ['email'=>$u['email']];
}
public static function logout(): void { session_unset(); session_destroy(); }
public static function session(): array { if(!isset($_SESSION['uid'])) throw new Exception('Non connecté'); return ['email'=>$_SESSION['email']]; }
public static function requireLogin(): void { if(!isset($_SESSION['uid'])) throw new Exception('Auth requise'); }
public static function userId(): int { return (int)($_SESSION['uid'] ?? 0); }
public static function optionalUserId(): ?int { return isset($_SESSION['uid']) ? (int)$_SESSION['uid'] : null; }
}
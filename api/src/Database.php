<?php
namespace App;

use PDO;
use PDOException;

class Database {
    private static ?PDO $pdo = null;

    public static function init(): void {
        if (self::$pdo) return;

        $dsn = getenv('SQLITE_PATH') ?: __DIR__ . '/../data/app.sqlite';
        $dir = dirname($dsn);
        if (!is_dir($dir)) mkdir($dir, 0775, true);

        self::$pdo = new PDO('sqlite:' . $dsn);
        self::$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        self::$pdo->exec('PRAGMA foreign_keys = ON');

        self::migrate();
    }

    public static function pdo(): PDO {
        if (!self::$pdo) self::init();
        return self::$pdo;
    }

    private static function migrate(): void {
        $pdo = self::pdo();

        $pdo->exec("CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );");

        $pdo->exec("CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          start TEXT NOT NULL,
          end TEXT NOT NULL,
          location TEXT,
          color TEXT,
          notes TEXT,
          source TEXT DEFAULT 'manual',
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );");

        // seed 1er user
        $seedEmail = getenv('SEED_EMAIL');
        $seedPass  = getenv('SEED_PASSWORD');
        if ($seedEmail && $seedPass) {
            $stmt = $pdo->prepare('INSERT OR IGNORE INTO users(email,password_hash) VALUES(?,?)');
            $stmt->execute([$seedEmail, password_hash($seedPass, PASSWORD_DEFAULT)]);
        }
    }
}

-- Optional manual migration if you want to run it yourself
CREATE TABLE IF NOT EXISTS users (
id INTEGER PRIMARY KEY AUTOINCREMENT,
email TEXT UNIQUE NOT NULL,
password_hash TEXT NOT NULL,
created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS events (
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
);
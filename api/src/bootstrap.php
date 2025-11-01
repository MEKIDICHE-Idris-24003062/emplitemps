<?php
namespace App;

ini_set('session.use_only_cookies','1');
ini_set('session.cookie_httponly','1');
ini_set('session.cookie_secure', isset($_SERVER['HTTPS']) ? '1' : '0');
session_name('emplisess');
session_start();

// charge les classes (simple autoloader)
spl_autoload_register(function(string $class){
    if (strpos($class, 'App\\') === 0) {
        $relative = str_replace('App\\', '', $class) . '.php';
        $path = __DIR__ . '/' . $relative;
        if (is_file($path)) require_once $path;
    }
});

// Si tu préfères les require directs, tu peux aussi garder :
// require_once __DIR__ . '/Database.php';
// require_once __DIR__ . '/Auth.php';
// require_once __DIR__ . '/Events.php';

Database::init();

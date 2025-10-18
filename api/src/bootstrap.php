<?php
namespace App;
use PDO; use Exception; use PDOException;


ini_set('session.use_only_cookies','1');
ini_set('session.cookie_httponly','1');
ini_set('session.cookie_secure', isset($_SERVER['HTTPS']) ? '1' : '0');
session_name('emplisess');
session_start();


require __DIR__.'/Database.php';
require __DIR__.'/Auth.php';
require __DIR__.'/Events.php';


Database::init();
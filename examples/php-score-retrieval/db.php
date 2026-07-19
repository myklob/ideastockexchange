<?php

/**
 * PDO bootstrap for the conclusion-score demo.
 *
 * Default: a local SQLite file, created automatically from
 * schema.sqlite.sql on first run — so `php -S localhost:8080` in this
 * directory is all it takes. To point at MySQL/MariaDB instead, load
 * sql/conclusion_score_process.sql into a database and set:
 *
 *   ISE_DB_DSN=mysql:host=localhost;dbname=ise;charset=utf8mb4
 *   ISE_DB_USER=...
 *   ISE_DB_PASS=...
 *
 * The queries in scoring.php run unchanged on either engine.
 */

declare(strict_types=1);

function ise_db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = getenv('ISE_DB_DSN');
    if ($dsn !== false && $dsn !== '') {
        $pdo = new PDO(
            $dsn,
            getenv('ISE_DB_USER') ?: null,
            getenv('ISE_DB_PASS') ?: null,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        return $pdo;
    }

    $file = __DIR__ . '/demo.sqlite';
    $fresh = !file_exists($file);
    $pdo = new PDO('sqlite:' . $file, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    $pdo->exec('PRAGMA foreign_keys = ON');
    if ($fresh) {
        $pdo->exec((string) file_get_contents(__DIR__ . '/schema.sqlite.sql'));
    }
    return $pdo;
}

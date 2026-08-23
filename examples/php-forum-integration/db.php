<?php

/**
 * PDO bootstrap for the forum-integration demo. Default: a local SQLite
 * file created automatically from schema.sqlite.sql on first run, so
 * `php -S localhost:8080` in this directory is all it takes. Point at
 * MySQL/MariaDB via ISE_DB_DSN / ISE_DB_USER / ISE_DB_PASS instead; the
 * queries are dialect-portable.
 */

declare(strict_types=1);

function fi_db(): PDO
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

/** cuid-ish unique id for new rows. */
function fi_id(string $prefix): string
{
    return $prefix . '-' . bin2hex(random_bytes(6));
}

function fi_audit(PDO $db, string $action, string $targetType, string $targetId, string $rationale): void
{
    $stmt = $db->prepare(
        'INSERT INTO fi_audit_log (action, target_type, target_id, rationale) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$action, $targetType, $targetId, $rationale]);
}

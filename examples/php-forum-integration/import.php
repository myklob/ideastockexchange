<?php

/**
 * Import a conversation: paste a transcript ("Author: message" per line),
 * pick the belief page it plugs into, and the miner extracts candidate
 * pro/con claims. The transcript is stored verbatim; the graph does not
 * move until candidates pass review on the belief page.
 */

declare(strict_types=1);

require_once __DIR__ . '/mine.php';
require_once __DIR__ . '/ui.php';

$db = fi_db();
$error = null;

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $platform = (string) ($_POST['platform'] ?? 'chat');
    $title = trim((string) ($_POST['title'] ?? ''));
    $beliefId = (string) ($_POST['belief_id'] ?? '');
    $transcript = (string) ($_POST['transcript'] ?? '');

    $messages = [];
    foreach (explode("\n", $transcript) as $line) {
        $line = trim($line);
        if ($line === '') {
            continue;
        }
        if (preg_match('/^([^:]{1,60}):\s*(.+)$/', $line, $m)) {
            $messages[] = ['author' => trim($m[1]), 'body' => trim($m[2])];
        } elseif ($messages !== []) {
            // Continuation line: belongs to the previous message.
            $messages[count($messages) - 1]['body'] .= "\n" . $line;
        }
    }

    $beliefCheck = $db->prepare('SELECT 1 FROM fi_beliefs WHERE belief_id = ?');
    $beliefCheck->execute([$beliefId]);
    $validPlatforms = ['discord', 'reddit', 'twitter', 'forum', 'chat', 'other'];

    if ($title === '') {
        $error = 'A thread title is required.';
    } elseif ($messages === []) {
        $error = 'No messages parsed. Use one "Author: message" per line.';
    } elseif (count($messages) > 500) {
        $error = 'Imports are capped at 500 messages; split longer threads.';
    } elseif (!$beliefCheck->fetchColumn()) {
        $error = 'Pick the belief page this conversation plugs into.';
    } elseif (!in_array($platform, $validPlatforms, true)) {
        $error = 'Unknown platform.';
    } else {
        $threadId = fi_id('th');
        $db->beginTransaction();
        try {
            $db->prepare(
                'INSERT INTO fi_threads (thread_id, platform, title, belief_id) VALUES (?, ?, ?, ?)'
            )->execute([$threadId, $platform, $title, $beliefId]);
            $result = fi_mine_transcript($db, $threadId, $beliefId, $messages);
            fi_audit($db, 'import_conversation', 'Thread', $threadId,
                'Imported ' . count($messages) . "-message {$platform} conversation \"{$title}\" " .
                "plugged into belief \"{$beliefId}\": {$result['mined']} candidates mined, {$result['skipped']} sentences skipped.");
            $db->commit();
        } catch (Throwable $e) {
            $db->rollBack();
            $error = 'Import failed: ' . $e->getMessage();
        }
        if ($error === null) {
            header('Location: belief.php?id=' . urlencode($beliefId) . '&notice=' . urlencode(
                "Imported: {$result['mined']} candidates mined, {$result['skipped']} sentences skipped (questions, noise, fragments, restatements)."
            ));
            exit;
        }
    }
}

$beliefs = $db->query(
    'SELECT DISTINCT b.belief_id, b.statement
       FROM fi_beliefs b JOIN fi_arguments a ON a.parent_belief_id = b.belief_id
      ORDER BY b.belief_id'
)->fetchAll(PDO::FETCH_ASSOC);

fi_page_open('Import a conversation');
?>
<h1>Import a conversation</h1>
<p class="lede">Chatrooms and web forums reset discussion to zero: every thread repeats
arguments made a thousand times, and whatever clarity is reached dies with the scroll.
Importing a transcript plugs it into a permanent belief page — the miner extracts candidate
pro/con claims (skipping questions, social noise, fragments, and restatements), scans them
against the arguments already on the page, and queues them for review.</p>
<?php fi_firewall_panel(); ?>
<?php if ($error !== null): ?>
<div class="panel notice"><?= e($error) ?></div>
<?php endif; ?>

<form method="post">
  <p>
    <label>Platform:
      <select name="platform">
        <?php foreach (['discord', 'reddit', 'twitter', 'forum', 'chat', 'other'] as $p): ?>
        <option value="<?= e($p) ?>"><?= e($p) ?></option>
        <?php endforeach; ?>
      </select>
    </label>
    &nbsp;
    <label>Thread title:
      <input type="text" name="title" size="48" placeholder="What the thread is called" required>
    </label>
  </p>
  <p>
    <label>Plugs into belief page:
      <select name="belief_id">
        <?php foreach ($beliefs as $b): ?>
        <option value="<?= e($b['belief_id']) ?>"><?= e($b['statement']) ?></option>
        <?php endforeach; ?>
      </select>
    </label>
  </p>
  <p>
    <label>Transcript — one <code>Author: message</code> per line:</label><br>
    <textarea name="transcript" rows="12" placeholder="norms_matter: The acceptance norm only works if it binds both sides.
audit_hawk: The real problem is certification deadlines are too tight for real audits.
vibes_only: lol this thread again"></textarea>
  </p>
  <p><button type="submit">Import and mine candidates</button></p>
</form>
<?php fi_page_close();

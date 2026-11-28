<?php

/**
 * One permanent belief page: the scorecard, the score-ranked pro/con
 * argument trees (Argument Score × Linkage × Importance = Impact), the
 * evidence ledger, and the incoming conversation lane where mined
 * candidates wait for an integrate / fold / dismiss review move.
 */

declare(strict_types=1);

require_once __DIR__ . '/scoring.php';
require_once __DIR__ . '/ui.php';

$db = fi_db();
$multiplier = fi_multiplier($db);
$beliefId = (string) ($_GET['id'] ?? '');
$page = $beliefId === '' ? null : fi_load_belief_page($db, $beliefId, $multiplier);

if ($page === null) {
    http_response_code(404);
    fi_page_open('Belief not found');
    echo '<h1>No such belief page</h1><p class="lede"><a href="index.php">Back to the topic</a>.</p>';
    fi_page_close();
    exit;
}

// Provenance: which arguments arrived from conversations.
$provenance = [];
$provStmt = $db->prepare(
    'SELECT c.integrated_argument_id, t.platform, t.title, m.author
       FROM fi_candidates c
       JOIN fi_threads t ON t.thread_id = c.thread_id
       JOIN fi_messages m ON m.message_id = c.message_id
      WHERE c.status = \'integrated\' AND c.integrated_argument_id IS NOT NULL
        AND c.thread_id IN (SELECT thread_id FROM fi_threads WHERE belief_id = ?)'
);
$provStmt->execute([$beliefId]);
foreach ($provStmt->fetchAll(PDO::FETCH_ASSOC) as $p) {
    $provenance[(string) $p['integrated_argument_id']] = $p;
}

// Evidence ledger, each side sorted by tier (highest quality first).
$evStmt = $db->prepare(
    'SELECT ev.*, b.statement AS arg_statement
       FROM fi_evidence ev
       LEFT JOIN fi_arguments a ON a.argument_id = ev.bears_on
       LEFT JOIN fi_beliefs b ON b.belief_id = a.child_belief_id
      WHERE ev.belief_id = ? ORDER BY ev.tier ASC'
);
$evStmt->execute([$beliefId]);
$evidence = ['supporting' => [], 'weakening' => []];
foreach ($evStmt->fetchAll(PDO::FETCH_ASSOC) as $ev) {
    $evidence[(string) $ev['side']][] = $ev;
}

// The incoming lane: candidates mined from conversations on this page.
$candStmt = $db->prepare(
    'SELECT c.*, m.author, m.idx, t.title AS thread_title, t.platform,
            nb.statement AS nearest_statement
       FROM fi_candidates c
       JOIN fi_messages m ON m.message_id = c.message_id
       JOIN fi_threads t ON t.thread_id = c.thread_id
       LEFT JOIN fi_arguments na ON na.argument_id = c.nearest_argument_id
       LEFT JOIN fi_beliefs nb ON nb.belief_id = na.child_belief_id
      WHERE t.belief_id = ?
      ORDER BY CASE c.status WHEN \'pending\' THEN 0 ELSE 1 END, c.created_at'
);
$candStmt->execute([$beliefId]);
$candidates = $candStmt->fetchAll(PDO::FETCH_ASSOC);

$strongestPro = $page['pro'][0] ?? null;
$strongestCon = $page['con'][0] ?? null;
$back = 'belief.php?id=' . $beliefId;

fi_page_open('Belief: ' . $page['belief']['statement']);
?>
<p class="small"><a href="index.php">Topic: Protecting the Constitution</a> › this belief</p>
<h1>Belief: <?= e($page['belief']['statement']) ?></h1>
<?php if (isset($_GET['notice'])): ?>
<div class="panel notice"><?= e((string) $_GET['notice']) ?></div>
<?php endif; ?>
<?php fi_firewall_panel(); ?>

<h2>📋 Scorecard <span class="small">(computed on read, m = <?= e(fi_format_score($multiplier)) ?>)</span></h2>
<table>
<tbody>
<tr>
  <th style="width:25%">Net Belief Score</th>
  <td><strong><?= e(fi_format_score($page['net'])) ?></strong>
      · Pro <?= e(fi_format_score($page['pro_total'])) ?>
      vs. Con <?= e(fi_format_score($page['con_total'])) ?>
      <?php if (abs($page['net'] - $page['score']) < 1e-9): ?>
        <span class="small">✓ table totals and the recursive SQL engine agree</span>
      <?php else: ?>
        <span class="con">✗ table totals (<?= e(fi_format_score($page['net'])) ?>) and the
        recursive engine (<?= e(fi_format_score($page['score'])) ?>) disagree — refusing to trust either</span>
      <?php endif; ?>
  </td>
</tr>
<tr>
  <th>Strongest pro / con</th>
  <td>
    <?= $strongestPro ? e($strongestPro['statement']) : '<span class="small">—</span>' ?>
    ·
    <?= $strongestCon ? e($strongestCon['statement']) : '<span class="small">—</span>' ?>
    <span class="small">(auto-derived: the top-ranked row from each side below)</span>
  </td>
</tr>
</tbody>
</table>

<h2>🔍 Argument Trees <span class="small">Argument Score × Linkage × Importance = Impact; rows ranked by impact</span></h2>
<?php
$renderSide = function (array $rows, string $headClass, string $title) use ($provenance): void {
    echo '<table><thead>';
    echo '<tr><th class="' . $headClass . '" colspan="5">' . $title . '</th></tr>';
    echo '<tr><th style="width:52%">Argument</th><th class="num">Score</th><th class="num">Linkage</th><th class="num">Importance</th><th class="num">Impact</th></tr>';
    echo '</thead><tbody>';
    if ($rows === []) {
        echo '<tr><td colspan="5" class="small">No arguments yet — the outline extends here.</td></tr>';
    }
    foreach ($rows as $row) {
        $prov = $provenance[(string) $row['argument_id']] ?? null;
        echo '<tr><td>' . e($row['statement']);
        if ($prov) {
            echo ' <span class="badge integrated" title="Integrated from a conversation">from '
                . e($prov['platform']) . ': ' . e($prov['author']) . '</span>';
        }
        echo '</td>';
        echo '<td class="num">' . e(fi_format_score($row['argument_score'])) . '</td>';
        echo '<td class="num">' . e(fi_format_score($row['linkage'])) . '</td>';
        echo '<td class="num">' . e(fi_format_score($row['importance'])) . '</td>';
        echo '<td class="num"><strong>' . e(fi_format_score($row['impact'])) . '</strong></td></tr>';
    }
    echo "</tbody></table>\n";
};
$renderSide($page['pro'], 'pro-head', '✅ Reasons to Agree');
$renderSide($page['con'], 'con-head', '❌ Reasons to Disagree');
?>
<p class="small">Pro Total = count + m·Σ impacts = <strong><?= e(fi_format_score($page['pro_total'])) ?></strong>
 · Con Total = <strong><?= e(fi_format_score($page['con_total'])) ?></strong>
 · Net = Pro − Con = <strong><?= e(fi_format_score($page['net'])) ?></strong></p>

<h2>📊 Evidence Ledger <span class="small">Tier 1 = peer-reviewed/official … Tier 4 = opinion; each side sorted by quality</span></h2>
<?php
$renderEvidence = function (array $rows, string $headClass, string $title): void {
    echo '<table><thead>';
    echo '<tr><th class="' . $headClass . '" colspan="3">' . $title . '</th></tr>';
    echo '<tr><th style="width:56%">Evidence (Producer)</th><th>Bears on</th><th class="num">Tier</th></tr>';
    echo '</thead><tbody>';
    if ($rows === []) {
        echo '<tr><td colspan="3" class="small">No evidence yet.</td></tr>';
    }
    foreach ($rows as $ev) {
        echo '<tr><td>' . e($ev['description'])
            . ($ev['producer'] ? ' <span class="small">(' . e($ev['producer']) . ')</span>' : '') . '</td>';
        echo '<td class="small">' . ($ev['arg_statement'] ? '“' . e(mb_substr((string) $ev['arg_statement'], 0, 60)) . '…”' : 'this belief directly') . '</td>';
        echo '<td class="num">Tier ' . (int) $ev['tier'] . '</td></tr>';
    }
    echo "</tbody></table>\n";
};
$renderEvidence($evidence['supporting'], 'pro-head', '✅ Supporting Evidence');
$renderEvidence($evidence['weakening'], 'con-head', '❌ Weakening Evidence');
?>

<h2>💬 Incoming from conversations <span class="small">candidates mined from chatrooms and forums, waiting on review</span></h2>
<p class="small">The band routes each candidate: <em>distinct</em> extends the outline,
<em>related</em> integrates with the cluster recorded, <em>probable restatement / same claim</em>
folds into the argument the page already has — no new row, no double-counting. Nothing
auto-integrates; the transcript stays inert until someone accountable pushes a candidate through.</p>
<table>
<thead><tr>
  <th style="width:34%">Mined candidate</th><th class="num">Stance</th><th>Routing</th>
  <th class="num">Status</th><th style="width:30%">Review move</th>
</tr></thead>
<tbody>
<?php if ($candidates === []): ?>
<tr><td colspan="5" class="small">No conversation candidates yet — <a href="import.php">import a transcript</a>.</td></tr>
<?php else: foreach ($candidates as $c): ?>
<tr>
  <td><?= e($c['statement']) ?>
    <div class="small">msg #<?= (int) $c['idx'] ?> by <?= e($c['author']) ?> in “<?= e($c['thread_title']) ?>” (<?= e($c['platform']) ?>)</div>
  </td>
  <td class="num"><span class="<?= $c['direction'] === 'pro' ? 'pro' : 'con' ?>"><?= e($c['direction']) ?></span></td>
  <td class="small"><?= e(fi_band_label($c['band'])) ?>
    <?php if ($c['nearest_statement']): ?><br>nearest: “<?= e(mb_substr((string) $c['nearest_statement'], 0, 60)) ?>…”
      <?php if ($c['similarity'] !== null): ?>(sim <?= e(number_format((float) $c['similarity'], 2)) ?>)<?php endif; ?>
    <?php endif; ?>
  </td>
  <td class="num"><span class="badge <?= e($c['status']) ?>"><?= e($c['status']) ?></span></td>
  <td>
  <?php if ($c['status'] === 'pending'): ?>
    <form class="inline" method="post" action="integrate.php">
      <input type="hidden" name="candidate_id" value="<?= e($c['candidate_id']) ?>">
      <input type="hidden" name="back" value="<?= e($back) ?>">
      <input type="hidden" name="action" value="integrate">
      <input type="text" name="mechanism" placeholder="How it bears on the parent (mechanism)" size="26">
      <select name="direction">
        <option value="<?= e($c['direction']) ?>" selected><?= e($c['direction']) ?></option>
        <option value="<?= $c['direction'] === 'pro' ? 'con' : 'pro' ?>"><?= $c['direction'] === 'pro' ? 'con' : 'pro' ?></option>
      </select>
      <button type="submit">Integrate</button>
    </form>
    <?php if ($c['nearest_argument_id']): ?>
    <form class="inline" method="post" action="integrate.php">
      <input type="hidden" name="candidate_id" value="<?= e($c['candidate_id']) ?>">
      <input type="hidden" name="back" value="<?= e($back) ?>">
      <input type="hidden" name="action" value="fold">
      <button type="submit">Fold (combine)</button>
    </form>
    <?php endif; ?>
    <form class="inline" method="post" action="integrate.php">
      <input type="hidden" name="candidate_id" value="<?= e($c['candidate_id']) ?>">
      <input type="hidden" name="back" value="<?= e($back) ?>">
      <input type="hidden" name="action" value="dismiss">
      <button type="submit">Dismiss</button>
    </form>
  <?php else: ?>
    <span class="small">resolved<?= $c['resolved_at'] ? ' ' . e($c['resolved_at']) : '' ?></span>
  <?php endif; ?>
  </td>
</tr>
<?php endforeach; endif; ?>
</tbody>
</table>
<?php fi_page_close();

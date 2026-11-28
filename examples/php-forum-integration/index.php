<?php

/**
 * The topic page: one fixed address per belief. Direction, magnitude, and
 * the general-to-specific tree collapse the thousand ways of saying the
 * same thing into single entries; beliefs with argument trees show their
 * computed net score, and beliefs without real content stay blank — a score
 * cell is never filled for an empty row.
 */

declare(strict_types=1);

require_once __DIR__ . '/scoring.php';
require_once __DIR__ . '/ui.php';

$db = fi_db();
$multiplier = fi_multiplier($db);
$scores = fi_all_scores($db, $multiplier);

$topic = $db->query('SELECT * FROM fi_topics LIMIT 1')->fetch(PDO::FETCH_ASSOC);

$rows = $db->query(
    'SELECT tb.*, b.statement
       FROM fi_topic_beliefs tb JOIN fi_beliefs b ON b.belief_id = tb.belief_id
      ORDER BY CASE tb.rung_type WHEN \'general\' THEN 0 WHEN \'subcategory\' THEN 1 ELSE 2 END,
               tb.branch_name, tb.direction DESC'
)->fetchAll(PDO::FETCH_ASSOC);

// Which beliefs actually have argument trees (only those get a score cell).
$treed = [];
foreach ($db->query('SELECT DISTINCT parent_belief_id FROM fi_arguments')->fetchAll(PDO::FETCH_COLUMN) as $id) {
    $treed[(string) $id] = true;
}

$threads = $db->query(
    'SELECT t.*, b.statement AS belief_statement,
            (SELECT COUNT(*) FROM fi_messages m WHERE m.thread_id = t.thread_id) AS message_count,
            (SELECT COUNT(*) FROM fi_candidates c WHERE c.thread_id = t.thread_id AND c.status = \'pending\') AS pending_count
       FROM fi_threads t LEFT JOIN fi_beliefs b ON b.belief_id = t.belief_id
      ORDER BY t.created_at DESC'
)->fetchAll(PDO::FETCH_ASSOC);

$general = array_values(array_filter($rows, fn (array $r): bool => $r['rung_type'] === 'general'));
$branches = [];
foreach ($rows as $r) {
    if ($r['rung_type'] !== 'general') {
        $branches[(string) $r['branch_name']][] = $r;
    }
}

fi_page_open('Topic: ' . ($topic['title'] ?? 'demo'));
?>
<h1>Topic: <?= e($topic['title'] ?? '') ?></h1>
<p class="lede"><strong>Definition:</strong> <?= e($topic['definition'] ?? '') ?></p>
<p class="lede small"><strong>Scope:</strong> <?= e($topic['scope'] ?? '') ?></p>
<?php fi_firewall_panel(); ?>
<p class="small">Sub-argument multiplier m = <?= e(fi_format_score($multiplier)) ?>
  (<a href="?m=1">try m=1</a>, <a href="?m=0.7">m=0.7</a>, <a href="?m=0.5">m=0.5</a>).
  Every score below is recomputed from the graph on each page load.</p>

<h2>Every belief at one fixed address</h2>
<p class="small">Direction (−100…+100) · Magnitude (Modest / Moderate / Strong / Total) ·
rung on the general-to-specific tree. Two beliefs at the same address are duplicates and merge;
nearly the same address gets the redundancy discount at scoring time. Net Score appears only
for beliefs whose pro/con tree has real content.</p>

<table>
<thead><tr>
  <th style="width:34%">Belief</th>
  <th class="num">Direction</th>
  <th class="num">Magnitude</th>
  <th class="num">Rung</th>
  <th class="num">Net Score</th>
  <th class="num">Page</th>
</tr></thead>
<tbody>
<?php
$renderRow = function (array $r) use ($treed, $scores): void {
    $id = (string) $r['belief_id'];
    $hasTree = isset($treed[$id]);
    $dir = (int) $r['direction'];
    $indent = $r['rung_type'] === 'specific' ? '&nbsp;&nbsp;&nbsp;<span class="tree-indent">└─</span> ' : '';
    echo '<tr>';
    echo '<td>' . $indent . e($r['statement']) . '</td>';
    echo '<td class="num"><span class="' . ($dir >= 0 ? 'pro' : 'con') . '">' . ($dir > 0 ? '+' : '') . $dir . '%</span></td>';
    echo '<td class="num">' . e($r['magnitude']) . '</td>';
    echo '<td class="num">' . e($r['rung_type']) . '</td>';
    echo '<td class="num">' . ($hasTree ? '<strong>' . e(fi_format_score($scores[$id] ?? 0.0)) . '</strong>' : '<span class="small">—</span>') . '</td>';
    echo '<td class="num">' . ($hasTree ? '<a href="belief.php?id=' . e($id) . '">open</a>' : '<span class="small">stub</span>') . '</td>';
    echo "</tr>\n";
};

if ($general !== []) {
    echo '<tr><th colspan="6">Most general (worldview)</th></tr>';
    foreach ($general as $r) {
        $renderRow($r);
    }
}
foreach ($branches as $branch => $branchRows) {
    echo '<tr><th colspan="6">├─ ' . e($branch) . '</th></tr>';
    foreach ($branchRows as $r) {
        $renderRow($r);
    }
}
?>
</tbody>
</table>

<h2>Conversations plugged into this topic&rsquo;s pages</h2>
<p class="small">Chat stays informal and spontaneous; the belief pages hold the accumulated
knowledge. Every imported thread is stored verbatim and mined for candidate pro/con claims.</p>
<table>
<thead><tr>
  <th>Thread</th><th class="num">Platform</th><th>Plugs into</th>
  <th class="num">Messages</th><th class="num">Pending candidates</th>
</tr></thead>
<tbody>
<?php if ($threads === []): ?>
<tr><td colspan="5" class="small">No conversations imported yet — <a href="import.php">import one</a>.</td></tr>
<?php else: foreach ($threads as $t): ?>
<tr>
  <td><?= e($t['title']) ?><?php if ($t['source_url']): ?> <span class="small">(<a href="<?= e($t['source_url']) ?>" rel="nofollow noopener">source</a>)</span><?php endif; ?></td>
  <td class="num"><?= e($t['platform']) ?></td>
  <td><?php if ($t['belief_id']): ?><a href="belief.php?id=<?= e($t['belief_id']) ?>"><?= e($t['belief_statement']) ?></a><?php else: ?><span class="small">no page matched</span><?php endif; ?></td>
  <td class="num"><?= (int) $t['message_count'] ?></td>
  <td class="num"><?= (int) $t['pending_count'] ?></td>
</tr>
<?php endforeach; endif; ?>
</tbody>
</table>
<?php fi_page_close();

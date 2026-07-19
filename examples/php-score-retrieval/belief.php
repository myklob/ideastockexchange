<?php

/**
 * One conclusion's page: reasons to agree and disagree in separate
 * columns, with the full score derivation — the PHP render of a
 * numbered sheet from the founding workbook.
 */

declare(strict_types=1);

require_once __DIR__ . '/scoring.php';
require_once __DIR__ . '/ui.php';

$db = ise_db();
$board = iseLoadScoreboard($db);
$multiplier = $board['multiplier'];

$id = isset($_GET['id']) ? (string) $_GET['id'] : '';
$conclusion = $board['conclusions'][$id] ?? null;

if ($conclusion === null || !$board['verified']) {
    http_response_code(404);
    isePageOpen('Not found');
    if (!$board['verified']) {
        echo '<div class="panel fail">&#10007; The SQL and PHP scoring paths disagree '
            . '&mdash; refusing to render scores.</div>';
    } else {
        echo '<h1>No such conclusion</h1><p class="lede">Unknown id '
            . e($id) . '. <a href="index.php">Back to the scoreboard.</a></p>';
    }
    isePageClose();
    exit;
}

$breakdown = $board['breakdowns'][$id] ?? [
    'agree_count' => 0, 'disagree_count' => 0, 'raw_score' => 0,
    'agree_sub_total' => 0.0, 'disagree_sub_total' => 0.0,
    'multiplier' => $multiplier, 'score' => 0.0, 'contributions' => [],
];
$score = $breakdown['score'];

$bySide = ['agree' => [], 'disagree' => []];
foreach ($breakdown['contributions'] as $contribution) {
    $bySide[$contribution['side']][] = $contribution;
}

$usedBy = [];
foreach ($board['breakdowns'] as $parentId => $parent) {
    foreach ($parent['contributions'] ?? [] as $contribution) {
        if ($contribution['child_id'] === $id) {
            $usedBy[] = ['parent_id' => (string) $parentId, 'side' => $contribution['side']];
        }
    }
}

$mText = iseFormatScore($multiplier);

isePageOpen($conclusion['statement']);
?>
<p class="crumbs"><a href="index.php?m=<?= e($mText) ?>">&larr; All conclusions</a></p>
<h1><?= e($conclusion['statement']) ?></h1>
<p class="lede">
  Conclusion score:
  <span class="score-pill<?= $score < 0 ? ' negative' : '' ?>" style="font-size:20px">
    <?= e(iseFormatScore($score)) ?></span>
  <span class="muted">at m = <?= e($mText) ?> &middot;
    <a href="?id=<?= urlencode($id) ?>&amp;m=<?= $multiplier == 1.0 ? '0.7' : '1' ?>">
      switch to m = <?= $multiplier == 1.0 ? '0.7' : '1.0' ?></a></span>
</p>

<?php iseFormulaPanel($multiplier); ?>

<div class="panel">
  <strong>This page&rsquo;s numbers</strong>
  <div class="formula">score = (<?= (int) $breakdown['agree_count'] ?> &minus; <?= (int) $breakdown['disagree_count'] ?>) + <?= e($mText) ?> &middot; ( <?= e(iseFormatScore((float) $breakdown['agree_sub_total'])) ?> &minus; <?= e(iseFormatScore((float) $breakdown['disagree_sub_total'])) ?> )
      = <?= (int) $breakdown['raw_score'] ?> + <?= e(iseFormatScore($multiplier * ((float) $breakdown['agree_sub_total'] - (float) $breakdown['disagree_sub_total']))) ?>

      = <?= e(iseFormatScore($score)) ?></div>
</div>

<div class="columns">
  <?php foreach (['agree' => 'Reasons to agree', 'disagree' => 'Reasons to disagree'] as $side => $title): ?>
  <div class="col <?= $side ?>">
    <h3><?= e($title) ?> (<?= count($bySide[$side]) ?>)</h3>
    <?php if ($bySide[$side] === []): ?>
      <p class="muted">None listed yet — add the other side&rsquo;s best case.</p>
    <?php else: ?>
    <table>
      <thead>
        <tr><th>Reason</th><th class="num">Own score</th><th class="num">LS</th><th class="num">Adds</th></tr>
      </thead>
      <tbody>
        <?php foreach ($bySide[$side] as $contribution):
            $child = $board['conclusions'][$contribution['child_id']] ?? null;
            // What this listed reason adds to the score: its one-point count
            // plus (m x ownScore x LS), negated on the disagree side.
            $adds = ($side === 'agree' ? 1 : -1)
                * (1 + $multiplier * $contribution['contribution']);
        ?>
        <tr>
          <td>
            <a href="?id=<?= urlencode($contribution['child_id']) ?>&amp;m=<?= e($mText) ?>">
              <?= e($child['statement'] ?? $contribution['child_id']) ?></a>
            <?php if ($contribution['linkage_agree'] + $contribution['linkage_disagree'] > 0): ?>
              <div class="muted" style="font-size:13px">
                linkage debated: <?= (int) $contribution['linkage_agree'] ?> agree,
                <?= (int) $contribution['linkage_disagree'] ?> disagree &rarr;
                LS = <?= e(iseFormatScore($contribution['linkage_score'])) ?>
              </div>
            <?php endif; ?>
          </td>
          <td class="num"><?= e(iseFormatScore($contribution['child_score'])) ?></td>
          <td class="num"><?= e(iseFormatScore($contribution['linkage_score'])) ?></td>
          <td class="num"><?= e(($adds >= 0 ? '+' : '') . iseFormatScore($adds)) ?></td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
    <p class="muted" style="font-size:13px">
      Each reason adds <?= $side === 'agree' ? '+1' : '&minus;1' ?> for being listed,
      <?= $side === 'agree' ? 'plus' : 'minus' ?> m &middot; ownScore &middot; LS.
    </p>
    <?php endif; ?>
  </div>
  <?php endforeach; ?>
</div>

<?php if ($usedBy !== []): ?>
<h2>Arguments that use this belief as a reason</h2>
<table>
  <thead><tr><th>Conclusion</th><th>Side</th><th class="num">Its score</th></tr></thead>
  <tbody>
    <?php foreach ($usedBy as $use):
        $parent = $board['conclusions'][$use['parent_id']] ?? null;
        $parentScore = $board['scores'][$use['parent_id']] ?? 0.0;
        if ($parent === null) { continue; }
    ?>
    <tr>
      <td><a href="?id=<?= urlencode($use['parent_id']) ?>&amp;m=<?= e($mText) ?>">
        <?= e($parent['statement']) ?></a></td>
      <td class="side-<?= e($use['side']) ?>"><?= e($use['side']) ?></td>
      <td class="num"><?= e(iseFormatScore($parentScore)) ?></td>
    </tr>
    <?php endforeach; ?>
  </tbody>
</table>
<?php endif; ?>

<h2>How this page got its numbers</h2>
<p>
  PHP asked SQL for the edge rows (<code>v_cs_edge_linkage</code>: one row per
  listed reason, with its linkage tallies) and recursed; it also ran the
  recursive CTE shown on the <a href="index.php?m=<?= e($mText) ?>">scoreboard</a>
  and confirmed both paths return
  <strong><?= e(iseFormatScore($score)) ?></strong> for this conclusion.
</p>
<?php
isePageClose();

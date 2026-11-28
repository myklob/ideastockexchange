<?php

/**
 * The score engine, retrieved from SQL. Scores are never stored — every
 * number on every page is computed on read from the argument graph, which
 * is the demo's version of the audit lock: ingestion and integration write
 * structure; only the engine writes (well, derives) judgment.
 *
 * Formula, per belief B (the founding-workbook recursion extended with the
 * per-edge importance factor):
 *
 *   LS  = (linkAgree − linkDisagree) / total, 1.0 when undebated
 *   IMP = same shape over the importance sub-debate
 *   score(B) = (nAgree − nDisagree)
 *            + m · ( Σ agree score(child)·LS·IMP − Σ disagree score(child)·LS·IMP )
 *
 * Per-edge display: Argument Score × Linkage × Importance = Impact, and
 *   Pro Total = nAgree + m·Σ agree impacts
 *   Con Total = nDisagree + m·Σ disagree impacts
 *   Net       = Pro Total − Con Total = score(B)
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';

const FI_SCORE_SQL = <<<'SQL'
WITH RECURSIVE score_paths AS (
  SELECT
    ef.parent_belief_id                                AS root_id,
    ef.child_belief_id                                 AS node_id,
    ef.parent_belief_id || ',' || ef.child_belief_id   AS path,
    CASE ef.side WHEN 'agree' THEN 1.0 ELSE -1.0 END   AS weight,
    ef.edge_factor                                     AS last_factor
  FROM v_fi_edge_factor ef

  UNION ALL

  SELECT
    p.root_id,
    ef.child_belief_id,
    p.path || ',' || ef.child_belief_id,
    p.weight * :multiplier * p.last_factor
             * CASE ef.side WHEN 'agree' THEN 1.0 ELSE -1.0 END,
    ef.edge_factor
  FROM score_paths p
  JOIN v_fi_edge_factor ef ON ef.parent_belief_id = p.node_id
  WHERE instr(',' || p.path || ',', ',' || ef.child_belief_id || ',') = 0
)
SELECT root_id, SUM(weight) AS score
FROM score_paths
GROUP BY root_id
SQL;

function fi_multiplier(PDO $db): float
{
    $m = $_GET['m'] ?? null;
    if ($m !== null && is_numeric($m) && (float) $m >= 0 && (float) $m <= 1) {
        return (float) $m;
    }
    $stmt = $db->query("SELECT value FROM fi_settings WHERE setting_key = 'sub_argument_multiplier'");
    $value = $stmt === false ? false : $stmt->fetchColumn();
    return $value === false ? 0.7 : (float) $value;
}

/** @return array<string, float> belief_id → recursive score */
function fi_all_scores(PDO $db, float $multiplier): array
{
    $stmt = $db->prepare(FI_SCORE_SQL);
    $stmt->execute(['multiplier' => $multiplier]);
    $scores = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $scores[(string) $row['root_id']] = (float) $row['score'];
    }
    return $scores;
}

/**
 * One belief page's scored edges. Each row: argument_id, child belief,
 * statement, side, argument_score, linkage, importance, impact — plus the
 * page totals. Rows come back sorted by impact, descending (Rule 8: every
 * table score-ranked, best content first).
 */
function fi_load_belief_page(PDO $db, string $beliefId, float $multiplier): ?array
{
    $beliefStmt = $db->prepare('SELECT belief_id, statement FROM fi_beliefs WHERE belief_id = ?');
    $beliefStmt->execute([$beliefId]);
    $belief = $beliefStmt->fetch(PDO::FETCH_ASSOC);
    if (!$belief) {
        return null;
    }

    $scores = fi_all_scores($db, $multiplier);

    $edgeStmt = $db->prepare(
        'SELECT ef.argument_id, ef.child_belief_id, ef.side,
                ef.linkage_score, ef.importance_score,
                b.statement AS child_statement
           FROM v_fi_edge_factor ef
           JOIN fi_beliefs b ON b.belief_id = ef.child_belief_id
          WHERE ef.parent_belief_id = ?'
    );
    $edgeStmt->execute([$beliefId]);

    $pro = [];
    $con = [];
    foreach ($edgeStmt->fetchAll(PDO::FETCH_ASSOC) as $edge) {
        $childScore = $scores[(string) $edge['child_belief_id']] ?? 0.0;
        $row = [
            'argument_id' => (string) $edge['argument_id'],
            'child_belief_id' => (string) $edge['child_belief_id'],
            'statement' => (string) $edge['child_statement'],
            'argument_score' => $childScore,
            'linkage' => (float) $edge['linkage_score'],
            'importance' => (float) $edge['importance_score'],
            'impact' => $childScore * (float) $edge['linkage_score'] * (float) $edge['importance_score'],
        ];
        if ($edge['side'] === 'agree') {
            $pro[] = $row;
        } else {
            $con[] = $row;
        }
    }
    $byImpact = fn (array $a, array $b): int => $b['impact'] <=> $a['impact'];
    usort($pro, $byImpact);
    usort($con, $byImpact);

    $sumImpact = fn (array $rows): float => array_sum(array_column($rows, 'impact'));
    $proTotal = count($pro) + $multiplier * $sumImpact($pro);
    $conTotal = count($con) + $multiplier * $sumImpact($con);

    return [
        'belief' => $belief,
        'pro' => $pro,
        'con' => $con,
        'pro_total' => $proTotal,
        'con_total' => $conTotal,
        'net' => $proTotal - $conTotal,
        'score' => $scores[$beliefId] ?? 0.0,
    ];
}

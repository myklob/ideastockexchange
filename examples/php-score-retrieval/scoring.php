<?php

/**
 * Score retrieval for the conclusion-score demo — the PHP twin of
 * src/lib/conclusion-score.ts and sql/conclusion_score_process.sql.
 *
 * Two independent retrieval paths are provided on purpose:
 *
 *   1. iseFetchScoresViaSql()  — SQL does the recursion (one query,
 *      a recursive CTE over the reason graph).
 *   2. iseComputeScoresInPhp() — PHP does the recursion over plain
 *      edge rows fetched from SQL, and also returns the per-edge
 *      breakdown the belief page renders.
 *
 * The demo pages run both and refuse to show a score the two paths
 * disagree on. Formula, per conclusion C:
 *
 *   score(C) = nAgree − nDisagree
 *            + m · ( Σ agree score(child)·LS − Σ disagree score(child)·LS )
 *
 *   LS = (agree − disagree) / (agree + disagree) over the edge's
 *        linkage sub-debate, 1.0 when undebated.
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';

const ISE_DEFAULT_MULTIPLIER = 0.7;

/**
 * The recursive CTE, parameterized by the multiplier. Every path
 * C → X1 → … → Xk through the reason graph contributes
 * m^(k−1) · (Π linkage over the first k−1 edges) · (Π sign) to
 * score(C); summing path weights per root is the workbook's recursive
 * A1 score.
 *
 * Cycle handling matches iseComputeScoresInPhp and the TypeScript
 * engine exactly: a path that lands on a node already visited IS
 * emitted (the listed reason keeps its one-point count) but is never
 * extended (the ring's sub-scores cannot compound). That is what the
 * is_cycle flag does — suppressing the row instead, as an earlier
 * version did, made SQL and PHP disagree on any cyclic graph.
 *
 * The visited set rides along as a comma-delimited path string, which
 * is why both schemas CHECK that conclusion IDs contain no comma.
 *
 * Dialect: only string concatenation differs between SQLite (||) and
 * MySQL/MariaDB (CONCAT; || is logical OR under the default sql_mode).
 * INSTR works identically in both, so the query is assembled per
 * driver here and everything else runs unchanged.
 */
function iseScoreSql(PDO $db): string
{
    $sqlite = $db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite';
    $concat = fn (string ...$parts): string => $sqlite
        ? '(' . implode(' || ', $parts) . ')'
        : 'CONCAT(' . implode(', ', $parts) . ')';

    $anchorPath = $concat('el.conclusion_id', "','", 'el.child_id');
    $extendedPath = $concat('p.path', "','", 'el.child_id');
    $revisit = 'INSTR(' . $concat("','", 'p.path', "','") . ', '
        . $concat("','", 'el.child_id', "','") . ') > 0';

    return <<<SQL
WITH RECURSIVE score_paths AS (
  SELECT
    el.conclusion_id                                   AS root_id,
    el.child_id                                        AS node_id,
    {$anchorPath}                                      AS path,
    CASE el.side WHEN 'agree' THEN 1.0 ELSE -1.0 END   AS weight,
    el.linkage_score                                   AS last_linkage,
    CASE WHEN el.child_id = el.conclusion_id
         THEN 1 ELSE 0 END                             AS is_cycle
  FROM v_cs_edge_linkage el

  UNION ALL

  SELECT
    p.root_id,
    el.child_id,
    {$extendedPath},
    p.weight * :multiplier * p.last_linkage
             * CASE el.side WHEN 'agree' THEN 1.0 ELSE -1.0 END,
    el.linkage_score,
    CASE WHEN {$revisit} THEN 1 ELSE 0 END
  FROM score_paths p
  JOIN v_cs_edge_linkage el ON el.conclusion_id = p.node_id
  WHERE p.is_cycle = 0
)
SELECT
  c.conclusion_id,
  c.statement,
  c.example_set,
  COALESCE(SUM(p.weight), 0) AS conclusion_score
FROM cs_conclusions c
LEFT JOIN score_paths p ON p.root_id = c.conclusion_id
GROUP BY c.conclusion_id, c.statement, c.example_set
SQL;
}

/** @return array<string, float> conclusion_id => score */
function iseFetchScoresViaSql(PDO $db, float $multiplier): array
{
    $stmt = $db->prepare(iseScoreSql($db));
    $stmt->execute([':multiplier' => $multiplier]);
    $scores = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $scores[(string) $row['conclusion_id']] = (float) $row['conclusion_score'];
    }
    return $scores;
}

/** @return array<string, array{conclusion_id: string, statement: string, example_set: ?string}> */
function iseFetchConclusions(PDO $db): array
{
    $rows = $db->query(
        'SELECT conclusion_id, statement, example_set FROM cs_conclusions'
    )->fetchAll(PDO::FETCH_ASSOC);
    $byId = [];
    foreach ($rows as $row) {
        $byId[(string) $row['conclusion_id']] = $row;
    }
    return $byId;
}

/** Edge rows with their linkage tallies, ready for the PHP recursion. */
function iseFetchEdges(PDO $db): array
{
    return $db->query(
        'SELECT reason_id, conclusion_id, child_id, side, position,
                linkage_agree, linkage_disagree, linkage_score
           FROM v_cs_edge_linkage
          ORDER BY conclusion_id, side, position'
    )->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * The same recursion in PHP, returning a full breakdown per node:
 * counts, sub-totals, and one contribution row per edge. Results
 * computed under a cycle cut are not reused, so every node's score is
 * independent of evaluation order (mirrors computeConclusionScores in
 * src/lib/conclusion-score.ts).
 *
 * @return array<string, array> conclusion_id => breakdown
 */
function iseComputeScoresInPhp(array $edges, float $multiplier): array
{
    $childrenOf = [];
    $nodeIds = [];
    foreach ($edges as $edge) {
        $childrenOf[$edge['conclusion_id']][] = $edge;
        $nodeIds[$edge['conclusion_id']] = true;
        $nodeIds[$edge['child_id']] = true;
    }

    $clean = [];

    $evaluate = function (string $nodeId, array $stack) use (
        &$evaluate,
        &$clean,
        $childrenOf,
        $multiplier
    ): array {
        if (isset($clean[$nodeId])) {
            return ['score' => $clean[$nodeId]['score'], 'tainted' => false, 'breakdown' => $clean[$nodeId]];
        }
        if (isset($stack[$nodeId])) {
            return ['score' => 0.0, 'tainted' => true, 'breakdown' => null];
        }
        $stack[$nodeId] = true;

        $agreeCount = 0;
        $disagreeCount = 0;
        $agreeSubTotal = 0.0;
        $disagreeSubTotal = 0.0;
        $tainted = false;
        $contributions = [];

        foreach ($childrenOf[$nodeId] ?? [] as $edge) {
            $child = $evaluate((string) $edge['child_id'], $stack);
            $tainted = $tainted || $child['tainted'];
            $linkage = (float) $edge['linkage_score'];
            $contribution = $child['score'] * $linkage;
            $contributions[] = [
                'reason_id' => (string) $edge['reason_id'],
                'child_id' => (string) $edge['child_id'],
                'side' => (string) $edge['side'],
                'child_score' => $child['score'],
                'linkage_agree' => (int) $edge['linkage_agree'],
                'linkage_disagree' => (int) $edge['linkage_disagree'],
                'linkage_score' => $linkage,
                'contribution' => $contribution,
            ];
            if ($edge['side'] === 'agree') {
                $agreeCount++;
                $agreeSubTotal += $contribution;
            } else {
                $disagreeCount++;
                $disagreeSubTotal += $contribution;
            }
        }

        $rawScore = $agreeCount - $disagreeCount;
        $score = $rawScore + $multiplier * ($agreeSubTotal - $disagreeSubTotal);
        $breakdown = [
            'conclusion_id' => $nodeId,
            'agree_count' => $agreeCount,
            'disagree_count' => $disagreeCount,
            'raw_score' => $rawScore,
            'agree_sub_total' => $agreeSubTotal,
            'disagree_sub_total' => $disagreeSubTotal,
            'multiplier' => $multiplier,
            'score' => $score,
            'contributions' => $contributions,
        ];
        if (!$tainted) {
            $clean[$nodeId] = $breakdown;
        }
        return ['score' => $score, 'tainted' => $tainted, 'breakdown' => $breakdown];
    };

    $results = [];
    foreach (array_keys($nodeIds) as $nodeId) {
        $results[$nodeId] = $evaluate((string) $nodeId, [])['breakdown'];
    }
    return $results;
}

/** Linkage sub-debate entries for one edge. */
function iseFetchLinkageEntries(PDO $db, string $reasonId): array
{
    $stmt = $db->prepare(
        'SELECT side, statement FROM cs_linkage_entries
          WHERE reason_id = :reason_id ORDER BY side, entry_id'
    );
    $stmt->execute([':reason_id' => $reasonId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/** The multiplier for this request: ?m= override, else the stored Index!O1. */
function iseRequestMultiplier(PDO $db): float
{
    if (isset($_GET['m']) && is_numeric($_GET['m'])) {
        return max(0.0, min(2.0, (float) $_GET['m']));
    }
    $stored = $db->query(
        "SELECT value FROM cs_settings WHERE setting_key = 'sub_argument_multiplier'"
    )->fetchColumn();
    return $stored === false ? ISE_DEFAULT_MULTIPLIER : (float) $stored;
}

/**
 * Fetch everything the pages need, and verify the two retrieval paths
 * agree before anything is rendered.
 *
 * @return array{conclusions: array, scores: array, breakdowns: array, multiplier: float, verified: bool}
 */
function iseLoadScoreboard(PDO $db, ?float $multiplier = null): array
{
    $multiplier = $multiplier ?? iseRequestMultiplier($db);
    $sqlScores = iseFetchScoresViaSql($db, $multiplier);
    $breakdowns = iseComputeScoresInPhp(iseFetchEdges($db), $multiplier);

    $verified = true;
    foreach ($sqlScores as $id => $sqlScore) {
        $phpScore = $breakdowns[$id]['score'] ?? 0.0;
        if (abs($sqlScore - $phpScore) > 1e-9) {
            $verified = false;
            break;
        }
    }

    return [
        'conclusions' => iseFetchConclusions($db),
        'scores' => $sqlScores,
        'breakdowns' => $breakdowns,
        'multiplier' => $multiplier,
        'verified' => $verified,
    ];
}

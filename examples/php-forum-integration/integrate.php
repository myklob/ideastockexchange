<?php

/**
 * The "integrate" half: review moves that let a conversation change the
 * graph, through the same firewall rules as the main app's ingestion —
 * standalone-claim validation, a mandatory rationale/mechanism, audit rows,
 * and NO scores (there is no score column to write; scores are views).
 *
 *   integrate — extend the page's outline with a new pro/con argument
 *   fold      — combine: the point restates an existing argument; record
 *               that and stop (no new row, no double-counting)
 *   dismiss   — not a usable standalone argument
 *
 * Invoked as a POST endpoint from belief.php's review lane.
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/mine.php';

/** Slugify a statement into a belief id, same shape as the main app. */
function fi_slugify(string $statement): string
{
    $slug = strtolower(trim($statement));
    $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug) ?? '';
    $slug = preg_replace('/[\s-]+/', '-', $slug) ?? '';
    $words = array_slice(explode('-', trim($slug, '-')), 0, 8);
    return implode('-', $words);
}

/**
 * Integrate one pending candidate as an argument on its thread's belief
 * page. Returns [ok, message]. The mechanism sentence is the audited "why"
 * (the five-step check's step 3); when blank, a draft is composed from the
 * conversation context and flagged — never presented as considered judgment.
 */
function fi_integrate_candidate(PDO $db, string $candidateId, string $mechanism, string $direction): array
{
    $stmt = $db->prepare(
        'SELECT c.*, t.belief_id AS thread_belief, t.title AS thread_title, t.platform,
                m.author, m.idx
           FROM fi_candidates c
           JOIN fi_threads t ON t.thread_id = c.thread_id
           JOIN fi_messages m ON m.message_id = c.message_id
          WHERE c.candidate_id = ?'
    );
    $stmt->execute([$candidateId]);
    $c = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$c) {
        return [false, 'Unknown candidate.'];
    }
    if ($c['status'] !== 'pending') {
        return [false, "Candidate is already {$c['status']}."];
    }
    if ($c['thread_belief'] === null) {
        return [false, 'The thread has no belief page to integrate into.'];
    }
    if (!in_array($direction, ['pro', 'con'], true)) {
        $direction = (string) $c['direction'];
    }
    if (($failure = fi_claim_failure((string) $c['statement'])) !== null) {
        return [false, "Rejected by the standalone-claim rule ({$failure})."];
    }

    $autoDrafted = trim($mechanism) === '';
    if ($autoDrafted) {
        $mechanism = "Offered in conversation as a {$direction} point on the parent claim: \"{$c['context_quote']}\"";
    }

    $db->beginTransaction();
    try {
        // One page per claim: reuse the belief when the slug already exists.
        $childId = fi_slugify((string) $c['statement']);
        $exists = $db->prepare('SELECT 1 FROM fi_beliefs WHERE belief_id = ?');
        $exists->execute([$childId]);
        if (!$exists->fetchColumn()) {
            $db->prepare('INSERT INTO fi_beliefs (belief_id, statement) VALUES (?, ?)')
               ->execute([$childId, $c['statement']]);
            fi_audit($db, 'create_belief', 'Belief', $childId,
                "Permanent page created for a claim mined from {$c['platform']} conversation \"{$c['thread_title']}\".");
        }

        $argumentId = fi_id('arg');
        $db->prepare(
            'INSERT INTO fi_arguments (argument_id, parent_belief_id, child_belief_id, side) VALUES (?, ?, ?, ?)'
        )->execute([
            $argumentId, $c['thread_belief'], $childId,
            $direction === 'pro' ? 'agree' : 'disagree',
        ]);

        $db->prepare(
            "UPDATE fi_candidates
                SET status = 'integrated', integrated_argument_id = ?, resolved_at = datetime('now')
              WHERE candidate_id = ?"
        )->execute([$argumentId, $candidateId]);

        fi_audit($db, 'integrate_candidate', 'Candidate', $candidateId,
            "Integrated as argument {$argumentId}: mined from message #{$c['idx']} by {$c['author']} " .
            "in \"{$c['thread_title']}\". Mechanism: {$mechanism}" .
            ($autoDrafted ? ' [auto-drafted from conversation context; review the linkage before trusting it]' : ''));

        $db->commit();
    } catch (Throwable $e) {
        $db->rollBack();
        return [false, 'Integration failed: ' . $e->getMessage()];
    }

    return [true, 'Integrated. The page recomputes its scores from the new tree on the next read.'];
}

/** Fold a candidate into the existing argument it restates (combine). */
function fi_fold_candidate(PDO $db, string $candidateId): array
{
    $stmt = $db->prepare('SELECT status, nearest_argument_id, similarity FROM fi_candidates WHERE candidate_id = ?');
    $stmt->execute([$candidateId]);
    $c = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$c) {
        return [false, 'Unknown candidate.'];
    }
    if ($c['status'] !== 'pending') {
        return [false, "Candidate is already {$c['status']}."];
    }
    if ($c['nearest_argument_id'] === null) {
        return [false, 'Cannot fold: no nearest existing argument was recorded.'];
    }
    $db->prepare(
        "UPDATE fi_candidates SET status = 'duplicate', resolved_at = datetime('now') WHERE candidate_id = ?"
    )->execute([$candidateId]);
    $sim = $c['similarity'] === null ? '?' : number_format((float) $c['similarity'], 2);
    fi_audit($db, 'fold_candidate', 'Candidate', $candidateId,
        "Restates existing argument {$c['nearest_argument_id']} (similarity {$sim}). " .
        'The point is already on the page; folding prevents double-counting.');
    return [true, 'Folded into the existing argument. No new row; no double-counting.'];
}

function fi_dismiss_candidate(PDO $db, string $candidateId): array
{
    $stmt = $db->prepare('SELECT status FROM fi_candidates WHERE candidate_id = ?');
    $stmt->execute([$candidateId]);
    $status = $stmt->fetchColumn();
    if ($status === false) {
        return [false, 'Unknown candidate.'];
    }
    if ($status !== 'pending') {
        return [false, "Candidate is already {$status}."];
    }
    $db->prepare(
        "UPDATE fi_candidates SET status = 'dismissed', resolved_at = datetime('now') WHERE candidate_id = ?"
    )->execute([$candidateId]);
    fi_audit($db, 'dismiss_candidate', 'Candidate', $candidateId,
        'Dismissed at review: not a usable standalone argument.');
    return [true, 'Dismissed.'];
}

// ─── POST endpoint ────────────────────────────────────────────────────────

if (PHP_SAPI !== 'cli' && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $db = fi_db();
    $candidateId = (string) ($_POST['candidate_id'] ?? '');
    $action = (string) ($_POST['action'] ?? '');
    $back = (string) ($_POST['back'] ?? 'index.php');
    // Only redirect to our own pages.
    if (!preg_match('/^belief\.php\?id=[a-z0-9-]+$/', $back)) {
        $back = 'index.php';
    }

    [$ok, $message] = match ($action) {
        'integrate' => fi_integrate_candidate(
            fi_db(), $candidateId,
            (string) ($_POST['mechanism'] ?? ''),
            (string) ($_POST['direction'] ?? '')
        ),
        'fold' => fi_fold_candidate($db, $candidateId),
        'dismiss' => fi_dismiss_candidate($db, $candidateId),
        default => [false, 'Unknown action.'],
    };

    header('Location: ' . $back . '&notice=' . urlencode(($ok ? 'OK: ' : 'Rejected: ') . $message));
    exit;
}

<?php

/**
 * Claim mining — the "find" half of forum integration, ported from
 * src/lib/conversations/extract.ts. Chat is noisy and chronological; the
 * belief graph wants standalone pro/con claims. Strip the chat noise, split
 * into sentences, keep only sentences that could stand as claims, read each
 * message's stance, and run the redundancy scan against the page's existing
 * arguments. Every output is a *candidate*, pending review — never a direct
 * graph write.
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/similarity.php';

const FI_MIN_STATEMENT_CHARS = 20;
const FI_MIN_STATEMENT_WORDS = 4;

const FI_SOCIAL_NOISE = [
    'lol', 'lmao', 'rofl', 'haha', 'hahaha', 'omg', 'wow', 'nice', 'cool',
    'thanks', 'thx', 'ty', 'welcome', 'ok', 'okay', 'k', 'yeah', 'yes', 'no',
    'nah', 'yep', 'nope', 'same', 'this', '+1', '-1', 'agreed', 'disagree',
    'true', 'false', 'facts', 'based', 'bump', 'hi', 'hello', 'hey', 'bye',
    'again', 'thread',
];

const FI_AUX_AND_MODALS = [
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am',
    'has', 'have', 'had', 'do', 'does', 'did',
    'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might',
    'must', 'ought',
];

/** Strip URLs, @mentions, :emoji:, and quoted "> reply" lines; collect URLs. */
function fi_strip_noise(string $body): array
{
    preg_match_all('#https?://[^\s<>()"\']+#', $body, $m);
    $urls = array_values(array_unique($m[0]));

    $lines = array_filter(
        explode("\n", $body),
        fn (string $line): bool => !str_starts_with(ltrim($line), '>')
    );
    $text = implode("\n", $lines);
    $text = preg_replace('#https?://[^\s<>()"\']+#', ' ', $text) ?? '';
    $text = preg_replace('/@[a-zA-Z0-9_\/-]+/', ' ', $text) ?? '';
    $text = preg_replace('/:[a-z0-9_+-]+:/i', ' ', $text) ?? '';
    $text = trim(preg_replace('/\s+/', ' ', $text) ?? '');
    return ['text' => $text, 'urls' => $urls];
}

/** @return string[] */
function fi_split_sentences(string $text): array
{
    $parts = preg_split('/(?<=[.!?])\s+|\n+/', $text) ?: [];
    return array_values(array_filter(array_map('trim', $parts), fn (string $s): bool => $s !== ''));
}

function fi_is_social_noise(string $sentence): bool
{
    $clean = preg_replace('/[^a-z0-9+\-\s]/', '', strtolower($sentence)) ?? '';
    $tokens = preg_split('/\s+/', $clean, -1, PREG_SPLIT_NO_EMPTY) ?: [];
    if (count($tokens) === 0) {
        return true;
    }
    foreach ($tokens as $t) {
        if (!in_array($t, FI_SOCIAL_NOISE, true)) {
            return false;
        }
    }
    return true;
}

/**
 * The standalone-claim rule from the ingestion firewall: a complete
 * proposition with a truth value — not a fragment, not a bare topic label.
 * Returns null when the statement passes, else the named failure mode.
 */
function fi_claim_failure(string $statement): ?string
{
    $trimmed = trim($statement);
    $clean = preg_replace('/[^a-z0-9\s-]/', '', strtolower($trimmed)) ?? '';
    $tokens = preg_split('/\s+/', $clean, -1, PREG_SPLIT_NO_EMPTY) ?: [];

    if (strlen($trimmed) < FI_MIN_STATEMENT_CHARS || count($tokens) < FI_MIN_STATEMENT_WORDS) {
        return 'fragment';
    }

    $count = count($tokens);
    foreach ($tokens as $i => $t) {
        if (in_array($t, FI_AUX_AND_MODALS, true)) {
            return null;
        }
        if ($i > 0 && strlen($t) > 4 && preg_match('/(ed|ing|ise|ize|ify)$/', $t)) {
            return null;
        }
        if (
            $i > 0 && $i < $count - 1
            && preg_match('/[a-z]s$/', $t)
            && !preg_match('/(ss|us|is)$/', $t)
        ) {
            return null;
        }
    }
    return 'topic-label-cell';
}

/** Message stance relative to the focal position: openers flip it. */
function fi_message_stance(string $body): string
{
    $head = ltrim($body);
    $conOpeners = [
        '/^(no|nah|nope|wrong|false|incorrect)\b/i',
        '/^(i\s+)?(strongly\s+)?disagree\b/i',
        '/^that\'?s\s+(just\s+)?(not\s+true|wrong|false|nonsense|a\s+myth)\b/i',
        '/^(but|however|actually|except)\b/i',
        '/^not\s+(really|quite|true)\b/i',
        '/^counterpoint\b/i',
    ];
    foreach ($conOpeners as $p) {
        if (preg_match($p, $head)) {
            return 'con';
        }
    }
    return 'pro';
}

const FI_NEGATORS = '/\b(not|never|no|isn\'?t|aren\'?t|doesn\'?t|don\'?t|won\'?t|can\'?t|cannot|wouldn\'?t|shouldn\'?t|fails?\s+to|myth|false)\b/i';

/** Strip first-person hedges so the claim underneath can stand alone. */
function fi_normalize_statement(string $sentence): string
{
    $s = trim($sentence);
    $hedge = '/^(i\s+(think|believe|feel|reckon|guess|mean|would\s+say)|imo|imho|in\s+my\s+(honest\s+)?opinion|personally|honestly|tbh|to\s+be\s+honest|fwiw|afaik|iirc)[,:]?\s+(that\s+)?/i';
    for ($i = 0; $i < 3; $i++) {
        $next = preg_replace($hedge, '', $s) ?? $s;
        if ($next === $s) {
            break;
        }
        $s = $next;
    }
    $s = trim(preg_replace('/[.!]+$/', '', $s) ?? $s);
    return $s === '' ? $s : strtoupper($s[0]) . substr($s, 1);
}

/**
 * Mine candidate pro/con claims from a transcript and write them as pending
 * rows against the belief page the thread plugs into. Returns counts for the
 * import summary. $messages: list of ['author' => ..., 'body' => ...].
 */
function fi_mine_transcript(PDO $db, string $threadId, string $beliefId, array $messages): array
{
    $focal = $db->prepare('SELECT statement FROM fi_beliefs WHERE belief_id = ?');
    $focal->execute([$beliefId]);
    $focalStatement = (string) $focal->fetchColumn();

    // The page's existing arguments, for the redundancy scan.
    $siblings = $db->prepare(
        'SELECT a.argument_id, a.side, b.statement
           FROM fi_arguments a JOIN fi_beliefs b ON b.belief_id = a.child_belief_id
          WHERE a.parent_belief_id = ?'
    );
    $siblings->execute([$beliefId]);
    $existing = $siblings->fetchAll(PDO::FETCH_ASSOC);

    $insertMessage = $db->prepare(
        'INSERT INTO fi_messages (message_id, thread_id, idx, author, body) VALUES (?, ?, ?, ?, ?)'
    );
    $insertCandidate = $db->prepare(
        'INSERT INTO fi_candidates
           (candidate_id, thread_id, message_id, statement, direction, context_quote,
            nearest_argument_id, similarity, band, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, \'pending\')'
    );

    $mined = 0;
    $skipped = 0;
    $seen = [];

    foreach ($messages as $idx => $message) {
        $messageId = fi_id('m');
        $insertMessage->execute([$messageId, $threadId, $idx, $message['author'], $message['body']]);

        $stripped = fi_strip_noise($message['body']);
        if ($stripped['text'] === '') {
            continue;
        }
        $stance = fi_message_stance($stripped['text']);

        foreach (fi_split_sentences($stripped['text']) as $sentence) {
            if (str_ends_with($sentence, '?') || fi_is_social_noise($sentence)) {
                $skipped++;
                continue;
            }
            $statement = fi_normalize_statement($sentence);
            if (fi_claim_failure($statement) !== null) {
                $skipped++;
                continue;
            }
            // Restating the focal belief is not an argument for it.
            if (fi_text_similarity($statement, $focalStatement) >= FI_SAME_CLAIM_THRESHOLD) {
                $skipped++;
                continue;
            }
            // Fold near-duplicates within the thread: the first voicing keeps
            // the candidacy — repetition is the problem this pipeline ends.
            foreach ($seen as $prior) {
                if (fi_text_similarity($statement, $prior) >= FI_SAME_CLAIM_THRESHOLD) {
                    $skipped++;
                    continue 2;
                }
            }
            $seen[] = $statement;

            // Sentence-level negation of the focal claim flips the stance.
            $direction = $stance;
            if (
                fi_text_similarity($statement, $focalStatement) >= 0.4
                && preg_match(FI_NEGATORS, $statement)
                && !preg_match(FI_NEGATORS, $focalStatement)
            ) {
                $direction = 'con';
            }

            // Redundancy scan against the arguments already on the page. A
            // near-restatement of an OPPOSITE-side argument corrects the
            // stance read: restating a con argument is a con point, whatever
            // the message opener suggested.
            $side = $direction === 'pro' ? 'agree' : 'disagree';
            $nearestId = null;
            $nearestSim = null;
            foreach ($existing as $arg) {
                $sim = fi_text_similarity($statement, (string) $arg['statement']);
                if ($arg['side'] !== $side) {
                    if ($sim < FI_RESTATEMENT_SPEEDBUMP_THRESHOLD) {
                        continue;
                    }
                    $side = (string) $arg['side'];
                    $direction = $side === 'agree' ? 'pro' : 'con';
                    $nearestSim = $sim;
                    $nearestId = $arg['argument_id'];
                    continue;
                }
                if ($nearestSim === null || $sim > $nearestSim) {
                    $nearestSim = $sim;
                    $nearestId = $arg['argument_id'];
                }
            }
            $band = $nearestSim === null ? 'distinct' : fi_similarity_band($nearestSim);

            $candidateId = fi_id('cand');
            $insertCandidate->execute([
                $candidateId, $threadId, $messageId, $statement, $direction,
                strlen($stripped['text']) <= 280 ? $stripped['text'] : $sentence,
                $band === 'distinct' ? null : $nearestId,
                $band === 'distinct' ? null : $nearestSim,
                $band,
            ]);
            fi_audit($db, 'mine_candidate', 'Candidate', $candidateId,
                "Mined {$direction} candidate from message #{$idx}" .
                ($band !== 'distinct' ? " (nearest existing argument {$nearestId}, band {$band})." : ' (no similar existing argument).'));
            $mined++;
        }
    }

    return ['mined' => $mined, 'skipped' => $skipped];
}

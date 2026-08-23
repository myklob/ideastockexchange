<?php

/**
 * Redundancy-scan similarity — the PHP twin of src/lib/agent-ingest/similarity.ts.
 * Token-set Jaccard blended with bigram Jaccard; the bands route candidates
 * (combine vs extend) and the community decides. Nothing here writes a score.
 */

declare(strict_types=1);

const FI_STOPWORDS = [
    'a', 'an', 'the', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'for',
    'from', 'by', 'with', 'about', 'as', 'into', 'than', 'that', 'this', 'these',
    'those', 'it', 'its', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'has', 'have', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'can', 'could', 'may', 'might', 'must', 'not', 'no', 'nor', 'more', 'most',
    'less', 'least', 'very', 'relative', 'relatively',
];

/** Same bands and thresholds as the TypeScript pipeline. */
const FI_EQUIVALENCE_CANDIDATE_THRESHOLD = 0.5;
const FI_RESTATEMENT_SPEEDBUMP_THRESHOLD = 0.8;
const FI_SAME_CLAIM_THRESHOLD = 0.95;

/** Light suffix strip so "reduces"/"reduced"/"reducing" collide. */
function fi_stem(string $token): string
{
    if (strlen($token) <= 4) {
        return $token;
    }
    return preg_replace('/(ing|ed|es|s)$/', '', $token) ?? $token;
}

/** @return string[] */
function fi_normalize_tokens(string $text): array
{
    $clean = preg_replace('/[^a-z0-9\s-]/', ' ', strtolower($text)) ?? '';
    $tokens = [];
    foreach (preg_split('/\s+/', $clean, -1, PREG_SPLIT_NO_EMPTY) ?: [] as $t) {
        if (strlen($t) > 1 && !in_array($t, FI_STOPWORDS, true)) {
            $tokens[] = fi_stem($t);
        }
    }
    return $tokens;
}

/** @param string[] $a @param string[] $b */
function fi_jaccard(array $a, array $b): float
{
    $setA = array_unique($a);
    $setB = array_flip(array_unique($b));
    if (count($setA) === 0 && count($setB) === 0) {
        return 0.0;
    }
    $intersection = 0;
    foreach ($setA as $item) {
        if (isset($setB[$item])) {
            $intersection++;
        }
    }
    $union = count($setA) + count($setB) - $intersection;
    return $union === 0 ? 0.0 : $intersection / $union;
}

/** @param string[] $tokens @return string[] */
function fi_bigrams(array $tokens): array
{
    $out = [];
    for ($i = 0; $i < count($tokens) - 1; $i++) {
        $out[] = $tokens[$i] . ' ' . $tokens[$i + 1];
    }
    return $out;
}

/** Similarity in [0,1] between two claim statements. */
function fi_text_similarity(string $a, string $b): float
{
    $ta = fi_normalize_tokens($a);
    $tb = fi_normalize_tokens($b);
    return 0.7 * fi_jaccard($ta, $tb) + 0.3 * fi_jaccard(fi_bigrams($ta), fi_bigrams($tb));
}

/** 'same-claim' | 'probable-group' | 'related-link' | 'distinct' */
function fi_similarity_band(float $similarity): string
{
    if ($similarity >= FI_SAME_CLAIM_THRESHOLD) {
        return 'same-claim';
    }
    if ($similarity >= FI_RESTATEMENT_SPEEDBUMP_THRESHOLD) {
        return 'probable-group';
    }
    if ($similarity >= FI_EQUIVALENCE_CANDIDATE_THRESHOLD) {
        return 'related-link';
    }
    return 'distinct';
}

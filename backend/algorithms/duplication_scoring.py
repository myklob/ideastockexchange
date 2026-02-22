"""
Duplication Scoring — The Redundancy Problem Solution
======================================================

Implements the three-layer similarity scoring system described in "The Redundancy
Problem: Why Volume Is Not Votes."

The core insight: debate platforms that count every restatement of an argument as
an independent data point are gamed by volume, not logic.  The fix is simple in
principle but requires layered machinery to execute:

  contribution(arg_N) = base_score(arg_N) × (1 − similarity_to_prior_args)

So if argument N is 90% identical to something already on the board, it adds 10%
of what it would have contributed as a genuinely novel point.

Three-Layer Architecture
------------------------
Layer 1 — Mechanical Equivalence (pure algorithmic, no ML)
    Catches synonym substitution and double-negation.
    "Tax rates should be reduced" ≡ "Taxes should be lower."
    "He is not unintelligent" ≡ "He is intelligent."
    These account for a large fraction of real-world redundancy and are free to check.

Layer 2 — Semantic Overlap (sentence embeddings + cosine similarity)
    Catches arguments that share most of their logical content without using identical
    words.  "Trump has a short attention span" and "Trump is unintelligent" might score
    70% overlap; the second argument then contributes 30% of its base score.
    Uses the existing StatementSimilarityEngine (similarity.py).

Layer 3 — Community Verification (sub-debate on "Are these the same?")
    For contested cases, opens a pro/con sub-debate on equivalence.  The resulting
    community score adjusts the Layer 2 estimate.  In practice this layer handles
    edge cases; AI does the heavy lifting and humans provide oversight.

Additional mechanisms
---------------------
Novelty Premium
    A time-decaying score boost for genuinely new arguments.  Ensures fresh evidence
    gets visibility before the community has evaluated its relationship to existing
    arguments.

Evidence Volume vs. Argument Redundancy
    Ten papers all showing smoking causes cancer → one argument node, higher Truth Score.
    Ten posts all arguing "smoking causes cancer" → one argument node, nine ignored.
    Multiple corroborating evidence sources strengthen a node.  Duplicate argument posts
    do not create new nodes.

Semantic Obfuscation Protection
    The engine maps premise → inference → conclusion triples, not surface words.
    Thesaurus rewording of an existing argument is detected and scored as a restatement.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class ArgumentNode:
    """
    Minimal representation of an argument for duplication-scoring purposes.

    In production this would be a full ORM model; here it carries the fields
    the duplication engine actually needs.

    Attributes
    ----------
    id:
        Stable identifier for this argument (UUID string in practice).
    claim:
        The natural-language claim text (the "premise" side of the argument).
    inference:
        Optional bridging statement connecting the claim to the conclusion.
        When present it makes semantic-obfuscation detection more reliable.
    conclusion:
        What the argument is trying to prove.  Maps to the parent belief statement.
    base_score:
        Raw score before the duplication penalty is applied (0–100).
    submitted_at:
        UTC timestamp of first submission.  Used by the Novelty Premium.
    embedding:
        Pre-computed sentence embedding stored as a list of floats.  None means
        the embedding has not been computed yet.
    """
    id: str
    claim: str
    inference: str = ""
    conclusion: str = ""
    base_score: float = 50.0
    submitted_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    embedding: Optional[list[float]] = None


@dataclass
class SimilarityPair:
    """
    The result of comparing two arguments for overlap.

    Attributes
    ----------
    arg_a_id, arg_b_id:
        Identifiers of the two arguments being compared.
    layer1_score:
        0–1 mechanical-equivalence signal.  1.0 means identical after synonym/antonym
        normalization.  0.0 means no mechanical match detected.
    layer2_score:
        0–1 semantic cosine similarity.  None if embeddings are unavailable.
    layer3_score:
        0–1 community verification score.  None until a sub-debate has been resolved.
    combined_score:
        Final blended similarity (0–1) used to compute the duplication penalty.
    is_mechanical_duplicate:
        True when Layer 1 alone is enough to flag the pair as equivalent.
    """
    arg_a_id: str
    arg_b_id: str
    layer1_score: float = 0.0
    layer2_score: Optional[float] = None
    layer3_score: Optional[float] = None
    combined_score: float = 0.0
    is_mechanical_duplicate: bool = False


@dataclass
class ScoredArgument:
    """
    An argument node after duplication scoring has been applied.

    Attributes
    ----------
    arg:
        The original argument node.
    uniqueness_score:
        0–1 measure of how distinct this argument is from all prior arguments.
        1.0 = fully original; 0.0 = perfect duplicate (contributes nothing new).
    effective_contribution:
        base_score × uniqueness_score × novelty_multiplier.
        This is the value actually counted toward the parent belief's score.
    novelty_multiplier:
        ≥1.0 boost applied to genuinely novel arguments while the community
        evaluates their relationship to existing arguments.
    similarity_pairs:
        All pairwise similarity results involving this argument.
    """
    arg: ArgumentNode
    uniqueness_score: float = 1.0
    effective_contribution: float = 0.0
    novelty_multiplier: float = 1.0
    similarity_pairs: list[SimilarityPair] = field(default_factory=list)


@dataclass
class ArgumentCluster:
    """
    A group of arguments that are substantially similar to one another.

    The ISE collapses clusters into a single canonical summary for display
    while preserving drill-down access to every original variant.

    Attributes
    ----------
    cluster_id:
        Stable identifier for this cluster.
    representative_id:
        The argument chosen as the best representative of the cluster.
    member_ids:
        All argument IDs in the cluster (including the representative).
    cluster_score:
        Combined effective contribution of the cluster (not a simple sum —
        each member's uniqueness penalty prevents double-counting).
    """
    cluster_id: str
    representative_id: str
    member_ids: list[str]
    cluster_score: float = 0.0


# ---------------------------------------------------------------------------
# Layer 1: Mechanical Equivalence
# ---------------------------------------------------------------------------

# Synonym groups: every word in a group is treated as equivalent.
# All members are canonicalised to the lexicographically-smallest word in the group.
#
# Using groups (not pairs) avoids the inconsistency that arises when a single
# word belongs to multiple pairs: e.g. "lower" in both ("lower","reduce") and
# ("lower","decrease") would get a different canonical depending on iteration order.
# Groups guarantee a single consistent canonical for the whole equivalence class.
_SYNONYM_GROUPS: list[list[str]] = [
    ["decrease", "lower", "reduce"],        # canonical: "decrease"
    ["hike", "increase", "raise"],          # canonical: "hike"
    ["ban", "forbid", "prohibit"],          # canonical: "ban"
    ["allow", "enable", "permit"],          # canonical: "allow"
    ["build", "construct"],                 # canonical: "build"
    ["buy", "purchase"],                    # canonical: "buy"
    ["end", "stop", "terminate"],           # canonical: "end"
    ["fix", "repair", "resolve"],           # canonical: "fix"
    ["beneficial", "good"],                 # canonical: "beneficial"
    ["bad", "detrimental", "harmful"],      # canonical: "bad"
    ["clever", "intelligent", "smart"],     # canonical: "clever"
    ["foolish", "stupid", "unintelligent"], # canonical: "foolish"
    ["fast", "quick", "rapid"],             # canonical: "fast"
    ["slow", "sluggish"],                   # canonical: "slow"
    ["rich", "wealthy"],                    # canonical: "rich"
    ["impoverished", "poor"],               # canonical: "impoverished"
    ["accurate", "true"],                   # canonical: "accurate"
    ["false", "inaccurate", "incorrect"],   # canonical: "false"
    ["tax", "taxation", "taxes"],           # canonical: "tax"
]

# Build canonical mapping: word → smallest member of its synonym group.
_CANONICAL: dict[str, str] = {}
for _group in _SYNONYM_GROUPS:
    _canon = min(_group)
    for _word in _group:
        _CANONICAL[_word] = _canon

# Common English stopwords removed before mechanical comparison.
_STOPWORDS: frozenset[str] = frozenset({
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "shall",
    "should", "may", "might", "must", "can", "could", "not", "no", "nor",
    "so", "yet", "both", "either", "neither", "for", "and", "but", "or",
    "as", "at", "by", "in", "of", "on", "to", "up", "it", "its",
    "this", "that", "these", "those", "i", "we", "you", "he", "she", "they",
    "them", "their", "our", "your", "my", "his", "her",
})

# Prefix words that flip the polarity of a statement.
# "not unintelligent" → detected as negated antonym of "intelligent".
_NEGATION_WORDS: frozenset[str] = frozenset({
    "not", "no", "never", "neither", "nor", "without", "un", "in", "im",
    "dis", "non",
})

# Known antonym pairs used for negated-antonym detection.
_ANTONYM_PAIRS: list[tuple[str, str]] = [
    ("intelligent", "unintelligent"),
    ("intelligent", "stupid"),
    ("smart", "dumb"),
    ("good", "bad"),
    ("good", "evil"),
    ("true", "false"),
    ("correct", "incorrect"),
    ("honest", "dishonest"),
    ("legal", "illegal"),
    ("moral", "immoral"),
    ("possible", "impossible"),
    ("responsible", "irresponsible"),
    ("relevant", "irrelevant"),
    ("effective", "ineffective"),
    ("efficient", "inefficient"),
    ("logical", "illogical"),
    ("rational", "irrational"),
    ("similar", "dissimilar"),
    ("agree", "disagree"),
    ("like", "dislike"),
    ("trust", "distrust"),
    ("approve", "disapprove"),
]

# Flatten antonym pairs into a lookup: word → its antonym.
_ANTONYMS: dict[str, str] = {}
for _word, _opposite in _ANTONYM_PAIRS:
    _ANTONYMS[_word] = _opposite
    _ANTONYMS[_opposite] = _word


class MechanicalEquivalenceChecker:
    """
    Layer 1 of the duplication pipeline.

    Operates on raw text without any ML inference, so it is fast and
    deterministic.  It handles the vast majority of obvious rewording:

    * Stopword-stripped token comparison
    * Synonym canonicalization ("reduce" → "lower")
    * Negated-antonym collapsing ("not unintelligent" → "intelligent")

    Returns a similarity score in [0, 1]:
        1.0 — the two texts are mechanically equivalent
        0.0 — no mechanical match detected

    In practice this is a binary signal (0 or 1), but future versions may
    return intermediate values for partial matches.
    """

    # ------------------------------------------------------------------ #

    def normalize(self, text: str) -> list[str]:
        """
        Strip text down to its semantically load-bearing tokens.

        Steps:
        1. Lowercase
        2. Remove punctuation
        3. Tokenize on whitespace
        4. Remove stopwords
        5. Canonicalize synonyms
        6. Collapse negated antonyms ("not unintelligent" → "intelligent")

        Returns a sorted list of canonical tokens so that word order does
        not affect the mechanical comparison.
        """
        # Lowercase and strip punctuation
        text = text.lower()
        text = re.sub(r"[^\w\s']", " ", text)

        tokens = text.split()

        # Remove stopwords and canonicalize synonyms
        cleaned: list[str] = []
        i = 0
        while i < len(tokens):
            tok = tokens[i]

            # Check for negation + antonym pattern:
            # "not unintelligent" → collapse to the positive form
            if tok in _NEGATION_WORDS and i + 1 < len(tokens):
                next_tok = tokens[i + 1]
                antonym = _ANTONYMS.get(next_tok)
                if antonym is not None:
                    # "not X" where X has a known antonym → use the antonym
                    # i.e., "not unintelligent" → "intelligent"
                    canonical = _CANONICAL.get(antonym, antonym)
                    cleaned.append(canonical)
                    i += 2
                    continue
                else:
                    # Plain negation of a non-antonym word; skip both (negation
                    # is semantically complex — only handle the antonym case).
                    pass

            if tok not in _STOPWORDS:
                canonical = _CANONICAL.get(tok, tok)
                cleaned.append(canonical)

            i += 1

        return sorted(cleaned)

    # ------------------------------------------------------------------ #

    def score(self, text_a: str, text_b: str) -> float:
        """
        Return a mechanical similarity score for two argument texts.

        A score of 1.0 means the texts are mechanically equivalent after
        normalization.  Anything below 1.0 falls through to Layer 2.

        The Jaccard similarity of the token sets provides a graduated signal
        when texts partially overlap but do not fully collapse.

        Formula:
            Jaccard(A, B) = |A ∩ B| / |A ∪ B|

        Args:
            text_a: First argument claim text.
            text_b: Second argument claim text.

        Returns:
            Similarity score in [0, 1].
        """
        tokens_a = set(self.normalize(text_a))
        tokens_b = set(self.normalize(text_b))

        if not tokens_a and not tokens_b:
            return 1.0  # Both empty after normalization → treat as identical
        if not tokens_a or not tokens_b:
            return 0.0

        intersection = tokens_a & tokens_b
        union = tokens_a | tokens_b

        return len(intersection) / len(union)

    # ------------------------------------------------------------------ #

    def are_mechanically_equivalent(
        self,
        text_a: str,
        text_b: str,
        threshold: float = 0.85,
    ) -> bool:
        """
        Return True when Layer 1 similarity meets the equivalence threshold.

        A high threshold (default 0.85) means we only flag cases that are
        unambiguously the same argument restated.  Edge cases fall through
        to Layer 2 for semantic analysis.

        Args:
            text_a: First claim text.
            text_b: Second claim text.
            threshold: Minimum Jaccard score to declare equivalence.

        Returns:
            True if mechanically equivalent.
        """
        return self.score(text_a, text_b) >= threshold


# ---------------------------------------------------------------------------
# Layer 2: Semantic Overlap
# ---------------------------------------------------------------------------

class SemanticSimilarityScorer:
    """
    Layer 2 of the duplication pipeline.

    Uses sentence embeddings to detect arguments that share the same logical
    content even when expressed in completely different words.  This is the
    primary defence against semantic obfuscation — using a thesaurus to make
    an old argument look new.

    The engine maps premise → inference → conclusion as a composite text rather
    than just the surface claim.  This makes it harder to game by rewording only
    one component.

    Production usage
    ----------------
    When the `sentence_transformers` package is available, this class wraps the
    existing `StatementSimilarityEngine` (``src/core/ai/similarity.py``).  In
    environments without ML dependencies it falls back to a lightweight
    character-level n-gram baseline that is good enough for development and
    testing.
    """

    def __init__(self, use_ml: bool = True, model_name: str | None = None):
        """
        Args:
            use_ml:
                If True, attempt to load a sentence-transformer model.
                If False (or if the package is unavailable), use the n-gram fallback.
            model_name:
                Override the default embedding model.  Passed through to
                ``StatementSimilarityEngine`` when available.
        """
        self._engine = None
        if use_ml:
            try:
                import sys
                import os
                # The similarity engine lives in src/core/ai/similarity.py.
                # Add the project root so we can import it.
                project_root = os.path.dirname(
                    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                )
                if project_root not in sys.path:
                    sys.path.insert(0, project_root)

                from src.core.ai.similarity import StatementSimilarityEngine
                self._engine = StatementSimilarityEngine(model_name)
            except Exception:
                # ML not available — fall back gracefully
                self._engine = None

    # ------------------------------------------------------------------ #

    @staticmethod
    def _argument_text(arg: ArgumentNode) -> str:
        """
        Compose a single string from the argument's logical components.

        By concatenating claim + inference + conclusion we give the embedder
        the full logical structure, making it much harder to fool with surface
        rewording of just one component.
        """
        parts = [arg.claim]
        if arg.inference:
            parts.append(arg.inference)
        if arg.conclusion:
            parts.append(arg.conclusion)
        return " ".join(parts)

    # ------------------------------------------------------------------ #

    @staticmethod
    def _ngram_similarity(text_a: str, text_b: str, n: int = 3) -> float:
        """
        Lightweight character n-gram Jaccard similarity.

        Used as a fallback when sentence-transformer embeddings are not available.
        Good enough for unit tests and development; not good enough for production.

        Args:
            text_a: First text.
            text_b: Second text.
            n: N-gram size (default 3 for trigrams).

        Returns:
            Jaccard similarity in [0, 1].
        """
        def ngrams(text: str) -> set[str]:
            t = text.lower()
            return {t[i : i + n] for i in range(len(t) - n + 1)}

        a_grams = ngrams(text_a)
        b_grams = ngrams(text_b)
        if not a_grams and not b_grams:
            return 1.0
        if not a_grams or not b_grams:
            return 0.0
        return len(a_grams & b_grams) / len(a_grams | b_grams)

    # ------------------------------------------------------------------ #

    def score(self, arg_a: ArgumentNode, arg_b: ArgumentNode) -> float:
        """
        Return semantic similarity between two arguments in [0, 1].

        Priority order:
        1. If both arguments have pre-computed embeddings, use cosine similarity
           directly (fastest path).
        2. If the ML engine is available, compute embeddings on the fly.
        3. Fall back to n-gram Jaccard.

        Args:
            arg_a: First argument node.
            arg_b: Second argument node.

        Returns:
            Semantic similarity in [0, 1].
        """
        text_a = self._argument_text(arg_a)
        text_b = self._argument_text(arg_b)

        # Fast path: use pre-stored embeddings
        if arg_a.embedding and arg_b.embedding:
            import numpy as np
            emb_a = np.array(arg_a.embedding)
            emb_b = np.array(arg_b.embedding)
            norm_a = np.linalg.norm(emb_a)
            norm_b = np.linalg.norm(emb_b)
            if norm_a == 0 or norm_b == 0:
                return 0.0
            return float(np.dot(emb_a, emb_b) / (norm_a * norm_b))

        # ML engine path
        if self._engine is not None:
            emb_a = self._engine.generate_embedding(text_a)
            emb_b = self._engine.generate_embedding(text_b)
            return self._engine.calculate_similarity(emb_a, emb_b)

        # N-gram fallback
        return self._ngram_similarity(text_a, text_b)

    # ------------------------------------------------------------------ #

    def contribution_factor(self, similarity: float) -> float:
        """
        Convert a raw similarity score into a contribution multiplier.

        The formula encodes the doc's core rule:
            contribution = 1 − similarity

        At 90% similarity the second argument contributes 10%.
        At 70% similarity it contributes 30%.
        At 0% (totally novel) it contributes 100%.

        The result is clamped to [0, 1].

        Args:
            similarity: Raw similarity score in [0, 1].

        Returns:
            Contribution factor in [0, 1].
        """
        return max(0.0, min(1.0, 1.0 - similarity))


# ---------------------------------------------------------------------------
# Layer 3: Community Verification
# ---------------------------------------------------------------------------

@dataclass
class EquivalenceSubDebate:
    """
    A community sub-debate on whether two arguments are saying the same thing.

    Structure mirrors the ISE's standard pro/con debate format.  The resolved
    score feeds back into the combined similarity estimate for the pair.

    Attributes
    ----------
    id:
        Unique identifier for this sub-debate.
    arg_a_id, arg_b_id:
        The two arguments under comparison.
    question:
        The debate question shown to participants.  Always of the form
        "Are these two arguments saying the same thing?"
    pro_score:
        Aggregated weight of reasons arguing for equivalence (0–100).
    con_score:
        Aggregated weight of reasons arguing against equivalence (0–100).
    resolved:
        True once the debate has reached a stable consensus.
    community_similarity_score:
        The resolved similarity estimate from the community (0–1).
        None until resolved.
    """
    id: str
    arg_a_id: str
    arg_b_id: str
    question: str = "Are these two arguments saying the same thing?"
    pro_score: float = 0.0
    con_score: float = 0.0
    resolved: bool = False
    community_similarity_score: Optional[float] = None

    def resolve(self) -> float:
        """
        Compute and store the community similarity score from pro/con votes.

        Uses a sigmoid-like normalisation so that equal pro/con → 0.5, unanimous
        pro → 1.0, unanimous con → 0.0.

        Returns:
            Community similarity score in [0, 1].
        """
        total = self.pro_score + self.con_score
        if total == 0.0:
            self.community_similarity_score = 0.5  # No data → neutral
        else:
            self.community_similarity_score = self.pro_score / total

        self.resolved = True
        return self.community_similarity_score


# ---------------------------------------------------------------------------
# Novelty Premium
# ---------------------------------------------------------------------------

# Default parameters for the novelty premium decay curve.
_NOVELTY_PEAK_MULTIPLIER = 1.25   # Maximum boost: 25% above base score
_NOVELTY_HALFLIFE_HOURS  = 24.0   # Hours for boost to decay to half its peak
_NOVELTY_FLOOR           = 1.0    # Minimum multiplier (no penalty after decay)


class NoveltyPremiumCalculator:
    """
    Computes a time-decaying score boost for genuinely new arguments.

    When an argument first enters the system its relationship to existing
    arguments has not yet been evaluated.  Without a novelty premium, a
    genuinely original argument might be buried under a pile of established
    (and therefore scored) restatements of the opposing view.

    The premium decays exponentially so that by the time the community has
    had a chance to evaluate similarity, the boost has normalised and the
    argument stands on its permanent deduplicated score.

    The boost only applies if the argument's uniqueness score is above a
    threshold — we do not boost obvious duplicates just because they are new.

    Formula:
        multiplier(t) = floor + (peak − floor) × 0.5^(t / halflife)

    Where t is hours since submission.

    Args:
        peak_multiplier:
            Maximum multiplier applied immediately after submission.
        halflife_hours:
            Time (hours) for the multiplier to decay to halfway between
            peak and floor.
        floor:
            Minimum multiplier once fully decayed (must be ≥ 1.0).
        novelty_threshold:
            Minimum uniqueness score for a novelty boost to be applied.
            Arguments below this threshold are not boosted regardless of age.
    """

    def __init__(
        self,
        peak_multiplier: float = _NOVELTY_PEAK_MULTIPLIER,
        halflife_hours: float = _NOVELTY_HALFLIFE_HOURS,
        floor: float = _NOVELTY_FLOOR,
        novelty_threshold: float = 0.5,
    ) -> None:
        self.peak_multiplier = peak_multiplier
        self.halflife_hours = halflife_hours
        self.floor = floor
        self.novelty_threshold = novelty_threshold

    # ------------------------------------------------------------------ #

    def multiplier(
        self,
        submitted_at: datetime,
        uniqueness_score: float,
        now: datetime | None = None,
    ) -> float:
        """
        Return the current novelty multiplier for an argument.

        Args:
            submitted_at:
                UTC datetime when the argument was first submitted.
            uniqueness_score:
                Current uniqueness score (0–1).  Arguments below
                ``self.novelty_threshold`` receive no boost.
            now:
                Override "current time" (useful in tests).

        Returns:
            Multiplier ≥ 1.0.
        """
        if uniqueness_score < self.novelty_threshold:
            return self.floor  # No boost for detected duplicates

        if now is None:
            now = datetime.now(timezone.utc)

        # Ensure both datetimes are timezone-aware for subtraction
        if submitted_at.tzinfo is None:
            submitted_at = submitted_at.replace(tzinfo=timezone.utc)
        if now.tzinfo is None:
            now = now.replace(tzinfo=timezone.utc)

        age_hours = (now - submitted_at).total_seconds() / 3600.0
        age_hours = max(0.0, age_hours)

        # Exponential decay: multiplier approaches floor as age → ∞
        decay = math.pow(0.5, age_hours / self.halflife_hours)
        return self.floor + (self.peak_multiplier - self.floor) * decay


# ---------------------------------------------------------------------------
# Evidence Volume vs. Argument Redundancy
# ---------------------------------------------------------------------------

@dataclass
class EvidenceSource:
    """
    A single piece of corroborating evidence for an argument node.

    Multiple sources all pointing to the same fact increase the node's
    Truth Score (corroboration is rewarded).  They do *not* create
    separate argument nodes.

    Attributes
    ----------
    id:
        Unique identifier for this source.
    argument_id:
        The argument node this evidence supports.
    title:
        Short description of the source.
    url:
        Link to the source (if any).
    quality_tier:
        T1 (peer-reviewed) through T4 (anecdotal).
    corroboration_weight:
        Contribution to the argument node's Truth Score boost (0–1).
    """
    id: str
    argument_id: str
    title: str
    url: str = ""
    quality_tier: str = "T2"
    corroboration_weight: float = 0.1


class EvidenceVolumeTracker:
    """
    Distinguishes corroborating evidence from redundant argument posting.

    Rule:
        Multiple evidence sources for the same fact → each source contributes
        to the argument's Truth Score (capped at a maximum boost).

        Multiple argument posts making the same claim → only the first is
        scored; subsequent posts trigger the duplication penalty.

    This maps directly to the doc's distinction:
        "Evidence Volume (corroboration) is rewarded. Argument Redundancy is not."
    """

    # Maximum Truth Score boost from corroboration (additive, above base).
    MAX_CORROBORATION_BOOST = 0.20  # 20 percentage-point ceiling

    # ------------------------------------------------------------------ #

    def corroboration_boost(self, sources: list[EvidenceSource]) -> float:
        """
        Calculate how much a list of corroborating sources boosts the Truth Score.

        Each additional independent source adds diminishing marginal value.
        The first independent source is most valuable; the tenth adds very little.

        Formula:
            boost = MAX × (1 − e^(−k × n))

        where n is the number of sources and k controls how quickly the boost
        saturates.  With k ≈ 0.5:
            1 source  → ~39% of MAX
            3 sources → ~78% of MAX
            6 sources → ~95% of MAX

        Args:
            sources: List of corroborating evidence sources.

        Returns:
            Additive Truth Score boost in [0, MAX_CORROBORATION_BOOST].
        """
        n = len(sources)
        if n == 0:
            return 0.0

        # Weight by quality tier: T1 counts double, T4 counts at 0.25×
        tier_weights = {"T1": 1.0, "T2": 0.75, "T3": 0.5, "T4": 0.25}
        weighted_n = sum(
            tier_weights.get(s.quality_tier, 0.5) * s.corroboration_weight
            for s in sources
        )

        k = 0.5  # Saturation rate
        boost = self.MAX_CORROBORATION_BOOST * (1 - math.exp(-k * weighted_n))
        return min(boost, self.MAX_CORROBORATION_BOOST)


# ---------------------------------------------------------------------------
# Main Duplication Scorer
# ---------------------------------------------------------------------------

class DuplicationScorer:
    """
    Orchestrates all three similarity layers to compute duplication-adjusted
    scores for a set of sibling arguments.

    Usage
    -----
    ::

        scorer = DuplicationScorer()

        args = [
            ArgumentNode(id="a1", claim="Tax rates should be lower"),
            ArgumentNode(id="a2", claim="Taxes should be reduced"),      # L1 dup
            ArgumentNode(id="a3", claim="Donald Trump is unintelligent"),
            ArgumentNode(id="a4", claim="Trump has a short attention span"),  # L2 ~70%
            ArgumentNode(id="a5", claim="Climate policy is expensive"),   # novel
        ]

        scored = scorer.score_arguments(args)
        for s in scored:
            print(s.arg.id, s.uniqueness_score, s.effective_contribution)

    The arguments should share the same parent belief (they are "siblings" in
    the argument tree).  Cross-topic comparison is handled by the
    OverlapScoringEngine (overlap_engine.py).

    Parameters
    ----------
    layer1_weight:
        Weight given to the mechanical-equivalence signal when blending layers.
    layer2_weight:
        Weight given to the semantic signal.
    layer3_weight:
        Weight given to community verification when available.
    mechanical_threshold:
        Jaccard score above which Layer 1 declares an outright duplicate.
    semantic_threshold:
        Cosine similarity above which an argument is considered significantly
        redundant (triggers a meaningful duplication penalty).
    use_ml:
        Whether to attempt loading the sentence-transformer model.
    novelty_calculator:
        Custom NoveltyPremiumCalculator.  Defaults to standard parameters.
    """

    def __init__(
        self,
        layer1_weight: float = 0.4,
        layer2_weight: float = 0.6,
        layer3_weight: float = 0.0,      # 0 until community sub-debate resolves
        mechanical_threshold: float = 0.85,
        semantic_threshold: float = 0.50,
        use_ml: bool = True,
        novelty_calculator: NoveltyPremiumCalculator | None = None,
    ) -> None:
        self.layer1_weight = layer1_weight
        self.layer2_weight = layer2_weight
        self.layer3_weight = layer3_weight
        self.mechanical_threshold = mechanical_threshold
        self.semantic_threshold = semantic_threshold

        self._l1 = MechanicalEquivalenceChecker()
        self._l2 = SemanticSimilarityScorer(use_ml=use_ml)
        self._novelty = novelty_calculator or NoveltyPremiumCalculator()

    # ------------------------------------------------------------------ #

    def compare(
        self,
        arg_a: ArgumentNode,
        arg_b: ArgumentNode,
        community_debate: EquivalenceSubDebate | None = None,
    ) -> SimilarityPair:
        """
        Run all available similarity layers on a pair of arguments.

        Args:
            arg_a: First argument.
            arg_b: Second argument.
            community_debate: Optional resolved community sub-debate.

        Returns:
            SimilarityPair with all layer scores and a blended combined score.
        """
        # --- Layer 1 ---
        l1 = self._l1.score(arg_a.claim, arg_b.claim)
        is_mech_dup = l1 >= self.mechanical_threshold

        # --- Layer 2 ---
        l2 = self._l2.score(arg_a, arg_b)

        # --- Layer 3 ---
        l3: Optional[float] = None
        if community_debate and community_debate.resolved:
            l3 = community_debate.community_similarity_score

        # --- Blend ---
        combined = self._blend(l1, l2, l3)

        return SimilarityPair(
            arg_a_id=arg_a.id,
            arg_b_id=arg_b.id,
            layer1_score=l1,
            layer2_score=l2,
            layer3_score=l3,
            combined_score=combined,
            is_mechanical_duplicate=is_mech_dup,
        )

    # ------------------------------------------------------------------ #

    def _blend(
        self,
        l1: float,
        l2: float,
        l3: Optional[float],
    ) -> float:
        """
        Blend layer scores into a single combined similarity.

        When Layer 3 is unavailable the weights are renormalized across
        Layers 1 and 2 only.

        When Layer 1 declares a mechanical duplicate (≥ threshold) the
        combined score is immediately set to 1.0 — no need for further
        analysis.

        Args:
            l1: Layer 1 mechanical similarity (0–1).
            l2: Layer 2 semantic similarity (0–1).
            l3: Layer 3 community score (0–1) or None.

        Returns:
            Blended similarity in [0, 1].
        """
        # Mechanical duplicates are always 1.0
        if l1 >= self.mechanical_threshold:
            return 1.0

        if l3 is not None:
            total_w = self.layer1_weight + self.layer2_weight + self.layer3_weight
            blended = (
                l1 * self.layer1_weight
                + l2 * self.layer2_weight
                + l3 * self.layer3_weight
            ) / total_w
        else:
            total_w = self.layer1_weight + self.layer2_weight
            blended = (l1 * self.layer1_weight + l2 * self.layer2_weight) / total_w

        return max(0.0, min(1.0, blended))

    # ------------------------------------------------------------------ #

    def uniqueness_from_pairs(self, pairs: list[SimilarityPair]) -> float:
        """
        Derive a uniqueness score for an argument given its similarity to all
        prior arguments in the same debate.

        Rule: the uniqueness score equals 1 minus the *maximum* similarity to
        any prior argument.  We use the maximum (not average) because even one
        near-identical prior argument is enough to mark the new argument as
        redundant.

        Args:
            pairs: Similarity pairs where this argument is one of the endpoints.

        Returns:
            Uniqueness score in [0, 1].  1.0 = fully original.
        """
        if not pairs:
            return 1.0
        max_similarity = max(p.combined_score for p in pairs)
        return max(0.0, 1.0 - max_similarity)

    # ------------------------------------------------------------------ #

    def score_arguments(
        self,
        arguments: list[ArgumentNode],
        community_debates: dict[tuple[str, str], EquivalenceSubDebate] | None = None,
        now: datetime | None = None,
    ) -> list[ScoredArgument]:
        """
        Score a list of sibling arguments for duplication.

        Arguments are processed in submission order (oldest first).  The first
        argument in a cluster always receives uniqueness = 1.0; later arguments
        pay the duplication penalty relative to what came before them.

        This ordering incentivises being the first to make a point rather than
        the hundredth to repeat it.

        Args:
            arguments:
                Sibling arguments to score (same parent belief, same side).
                Should be sorted by ``submitted_at`` ascending (oldest first).
            community_debates:
                Optional dict keyed by (arg_a_id, arg_b_id) pairs (in any order)
                mapping to resolved EquivalenceSubDebate objects.
            now:
                Override "current time" for novelty premium calculation.

        Returns:
            List of ScoredArgument objects, one per input argument, in the
            same order as the input.
        """
        if community_debates is None:
            community_debates = {}

        # Sort oldest-first so the priority is on original submissions
        sorted_args = sorted(arguments, key=lambda a: a.submitted_at)

        results: list[ScoredArgument] = []

        for i, arg in enumerate(sorted_args):
            # Compare against all previously scored arguments
            prior_args = sorted_args[:i]
            pairs: list[SimilarityPair] = []

            for prior in prior_args:
                # Look up any resolved community debate for this pair
                debate = (
                    community_debates.get((arg.id, prior.id))
                    or community_debates.get((prior.id, arg.id))
                )
                pair = self.compare(arg, prior, debate)
                pairs.append(pair)

            uniqueness = self.uniqueness_from_pairs(pairs)
            novelty = self._novelty.multiplier(arg.submitted_at, uniqueness, now)
            effective = arg.base_score * uniqueness * novelty

            results.append(ScoredArgument(
                arg=arg,
                uniqueness_score=uniqueness,
                effective_contribution=effective,
                novelty_multiplier=novelty,
                similarity_pairs=pairs,
            ))

        # Re-sort to match original input order
        order = {a.id: idx for idx, a in enumerate(arguments)}
        results.sort(key=lambda s: order[s.arg.id])

        return results

    # ------------------------------------------------------------------ #

    def cluster_arguments(
        self,
        scored: list[ScoredArgument],
        similarity_threshold: float = 0.70,
    ) -> list[ArgumentCluster]:
        """
        Group scored arguments into similarity clusters.

        Arguments within a cluster are substantially similar to each other.
        The cluster is represented by the argument with the highest base_score
        (typically the one that came first and received the full uniqueness credit).

        The cluster score is the sum of each member's effective_contribution,
        which already accounts for the duplication penalty — so the cluster
        score cannot exceed what a single fully-novel argument would score.

        Args:
            scored: Output of ``score_arguments``.
            similarity_threshold: Minimum combined similarity to place two
                arguments in the same cluster.

        Returns:
            List of ArgumentCluster objects.
        """
        clusters: list[list[str]] = []
        assigned: set[str] = set()

        # Gather all known pairs from the similarity data
        all_pairs: dict[tuple[str, str], float] = {}
        for s in scored:
            for p in s.similarity_pairs:
                key = (p.arg_a_id, p.arg_b_id)
                all_pairs[key] = p.combined_score

        for s in scored:
            if s.arg.id in assigned:
                continue

            cluster = [s.arg.id]
            assigned.add(s.arg.id)

            for other in scored:
                if other.arg.id in assigned:
                    continue
                sim = (
                    all_pairs.get((s.arg.id, other.arg.id))
                    or all_pairs.get((other.arg.id, s.arg.id))
                    or 0.0
                )
                if sim >= similarity_threshold:
                    cluster.append(other.arg.id)
                    assigned.add(other.arg.id)

            clusters.append(cluster)

        # Build ArgumentCluster objects
        scored_map = {s.arg.id: s for s in scored}
        result: list[ArgumentCluster] = []

        for idx, cluster_ids in enumerate(clusters):
            # Representative: highest base_score in cluster
            rep_id = max(
                cluster_ids,
                key=lambda aid: scored_map[aid].arg.base_score,
            )
            total_contribution = sum(
                scored_map[aid].effective_contribution for aid in cluster_ids
            )
            result.append(ArgumentCluster(
                cluster_id=f"cluster-{idx + 1}",
                representative_id=rep_id,
                member_ids=cluster_ids,
                cluster_score=total_contribution,
            ))

        return result

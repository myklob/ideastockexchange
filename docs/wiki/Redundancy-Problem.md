# The Redundancy Problem: Why Volume Is Not Votes

Imagine a courtroom where one side is allowed to call the same witness a hundred
times.  Same testimony, slightly different phrasing each time.  The jury,
overwhelmed by repetition, starts to feel that this side must have more going for
it.  They do not.  They just have more words.

This is how every major debate platform currently works.  Arguments do not have to
be original to be counted.  They just have to be posted.  The side that can
generate the most restatements of the same claim wins by volume, not by logic.

The Idea Stock Exchange breaks this exploit with **Duplication Scoring**: if two
arguments are 90% saying the same thing, the second one contributes 10% of its
score, not 100%.

The deeper insight is that most debates, once you strip the redundancy, reduce to
a surprisingly small number of distinct underlying arguments.  147 variations of
"Trump is unintelligent" collapse into perhaps three core claims, each with its
own evidence base and counterarguments.  Duplication scoring does not oversimplify
the debate; it reveals the actual structure underneath the noise.

---

## How Similarity Scoring Works

Similarity scoring operates in layers, from simple and automatable to complex and
requiring community verification.  Arguments are organized by topic alignment,
[topic overlap score](./TopicOverlapScores.md), intensity, and specificity, which
positions similar claims side by side before any scoring begins.

---

### Layer 1: Mechanical Equivalence (Easy to Automate)

The first pass removes filler words and identifies statements that substitute
synonyms or negated antonyms.

| Input A | Input B | Result |
|---------|---------|--------|
| "Taxes should be lower" | "Tax rates should be reduced" | **Equivalent** |
| "He is intelligent" | "He is not unintelligent" | **Equivalent** |
| "The policy is harmful" | "The policy is bad" | **Equivalent** |
| "Carbon emissions rise" | "Unemployment is increasing" | Not equivalent |

These equivalences are detectable algorithmically without any human judgment.
They are handled first because they are cheap to catch and account for a large
fraction of redundancy in real debates.

**Implementation:** Token-level [Jaccard similarity][jaccard] over synonym-
canonicalized, stopword-stripped text.  Arguments scoring ≥ 0.85 Jaccard are
flagged as mechanical duplicates without needing semantic analysis.

> See: `backend/algorithms/duplication_scoring.py` — `MechanicalEquivalenceChecker`
> and `src/core/scoring/duplication-scoring.ts` — `mechanicalSimilarity()`

---

### Layer 2: Semantic Overlap (Requires Judgment)

The harder cases are arguments that are related but not identical.

> "Donald Trump has a short attention span" and "Donald Trump is unintelligent."

These might be 70% overlapping (attention span as a component of intelligence),
or they might be genuinely distinct claims worth scoring separately.  The system
assigns a **Similarity Score** between 0 and 100% and treats the second
argument's contribution to the overall conclusion score as proportional to its
uniqueness.

```
contribution(argN) = baseScore(argN) × (1 − similarity_to_prior_args)
```

At 70% similarity, the second argument contributes 30% of what it would
contribute if it were entirely novel.

**As clusters of similar arguments form**, the system generates a single high-quality
summary for each cluster while maintaining a drill-down path to the original
variations.  Users see the best version of each distinct point rather than wading
through every restatement, but nothing is discarded: the underlying nuances remain
accessible to anyone who wants them.

**Novelty Premium**: To prevent novel arguments from getting buried before the
community can evaluate them, the system grants a temporary score boost for
genuinely unique perspectives.  The boost decays exponentially with a 24-hour
half-life:

```
multiplier(t) = 1.0 + 0.25 × 0.5^(t / 24h)
```

Once evaluated, the boost normalizes and the argument stands on its permanent score.

**Implementation:** Sentence embeddings (via `sentence-transformers`) compute
cosine similarity on the full logical structure — `claim + inference + conclusion`
— rather than just the surface wording.  This makes it much harder to fool with
selective rewording of one component.

> See: `backend/algorithms/duplication_scoring.py` — `SemanticSimilarityScorer`
> and `src/core/scoring/duplication-scoring.ts` — `blendSimilarityLayers()`

---

### Layer 3: Community Verification (For Anyone Interested Enough)

For any two arguments in the system, the ISE can open a sub-debate on a single
question: *Are these saying the same thing?*

This sub-debate follows the same pro/con structure as any other belief page.
Reasons to agree they are equivalent go in one column.  Reasons to disagree go in
the other.  The resulting score feeds back into the similarity score between the
two parent arguments.

In practice, most of this work will be done by AI.  The machinery to have humans
debate argument similarity at scale exists primarily to provide transparency and
override capability: anyone who believes the automated similarity score is wrong
can challenge it with evidence, and the system will update accordingly.  **The AI
does the heavy lifting; humans and the community provide the checks.**

**Implementation:** `EquivalenceSubDebate` data structure in
`backend/algorithms/duplication_scoring.py`.  The community score is blended into
the final similarity estimate via configurable layer weights.

---

## Two Guardrails Worth Knowing

### Reinforcement vs. Repetition

Ten different sources all citing evidence that smoking causes cancer should not
create ten separate argument nodes.  But those ten sources do matter: they
increase the **Truth Score** of the single node they all support.

The ISE distinguishes:

| Pattern | What It Means | How It's Handled |
|---------|---------------|-----------------|
| **Evidence Volume** | Multiple sources corroborating the same fact | Strengthens the node's Truth Score (rewarded) |
| **Argument Redundancy** | Multiple posts making the same logical point | Only the first counts; duplicates pay the penalty |

Corroboration is rewarded.  Repetition is not.

The corroboration boost uses a diminishing-returns formula:

```
boost = MAX_BOOST × (1 − e^(−0.5 × weightedN))
```

where `weightedN` weights each source by its quality tier (T1 peer-reviewed = 1.0,
T4 anecdotal = 0.25).  The tenth paper adds much less than the first.

> See: `backend/algorithms/duplication_scoring.py` — `EvidenceVolumeTracker`
> and `src/core/scoring/duplication-scoring.ts` — `corroborationBoost()`

---

### Semantic Obfuscation

Using a thesaurus to make an old argument look new is a predictable manipulation
attempt.  The AI semantic engine maps the underlying **logic structure** (premise →
inference → conclusion) rather than just the surface wording.  If the logic is the
same, the score is shared regardless of how the words are rearranged.

Wordsmithing does not produce a new argument node; it produces a restatement of an
existing one.

**Why this works:** Sentence embeddings operate on *meaning*, not vocabulary.
"Carbon emissions warm the planet" and "Greenhouse gas release raises global
temperatures" will produce embeddings with very high cosine similarity regardless
of word-for-word differences.  Composing the embedding from claim + inference +
conclusion means that even partially-reworded arguments are caught when the core
logic is unchanged.

---

## Why This Matters for Every Debate

Without similarity scoring, the ISE would reproduce the core failure of every
platform it is trying to replace: the side with more participants, more bots, or
more time to post wins regardless of argument quality.  A single devastating
argument stated once would be buried under a hundred mediocre restatements of the
opposing view.

With similarity scoring, what gets counted is not how many times something was
said, but how many *distinct* things were said and how well-supported each one is.
Repetition stops being a strategy.  The only path to a higher score is a genuinely
new argument or better evidence for an existing one.

Because scores update dynamically as new evidence arrives, you can watch beliefs
evolve in real time.  A policy belief might rise when new labor market data is
published and fall when revised projections arrive.  Each change is traceable to a
specific argument node and the evidence that moved it.  You are not just watching a
debate; you are watching the weight of evidence shift.

This connects directly to [One Page Per Topic](./OnePagePerDebateTopic.md) and
[One Page Per Belief](./OnePagePerBelief.md): by requiring every argument to be
filed in a specific location in the argument hierarchy, we position similar claims
side by side where their overlap is visible.  **Categorization by topic and
sub-topic is what makes similarity scoring tractable in the first place.**  You
cannot measure overlap between arguments you cannot find.

---

## The Impartial Standard: Objective Criteria

Similarity scoring tells us when two arguments are redundant.
[Objective Criteria scoring](./ObjectiveCriteriaScores.md) tells us what standards
we are using to evaluate them in the first place.

Every category of debate requires its own criteria debate: what counts as evidence
here, what metrics matter, what would change our minds.  Defining the yardstick
before measuring ensures that every candidate, policy, or claim in a category is
evaluated against the same standard rather than against whatever metric happens to
make one side look best.

Together, similarity scoring and objective criteria scoring solve the same problem
from two directions: one prevents the same weak point from being counted a thousand
times, and the other prevents the goalposts from moving every time a new
participant arrives.

---

## Traditional Debate vs. Idea Stock Exchange

| Traditional Debate | Idea Stock Exchange |
|---|---|
| Endless loops | Cumulative learning |
| Loudest voice wins | Best evidence wins |
| Isolated claims | Networked beliefs |
| Repetition = reinforcement | Refinement = progress |

---

## Implementation Reference

| Component | Location | Purpose |
|-----------|----------|---------|
| `MechanicalEquivalenceChecker` | `backend/algorithms/duplication_scoring.py` | Layer 1: synonym/antonym normalization |
| `SemanticSimilarityScorer` | `backend/algorithms/duplication_scoring.py` | Layer 2: embedding-based cosine similarity |
| `EquivalenceSubDebate` | `backend/algorithms/duplication_scoring.py` | Layer 3: community verification data model |
| `DuplicationScorer` | `backend/algorithms/duplication_scoring.py` | Main orchestrator — all three layers |
| `NoveltyPremiumCalculator` | `backend/algorithms/duplication_scoring.py` | Temporary boost for genuinely new arguments |
| `EvidenceVolumeTracker` | `backend/algorithms/duplication_scoring.py` | Corroboration vs. redundancy distinction |
| `mechanicalSimilarity()` | `src/core/scoring/duplication-scoring.ts` | Layer 1 (TypeScript) |
| `blendSimilarityLayers()` | `src/core/scoring/duplication-scoring.ts` | Layer blending (TypeScript) |
| `scoreArgumentsForDuplication()` | `src/core/scoring/duplication-scoring.ts` | Full TypeScript pipeline |
| `clusterArguments()` | `src/core/scoring/duplication-scoring.ts` | Cluster generation for UI |
| `corroborationBoost()` | `src/core/scoring/duplication-scoring.ts` | Evidence volume boost (TypeScript) |
| `noveltyMultiplier()` | `src/core/scoring/duplication-scoring.ts` | Novelty premium (TypeScript) |

---

## See Also

- [Duplication Scores](./DuplicationScores.md)
- [Linkage Scores](./LinkageScores.md)
- [ReasonRank](./ReasonRank.md)
- [One Page Per Belief](./OnePagePerBelief.md)
- [Truth Scores](./Truth-Score.md)
- [Equivalency Score](./Equivalency-Score.md)

[jaccard]: https://en.wikipedia.org/wiki/Jaccard_index

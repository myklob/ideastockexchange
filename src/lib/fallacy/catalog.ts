// The canonical fallacy catalog: one source of truth for every place a
// fallacy type is named — the automated detector, the structured accusation
// template, the confirmation ladder, and the explainer page. An accusation
// must name a catalog entry; the entry decides which score factor a CONFIRMED
// claim damages and how hard, and what evidence the accusation must carry
// before it is even accepted as a claim.

export type FallacyTargetFactor = 'relevance' | 'logical-validity' | 'evidence-quality'
export type FallacySeverity = 'minor' | 'major'

export interface FallacyCatalogEntry {
  slug: string
  label: string
  /** Which factor a confirmed claim damages. Relevance fallacies argue against
   *  the linkage, formal fallacies against logical validity, evidence
   *  fallacies against evidence quality. */
  targetFactor: FallacyTargetFactor
  /** Drives the logical-validity ladder once confirmed (see claims.ts). */
  severity: FallacySeverity
  definition: string
  /** What a filed claim must demonstrate for the community to confirm it. */
  detectionCriteria: string[]
  /** What the evidenceLinks field must contain. When set, an accusation with
   *  no evidence links is rejected at validation — the accusation is an
   *  argument, and this type's argument needs exhibits. */
  evidenceRequirement: string | null
  /** The honest boundary: when this pattern is NOT a fallacy. */
  notFallacyWhen?: string
}

const ENTRIES: FallacyCatalogEntry[] = [
  {
    slug: 'false-dilemma',
    label: 'False Dilemma',
    targetFactor: 'logical-validity',
    severity: 'major',
    definition: 'Presents only two options when more exist.',
    detectionCriteria: [
      'Uses either/or framing',
      'Excludes reasonable middle ground',
      'The excluded alternatives can be demonstrated to exist',
    ],
    evidenceRequirement: 'List the excluded alternatives with evidence they exist.',
    notFallacyWhen: 'Only two options logically exist (a genuine dichotomy).',
  },
  {
    slug: 'ad-hominem',
    label: 'Ad Hominem',
    targetFactor: 'relevance',
    severity: 'major',
    definition: 'Attacks the person making the argument instead of the argument.',
    detectionCriteria: [
      'Attacks character, motives, or identity',
      'Does not address the substance',
      'Implies the argument is wrong because of who said it',
    ],
    evidenceRequirement: null,
    notFallacyWhen: 'A relevant conflict of interest is documented with evidence.',
  },
  {
    slug: 'straw-man',
    label: 'Straw Man',
    targetFactor: 'relevance',
    severity: 'major',
    definition: "Misrepresents the opponent's position to make it easier to attack.",
    detectionCriteria: [
      'Distorts what the opponent said',
      'Attacks the weakened version',
      'The discrepancy with the actual position can be shown',
    ],
    evidenceRequirement: "Link the opponent's actual stated position showing the discrepancy.",
  },
  {
    slug: 'slippery-slope',
    label: 'Slippery Slope',
    targetFactor: 'logical-validity',
    severity: 'major',
    definition:
      'Claims a small step inevitably leads to an extreme outcome without showing the mechanism.',
    detectionCriteria: [
      'No causal mechanism for the progression',
      'Relies on fear of the endpoint',
      'Each step does not follow from the previous',
    ],
    evidenceRequirement: 'Show the missing causal mechanism between the steps.',
    notFallacyWhen: 'The causal mechanism for each step is demonstrated with evidence.',
  },
  {
    slug: 'appeal-to-authority',
    label: 'Appeal to Authority (improper)',
    targetFactor: 'evidence-quality',
    severity: 'minor',
    definition:
      'Treats a claim as settled because an authority said so, outside their expertise or against the body of evidence.',
    detectionCriteria: [
      'The cited authority is outside their domain, or',
      'The authority contradicts the weight of higher-tier evidence',
    ],
    evidenceRequirement: null,
    notFallacyWhen:
      'Citing a genuine domain expert consistent with the evidence base (that is T2 evidence, not a fallacy).',
  },
  {
    slug: 'cherry-picking',
    label: 'Cherry Picking / Suppressed Evidence',
    targetFactor: 'evidence-quality',
    severity: 'major',
    definition: 'Cites only favorable evidence while ignoring contradicting evidence.',
    detectionCriteria: [
      'Higher-tier contradicting evidence exists',
      'A pattern of selecting only supportive sources',
    ],
    evidenceRequirement: 'Link the contradicting evidence being ignored.',
  },
  {
    slug: 'moving-goalposts',
    label: 'Moving the Goalposts',
    targetFactor: 'logical-validity',
    severity: 'minor',
    definition: 'Changes the standard of proof after the original standard was met.',
    detectionCriteria: [
      'An earlier stated criterion was satisfied',
      'A new criterion was then substituted without conceding the first',
    ],
    evidenceRequirement: 'Quote the earlier criterion and show it was met before the switch.',
  },
  {
    slug: 'whataboutism',
    label: 'Tu Quoque / Whataboutism',
    targetFactor: 'relevance',
    severity: 'minor',
    definition: "Deflects a charge by pointing at the accuser's conduct instead of answering it.",
    detectionCriteria: [
      'Responds to a claim with an unrelated counter-charge',
      'The counter-charge does not bear on whether the original claim is true',
    ],
    evidenceRequirement: null,
  },
  {
    slug: 'post-hoc',
    label: 'Post Hoc Ergo Propter Hoc',
    targetFactor: 'logical-validity',
    severity: 'major',
    definition: 'Infers causation from mere temporal sequence.',
    detectionCriteria: [
      'B followed A is the whole causal case',
      'Confounders and coincidence are not ruled out',
    ],
    evidenceRequirement: null,
  },
  {
    slug: 'hasty-generalization',
    label: 'Hasty Generalization',
    targetFactor: 'logical-validity',
    severity: 'minor',
    definition: 'Draws a broad conclusion from an unrepresentative sample.',
    detectionCriteria: [
      'The sample is small or self-selected',
      'The conclusion sweeps far beyond what the sample supports',
    ],
    evidenceRequirement: null,
  },
  // ── Types the automated detector also fires on ──────────────────────────
  {
    slug: 'appeal-to-popularity',
    label: 'Appeal to Popularity',
    targetFactor: 'relevance',
    severity: 'minor',
    definition: 'Treats how many people hold a belief as evidence that it is true.',
    detectionCriteria: ['"Everyone knows" / "most people agree" carries the argument'],
    evidenceRequirement: null,
  },
  {
    slug: 'false-cause',
    label: 'False Cause',
    targetFactor: 'logical-validity',
    severity: 'major',
    definition: 'Treats correlation as causation without ruling out confounders or reverse causation.',
    detectionCriteria: ['A correlation is presented as proving a causal claim'],
    evidenceRequirement: null,
  },
  {
    slug: 'overgeneralization',
    label: 'Overgeneralization',
    targetFactor: 'logical-validity',
    severity: 'minor',
    definition: 'Asserts a universal ("always", "never") that the evidence cannot support.',
    detectionCriteria: ['Universal quantifier where a single counterexample falsifies the claim'],
    evidenceRequirement: null,
  },
  {
    slug: 'anecdotal-evidence',
    label: 'Anecdotal Evidence',
    targetFactor: 'evidence-quality',
    severity: 'minor',
    definition: 'Offers a personal story as if it were systematic evidence.',
    detectionCriteria: ['An anecdote (T4 source) carries the evidential weight'],
    evidenceRequirement: null,
  },
]

export const FALLACY_CATALOG: ReadonlyMap<string, FallacyCatalogEntry> = new Map(
  ENTRIES.map(e => [e.slug, e]),
)

export function catalogEntry(slug: string): FallacyCatalogEntry | undefined {
  return FALLACY_CATALOG.get(slug)
}

export const FALLACY_TYPE_SLUGS: readonly string[] = ENTRIES.map(e => e.slug)

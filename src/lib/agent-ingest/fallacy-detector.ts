// A fallacy detection is an argument, not a penalty. Detectors draft
// counter-arguments that enter the tree and get scored like anything else —
// no score is ever docked because a detector fired. Each detection targets
// the specific factor the fallacy damages: relevance fallacies draft against
// the linkage, formal fallacies against logical validity, cherry-picking
// against evidence quality.
//
// Deliberately returns NO numeric fields: the invariant "fallacy detection
// changes zero score fields" is enforced by this module's shape.
//
// Every fallacyType here is a slug in the canonical catalog
// (src/lib/fallacy/catalog.ts), which also backs the structured accusation
// template humans file. targetFactor is resolved from the catalog so the
// two paths can never disagree about what a given fallacy damages.

import { catalogEntry, type FallacyTargetFactor } from '@/lib/fallacy/catalog'

export type { FallacyTargetFactor }

export interface FallacyDetection {
  fallacyType: string
  targetFactor: FallacyTargetFactor
  /** The drafted counter-argument statement, entering the tree as a draft. */
  counterStatement: string
  /** The text that tripped the detector, quoted for the review queue. */
  matchedText: string
}

interface DetectorRule {
  fallacyType: string
  pattern: RegExp
  counter: (match: string) => string
}

const RULES: DetectorRule[] = [
  {
    fallacyType: 'ad-hominem',
    pattern: /\b(liar|liars|idiot|idiots|stupid|corrupt|dishonest|evil|fraud|frauds|shill|shills|crook|crooks)\b/i,
    counter: match =>
      `This argument attacks the source's character ("${match}") rather than the claim. ` +
      'Character is not linked to the truth of the parent claim, so this placement has near-zero linkage.',
  },
  {
    fallacyType: 'appeal-to-popularity',
    pattern: /\b(everyone knows|everybody knows|most people (?:agree|believe|think)|nobody (?:believes|thinks|doubts)|it is widely believed)\b/i,
    counter: match =>
      `This argument appeals to popularity ("${match}"). How many people hold a belief is not ` +
      'linked to whether it is true, so the placement fails the linkage check.',
  },
  {
    fallacyType: 'false-cause',
    pattern: /\bcorrelat\w+\b[^.]*\b(caus\w+|proves?|proof)\b|\b(caus\w+|proves?|proof)\b[^.]*\bcorrelat\w+\b/i,
    counter: match =>
      `This argument treats correlation as causation ("${match.trim()}"). The stated relationship ` +
      'does not logically establish the causal claim without ruling out confounders and reverse causation.',
  },
  {
    fallacyType: 'overgeneralization',
    pattern: /\b(always|never|without exception|in every case)\b/i,
    counter: match =>
      `This argument asserts a universal ("${match}"). A single counterexample falsifies a ` +
      'universal claim, so the logical form is weaker than the evidence presented can support.',
  },
  {
    fallacyType: 'cherry-picking',
    pattern: /\b(one study|a single (?:study|case|example)|the only (?:study|evidence)|one survey)\b/i,
    counter: match =>
      `This argument rests on an isolated source ("${match}"). Evidence quality depends on the ` +
      'body of evidence, not a selected instance; the replication record should be weighed.',
  },
  {
    fallacyType: 'anecdotal-evidence',
    pattern: /\b(i know (?:a|someone)|my (?:friend|uncle|aunt|neighbor|cousin)|personal experience)\b/i,
    counter: match =>
      `This argument offers an anecdote ("${match}") as evidence. Anecdotes are T4 sources; ` +
      'the claim needs systematic evidence to carry weight.',
  },
]

/**
 * Scan argument text (statement plus rationale) for fallacy patterns. Each
 * hit yields a drafted counter-argument for the linkage sub-debate — status
 * "draft" until reviewed. The accusation lives or dies by its own
 * sub-arguments; nothing is docked automatically.
 */
export function detectFallacies(text: string): FallacyDetection[] {
  const detections: FallacyDetection[] = []
  for (const rule of RULES) {
    const match = text.match(rule.pattern)
    if (match) {
      const matched = match[0]
      const entry = catalogEntry(rule.fallacyType)
      if (!entry) continue
      detections.push({
        fallacyType: rule.fallacyType,
        targetFactor: entry.targetFactor,
        counterStatement: rule.counter(matched),
        matchedText: matched,
      })
    }
  }
  return detections
}

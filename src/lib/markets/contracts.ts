import type { LmsrState } from './lmsr';

/**
 * Featured prediction-market contracts. Each contract is a binary
 * claim about a belief's future ReasonRank score at a snapshot epoch.
 *
 * `currentScore` is the live belief score (0-1) at the time we wrote
 * this list — used as a reference value next to the threshold so users
 * can see how far the market is betting from "right now."
 *
 * `state` is the initial LMSR inventory. We seed slightly off 50/50
 * for some markets so the prices reflect the consensus we'd expect.
 */
export interface FeaturedContract {
  id: string;
  beliefSlug: string;
  beliefStatement: string;
  category: string;
  threshold: number;
  direction: 'ABOVE' | 'BELOW';
  resolutionEpoch: string;
  currentScore: number;
  state: LmsrState;
  /** Why this market exists / what makes it interesting. */
  blurb: string;
}

const NEXT_EPOCH = '2026-05-31';
const NEXT_QUARTER_EPOCH = '2026-07-31';
const YEAR_END_EPOCH = '2026-12-31';

export const FEATURED_CONTRACTS: FeaturedContract[] = [
  {
    id: 'ubi-above-50-2026-05',
    beliefSlug: 'universal-basic-income-should-be-implemented',
    beliefStatement:
      'Universal Basic Income should be implemented in developed nations',
    category: 'Economics',
    threshold: 0.5,
    direction: 'ABOVE',
    resolutionEpoch: NEXT_EPOCH,
    currentScore: 0.42,
    state: { qYes: 60, qNo: 100, b: 100 },
    blurb:
      'The flagship UBI debate. Will the argument graph cross majority support by month-end?',
  },
  {
    id: 'automation-above-70-2026-07',
    beliefSlug: 'automation-will-displace-workers',
    beliefStatement:
      'Automation and AI will displace a significant portion of the workforce',
    category: 'Technology',
    threshold: 0.7,
    direction: 'ABOVE',
    resolutionEpoch: NEXT_QUARTER_EPOCH,
    currentScore: 0.66,
    state: { qYes: 140, qNo: 80, b: 100 },
    blurb:
      'Already trending up — the market thinks the score will keep climbing through Q3.',
  },
  {
    id: 'inflation-below-40-2026-05',
    beliefSlug: 'ubi-causes-inflation',
    beliefStatement:
      'UBI would cause significant inflation, negating its benefits',
    category: 'Economics',
    threshold: 0.4,
    direction: 'BELOW',
    resolutionEpoch: NEXT_EPOCH,
    currentScore: 0.36,
    state: { qYes: 110, qNo: 70, b: 100 },
    blurb:
      'The classic UBI counterargument. YES wins if the inflation belief stays under 40% next epoch.',
  },
  {
    id: 'work-incentive-above-55-2026-07',
    beliefSlug: 'ubi-reduces-work-incentive',
    beliefStatement:
      'Guaranteed income would significantly reduce the incentive to work',
    category: 'Economics',
    threshold: 0.55,
    direction: 'ABOVE',
    resolutionEpoch: NEXT_QUARTER_EPOCH,
    currentScore: 0.31,
    state: { qYes: 45, qNo: 130, b: 100 },
    blurb:
      'Long-shot YES bet — needs new evidence to land in the next two months.',
  },
  {
    id: 'poverty-above-85-2026-12',
    beliefSlug: 'poverty-reduction-improves-society',
    beliefStatement:
      'Reducing poverty improves societal outcomes across all dimensions',
    category: 'Social Science',
    threshold: 0.85,
    direction: 'ABOVE',
    resolutionEpoch: YEAR_END_EPOCH,
    currentScore: 0.83,
    state: { qYes: 130, qNo: 60, b: 120 },
    blurb:
      'Already near-consensus. Will it nudge over 85% by year end?',
  },
  {
    id: 'free-markets-above-50-2026-07',
    beliefSlug: 'free-markets-allocate-best',
    beliefStatement:
      'Free markets allocate resources more efficiently than government programs',
    category: 'Economics',
    threshold: 0.5,
    direction: 'ABOVE',
    resolutionEpoch: NEXT_QUARTER_EPOCH,
    currentScore: 0.49,
    state: { qYes: 100, qNo: 100, b: 100 },
    blurb:
      'Pure coin-flip. The market starts at 50/50 — pick your side and find evidence.',
  },
  {
    id: 'falc-below-25-2026-12',
    beliefSlug: 'fully-automated-luxury-communism',
    beliefStatement:
      'Society should transition to fully automated luxury communism',
    category: 'Political Economy',
    threshold: 0.25,
    direction: 'BELOW',
    resolutionEpoch: YEAR_END_EPOCH,
    currentScore: 0.18,
    state: { qYes: 150, qNo: 50, b: 100 },
    blurb: 'Entertainment market. The crowd thinks FALC stays niche.',
  },
  {
    id: 'nit-above-40-2026-07',
    beliefSlug: 'negative-income-tax',
    beliefStatement:
      'A negative income tax would be a better approach than UBI',
    category: 'Economics',
    threshold: 0.4,
    direction: 'ABOVE',
    resolutionEpoch: NEXT_QUARTER_EPOCH,
    currentScore: 0.38,
    state: { qYes: 95, qNo: 110, b: 100 },
    blurb:
      'NIT vs UBI — sleeper market. A few good Friedman citations could move it.',
  },
];

export function getContract(id: string): FeaturedContract | undefined {
  return FEATURED_CONTRACTS.find((c) => c.id === id);
}

export function formatThresholdLabel(c: FeaturedContract): string {
  const op = c.direction === 'ABOVE' ? '>' : '<';
  return `score ${op} ${(c.threshold * 100).toFixed(0)}%`;
}

export function formatResolutionLabel(c: FeaturedContract): string {
  const d = new Date(c.resolutionEpoch);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

import type { BeliefUnitInput } from '../lib/battlefield';

/**
 * Static belief ledger used by /battlefield and /arena until a database
 * is wired up. Positivity, stability and the count fields are placeholder
 * ledger numbers in the same shape the scoring engine will eventually
 * produce; swap this file for a loader when real data lands.
 */
export interface BeliefRecord {
  slug: string;
  statement: string;
  topic: string;
  input: BeliefUnitInput;
}

const b = (
  slug: string,
  statement: string,
  topic: string,
  input: BeliefUnitInput,
): BeliefRecord => ({ slug, statement, topic, input });

export const beliefs: BeliefRecord[] = [
  b('reform-immigration-laws', 'America should reform its immigration laws', 'Immigration', {
    positivity: 80, stabilityScore: 0.82, claimStrength: 0.5, specificity: 0.33,
    argumentCount: 14, agreeArgumentCount: 10, disagreeArgumentCount: 4, evidenceCount: 9,
    supportingLawsCount: 2, downstreamCount: 3, upstreamSupportCount: 2, mediaCount: 3, criteriaCount: 4,
  }),
  b('encourage-legal-immigration', 'America should encourage legal immigration', 'Immigration', {
    positivity: 85, stabilityScore: 0.86, claimStrength: 0.5, specificity: 0.33,
    argumentCount: 16, agreeArgumentCount: 12, disagreeArgumentCount: 4, evidenceCount: 11,
    supportingLawsCount: 3, downstreamCount: 4, upstreamSupportCount: 2, mediaCount: 4, criteriaCount: 5,
  }),
  b('streamline-high-skill-recruitment', 'America should streamline high-skill worker recruitment', 'Immigration', {
    positivity: 85, stabilityScore: 0.8, claimStrength: 0.5, specificity: 0.66,
    argumentCount: 12, agreeArgumentCount: 9, disagreeArgumentCount: 3, evidenceCount: 8,
    supportingLawsCount: 2, downstreamCount: 1, upstreamSupportCount: 3, mediaCount: 2, criteriaCount: 3,
  }),
  b('end-illegal-immigration', 'America should end illegal immigration', 'Immigration', {
    positivity: 60, stabilityScore: 0.55, claimStrength: 0.8, specificity: 0.33,
    argumentCount: 18, agreeArgumentCount: 10, disagreeArgumentCount: 8, evidenceCount: 7,
    supportingLawsCount: 4, downstreamCount: 2, upstreamSupportCount: 1, mediaCount: 5, criteriaCount: 2,
  }),
  b('reduce-all-immigration', 'America should sharply reduce all immigration', 'Immigration', {
    positivity: -30, stabilityScore: 0.45, claimStrength: 0.8, specificity: 0.33,
    argumentCount: 11, agreeArgumentCount: 4, disagreeArgumentCount: 7, evidenceCount: 4,
    supportingLawsCount: 1, downstreamCount: 1, upstreamSupportCount: 0, mediaCount: 3, criteriaCount: 1,
  }),

  b('invest-in-energy-research', 'America should invest in energy research', 'Energy', {
    positivity: 85, stabilityScore: 0.9, claimStrength: 0.5, specificity: 0.33,
    argumentCount: 15, agreeArgumentCount: 12, disagreeArgumentCount: 3, evidenceCount: 12,
    supportingLawsCount: 3, downstreamCount: 5, upstreamSupportCount: 2, mediaCount: 4, criteriaCount: 5,
  }),
  b('energy-research-private-sector', 'Energy research should be left entirely to the private sector', 'Energy', {
    positivity: -20, stabilityScore: 0.5, claimStrength: 0.8, specificity: 0.33,
    argumentCount: 9, agreeArgumentCount: 4, disagreeArgumentCount: 5, evidenceCount: 3,
    supportingLawsCount: 0, downstreamCount: 1, upstreamSupportCount: 1, mediaCount: 2, criteriaCount: 1,
  }),

  b('one-billion-citizens', 'America should aim for one billion citizens', 'Population', {
    positivity: 55, stabilityScore: 0.5, claimStrength: 1.0, specificity: 0.66,
    argumentCount: 10, agreeArgumentCount: 6, disagreeArgumentCount: 4, evidenceCount: 5,
    supportingLawsCount: 0, downstreamCount: 2, upstreamSupportCount: 3, mediaCount: 2, criteriaCount: 2,
  }),
  b('stabilize-population', 'America should stabilize its population at current levels', 'Population', {
    positivity: -10, stabilityScore: 0.48, claimStrength: 0.8, specificity: 0.66,
    argumentCount: 8, agreeArgumentCount: 4, disagreeArgumentCount: 4, evidenceCount: 4,
    supportingLawsCount: 0, downstreamCount: 1, upstreamSupportCount: 1, mediaCount: 1, criteriaCount: 2,
  }),

  b('strong-america-good-for-planet', 'A strong America is good for the planet', 'Geopolitics', {
    positivity: 70, stabilityScore: 0.7, claimStrength: 0.5, specificity: 0.0,
    argumentCount: 13, agreeArgumentCount: 9, disagreeArgumentCount: 4, evidenceCount: 6,
    supportingLawsCount: 0, downstreamCount: 6, upstreamSupportCount: 0, mediaCount: 3, criteriaCount: 3,
  }),
  b('american-power-destabilizes', 'American power destabilizes the world', 'Geopolitics', {
    positivity: -35, stabilityScore: 0.4, claimStrength: 0.8, specificity: 0.0,
    argumentCount: 11, agreeArgumentCount: 4, disagreeArgumentCount: 7, evidenceCount: 5,
    supportingLawsCount: 0, downstreamCount: 2, upstreamSupportCount: 0, mediaCount: 4, criteriaCount: 1,
  }),

  b('trump-is-a-genius', 'Trump is a genius', 'Trump', {
    positivity: 10, stabilityScore: 0.3, claimStrength: 1.0, specificity: 0.66,
    argumentCount: 20, agreeArgumentCount: 10, disagreeArgumentCount: 10, evidenceCount: 6,
    supportingLawsCount: 0, downstreamCount: 2, upstreamSupportCount: 0, mediaCount: 8, criteriaCount: 2,
  }),
  b('trump-is-a-moron', 'Trump is a moron', 'Trump', {
    positivity: -10, stabilityScore: 0.3, claimStrength: 1.0, specificity: 0.66,
    argumentCount: 20, agreeArgumentCount: 10, disagreeArgumentCount: 10, evidenceCount: 6,
    supportingLawsCount: 0, downstreamCount: 2, upstreamSupportCount: 0, mediaCount: 8, criteriaCount: 2,
  }),

  b('corruption-undermines-government', 'Corruption undermines government', 'Governance', {
    positivity: 90, stabilityScore: 0.95, claimStrength: 0.5, specificity: 0.0,
    argumentCount: 9, agreeArgumentCount: 9, disagreeArgumentCount: 0, evidenceCount: 7,
    supportingLawsCount: 5, downstreamCount: 8, upstreamSupportCount: 0, mediaCount: 1, criteriaCount: 3,
  }),
];

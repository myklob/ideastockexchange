// Types for the Belief Analysis template
// These map to the Prisma models but are used as plain objects in components

export interface BeliefWithRelations {
  id: number
  slug: string
  statement: string
  category: string | null
  subcategory: string | null
  deweyNumber: string | null
  positivity: number

  arguments: ArgumentWithBelief[]
  evidence: EvidenceItem[]
  objectiveCriteria: ObjectiveCriteriaItem[]
  valuesAnalysis: ValuesAnalysisData | null
  interestsAnalysis: InterestsAnalysisData | null
  assumptions: AssumptionItem[]
  costBenefitAnalysis: CostBenefitData | null
  impactAnalysis: ImpactData | null
  compromises: CompromiseItem[]
  obstacles: ObstacleItem[]
  biases: BiasItem[]
  mediaResources: MediaItem[]
  legalEntries: LegalItem[]
  upstreamMappings: MappingItem[]
  downstreamMappings: MappingItem[]
  similarTo: SimilarBeliefItem[]
  similarFrom: SimilarBeliefItem[]
}

export interface ArgumentWithBelief {
  id: number
  side: string
  linkageScore: number
  impactScore: number
  linkageType: string
  belief: {
    id: number
    slug: string
    statement: string
    positivity: number
  }
}

export interface EvidenceItem {
  id: number
  side: string
  description: string
  sourceUrl: string | null
  evidenceType: string
  sourceIndependenceWeight: number
  replicationQuantity: number
  conclusionRelevance: number
  replicationPercentage: number
  linkageScore: number
  impactScore: number
}

export interface ObjectiveCriteriaItem {
  id: number
  description: string
  independenceScore: number
  linkageScore: number
  criteriaType: string | null
  totalScore: number
}

export interface ValuesAnalysisData {
  supportingAdvertised: string | null
  supportingActual: string | null
  opposingAdvertised: string | null
  opposingActual: string | null
}

export interface InterestsAnalysisData {
  supporterInterests: string | null
  opponentInterests: string | null
  sharedInterests: string | null
  conflictingInterests: string | null
}

export interface AssumptionItem {
  id: number
  side: string
  statement: string
  strength: string
}

export interface CostBenefitData {
  benefits: string | null
  benefitLikelihood: number | null
  costs: string | null
  costLikelihood: number | null
}

export interface ImpactData {
  shortTermEffects: string | null
  shortTermCosts: string | null
  longTermEffects: string | null
  longTermChanges: string | null
}

export interface CompromiseItem {
  id: number
  description: string
}

export interface ObstacleItem {
  id: number
  side: string
  description: string
}

export interface BiasItem {
  id: number
  side: string
  biasType: string
  description: string | null
}

export interface MediaItem {
  id: number
  side: string
  mediaType: string
  title: string
  author: string | null
  url: string | null
}

export interface LegalItem {
  id: number
  side: string
  description: string
  jurisdiction: string | null
}

export interface MappingItem {
  id: number
  direction: string
  side: string
  parentBelief: { id: number; slug: string; statement: string }
  childBelief: { id: number; slug: string; statement: string }
}

export interface SimilarBeliefItem {
  id: number
  variant: string
  fromBelief: { id: number; slug: string; statement: string }
  toBelief: { id: number; slug: string; statement: string }
}

// Computed scores for a belief
export interface BeliefScores {
  totalPro: number
  totalCon: number
  totalSupportingEvidence: number
  totalWeakeningEvidence: number
  overallScore: number
}

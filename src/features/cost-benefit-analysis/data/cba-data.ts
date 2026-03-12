import { CostBenefitAnalysis, CBALineItem, LikelihoodBelief, LikelihoodEstimate } from '@/core/types/cba'
import { SchilchtArgument, ProtocolLogEntry } from '@/core/types/schlicht'
import { recalculateCBA } from '@/core/scoring/cba-scoring'

// In-memory store for CBA analyses
const cbaStore: Map<string, CostBenefitAnalysis> = new Map()

function makeArg(
  id: string,
  claim: string,
  description: string,
  side: 'pro' | 'con',
  truthScore: number,
  linkageScore: number,
  contributor: { type: 'human' | 'ai'; name: string },
  importanceScore: number = 1.0,
  subArguments?: SchilchtArgument[]
): SchilchtArgument {
  const direction = side === 'pro' ? 1 : -1
  return {
    id,
    claim,
    description,
    side,
    truthScore,
    linkageScore,
    importanceScore,
    impactScore: Math.round(truthScore * linkageScore * importanceScore * 100) * direction,
    certifiedBy: ['Logic-Core-v4', 'Evidence-Bot-9'],
    fallaciesDetected: [],
    subArguments,
    contributor: {
      type: contributor.type,
      name: contributor.name,
      submittedAt: '2025-01-15T10:00:00Z',
    },
  }
}

function makeEstimate(
  id: string,
  probability: number,
  label: string,
  reasoning: string,
  proArgs: SchilchtArgument[],
  conArgs: SchilchtArgument[],
  contributor: { type: 'human' | 'ai'; name: string }
): LikelihoodEstimate {
  return {
    id,
    probability,
    label,
    reasoning,
    proArguments: proArgs,
    conArguments: conArgs,
    reasonRankScore: 0.5, // Will be recalculated
    isActive: false,       // Will be recalculated
    contributor: {
      type: contributor.type,
      name: contributor.name,
      submittedAt: '2025-01-15T10:00:00Z',
    },
  }
}

function makeLikelihood(
  id: string,
  statement: string,
  estimates: LikelihoodEstimate[],
  cycles: number
): LikelihoodBelief {
  return {
    id,
    statement,
    estimates,
    activeLikelihood: 0.5, // Will be recalculated
    status: 'emerging',     // Will be recalculated
    adversarialCycles: cycles,
    confidenceInterval: 0.15,
    protocolLog: [],
  }
}

// ─── Bridge CBA ───────────────────────────────────────────────

const bridgeCBA: CostBenefitAnalysis = {
  id: 'cba-bridge-2025',
  title: 'New Highway Bridge Construction (Route 47)',
  description:
    'Proposed construction of a 4-lane highway bridge to replace the aging Route 47 crossing. ' +
    'This analysis evaluates whether the projected benefits justify the $18.7M estimated construction cost, ' +
    'accounting for traffic improvements, economic development, and environmental impacts.',
  status: 'active',
  items: [
    // ── Benefit 1: Commute Time Savings ──
    {
      id: 'item-b1-commute',
      type: 'benefit',
      title: 'Reduced commute times for 50,000 daily commuters',
      description:
        'New bridge eliminates the 15-minute average detour through downtown. ' +
        'At $25/hour average value of time, this produces substantial annual savings.',
      category: 'Economic',
      predictedImpact: 4_500_000,
      likelihoodBelief: makeLikelihood(
        'lb-b1-commute',
        'What is the probability that the projected commute savings of $4.5M/year will materialize?',
        [
          makeEstimate(
            'est-b1-high',
            0.75,
            '75%',
            'Traffic modeling shows consistent results across 3 independent analyses. The 15-minute detour is well-documented.',
            [
              makeArg(
                'arg-b1h-1',
                'Three independent traffic models converge on 12-18 minute savings',
                'The state DOT, a university research team, and the consulting firm all produced models showing 12-18 minute average time savings. Model convergence from independent sources is strong evidence.',
                'pro', 0.88, 0.92,
                { type: 'ai', name: 'Traffic-Analysis-Bot' }
              ),
              makeArg(
                'arg-b1h-2',
                'Reference class of 47 similar bridge projects shows 70% achieve projected savings',
                'Analysis of 47 bridge replacement projects in the US (2010-2024) shows that 70% achieved at least 80% of projected commute time savings within 2 years of completion.',
                'pro', 0.85, 0.80,
                { type: 'human', name: 'Dr. Sarah Chen, Transportation Research' },
                0.9, // high importance: reference class forecasting is a key methodology
                [
                  // Sub-arguments about whether reference class forecasting applies here
                  makeArg(
                    'arg-b1h-2-sub1',
                    'Reference class forecasting is the gold standard for infrastructure predictions',
                    'As described in superforecasting literature (Tetlock, 2015), reference class forecasting outperforms expert intuition by anchoring to base rates from comparable projects.',
                    'pro', 0.90, 0.85,
                    { type: 'ai', name: 'Base-Rate-Core-v3' }
                  ),
                  makeArg(
                    'arg-b1h-2-sub2',
                    'The 47-project sample has strong geographic and scope match',
                    'All 47 projects are US highway bridges built 2010-2024 with 2-6 lanes, providing a tight reference class rather than a broad, heterogeneous comparison.',
                    'pro', 0.82, 0.88,
                    { type: 'human', name: 'Dr. Sarah Chen, Transportation Research' }
                  ),
                  makeArg(
                    'arg-b1h-2-sub3',
                    'Pre-2020 reference class may not account for post-COVID commuter behavior shifts',
                    '34 of the 47 projects were completed before 2020. Post-pandemic commuter patterns differ substantially, reducing the reference class applicability to this specific prediction.',
                    'con', 0.75, 0.72,
                    { type: 'ai', name: 'Red-Team-Delta' }
                  ),
                ]
              ),
            ],
            [
              makeArg(
                'arg-b1h-c1',
                'Induced demand may erode savings within 5 years',
                'New road capacity historically generates induced demand. The Braess paradox literature suggests time savings erode 20-50% within 5 years as new traffic fills capacity.',
                'con', 0.72, 0.65,
                { type: 'human', name: 'Prof. James Liu, Urban Planning' }
              ),
            ],
            { type: 'ai', name: 'Traffic-Analysis-Bot' }
          ),
          makeEstimate(
            'est-b1-low',
            0.45,
            '40-50%',
            'Induced demand and remote work trends will significantly reduce realized savings.',
            [
              makeArg(
                'arg-b1l-1',
                'Post-COVID remote work reduces commuter traffic by 25-30%',
                'Census data shows 27% of the workforce in this corridor now works from home at least 3 days/week. Commuter counts are already 25% below 2019 levels.',
                'pro', 0.80, 0.70,
                { type: 'human', name: 'DataAnalyst42' }
              ),
            ],
            [
              makeArg(
                'arg-b1l-c1',
                'Remote work has plateaued; commuter counts are rising again',
                'Q4 2024 data shows commuter counts have rebounded to 88% of pre-COVID levels and are trending upward. The remote work effect is being overstated.',
                'con', 0.68, 0.72,
                { type: 'ai', name: 'Trend-Analysis-v2' }
              ),
            ],
            { type: 'human', name: 'SkepticalPlanner' }
          ),
        ],
        312
      ),
      expectedValue: 0, // Will be recalculated
      contributor: {
        type: 'human',
        name: 'City Planning Department',
        submittedAt: '2025-01-10T08:00:00Z',
      },
    },

    // ── Benefit 2: Economic Development ──
    {
      id: 'item-b2-econ',
      type: 'benefit',
      title: 'New commercial development in the bridge corridor',
      description:
        'Improved access is projected to attract $30M in new commercial development ' +
        'over 10 years, generating $2.1M in annual tax revenue.',
      category: 'Economic',
      predictedImpact: 2_100_000,
      likelihoodBelief: makeLikelihood(
        'lb-b2-econ',
        'What is the probability that $2.1M/year in new tax revenue will be generated?',
        [
          makeEstimate(
            'est-b2-optimistic',
            0.6,
            '60%',
            'Regional growth trends and developer interest letters support moderate confidence.',
            [
              makeArg(
                'arg-b2o-1',
                'Three developers have submitted letters of intent contingent on bridge completion',
                'Signed letters of intent from Meridian Properties, Lakeview Commercial, and CrossBridge LLC represent $22M in planned investment, contingent on bridge construction.',
                'pro', 0.82, 0.85,
                { type: 'human', name: 'Economic Development Office' }
              ),
            ],
            [
              makeArg(
                'arg-b2o-c1',
                'Letters of intent are non-binding and often fail to materialize',
                'A study of LOIs for infrastructure-contingent development found only 45% actually proceeded to construction. Market conditions and financing often change during the 3-5 year bridge construction timeline.',
                'con', 0.75, 0.78,
                { type: 'ai', name: 'Red-Team-Delta' }
              ),
            ],
            { type: 'human', name: 'EconDev_Analyst' }
          ),
          makeEstimate(
            'est-b2-pessimistic',
            0.25,
            '20-30%',
            'Tax revenue projections for infrastructure projects are historically overstated by 40-60%.',
            [
              makeArg(
                'arg-b2p-1',
                'Flyvbjerg meta-analysis: infrastructure economic projections overstated by average 40%',
                'Bent Flyvbjerg\'s analysis of 258 infrastructure projects found that economic benefit projections are systematically overstated by 40-60%. This is consistent "strategic misrepresentation" bias.',
                'pro', 0.90, 0.82,
                { type: 'ai', name: 'Base-Rate-Core-v3' }
              ),
            ],
            [],
            { type: 'ai', name: 'Base-Rate-Core-v3' }
          ),
        ],
        198
      ),
      expectedValue: 0,
      contributor: {
        type: 'human',
        name: 'Economic Development Office',
        submittedAt: '2025-01-11T09:30:00Z',
      },
    },

    // ── Benefit 3: Safety Improvement ──
    {
      id: 'item-b3-safety',
      type: 'benefit',
      title: 'Reduction in traffic accidents at Route 47 intersection',
      description:
        'The current route forces traffic through a dangerous at-grade intersection. ' +
        'Projected reduction of 12 serious accidents per year, valued at $180K each using DOT VSL methodology.',
      category: 'Social',
      predictedImpact: 2_160_000,
      likelihoodBelief: makeLikelihood(
        'lb-b3-safety',
        'What is the probability that accident reduction worth $2.16M/year will be achieved?',
        [
          makeEstimate(
            'est-b3-high',
            0.85,
            '85%',
            'Accident data is well-documented and the causal mechanism (eliminating the intersection) is clear.',
            [
              makeArg(
                'arg-b3h-1',
                '10-year accident data shows consistent 14-16 serious accidents/year at this intersection',
                'State police records from 2014-2024 show a stable rate of 14-16 serious injury accidents annually at the Route 47/Main St intersection. The bridge eliminates this intersection entirely.',
                'pro', 0.92, 0.95,
                { type: 'human', name: 'State Highway Safety Division' }
              ),
              makeArg(
                'arg-b3h-2',
                'Similar intersection elimination projects achieve 80-95% accident reduction',
                'FHWA data on 31 grade-separated interchange projects shows 80-95% reduction in serious injury accidents at the target intersection.',
                'pro', 0.88, 0.90,
                { type: 'ai', name: 'Evidence-Bot-9' }
              ),
            ],
            [
              makeArg(
                'arg-b3h-c1',
                'New bridge may create new accident patterns at approach ramps',
                'While eliminating the intersection reduces those accidents, bridge approach ramps create new conflict points. Typically 15-25% of eliminated accidents are replaced by new accident types.',
                'con', 0.65, 0.60,
                { type: 'human', name: 'SafetyEngineer_R' }
              ),
            ],
            { type: 'human', name: 'State Highway Safety Division' }
          ),
        ],
        445
      ),
      expectedValue: 0,
      contributor: {
        type: 'human',
        name: 'State Highway Safety Division',
        submittedAt: '2025-01-12T14:00:00Z',
      },
    },

    // ── Cost 1: Construction Cost ──
    {
      id: 'item-c1-construction',
      type: 'cost',
      title: 'Bridge construction and engineering costs',
      description:
        'Full construction cost including design, engineering, materials, labor, and project management. ' +
        'Initial estimate: $18.7M based on preliminary engineering study.',
      category: 'Economic',
      predictedImpact: -18_700_000,
      likelihoodBelief: makeLikelihood(
        'lb-c1-construction',
        'What is the probability that construction costs will stay at or below $18.7M?',
        [
          makeEstimate(
            'est-c1-onbudget',
            0.3,
            '30%',
            'Historical base rates for bridge projects show only 30% come in at or under budget.',
            [
              makeArg(
                'arg-c1ob-1',
                'Reference class: only 30% of bridge projects complete within original budget',
                'Analysis of 200+ bridge construction projects (ASCE database, 2005-2023) shows that only 30% completed within the original budget estimate. Median cost overrun was 34%.',
                'pro', 0.91, 0.88,
                { type: 'ai', name: 'Base-Rate-Core-v3' },
                0.95, // very high importance: base rate is the strongest predictor
                [
                  makeArg(
                    'arg-c1ob-1-sub1',
                    'Base rates from large databases are the most reliable predictor of project outcomes',
                    'Flyvbjerg meta-analysis across 258 infrastructure projects confirms that base rates outperform expert judgment for cost prediction. This is the core insight of reference class forecasting.',
                    'pro', 0.92, 0.90,
                    { type: 'ai', name: 'Evidence-Bot-9' }
                  ),
                  makeArg(
                    'arg-c1ob-1-sub2',
                    'ASCE database uses standardized reporting, minimizing data quality issues',
                    'The ASCE infrastructure database requires projects to report using standardized cost categories, reducing apples-to-oranges comparisons that plague ad hoc reference classes.',
                    'pro', 0.80, 0.78,
                    { type: 'human', name: 'InfrastructureAnalyst_7' }
                  ),
                  makeArg(
                    'arg-c1ob-1-sub3',
                    'Database includes projects from different regulatory regimes, reducing comparability',
                    'The 200+ projects span 18 years and multiple states with varying regulatory requirements. Construction cost drivers differ significantly by jurisdiction.',
                    'con', 0.72, 0.68,
                    { type: 'human', name: 'ProjectManager_DB' }
                  ),
                ]
              ),
              makeArg(
                'arg-c1ob-2',
                'Current inflation in construction materials exceeds 5%',
                'Steel prices up 12% YoY, concrete up 8%. With a 3-year construction timeline, material cost escalation alone adds $1.5-2M to the estimate.',
                'pro', 0.85, 0.82,
                { type: 'human', name: 'ConstructionCostAnalyst' },
                0.8 // high importance: inflation directly affects the prediction
              ),
            ],
            [
              makeArg(
                'arg-c1ob-c1',
                'This project uses design-build delivery which reduces cost overruns',
                'Design-build projects show 15% fewer cost overruns than traditional design-bid-build. The reference class should be filtered to design-build only, which shows 45% on-budget rate.',
                'con', 0.75, 0.70,
                { type: 'human', name: 'ProjectManager_DB' }
              ),
            ],
            { type: 'ai', name: 'Base-Rate-Core-v3' }
          ),
          makeEstimate(
            'est-c1-overrun',
            0.7,
            '70%',
            'Most likely the project will cost $22-25M, meaning the $18.7M figure has only ~30% chance of holding.',
            [
              makeArg(
                'arg-c1or-1',
                'Flyvbjerg: cost overruns in bridge projects average 34%',
                'Professor Bent Flyvbjerg\'s meta-analysis of infrastructure megaprojects shows bridge construction averages 34% cost overrun. Applied to $18.7M, expected cost is $25M.',
                'pro', 0.90, 0.85,
                { type: 'ai', name: 'Base-Rate-Core-v3' }
              ),
            ],
            [
              makeArg(
                'arg-c1or-c1',
                'This is not a megaproject; small bridge projects have lower overrun rates',
                '$18.7M classifies as a minor project, not a megaproject. Flyvbjerg\'s most extreme overruns cluster in $100M+ projects. Projects under $25M show median overruns of 18%.',
                'con', 0.72, 0.75,
                { type: 'human', name: 'InfrastructureAnalyst_7' }
              ),
            ],
            { type: 'human', name: 'TaxpayerWatchdog' }
          ),
        ],
        847
      ),
      expectedValue: 0,
      contributor: {
        type: 'human',
        name: 'City Engineering Department',
        submittedAt: '2025-01-10T08:30:00Z',
      },
    },

    // ── Cost 2: Environmental Impact ──
    {
      id: 'item-c2-environment',
      type: 'cost',
      title: 'Environmental remediation and habitat disruption',
      description:
        'Construction will impact 3 acres of wetland habitat. Required mitigation includes ' +
        'wetland banking credits and a 5-year monitoring program.',
      category: 'Environmental',
      predictedImpact: -1_200_000,
      likelihoodBelief: makeLikelihood(
        'lb-c2-env',
        'What is the probability that environmental costs will reach $1.2M?',
        [
          makeEstimate(
            'est-c2-likely',
            0.8,
            '80%',
            'Environmental costs are well-characterized by the Phase 1 study and regulatory requirements are known.',
            [
              makeArg(
                'arg-c2l-1',
                'Phase 1 environmental study completed with detailed cost breakdown',
                'The completed Phase 1 Environmental Site Assessment identifies specific wetland impacts and mitigation requirements. Cost estimates are based on actual wetland banking credit prices and contractor bids.',
                'pro', 0.85, 0.90,
                { type: 'human', name: 'Environmental Compliance Officer' }
              ),
            ],
            [
              makeArg(
                'arg-c2l-c1',
                'Endangered species surveys not yet completed; could increase costs significantly',
                'The Phase 2 biological survey is pending. If protected species are found, mitigation costs could double. This has occurred in 20% of similar wetland projects.',
                'con', 0.70, 0.65,
                { type: 'ai', name: 'Red-Team-Sigma' }
              ),
            ],
            { type: 'human', name: 'Environmental Compliance Officer' }
          ),
        ],
        156
      ),
      expectedValue: 0,
      contributor: {
        type: 'human',
        name: 'Environmental Review Board',
        submittedAt: '2025-01-13T11:00:00Z',
      },
    },

    // ── Cost 3: Disruption During Construction ──
    {
      id: 'item-c3-disruption',
      type: 'cost',
      title: 'Economic disruption during 3-year construction period',
      description:
        'Local businesses estimate 15-25% revenue loss during construction due to ' +
        'traffic detours, noise, and reduced foot traffic.',
      category: 'Economic',
      predictedImpact: -3_000_000,
      likelihoodBelief: makeLikelihood(
        'lb-c3-disruption',
        'What is the probability that construction disruption costs will reach $3M?',
        [
          makeEstimate(
            'est-c3-moderate',
            0.55,
            '50-60%',
            'Business impact surveys and comparable project data support moderate confidence.',
            [
              makeArg(
                'arg-c3m-1',
                'Survey of 120 corridor businesses: 68% report expected revenue decline',
                'Chamber of Commerce survey found 68% of businesses within 0.5 miles expect 15-30% revenue decline. Extrapolated annual impact: $800K-$1.2M over 3 years.',
                'pro', 0.75, 0.78,
                { type: 'human', name: 'Chamber of Commerce' }
              ),
            ],
            [
              makeArg(
                'arg-c3m-c1',
                'Business surveys systematically overestimate disruption impact',
                'Post-construction follow-up studies show actual revenue impacts are typically 40-60% of pre-construction survey estimates. Businesses adapt routing and marketing.',
                'con', 0.70, 0.72,
                { type: 'ai', name: 'Calibration-AI-v5' }
              ),
            ],
            { type: 'human', name: 'LocalBusinessOwner' }
          ),
        ],
        89
      ),
      expectedValue: 0,
      contributor: {
        type: 'human',
        name: 'Chamber of Commerce',
        submittedAt: '2025-01-14T16:00:00Z',
      },
    },
  ],
  totalExpectedBenefits: 0,
  totalExpectedCosts: 0,
  netExpectedValue: 0,
  createdAt: '2025-01-10T08:00:00Z',
  updatedAt: '2025-01-15T12:00:00Z',
  protocolLog: [
    {
      id: 'log-cba-1',
      timestamp: '2025-01-10T08:00:00Z',
      agentName: 'System',

      content: 'CBA initiated for Route 47 Bridge Construction. 6 line items submitted.',
    },
    {
      id: 'log-cba-2',
      timestamp: '2025-01-12T14:30:00Z',
      agentName: 'Base-Rate-Core-v3',

      content: 'Applied reference class forecasting to construction cost estimate. Base rate: 70% probability of cost overrun.',
    },
    {
      id: 'log-cba-3',
      timestamp: '2025-01-13T09:15:00Z',
      agentName: 'Red-Team-Delta',

      content: 'Challenged economic development projections. LOI non-binding status reduces confidence.',
    },
    {
      id: 'log-cba-4',
      timestamp: '2025-01-14T11:00:00Z',
      agentName: 'Evidence-Bot-9',

      content: 'Verified FHWA safety data (T1 source). 31-project reference class confirmed.',
    },
    {
      id: 'log-cba-5',
      timestamp: '2025-01-15T10:00:00Z',
      agentName: 'Calibration-AI-v5',

      content: 'Recalculated all likelihood scores. Net expected value updated. Safety benefit likelihood calibrated at 85%.',
    },
  ],
}

// ─── Education Policy CBA ────────────────────────────────────

const educationCBA: CostBenefitAnalysis = {
  id: 'cba-education-2025',
  title: 'Universal Pre-K Program Expansion (State-Level)',
  description:
    'Proposed expansion of state-funded pre-kindergarten to all 4-year-olds. ' +
    'Currently serves 40% of eligible children. Expansion would add 35,000 slots at $8,500 per child annually.',
  status: 'active',
  items: [
    {
      id: 'item-ed-b1',
      type: 'benefit',
      title: 'Increased lifetime earnings for program participants',
      description:
        'Perry Preschool and other longitudinal studies show pre-K participants earn 10-15% more over their lifetime. ' +
        'Applied to 35,000 new participants with discounted future earnings.',
      category: 'Economic',
      predictedImpact: 12_000_000,
      likelihoodBelief: makeLikelihood(
        'lb-ed-b1',
        'What is the probability that lifetime earnings increases of this magnitude will materialize?',
        [
          makeEstimate(
            'est-ed-b1-high',
            0.55,
            '50-60%',
            'Strong longitudinal evidence exists but scaling effects and program quality variation introduce uncertainty.',
            [
              makeArg(
                'arg-ed-b1h-1',
                'Perry Preschool Study: 40-year follow-up shows sustained earnings advantage',
                'The Perry Preschool longitudinal study tracked participants for 40 years. Treatment group earned 36% more at age 40 than controls. This is T1 peer-reviewed evidence.',
                'pro', 0.92, 0.65,
                { type: 'ai', name: 'Evidence-Bot-9' }
              ),
              makeArg(
                'arg-ed-b1h-2',
                'Meta-analysis of 22 pre-K programs shows consistent positive effects',
                'A 2023 meta-analysis in Journal of Policy Analysis found statistically significant earnings effects in 18 of 22 high-quality pre-K programs studied.',
                'pro', 0.88, 0.72,
                { type: 'human', name: 'Dr. Maria Torres, Education Policy' }
              ),
            ],
            [
              makeArg(
                'arg-ed-b1h-c1',
                'Perry Preschool was a small, intensive program — not scalable to universal delivery',
                'Perry served 58 children with highly trained staff at $23K/child (2024 dollars). Universal pre-K at $8,500/child cannot replicate this intensity. Tennessee pre-K study showed fade-out by 3rd grade.',
                'con', 0.82, 0.80,
                { type: 'human', name: 'Prof. Dale Rollins, Education Economics' }
              ),
            ],
            { type: 'ai', name: 'Evidence-Bot-9' }
          ),
          makeEstimate(
            'est-ed-b1-low',
            0.2,
            '15-25%',
            'Fade-out effects and program quality at scale make large earnings gains unlikely.',
            [
              makeArg(
                'arg-ed-b1l-1',
                'Tennessee Voluntary Pre-K Study: gains fade to zero by 6th grade',
                'The rigorous Tennessee study (n=2,990) found pre-K gains faded completely by 3rd grade and participants actually performed worse by 6th grade on some measures.',
                'pro', 0.88, 0.75,
                { type: 'ai', name: 'Red-Team-Delta' }
              ),
            ],
            [
              makeArg(
                'arg-ed-b1l-c1',
                'Tennessee study had known quality problems not present in this proposal',
                'The Tennessee program had documented quality issues: high teacher turnover, inadequate training, overcrowded classrooms. The proposed program includes quality standards addressing these specific failures.',
                'con', 0.72, 0.68,
                { type: 'human', name: 'StateEducationBoard_Rep' }
              ),
            ],
            { type: 'ai', name: 'Red-Team-Delta' }
          ),
        ],
        523
      ),
      expectedValue: 0,
      contributor: {
        type: 'human',
        name: 'State Education Policy Board',
        submittedAt: '2025-01-08T10:00:00Z',
      },
    },
    {
      id: 'item-ed-b2',
      type: 'benefit',
      title: 'Reduced special education referrals',
      description:
        'Early intervention reduces special education placement rates by 25-40%, saving $12,000/year per diverted student.',
      category: 'Economic',
      predictedImpact: 5_600_000,
      likelihoodBelief: makeLikelihood(
        'lb-ed-b2',
        'What is the probability that special education cost savings of $5.6M/year will be achieved?',
        [
          makeEstimate(
            'est-ed-b2-high',
            0.7,
            '70%',
            'Special education diversion is one of the most robust findings in pre-K research.',
            [
              makeArg(
                'arg-ed-b2h-1',
                'Chicago Child-Parent Centers: 41% reduction in special education placement',
                'The CPC longitudinal study showed a 41% reduction in special education placement among pre-K participants, with effects persisting through high school.',
                'pro', 0.88, 0.85,
                { type: 'ai', name: 'Evidence-Bot-9' }
              ),
            ],
            [],
            { type: 'human', name: 'SpecialEdResearcher' }
          ),
        ],
        267
      ),
      expectedValue: 0,
      contributor: {
        type: 'human',
        name: 'Special Education Division',
        submittedAt: '2025-01-09T11:00:00Z',
      },
    },
    {
      id: 'item-ed-c1',
      type: 'cost',
      title: 'Annual program operating costs',
      description:
        '35,000 slots at $8,500 per child. Includes teacher salaries, facilities, materials, administration, and transportation.',
      category: 'Economic',
      predictedImpact: -297_500_000,
      likelihoodBelief: makeLikelihood(
        'lb-ed-c1',
        'What is the probability that operating costs will be approximately $297.5M/year?',
        [
          makeEstimate(
            'est-ed-c1-likely',
            0.65,
            '65%',
            'Per-child costs are well-established from existing program. Scaling costs are the main uncertainty.',
            [
              makeArg(
                'arg-ed-c1l-1',
                'Existing program runs at $8,200/child; $8,500 includes 3.7% contingency',
                'The current 40% program operates at $8,200 per child. The $8,500 estimate includes 3.7% contingency for scaling inefficiencies, based on comparable state expansions.',
                'pro', 0.82, 0.88,
                { type: 'human', name: 'State Budget Office' }
              ),
            ],
            [
              makeArg(
                'arg-ed-c1l-c1',
                'Teacher shortage will drive salary costs up 15-20% to attract qualified staff',
                'Expanding from 40% to 100% coverage requires 4,200 new pre-K teachers. Current shortage means salary premiums of 15-20% to attract and retain qualified educators.',
                'con', 0.78, 0.80,
                { type: 'ai', name: 'Red-Team-Sigma' }
              ),
            ],
            { type: 'human', name: 'State Budget Office' }
          ),
        ],
        189
      ),
      expectedValue: 0,
      contributor: {
        type: 'human',
        name: 'State Budget Office',
        submittedAt: '2025-01-08T09:00:00Z',
      },
    },
    {
      id: 'item-ed-c2',
      type: 'cost',
      title: 'Facility construction and renovation',
      description:
        'New classrooms required for 60% of new slots. Estimated 400 new classrooms at $150K each.',
      category: 'Economic',
      predictedImpact: -60_000_000,
      likelihoodBelief: makeLikelihood(
        'lb-ed-c2',
        'What is the probability that facility costs will reach $60M?',
        [
          makeEstimate(
            'est-ed-c2-moderate',
            0.5,
            '50%',
            'Facility costs are highly variable. Some existing spaces can be repurposed.',
            [
              makeArg(
                'arg-ed-c2m-1',
                'Partnership with churches and community centers could reduce need by 30%',
                'Preliminary outreach to 200 churches and community organizations found 35% willing to lease space for pre-K classrooms, potentially reducing new construction by 100+ classrooms.',
                'pro', 0.68, 0.72,
                { type: 'human', name: 'Community Partnerships Director' }
              ),
            ],
            [
              makeArg(
                'arg-ed-c2m-c1',
                'Community spaces often fail to meet licensing requirements',
                'State licensing requires specific square footage, bathroom ratios, and safety features that most community spaces lack. Retrofit costs average $80K per classroom, eroding savings.',
                'con', 0.75, 0.70,
                { type: 'ai', name: 'Calibration-AI-v5' }
              ),
            ],
            { type: 'human', name: 'FacilitiesPlanner' }
          ),
        ],
        134
      ),
      expectedValue: 0,
      contributor: {
        type: 'human',
        name: 'State Facilities Division',
        submittedAt: '2025-01-10T13:00:00Z',
      },
    },
  ],
  totalExpectedBenefits: 0,
  totalExpectedCosts: 0,
  netExpectedValue: 0,
  createdAt: '2025-01-08T08:00:00Z',
  updatedAt: '2025-01-15T14:00:00Z',
  protocolLog: [
    {
      id: 'log-ed-1',
      timestamp: '2025-01-08T08:00:00Z',
      agentName: 'System',

      content: 'CBA initiated for Universal Pre-K Expansion. 4 line items submitted.',
    },
    {
      id: 'log-ed-2',
      timestamp: '2025-01-10T15:00:00Z',
      agentName: 'Red-Team-Delta',

      content: 'Challenged earnings benefit claim using Tennessee fade-out study. Estimate contested.',
    },
    {
      id: 'log-ed-3',
      timestamp: '2025-01-12T09:00:00Z',
      agentName: 'Evidence-Bot-9',

      content: 'Verified Perry Preschool and CPC longitudinal data. T1 evidence confirmed for both.',
    },
  ],
}

// Initialize store with sample data (recalculated)
function initializeStore() {
  cbaStore.set(bridgeCBA.id, recalculateCBA(bridgeCBA))
  cbaStore.set(educationCBA.id, recalculateCBA(educationCBA))
}

initializeStore()

// ─── Public API ──────────────────────────────────────────────

export function getAllCBAs(): CostBenefitAnalysis[] {
  return Array.from(cbaStore.values())
}

export function getCBA(id: string): CostBenefitAnalysis | undefined {
  return cbaStore.get(id)
}

export function getLineItem(cbaId: string, itemId: string): CBALineItem | undefined {
  const cba = cbaStore.get(cbaId)
  if (!cba) return undefined
  return cba.items.find((i) => i.id === itemId)
}

export function addLineItem(
  cbaId: string,
  item: CBALineItem
): { success: boolean; cba?: CostBenefitAnalysis } {
  const cba = cbaStore.get(cbaId)
  if (!cba) return { success: false }

  cba.items.push(item)
  const updated = recalculateCBA(cba)
  cbaStore.set(cbaId, updated)
  return { success: true, cba: updated }
}

export function addLikelihoodEstimate(
  cbaId: string,
  itemId: string,
  estimate: LikelihoodEstimate
): { success: boolean; cba?: CostBenefitAnalysis } {
  const cba = cbaStore.get(cbaId)
  if (!cba) return { success: false }

  const item = cba.items.find((i) => i.id === itemId)
  if (!item) return { success: false }

  item.likelihoodBelief.estimates.push(estimate)
  const updated = recalculateCBA(cba)
  cbaStore.set(cbaId, updated)
  return { success: true, cba: updated }
}

export function addLikelihoodArgument(
  cbaId: string,
  itemId: string,
  estimateId: string,
  argument: SchilchtArgument
): { success: boolean; cba?: CostBenefitAnalysis } {
  const cba = cbaStore.get(cbaId)
  if (!cba) return { success: false }

  const item = cba.items.find((i) => i.id === itemId)
  if (!item) return { success: false }

  const estimate = item.likelihoodBelief.estimates.find((e) => e.id === estimateId)
  if (!estimate) return { success: false }

  if (argument.side === 'pro') {
    estimate.proArguments.push(argument)
  } else {
    estimate.conArguments.push(argument)
  }

  item.likelihoodBelief.adversarialCycles++

  const updated = recalculateCBA(cba)
  cbaStore.set(cbaId, updated)
  return { success: true, cba: updated }
}

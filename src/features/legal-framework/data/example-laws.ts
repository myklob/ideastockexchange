/**
 * Example laws demonstrating the wikiLaw diagnostic framework
 * These showcase the different types of analysis and the voice we're aiming for
 */

import { Law, LawProposal } from '@/core/types/wikilaw';

/**
 * Example 1: Mandatory Minimum Sentencing
 * A law with questionable assumptions about human behavior
 */
export const mandatoryMinimumSentencing: Law = {
  id: 'ca-mandatory-minimum-drugs',
  jurisdiction: 'California',
  category: 'criminal_justice',
  officialTitle: 'Mandatory Minimum Sentencing for Drug Offenses',
  citationCode: 'CA Health & Safety Code § 11370.4',
  enactedDate: new Date('1986-01-01'),
  lastAmended: new Date('1997-06-01'),
  status: 'active',

  plainEnglishSummary: 'Judges must impose a minimum prison sentence of 3-5 years for certain drug offenses, regardless of circumstances.',

  realWorldImpact: 'First-time offenders with no violent history serve the same sentence as repeat offenders. Judges cannot consider rehabilitation potential, family circumstances, or employment history. Prosecutors gain leverage in plea bargaining because defendants face catastrophic downside risk at trial.',

  statedPurpose: 'Deter drug crime through severe, certain punishment.',

  operativePurpose: 'Transfer sentencing discretion from judges to prosecutors. Create pressure for plea deals. Signal "tough on crime" stance without requiring new enforcement resources.',

  purposeGap: 'The law claims to target serious traffickers but applies equally to low-level possession with intent to sell. The mandatory nature removes judicial ability to distinguish between a college student selling to friends and a cartel distributor.',

  operatingAssumptions: [
    {
      id: 'assumption-severity-deters',
      statement: 'Severity of punishment deters crime more effectively than certainty of apprehension',
      domain: 'criminology',
      testability: 'easily_testable',
      evidence: [
        {
          id: 'ev-deterrence-study-1',
          type: 'empirical',
          claim: 'Certainty of punishment deters crime; severity shows weak or no effect',
          source: 'Durlauf & Nagin, "Imprisonment and Crime: Can Both Be Reduced?" (2011)',
          quality: {
            overall: 85,
            rigor: 90,
            replicability: 85,
            transparency: 80,
            timestamp: new Date('2024-01-15')
          },
          context: 'Meta-analysis of deterrence research across multiple jurisdictions',
          limitations: ['Cannot fully isolate severity from certainty in real-world data', 'Most studies focus on marginal changes, not extreme sentences'],
          supports: 'con',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15')
        }
      ],
      controversyLevel: 30, // Low controversy among criminologists; high among politicians
      linkedLaws: ['ca-mandatory-minimum-drugs', 'ca-three-strikes'],
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: 'assumption-rational-actors',
      statement: 'Drug users and low-level dealers make rational cost-benefit calculations about legal consequences before offending',
      domain: 'behavioral_economics',
      testability: 'testable',
      evidence: [
        {
          id: 'ev-addiction-rationality',
          type: 'empirical',
          claim: 'Addiction impairs long-term cost-benefit calculation; present bias dominates',
          source: 'Bickel et al., "Addiction and Discounting" Annual Review of Clinical Psychology (2007)',
          quality: {
            overall: 80,
            rigor: 85,
            replicability: 75,
            transparency: 80,
            timestamp: new Date('2024-01-12')
          },
          context: 'Studies of decision-making in substance use disorders',
          limitations: ['Not all drug offenders are addicted', 'Severity of discounting varies'],
          supports: 'con',
          createdAt: new Date('2024-01-12'),
          updatedAt: new Date('2024-01-12')
        }
      ],
      controversyLevel: 45,
      linkedLaws: ['ca-mandatory-minimum-drugs'],
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-12')
    }
  ],

  evidenceAudit: {
    effectiveness: {
      pro: [
        {
          id: 'ev-incapacitation',
          type: 'logical',
          claim: 'Incarceration prevents crime during the period of confinement',
          source: 'Basic logic of incapacitation',
          quality: {
            overall: 60,
            rigor: 50,
            replicability: 70,
            transparency: 60,
            timestamp: new Date('2024-01-10')
          },
          context: 'Only prevents crime by that individual during sentence; does not account for replacement effect in drug markets',
          limitations: ['Does not reduce overall crime rate if replacement occurs', 'High cost per crime prevented', 'Criminogenic effects of prison may increase post-release offending'],
          supports: 'pro',
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-10')
        }
      ],
      con: [
        {
          id: 'ev-recidivism-increase',
          type: 'empirical',
          claim: 'Longer sentences increase recidivism rates due to prison socialization and reduced employment prospects',
          source: 'Nagin, Cullen & Jonson, "Imprisonment and Reoffending" Crime & Justice (2009)',
          quality: {
            overall: 82,
            rigor: 85,
            replicability: 80,
            transparency: 80,
            timestamp: new Date('2024-01-13')
          },
          context: 'Review of longitudinal studies tracking post-release outcomes',
          limitations: ['Selection effects difficult to fully control', 'Quality of re-entry programs varies'],
          supports: 'con',
          createdAt: new Date('2024-01-13'),
          updatedAt: new Date('2024-01-13')
        }
      ],
      empiricalStudies: [
        'https://www.nber.org/papers/w17492',
        'https://www.sentencingproject.org/reports/long-term-sentences-time-reconsider-scale-punishment/'
      ],
      realWorldExamples: [
        {
          jurisdiction: 'New Jersey',
          description: 'Repealed most mandatory minimums in 2021. Prison population decreased 20% with no increase in crime rates.',
          outcome: 'positive',
          source: 'NJ Sentencing Commission Annual Report 2023',
          date: new Date('2023-06-01')
        }
      ]
    },
    achievesStatedGoal: {
      claim: 'Mandatory minimums deter drug crime',
      verificationMethod: 'empirical',
      confidence: 25,
      evidence: [
        {
          id: 'ev-crime-rate-analysis',
          type: 'empirical',
          claim: 'States with mandatory minimums show no significant difference in drug crime rates compared to states without them, after controlling for demographics and enforcement',
          source: 'Mauer & King, "A 25-Year Quagmire: The War on Drugs" (2007)',
          quality: {
            overall: 75,
            rigor: 78,
            replicability: 70,
            transparency: 78,
            timestamp: new Date('2024-01-14')
          },
          context: 'Cross-state comparison over 20+ years',
          limitations: ['Difficult to isolate effect of one policy', 'Enforcement intensity varies'],
          supports: 'con',
          createdAt: new Date('2024-01-14'),
          updatedAt: new Date('2024-01-14')
        }
      ],
      counterEvidence: [],
      consensusLevel: 'moderate_agreement',
      lastVerified: new Date('2024-01-15')
    },
    unintendedConsequences: [
      {
        description: 'Racial disparity in prosecution: Black defendants 3x more likely to be charged under mandatory minimum statutes for similar conduct',
        severity: 'critical',
        affectedPopulation: 'Approximately 60,000 people incarcerated under these statutes in CA; disproportionately Black and Latino',
        evidence: [],
        likelihood: 95
      },
      {
        description: 'Plea bargain coercion: Defendants accept unfavorable deals to avoid trial risk, even when innocent',
        severity: 'major',
        affectedPopulation: 'Estimated 95% of drug cases resolve via plea',
        evidence: [],
        likelihood: 90
      },
      {
        description: 'Prison overcrowding leading to early release of violent offenders to make room for non-violent drug offenders',
        severity: 'major',
        affectedPopulation: 'General public safety risk',
        evidence: [],
        likelihood: 75
      }
    ]
  },

  justificationTest: {
    constitutionalIssues: [
      {
        provision: 'Eighth Amendment (Cruel and Unusual Punishment)',
        conflict: 'Grossly disproportionate sentences for non-violent offenses may violate proportionality principle',
        severity: 'potential',
        precedent: ['Harmelin v. Michigan (1991)', 'Ewing v. California (2003)']
      }
    ],
    valuesAlignment: [
      {
        value: 'due_process',
        alignment: 'conflicts',
        reasoning: 'Removes judicial discretion to consider individual circumstances, treating dissimilar cases identically',
        importance: 'core'
      },
      {
        value: 'equal_protection',
        alignment: 'conflicts',
        reasoning: 'Enforcement patterns show systematic racial disparities in charging decisions',
        importance: 'core'
      }
    ],
    reversibilityTest: {
      survives: false,
      reasoning: 'When political winds shift, mandatory minimums are used as weapons against disfavored groups. If your political opponents controlled prosecution, would you trust them with this power?',
      vulnerabilities: [
        'Prosecutor discretion creates arbitrary power',
        'No mechanism to correct errors or changed circumstances',
        'Ratchet effect: easy to add mandatory minimums, politically difficult to remove'
      ]
    },
    proportionality: {
      harmPrevented: 'Uncertain reduction in drug crime; primary effect is incapacitation of individuals already caught',
      restrictionImposed: '3-5 years of human freedom, ~$200,000 in direct costs, family disruption, employment destruction',
      isProportional: false,
      reasoning: 'Cost is certain and severe; benefit is speculative and likely modest. Less restrictive alternatives (treatment, supervision) achieve similar incapacitation at fraction of cost with better outcomes.'
    }
  },

  stakeholderLedger: {
    winners: [
      {
        group: 'Prosecutors',
        size: 2500,
        impactType: 'legal',
        magnitude: 'high',
        description: 'Gain bargaining leverage and higher conviction rates without trial',
        evidence: []
      },
      {
        group: 'Private prison industry',
        size: 50,
        impactType: 'economic',
        magnitude: 'high',
        description: 'Guaranteed occupancy rates and revenue from long sentences',
        evidence: []
      },
      {
        group: 'Politicians signaling toughness',
        size: 120,
        impactType: 'social',
        magnitude: 'medium',
        description: 'Can claim "tough on crime" credentials without funding prevention',
        evidence: []
      }
    ],
    losers: [
      {
        group: 'Defendants and families',
        size: 60000,
        impactType: 'freedom',
        magnitude: 'critical',
        description: 'Years of incarceration, family separation, economic devastation',
        evidence: []
      },
      {
        group: 'Taxpayers',
        size: 39000000,
        impactType: 'economic',
        magnitude: 'medium',
        description: '$60,000/year per prisoner; ~$3.6 billion total over lifetime of sentences',
        evidence: []
      }
    ],
    silentVictims: [
      {
        group: 'Children of incarcerated parents',
        size: 80000,
        impactType: 'social',
        magnitude: 'high',
        description: 'Trauma, economic hardship, increased likelihood of future involvement in criminal justice system',
        evidence: []
      },
      {
        group: 'Communities with concentrated incarceration',
        size: 500000,
        impactType: 'social',
        magnitude: 'high',
        description: 'Destabilization of families, reduced economic activity, normalized prison pipeline',
        evidence: []
      }
    ],
    wealthDistribution: 'regressive',
    concentrationOfBenefit: 'concentrated',
    concentrationOfCost: 'concentrated'
  },

  implementationTracker: {
    enforcementPattern: [
      {
        statutoryRequirement: 'Applied uniformly to all defendants meeting statutory criteria',
        actualPractice: 'Prosecutors selectively charge based on jurisdiction, race, and cooperation willingness',
        gap: 'Enormous discretion at charging stage creates parallel system of prosecutorial sentencing',
        disparateImpact: true,
        evidence: []
      }
    ],
    budgetAllocated: 3600000000,
    budgetRequired: 3600000000,
    enforcementCapacity: 'adequate',
    complianceRate: 100,
    commonWorkarounds: [
      'Charge bargaining: Prosecutor offers to charge lesser offense not subject to mandatory minimum',
      '"Substantial assistance" departures: Defendants cooperate (or fabricate cooperation) to escape minimum',
      'Federal/state forum shopping: Case charged in system with more favorable sentencing'
    ],
    regulatoryCapture: {
      present: true,
      description: 'Prison guard unions and private prison companies lobby heavily for sentence enhancements and against reforms',
      evidence: []
    }
  },

  createdAt: new Date('2024-01-10'),
  updatedAt: new Date('2024-01-15'),
  createdBy: 'system',
  lastModifiedBy: 'system'
};

/**
 * Example 2: Rent Control
 * A law with contested economic assumptions
 */
export const rentControl: Law = {
  id: 'ca-rent-control-ab1482',
  jurisdiction: 'California',
  category: 'housing',
  officialTitle: 'Tenant Protection Act of 2019 (AB 1482)',
  citationCode: 'CA Civil Code § 1947.12',
  enactedDate: new Date('2019-10-08'),
  status: 'active',

  plainEnglishSummary: 'Limits annual rent increases to 5% + inflation (max 10% total) for buildings older than 15 years.',

  realWorldImpact: 'Landlords cannot raise rent above cap even when market rate increases faster. Creates incentive to let properties deteriorate since returns are capped. New construction exempt, creating two-tier market. Existing tenants benefit; future tenants and would-be residents lose.',

  statedPurpose: 'Prevent displacement and maintain housing affordability',

  operativePurpose: 'Protect current tenants from rent increases; transfer wealth from landlords to existing renters; politically reward voting bloc of current tenants',

  purposeGap: 'Protects people already housed; does nothing for people seeking housing. The word "affordability" implies making housing cheaper broadly, but mechanism only caps increases for specific units while potentially reducing overall supply.',

  operatingAssumptions: [
    {
      id: 'assumption-price-cap-prevents-displacement',
      statement: 'Price caps on rent prevent displacement more effectively than expanding housing supply',
      domain: 'economics',
      testability: 'easily_testable',
      evidence: [],
      controversyLevel: 75, // Highly contested between economists and housing advocates
      linkedLaws: ['ca-rent-control-ab1482'],
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10')
    }
  ],

  evidenceAudit: {
    effectiveness: {
      pro: [],
      con: [],
      empiricalStudies: [
        'https://www.brookings.edu/research/what-does-economic-evidence-tell-us-about-the-effects-of-rent-control/',
        'https://www.nber.org/papers/w24181'
      ],
      realWorldExamples: [
        {
          jurisdiction: 'San Francisco',
          description: 'Strong rent control since 1979. Housing affordability worsened; supply constrained; political opposition to new construction intensified',
          outcome: 'negative',
          source: 'Diamond, McQuade & Qian, "The Effects of Rent Control Expansion" (2019)',
          date: new Date('2019-01-01')
        }
      ]
    },
    achievesStatedGoal: {
      claim: 'Rent control maintains housing affordability',
      verificationMethod: 'empirical',
      confidence: 35,
      evidence: [],
      counterEvidence: [],
      consensusLevel: 'contested',
      lastVerified: new Date('2024-01-10')
    },
    unintendedConsequences: [
      {
        description: 'Reduced housing supply as developers avoid rent-controlled buildings',
        severity: 'major',
        affectedPopulation: 'Future residents and people seeking housing',
        evidence: [],
        likelihood: 80
      },
      {
        description: 'Deterioration of existing housing stock due to capped returns',
        severity: 'moderate',
        affectedPopulation: 'Current and future tenants in rent-controlled units',
        evidence: [],
        likelihood: 70
      },
      {
        description: 'Reduced mobility: tenants stay in suboptimal housing to preserve rent-controlled lease',
        severity: 'moderate',
        affectedPopulation: 'Rent-controlled tenants',
        evidence: [],
        likelihood: 85
      }
    ]
  },

  justificationTest: {
    constitutionalIssues: [],
    valuesAlignment: [
      {
        value: 'property_rights',
        alignment: 'conflicts',
        reasoning: 'Restricts owners\' ability to set prices for their property',
        importance: 'significant'
      }
    ],
    reversibilityTest: {
      survives: true,
      reasoning: 'Policy can be reversed or modified through legislative process. No permanent institutional changes.',
      vulnerabilities: ['Political difficulty of removing benefits once granted']
    },
    proportionality: {
      harmPrevented: 'Displacement of some current tenants from rent increases',
      restrictionImposed: 'Property rights limitation; reduced housing supply; market distortion',
      isProportional: false,
      reasoning: 'Helps subset of current tenants at expense of broader housing affordability. Less restrictive alternatives (housing vouchers, supply expansion) could achieve goal with fewer distortions.'
    }
  },

  stakeholderLedger: {
    winners: [
      {
        group: 'Current tenants in rent-controlled units',
        size: 2500000,
        impactType: 'economic',
        magnitude: 'medium',
        description: 'Protection from large rent increases; wealth transfer from landlords',
        evidence: []
      }
    ],
    losers: [
      {
        group: 'Prospective tenants and new residents',
        size: 5000000,
        impactType: 'economic',
        magnitude: 'high',
        description: 'Reduced supply leads to higher prices in non-controlled market; longer search times',
        evidence: []
      },
      {
        group: 'Small landlords',
        size: 500000,
        impactType: 'economic',
        magnitude: 'medium',
        description: 'Reduced returns; cannot adjust to market conditions or cover rising costs',
        evidence: []
      }
    ],
    silentVictims: [
      {
        group: 'Would-be residents deterred by high housing costs',
        size: 1000000,
        impactType: 'economic',
        magnitude: 'critical',
        description: 'Cannot move to California for jobs or family due to housing scarcity',
        evidence: []
      }
    ],
    wealthDistribution: 'neutral',
    concentrationOfBenefit: 'diffuse',
    concentrationOfCost: 'diffuse'
  },

  implementationTracker: {
    enforcementPattern: [],
    budgetAllocated: 0,
    budgetRequired: 50000000,
    enforcementCapacity: 'inadequate',
    complianceRate: 60,
    commonWorkarounds: [
      'Converting apartments to condos (exempt from rent control)',
      'Ellis Act evictions to remove units from rental market',
      'Aggressive enforcement of minor lease violations to remove tenants',
      '"Renovictions": Claim major renovation needed, evict tenants, raise rent for new tenants'
    ],
    regulatoryCapture: {
      present: false
    }
  },

  createdAt: new Date('2024-01-10'),
  updatedAt: new Date('2024-01-10'),
  createdBy: 'system',
  lastModifiedBy: 'system'
};

/**
 * Example proposal: Reform mandatory minimums with evidence-based sentencing
 */
export const reformMandatoryMinimums: LawProposal = {
  id: 'proposal-eliminate-drug-minimums',
  lawId: 'ca-mandatory-minimum-drugs',
  title: 'Replace Mandatory Minimums with Evidence-Based Sentencing Guidelines',
  proposedBy: 'reform_advocate_2024',
  createdAt: new Date('2024-01-16'),
  status: 'under_review',

  goal: {
    problem: 'Current system shows no deterrent effect, costs $3.6B, and creates racial disparities while increasing recidivism',
    affectedPopulation: '60,000 currently incarcerated; future defendants and communities',
    currentMetric: 'Recidivism rate: 65% within 3 years; Cost: $60k/year per prisoner; Racial disparity: 3x more likely for Black defendants',
    targetMetric: 'Recidivism rate: <40%; Cost: <$30k/year; Eliminate measurable racial disparity',
    linkedInterests: []
  },

  mechanism: {
    causalChain: 'Judges use evidence-based risk assessment to determine appropriate sentence level. High-risk offenders receive incapacitation-focused sentences. Low-risk offenders receive treatment and supervision. Because resources focus on actual risk rather than arbitrary offense categories, recidivism decreases and costs decline.',
    assumptions: [
      {
        id: 'assumption-risk-assessment-accuracy',
        statement: 'Validated risk assessment tools can distinguish high and low recidivism risk better than offense category alone',
        domain: 'criminology',
        testability: 'easily_testable',
        evidence: [],
        controversyLevel: 40,
        linkedLaws: [],
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16')
      }
    ],
    timeframe: '1-3 years to see reduction in recidivism; immediate reduction in incarceration costs',
    requiredResources: ['Training for judges on risk assessment', 'Treatment program expansion', 'Monitoring/supervision infrastructure']
  },

  evidenceBase: [],

  tradeoffAudit: {
    costs: [
      {
        description: 'Upfront investment in training and risk assessment infrastructure',
        stakeholder: 'State budget',
        magnitude: 'medium',
        certainty: 90,
        timeframe: 'immediate',
        evidence: []
      },
      {
        description: 'Political vulnerability to "soft on crime" attacks if any released individual reoffends',
        stakeholder: 'Politicians supporting reform',
        magnitude: 'medium',
        certainty: 95,
        timeframe: 'short_term',
        evidence: []
      }
    ],
    benefits: [
      {
        description: 'Reduced recidivism through evidence-based interventions',
        stakeholder: 'Public safety',
        magnitude: 'high',
        certainty: 75,
        timeframe: 'long_term',
        evidence: []
      },
      {
        description: '$1.8B+ annual savings from reduced incarceration',
        stakeholder: 'Taxpayers',
        magnitude: 'high',
        certainty: 80,
        timeframe: 'short_term',
        evidence: []
      }
    ],
    risks: [
      {
        description: 'Risk assessment tools may encode existing biases if not carefully validated',
        likelihood: 60,
        severity: 'major',
        mitigation: 'Regular bias audits; transparency in tool selection; override mechanisms'
      },
      {
        description: 'Some high-risk individuals may receive shorter sentences than under mandatory minimums',
        likelihood: 50,
        severity: 'moderate',
        mitigation: 'Risk assessment specifically targets high-risk for incapacitation; net public safety improves through reduced recidivism'
      }
    ],
    acknowledgesDownsides: true,
    honestyScore: 85
  },

  currentText: 'Any person convicted of a violation of subdivision (a) of Section 11370.4 shall receive a minimum sentence of three years in state prison.',

  proposedText: 'Any person convicted of a violation of subdivision (a) of Section 11370.4 shall be sentenced according to validated risk assessment guidelines established by the California Sentencing Commission. The court shall consider: (1) risk of recidivism as determined by validated assessment; (2) individual circumstances including employment, family ties, and mental health; (3) public safety requirements. Sentences may include incarceration, treatment, supervision, or combination thereof.',

  changes: [
    {
      type: 'modification',
      section: '11370.4(a)',
      before: 'Any person convicted of a violation of subdivision (a) of Section 11370.4 shall receive a minimum sentence of three years in state prison.',
      after: 'Any person convicted of a violation of subdivision (a) of Section 11370.4 shall be sentenced according to validated risk assessment guidelines established by the California Sentencing Commission. The court shall consider: (1) risk of recidivism as determined by validated assessment; (2) individual circumstances including employment, family ties, and mental health; (3) public safety requirements. Sentences may include incarceration, treatment, supervision, or combination thereof.'
    }
  ],

  reviews: [],
  upvotes: 247,
  downvotes: 83,

  aiAnalysis: {
    timestamp: new Date('2024-01-16'),
    missingTradeoffs: [
      'Does not address what happens to individuals currently serving mandatory minimums',
      'No discussion of training timeline for judges or potential for inconsistent application during transition'
    ],
    causalGaps: [
      'Assumes treatment programs have capacity to absorb increased demand - should specify capacity building plan'
    ],
    assumptionFlaws: [],
    citationChainAnalysis: [],
    internalContradictions: [],
    qualityScore: 78,
    flagsForHumanReview: [
      'Consider retroactivity provisions',
      'Specify implementation timeline',
      'Address capacity constraints in treatment system'
    ]
  }
};

// Export all examples
export const exampleLaws = [
  mandatoryMinimumSentencing,
  rentControl
];

export const exampleProposals = [
  reformMandatoryMinimums
];

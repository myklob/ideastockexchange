import { Belief, ArbitrageRow, CBAItem, User, Trade } from './types';

// ─── Beliefs ──────────────────────────────────────────────────────────────────

export const beliefs: Belief[] = [
  {
    slug: 'carbon-tax-reduces-emissions',
    statement: 'A revenue-neutral carbon tax materially reduces emissions',
    reasonRank: 78.4,
    marketPrice: 52.3,
    volume: 24140,
    contributors: 18,
    argCount: 47,
    lastEvaluated: '12 May 2026',
    spectrums: { positivity: 62, specificity: 0.55, claimStrength: 0.5 },
    proArgs: [
      { id: 'p1', title: 'BC carbon tax → 5–15% emissions decline (Murray & Rivers 2015)', linkage: 92, linkageLabel: 'Strong', truth: 88, impact: '+18.4', side: 'pro' },
      { id: 'p2', title: 'Sweden carbon tax cut transport emissions 11% vs counterfactual', linkage: 78, linkageLabel: 'Strong', truth: 82, impact: '+11.2', side: 'pro' },
      { id: 'p3', title: 'Price elasticity of fuel demand is non-zero in long run',          linkage: 71, linkageLabel: 'Context', truth: 90, impact: '+9.6',  side: 'pro' },
    ],
    conArgs: [
      { id: 'c1', title: 'Leakage offsets domestic gains via imports',             linkage: 41, linkageLabel: 'Context', truth: 62, impact: '−5.8', side: 'con' },
      { id: 'c2', title: 'Revenue rebates may rebound consumption',                linkage: 34, linkageLabel: 'Weak',    truth: 52, impact: '−4.1', side: 'con' },
    ],
    evidence: [
      { id: 'e1', title: 'Murray & Rivers — Review of BC Carbon Tax', source: 'Energy Policy 2015', quality: 92, tier: 'T1', finding: 'Found 5–15% reduction vs synthetic counterfactual. Replicated.', side: 'pro' },
      { id: 'e2', title: 'Carbon Leakage in Open Economies',          source: 'NBER 2018',          quality: 71, tier: 'T2', finding: 'Estimates 10–25% of abatement offset by imports.', side: 'con' },
      { id: 'e3', title: 'Sweden Transport Sector Analysis',          source: 'IMF Working Paper',  quality: 78, tier: 'T2', finding: '11% reduction in long-run elasticity model.', side: 'pro' },
      { id: 'e4', title: 'Op-Ed — The Rebate Trap',                  source: 'WSJ Opinion 2021',   quality: 28, tier: 'T4', finding: 'Argues rebates rebound consumption; mostly speculative.', side: 'con' },
    ],
  },
  {
    slug: 'fifteen-dollar-minimum-wage',
    statement: '$15 federal minimum wage reduces poverty long-run',
    reasonRank: 31.2,
    marketPrice: 68.4,
    volume: 11820,
    contributors: 12,
    argCount: 33,
    lastEvaluated: '8 May 2026',
    spectrums: { positivity: -20, specificity: 0.6, claimStrength: 0.72 },
    proArgs: [
      { id: 'p1', title: 'Higher wages increase purchasing power among low earners', linkage: 65, linkageLabel: 'Moderate', truth: 74, impact: '+12.0', side: 'pro' },
      { id: 'p2', title: 'Dube (2019): minimum wage reduces poverty rate 10–14%',   linkage: 72, linkageLabel: 'Strong',   truth: 68, impact: '+9.4',  side: 'pro' },
    ],
    conArgs: [
      { id: 'c1', title: 'CBO (2021): 1.4M jobs lost nationally at $15',            linkage: 78, linkageLabel: 'Strong',   truth: 82, impact: '−22.1', side: 'con' },
      { id: 'c2', title: 'Regional price differences make a single floor distortive', linkage: 61, linkageLabel: 'Moderate', truth: 72, impact: '−11.3', side: 'con' },
      { id: 'c3', title: 'Employers substitute capital for labor at higher wages',    linkage: 54, linkageLabel: 'Moderate', truth: 66, impact: '−8.2',  side: 'con' },
    ],
    evidence: [
      { id: 'e1', title: 'Dube — Impacts of Minimum Wages on Poverty', source: 'Journal of Labor Economics 2019', quality: 84, tier: 'T1', finding: 'Finds 10–14% poverty reduction per 10% minimum wage increase.', side: 'pro' },
      { id: 'e2', title: 'CBO — The Effects on Employment of a $15 Federal Minimum Wage', source: 'Congressional Budget Office 2021', quality: 88, tier: 'T1', finding: 'Projects 1.4M job losses and 900K people lifted from poverty.', side: 'con' },
      { id: 'e3', title: 'Seattle Min Wage Study (UW)',   source: 'University of Washington 2018', quality: 76, tier: 'T2', finding: 'Mixed: hours reduced, but earnings for retained workers rose.', side: 'con' },
    ],
  },
  {
    slug: 'new-nuclear-cheaper-than-gas',
    statement: 'New nuclear is cheaper than gas peakers by 2030',
    reasonRank: 62.1,
    marketPrice: 39.7,
    volume: 18230,
    contributors: 9,
    argCount: 28,
    lastEvaluated: '5 May 2026',
    spectrums: { positivity: 40, specificity: 0.75, claimStrength: 0.45 },
    proArgs: [
      { id: 'p1', title: 'SMR learning curves show 40% cost reduction by 2035 (IAEA 2024)', linkage: 68, linkageLabel: 'Moderate', truth: 58, impact: '+14.2', side: 'pro' },
      { id: 'p2', title: 'Carbon pricing makes gas increasingly uneconomical', linkage: 72, linkageLabel: 'Moderate', truth: 74, impact: '+9.1', side: 'pro' },
    ],
    conArgs: [
      { id: 'c1', title: 'Vogtle 3&4 overran $17B over budget — nuclear capex risk remains extreme', linkage: 84, linkageLabel: 'Strong', truth: 94, impact: '−18.6', side: 'con' },
      { id: 'c2', title: 'No SMR has reached commercial scale as of 2026', linkage: 79, linkageLabel: 'Strong', truth: 97, impact: '−12.0', side: 'con' },
    ],
    evidence: [
      { id: 'e1', title: 'Lazard LCOE Analysis 2024', source: 'Lazard 2024', quality: 80, tier: 'T2', finding: 'Nuclear LCOE $141/MWh vs gas peaker $165–230/MWh under carbon pricing.', side: 'pro' },
      { id: 'e2', title: 'Vogtle 3&4 Post-Mortem', source: 'Georgia Power Filing 2024', quality: 91, tier: 'T2', finding: 'Final cost $35B vs $14B estimate; 7-year schedule overrun.', side: 'con' },
    ],
  },
  {
    slug: 'ranked-choice-voting-reduces-polarization',
    statement: 'Ranked-choice voting reduces political polarization',
    reasonRank: 54.3,
    marketPrice: 32.0,
    volume: 9214,
    contributors: 7,
    argCount: 22,
    lastEvaluated: '3 May 2026',
    spectrums: { positivity: 30, specificity: 0.5, claimStrength: 0.35 },
    proArgs: [
      { id: 'p1', title: 'RCV incentivizes candidates to appeal beyond their base', linkage: 74, linkageLabel: 'Moderate', truth: 62, impact: '+10.8', side: 'pro' },
      { id: 'p2', title: 'Alaska 2022 results: moderate candidates outperformed extremes', linkage: 66, linkageLabel: 'Moderate', truth: 78, impact: '+7.3', side: 'pro' },
    ],
    conArgs: [
      { id: 'c1', title: 'No causal study isolates RCV from other electoral reforms', linkage: 58, linkageLabel: 'Moderate', truth: 82, impact: '−9.4', side: 'con' },
      { id: 'c2', title: 'Polarization is driven by media/social dynamics, not ballot structure', linkage: 52, linkageLabel: 'Moderate', truth: 68, impact: '−7.1', side: 'con' },
    ],
    evidence: [
      { id: 'e1', title: 'Blessing et al — Does RCV Reduce Polarization?', source: 'Electoral Studies 2022', quality: 72, tier: 'T2', finding: 'Weak positive correlation; no causal identification.', side: 'pro' },
      { id: 'e2', title: 'Brunell & Grofman — RCV and Extremism',          source: 'PS: Political Science 2023', quality: 68, tier: 'T2', finding: 'No significant effect on ideological extremity of winners.', side: 'con' },
    ],
  },
  {
    slug: 'rent-control-increases-supply',
    statement: 'Rent control increases housing supply long-term',
    reasonRank: 18.0,
    marketPrice: 41.2,
    volume: 6402,
    contributors: 6,
    argCount: 19,
    lastEvaluated: '1 May 2026',
    spectrums: { positivity: -70, specificity: 0.7, claimStrength: 0.88 },
    proArgs: [
      { id: 'p1', title: 'Stabilized tenants stay longer, improving neighborhood investment', linkage: 42, linkageLabel: 'Weak', truth: 58, impact: '+3.2', side: 'pro' },
    ],
    conArgs: [
      { id: 'c1', title: 'Diamond et al (2019): SF rent control reduced rental supply 15%', linkage: 92, linkageLabel: 'Strong', truth: 94, impact: '−24.1', side: 'con' },
      { id: 'c2', title: 'Landlords convert units to condos or let them decay under ceilings', linkage: 86, linkageLabel: 'Strong', truth: 88, impact: '−16.4', side: 'con' },
      { id: 'c3', title: 'Price ceilings reduce developer ROI; new construction collapses',   linkage: 79, linkageLabel: 'Strong', truth: 84, impact: '−12.8', side: 'con' },
    ],
    evidence: [
      { id: 'e1', title: 'Diamond, McQuade, Qian — Effects of Rent Control', source: 'American Economic Review 2019', quality: 96, tier: 'T1', finding: 'SF rent control protected tenants but reduced supply 15%; equilibrium rents rose 5–7%.', side: 'con' },
      { id: 'e2', title: 'Sims — Out of Control: What Can We Learn from the End of Massachusetts Rent Control', source: 'Journal of Urban Economics 2007', quality: 82, tier: 'T1', finding: 'Rent control removal increased housing supply and quality.', side: 'con' },
    ],
  },
];

export function getBelief(slug: string): Belief | undefined {
  return beliefs.find(b => b.slug === slug);
}

// ─── Arbitrage ─────────────────────────────────────────────────────────────────

export const arbitrageRows: ArbitrageRow[] = beliefs.map(b => ({
  id: b.slug,
  title: b.statement.length > 55 ? b.statement.slice(0, 55) + '…' : b.statement,
  category: getCategoryForBelief(b.slug),
  reasonRank: b.reasonRank,
  marketPrice: b.marketPrice,
  volume: b.volume,
  signal: b.reasonRank > b.marketPrice ? 'UNDER' : 'OVER',
}));

function getCategoryForBelief(slug: string): string {
  const map: Record<string, string> = {
    'carbon-tax-reduces-emissions':           'Climate',
    'fifteen-dollar-minimum-wage':            'Labor',
    'new-nuclear-cheaper-than-gas':           'Energy',
    'ranked-choice-voting-reduces-polarization': 'Politics',
    'rent-control-increases-supply':          'Housing',
  };
  return map[slug] ?? 'Policy';
}

// ─── CBA ───────────────────────────────────────────────────────────────────────

export const carbonTaxCBA: CBAItem[] = [
  { id: 'b1', label: 'Emissions reduction (social cost of carbon)', impact: '+$8.2B / yr',  impactValue:  8.2, likelihood: 72, evidence: 78, side: 'benefit' },
  { id: 'b2', label: 'Public health improvement (PM2.5 ↓ 6%)',      impact: '+$1.4B / yr',  impactValue:  1.4, likelihood: 64, evidence: 71, side: 'benefit' },
  { id: 'b3', label: 'Revenue rebated to households',               impact: '+$12B / yr',   impactValue: 12.0, likelihood: 92, evidence: 88, side: 'benefit' },
  { id: 'c1', label: 'Higher fuel costs at the pump',               impact: '−$10.2B / yr', impactValue: -10.2, likelihood: 95, evidence: 92, side: 'cost' },
  { id: 'c2', label: 'Industry compliance & administration',        impact: '−$0.8B / yr',  impactValue:  -0.8, likelihood: 78, evidence: 64, side: 'cost' },
  { id: 'c3', label: 'Carbon leakage through imports',              impact: '−$1.6B / yr',  impactValue:  -1.6, likelihood: 41, evidence: 68, side: 'cost' },
];

// ─── Users (in-memory store) ────────────────────────────────────────────────────
// Pre-computed bcrypt hash for "password" (rounds=10)
const DEMO_PASSWORD_HASH = '$2a$10$EYtGItvh1ju9oBs7ADzdA.Ijv8UqOWdgMVOCKNnl7ex3DZocvTH1a';

export const users: User[] = [
  { id: 'u1', email: 'demo@ise.io', name: 'Demo User', credits: 1250, passwordHash: DEMO_PASSWORD_HASH },
];

export function getUserByEmail(email: string): User | undefined {
  return users.find(u => u.email === email);
}

// ─── Trades (in-memory store) ───────────────────────────────────────────────────

export const trades: Trade[] = [];

export function addTrade(trade: Omit<Trade, 'id' | 'createdAt'>): Trade {
  const newTrade: Trade = {
    ...trade,
    id: `t${trades.length + 1}`,
    createdAt: new Date().toISOString(),
  };
  trades.push(newTrade);

  // Adjust the belief market price slightly
  const belief = beliefs.find(b => b.slug === trade.beliefSlug);
  if (belief) {
    const priceDelta = (trade.side === 'YES' ? 1 : -1) * 0.001 * trade.amount;
    belief.marketPrice = Math.max(1, Math.min(99, belief.marketPrice + priceDelta));
    belief.volume += trade.amount;
  }

  return newTrade;
}

export function getTradesByUser(userId: string): Trade[] {
  return trades.filter(t => t.userId === userId);
}

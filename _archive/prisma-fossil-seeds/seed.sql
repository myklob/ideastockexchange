-- Seed data for Idea Stock Exchange
-- 8 linked beliefs with comprehensive analysis

-- ── Beliefs ────────────────────────────────────────────────────────

INSERT INTO Belief (id, slug, statement, category, subcategory, deweyNumber, positivity, createdAt, updatedAt) VALUES
(1, 'carbon-tax-best-way-reduce-emissions', 'A carbon tax is the most effective way to reduce greenhouse gas emissions', 'Environment', 'Climate Policy', '363.738', 35, datetime('now'), datetime('now')),
(2, 'global-warming-is-real-and-human-caused', 'Global warming is real and primarily caused by human activity', 'Science', 'Climate Science', '551.6', 72, datetime('now'), datetime('now')),
(3, 'market-mechanisms-more-efficient-than-regulation', 'Market-based mechanisms are more efficient than direct regulation for controlling pollution', 'Economics', 'Environmental Economics', '333.7', 40, datetime('now'), datetime('now')),
(4, 'carbon-tax-hurts-economic-growth', 'A carbon tax would significantly harm economic growth and job creation', 'Economics', 'Fiscal Policy', '336.2', -20, datetime('now'), datetime('now')),
(5, 'renewable-energy-can-replace-fossil-fuels', 'Renewable energy technology is mature enough to replace fossil fuels within two decades', 'Technology', 'Energy', '333.794', 30, datetime('now'), datetime('now')),
(6, 'carbon-tax-is-regressive', 'A carbon tax disproportionately burdens low-income households', 'Economics', 'Income Distribution', '339.2', 15, datetime('now'), datetime('now')),
(7, 'free-markets-generally-produce-optimal-outcomes', 'Free markets generally produce the most efficient and optimal outcomes for society', 'Economics', 'Economic Theory', '330.122', 25, datetime('now'), datetime('now')),
(8, 'government-intervention-needed-for-market-failures', 'Government intervention is necessary to correct market failures like pollution externalities', 'Economics', 'Public Policy', '338.9', 45, datetime('now'), datetime('now'));

-- ── Arguments (linked beliefs as reasons) ──────────────────────────

-- Reasons to agree with carbon tax (belief 1)
INSERT INTO Argument (id, parentBeliefId, beliefId, side, linkageScore, impactScore, createdAt, updatedAt) VALUES
(1, 1, 2, 'agree', 0.7, 0, datetime('now'), datetime('now')),   -- global warming -> carbon tax
(2, 1, 3, 'agree', 0.85, 0, datetime('now'), datetime('now')),  -- market mechanisms -> carbon tax
(3, 1, 8, 'agree', 0.6, 0, datetime('now'), datetime('now'));   -- govt intervention -> carbon tax

-- Reasons to disagree with carbon tax (belief 1)
INSERT INTO Argument (id, parentBeliefId, beliefId, side, linkageScore, impactScore, createdAt, updatedAt) VALUES
(4, 1, 4, 'disagree', 0.75, 0, datetime('now'), datetime('now')),  -- hurts economy -> carbon tax
(5, 1, 6, 'disagree', 0.65, 0, datetime('now'), datetime('now'));  -- regressive -> carbon tax

-- Sub-arguments for global warming (belief 2)
INSERT INTO Argument (id, parentBeliefId, beliefId, side, linkageScore, impactScore, createdAt, updatedAt) VALUES
(6, 2, 5, 'agree', 0.4, 0, datetime('now'), datetime('now'));  -- renewable energy -> global warming

-- Sub-arguments for market mechanisms (belief 3)
INSERT INTO Argument (id, parentBeliefId, beliefId, side, linkageScore, impactScore, createdAt, updatedAt) VALUES
(7, 3, 7, 'agree', 0.7, 0, datetime('now'), datetime('now'));  -- free markets -> market mechanisms

-- ── Linkage Arguments ──────────────────────────────────────────────

INSERT INTO LinkageArgument (argumentId, side, statement, strength, createdAt) VALUES
(1, 'agree', 'If global warming is real and human-caused, we need a mechanism to reduce emissions, and a carbon tax directly prices emissions.', 0.8, datetime('now')),
(1, 'disagree', 'Global warming being real does not necessarily mean a carbon tax is the BEST solution; other approaches could be more effective.', 0.4, datetime('now')),
(2, 'agree', 'A carbon tax IS a market mechanism, so if market mechanisms work better than regulation, this directly supports the carbon tax approach.', 0.9, datetime('now')),
(4, 'agree', 'Economic harm is a direct cost of implementing a carbon tax, making it relevant to whether it is the best approach.', 0.7, datetime('now')),
(4, 'disagree', 'Short-term economic costs do not negate long-term environmental benefits; the comparison should be net cost over decades.', 0.5, datetime('now'));

-- ── Evidence ───────────────────────────────────────────────────────

INSERT INTO Evidence (beliefId, side, description, sourceUrl, evidenceType, sourceIndependenceWeight, replicationQuantity, conclusionRelevance, replicationPercentage, linkageScore, impactScore, createdAt, updatedAt) VALUES
(1, 'supporting', 'British Columbia''s carbon tax reduced emissions by 5-15% while GDP continued to grow (2008-2015 study by Metcalf & Stock)', 'https://doi.org/10.1257/pol.20170144', 'T1', 0.9, 3, 0.85, 0.8, 0.9, 0, datetime('now'), datetime('now')),
(1, 'supporting', 'IMF analysis shows carbon pricing is the most cost-effective tool for meeting Paris Agreement targets', 'https://www.imf.org/en/Topics/climate-change/carbon-pricing', 'T2', 0.8, 2, 0.9, 0.85, 0.85, 0, datetime('now'), datetime('now')),
(1, 'weakening', 'Australia repealed its carbon tax in 2014 after two years due to political backlash and concerns about rising energy costs', NULL, 'T3', 0.5, 1, 0.6, 1.0, 0.5, 0, datetime('now'), datetime('now')),
(1, 'weakening', 'Carbon leakage: industries may simply relocate to countries without carbon pricing, shifting rather than reducing global emissions', NULL, 'T2', 0.7, 4, 0.75, 0.7, 0.7, 0, datetime('now'), datetime('now')),
(2, 'supporting', 'IPCC Sixth Assessment Report: It is unequivocal that human influence has warmed the atmosphere, ocean and land (2021)', 'https://www.ipcc.ch/report/ar6/wg1/', 'T1', 0.95, 10, 0.95, 0.97, 0.95, 0, datetime('now'), datetime('now')),
(2, 'supporting', 'NASA/NOAA data shows global temperature has risen approximately 1.1C since pre-industrial era, with accelerating trend', 'https://climate.nasa.gov/vital-signs/global-temperature/', 'T1', 0.9, 5, 0.9, 0.95, 0.9, 0, datetime('now'), datetime('now'));

-- ── Objective Criteria ─────────────────────────────────────────────

INSERT INTO ObjectiveCriteria (beliefId, description, independenceScore, linkageScore, criteriaType, totalScore, createdAt) VALUES
(1, 'Cost per ton of CO2 reduced compared to alternative policies', 0.85, 0.9, 'efficiency', 0.77, datetime('now')),
(1, 'Measured emissions reductions in jurisdictions with carbon pricing', 0.9, 0.85, 'scientific judgment', 0.77, datetime('now'));

-- ── Values Analysis ────────────────────────────────────────────────

INSERT INTO ValuesAnalysis (beliefId, supportingAdvertised, supportingActual, opposingAdvertised, opposingActual, createdAt, updatedAt) VALUES
(1, 'Environmental stewardship, intergenerational responsibility, economic efficiency', 'Environmental stewardship, desire for market-based over regulatory solutions, faith in price signals', 'Economic freedom, protecting jobs, keeping energy affordable', 'Protecting incumbent fossil fuel industry profits, resistance to change, distrust of government programs', datetime('now'), datetime('now'));

-- ── Interests Analysis ─────────────────────────────────────────────

INSERT INTO InterestsAnalysis (beliefId, supporterInterests, opponentInterests, sharedInterests, conflictingInterests, createdAt, updatedAt) VALUES
(1, '1. Reduce greenhouse gas emissions
2. Minimize economic disruption through market signals
3. Generate revenue for clean energy transition', '1. Maintain affordable energy prices
2. Protect jobs in fossil fuel industries
3. Avoid government overreach in markets', '1. Affordable energy for consumers
2. A healthy economy with job growth', '1. Speed of energy transition (fast vs. gradual)
2. Who bears the cost of reducing emissions', datetime('now'), datetime('now'));

-- ── Assumptions ────────────────────────────────────────────────────

INSERT INTO Assumption (beliefId, side, statement, strength, createdAt) VALUES
(1, 'accept', 'Markets respond efficiently to price signals', 'CRITICAL', datetime('now')),
(1, 'accept', 'Climate change mitigation is urgent enough to justify economic costs', 'CRITICAL', datetime('now')),
(1, 'reject', 'The free market will correct environmental externalities on its own', 'STRONG', datetime('now')),
(1, 'reject', 'Technological innovation alone will solve climate change without pricing carbon', 'MODERATE', datetime('now'));

-- ── Cost-Benefit Analysis ──────────────────────────────────────────

INSERT INTO CostBenefitAnalysis (beliefId, benefits, benefitLikelihood, costs, costLikelihood, createdAt, updatedAt) VALUES
(1, '1. Improvements created: Reduced emissions, cleaner air, innovation in clean energy
2. Who gains: Future generations, public health, clean energy industry
3. Positive externalities: Reduced healthcare costs from air pollution, technology spillovers', 0.75, '1. Problems created: Higher energy prices, potential job losses in fossil fuels
2. Who loses: Fossil fuel workers, energy-intensive industries, low-income consumers
3. Negative externalities: Carbon leakage to unregulated jurisdictions, administrative overhead', 0.65, datetime('now'), datetime('now'));

-- ── Impact Analysis ────────────────────────────────────────────────

INSERT INTO ImpactAnalysis (beliefId, shortTermEffects, shortTermCosts, longTermEffects, longTermChanges, createdAt, updatedAt) VALUES
(1, '1. Immediate effects: Energy price increases of 5-15%, shift in consumer behavior
2. Transition costs: Job retraining programs needed, industrial retooling costs', 'Economic adjustment costs, political backlash risk', '1. Sustained effects: Significant emissions reductions, clean energy dominance
2. Structural changes: Transformation of energy sector, new green industries', 'Economy restructured around clean energy, reduced climate risks', datetime('now'), datetime('now'));

-- ── Compromises ────────────────────────────────────────────────────

INSERT INTO Compromise (beliefId, description, createdAt) VALUES
(1, 'Revenue-neutral carbon tax with dividend: All carbon tax revenue returned directly to citizens as equal dividends, addressing regressivity concerns while maintaining price signal.', datetime('now')),
(1, 'Gradual phase-in with border carbon adjustment: Start with low rate increasing over 10 years, combined with border tariffs on imports from non-participating countries to prevent carbon leakage.', datetime('now')),
(1, 'Hybrid approach: Carbon tax combined with targeted subsidies for clean energy R&D and retraining programs for displaced fossil fuel workers.', datetime('now'));

-- ── Obstacles ──────────────────────────────────────────────────────

INSERT INTO Obstacle (beliefId, side, description, createdAt) VALUES
(1, 'supporter', 'Difficulty acknowledging that carbon taxes DO create real short-term economic pain for certain communities', datetime('now')),
(1, 'supporter', 'Incentive to overstate climate urgency to justify preferred policy solution', datetime('now')),
(1, 'opposition', 'Difficulty acknowledging the reality and severity of climate change', datetime('now')),
(1, 'opposition', 'Financial incentives from fossil fuel industry funding create extreme anti-tax positions', datetime('now'));

-- ── Biases ─────────────────────────────────────────────────────────

INSERT INTO BiasEntry (beliefId, side, biasType, description, createdAt) VALUES
(1, 'supporter', 'CONFIRMATION_BIAS', 'Selectively citing successful carbon tax implementations (BC) while ignoring failures (Australia)', datetime('now')),
(1, 'supporter', 'AVAILABILITY_HEURISTIC', 'Over-weighting recent extreme weather events as evidence for specific policy solutions', datetime('now')),
(1, 'opponent', 'CONFIRMATION_BIAS', 'Selectively citing economic downturn correlations with carbon pricing while ignoring confounding factors', datetime('now')),
(1, 'opponent', 'MOTIVATED_REASONING', 'Those with financial ties to fossil fuels finding reasons to reject any form of carbon pricing', datetime('now'));

-- ── Media Resources ────────────────────────────────────────────────

INSERT INTO MediaResource (beliefId, side, mediaType, title, author, url, createdAt) VALUES
(1, 'supporting', 'book', 'The Climate Casino', 'William Nordhaus', NULL, datetime('now')),
(1, 'supporting', 'article', 'Economists'' Statement on Carbon Dividends', NULL, 'https://www.econstatement.org/', datetime('now')),
(1, 'opposing', 'book', 'The Moral Case for Fossil Fuels', 'Alex Epstein', NULL, datetime('now')),
(1, 'opposing', 'article', 'Why Carbon Taxes Won''t Work', 'Various critics', NULL, datetime('now'));

-- ── Legal Framework ────────────────────────────────────────────────

INSERT INTO LegalEntry (beliefId, side, description, jurisdiction, createdAt) VALUES
(1, 'supporting', 'EU Emissions Trading System (established 2005) provides legal precedent for carbon pricing', 'international', datetime('now')),
(1, 'supporting', 'Paris Agreement (2015) commits nations to emissions reductions, supporting carbon pricing mechanisms', 'international', datetime('now')),
(1, 'contradicting', 'Various US state-level anti-carbon-tax legislation and ballot measures (e.g., Washington I-1631 rejected in 2018)', 'state', datetime('now'));

-- ── Belief Mappings (general to specific) ──────────────────────────

INSERT INTO BeliefMapping (parentBeliefId, childBeliefId, direction, side, createdAt) VALUES
(8, 1, 'upstream', 'support', datetime('now')),
(2, 1, 'upstream', 'support', datetime('now')),
(7, 1, 'upstream', 'oppose', datetime('now')),
(1, 5, 'downstream', 'support', datetime('now'));

-- ── Similar Beliefs ────────────────────────────────────────────────

INSERT INTO SimilarBelief (fromBeliefId, toBeliefId, variant, createdAt) VALUES
(1, 3, 'moderate', datetime('now'));

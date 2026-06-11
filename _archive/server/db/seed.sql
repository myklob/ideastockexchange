-- ============================================================
-- ISE Seed Data — Iran Policy Conflict (CFL-001)
-- ============================================================
-- Run AFTER schema.sql:  psql -d ise -f seed.sql

BEGIN;

-- ──────────────────────────────────────────────────────────────
-- STAKEHOLDERS
-- ──────────────────────────────────────────────────────────────

INSERT INTO stakeholders (stakeholder_id, name, type, description,
  population_estimate, population_fraction, representation_confidence,
  power_political, power_economic, power_military, power_narrative, power_institutional,
  power_total_influence, power_description, created_at, updated_at, created_by)
VALUES
  ('STK-0001',
   'US National Security Establishment (Hawks)',
   'Government',
   'Pentagon leadership, intelligence community, hawkish congressional caucus, and national security think tanks advocating maximum pressure. Primary decision-makers for US military and covert policy toward Iran.',
   75000, 0.0002, 82, 75, 60, 95, 65, 85, 76,
   'Controls military force authorization, intelligence operations, covert action, and institutional leverage over security policy. Narrative power through classified briefings and selective leaks to press.',
   '2026-03-12T00:00:00Z', '2026-03-12T00:00:00Z', 'seed'),

  ('STK-0002',
   'European Allies / Multilateral Diplomats',
   'International',
   'EU member state foreign ministries, European External Action Service, P5+1 negotiators, and international law advocates. Favored JCPOA framework and multilateral verification approaches.',
   500000, 0.0006, 78, 72, 75, 40, 65, 80, 66,
   'Economic leverage via trade and sanctions coordination. Institutional power through UN mechanisms and treaty frameworks. Limited independent military capacity but significant diplomatic blocking power.',
   '2026-03-12T00:00:00Z', '2026-03-12T00:00:00Z', 'seed'),

  ('STK-0003',
   'Iranian People / Protest Movement',
   'Population',
   'The protester chant ''Neither Gaza nor Lebanon, I give my life to Iran'' captures this tension. 90 million Iranians, predominantly young and secular. Repeated protest waves (2009, 2019, 2022, Jan 2026). Deeply divided on foreign intervention — oppose both the regime and being bombed.',
   90000000, 1.0, 65, 20, 25, 10, 55, 5, 23,
   'Moral authority and narrative power internationally. Internal power depends on scale of mobilization — Jan 2026 was largest since 1979 but was crushed. No access to institutional or military levers. Diaspora amplifies narrative power externally.',
   '2026-03-12T00:00:00Z', '2026-03-12T00:00:00Z', 'seed'),

  ('STK-0004',
   'Islamic Republic Regime (IRGC / Supreme Leader Office)',
   'Government',
   'Supreme Leader''s office, IRGC leadership, and hardline clerical establishment. Controls all coercive state apparatus, key economic sectors (bonyads), and nuclear program decision-making.',
   150000, 0.0017, 88, 90, 80, 85, 60, 95, 82,
   'Near-total internal control via IRGC, Basij, judiciary. Controls oil revenues and bonyad economic empire. External power through proxy network (Hezbollah, Hamas, Houthis, Iraqi militias). Nuclear deterrence ambition.',
   '2026-03-12T00:00:00Z', '2026-03-12T00:00:00Z', 'seed'),

  ('STK-0005',
   'Gulf Arab States (Saudi Arabia, UAE, Bahrain)',
   'Government',
   'Gulf Cooperation Council members who privately supported military action against Iran''s nuclear program for decades while maintaining public deniability. Now hosting US bases from which Operation Epic Fury is being conducted.',
   45000000, 0.005, 72, 55, 80, 50, 40, 45, 54,
   'Oil market influence and US basing rights. Financial leverage. Vulnerability to Houthi/Iranian retaliatory strikes constrains overt position. Abraham Accords alignment with Israel creates new strategic geometry.',
   '2026-03-12T00:00:00Z', '2026-03-12T00:00:00Z', 'seed'),

  ('STK-0006',
   'Russia and China',
   'International',
   'Permanent UNSC members who have blocked Iran sanctions and provided economic lifelines. Russia received Shahed drones for Ukraine war; China is Iran''s largest oil customer. Both condemned Operation Epic Fury.',
   1600000000, 0.2, 80, 85, 88, 90, 70, 85, 84,
   'UNSC veto power blocks multilateral sanctions. Economic lifelines via oil purchases and technology transfers undercut US maximum pressure. Military aid and diplomatic cover for Iran. Competing with US for regional influence.',
   '2026-03-12T00:00:00Z', '2026-03-12T00:00:00Z', 'seed'),

  ('STK-0007',
   'International Human Rights Community',
   'NGO',
   'Human Rights Watch, Amnesty International, UN Special Rapporteurs, HRANA, and Iranian civil society advocates. Focus on regime accountability, prisoner release, and civilian protection from both regime and military strikes.',
   50000, 0.00007, 75, 30, 10, 0, 72, 40, 30,
   'Narrative power through documentation and media access. Institutional leverage via UN mechanisms (Special Rapporteurs, ICC referral possibilities). No economic or military power. Vulnerable to being sidelined during active conflict.',
   '2026-03-12T00:00:00Z', '2026-03-12T00:00:00Z', 'seed'),

  ('STK-0008',
   'Israeli Government (Netanyahu Coalition)',
   'Government',
   'Israeli security cabinet and IDF leadership. Co-initiator of Operation Epic Fury. Existential interest in preventing Iranian nuclear capability; also domestic political incentives to maintain conflict framing.',
   9500000, 0.001, 84, 70, 45, 80, 65, 60, 64,
   'Advanced military and intelligence capability (Unit 8200, Mossad). Strong Washington lobby via AIPAC and evangelical coalition. Co-author of Operation Epic Fury targeting decisions. Existential security stakes create extreme risk tolerance.',
   '2026-03-12T00:00:00Z', '2026-03-12T00:00:00Z', 'seed'),

  ('STK-0009',
   'US Public / American Voters',
   'Population',
   'Broad American public with diffuse and often inconsistent views on Iran policy. Generally opposed to ground wars but supportive of ''stopping Iran from getting nuclear weapons''. War fatigue from Iraq/Afghanistan dampens appetite for large-scale involvement.',
   260000000, 0.78, 70, 60, 50, 5, 45, 20, 36,
   'Electoral leverage constrains presidential decision-making. Diffuse coordination makes consistent pressure difficult. War fatigue from previous conflicts is a real constraint on sustained military engagement.',
   '2026-03-12T00:00:00Z', '2026-03-12T00:00:00Z', 'seed'),

  ('STK-0010',
   'Iranian Diaspora / Exiled Opposition',
   'Population',
   'Estimated 5 million Iranians abroad, including Crown Prince Reza Pahlavi and organized opposition groups. Divided between those calling for targeted IRGC strikes to hasten regime collapse vs. those opposing foreign military intervention.',
   5000000, 0.05, 60, 35, 30, 5, 65, 20, 31,
   'Narrative amplification through international media and social networks. Some political access in Washington and European capitals. Cannot speak with one voice — deeply divided on intervention question. Limited institutional leverage.',
   '2026-03-12T00:00:00Z', '2026-03-12T00:00:00Z', 'seed');

-- ──────────────────────────────────────────────────────────────
-- INTERESTS
-- ──────────────────────────────────────────────────────────────

INSERT INTO interests (interest_id, name, description, maslow_level, base_validity_score, tags, created_at, updated_at, created_by)
VALUES
  ('INT-001', 'Physical Survival / Existential Security',
   'The most basic interest: not being killed, not having one''s nation destroyed, not facing genocide. Applies to Iranian civilians under military strikes, Israeli citizens under nuclear threat, and Iranian protesters under regime violence.',
   'PHYSIOLOGICAL', 98, ARRAY['universal','iran','israel','war','nuclear'],
   '2026-03-12T00:00:00Z', '2026-03-12T00:00:00Z', 'seed'),

  ('INT-002', 'Nuclear Non-Proliferation',
   'Preventing Iran from acquiring nuclear weapons. A safety-level interest that intersects physiological (mass casualty risk) and safety (regional stability). Independently verifiable via IAEA breakout time metric.',
   'SAFETY', 90, ARRAY['nuclear','iran','nonproliferation','IAEA','security'],
   '2026-03-12T00:00:00Z', '2026-03-12T00:00:00Z', 'seed'),

  ('INT-003', 'Regime Survival (Islamic Republic)',
   'The Islamic Republic leadership''s interest in maintaining power and avoiding regime change. A safety-level interest for the regime itself — legitimate as a human interest (self-preservation) but carries low contextual validity when pursued through oppression and terrorism.',
   'SAFETY', 75, ARRAY['iran-regime','irgc','survival','authoritarian'],
   '2026-03-12T00:00:00Z', '2026-03-12T00:00:00Z', 'seed'),

  ('INT-004', 'Economic Security for Iranian Civilians',
   'The economic welfare of ordinary Iranians — employment, food access, housing, healthcare. Severely damaged by sanctions and by regime mismanagement. A high-validity physiological/safety interest often instrumentalized by both sides.',
   'SAFETY', 88, ARRAY['iran-civilian','sanctions','economic','humanitarian'],
   '2026-03-12T00:00:00Z', '2026-03-12T00:00:00Z', 'seed'),

  ('INT-005', 'Iranian Self-Determination / Democratic Governance',
   'The right of the Iranian people to choose their own government. Expressed through the protest movements (2009 Green Movement, 2019, Women Life Freedom 2022, Jan 2026 uprising). A high-validity belonging/safety interest.',
   'BELONGING', 82, ARRAY['iran-civilian','democracy','human-rights','protest'],
   '2026-03-12T00:00:00Z', '2026-03-12T00:00:00Z', 'seed'),

  ('INT-006', 'Regional Stability / Energy Market Security',
   'Keeping Gulf oil flows uninterrupted and preventing regional wars that destabilize global energy markets and create refugee flows. A safety-level interest shared by European allies, Gulf states, and global economic actors.',
   'SAFETY', 80, ARRAY['energy','regional-stability','europe','gulf','economics'],
   '2026-03-12T00:00:00Z', '2026-03-12T00:00:00Z', 'seed'),

  ('INT-007', 'International Rule of Law / Multilateral Norms',
   'Maintaining the international legal order — UN Charter, jus ad bellum, treaty frameworks — as the governing system for inter-state disputes. Violated by unilateral military action without UNSC authorization.',
   'SAFETY', 76, ARRAY['international-law','UN','sovereignty','multilateral'],
   '2026-03-12T00:00:00Z', '2026-03-12T00:00:00Z', 'seed'),

  ('INT-008', 'Israeli Existential Security',
   'Israel''s interest in not being destroyed. Iran''s stated goal of eliminating Israel and its nuclear weapons pursuit create an existential threat that Israeli security decisions treat as highest priority.',
   'PHYSIOLOGICAL', 96, ARRAY['israel','existential','nuclear','iran-threat'],
   '2026-03-12T00:00:00Z', '2026-03-12T00:00:00Z', 'seed'),

  ('INT-009', 'Regional Hegemony (Iranian Expansionism)',
   'Iran''s interest in becoming the dominant regional power via proxy network (Hezbollah, Hamas, Houthis, Iraqi militias), intimidating Gulf neighbors, and projecting power. An esteem/dominance interest with low contextual validity.',
   'ESTEEM', 35, ARRAY['iran-regime','irgc','proxy','hegemony','regional'],
   '2026-03-12T00:00:00Z', '2026-03-12T00:00:00Z', 'seed'),

  ('INT-010', 'Domestic Political Capital (US Hawks)',
   'The interest of US politicians in appearing strong on national security to satisfy their electoral base — evangelical Christians, pro-Israel donors, and hawkish defense constituencies. An esteem interest that is real but does not automatically justify policy.',
   'ESTEEM', 42, ARRAY['us-politics','domestic','electoral','esteem','israel-lobby'],
   '2026-03-12T00:00:00Z', '2026-03-12T00:00:00Z', 'seed'),

  ('INT-011', 'Deterrence Credibility (US Global Posture)',
   'The US interest in maintaining credible deterrence globally — that threats issued by the US are believed. Allowing Iran to acquire nuclear weapons or cross stated red lines damages this credibility with North Korea, China, and others.',
   'SAFETY', 78, ARRAY['us-security','deterrence','nuclear','global-posture'],
   '2026-03-12T00:00:00Z', '2026-03-12T00:00:00Z', 'seed'),

  ('INT-012', 'Nuclear Proliferation Cascade Prevention',
   'If Iran gets nuclear weapons, Saudi Arabia, Turkey, Egypt, and UAE have each signaled they would pursue their own nuclear programs. The interest in preventing a regional nuclear cascade is broader than just stopping Iran.',
   'SAFETY', 85, ARRAY['nonproliferation','regional','cascade','saudi','turkey'],
   '2026-03-12T00:00:00Z', '2026-03-12T00:00:00Z', 'seed'),

  ('INT-013', 'Avoiding Regime Change Chaos (Iraq/Libya Precedent)',
   'The interest in not repeating the post-2003 Iraq or post-2011 Libya scenarios, where US-led regime change produced failed states and decades of civil war. A safety interest supported by historical evidence.',
   'SAFETY', 82, ARRAY['iraq','libya','regime-change','precedent','post-conflict'],
   '2026-03-12T00:00:00Z', '2026-03-12T00:00:00Z', 'seed'),

  ('INT-014', 'Tribal Winning / Zero-Sum Political Opposition',
   'The interest in ''beating the other side'' regardless of policy merit — opposing Iran deals because Obama supported them, or opposing military action because Trump ordered it. A zero-sum, invalid interest that drives significant behavior.',
   'INVALID', 8, ARRAY['partisan','zero-sum','tribal','invalid','politics'],
   '2026-03-12T00:00:00Z', '2026-03-12T00:00:00Z', 'seed'),

  ('INT-015', 'Russian / Chinese Strategic Counterbalance',
   'Russia and China''s interest in maintaining Iran as a client state and economic partner that counterbalances US influence. Iran provides Russia with drones; China with discounted oil. Both prefer a constrained but surviving Islamic Republic.',
   'SAFETY', 65, ARRAY['russia','china','great-power','strategic','iran'],
   '2026-03-12T00:00:00Z', '2026-03-12T00:00:00Z', 'seed');

-- ──────────────────────────────────────────────────────────────
-- INTEREST SEMANTIC CLUSTERS
-- ──────────────────────────────────────────────────────────────

INSERT INTO interest_semantic_clusters (interest_id, phrase) VALUES
  ('INT-001','survival'), ('INT-001','not being bombed'), ('INT-001','existential security'),
  ('INT-001','not being killed'), ('INT-001','physical safety'), ('INT-001','avoiding genocide'),
  ('INT-001','civilian protection'), ('INT-001','right to life'),

  ('INT-002','stop Iran getting the bomb'), ('INT-002','nuclear nonproliferation'),
  ('INT-002','prevent nuclear weapons'), ('INT-002','nuclear breakout prevention'),
  ('INT-002','IAEA compliance'), ('INT-002','weapons-grade enrichment halt'),
  ('INT-002','no Iranian nuke'), ('INT-002','nuclear threshold state'),

  ('INT-003','regime continuity'), ('INT-003','avoiding regime change'),
  ('INT-003','IRGC institutional survival'), ('INT-003','Khamenei succession'),
  ('INT-003','theocratic system preservation'), ('INT-003','anti-intervention'),

  ('INT-004','Iranian economic welfare'), ('INT-004','sanctions relief for civilians'),
  ('INT-004','rial collapse impact'), ('INT-004','Iranian unemployment'),
  ('INT-004','food security Iran'), ('INT-004','ordinary Iranians suffering'),
  ('INT-004','humanitarian exemptions'), ('INT-004','civilian economic impact'),

  ('INT-005','Iranian democracy'), ('INT-005','regime change by Iranians'),
  ('INT-005','self-determination'), ('INT-005','freedom for Iranians'),
  ('INT-005','women life freedom'), ('INT-005','Iranian protest support'),
  ('INT-005','civil society empowerment'), ('INT-005','political freedom Iran'),

  ('INT-006','Strait of Hormuz open'), ('INT-006','Gulf stability'),
  ('INT-006','oil price stability'), ('INT-006','energy security'),
  ('INT-006','prevent regional war'), ('INT-006','Middle East stability'),
  ('INT-006','spillover prevention'), ('INT-006','refugee crisis prevention'),

  ('INT-007','UN authorization'), ('INT-007','international law'),
  ('INT-007','jus ad bellum'), ('INT-007','sovereignty norms'),
  ('INT-007','multilateralism'), ('INT-007','UNSC approval'),
  ('INT-007','legal basis for war'), ('INT-007','treaty compliance'),

  ('INT-008','Israel survival'), ('INT-008','Iranian nuclear threat to Israel'),
  ('INT-008','existential security Israel'), ('INT-008','prevent second Holocaust'),
  ('INT-008','Iran threatens to wipe Israel off map'), ('INT-008','Israeli right to exist'),
  ('INT-008','Jewish state security'),

  ('INT-009','Iranian regional dominance'), ('INT-009','Shia crescent'),
  ('INT-009','axis of resistance'), ('INT-009','proxy network expansion'),
  ('INT-009','Persian empire aspirations'), ('INT-009','regional hegemony'),
  ('INT-009','IRGC external operations'), ('INT-009','Lebanese Hezbollah funding'),

  ('INT-010','political base management'), ('INT-010','hawkish credibility'),
  ('INT-010','pro-Israel donor relations'), ('INT-010','electoral pressure on Iran'),
  ('INT-010','appearing tough on national security'), ('INT-010','AIPAC influence'),
  ('INT-010','evangelical vote'), ('INT-010','defense contractor interests'),

  ('INT-011','US credibility'), ('INT-011','deterrence signaling'),
  ('INT-011','red line enforcement'), ('INT-011','global deterrence posture'),
  ('INT-011','extended deterrence'), ('INT-011','alliance credibility'),
  ('INT-011','US resolve demonstration'),

  ('INT-012','nuclear cascade'), ('INT-012','Saudi nuclear program'),
  ('INT-012','Turkey nuclear ambitions'), ('INT-012','Middle East proliferation'),
  ('INT-012','nuclear domino effect'), ('INT-012','regional arms race prevention'),

  ('INT-013','Iraq war lessons'), ('INT-013','Libya collapse precedent'),
  ('INT-013','post-conflict governance gap'), ('INT-013','regime change leads to chaos'),
  ('INT-013','failed state prevention'), ('INT-013','reconstruction planning'),
  ('INT-013','day after scenario'), ('INT-013','power vacuum'),

  ('INT-014','partisan opposition'), ('INT-014','reflexive contrarianism'),
  ('INT-014','anti-Obama Iran policy'), ('INT-014','anti-Trump Iran policy'),
  ('INT-014','tribal signaling'), ('INT-014','owning the libs on Iran'),
  ('INT-014','team politics'),

  ('INT-015','Russia Iran partnership'), ('INT-015','China Iran oil'),
  ('INT-015','anti-US axis'), ('INT-015','multipolarity'),
  ('INT-015','blocking US hegemony'), ('INT-015','UNSC veto on Iran'),
  ('INT-015','Shahed drone supply'), ('INT-015','Iranian oil customer');

-- ──────────────────────────────────────────────────────────────
-- CONFLICT
-- ──────────────────────────────────────────────────────────────

INSERT INTO conflicts (conflict_id, name, description, parent_topic,
  spectrum_min, spectrum_max, importance_score, controversy_score, evidence_depth,
  created_at, updated_at, created_by)
VALUES (
  'CFL-001',
  'What posture should democracies adopt toward Iran?',
  'The overarching strategic question: from full engagement and diplomacy to sanctions, opposition support, and military force. 47 years of history provide an empirical record. Now in active-war phase as of Feb 28, 2026 (Operation Epic Fury).',
  'Iran', -100, 100, 96, 92, 'Very High',
  '2026-03-12T00:00:00Z', '2026-03-12T00:00:00Z', 'seed'
);

-- ──────────────────────────────────────────────────────────────
-- STAKEHOLDER–CONFLICT LINKS  (linkedConflictIds)
-- ──────────────────────────────────────────────────────────────

INSERT INTO stakeholder_conflict_links VALUES
  ('STK-0001', 'CFL-001'), ('STK-0001', 'CFL-002'), ('STK-0001', 'CFL-003'),
  ('STK-0002', 'CFL-001'), ('STK-0002', 'CFL-002'),
  ('STK-0003', 'CFL-001'), ('STK-0003', 'CFL-002'), ('STK-0003', 'CFL-003'),
  ('STK-0004', 'CFL-001'), ('STK-0004', 'CFL-002'), ('STK-0004', 'CFL-003'),
  ('STK-0005', 'CFL-001'),
  ('STK-0006', 'CFL-001'), ('STK-0006', 'CFL-002'),
  ('STK-0007', 'CFL-001'), ('STK-0007', 'CFL-003'),
  ('STK-0008', 'CFL-001'), ('STK-0008', 'CFL-002'), ('STK-0008', 'CFL-003'),
  ('STK-0009', 'CFL-001'),
  ('STK-0010', 'CFL-001'), ('STK-0010', 'CFL-003');

-- ──────────────────────────────────────────────────────────────
-- STAKEHOLDER MAPPINGS  (conflict_stakeholder_mappings)
-- ──────────────────────────────────────────────────────────────

INSERT INTO conflict_stakeholder_mappings (conflict_id, stakeholder_id, position, role)
VALUES
  ('CFL-001', 'STK-0001', 'Supporter', 'Maximum Pressure Advocate'),
  ('CFL-001', 'STK-0002', 'Opponent',  'Multilateral Diplomat'),
  ('CFL-001', 'STK-0003', 'Mixed',     'Affected Civilian Population'),
  ('CFL-001', 'STK-0004', 'Opponent',  'Adversarial State Actor'),
  ('CFL-001', 'STK-0006', 'Opponent',  'Great Power Counterbalancer'),
  ('CFL-001', 'STK-0007', 'Mixed',     'Human Rights Monitor'),
  ('CFL-001', 'STK-0008', 'Supporter', 'Co-Belligerent / Existential Risk Actor');

-- ──────────────────────────────────────────────────────────────
-- APPLIED INTERESTS
-- Uses subqueries to get mapping_id without hardcoding SERIAL values.
-- ──────────────────────────────────────────────────────────────

-- STK-0001 × INT-002
INSERT INTO applied_interests (mapping_id, interest_id, linkage_accuracy, percent_motivated, contextual_validity_score, composite_score)
SELECT id, 'INT-002', 88, 0.85, 90, 89 FROM conflict_stakeholder_mappings
WHERE conflict_id = 'CFL-001' AND stakeholder_id = 'STK-0001';

-- STK-0001 × INT-011
INSERT INTO applied_interests (mapping_id, interest_id, linkage_accuracy, percent_motivated, contextual_validity_score, composite_score)
SELECT id, 'INT-011', 78, 0.60, 78, 78 FROM conflict_stakeholder_mappings
WHERE conflict_id = 'CFL-001' AND stakeholder_id = 'STK-0001';

-- STK-0001 × INT-010
INSERT INTO applied_interests (mapping_id, interest_id, linkage_accuracy, percent_motivated, contextual_validity_score, composite_score)
SELECT id, 'INT-010', 70, 0.30, 42, 59 FROM conflict_stakeholder_mappings
WHERE conflict_id = 'CFL-001' AND stakeholder_id = 'STK-0001';

-- STK-0002 × INT-002
INSERT INTO applied_interests (mapping_id, interest_id, linkage_accuracy, percent_motivated, contextual_validity_score, composite_score)
SELECT id, 'INT-002', 85, 0.80, 90, 88 FROM conflict_stakeholder_mappings
WHERE conflict_id = 'CFL-001' AND stakeholder_id = 'STK-0002';

-- STK-0002 × INT-006
INSERT INTO applied_interests (mapping_id, interest_id, linkage_accuracy, percent_motivated, contextual_validity_score, composite_score)
SELECT id, 'INT-006', 82, 0.70, 80, 81 FROM conflict_stakeholder_mappings
WHERE conflict_id = 'CFL-001' AND stakeholder_id = 'STK-0002';

-- STK-0002 × INT-007
INSERT INTO applied_interests (mapping_id, interest_id, linkage_accuracy, percent_motivated, contextual_validity_score, composite_score)
SELECT id, 'INT-007', 88, 0.65, 76, 83 FROM conflict_stakeholder_mappings
WHERE conflict_id = 'CFL-001' AND stakeholder_id = 'STK-0002';

-- STK-0003 × INT-001
INSERT INTO applied_interests (mapping_id, interest_id, linkage_accuracy, percent_motivated, contextual_validity_score, composite_score)
SELECT id, 'INT-001', 95, 0.95, 98, 97 FROM conflict_stakeholder_mappings
WHERE conflict_id = 'CFL-001' AND stakeholder_id = 'STK-0003';

-- STK-0003 × INT-005
INSERT INTO applied_interests (mapping_id, interest_id, linkage_accuracy, percent_motivated, contextual_validity_score, composite_score)
SELECT id, 'INT-005', 78, 0.65, 82, 80 FROM conflict_stakeholder_mappings
WHERE conflict_id = 'CFL-001' AND stakeholder_id = 'STK-0003';

-- STK-0004 × INT-003
INSERT INTO applied_interests (mapping_id, interest_id, linkage_accuracy, percent_motivated, contextual_validity_score, composite_score)
SELECT id, 'INT-003', 95, 0.90, 40, 61 FROM conflict_stakeholder_mappings
WHERE conflict_id = 'CFL-001' AND stakeholder_id = 'STK-0004';

-- STK-0004 × INT-009
INSERT INTO applied_interests (mapping_id, interest_id, linkage_accuracy, percent_motivated, contextual_validity_score, composite_score)
SELECT id, 'INT-009', 88, 0.55, 28, 60 FROM conflict_stakeholder_mappings
WHERE conflict_id = 'CFL-001' AND stakeholder_id = 'STK-0004';

-- STK-0006 × INT-015
INSERT INTO applied_interests (mapping_id, interest_id, linkage_accuracy, percent_motivated, contextual_validity_score, composite_score)
SELECT id, 'INT-015', 92, 0.80, 58, 72 FROM conflict_stakeholder_mappings
WHERE conflict_id = 'CFL-001' AND stakeholder_id = 'STK-0006';

-- STK-0007 × INT-001
INSERT INTO applied_interests (mapping_id, interest_id, linkage_accuracy, percent_motivated, contextual_validity_score, composite_score)
SELECT id, 'INT-001', 90, 0.85, 98, 95 FROM conflict_stakeholder_mappings
WHERE conflict_id = 'CFL-001' AND stakeholder_id = 'STK-0007';

-- STK-0007 × INT-005
INSERT INTO applied_interests (mapping_id, interest_id, linkage_accuracy, percent_motivated, contextual_validity_score, composite_score)
SELECT id, 'INT-005', 85, 0.80, 82, 84 FROM conflict_stakeholder_mappings
WHERE conflict_id = 'CFL-001' AND stakeholder_id = 'STK-0007';

-- STK-0008 × INT-008
INSERT INTO applied_interests (mapping_id, interest_id, linkage_accuracy, percent_motivated, contextual_validity_score, composite_score)
SELECT id, 'INT-008', 96, 0.90, 96, 96 FROM conflict_stakeholder_mappings
WHERE conflict_id = 'CFL-001' AND stakeholder_id = 'STK-0008';

-- ──────────────────────────────────────────────────────────────
-- EVIDENCE  (per applied interest, resolved via double join)
-- ──────────────────────────────────────────────────────────────

INSERT INTO evidence (evidence_id, applied_interest_id, tier, description, url, year, quality_score)
SELECT 'EVD-001', ai.id, 'T2',
  'US intelligence assessments (2018-2025) document Iran''s nuclear acceleration post-JCPOA withdrawal, validating hawks'' proliferation concern as the central stated motivation.',
  'https://www.dni.gov/files/ODNI/documents/assessments/ATA-2024-Unclassified-Report.pdf', 2024, 88
FROM applied_interests ai JOIN conflict_stakeholder_mappings csm ON ai.mapping_id = csm.id
WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0001' AND ai.interest_id = 'INT-002';

INSERT INTO evidence (evidence_id, applied_interest_id, tier, description, url, year, quality_score)
SELECT 'EVD-002', ai.id, 'T4',
  'RAND Corporation analysis (2022) of US deterrence credibility in the Middle East — documents how Iranian nuclear progress damaged US coercive signaling capacity.',
  '', 2022, 75
FROM applied_interests ai JOIN conflict_stakeholder_mappings csm ON ai.mapping_id = csm.id
WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0001' AND ai.interest_id = 'INT-011';

INSERT INTO evidence (evidence_id, applied_interest_id, tier, description, url, year, quality_score)
SELECT 'EVD-003', ai.id, 'T5',
  'Revealed preference: AIPAC donation patterns, evangelical constituency pressure, and defense contractor lobbying correlate with hawkish Iran positions among congressional Iran hawks.',
  '', 2023, 65
FROM applied_interests ai JOIN conflict_stakeholder_mappings csm ON ai.mapping_id = csm.id
WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0001' AND ai.interest_id = 'INT-010';

INSERT INTO evidence (evidence_id, applied_interest_id, tier, description, url, year, quality_score)
SELECT 'EVD-004', ai.id, 'T2',
  'IAEA Board of Governors reports (2015-2018) confirmed 100% Iranian compliance with JCPOA constraints while in force. European position rests on this verified record.',
  'https://www.iaea.org/newscenter/pressreleases/iaea-and-iran-iaea-director-generals-introductory-statement-to-the-board-of-governors', 2018, 92
FROM applied_interests ai JOIN conflict_stakeholder_mappings csm ON ai.mapping_id = csm.id
WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0002' AND ai.interest_id = 'INT-002';

INSERT INTO evidence (evidence_id, applied_interest_id, tier, description, url, year, quality_score)
SELECT 'EVD-005', ai.id, 'T2',
  'European Commission energy security assessments (2024) documented the severe disruption risk from Strait of Hormuz closure — Iran''s response to Operation Epic Fury has now materialized this risk.',
  '', 2024, 80
FROM applied_interests ai JOIN conflict_stakeholder_mappings csm ON ai.mapping_id = csm.id
WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0002' AND ai.interest_id = 'INT-006';

INSERT INTO evidence (evidence_id, applied_interest_id, tier, description, url, year, quality_score)
SELECT 'EVD-006', ai.id, 'T6',
  'European Council on Foreign Relations statement (March 2026) called Operation Epic Fury ''an illegal war of choice'' — documents European rule-of-law position.',
  'https://ecfr.eu', 2026, 68
FROM applied_interests ai JOIN conflict_stakeholder_mappings csm ON ai.mapping_id = csm.id
WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0002' AND ai.interest_id = 'INT-007';

INSERT INTO evidence (evidence_id, applied_interest_id, tier, description, url, year, quality_score)
SELECT 'EVD-007', ai.id, 'T3',
  'Operation Epic Fury civilian casualties: 1,332+ confirmed dead at Day 7 (ICRC, March 2026), including schoolchildren in Ahvaz and Isfahan. Direct evidence of physiological threat to civilian population.',
  '', 2026, 85
FROM applied_interests ai JOIN conflict_stakeholder_mappings csm ON ai.mapping_id = csm.id
WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0003' AND ai.interest_id = 'INT-001';

INSERT INTO evidence (evidence_id, applied_interest_id, tier, description, url, year, quality_score)
SELECT 'EVD-008', ai.id, 'T3',
  'HRANA documentation of Jan 2026 protests: estimated 7,000-43,000 killed. Protest chants (''Neither Gaza nor Lebanon, I give my life to Iran'') capture self-determination demand and simultaneous rejection of foreign intervention.',
  'https://www.hranairan.org', 2026, 75
FROM applied_interests ai JOIN conflict_stakeholder_mappings csm ON ai.mapping_id = csm.id
WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0003' AND ai.interest_id = 'INT-005';

INSERT INTO evidence (evidence_id, applied_interest_id, tier, description, url, year, quality_score)
SELECT 'EVD-009', ai.id, 'T4',
  'Iran International analysis (Jan 2026): ''Bruised But Undeterred'' — documents regime''s core survival-first orientation. Confirms that survival is the dominant strategic motivation even at extreme cost.',
  'https://www.iranintl.com/en/202512241529', 2026, 78
FROM applied_interests ai JOIN conflict_stakeholder_mappings csm ON ai.mapping_id = csm.id
WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0004' AND ai.interest_id = 'INT-003';

INSERT INTO evidence (evidence_id, applied_interest_id, tier, description, url, year, quality_score)
SELECT 'EVD-010', ai.id, 'T2',
  'US Treasury and CRS Reports (2016-2018): After JCPOA sanctions relief, Iran significantly expanded funding to Hezbollah (+$200M/year), Houthi forces, and Iraqi militias. Documents direct correlation between resources and proxy expansion.',
  'https://www.congress.gov/crs-product/R47321', 2018, 82
FROM applied_interests ai JOIN conflict_stakeholder_mappings csm ON ai.mapping_id = csm.id
WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0004' AND ai.interest_id = 'INT-009';

INSERT INTO evidence (evidence_id, applied_interest_id, tier, description, url, year, quality_score)
SELECT 'EVD-011', ai.id, 'T2',
  'Russia-Iran defense cooperation documented: 10,000+ Shahed drones delivered for Ukraine war (IISS, 2024). China: world''s largest buyer of sanctioned Iranian oil (IEA, 2024). Both blocked UNSC Iran sanctions resolutions.',
  '', 2024, 88
FROM applied_interests ai JOIN conflict_stakeholder_mappings csm ON ai.mapping_id = csm.id
WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0006' AND ai.interest_id = 'INT-015';

INSERT INTO evidence (evidence_id, applied_interest_id, tier, description, url, year, quality_score)
SELECT 'EVD-012', ai.id, 'T3',
  'Amnesty International and HRW documented Jan 2026 massacre: estimated 7,000-43,000 killed. Operation Epic Fury civilian casualties 1,332+ at Day 7. NGOs are documenting both.',
  'https://www.amnesty.org/en/countries/middle-east-and-north-africa/iran/', 2026, 82
FROM applied_interests ai JOIN conflict_stakeholder_mappings csm ON ai.mapping_id = csm.id
WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0007' AND ai.interest_id = 'INT-001';

INSERT INTO evidence (evidence_id, applied_interest_id, tier, description, url, year, quality_score)
SELECT 'EVD-013', ai.id, 'T3',
  'Freedom House ''Not Free'' rating for Iran (consistent 2009-2026). Press freedom, political prisoner data, and protest response documentation all validate self-determination as primary NGO focus.',
  'https://freedomhouse.org/country/iran', 2025, 80
FROM applied_interests ai JOIN conflict_stakeholder_mappings csm ON ai.mapping_id = csm.id
WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0007' AND ai.interest_id = 'INT-005';

INSERT INTO evidence (evidence_id, applied_interest_id, tier, description, url, year, quality_score)
SELECT 'EVD-014', ai.id, 'T2',
  'Israeli National Security Council assessments (declassified summaries): Iranian nuclear capability defined as existential threat since 2012. Operation Epic Fury targeting of nuclear facilities confirms this as primary motivation.',
  '', 2025, 85
FROM applied_interests ai JOIN conflict_stakeholder_mappings csm ON ai.mapping_id = csm.id
WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0008' AND ai.interest_id = 'INT-008';

-- ──────────────────────────────────────────────────────────────
-- LINKAGE ARGUMENTS
-- ──────────────────────────────────────────────────────────────

-- STK-0001 × INT-002
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0001' AND applied_interests.interest_id = 'INT-002'
)
INSERT INTO linkage_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'affirming', arg FROM ai,
  (VALUES
    ('Decades-long consistent position predating any particular administration confirms ideological commitment, not mere politics'),
    ('Budget allocations and institutional priorities (missile defense, carrier task forces) align with stated proliferation concern'),
    ('Romney 2006-2012 platform explicitly prioritized nuclear breakout prevention as primary justification')
  ) AS args(arg);

WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0001' AND applied_interests.interest_id = 'INT-002'
)
INSERT INTO linkage_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'challenging', arg FROM ai,
  (VALUES
    ('IRGC designation and proxy network reduction also highly prioritized, suggesting nuclear concern may be pretext for broader regime-change goal'),
    ('Zero-tolerance position on enrichment (even 5% for civilian use) goes beyond nonproliferation to regime-change-level demands')
  ) AS args(arg);

-- STK-0001 × INT-011
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0001' AND applied_interests.interest_id = 'INT-011'
)
INSERT INTO linkage_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'affirming', arg FROM ai,
  (VALUES
    ('Consistent with US strategic doctrine that allowing adversaries to acquire nuclear weapons damages extended deterrence guarantees to allies'),
    ('North Korea and China watch Iran policy closely as a signal of US red-line credibility')
  ) AS args(arg);

WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0001' AND applied_interests.interest_id = 'INT-011'
)
INSERT INTO linkage_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'challenging', arg FROM ai,
  (VALUES ('Deterrence credibility argument can justify virtually any military action and may be post-hoc rationalization')) AS args(arg);

-- STK-0001 × INT-010
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0001' AND applied_interests.interest_id = 'INT-010'
)
INSERT INTO linkage_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'affirming', arg FROM ai,
  (VALUES
    ('Congressional hawks disproportionately represent districts with large pro-Israel donor bases'),
    ('Defense contractor lobbying documented in multiple ethics disclosures')
  ) AS args(arg);

WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0001' AND applied_interests.interest_id = 'INT-010'
)
INSERT INTO linkage_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'challenging', arg FROM ai,
  (VALUES ('Many hawks have ideologically consistent nonproliferation records on other issues (e.g., Pakistan, North Korea) suggesting genuine conviction')) AS args(arg);

-- STK-0002 × INT-002
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0002' AND applied_interests.interest_id = 'INT-002'
)
INSERT INTO linkage_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'affirming', arg FROM ai,
  (VALUES
    ('Europeans maintained INSTEX mechanism to keep JCPOA alive after US withdrawal, demonstrating genuine nonproliferation commitment not mere diplomacy'),
    ('E3 position consistent across conservative and progressive governments in UK, France, Germany')
  ) AS args(arg);

-- STK-0002 × INT-006
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0002' AND applied_interests.interest_id = 'INT-006'
)
INSERT INTO linkage_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'affirming', arg FROM ai,
  (VALUES
    ('Strait of Hormuz closure (now Day 7) validates European energy security concerns as central motivation'),
    ('Germany and Italy import significant shares of Gulf oil — energy market disruption is existential economic concern')
  ) AS args(arg);

-- STK-0002 × INT-007
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0002' AND applied_interests.interest_id = 'INT-007'
)
INSERT INTO linkage_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'affirming', arg FROM ai,
  (VALUES
    ('European legal establishment unanimously opposed the operation on jus ad bellum grounds'),
    ('Consistent with EU legal culture that treats multilateral authorization as prerequisite for force')
  ) AS args(arg);

WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0002' AND applied_interests.interest_id = 'INT-007'
)
INSERT INTO linkage_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'challenging', arg FROM ai,
  (VALUES ('Europeans supported Kosovo intervention (also without UNSC authorization) — rule-of-law position selectively applied')) AS args(arg);

-- STK-0003 × INT-001
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0003' AND applied_interests.interest_id = 'INT-001'
)
INSERT INTO linkage_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'affirming', arg FROM ai,
  (VALUES
    ('Civilian casualty counts are documented and growing — survival interest is self-evidently linked'),
    ('Iranian civilians also face regime violence (7,000-43,000 killed in Jan 2026 protests) — survival interest precedes Operation Epic Fury')
  ) AS args(arg);

-- STK-0003 × INT-005
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0003' AND applied_interests.interest_id = 'INT-005'
)
INSERT INTO linkage_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'affirming', arg FROM ai,
  (VALUES
    ('Repeated protest waves over 17 years demonstrate consistent democratic aspiration that is not externally manufactured'),
    ('Protest organization (Women Life Freedom) explicitly calls for secular democracy — not foreign liberation')
  ) AS args(arg);

WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0003' AND applied_interests.interest_id = 'INT-005'
)
INSERT INTO linkage_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'challenging', arg FROM ai,
  (VALUES
    ('Population is internally divided: some welcome Operation Epic Fury as path to regime change; many oppose foreign military intervention'),
    ('Diaspora voices claiming to speak for Iranians inside Iran may not accurately represent their preferences')
  ) AS args(arg);

-- STK-0004 × INT-003
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0004' AND applied_interests.interest_id = 'INT-003'
)
INSERT INTO linkage_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'affirming', arg FROM ai,
  (VALUES
    ('Every major regime decision (nuclear program continuation, proxy funding, protest suppression) is explicable as survival optimization'),
    ('Regime survived 47 years of pressure, revolution, war — survival as paramount interest has behavioral consistency')
  ) AS args(arg);

-- STK-0004 × INT-009
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0004' AND applied_interests.interest_id = 'INT-009'
)
INSERT INTO linkage_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'affirming', arg FROM ai,
  (VALUES
    ('IRGC-QF budget increases tracked to sanctions relief dollars'),
    ('Consistent doctrine of ''forward defense'' through proxies documented in IRGC publications')
  ) AS args(arg);

WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0004' AND applied_interests.interest_id = 'INT-009'
)
INSERT INTO linkage_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'challenging', arg FROM ai,
  (VALUES ('Regional hegemony interest may be overstated — proxy network partly serves deterrence (survival) rather than expansionism per se')) AS args(arg);

-- STK-0006 × INT-015
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0006' AND applied_interests.interest_id = 'INT-015'
)
INSERT INTO linkage_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'affirming', arg FROM ai,
  (VALUES
    ('Economic and military transactions with Iran are documented and consistent — not rhetoric'),
    ('UNSC veto record on Iran sanctions perfectly tracks strategic interest in keeping US contained')
  ) AS args(arg);

-- STK-0007 × INT-001
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0007' AND applied_interests.interest_id = 'INT-001'
)
INSERT INTO linkage_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'affirming', arg FROM ai,
  (VALUES ('Human rights organizations'' core mandate is civilian protection — linkage to survival interest is definitional')) AS args(arg);

-- STK-0007 × INT-005
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0007' AND applied_interests.interest_id = 'INT-005'
)
INSERT INTO linkage_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'affirming', arg FROM ai,
  (VALUES ('Freedom House scores, Amnesty prisoner counts, and HRW reports all focus on political freedom — consistent linkage')) AS args(arg);

-- STK-0008 × INT-008
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0008' AND applied_interests.interest_id = 'INT-008'
)
INSERT INTO linkage_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'affirming', arg FROM ai,
  (VALUES
    ('Khamenei''s statements calling for elimination of Israel are documented and repeated — linkage to existential threat is not fabricated'),
    ('Iranian proxy attacks (Oct 7 Hamas, Hezbollah rockets) provide behavioral evidence of the threat being real, not theoretical')
  ) AS args(arg);

WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0008' AND applied_interests.interest_id = 'INT-008'
)
INSERT INTO linkage_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'challenging', arg FROM ai,
  (VALUES ('Israeli government has domestic political incentives (Netanyahu legal troubles) that may inflate threat perception')) AS args(arg);

-- ──────────────────────────────────────────────────────────────
-- VALIDITY ARGUMENTS
-- ──────────────────────────────────────────────────────────────

-- STK-0001 × INT-002
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0001' AND applied_interests.interest_id = 'INT-002'
)
INSERT INTO validity_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'for_high_validity', arg FROM ai,
  (VALUES
    ('A nuclear-armed theocratic state that has called for genocide of a neighboring country is a category-1 proliferation risk'),
    ('Nuclear cascade risk: Saudi Arabia, Turkey, UAE have each signaled they would pursue nuclear programs if Iran succeeds')
  ) AS args(arg);

WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0001' AND applied_interests.interest_id = 'INT-002'
)
INSERT INTO validity_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'for_low_validity', arg FROM ai,
  (VALUES ('Maximum pressure period (2018-2025) produced maximum nuclear progress — the policy failed at its stated goal')) AS args(arg);

-- STK-0001 × INT-011
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0001' AND applied_interests.interest_id = 'INT-011'
)
INSERT INTO validity_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'for_high_validity', arg FROM ai,
  (VALUES ('Extended deterrence collapse in one theater demonstrably encourages proliferation elsewhere — North Korea nuclear acceleration coincided with US Iran diplomacy')) AS args(arg);

WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0001' AND applied_interests.interest_id = 'INT-011'
)
INSERT INTO validity_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'for_low_validity', arg FROM ai,
  (VALUES ('US has tolerated nuclear acquisitions by India, Pakistan, North Korea without deterrence collapse — argument may be overstated')) AS args(arg);

-- STK-0001 × INT-010
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0001' AND applied_interests.interest_id = 'INT-010'
)
INSERT INTO validity_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'for_low_validity', arg FROM ai,
  (VALUES ('Electoral base management is esteem-level motivation — legitimate but should not override safety/physiological concerns of Iranian civilians')) AS args(arg);

-- STK-0002 × INT-002
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0002' AND applied_interests.interest_id = 'INT-002'
)
INSERT INTO validity_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'for_high_validity', arg FROM ai,
  (VALUES ('JCPOA achieved verified nuclear constraints that no other policy has matched — empirically the most effective nonproliferation tool applied to Iran')) AS args(arg);

-- STK-0002 × INT-006
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0002' AND applied_interests.interest_id = 'INT-006'
)
INSERT INTO validity_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'for_high_validity', arg FROM ai,
  (VALUES ('Energy security disruption affects hundreds of millions of European civilians — safety-level concern')) AS args(arg);

WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0002' AND applied_interests.interest_id = 'INT-006'
)
INSERT INTO validity_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'for_low_validity', arg FROM ai,
  (VALUES ('Energy security interest can produce appeasement — EU has tolerated regime abuses partly to protect energy supply')) AS args(arg);

-- STK-0002 × INT-007
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0002' AND applied_interests.interest_id = 'INT-007'
)
INSERT INTO validity_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'for_high_validity', arg FROM ai,
  (VALUES ('International legal order is the foundation of European post-WWII security architecture — undermining it creates precedent Russia will use')) AS args(arg);

WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0002' AND applied_interests.interest_id = 'INT-007'
)
INSERT INTO validity_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'for_low_validity', arg FROM ai,
  (VALUES ('A legal framework that protects a genocidal nuclear-threshold state may itself be illegitimate when it blocks protection of others')) AS args(arg);

-- STK-0003 × INT-001
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0003' AND applied_interests.interest_id = 'INT-001'
)
INSERT INTO validity_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'for_high_validity', arg FROM ai,
  (VALUES
    ('Physiological survival is the highest validity interest in the Maslow framework'),
    ('Iranian civilians bear the cost of both the regime''s choices and foreign military action without being the decision-makers')
  ) AS args(arg);

-- STK-0003 × INT-005
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0003' AND applied_interests.interest_id = 'INT-005'
)
INSERT INTO validity_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'for_high_validity', arg FROM ai,
  (VALUES
    ('Self-determination is a foundational human right recognized in UN Charter'),
    ('Iranian people are the intended beneficiaries of both pressure and engagement policies — their actual preference should carry maximal weight')
  ) AS args(arg);

-- STK-0004 × INT-003
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0004' AND applied_interests.interest_id = 'INT-003'
)
INSERT INTO validity_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'for_high_validity', arg FROM ai,
  (VALUES ('Regime survival is a safety-level interest for the individuals involved — 100,000+ IRGC members face execution if regime falls')) AS args(arg);

WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0004' AND applied_interests.interest_id = 'INT-003'
)
INSERT INTO validity_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'for_low_validity', arg FROM ai,
  (VALUES
    ('Regime survival is pursued through the oppression and murder of the Iranian population whose interests are directly opposed'),
    ('Universal application test fails: a world where all regimes prioritize survival over their people''s welfare is catastrophic')
  ) AS args(arg);

-- STK-0004 × INT-009
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0004' AND applied_interests.interest_id = 'INT-009'
)
INSERT INTO validity_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'for_low_validity', arg FROM ai,
  (VALUES
    ('Regional domination through proxy violence fails universal application test: harms hundreds of millions of people across Lebanon, Yemen, Gaza, Iraq'),
    ('Zero-sum domination interest — satisfying it requires others to lose')
  ) AS args(arg);

-- STK-0006 × INT-015
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0006' AND applied_interests.interest_id = 'INT-015'
)
INSERT INTO validity_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'for_high_validity', arg FROM ai,
  (VALUES ('Great-power competition is a structural feature of international relations — having strategic interests is legitimate')) AS args(arg);

WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0006' AND applied_interests.interest_id = 'INT-015'
)
INSERT INTO validity_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'for_low_validity', arg FROM ai,
  (VALUES
    ('Supporting a regime that massacres its citizens and sponsors terrorism as a strategic tool treats human lives as pawns'),
    ('Russia using Iranian drones in Ukraine directly links this interest to civilian casualties in a third country')
  ) AS args(arg);

-- STK-0007 × INT-001
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0007' AND applied_interests.interest_id = 'INT-001'
)
INSERT INTO validity_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'for_high_validity', arg FROM ai,
  (VALUES ('Documenting and preventing civilian deaths is the highest-validity activity any institution can perform')) AS args(arg);

-- STK-0007 × INT-005
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0007' AND applied_interests.interest_id = 'INT-005'
)
INSERT INTO validity_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'for_high_validity', arg FROM ai,
  (VALUES ('Political freedom is a fundamental human right recognized in ICCPR — institutional mandate reflects legitimate global consensus')) AS args(arg);

-- STK-0008 × INT-008
WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0008' AND applied_interests.interest_id = 'INT-008'
)
INSERT INTO validity_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'for_high_validity', arg FROM ai,
  (VALUES ('A nation''s right to prevent its own annihilation is the most fundamental security interest that exists')) AS args(arg);

WITH ai AS (
  SELECT applied_interests.id FROM applied_interests
  JOIN conflict_stakeholder_mappings csm ON applied_interests.mapping_id = csm.id
  WHERE csm.conflict_id = 'CFL-001' AND csm.stakeholder_id = 'STK-0008' AND applied_interests.interest_id = 'INT-008'
)
INSERT INTO validity_arguments (applied_interest_id, direction, argument)
SELECT ai.id, 'for_low_validity', arg FROM ai,
  (VALUES ('Existential security interest does not by itself determine which method of achieving security is justified')) AS args(arg);

-- ──────────────────────────────────────────────────────────────
-- SHARED INTERESTS
-- ──────────────────────────────────────────────────────────────

INSERT INTO shared_interests (conflict_id, interest_id, avg_validity_score)
VALUES
  ('CFL-001', 'INT-002', 90),
  ('CFL-001', 'INT-001', 97),
  ('CFL-001', 'INT-005', 82);

INSERT INTO shared_interest_stakeholders (shared_interest_id, stakeholder_id)
SELECT si.id, stk FROM shared_interests si,
  (VALUES ('STK-0001'),('STK-0002'),('STK-0008')) AS s(stk)
WHERE si.conflict_id = 'CFL-001' AND si.interest_id = 'INT-002';

INSERT INTO shared_interest_stakeholders (shared_interest_id, stakeholder_id)
SELECT si.id, stk FROM shared_interests si,
  (VALUES ('STK-0003'),('STK-0007'),('STK-0009')) AS s(stk)
WHERE si.conflict_id = 'CFL-001' AND si.interest_id = 'INT-001';

INSERT INTO shared_interest_stakeholders (shared_interest_id, stakeholder_id)
SELECT si.id, stk FROM shared_interests si,
  (VALUES ('STK-0001'),('STK-0003'),('STK-0007'),('STK-0010')) AS s(stk)
WHERE si.conflict_id = 'CFL-001' AND si.interest_id = 'INT-005';

-- Bridging proposals for INT-002
INSERT INTO bridging_proposals (shared_interest_id, proposal, created_by)
SELECT si.id, proposal, 'seed' FROM shared_interests si,
  (VALUES
    ('Verified nuclear constraints with intrusive IAEA inspection, regardless of whether achieved via military pressure or negotiated agreement'),
    ('Iranian enrichment capped at 5% (civilian use only) with continuous on-site monitoring as a condition for any sanctions relief'),
    ('Regional nuclear-weapon-free zone offer as part of comprehensive deal framework')
  ) AS p(proposal)
WHERE si.conflict_id = 'CFL-001' AND si.interest_id = 'INT-002';

-- Bridging proposals for INT-001
INSERT INTO bridging_proposals (shared_interest_id, proposal, created_by)
SELECT si.id, proposal, 'seed' FROM shared_interests si,
  (VALUES
    ('Mandatory civilian protection protocols for any military operations, with international monitoring'),
    ('Humanitarian corridors and exemptions maintained regardless of military operations'),
    ('ICRC access to civilian infrastructure under bombardment')
  ) AS p(proposal)
WHERE si.conflict_id = 'CFL-001' AND si.interest_id = 'INT-001';

-- Bridging proposals for INT-005
INSERT INTO bridging_proposals (shared_interest_id, proposal, created_by)
SELECT si.id, proposal, 'seed' FROM shared_interests si,
  (VALUES
    ('Post-conflict transition framework supporting Iranian civil society, not just military opposition'),
    ('Internet freedom and independent media support that empowers Iranians to determine their own future'),
    ('Targeted sanctions on individual IRGC commanders rather than broad population sanctions')
  ) AS p(proposal)
WHERE si.conflict_id = 'CFL-001' AND si.interest_id = 'INT-005';

-- ──────────────────────────────────────────────────────────────
-- EVIDENCE LEDGER
-- ──────────────────────────────────────────────────────────────

INSERT INTO evidence_ledger (evidence_id, conflict_id, claim, side, source, tier, year, quality_score, url, finding)
VALUES
  ('EVD-L001', 'CFL-001',
   'JCPOA verifiably constrained Iran''s nuclear program while in force',
   'pro-engagement', 'IAEA Board of Governors Reports', 'T2', 2018, 92, '',
   'Iran was in verifiable compliance with all JCPOA constraints for the full period the agreement was in force. Uranium stockpile, enrichment levels, and centrifuge numbers all within limits. After US withdrew in 2018, Iran accelerated to 60% then 84% enrichment.'),

  ('EVD-L002', 'CFL-001',
   'Maximum pressure period (2018-2025) produced maximum nuclear progress',
   'pro-engagement', 'IAEA + CFR Iran Timeline', 'T2', 2025, 90, '',
   'Iran was years from nuclear breakout in 2018. By 2025 it had accumulated enough 60-84% enriched uranium to be months from sufficient material for a weapon. Sanctions failed at stated nonproliferation goal.'),

  ('EVD-L003', 'CFL-001',
   'Iran used JCPOA sanctions relief to fund proxy warfare',
   'pro-pressure', 'US Treasury, CRS Reports, RAND Corporation', 'T2', 2018, 82, '',
   'After JCPOA sanctions relief, Iran significantly expanded funding to Hezbollah, Houthi forces, and Iraqi militias. Agreement constrained nuclear program but not regional destabilization.'),

  ('EVD-L004', 'CFL-001',
   'Iraq and Libya precedents: regime change without a plan produces chaos',
   'pro-engagement', 'RAND Corporation, Brookings, CFR', 'T4', 2020, 85, '',
   'US removed Saddam Hussein and Gaddafi without viable post-conflict governance plans. Both countries descended into civil conflict and failed states. Neither became a democracy. Iran is larger and more institutionally complex than either.'),

  ('EVD-L005', 'CFL-001',
   'Economic pressure contributed to protest waves threatening regime stability',
   'pro-pressure', 'HRANA, CFR, Chatham House', 'T4', 2026, 75, '',
   '2019, 2022, and 2025-2026 protest waves all triggered primarily by economic deterioration linked to sanctions. January 2026 uprising was largest since 1979 and nearly toppled the regime.');

COMMIT;

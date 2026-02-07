/**
 * Test Suite for Journal and Study ReasonRank Algorithms
 *
 * This test file validates the ReasonRank scoring algorithms for:
 * 1. Journals - based on impact factor, peer review quality, consistency, etc.
 * 2. Studies - based on citations, journal quality, methodology, replication, etc.
 * 3. JournalStance - tracking journal positions on beliefs
 * 4. StudyStance - tracking study positions on beliefs
 */

// Mock Journal data
const mockJournal = {
  name: 'Nature',
  publisher: 'Springer Nature',
  issn: '0028-0836',
  field: 'multidisciplinary',
  metrics: {
    impactFactor: 42.778,
    fiveYearImpactFactor: 44.019,
    hIndex: 1011,
    citationCount: 8549000,
    acceptanceRate: 8.0,
    retractionRate: 0.02,
    replicationRate: 75.0
  },
  yearFounded: 1869,
  verificationStatus: 'verified',
  networkMetrics: {
    centrality: 0.95,
    citedByJournalsCount: 15000,
    citesJournalsCount: 5000
  }
};

// Mock Study data
const mockStudy = {
  title: 'Machine learning predicts protein structures with AlphaFold2',
  authors: [
    { name: 'John Jumper', affiliation: 'DeepMind' },
    { name: 'Demis Hassabis', affiliation: 'DeepMind' }
  ],
  journal: 'nature-journal-id',
  journalReasonRankScore: 95.5,
  publicationDate: new Date('2021-07-15'),
  studyType: 'experimental-study',
  field: 'biology',
  citationMetrics: {
    citationCount: 15000,
    citationsPerYear: 5000,
    citedByStudies: [],
    references: []
  },
  methodologyMetrics: {
    sampleSize: 350000,
    controlGroup: true,
    randomization: false,
    blinding: 'double-blind',
    pValue: 0.001,
    statisticalPower: 0.95,
    preregistered: true,
    dataAvailable: true,
    codeAvailable: true
  },
  replicationInfo: {
    hasBeenReplicated: true,
    replicationAttempts: 5,
    successfulReplications: 4,
    failedReplications: 1
  },
  networkMetrics: {
    centrality: 0.88,
    pageRankScore: 0.0025
  },
  verificationStatus: 'verified'
};

/**
 * Calculate Journal ReasonRank Score
 *
 * Formula:
 * ReasonRankScore = (
 *   ImpactFactorScore × 0.30 +
 *   PeerReviewQualityScore × 0.25 +
 *   PublicationConsistencyScore × 0.20 +
 *   CitationNetworkScore × 0.15 +
 *   ReplicationScore × 0.10
 * ) × 100
 */
function calculateJournalReasonRank(journal) {
  // 1. Impact Factor Score (30% weight)
  const impactFactorScore = Math.min(journal.metrics.impactFactor / 20, 1.0);
  const fiveYearScore = Math.min(journal.metrics.fiveYearImpactFactor / 20, 1.0);
  const impactScore = (impactFactorScore * 0.6) + (fiveYearScore * 0.4);

  // 2. Peer Review Quality Score (25% weight)
  let peerReviewQuality = 0.5;

  if (journal.metrics.acceptanceRate !== null) {
    const acceptanceScore = Math.max(0, 1 - (journal.metrics.acceptanceRate / 50));
    peerReviewQuality += acceptanceScore * 0.3;
  }

  const retractionScore = Math.max(0, 1 - (journal.metrics.retractionRate / 5));
  peerReviewQuality += retractionScore * 0.2;
  peerReviewQuality = Math.min(peerReviewQuality, 1.0);

  // 3. Publication Consistency Score (20% weight)
  const currentYear = new Date().getFullYear();
  const yearsInOperation = journal.yearFounded ? currentYear - journal.yearFounded : 0;
  const longevityScore = Math.min(yearsInOperation / 50, 1.0);
  const citationScore = Math.min(journal.metrics.citationCount / 10000, 1.0);
  const consistencyScore = (longevityScore * 0.4) + (citationScore * 0.6);

  // 4. Citation Network Score (15% weight)
  const hIndexScore = Math.min(journal.metrics.hIndex / 100, 1.0);
  const centralityScore = journal.networkMetrics.centrality || 0.5;
  const networkScore = (hIndexScore * 0.6) + (centralityScore * 0.4);

  // 5. Replication Score (10% weight)
  const replicationScore = journal.metrics.replicationRate !== null
    ? Math.min(journal.metrics.replicationRate / 70, 1.0)
    : 0.5;

  // Calculate final score
  let reasonRankScore = (
    impactScore * 0.30 +
    peerReviewQuality * 0.25 +
    consistencyScore * 0.20 +
    networkScore * 0.15 +
    replicationScore * 0.10
  ) * 100;

  // Apply verification penalty
  if (journal.verificationStatus === 'disputed') {
    reasonRankScore *= 0.7;
  } else if (journal.verificationStatus === 'predatory') {
    reasonRankScore *= 0.1;
  }

  return {
    reasonRankScore: Math.max(0, Math.min(100, reasonRankScore)),
    components: {
      impactScore,
      peerReviewQuality,
      consistencyScore,
      networkScore,
      replicationScore
    }
  };
}

/**
 * Calculate Study ReasonRank Score
 *
 * Formula:
 * ReasonRankScore = (
 *   CitationImpactScore × 0.30 +
 *   JournalQualityScore × 0.25 +
 *   MethodologicalRigorScore × 0.20 +
 *   ReplicationScore × 0.15 +
 *   NetworkPositionScore × 0.10
 * ) × 100
 */
function calculateStudyReasonRank(study) {
  // 1. Citation Impact Score (30% weight)
  const yearsSincePublication = (Date.now() - study.publicationDate) / (1000 * 60 * 60 * 24 * 365);
  const citationsPerYear = yearsSincePublication > 0
    ? study.citationMetrics.citationCount / yearsSincePublication
    : 0;

  const citationScore = Math.min(study.citationMetrics.citationCount / 100, 1.0);
  const citationsPerYearScore = Math.min(citationsPerYear / 10, 1.0);
  const citationImpactScore = (citationScore * 0.6) + (citationsPerYearScore * 0.4);

  // 2. Journal Quality Score (25% weight)
  const journalQualityScore = study.journalReasonRankScore / 100;

  // 3. Methodological Rigor Score (20% weight)
  let rigorScore = 0;
  let rigorFactors = 0;

  const studyTypeScores = {
    'randomized-controlled-trial': 1.0,
    'meta-analysis': 0.95,
    'systematic-review': 0.9,
    'cohort-study': 0.7,
    'case-control-study': 0.65,
    'cross-sectional-study': 0.6,
    'observational-study': 0.55,
    'experimental-study': 0.75,
    'theoretical-paper': 0.5,
    'review-paper': 0.6,
    'case-report': 0.4,
    'other': 0.5
  };

  rigorScore += studyTypeScores[study.studyType] || 0.5;
  rigorFactors++;

  if (study.methodologyMetrics.sampleSize !== null) {
    rigorFactors++;
    rigorScore += Math.min(study.methodologyMetrics.sampleSize / 1000, 1.0);
  }

  if (study.methodologyMetrics.controlGroup !== null) {
    rigorFactors++;
    rigorScore += study.methodologyMetrics.controlGroup ? 1.0 : 0.3;
  }

  if (study.methodologyMetrics.randomization !== null) {
    rigorFactors++;
    rigorScore += study.methodologyMetrics.randomization ? 1.0 : 0.3;
  }

  if (study.methodologyMetrics.blinding) {
    rigorFactors++;
    const blindingScores = {
      'none': 0.2,
      'single-blind': 0.6,
      'double-blind': 0.9,
      'triple-blind': 1.0
    };
    rigorScore += blindingScores[study.methodologyMetrics.blinding] || 0.2;
  }

  if (study.methodologyMetrics.pValue !== null) {
    rigorFactors++;
    rigorScore += study.methodologyMetrics.pValue < 0.05 ? 1.0 : 0.3;
  }

  if (study.methodologyMetrics.statisticalPower !== null) {
    rigorFactors++;
    rigorScore += study.methodologyMetrics.statisticalPower >= 0.8 ? 1.0 : study.methodologyMetrics.statisticalPower;
  }

  if (study.methodologyMetrics.preregistered) {
    rigorFactors++;
    rigorScore += 1.0;
  }

  if (study.methodologyMetrics.dataAvailable) {
    rigorFactors++;
    rigorScore += 1.0;
  }

  if (study.methodologyMetrics.codeAvailable) {
    rigorFactors++;
    rigorScore += 1.0;
  }

  const methodologicalRigorScore = rigorFactors > 0 ? rigorScore / rigorFactors : 0.5;

  // 4. Replication Score (15% weight)
  const totalAttempts = study.replicationInfo.replicationAttempts || 0;
  const successful = study.replicationInfo.successfulReplications || 0;

  let replicationScore = 0.5;
  if (totalAttempts > 0) {
    const replicationRate = successful / totalAttempts;
    replicationScore = Math.min(replicationRate / 0.7, 1.0);
  } else if (study.replicationInfo.hasBeenReplicated) {
    replicationScore = 0.7;
  }

  // 5. Network Position Score (10% weight)
  const centralityScore = study.networkMetrics.centrality || 0;
  const pageRankScore = study.networkMetrics.pageRankScore || 0;
  const networkPositionScore = (centralityScore * 0.6) + (pageRankScore * 0.4);

  // Calculate final score
  let reasonRankScore = (
    citationImpactScore * 0.30 +
    journalQualityScore * 0.25 +
    methodologicalRigorScore * 0.20 +
    replicationScore * 0.15 +
    networkPositionScore * 0.10
  ) * 100;

  // Apply verification penalty
  if (study.verificationStatus === 'disputed') {
    reasonRankScore *= 0.5;
  } else if (study.verificationStatus === 'retracted') {
    reasonRankScore *= 0.1;
  }

  // Apply recency bonus
  if (yearsSincePublication < 2) {
    const recencyBonus = (2 - yearsSincePublication) * 0.05;
    reasonRankScore *= (1 + recencyBonus);
  }

  return {
    reasonRankScore: Math.max(0, Math.min(100, reasonRankScore)),
    components: {
      citationImpactScore,
      journalQualityScore,
      methodologicalRigorScore,
      replicationScore,
      networkPositionScore
    }
  };
}

/**
 * Calculate JournalStance Strength
 *
 * Formula:
 * StanceStrength = (
 *   JournalReasonRankScore × 0.40 +
 *   AverageStudyQuality × 0.30 +
 *   StudyCountScore × 0.20 +
 *   ConsistencyScore × 0.10
 * )
 */
function calculateJournalStanceStrength(journalScore, averageStudyQuality, studyCount, supportingCount, opposingCount, neutralCount) {
  // Study count score
  const studyCountScore = Math.min(studyCount / 10, 1.0) * 100;

  // Consistency score (entropy-based)
  const total = supportingCount + opposingCount + neutralCount;
  let consistencyScore = 0.5;

  if (total > 0) {
    const supportingRatio = supportingCount / total;
    const opposingRatio = opposingCount / total;
    const neutralRatio = neutralCount / total;

    let entropy = 0;
    if (supportingRatio > 0) entropy -= supportingRatio * Math.log2(supportingRatio);
    if (opposingRatio > 0) entropy -= opposingRatio * Math.log2(opposingRatio);
    if (neutralRatio > 0) entropy -= neutralRatio * Math.log2(neutralRatio);

    consistencyScore = 1 - (entropy / 1.585);
  }

  const stanceStrength = (
    journalScore * 0.40 +
    averageStudyQuality * 0.30 +
    studyCountScore * 0.20 +
    consistencyScore * 100 * 0.10
  );

  return {
    stanceStrength: Math.max(0, Math.min(100, stanceStrength)),
    components: {
      journalContribution: journalScore * 0.40,
      studyQualityContribution: averageStudyQuality * 0.30,
      studyCountContribution: studyCountScore * 0.20,
      consistencyContribution: consistencyScore * 100 * 0.10,
      consistencyScore
    }
  };
}

/**
 * Run Tests
 */
function runTests() {
  console.log('='.repeat(80));
  console.log('Journal and Study ReasonRank Algorithm Tests');
  console.log('='.repeat(80));
  console.log('');

  // Test 1: Journal ReasonRank
  console.log('Test 1: Journal ReasonRank Calculation');
  console.log('-'.repeat(80));
  console.log('Journal:', mockJournal.name);
  console.log('Impact Factor:', mockJournal.metrics.impactFactor);
  console.log('Acceptance Rate:', mockJournal.metrics.acceptanceRate + '%');
  console.log('Years in Operation:', new Date().getFullYear() - mockJournal.yearFounded);
  console.log('');

  const journalResult = calculateJournalReasonRank(mockJournal);
  console.log('ReasonRank Score:', journalResult.reasonRankScore.toFixed(2));
  console.log('Component Breakdown:');
  console.log('  - Impact Factor (30%):', (journalResult.components.impactScore * 30).toFixed(2));
  console.log('  - Peer Review (25%):', (journalResult.components.peerReviewQuality * 25).toFixed(2));
  console.log('  - Consistency (20%):', (journalResult.components.consistencyScore * 20).toFixed(2));
  console.log('  - Network (15%):', (journalResult.components.networkScore * 15).toFixed(2));
  console.log('  - Replication (10%):', (journalResult.components.replicationScore * 10).toFixed(2));
  console.log('');

  // Validate
  const expectedJournalScore = 90;
  const journalPass = Math.abs(journalResult.reasonRankScore - expectedJournalScore) < 10;
  console.log(`✓ Journal Score Test: ${journalPass ? 'PASS' : 'FAIL'}`);
  console.log(`  Expected: ~${expectedJournalScore}, Got: ${journalResult.reasonRankScore.toFixed(2)}`);
  console.log('');

  // Test 2: Study ReasonRank
  console.log('Test 2: Study ReasonRank Calculation');
  console.log('-'.repeat(80));
  console.log('Study:', mockStudy.title);
  console.log('Citations:', mockStudy.citationMetrics.citationCount);
  console.log('Study Type:', mockStudy.studyType);
  console.log('Sample Size:', mockStudy.methodologyMetrics.sampleSize);
  console.log('Replications:', `${mockStudy.replicationInfo.successfulReplications}/${mockStudy.replicationInfo.replicationAttempts}`);
  console.log('');

  const studyResult = calculateStudyReasonRank(mockStudy);
  console.log('ReasonRank Score:', studyResult.reasonRankScore.toFixed(2));
  console.log('Component Breakdown:');
  console.log('  - Citation Impact (30%):', (studyResult.components.citationImpactScore * 30).toFixed(2));
  console.log('  - Journal Quality (25%):', (studyResult.components.journalQualityScore * 25).toFixed(2));
  console.log('  - Methodology (20%):', (studyResult.components.methodologicalRigorScore * 20).toFixed(2));
  console.log('  - Replication (15%):', (studyResult.components.replicationScore * 15).toFixed(2));
  console.log('  - Network (10%):', (studyResult.components.networkPositionScore * 10).toFixed(2));
  console.log('');

  // Validate
  const expectedStudyScore = 85;
  const studyPass = Math.abs(studyResult.reasonRankScore - expectedStudyScore) < 15;
  console.log(`✓ Study Score Test: ${studyPass ? 'PASS' : 'FAIL'}`);
  console.log(`  Expected: ~${expectedStudyScore}, Got: ${studyResult.reasonRankScore.toFixed(2)}`);
  console.log('');

  // Test 3: JournalStance Strength
  console.log('Test 3: JournalStance Strength Calculation');
  console.log('-'.repeat(80));
  console.log('Journal Score:', journalResult.reasonRankScore.toFixed(2));
  console.log('Average Study Quality: 82.5');
  console.log('Studies: 8 supporting, 2 opposing, 0 neutral');
  console.log('');

  const stanceResult = calculateJournalStanceStrength(
    journalResult.reasonRankScore,
    82.5,
    10,
    8,
    2,
    0
  );
  console.log('Stance Strength:', stanceResult.stanceStrength.toFixed(2));
  console.log('Component Breakdown:');
  console.log('  - Journal Quality (40%):', stanceResult.components.journalContribution.toFixed(2));
  console.log('  - Study Quality (30%):', stanceResult.components.studyQualityContribution.toFixed(2));
  console.log('  - Study Count (20%):', stanceResult.components.studyCountContribution.toFixed(2));
  console.log('  - Consistency (10%):', stanceResult.components.consistencyContribution.toFixed(2));
  console.log('  - Consistency Score:', (stanceResult.components.consistencyScore * 100).toFixed(2) + '%');
  console.log('');

  // Validate
  const expectedStanceStrength = 88;
  const stancePass = Math.abs(stanceResult.stanceStrength - expectedStanceStrength) < 10;
  console.log(`✓ Stance Strength Test: ${stancePass ? 'PASS' : 'FAIL'}`);
  console.log(`  Expected: ~${expectedStanceStrength}, Got: ${stanceResult.stanceStrength.toFixed(2)}`);
  console.log('');

  // Summary
  console.log('='.repeat(80));
  console.log('Test Summary');
  console.log('='.repeat(80));
  const allPass = journalPass && studyPass && stancePass;
  console.log(`Overall: ${allPass ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);
  console.log('');

  // Additional validations
  console.log('Additional Validations:');
  console.log('- Journal scores are bounded [0, 100]:', journalResult.reasonRankScore >= 0 && journalResult.reasonRankScore <= 100 ? '✓' : '✗');
  console.log('- Study scores are bounded [0, 100]:', studyResult.reasonRankScore >= 0 && studyResult.reasonRankScore <= 100 ? '✓' : '✗');
  console.log('- Stance strength is bounded [0, 100]:', stanceResult.stanceStrength >= 0 && stanceResult.stanceStrength <= 100 ? '✓' : '✗');
  console.log('- High-impact journal gets high score:', journalResult.reasonRankScore > 85 ? '✓' : '✗');
  console.log('- High-citation study gets high score:', studyResult.reasonRankScore > 75 ? '✓' : '✗');
  console.log('');
}

// Run the tests
runTests();

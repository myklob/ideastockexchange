// Test the new PageRank-style algorithm
// This verifies that supporting arguments ADD and opposing arguments SUBTRACT

function testPageRankAlgorithm() {
  console.log('Testing PageRank-style Belief Score Algorithm\n');
  console.log('='.repeat(60));

  // Test Case 1: Strong supporting, weak opposing
  console.log('\nTest 1: Strong supporting arguments, weak opposing arguments');
  console.log('Expected: High score (should be > 70)');

  const test1Supporting = [
    { reasonRank: 85, lifecycleStatus: 'active' },
    { reasonRank: 72, lifecycleStatus: 'active' },
    { reasonRank: 68, lifecycleStatus: 'weakened' }
  ];

  const test1Opposing = [
    { reasonRank: 45, lifecycleStatus: 'active' },
    { reasonRank: 52, lifecycleStatus: 'weakened' }
  ];

  const score1 = calculateBeliefScore(test1Supporting, test1Opposing);
  console.log(`Result: ${score1}/100`);
  console.log(`Status: ${score1 > 70 ? '✓ PASS' : '✗ FAIL'}`);

  // Test Case 2: Weak supporting, strong opposing
  console.log('\nTest 2: Weak supporting arguments, strong opposing arguments');
  console.log('Expected: Low score (should be < 30)');

  const test2Supporting = [
    { reasonRank: 30, lifecycleStatus: 'weakened' },
    { reasonRank: 25, lifecycleStatus: 'active' }
  ];

  const test2Opposing = [
    { reasonRank: 85, lifecycleStatus: 'active' },
    { reasonRank: 90, lifecycleStatus: 'active' },
    { reasonRank: 78, lifecycleStatus: 'active' }
  ];

  const score2 = calculateBeliefScore(test2Supporting, test2Opposing);
  console.log(`Result: ${score2}/100`);
  console.log(`Status: ${score2 < 30 ? '✓ PASS' : '✗ FAIL'}`);

  // Test Case 3: No arguments
  console.log('\nTest 3: No arguments');
  console.log('Expected: Neutral score (should be 50)');

  const score3 = calculateBeliefScore([], []);
  console.log(`Result: ${score3}/100`);
  console.log(`Status: ${score3 === 50 ? '✓ PASS' : '✗ FAIL'}`);

  // Test Case 4: Equal quality and quantity
  console.log('\nTest 4: Equal quality and quantity on both sides');
  console.log('Expected: Neutral score (should be ~50)');

  const test4Supporting = [
    { reasonRank: 70, lifecycleStatus: 'active' },
    { reasonRank: 65, lifecycleStatus: 'active' }
  ];

  const test4Opposing = [
    { reasonRank: 68, lifecycleStatus: 'active' },
    { reasonRank: 67, lifecycleStatus: 'active' }
  ];

  const score4 = calculateBeliefScore(test4Supporting, test4Opposing);
  console.log(`Result: ${score4}/100`);
  console.log(`Status: ${Math.abs(score4 - 50) < 5 ? '✓ PASS' : '✗ FAIL'}`);

  console.log('\n' + '='.repeat(60));
  console.log('All tests completed!\n');
}

function calculateBeliefScore(supportingArgs, opposingArgs) {
  const baseScore = 50;

  const lifecycleMultipliers = {
    'active': 1.0,
    'weakened': 0.7,
    'conditional': 0.8,
    'outdated': 0.3,
    'refuted': 0.1
  };

  const calculateWeightedScore = (args) => {
    if (args.length === 0) return 0;

    return args.reduce((sum, arg) => {
      const reasonRank = arg.reasonRank || 50;
      const lifecycleMultiplier = lifecycleMultipliers[arg.lifecycleStatus || 'active'];
      return sum + (reasonRank * lifecycleMultiplier);
    }, 0);
  };

  const supportingWeightedScore = calculateWeightedScore(supportingArgs);
  const opposingWeightedScore = calculateWeightedScore(opposingArgs);

  const totalArgs = supportingArgs.length + opposingArgs.length;

  if (totalArgs === 0) {
    return 50; // Neutral if no arguments
  }

  // Calculate average scores
  const supportingAvg = supportingArgs.length > 0
    ? supportingWeightedScore / supportingArgs.length
    : 0;

  const opposingAvg = opposingArgs.length > 0
    ? opposingWeightedScore / opposingArgs.length
    : 0;

  // PageRank formula: Base + Σ(supporting scores) - Σ(opposing scores)
  const supportingContribution = supportingAvg * (supportingArgs.length / totalArgs);
  const opposingContribution = opposingAvg * (opposingArgs.length / totalArgs);

  // Supporting arguments ADD to score, opposing arguments SUBTRACT from score
  const conclusionScore = Math.round(
    baseScore + supportingContribution - opposingContribution
  );

  // Ensure score is in valid range [0, 100]
  return Math.max(0, Math.min(100, conclusionScore));
}

// Run tests
testPageRankAlgorithm();

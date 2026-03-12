import React from 'react';
import { HelpCircle } from 'lucide-react';

const ScoreBreakdown = ({ belief, arguments: args = [] }) => {
  // Calculate component scores from arguments
  const calculateComponentScores = () => {
    if (!args || args.length === 0) {
      return {
        ES: 50, // Evidence Strength
        LC: 50, // Logical Coherence
        VC: 50, // Verification Credibility
        LR: 50, // Linkage Relevance
        UD: 50, // Uniqueness
        AI: 50  // Argument Importance
      };
    }

    const avgScore = (field) => {
      const scores = args.map(arg => arg.scores?.[field] || 0.5).filter(s => s > 0);
      if (scores.length === 0) return 50;
      return (scores.reduce((a, b) => a + b, 0) / scores.length) * 100;
    };

    return {
      ES: avgScore('evidenceStrength'),
      LC: avgScore('logicalCoherence'),
      VC: avgScore('verificationCredibility'),
      LR: avgScore('linkageRelevance'),
      UD: avgScore('uniqueness'),
      AI: avgScore('argumentImportance')
    };
  };

  const scores = calculateComponentScores();

  const components = [
    {
      key: 'ES',
      label: 'Evidence Strength',
      value: scores.ES,
      description: 'Quality and credibility of supporting evidence',
      color: 'blue'
    },
    {
      key: 'LC',
      label: 'Logical Coherence',
      value: scores.LC,
      description: 'Absence of logical fallacies and sound reasoning',
      color: 'purple'
    },
    {
      key: 'VC',
      label: 'Verification Credibility',
      value: scores.VC,
      description: 'Percentage of evidence that has been verified',
      color: 'green'
    },
    {
      key: 'LR',
      label: 'Linkage Relevance',
      value: scores.LR,
      description: 'How directly arguments relate to the conclusion',
      color: 'yellow'
    },
    {
      key: 'UD',
      label: 'Uniqueness',
      value: scores.UD,
      description: 'Diversity of arguments without redundancy',
      color: 'pink'
    },
    {
      key: 'AI',
      label: 'Argument Importance',
      value: scores.AI,
      description: 'Weighted impact of each argument on the conclusion',
      color: 'indigo'
    }
  ];

  const getColorClasses = (color, value) => {
    const intensity = value >= 70 ? '600' : value >= 40 ? '500' : '400';
    return {
      bg: `bg-${color}-${intensity}`,
      text: `text-${color}-700`,
      bgLight: `bg-${color}-50`,
      border: `border-${color}-200`
    };
  };

  const getConclusionScoreColor = (score) => {
    if (score >= 70) return 'from-green-500 to-green-600';
    if (score >= 40) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Score Breakdown</h2>

      {/* Main Conclusion Score */}
      <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              Conclusion Score (CS)
            </h3>
            <p className="text-sm text-gray-600">
              Overall strength of this belief
            </p>
          </div>
          <div className={`text-6xl font-bold bg-gradient-to-br ${getConclusionScoreColor(belief.conclusionScore)} bg-clip-text text-transparent`}>
            {Math.round(belief.conclusionScore)}
          </div>
        </div>

        {/* Formula Display */}
        <div className="mt-4 p-3 bg-white rounded text-sm font-mono text-gray-700">
          CS = Σ((RtA - RtD) × ES × LC × VC × LR × UD × AI)
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-4">
        {components.map((component) => (
          <div key={component.key} className="border-b border-gray-200 pb-4 last:border-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-gray-800">{component.label}</h4>
                <div className="group relative">
                  <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  <div className="absolute left-0 top-6 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    {component.description}
                  </div>
                </div>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {Math.round(component.value)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${
                  component.value >= 70
                    ? `from-green-400 to-green-600`
                    : component.value >= 40
                    ? `from-yellow-400 to-yellow-600`
                    : `from-red-400 to-red-600`
                } transition-all duration-500`}
                style={{ width: `${component.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Statistics Summary */}
      <div className="mt-6 grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {belief.statistics?.supportingCount || 0}
          </div>
          <div className="text-sm text-gray-600">Supporting Arguments</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {belief.statistics?.opposingCount || 0}
          </div>
          <div className="text-sm text-gray-600">Opposing Arguments</div>
        </div>
      </div>
    </div>
  );
};

export default ScoreBreakdown;

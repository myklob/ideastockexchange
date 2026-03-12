import React, { useState, useEffect } from 'react';
import { HelpCircle, TrendingUp, Users, Shield, Target, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/api';

/**
 * ConfidenceIntervalDisplay Component
 *
 * Displays the confidence interval (CI) for a belief score
 * CI = 0-100 measure of how much we can trust the belief's score
 *
 * High CI (85-100): Score is reliable and stable
 * Moderate CI (50-84): Score may change with more evaluation
 * Low CI (0-49): Score is unreliable, needs more review
 */
const ConfidenceIntervalDisplay = ({ beliefId }) => {
  const [ci, setCI] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    if (beliefId) {
      fetchCI();
    }
  }, [beliefId]);

  const fetchCI = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch CI data
      const response = await api.get(`/api/beliefs/${beliefId}/confidence-interval`);
      setCI(response.data.data);

      // Fetch detailed breakdown
      const breakdownResponse = await api.get(`/api/beliefs/${beliefId}/confidence-interval/breakdown`);
      setBreakdown(breakdownResponse.data.data);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching CI:', err);

      // If CI doesn't exist yet, that's okay - we'll show a message
      if (err.response?.status === 404) {
        setError('Confidence interval not yet calculated for this belief.');
      } else {
        setError('Failed to load confidence interval data');
      }
      setLoading(false);
    }
  };

  const getConfidenceLevelColor = (level) => {
    switch (level) {
      case 'high':
        return 'green';
      case 'moderate':
        return 'yellow';
      case 'low':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getConfidenceLevelBg = (level) => {
    switch (level) {
      case 'high':
        return 'bg-green-100 border-green-500 text-green-900';
      case 'moderate':
        return 'bg-yellow-100 border-yellow-500 text-yellow-900';
      case 'low':
        return 'bg-red-100 border-red-500 text-red-900';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-900';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">{error}</p>
        <p className="text-yellow-600 text-xs mt-2">
          The confidence interval will be calculated automatically as users review this belief.
        </p>
      </div>
    );
  }

  if (!ci || !breakdown) {
    return null;
  }

  const { overall, factors, explanations } = breakdown;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className={`border-l-4 p-6 ${getConfidenceLevelBg(overall.confidenceLevel)}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Confidence in Score
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{overall.ciScore.toFixed(1)}</span>
            <span className="text-sm">/ 100</span>
          </div>
        </div>

        {/* Confidence Level Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium uppercase tracking-wide">
            {overall.confidenceLevel} Confidence
          </span>
        </div>

        {/* Interpretation */}
        <p className="text-sm">{overall.interpretation}</p>

        {/* Max CI Cap Warning */}
        {overall.maxCICap < 100 && (
          <div className="mt-3 text-xs bg-white bg-opacity-50 rounded px-3 py-2">
            ⚠️ Maximum confidence capped at {overall.maxCICap} due to belief knowability
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="px-6 pt-4">
        <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              overall.confidenceLevel === 'high'
                ? 'bg-green-500'
                : overall.confidenceLevel === 'moderate'
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(overall.ciScore, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0 (Unreliable)</span>
          <span>50 (Moderate)</span>
          <span>100 (Highly Reliable)</span>
        </div>
      </div>

      {/* Explanations */}
      {explanations && explanations.length > 0 && (
        <div className="px-6 py-4 bg-gray-50">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
            <HelpCircle className="w-4 h-4" />
            Key Factors
          </h4>
          <ul className="space-y-1">
            {explanations.map((exp, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{exp.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Toggle Breakdown */}
      <div className="px-6 py-3 border-t border-gray-200">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full flex items-center justify-between text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          <span>View Detailed Breakdown</span>
          {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Detailed Breakdown */}
      {showBreakdown && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 space-y-4">
          {/* Factor 1: User Examination */}
          <FactorCard
            icon={<Users className="w-5 h-5" />}
            title="User Examination Depth"
            score={factors.userExamination.score}
            weight={factors.userExamination.weight}
            contribution={factors.userExamination.weightedContribution}
            color="blue"
            metrics={[
              {
                label: 'Unique Readers',
                value: factors.userExamination.metrics.uniqueVerifiedReaders,
              },
              {
                label: 'Total Reading Time',
                value: `${factors.userExamination.metrics.totalReadingTime.toFixed(0)} min`,
              },
              {
                label: 'Arguments Evaluated',
                value: factors.userExamination.metrics.argumentsEvaluated,
              },
              {
                label: 'Expert Reviews',
                value: factors.userExamination.metrics.expertReviews,
              },
            ]}
            description="How thoroughly verified users have examined this belief"
          />

          {/* Factor 2: Score Stability */}
          <FactorCard
            icon={<TrendingUp className="w-5 h-5" />}
            title="Score Stability"
            score={factors.scoreStability.score}
            weight={factors.scoreStability.weight}
            contribution={factors.scoreStability.weightedContribution}
            color="green"
            metrics={[
              {
                label: '30-Day Std Dev',
                value: factors.scoreStability.metrics.last30DaysStdDev.toFixed(1),
              },
              {
                label: '30-Day Range',
                value: factors.scoreStability.metrics.last30DaysRange.toFixed(1),
              },
              {
                label: 'Volatility Index',
                value: (factors.scoreStability.metrics.scoreVolatility * 100).toFixed(0) + '%',
              },
              {
                label: 'Days Since Major Change',
                value: factors.scoreStability.metrics.daysSinceLastMajorChange,
              },
            ]}
            description="How stable the score remains despite ongoing review"
          />

          {/* Factor 3: Knowability */}
          <FactorCard
            icon={<Target className="w-5 h-5" />}
            title="Knowability"
            score={factors.knowability.score}
            weight={factors.knowability.weight}
            contribution={factors.knowability.weightedContribution}
            color="purple"
            metrics={[
              {
                label: 'Category',
                value: `${factors.knowability.metrics.category} - ${factors.knowability.metrics.categoryLabel.replace(/_/g, ' ')}`,
              },
              {
                label: 'Max CI Cap',
                value: factors.knowability.metrics.maxCICap,
              },
              {
                label: 'Tier 1 Evidence',
                value: factors.knowability.metrics.evidenceTiers.tier1,
              },
              {
                label: 'Tier 2 Evidence',
                value: factors.knowability.metrics.evidenceTiers.tier2,
              },
            ]}
            description={factors.knowability.metrics.categoryDescription}
          />

          {/* Factor 4: Challenge Resistance */}
          <FactorCard
            icon={<Shield className="w-5 h-5" />}
            title="Challenge Resistance"
            score={factors.challengeResistance.score}
            weight={factors.challengeResistance.weight}
            contribution={factors.challengeResistance.weightedContribution}
            color="red"
            metrics={[
              {
                label: 'Total Challenges',
                value: factors.challengeResistance.metrics.totalChallengeAttempts,
              },
              {
                label: 'Redundancy Ratio',
                value: (factors.challengeResistance.metrics.redundancyRatio * 100).toFixed(0) + '%',
              },
              {
                label: 'Successful Challenges',
                value: factors.challengeResistance.metrics.challengesThatChangedScore,
              },
              {
                label: 'Days Since Last Success',
                value: factors.challengeResistance.metrics.daysSinceLastSuccessfulChallenge,
              },
            ]}
            description="How well the belief resists attempts to overturn it"
          />
        </div>
      )}
    </div>
  );
};

// Factor Card Component
const FactorCard = ({ icon, title, score, weight, contribution, color, metrics, description }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    red: 'text-red-600 bg-red-50',
  };

  const barColors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded ${colorClasses[color]}`}>{icon}</div>
          <div>
            <h4 className="font-semibold text-sm">{title}</h4>
            <p className="text-xs text-gray-500">Weight: {(weight * 100).toFixed(0)}%</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{score.toFixed(1)}</div>
          <div className="text-xs text-gray-500">
            Contributes: {contribution.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColors[color]} transition-all duration-500`}
            style={{ width: `${Math.min(score, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-600 mb-3">{description}</p>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((metric, idx) => (
          <div key={idx} className="text-xs">
            <div className="text-gray-500">{metric.label}</div>
            <div className="font-semibold">{metric.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConfidenceIntervalDisplay;

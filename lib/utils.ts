import { AbstractionLevel, IntensityLevel, ValenceType, Belief } from '@/types';

export function getAbstractionLabel(level: AbstractionLevel): string {
  const labels: Record<AbstractionLevel, string> = {
    most_general: 'Most General',
    general: 'General',
    specific: 'Specific',
    most_specific: 'Most Specific',
  };
  return labels[level];
}

export function getIntensityLabel(level: IntensityLevel): string {
  const labels: Record<IntensityLevel, string> = {
    modest: 'Modest',
    moderate: 'Moderate',
    strong: 'Strong',
    extreme: 'Extreme',
  };
  return labels[level];
}

export function getValenceLabel(valence: ValenceType): string {
  const labels: Record<ValenceType, string> = {
    strongly_negative: 'Strongly Negative',
    moderately_negative: 'Moderately Negative',
    neutral: 'Neutral/Mixed',
    moderately_positive: 'Moderately Positive',
    strongly_positive: 'Strongly Positive',
  };
  return labels[valence];
}

export function getValenceColor(valence: ValenceType): string {
  const colors: Record<ValenceType, string> = {
    strongly_negative: 'bg-red-200 text-red-900',
    moderately_negative: 'bg-red-100 text-red-800',
    neutral: 'bg-yellow-100 text-yellow-900',
    moderately_positive: 'bg-green-100 text-green-800',
    strongly_positive: 'bg-green-200 text-green-900',
  };
  return colors[valence];
}

export function sortBeliefsByAbstraction(beliefs: Belief[]): Belief[] {
  return [...beliefs].sort((a, b) => a.hierarchyDepth - b.hierarchyDepth);
}

export function sortBeliefsByIntensity(beliefs: Belief[]): Belief[] {
  return [...beliefs].sort((a, b) => a.intensityPercentage - b.intensityPercentage);
}

export function sortBeliefsByValence(beliefs: Belief[]): Belief[] {
  return [...beliefs].sort((a, b) => a.valenceScore - b.valenceScore);
}

export function sortBeliefsByScore(beliefs: Belief[]): Belief[] {
  return [...beliefs].sort((a, b) => b.score - a.score);
}

export function formatScore(score: number): string {
  return score >= 0 ? `+${score}` : `${score}`;
}

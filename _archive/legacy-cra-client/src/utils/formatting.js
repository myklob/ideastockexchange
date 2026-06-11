/**
 * Shared formatting utilities for ISE score display.
 */

/** Return a CSS class name based on a 0-100 score. */
export function scoreClass(score) {
  if (score >= 80) return 'score-high';
  if (score >= 60) return 'score-medium';
  if (score >= 40) return 'score-low';
  return 'score-invalid';
}

/** Return a color hex for a 0-100 score (green → yellow → red). */
export function scoreColor(score) {
  if (score >= 80) return '#2e7d32';
  if (score >= 60) return '#f57c00';
  if (score >= 40) return '#c62828';
  return '#6a1a1a';
}

/** Return a background color for Maslow level badges. */
export function maslowColor(level) {
  const map = {
    PHYSIOLOGICAL:      '#c8e6c9',
    SAFETY:             '#b3e5fc',
    BELONGING:          '#fff9c4',
    ESTEEM:             '#ffe0b2',
    SELF_ACTUALIZATION: '#e1bee7',
    INVALID:            '#ffcdd2',
  };
  return map[level] || '#f5f5f5';
}

/** Human-readable Maslow label. */
export function maslowLabel(level) {
  const map = {
    PHYSIOLOGICAL:      'Physiological (85-100)',
    SAFETY:             'Safety (70-85)',
    BELONGING:          'Belonging (50-70)',
    ESTEEM:             'Esteem (40-60)',
    SELF_ACTUALIZATION: 'Self-Actualization (30-50)',
    INVALID:            'Invalid / Zero-Sum (0-20)',
  };
  return map[level] || level;
}

/** Return a position badge color. */
export function positionColor(position) {
  const map = {
    Supporter: '#e8f5e9',
    Opponent:  '#ffebee',
    Neutral:   '#f5f5f5',
    Mixed:     '#fff9c4',
  };
  return map[position] || '#f5f5f5';
}

/** Format a number as a percentage string. */
export function pct(fraction) {
  if (fraction == null) return 'N/A';
  return `${(fraction * 100).toFixed(1)}%`;
}

/** Format a large number with commas. */
export function formatNumber(n) {
  if (!n) return '0';
  return n.toLocaleString();
}

/** Return evidence tier label. */
export function tierLabel(tier) {
  const map = {
    T1: 'T1 – Peer-Reviewed',
    T2: 'T2 – Gov/IGO Report',
    T3: 'T3 – Survey Data',
    T4: 'T4 – Expert Consensus',
    T5: 'T5 – Behavioral Evidence',
    T6: 'T6 – Journalism',
    T7: 'T7 – Anecdotal',
  };
  return map[tier] || tier;
}

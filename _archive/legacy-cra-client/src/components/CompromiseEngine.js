import React from 'react';
import { scoreColor, maslowColor } from '../utils/formatting';

/**
 * CompromiseEngine — surfaces the "Resolution Floor":
 * high-validity interests shared between Supporter and Opponent stakeholders.
 * Also shows structural trade-offs that need human resolution.
 */
export default function CompromiseEngine({ sharedInterests = [], tradeoffs = [], resolutionScore }) {
  return (
    <div className="ise-section">
      <h2 className="ise-section-title">🤝 Compromise Engine — Shared Interests &amp; Bridging Proposals</h2>

      <div className="ise-resolution-score">
        <div className="ise-resolution-score-label">Resolution Potential Score</div>
        <div className="ise-resolution-score-value" style={{ color: scoreColor(resolutionScore) }}>
          {resolutionScore ?? '—'}
        </div>
        <div className="ise-resolution-score-sub">
          Average validity of shared high-value interests across opposing stakeholders.
          Higher = more available common ground for compromise.
        </div>
      </div>

      <p className="ise-section-desc">
        The system detected interests with <strong>validity ≥ 70</strong> that appear on both
        Supporter and Opponent sides. These are the foundation for compromise.
        Build solutions on shared high-validity interests first.
      </p>

      {sharedInterests.length === 0 ? (
        <div className="ise-empty">
          No shared high-value interests detected yet. Add more stakeholder mappings or lower the validity threshold.
        </div>
      ) : (
        <div className="ise-shared-grid">
          {sharedInterests.map(si => (
            <div key={si.interestId} className="ise-shared-card">
              <div className="ise-shared-card-header">
                <span className="ise-maslow-badge" style={{ backgroundColor: maslowColor(si.maslowLevel) }}>
                  {si.maslowLevel?.replace(/_/g, ' ')}
                </span>
                <span className="ise-shared-card-score" style={{ color: scoreColor(si.avgValidityScore) }}>
                  Avg Validity: {si.avgValidityScore}
                </span>
              </div>
              <h3 className="ise-shared-card-title">{si.interestName}</h3>
              {si.interestDescription && (
                <p className="ise-shared-card-desc">{si.interestDescription.slice(0, 140)}…</p>
              )}
              <div className="ise-shared-card-meta">
                <strong>Shared by:</strong>{' '}
                {si.stakeholderIds.length} stakeholders
                ({si.supporterIds?.length || 0} supporters, {si.opponentIds?.length || 0} opponents)
              </div>
              {si.bridgingProposals.length > 0 && (
                <div className="ise-bridging-proposals">
                  <strong>Bridging Proposals:</strong>
                  <ol className="ise-proposal-list">
                    {si.bridgingProposals.map((p, i) => <li key={i}>{p}</li>)}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tradeoffs.length > 0 && (
        <div className="ise-tradeoffs">
          <h3 className="ise-subsection-title">⚠️ Structural Trade-offs (Require Human Resolution)</h3>
          <p className="ise-section-desc">
            These interest pairs are in inherent tension. Satisfying one reduces the other.
            They cannot be resolved by algorithmic compromise — they require explicit political choices.
          </p>
          <table className="ise-table">
            <thead>
              <tr>
                <th>Interest A</th>
                <th>Interest B</th>
                <th>Tension Description</th>
              </tr>
            </thead>
            <tbody>
              {tradeoffs.map((t, i) => (
                <tr key={i}>
                  <td><strong>{t.interestAName || t.interestA}</strong></td>
                  <td><strong>{t.interestBName || t.interestB}</strong></td>
                  <td>{t.tensionDescription}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { scoreColor, maslowLabel, maslowColor, positionColor } from '../utils/formatting';

/**
 * InterestMatrix — the core ranked interest profile table.
 *
 * Props:
 *   mappings  - array of enriched stakeholder mappings from /full-profile
 *   sortBy    - 'composite' | 'validity' | 'linkage'
 *   onSort    - callback(newSortBy)
 *   posFilter - 'Supporter' | 'Opponent' | '' (show all)
 */
export default function InterestMatrix({ mappings = [], sortBy, onSort, posFilter, onPosFilter }) {
  const [expandedEvidence, setExpandedEvidence] = useState({});

  const toggleEvidence = key => setExpandedEvidence(e => ({ ...e, [key]: !e[key] }));

  const visible = posFilter
    ? mappings.filter(m => m.position === posFilter)
    : mappings;

  return (
    <div className="ise-section">
      <div className="ise-section-toolbar">
        <h2 className="ise-section-title">🎯 Ranked Interest Profiles — The "Why"</h2>
        <div className="ise-toolbar-controls">
          <span className="ise-toolbar-label">Sort by:</span>
          {['composite','validity','linkage'].map(s => (
            <button key={s}
              className={`ise-sort-btn ${sortBy === s ? 'ise-sort-btn--active' : ''}`}
              onClick={() => onSort(s)}>
              {s === 'composite' ? 'Composite ▼' : s === 'validity' ? 'Validity' : 'Confidence'}
            </button>
          ))}
          <span className="ise-toolbar-label" style={{ marginLeft: 12 }}>Position:</span>
          {['','Supporter','Opponent','Mixed'].map(p => (
            <button key={p}
              className={`ise-sort-btn ${posFilter === p ? 'ise-sort-btn--active' : ''}`}
              onClick={() => onPosFilter(p)}>
              {p || 'All'}
            </button>
          ))}
        </div>
      </div>

      <p className="ise-section-desc">
        Each row is one stakeholder's interest as it applies to this conflict.
        <strong> Validity</strong> = ethical legitimacy (Maslow-informed, 0-100).
        <strong> Confidence</strong> = how sure we are this actually motivates them (evidence-backed, 0-100).
        <strong> Composite</strong> = Validity × 0.6 + Confidence × 0.4 — the default sort.
      </p>

      {visible.map(sm => (
        <div key={sm.stakeholderId} className="ise-stakeholder-block">
          <div className="ise-stakeholder-header"
               style={{ borderLeftColor: positionColor(sm.position).replace('e', 'c') }}>
            <div>
              <strong>{sm.stakeholderName}</strong>
              <span className={`ise-position-badge ise-position-badge--${(sm.position||'neutral').toLowerCase()}`}>
                {sm.position}
              </span>
              <span className="ise-muted"> — {sm.role}</span>
            </div>
            <div className="ise-stakeholder-header-meta">
              <span className="ise-badge">Power: {sm.power?.totalInfluence}/100</span>
            </div>
          </div>

          {/* Separator rows: Supporters green, Opponents red */}
          {sm.position === 'Supporter' && (
            <div className="ise-section-label ise-section-label--green">Supporter Interests</div>
          )}
          {sm.position === 'Opponent' && (
            <div className="ise-section-label ise-section-label--red">Opponent Interests</div>
          )}

          <table className="ise-table ise-interest-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Interest</th>
                <th>Maslow Level</th>
                <th
                  className={`ise-sortable-col ${sortBy === 'validity' ? 'ise-sortable-col--active' : ''}`}
                  onClick={() => onSort('validity')} style={{ cursor: 'pointer' }}>
                  Validity {sortBy === 'validity' ? '▼' : '↕'}
                  <div className="ise-col-sub">(Legitimacy)</div>
                </th>
                <th
                  className={`ise-sortable-col ${sortBy === 'linkage' ? 'ise-sortable-col--active' : ''}`}
                  onClick={() => onSort('linkage')} style={{ cursor: 'pointer' }}>
                  Confidence {sortBy === 'linkage' ? '▼' : '↕'}
                  <div className="ise-col-sub">(True Motivation?)</div>
                </th>
                <th>% Motivated</th>
                <th
                  className={`ise-sortable-col ${sortBy === 'composite' ? 'ise-sortable-col--active' : ''}`}
                  onClick={() => onSort('composite')} style={{ cursor: 'pointer' }}>
                  Composite {sortBy === 'composite' ? '▼' : '↕'}
                </th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {(sm.interests || []).map((ai, idx) => {
                const evKey = `${sm.stakeholderId}-${ai.interestId}`;
                const hasEvidence = (ai.evidence || []).length > 0;
                const hasArgs = (ai.linkageArguments?.affirming?.length || 0) +
                                (ai.linkageArguments?.challenging?.length || 0) > 0;
                return (
                  <React.Fragment key={ai.interestId}>
                    <tr className={`ise-interest-row ${ai.maslowLevel === 'INVALID' ? 'ise-row--invalid' : ''}`}>
                      <td className="ise-rank-cell">{idx + 1}</td>
                      <td>
                        <strong>{ai.interestName}</strong>
                        {ai.description && (
                          <div className="ise-table-sub">{ai.description.slice(0, 100)}{ai.description.length > 100 ? '…' : ''}</div>
                        )}
                        {ai.maslowLevel === 'INVALID' && (
                          <div className="ise-invalid-note">⚠ Zero-sum / invalid interest — de-weighted in analysis</div>
                        )}
                      </td>
                      <td>
                        <span className="ise-maslow-badge" style={{ backgroundColor: maslowColor(ai.maslowLevel) }}>
                          {ai.maslowLevel?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <ScoreCell score={ai.contextualValidityScore} />
                      </td>
                      <td>
                        <ScoreCell score={ai.linkageAccuracy} />
                      </td>
                      <td>
                        {ai.percentMotivated != null
                          ? `${(ai.percentMotivated * 100).toFixed(0)}%`
                          : '—'}
                      </td>
                      <td>
                        <ScoreCell score={ai.compositeScore} size="large" />
                      </td>
                      <td>
                        {(hasEvidence || hasArgs) && (
                          <button className="ise-expand-btn"
                                  onClick={() => toggleEvidence(evKey)}>
                            {expandedEvidence[evKey] ? '▲ Hide' : '▼ Show'}
                          </button>
                        )}
                      </td>
                    </tr>

                    {expandedEvidence[evKey] && (
                      <tr className="ise-evidence-row">
                        <td colSpan={8}>
                          <EvidencePanel ai={ai} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      {visible.length === 0 && (
        <div className="ise-empty">No stakeholder mappings found for this filter.</div>
      )}
    </div>
  );
}

function ScoreCell({ score, size }) {
  if (score == null) return <span className="ise-muted">—</span>;
  return (
    <div className={`ise-score-cell ${size === 'large' ? 'ise-score-cell--large' : ''}`}>
      <span style={{ color: scoreColor(score), fontWeight: 'bold' }}>{score}</span>
      <div className="ise-score-bar-track">
        <div className="ise-score-bar-fill"
             style={{ width: `${score}%`, backgroundColor: scoreColor(score) }} />
      </div>
    </div>
  );
}

function EvidencePanel({ ai }) {
  return (
    <div className="ise-evidence-panel">
      {(ai.evidence || []).length > 0 && (
        <div className="ise-evidence-group">
          <strong>Evidence Supporting Linkage Claim</strong>
          <table className="ise-evidence-table">
            <thead>
              <tr><th>Tier</th><th>Description</th><th>Quality</th><th>Year</th></tr>
            </thead>
            <tbody>
              {ai.evidence.map(e => (
                <tr key={e.evidenceId}>
                  <td><span className="ise-tier-badge">{e.tier}</span></td>
                  <td>
                    {e.url
                      ? <a href={e.url} target="_blank" rel="noreferrer">{e.description}</a>
                      : e.description}
                  </td>
                  <td style={{ color: scoreColor(e.qualityScore) }}>{e.qualityScore}/100</td>
                  <td>{e.year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(ai.linkageArguments?.affirming || []).length > 0 && (
        <div className="ise-evidence-group">
          <strong>Arguments Affirming This Motive</strong>
          <ul className="ise-arg-list ise-arg-list--affirm">
            {ai.linkageArguments.affirming.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}

      {(ai.linkageArguments?.challenging || []).length > 0 && (
        <div className="ise-evidence-group">
          <strong>Arguments Challenging This Motive</strong>
          <ul className="ise-arg-list ise-arg-list--challenge">
            {ai.linkageArguments.challenging.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}

      {(ai.validityArguments?.forHighValidity || []).length > 0 && (
        <div className="ise-evidence-group">
          <strong>Arguments for High Validity</strong>
          <ul className="ise-arg-list ise-arg-list--high-valid">
            {ai.validityArguments.forHighValidity.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}

      {(ai.validityArguments?.forLowValidity || []).length > 0 && (
        <div className="ise-evidence-group">
          <strong>Arguments for Low Validity / De-weighting</strong>
          <ul className="ise-arg-list ise-arg-list--low-valid">
            {ai.validityArguments.forLowValidity.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

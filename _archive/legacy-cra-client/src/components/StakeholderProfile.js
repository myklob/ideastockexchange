import React from 'react';
import { useApi } from '../hooks/useApi';
import { scoreColor, pct, formatNumber, maslowLabel, maslowColor } from '../utils/formatting';

/**
 * Layer 2: Individual Stakeholder Profile
 * Shows: description, power breakdown, all conflicts this stakeholder appears in,
 * and their interest profile ranked by validity.
 */
export default function StakeholderProfile({ id, navigate }) {
  const { data: stk, loading: stkLoading } = useApi(id ? `/api/stakeholders/${id}` : null);
  const { data: conflictsData }             = useApi('/api/conflicts');

  if (stkLoading) return <div className="ise-loading">Loading stakeholder profile…</div>;
  if (!stk)       return <div className="ise-error">Stakeholder not found.</div>;

  // Find all conflicts this stakeholder appears in
  const allConflicts = conflictsData?.conflicts || [];
  const activeConflicts = allConflicts.filter(c =>
    (c.stakeholderMappings || []).some(m => m.stakeholderId === id)
  );

  // Collect all applied interests across all conflicts
  const allInterests = activeConflicts.flatMap(c => {
    const mapping = (c.stakeholderMappings || []).find(m => m.stakeholderId === id);
    if (!mapping) return [];
    return (mapping.appliedInterests || []).map(ai => ({
      ...ai,
      conflictId:   c.conflictId,
      conflictName: c.name,
      position:     mapping.position,
    }));
  });

  // De-duplicate by interestId and pick highest composite score
  const uniqueInterests = Object.values(
    allInterests.reduce((acc, ai) => {
      if (!acc[ai.interestId] || ai.compositeScore > acc[ai.interestId].compositeScore) {
        acc[ai.interestId] = ai;
      }
      return acc;
    }, {})
  ).sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0));

  const power = stk.power || {};

  return (
    <div className="ise-page">
      <div className="ise-breadcrumb-inline">
        <button className="ise-link-btn" onClick={() => navigate('home')}>← Directory</button>
        {' › '}
        <strong>{stk.name}</strong>
      </div>

      <div className="ise-page-header">
        <h1>Stakeholder Profile: {stk.name}</h1>
        <div className="ise-meta-row">
          <span className="ise-badge">{stk.type}</span>
          <span className="ise-badge ise-badge--blue">
            Influence: <strong>{power.totalInfluence}/100</strong>
          </span>
          <span className="ise-badge ise-badge--green">
            Confidence: <strong>{stk.representationConfidence}/100</strong>
          </span>
        </div>
        <p className="ise-page-desc">{stk.description}</p>
      </div>

      {/* Demographics */}
      <section className="ise-section">
        <h2 className="ise-section-title">👥 Demographics &amp; Representation</h2>
        <table className="ise-table">
          <thead>
            <tr>
              <th>Population Estimate</th>
              <th>% of Relevant Total</th>
              <th>Representation Confidence</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{formatNumber(stk.populationEstimate)}</td>
              <td>{pct(stk.populationFraction)}</td>
              <td>
                <span style={{ color: scoreColor(stk.representationConfidence), fontWeight: 'bold' }}>
                  {stk.representationConfidence}/100
                </span>
                <div className="ise-table-sub">
                  {stk.representationConfidence >= 80 ? 'High — multiple corroborating sources'
                   : stk.representationConfidence >= 60 ? 'Medium — behavioral evidence available'
                   : 'Low — limited direct evidence'}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Power Dynamics */}
      <section className="ise-section">
        <h2 className="ise-section-title">⚡ Power Dynamics</h2>
        <table className="ise-table">
          <thead>
            <tr>
              <th>Political</th>
              <th>Economic</th>
              <th>Military</th>
              <th>Narrative</th>
              <th>Institutional</th>
              <th>Total Influence (avg)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {['political','economic','military','narrative','institutional'].map(dim => (
                <td key={dim}>
                  <span style={{ color: scoreColor(power[dim]), fontWeight: 'bold' }}>
                    {power[dim] ?? '—'}/100
                  </span>
                </td>
              ))}
              <td>
                <span style={{ color: scoreColor(power.totalInfluence), fontWeight: 'bold', fontSize: '1.1em' }}>
                  {power.totalInfluence ?? '—'}/100
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        {stk.powerDescription && (
          <div className="ise-callout ise-callout--grey">
            <strong>How this stakeholder exercises power:</strong> {stk.powerDescription}
          </div>
        )}
      </section>

      {/* Active Conflicts */}
      <section className="ise-section">
        <h2 className="ise-section-title">⚔️ Active Conflict Nodes</h2>
        {activeConflicts.length === 0
          ? <p className="ise-muted">This stakeholder is not yet mapped to any conflict.</p>
          : (
            <table className="ise-table">
              <thead>
                <tr>
                  <th>Conflict / Policy Debate</th>
                  <th>Role</th>
                  <th>Position</th>
                  <th>Interests Mapped</th>
                </tr>
              </thead>
              <tbody>
                {activeConflicts.map(c => {
                  const mapping = (c.stakeholderMappings || []).find(m => m.stakeholderId === id);
                  return (
                    <tr key={c.conflictId} className="ise-table-row--clickable"
                        onClick={() => navigate('conflict', c.conflictId)}>
                      <td>
                        <strong className="ise-link">{c.name}</strong>
                        <div className="ise-table-sub">{c.parentTopic}</div>
                      </td>
                      <td>{mapping?.role || '—'}</td>
                      <td>
                        <span className={`ise-position-badge ise-position-badge--${(mapping?.position||'neutral').toLowerCase()}`}>
                          {mapping?.position || '—'}
                        </span>
                      </td>
                      <td>{(mapping?.appliedInterests || []).length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        }
      </section>

      {/* Interest Profile */}
      {uniqueInterests.length > 0 && (
        <section className="ise-section">
          <h2 className="ise-section-title">🎯 Interest Profile (across all conflicts)</h2>
          <p className="ise-section-desc">
            Default sort: <strong>Composite Score</strong> (Validity × 0.6 + Linkage × 0.4).
            Highest-validity motivations appear first.
          </p>
          <table className="ise-table">
            <thead>
              <tr>
                <th>Interest</th>
                <th>Maslow Level</th>
                <th>Validity (0-100)</th>
                <th>Linkage / Confidence (0-100)</th>
                <th>% Motivated</th>
                <th>Composite Score</th>
                <th>Conflict Context</th>
              </tr>
            </thead>
            <tbody>
              {uniqueInterests.map((ai, idx) => (
                <tr key={ai.interestId}>
                  <td>
                    <strong>{idx + 1}. {ai.interestName || ai.interestId}</strong>
                    {ai.description && <div className="ise-table-sub">{ai.description.slice(0, 80)}…</div>}
                  </td>
                  <td>
                    <span className="ise-maslow-badge" style={{ backgroundColor: maslowColor(ai.maslowLevel) }}>
                      {ai.maslowLevel?.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: scoreColor(ai.contextualValidityScore) }}>
                      {ai.contextualValidityScore}
                    </strong>
                  </td>
                  <td>
                    <strong style={{ color: scoreColor(ai.linkageAccuracy) }}>
                      {ai.linkageAccuracy}
                    </strong>
                    {(ai.evidence || []).length > 0 && (
                      <div className="ise-table-sub">{(ai.evidence || []).length} evidence items</div>
                    )}
                  </td>
                  <td>{ai.percentMotivated != null ? `${(ai.percentMotivated * 100).toFixed(0)}%` : '—'}</td>
                  <td>
                    <strong style={{ color: scoreColor(ai.compositeScore), fontSize: '1.1em' }}>
                      {ai.compositeScore}
                    </strong>
                  </td>
                  <td className="ise-table-sub">{ai.conflictName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

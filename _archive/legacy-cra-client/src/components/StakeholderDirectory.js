import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { scoreColor, pct, formatNumber } from '../utils/formatting';

/**
 * Layer 1: Global Stakeholder Directory
 * Shows all stakeholders grouped by type, with power and population stats.
 * Clicking a stakeholder navigates to their profile.
 */
export default function StakeholderDirectory({ navigate }) {
  const { data, loading, error } = useApi('/api/stakeholders');
  const [filter, setFilter]     = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState error={error} />;

  const stakeholders = data?.stakeholders || [];
  const types = [...new Set(stakeholders.map(s => s.type))].sort();

  const visible = stakeholders.filter(s => {
    const matchText = !filter || s.name.toLowerCase().includes(filter.toLowerCase());
    const matchType = !typeFilter || s.type === typeFilter;
    return matchText && matchType;
  });

  const grouped = types.reduce((acc, t) => {
    acc[t] = visible.filter(s => s.type === t);
    return acc;
  }, {});

  return (
    <div className="ise-page">
      <div className="ise-page-header">
        <h1>Global Stakeholder Directory</h1>
        <p className="ise-page-desc">
          Entities whose interests influence policy, debate, and resolution.
          Each stakeholder is profiled with population representation, power dynamics, and interests
          mapped to specific conflicts. Click any stakeholder to view their full profile and interest mapping.
        </p>
        <div className="ise-meta-row">
          <span className="ise-badge">Stakeholders: {stakeholders.length}</span>
          <span className="ise-badge ise-badge--blue">ISE Framework: Interest Analysis</span>
        </div>
      </div>

      <div className="ise-filters">
        <input
          className="ise-input"
          placeholder="Search stakeholders..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <select className="ise-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button className="ise-btn ise-btn--primary" onClick={() => navigate('conflict', 'CFL-001')}>
          Open Iran Policy Analysis →
        </button>
      </div>

      {Object.entries(grouped).map(([type, items]) =>
        items.length > 0 && (
          <div key={type} className="ise-section">
            <h2 className="ise-section-title">{typeIcon(type)} {type}</h2>
            <table className="ise-table">
              <thead>
                <tr>
                  <th>Stakeholder</th>
                  <th>Population Est.</th>
                  <th>% of Total</th>
                  <th>Representation Confidence</th>
                  <th>Total Influence</th>
                  <th>Power Type</th>
                  <th>Conflicts</th>
                </tr>
              </thead>
              <tbody>
                {items.map(s => (
                  <tr key={s.stakeholderId} className="ise-table-row--clickable"
                      onClick={() => navigate('stakeholder', s.stakeholderId)}>
                    <td>
                      <strong className="ise-link">{s.name}</strong>
                      <div className="ise-table-sub">{s.description?.slice(0, 80)}…</div>
                    </td>
                    <td>{formatNumber(s.populationEstimate)}</td>
                    <td>{pct(s.populationFraction)}</td>
                    <td>
                      <span className="ise-score" style={{ color: scoreColor(s.representationConfidence) }}>
                        {s.representationConfidence}/100
                      </span>
                    </td>
                    <td>
                      <span className="ise-score" style={{ color: scoreColor(s.power?.totalInfluence) }}>
                        {s.power?.totalInfluence}/100
                      </span>
                    </td>
                    <td><PowerBar power={s.power} /></td>
                    <td>{(s.linkedConflictIds || []).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <div className="ise-callout ise-callout--blue" id="contribute">
        <strong>Contribute a Stakeholder</strong>
        <p>Missing a stakeholder? The ISE framework is crowdsourced. Submit the stakeholder name, description,
        population estimate, and power profile to add it to the registry.</p>
        <button className="ise-btn" onClick={() => alert('Stakeholder submission form coming soon. See GitHub.')}>
          Add Stakeholder
        </button>
      </div>
    </div>
  );
}

function PowerBar({ power }) {
  if (!power) return null;
  const dims = { P: power.political, E: power.economic, M: power.military, N: power.narrative, I: power.institutional };
  return (
    <div className="power-bar-row">
      {Object.entries(dims).map(([k, v]) => (
        <div key={k} className="power-bar-item" title={`${k}: ${v}`}>
          <div className="power-bar-label">{k}</div>
          <div className="power-bar-track">
            <div className="power-bar-fill" style={{ width: `${v || 0}%`, backgroundColor: scoreColor(v) }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function typeIcon(type) {
  const map = { Government: '🏛️', Population: '👥', Corporate: '🏢', NGO: '🤝', International: '🌐', 'Armed Group': '⚔️' };
  return map[type] || '📌';
}

function LoadingState() {
  return <div className="ise-loading">Loading stakeholder directory…</div>;
}

function ErrorState({ error }) {
  return (
    <div className="ise-error">
      <strong>Error loading data:</strong> {error}
      <p>Make sure the ISE server is running on port 3001.</p>
    </div>
  );
}

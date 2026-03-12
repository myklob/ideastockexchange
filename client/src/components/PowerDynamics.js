import React from 'react';
import { scoreColor, pct, formatNumber } from '../utils/formatting';

/**
 * PowerDynamics — section 2 of the stakeholder analysis template.
 * Shows all stakeholders' power scores in a comparison table,
 * sorted by total influence.
 */
export default function PowerDynamics({ mappings = [] }) {
  if (!mappings.length) return null;

  const sorted = [...mappings].sort(
    (a, b) => (b.power?.totalInfluence || 0) - (a.power?.totalInfluence || 0)
  );

  return (
    <div className="ise-section">
      <h2 className="ise-section-title">⚡ Stakeholder Power Dynamics</h2>
      <p className="ise-section-desc">
        Who has the leverage to force or block compromise? Power scores (0-100) across five dimensions.
        Total Influence = simple average; can be weighted by conflict type.
      </p>

      <table className="ise-table">
        <thead>
          <tr>
            <th>Stakeholder</th>
            <th>Position</th>
            <th>Pop. %</th>
            <th>Conf.</th>
            <th title="Political: electoral, legislative">Political</th>
            <th title="Economic: financial, sanctions, trade">Economic</th>
            <th title="Military: armed force, coercion">Military</th>
            <th title="Narrative: media, soft power">Narrative</th>
            <th title="Institutional: legal, treaty, procedural">Institutional</th>
            <th>Total Influence</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(sm => {
            const p = sm.power || {};
            return (
              <tr key={sm.stakeholderId}>
                <td>
                  <strong>{sm.stakeholderName}</strong>
                  {sm.powerDescription && (
                    <div className="ise-table-sub">{sm.powerDescription.slice(0, 100)}…</div>
                  )}
                </td>
                <td>
                  <span className={`ise-position-badge ise-position-badge--${(sm.position||'neutral').toLowerCase()}`}>
                    {sm.position}
                  </span>
                </td>
                <td>{pct(sm.populationFraction)}</td>
                <td>
                  <span style={{ color: scoreColor(sm.representationConfidence), fontWeight: 'bold' }}>
                    {sm.representationConfidence}
                  </span>
                </td>
                {['political','economic','military','narrative','institutional'].map(dim => (
                  <td key={dim}>
                    <MiniBar score={p[dim]} />
                  </td>
                ))}
                <td>
                  <strong style={{ color: scoreColor(p.totalInfluence), fontSize: '1.1em' }}>
                    {p.totalInfluence ?? '—'}
                  </strong>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="ise-callout ise-callout--yellow">
        <strong>Key insight on power asymmetry:</strong>{' '}
        Stakeholders with low power scores (e.g., Iranian civilians, human rights NGOs) can hold the
        highest-validity interests. Power determines <em>who can force an outcome</em>, not whose
        interests are most legitimate. The ISE framework separates these questions deliberately.
      </div>
    </div>
  );
}

function MiniBar({ score }) {
  if (score == null) return <span className="ise-muted">—</span>;
  return (
    <div className="ise-mini-bar-wrap">
      <div className="ise-mini-bar-track">
        <div className="ise-mini-bar-fill"
             style={{ width: `${score}%`, backgroundColor: scoreColor(score) }} />
      </div>
      <span className="ise-mini-bar-label" style={{ color: scoreColor(score) }}>{score}</span>
    </div>
  );
}

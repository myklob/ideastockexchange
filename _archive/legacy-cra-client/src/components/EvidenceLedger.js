import React, { useState } from 'react';
import { scoreColor, tierLabel } from '../utils/formatting';
import { usePost } from '../hooks/useApi';

/**
 * EvidenceLedger — displays the conflict-level evidence table
 * and allows submission of new evidence entries.
 */
export default function EvidenceLedger({ conflictId, evidence = [], onSubmitted }) {
  const [showForm, setShowForm] = useState(false);
  const [sideFilter, setSideFilter] = useState('');
  const { post, loading, error } = usePost(`/api/conflicts/${conflictId}/evidence`);

  const [form, setForm] = useState({
    claim: '', source: '', side: 'neutral', tier: 'T4',
    year: new Date().getFullYear(), qualityScore: 70, url: '', finding: '',
  });

  const visible = sideFilter ? evidence.filter(e => e.side === sideFilter) : evidence;
  const sorted  = [...visible].sort((a, b) => b.qualityScore - a.qualityScore);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await post(form);
    if (res) { setShowForm(false); if (onSubmitted) onSubmitted(); }
  };

  return (
    <div className="ise-section">
      <h2 className="ise-section-title">⚖️ Evidence Ledger</h2>
      <p className="ise-section-desc">
        47 years of Iran policy has produced a rich empirical record. These are the most important
        findings that test the causal claims each side relies on.
        Quality scores reflect evidence tier and methodological rigor.
      </p>

      <div className="ise-toolbar-controls" style={{ marginBottom: 12 }}>
        <span className="ise-toolbar-label">Filter:</span>
        {['', 'pro-pressure', 'pro-engagement', 'neutral'].map(s => (
          <button key={s}
            className={`ise-sort-btn ${sideFilter === s ? 'ise-sort-btn--active' : ''}`}
            onClick={() => setSideFilter(s)}>
            {s || 'All'}
          </button>
        ))}
        <button className="ise-btn ise-btn--small" style={{ marginLeft: 'auto' }}
                onClick={() => setShowForm(f => !f)}>
          {showForm ? '× Cancel' : '+ Add Evidence'}
        </button>
      </div>

      <table className="ise-table">
        <thead>
          <tr>
            <th>Claim</th>
            <th>Side</th>
            <th>Source / Tier</th>
            <th>Year</th>
            <th>Quality</th>
            <th>Finding</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(e => (
            <tr key={e.evidenceId}
                className={`ise-evidence-ledger-row ise-evidence-ledger-row--${e.side.replace('-', '')}`}>
              <td><strong>{e.claim}</strong></td>
              <td>
                <span className={`ise-side-badge ise-side-badge--${e.side.replace('-','')}`}>
                  {e.side}
                </span>
              </td>
              <td>
                <div>{e.source}</div>
                <span className="ise-tier-badge">{tierLabel(e.tier)}</span>
              </td>
              <td>{e.year}</td>
              <td>
                <strong style={{ color: scoreColor(e.qualityScore) }}>{e.qualityScore}/100</strong>
              </td>
              <td className="ise-finding-cell">{e.finding}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <div className="ise-form-card">
          <h3>Add Evidence Entry</h3>
          <form onSubmit={handleSubmit}>
            <div className="ise-form-grid">
              <div className="ise-form-group ise-form-group--full">
                <label className="ise-label">Claim this evidence supports *</label>
                <input className="ise-input" value={form.claim}
                       onChange={e => setForm({...form, claim: e.target.value})}
                       placeholder="e.g. JCPOA verifiably constrained Iran's nuclear program while in force" required />
              </div>
              <div className="ise-form-group">
                <label className="ise-label">Source</label>
                <input className="ise-input" value={form.source}
                       onChange={e => setForm({...form, source: e.target.value})}
                       placeholder="e.g. IAEA Board of Governors Reports" />
              </div>
              <div className="ise-form-group">
                <label className="ise-label">Side</label>
                <select className="ise-select" value={form.side}
                        onChange={e => setForm({...form, side: e.target.value})}>
                  <option value="pro-pressure">Pro-Pressure</option>
                  <option value="pro-engagement">Pro-Engagement</option>
                  <option value="neutral">Neutral</option>
                </select>
              </div>
              <div className="ise-form-group">
                <label className="ise-label">Evidence Tier</label>
                <select className="ise-select" value={form.tier}
                        onChange={e => setForm({...form, tier: e.target.value})}>
                  <option value="T1">T1 – Peer-Reviewed Study</option>
                  <option value="T2">T2 – Gov / IGO Report</option>
                  <option value="T3">T3 – Survey Data</option>
                  <option value="T4">T4 – Expert Consensus</option>
                  <option value="T5">T5 – Behavioral Evidence</option>
                  <option value="T6">T6 – Journalism</option>
                  <option value="T7">T7 – Anecdotal</option>
                </select>
              </div>
              <div className="ise-form-group">
                <label className="ise-label">Year</label>
                <input className="ise-input" type="number" value={form.year}
                       onChange={e => setForm({...form, year: +e.target.value})} />
              </div>
              <div className="ise-form-group">
                <label className="ise-label">Quality Score (0-100)</label>
                <input className="ise-input" type="number" min={0} max={100} value={form.qualityScore}
                       onChange={e => setForm({...form, qualityScore: +e.target.value})} />
              </div>
              <div className="ise-form-group ise-form-group--full">
                <label className="ise-label">URL (optional)</label>
                <input className="ise-input" value={form.url}
                       onChange={e => setForm({...form, url: e.target.value})}
                       placeholder="https://…" />
              </div>
              <div className="ise-form-group ise-form-group--full">
                <label className="ise-label">Key Finding</label>
                <textarea className="ise-textarea" value={form.finding} rows={2}
                          onChange={e => setForm({...form, finding: e.target.value})}
                          placeholder="One-sentence summary of what the evidence shows" />
              </div>
            </div>
            {error && <div className="ise-error ise-error--inline">{error}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="ise-btn ise-btn--primary" type="submit" disabled={loading}>
                {loading ? 'Saving…' : 'Add Evidence'}
              </button>
              <button className="ise-btn" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

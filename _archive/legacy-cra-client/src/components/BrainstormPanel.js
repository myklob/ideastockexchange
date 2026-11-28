import React, { useState } from 'react';
import { usePost } from '../hooks/useApi';
import { scoreColor } from '../utils/formatting';

/**
 * BrainstormPanel — crowd-intake form for raw interest submissions.
 * Submissions are auto-clustered against the canonical interest registry.
 * Near-duplicates are flagged. Status shows clustering result.
 */
export default function BrainstormPanel({ conflictId, brainstormStats, onSubmitted }) {
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [result, setResult] = useState(null);

  const { post, loading, error } = usePost(`/api/conflicts/${conflictId}/brainstorm`);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const res = await post({ rawText: text.trim(), submittedBy: name || 'anonymous' });
    if (res) {
      setResult(res);
      setText('');
      if (onSubmitted) onSubmitted();
    }
  };

  return (
    <div className="ise-section">
      <h2 className="ise-section-title">💡 Brainstorm — Submit an Interest</h2>
      <p className="ise-section-desc">
        Think a stakeholder's motivation is missing from this analysis? Submit it here.
        The system will automatically compare your submission against the existing interest registry
        and flag potential duplicates. Novel interests that survive clustering become new canonical nodes.
      </p>

      {brainstormStats && (
        <div className="ise-brainstorm-stats">
          <div className="ise-stat-chip">Total submitted: <strong>{brainstormStats.total}</strong></div>
          <div className="ise-stat-chip ise-stat-chip--yellow">Pending review: <strong>{brainstormStats.pending}</strong></div>
          <div className="ise-stat-chip ise-stat-chip--green">Auto-clustered: <strong>{brainstormStats.clustered}</strong></div>
          <div className="ise-stat-chip ise-stat-chip--red">Duplicate groups found: <strong>{brainstormStats.duplicateGroups}</strong></div>
        </div>
      )}

      <form className="ise-brainstorm-form" onSubmit={handleSubmit}>
        <div className="ise-form-group">
          <label className="ise-label">Describe the interest (plain English)</label>
          <textarea
            className="ise-textarea"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="e.g. 'Iran's nuclear program is primarily about deterrence against regime change, not offensive nuclear ambition — the same lesson North Korea drew from Libya'"
            rows={3}
          />
        </div>
        <div className="ise-form-row">
          <div className="ise-form-group ise-form-group--small">
            <label className="ise-label">Your name (optional)</label>
            <input
              className="ise-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Anonymous"
            />
          </div>
          <button className="ise-btn ise-btn--primary" type="submit" disabled={loading || !text.trim()}>
            {loading ? 'Processing…' : 'Submit Interest'}
          </button>
        </div>
        {error && <div className="ise-error ise-error--inline">{error}</div>}
      </form>

      {result && (
        <div className="ise-brainstorm-result">
          <h4>Clustering Result</h4>
          <table className="ise-table">
            <thead>
              <tr>
                <th>Your Submission</th>
                <th>Status</th>
                <th>Matched Interest</th>
                <th>Similarity Score</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>"{result.rawText}"</td>
                <td>
                  <span className={`ise-status-badge ise-status-badge--${result.status}`}>
                    {result.status === 'clustered' ? '✓ Clustered' : '⏳ Pending Review'}
                  </span>
                </td>
                <td>{result.clusteredTo || '—'}</td>
                <td>
                  {result.similarityScore != null
                    ? <span style={{ color: scoreColor(result.similarityScore) }}>{result.similarityScore}/100</span>
                    : '—'}
                </td>
              </tr>
            </tbody>
          </table>
          {result.status === 'clustered' && (
            <div className="ise-callout ise-callout--green">
              Your submission matched an existing interest. It has been grouped with "{result.clusteredTo}" for consolidated scoring.
            </div>
          )}
          {result.status === 'pending' && (
            <div className="ise-callout ise-callout--yellow">
              Your submission is novel — it didn't match any existing interest closely enough to auto-cluster.
              It will be reviewed and may become a new canonical interest node.
            </div>
          )}
        </div>
      )}

      <div className="ise-callout ise-callout--blue">
        <strong>Automation note:</strong> Once an interest is clustered into a canonical node, the system
        automatically recomputes similarity scores and surfaces it in the Interest Matrix. Human moderators
        review all pending submissions weekly. You can also submit evidence to improve Linkage Accuracy scores
        for any existing interest.
      </div>
    </div>
  );
}

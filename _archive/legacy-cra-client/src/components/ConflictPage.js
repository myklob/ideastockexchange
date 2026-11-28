import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { scoreColor } from '../utils/formatting';
import InterestMatrix  from './InterestMatrix';
import PowerDynamics   from './PowerDynamics';
import CompromiseEngine from './CompromiseEngine';
import BrainstormPanel  from './BrainstormPanel';
import EvidenceLedger   from './EvidenceLedger';

/**
 * Layer 3: Conflict / Analysis Page
 *
 * The main ISE Stakeholder Analysis Template.
 * Renders:
 *   0. Context header + summary stats
 *   1. Demographics & Representation
 *   2. Power Dynamics
 *   3. Ranked Interest Matrix (sortable by Validity | Linkage | Composite)
 *   4. Evidence Ledger
 *   5. Semantic Clustering status
 *   6. Compromise Engine (Shared Interests + Bridging Proposals)
 *   7. Brainstorm intake panel
 */
export default function ConflictPage({ id, navigate }) {
  const [sortBy,    setSortBy]    = useState('composite');
  const [posFilter, setPosFilter] = useState('');
  const [activeTab, setActiveTab] = useState('interests');

  const apiUrl = id ? `/api/analysis/conflict/${id}/full-profile?sort=${sortBy}` : null;
  const { data, loading, error, refetch } = useApi(apiUrl);

  if (loading) return <div className="ise-loading">Loading stakeholder analysis…</div>;
  if (error)   return (
    <div className="ise-error">
      Error loading analysis: {error}
      <p>Make sure the ISE server is running on port 3001 and conflict ID "{id}" exists.</p>
    </div>
  );
  if (!data) return null;

  const tabs = [
    { key: 'interests',  label: '🎯 Interest Matrix' },
    { key: 'power',      label: '⚡ Power Dynamics' },
    { key: 'compromise', label: '🤝 Compromise Engine' },
    { key: 'evidence',   label: '⚖️ Evidence Ledger' },
    { key: 'brainstorm', label: '💡 Brainstorm' },
  ];

  return (
    <div className="ise-page">
      <div className="ise-breadcrumb-inline">
        <button className="ise-link-btn" onClick={() => navigate('home')}>← Directory</button>
        {' › '}
        <strong>{data.parentTopic}</strong>
        {' › '}
        <strong>{data.name}</strong>
      </div>

      {/* Page Header */}
      <div className="ise-page-header">
        <div className="ise-topic-label">
          <strong>Topic:</strong> ISE Framework › Conflict Resolution › Interest Analysis
        </div>
        <h1>{data.name}</h1>
        <div className="ise-meta-row">
          <MetricBadge label="Importance"     value={data.importanceScore}   suffix="/100" />
          <MetricBadge label="Controversy"    value={data.controversyScore}  suffix="/100" />
          <MetricBadge label="Evidence Depth" value={data.evidenceDepth}     text />
          <MetricBadge label="Resolution Score" value={data.resolutionScore} suffix="/100" color={scoreColor(data.resolutionScore)} />
        </div>
        <p className="ise-page-desc">{data.description}</p>
      </div>

      {/* Summary Stats Bar */}
      <SummaryStatsBar stats={data.summaryStats} stakeholderCount={(data.stakeholderMappings||[]).length} />

      {/* Context callout */}
      <div className="ise-callout ise-callout--yellow">
        <strong>Analysis Scope:</strong> Mapping the <em>Why</em> behind the <em>What</em>.
        This page uses the{' '}
        <a href="/w/page/159301140/Interests">ISE Interest Analysis Framework</a>.
        Interests are scored on two dimensions: <strong>Validity</strong> (how legitimate is this interest?)
        and <strong>Confidence</strong> (how sure are we it actually motivates this group?).
        Sort the Interest Matrix by either dimension to change the analytical lens.
      </div>

      {/* Navigation Tabs */}
      <div className="ise-tabs">
        {tabs.map(t => (
          <button key={t.key}
            className={`ise-tab ${activeTab === t.key ? 'ise-tab--active' : ''}`}
            onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'interests' && (
        <>
          <DemographicsTable mappings={data.stakeholderMappings || []} navigate={navigate} />
          <InterestMatrix
            mappings={data.stakeholderMappings || []}
            sortBy={sortBy}
            onSort={setSortBy}
            posFilter={posFilter}
            onPosFilter={setPosFilter}
          />
        </>
      )}

      {activeTab === 'power' && (
        <PowerDynamics mappings={data.stakeholderMappings || []} />
      )}

      {activeTab === 'compromise' && (
        <CompromiseEngine
          sharedInterests={data.sharedInterests || []}
          tradeoffs={data.tradeoffs || []}
          resolutionScore={data.resolutionScore}
        />
      )}

      {activeTab === 'evidence' && (
        <EvidenceLedger
          conflictId={id}
          evidence={data.evidenceLedger || []}
          onSubmitted={refetch}
        />
      )}

      {activeTab === 'brainstorm' && (
        <BrainstormPanel
          conflictId={id}
          brainstormStats={data.brainstormStats}
          onSubmitted={refetch}
        />
      )}

      {/* Contribute footer */}
      <div className="ise-callout ise-callout--blue" id="contribute">
        <strong>Contribute to this Analysis</strong>
        <p>This profile is dynamic and crowd-sourced. You can:</p>
        <ul>
          <li><strong>Submit interests</strong> via the Brainstorm tab — novel interests become new canonical nodes</li>
          <li><strong>Add evidence</strong> via the Evidence Ledger to improve Linkage Accuracy scores</li>
          <li><strong>Argue validity</strong> — challenge whether an interest's ethical score is accurate</li>
          <li><strong>Flag duplicates</strong> — if you see two entries that mean the same thing</li>
          <li><strong>Propose bridging solutions</strong> — add to the Compromise Engine's proposal list</li>
        </ul>
        <p className="ise-muted">
          Algorithm note: The overall Conflict Resolution score updates when new evidence is added.
          View the scoring logic on{' '}
          <a href="https://github.com/myklob/ideastockexchange" target="_blank" rel="noreferrer">GitHub</a>.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUB-COMPONENTS
// ---------------------------------------------------------------------------

function MetricBadge({ label, value, suffix, text, color }) {
  return (
    <div className="ise-metric-badge">
      <span className="ise-metric-label">{label}:</span>
      <span className="ise-metric-value" style={color ? { color } : {}}>
        {text ? value : <><strong>{value}</strong>{suffix}</>}
      </span>
    </div>
  );
}

function SummaryStatsBar({ stats = {}, stakeholderCount }) {
  return (
    <div className="ise-stats-bar">
      <StatChip label="Stakeholders" value={stakeholderCount} />
      <StatChip label="Interest Mappings" value={stats.totalMappings} />
      <StatChip label="High-Validity Interests (80+)" value={stats.highValidityCount} color="#2e7d32" />
      <StatChip label="Invalid/Zero-Sum Interests" value={stats.lowValidityCount} color="#c62828" />
      <StatChip label="Avg Validity" value={stats.avgValidity ? `${stats.avgValidity}/100` : '—'} />
      <StatChip label="Avg Confidence" value={stats.avgLinkage ? `${stats.avgLinkage}/100` : '—'} />
    </div>
  );
}

function StatChip({ label, value, color }) {
  return (
    <div className="ise-stat-chip">
      <span className="ise-stat-label">{label}</span>
      <span className="ise-stat-value" style={color ? { color } : {}}>{value ?? '—'}</span>
    </div>
  );
}

function DemographicsTable({ mappings, navigate }) {
  return (
    <div className="ise-section">
      <h2 className="ise-section-title">👥 Stakeholder Demographics &amp; Representation</h2>
      <p className="ise-section-desc">
        Before analyzing motivations, we define who the stakeholders are, their representation,
        and their capacity to force or block resolution.
      </p>
      <table className="ise-table">
        <thead>
          <tr>
            <th>Stakeholder Group</th>
            <th>Type</th>
            <th>Population Est.</th>
            <th>% of Relevant Total</th>
            <th>Representation Confidence</th>
            <th>Position</th>
            <th>Interests Mapped</th>
          </tr>
        </thead>
        <tbody>
          {mappings.map(sm => (
            <tr key={sm.stakeholderId} className="ise-table-row--clickable"
                onClick={() => navigate('stakeholder', sm.stakeholderId)}>
              <td>
                <strong className="ise-link">{sm.stakeholderName}</strong>
                <div className="ise-table-sub">{sm.description?.slice(0, 80)}…</div>
              </td>
              <td>{sm.type || '—'}</td>
              <td>{sm.populationEstimate ? sm.populationEstimate.toLocaleString() : '—'}</td>
              <td>{sm.populationFraction != null ? `${(sm.populationFraction * 100).toFixed(1)}%` : '—'}</td>
              <td>
                <span style={{ color: scoreColor(sm.representationConfidence), fontWeight: 'bold' }}>
                  {sm.representationConfidence}/100
                </span>
              </td>
              <td>
                <span className={`ise-position-badge ise-position-badge--${(sm.position||'neutral').toLowerCase()}`}>
                  {sm.position || '—'}
                </span>
              </td>
              <td>{(sm.interests || []).length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

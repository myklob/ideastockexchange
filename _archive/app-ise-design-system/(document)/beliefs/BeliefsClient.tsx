'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Belief } from '@/lib/types';

type SortKey = 'positivity' | 'specificity' | 'claimStrength' | 'statement' | 'reasonRank';
type SortDir = 'asc' | 'desc';

const VALENCE_OPTIONS = [
  { label: 'Any valence', minPos: -100, maxPos: 100 },
  { label: 'Positive (>+20)', minPos: 20, maxPos: 100 },
  { label: 'Neutral (−20 to +20)', minPos: -20, maxPos: 20 },
  { label: 'Negative (<−20)', minPos: -100, maxPos: -20 },
];

const SPECIFICITY_OPTIONS = [
  { label: 'Any specificity', min: 0, max: 1 },
  { label: 'Highly General (<0.2)', min: 0, max: 0.2 },
  { label: 'Moderately General (0.2–0.45)', min: 0.2, max: 0.45 },
  { label: 'Case-Level (0.45–0.7)', min: 0.45, max: 0.7 },
  { label: 'Highly Specific (>0.7)', min: 0.7, max: 1 },
];

const INTENSITY_OPTIONS = [
  { label: 'Any intensity', min: 0, max: 1 },
  { label: 'Weak (<0.35)', min: 0, max: 0.35 },
  { label: 'Moderate (0.35–0.65)', min: 0.35, max: 0.65 },
  { label: 'Strong (0.65–0.85)', min: 0.65, max: 0.85 },
  { label: 'Extreme (>0.85)', min: 0.85, max: 1 },
];

export function BeliefsClient({ beliefs }: { beliefs: Belief[] }) {
  const [valenceIdx, setValenceIdx]     = useState(0);
  const [specificityIdx, setSpecificityIdx] = useState(0);
  const [intensityIdx, setIntensityIdx] = useState(0);
  const [sortBy, setSortBy]             = useState<SortKey>('positivity');
  const [sortDir, setSortDir]           = useState<SortDir>('asc');

  const filtered = useMemo(() => {
    const v = VALENCE_OPTIONS[valenceIdx];
    const s = SPECIFICITY_OPTIONS[specificityIdx];
    const i = INTENSITY_OPTIONS[intensityIdx];
    return beliefs.filter(b =>
      b.spectrums.positivity >= v.minPos &&
      b.spectrums.positivity <= v.maxPos &&
      b.spectrums.specificity >= s.min &&
      b.spectrums.specificity <= s.max &&
      b.spectrums.claimStrength >= i.min &&
      b.spectrums.claimStrength <= i.max
    ).sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      if (sortBy === 'statement') { av = a.statement; bv = b.statement; }
      else if (sortBy === 'positivity') { av = a.spectrums.positivity; bv = b.spectrums.positivity; }
      else if (sortBy === 'specificity') { av = a.spectrums.specificity; bv = b.spectrums.specificity; }
      else if (sortBy === 'claimStrength') { av = a.spectrums.claimStrength; bv = b.spectrums.claimStrength; }
      else { av = a.reasonRank; bv = b.reasonRank; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [beliefs, valenceIdx, specificityIdx, intensityIdx, sortBy, sortDir]);

  const signal = (b: Belief) => b.reasonRank > b.marketPrice ? 'UNDER' : 'OVER';

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2 text-sm">
          <label className="text-[var(--muted-foreground)] font-medium">Valence:</label>
          <select
            value={valenceIdx}
            onChange={e => setValenceIdx(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
          >
            {VALENCE_OPTIONS.map((o, i) => <option key={i} value={i}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-[var(--muted-foreground)] font-medium">Specificity:</label>
          <select
            value={specificityIdx}
            onChange={e => setSpecificityIdx(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
          >
            {SPECIFICITY_OPTIONS.map((o, i) => <option key={i} value={i}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-[var(--muted-foreground)] font-medium">Intensity:</label>
          <select
            value={intensityIdx}
            onChange={e => setIntensityIdx(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
          >
            {INTENSITY_OPTIONS.map((o, i) => <option key={i} value={i}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm ml-auto">
          <label className="text-[var(--muted-foreground)] font-medium">Sort:</label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortKey)}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
          >
            <option value="positivity">Positivity</option>
            <option value="specificity">Specificity</option>
            <option value="claimStrength">Claim Strength</option>
            <option value="reasonRank">ReasonRank</option>
            <option value="statement">Statement</option>
          </select>
          <button
            onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white hover:bg-gray-100 font-mono"
          >
            {sortDir === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
        </div>
      </div>

      <p className="text-sm text-[var(--muted-foreground)] mb-4">
        {filtered.length} belief{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map(b => {
          const sig = signal(b);
          return (
            <Link
              key={b.slug}
              href={`/beliefs/${b.slug}`}
              className="card-hover block p-[18px] border border-gray-200 rounded-lg bg-white no-underline"
            >
              <div className="text-[11px] font-mono text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">
                {b.slug}
              </div>
              <div className="font-semibold text-base leading-snug mb-3 text-[var(--foreground)]">
                {b.statement}
              </div>
              <div className="flex gap-4 text-xs text-gray-500 items-center">
                <span>
                  RR <span className="font-mono font-bold">{b.reasonRank.toFixed(1)}%</span>
                </span>
                <span>
                  Mkt <span className="font-mono font-bold">{b.marketPrice.toFixed(1)}%</span>
                </span>
                <span>
                  Vol <span className="font-mono font-bold">{b.volume.toLocaleString()}</span>
                </span>
                <span className="ml-auto">
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                    sig === 'UNDER'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {sig === 'UNDER' ? 'UNDERVALUED' : 'OVERVALUED'}
                  </span>
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-[var(--muted-foreground)]">
          No beliefs match the current filters.
        </div>
      )}
    </>
  );
}

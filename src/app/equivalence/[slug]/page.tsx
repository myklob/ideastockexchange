import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

interface EquivalencePageProps {
  params: Promise<{ slug: string }>
}

function scoreColor(score: number): string {
  if (score >= 0.9) return 'text-green-700 bg-green-50'
  if (score >= 0.75) return 'text-blue-700 bg-blue-50'
  if (score >= 0.5) return 'text-yellow-700 bg-yellow-50'
  return 'text-red-700 bg-red-50'
}

function verdictLabel(verdict: string): string {
  return { merge: 'MERGE', merge_with_note: 'MERGE WITH NOTE', link: 'LINK ONLY', separate: 'SEPARATE' }[verdict] ?? verdict.toUpperCase()
}

function pct(v: number) { return `${(v * 100).toFixed(1)}%` }

export default async function EquivalencePage({ params }: EquivalencePageProps) {
  const { slug } = await params
  const analysis = await prisma.equivalenceAnalysis.findUnique({
    where: { slug: decodeURIComponent(slug) },
    include: {
      synonymClaims:        true,
      semanticMapEntries:   { orderBy: { sortOrder: 'asc' } },
      normalizationReasons: true,
      structuralReasons:    true,
      triggerReasons:       true,
      verdictReasons:       true,
      argumentBattleItems:  true,
      networkPositions:     true,
    },
  })

  if (!analysis) notFound()

  const scoreClass = scoreColor(analysis.finalEquivalenceScore)

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-[960px] mx-auto px-4 py-3 flex items-center gap-2 text-sm">
          <Link href="/" className="font-bold text-[var(--foreground)]">ISE</Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <Link href="/equivalence" className="text-[var(--accent)] hover:underline">Equivalence Analyses</Link>
          <span className="text-[var(--muted-foreground)]">/</span>
          <span className="text-[var(--muted-foreground)] truncate max-w-[400px]">{analysis.slug}</span>
        </div>
      </nav>

      <main className="max-w-[960px] mx-auto px-4 py-8 space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold mb-1">Belief Equivalence Scorecard</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            This scorecard determines whether two beliefs should be merged, linked, or kept separate
            using the 17-step <Link href="/Belief%20Equivalence%20Engine" className="text-[var(--accent)] hover:underline">Belief Equivalence Engine</Link> pipeline.
          </p>
        </div>

        {/* Final Score banner */}
        <div className={`rounded-lg p-6 border text-center ${scoreClass}`}>
          <div className="text-4xl font-bold">{pct(analysis.finalEquivalenceScore)}</div>
          <div className="text-xl font-semibold mt-1">Final Equivalence Score</div>
          <div className="text-lg font-bold mt-2">Verdict: {verdictLabel(analysis.verdict)}</div>
          {analysis.canonicalPage && (
            <p className="text-sm mt-1">Canonical page: <strong>{analysis.canonicalPage}</strong></p>
          )}
        </div>

        {/* Step 1: Raw Beliefs */}
        <section>
          <h2 className="text-xl font-bold mb-3">1. Raw Beliefs Under Comparison</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-3 py-2 w-[15%]">Label</th>
                <th className="border border-gray-300 px-3 py-2">Belief Statement</th>
                <th className="border border-gray-300 px-3 py-2 w-[20%]">Source</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 py-2 font-semibold">Belief X</td>
                <td className="border border-gray-300 px-3 py-2">{analysis.beliefXRaw}</td>
                <td className="border border-gray-300 px-3 py-2 text-[var(--muted-foreground)]">{analysis.beliefXSource ?? '—'}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2 font-semibold">Belief Y</td>
                <td className="border border-gray-300 px-3 py-2">{analysis.beliefYRaw}</td>
                <td className="border border-gray-300 px-3 py-2 text-[var(--muted-foreground)]">{analysis.beliefYSource ?? '—'}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Step 2: Fast Path */}
        <section>
          <h2 className="text-xl font-bold mb-3">2. Fast Path Collapse Test</h2>
          <div className="flex gap-4 text-sm">
            <span className={`px-3 py-1 rounded font-semibold ${analysis.fastPathPassed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              Fast Path: {analysis.fastPathPassed ? '✅ Passed' : '❌ Failed'}
            </span>
            <span className={`px-3 py-1 rounded font-semibold ${analysis.autoMerge ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              Auto-Merge: {analysis.autoMerge ? '✅ Yes' : '❌ No'}
            </span>
          </div>
        </section>

        {/* Step 3: Normalized Core Claims */}
        {(analysis.beliefXNormalized || analysis.beliefYNormalized) && (
          <section>
            <h2 className="text-xl font-bold mb-3">3. Normalized Core Claims</h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-3 py-2 w-[10%]">Label</th>
                  <th className="border border-gray-300 px-3 py-2 w-[45%]">Raw Statement</th>
                  <th className="border border-gray-300 px-3 py-2 w-[45%]">Normalized Core</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 font-semibold">X</td>
                  <td className="border border-gray-300 px-3 py-2">{analysis.beliefXRaw}</td>
                  <td className="border border-gray-300 px-3 py-2">{analysis.beliefXNormalized ?? '—'}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 font-semibold">Y</td>
                  <td className="border border-gray-300 px-3 py-2">{analysis.beliefYRaw}</td>
                  <td className="border border-gray-300 px-3 py-2">{analysis.beliefYNormalized ?? '—'}</td>
                </tr>
              </tbody>
            </table>
            {analysis.normalizationReasons.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm text-green-700 mb-1">Reasons Normalization Is Correct</h3>
                  {analysis.normalizationReasons.filter(r => r.side === 'agree').map(r => (
                    <p key={r.id} className="text-sm border-l-2 border-green-300 pl-2 mb-1">{r.statement}</p>
                  ))}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-red-700 mb-1">Reasons Normalization Is Wrong</h3>
                  {analysis.normalizationReasons.filter(r => r.side === 'disagree').map(r => (
                    <p key={r.id} className="text-sm border-l-2 border-red-300 pl-2 mb-1">{r.statement}</p>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Step 4: Semantic Map */}
        {analysis.semanticMapEntries.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-3">4. Semantic Transformation Map</h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-3 py-2">X Element</th>
                  <th className="border border-gray-300 px-3 py-2">Y Element</th>
                  <th className="border border-gray-300 px-3 py-2 w-[25%]">Relationship</th>
                  <th className="border border-gray-300 px-3 py-2 w-[25%]">Notes</th>
                </tr>
              </thead>
              <tbody>
                {analysis.semanticMapEntries.map(e => (
                  <tr key={e.id}>
                    <td className="border border-gray-300 px-3 py-2">{e.xElement}</td>
                    <td className="border border-gray-300 px-3 py-2">{e.yElement}</td>
                    <td className="border border-gray-300 px-3 py-2 capitalize">{e.relationship}</td>
                    <td className="border border-gray-300 px-3 py-2 text-[var(--muted-foreground)]">{e.notes ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Step 5: Synonym Convergence */}
        <section>
          <h2 className="text-xl font-bold mb-3">5. Synonym Convergence Score</h2>
          <p className="text-2xl font-bold mb-3">{pct(analysis.synonymConvergenceScore)}</p>
          {analysis.synonymClaims.length > 0 && (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-3 py-2">Synonym Claim</th>
                  <th className="border border-gray-300 px-3 py-2 w-[10%]">M-W</th>
                  <th className="border border-gray-300 px-3 py-2 w-[10%]">Oxford</th>
                  <th className="border border-gray-300 px-3 py-2 w-[10%]">WordNet</th>
                  <th className="border border-gray-300 px-3 py-2 w-[10%]">Embedding</th>
                  <th className="border border-gray-300 px-3 py-2 w-[15%]">Agreement</th>
                </tr>
              </thead>
              <tbody>
                {analysis.synonymClaims.map(sc => (
                  <tr key={sc.id}>
                    <td className="border border-gray-300 px-3 py-2">"{sc.xTerm}" = "{sc.yTerm}"</td>
                    {[sc.merriamWebster, sc.oxford, sc.wordNet, sc.embeddingModel].map((v, i) => (
                      <td key={i} className="border border-gray-300 px-3 py-2 text-center">
                        {v === null ? '—' : v ? '✅' : '❌'}
                      </td>
                    ))}
                    <td className="border border-gray-300 px-3 py-2 text-center font-mono">
                      {sc.agreementNumerator}/{sc.agreementDenominator}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Step 6: Strength Delta */}
        <section>
          <h2 className="text-xl font-bold mb-3">6. Strength Delta</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-2">Overall Strength Delta: <strong>{pct(analysis.overallStrengthDelta)}</strong></p>
        </section>

        {/* Step 7: Structural Relationship */}
        <section>
          <h2 className="text-xl font-bold mb-3">7. Structural Relationship Classification</h2>
          <p className="text-sm font-semibold capitalize">
            {analysis.structuralRelationship.replace(/_/g, ' ')}
          </p>
          {analysis.structuralReasons.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-sm text-green-700 mb-1">Reasons This Classification Is Correct</h3>
                {analysis.structuralReasons.filter(r => r.side === 'agree').map(r => (
                  <p key={r.id} className="text-sm border-l-2 border-green-300 pl-2 mb-1">{r.statement}</p>
                ))}
              </div>
              <div>
                <h3 className="font-semibold text-sm text-red-700 mb-1">Reasons This Classification Is Wrong</h3>
                {analysis.structuralReasons.filter(r => r.side === 'disagree').map(r => (
                  <p key={r.id} className="text-sm border-l-2 border-red-300 pl-2 mb-1">{r.statement}</p>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Step 8: Overlap Score */}
        <section>
          <h2 className="text-xl font-bold mb-3">8. Overlap Score</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-3 py-2">Component</th>
                <th className="border border-gray-300 px-3 py-2 w-[15%]">Weight</th>
                <th className="border border-gray-300 px-3 py-2 w-[15%]">Score</th>
                <th className="border border-gray-300 px-3 py-2 w-[15%]">Weighted</th>
              </tr>
            </thead>
            <tbody>
              {([
                ['Subject',   0.25, analysis.subjectOverlap],
                ['Predicate', 0.35, analysis.predicateOverlap],
                ['Context',   0.20, analysis.contextOverlap],
                ['Mechanism', 0.20, analysis.mechanismOverlap],
              ] as [string, number, number][]).map(([name, w, v]) => (
                <tr key={name}>
                  <td className="border border-gray-300 px-3 py-2 font-medium">{name}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{(w * 100).toFixed(0)}%</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{pct(v)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{pct(v * w)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td className="border border-gray-300 px-3 py-2" colSpan={3}>Overlap Score</td>
                <td className="border border-gray-300 px-3 py-2 text-center">{pct(analysis.overlapScore)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Step 9: Non-Equivalence Triggers */}
        <section>
          <h2 className="text-xl font-bold mb-3">9. Non-Equivalence Triggers</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-red-50">
                <th className="border border-gray-300 px-3 py-2">Trigger</th>
                <th className="border border-gray-300 px-3 py-2 w-[15%]">Penalty</th>
              </tr>
            </thead>
            <tbody>
              {([
                ['Different causal claim',      analysis.penaltyDifferentCausal],
                ['Different required evidence', analysis.penaltyDifferentEvidence],
                ['Different assumptions',       analysis.penaltyDifferentAssumptions],
                ['Different policy implication',analysis.penaltyDifferentPolicy],
              ] as [string, number][]).map(([name, penalty]) => (
                <tr key={name} className={penalty > 0 ? 'bg-red-50' : ''}>
                  <td className="border border-gray-300 px-3 py-2">{penalty > 0 ? '🔴' : '⬜'} {name}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center font-mono">
                    {penalty > 0 ? `-${pct(penalty)}` : '—'}
                  </td>
                </tr>
              ))}
              <tr className="font-bold bg-gray-50">
                <td className="border border-gray-300 px-3 py-2">Total Penalty</td>
                <td className="border border-gray-300 px-3 py-2 text-center font-mono text-red-700">
                  -{pct(analysis.totalPenalty)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Step 10: Argument Battle */}
        <section>
          <h2 className="text-xl font-bold mb-3">10. Argument Battle</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
              <div className="text-lg font-bold text-green-700">{pct(analysis.proEquivalenceScore)}</div>
              <div className="text-sm">Pro-Equivalence Score</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded p-3 text-center">
              <div className="text-lg font-bold text-red-700">{pct(analysis.antiEquivalenceScore)}</div>
              <div className="text-sm">Anti-Equivalence Score</div>
            </div>
          </div>
          <p className="text-sm font-semibold mb-3">Argument Balance: {pct(analysis.argumentBalance)}</p>
          {analysis.argumentBattleItems.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-sm text-green-700 mb-2">Reasons These Beliefs ARE Equivalent</h3>
                {analysis.argumentBattleItems.filter(i => i.side === 'pro_equivalence').map(i => (
                  <div key={i.id} className="text-sm border-l-2 border-green-300 pl-2 mb-2">
                    <p>{i.statement}</p>
                    <p className="text-xs text-[var(--muted-foreground)] font-mono">T:{i.truthScore.toFixed(2)} L:{i.linkageScore.toFixed(2)} I:{i.importanceScore.toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="font-semibold text-sm text-red-700 mb-2">Reasons These Beliefs Are NOT Equivalent</h3>
                {analysis.argumentBattleItems.filter(i => i.side === 'anti_equivalence').map(i => (
                  <div key={i.id} className="text-sm border-l-2 border-red-300 pl-2 mb-2">
                    <p>{i.statement}</p>
                    <p className="text-xs text-[var(--muted-foreground)] font-mono">T:{i.truthScore.toFixed(2)} L:{i.linkageScore.toFixed(2)} I:{i.importanceScore.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Step 12: Final Score Calculation */}
        <section>
          <h2 className="text-xl font-bold mb-3">12. Final Equivalence Score</h2>
          <div className="bg-gray-50 border border-gray-200 rounded p-4 font-mono text-sm mb-4">
            <p>Equivalence = (0.40 × {pct(analysis.synonymConvergenceScore)}) + (0.40 × {pct(analysis.overlapScore)}) + (0.20 × {pct(analysis.argumentBalance)}) − {pct(analysis.totalPenalty)}</p>
            {analysis.networkAdjustment !== 0 && (
              <p>Network Adjustment: {analysis.networkAdjustment >= 0 ? '+' : ''}{pct(analysis.networkAdjustment)}</p>
            )}
            <p className="font-bold mt-1">= <span className={scoreClass.split(' ')[0]}>{pct(analysis.finalEquivalenceScore)}</span></p>
          </div>
        </section>

        {/* Step 13: Verdict */}
        <section>
          <h2 className="text-xl font-bold mb-3">13. Verdict and Action</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-3 py-2 w-[15%]">Score Range</th>
                <th className="border border-gray-300 px-3 py-2 w-[20%]">Action</th>
                <th className="border border-gray-300 px-3 py-2">Implementation</th>
              </tr>
            </thead>
            <tbody>
              {([
                ['90–100%', 'merge',           'MERGE',           'Combine into single canonical page.'],
                ['75–89%',  'merge_with_note',  'MERGE WITH NOTE', 'Merge with phrasing note and strength delta.'],
                ['50–74%',  'link',             'LINK ONLY',       'Separate pages with bidirectional linkage scores.'],
                ['<50%',    'separate',         'SEPARATE',        'Independent claims. No argument merging.'],
              ] as [string, string, string, string][]).map(([range, v, label, impl]) => (
                <tr key={v} className={analysis.verdict === v ? 'bg-blue-50 font-semibold' : ''}>
                  <td className="border border-gray-300 px-3 py-2">{range}</td>
                  <td className="border border-gray-300 px-3 py-2">{analysis.verdict === v ? '✅ ' : ''}{label}</td>
                  <td className="border border-gray-300 px-3 py-2">{impl}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {analysis.verdictReasons.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-sm text-green-700 mb-1">Reasons This Verdict Is Correct</h3>
                {analysis.verdictReasons.filter(r => r.side === 'agree').map(r => (
                  <p key={r.id} className="text-sm border-l-2 border-green-300 pl-2 mb-1">{r.statement}</p>
                ))}
              </div>
              <div>
                <h3 className="font-semibold text-sm text-red-700 mb-1">Reasons This Verdict Is Wrong</h3>
                {analysis.verdictReasons.filter(r => r.side === 'disagree').map(r => (
                  <p key={r.id} className="text-sm border-l-2 border-red-300 pl-2 mb-1">{r.statement}</p>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Step 15: Audit Trail */}
        <section>
          <h2 className="text-xl font-bold mb-3">15. Audit Trail</h2>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {([
                ['Analysis performed by', `${analysis.analystType}${analysis.analystId ? ` — ${analysis.analystId}` : ''}`],
                ['Confidence',            analysis.confidence],
                ['Reviewed by',           analysis.reviewedBy ?? 'Pending'],
                ['Review date',           analysis.reviewDate ? new Date(analysis.reviewDate).toLocaleDateString() : 'Pending'],
                ['Trigger for re-analysis', analysis.triggerReason ?? '—'],
                ['Created',               new Date(analysis.createdAt).toLocaleDateString()],
              ] as [string, string][]).map(([field, val]) => (
                <tr key={field}>
                  <td className="border border-gray-300 px-3 py-2 font-semibold bg-gray-50 w-[30%]">{field}</td>
                  <td className="border border-gray-300 px-3 py-2 capitalize">{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Machine-Readable Output */}
        <section>
          <h2 className="text-xl font-bold mb-3">17. Machine-Readable Output</h2>
          <pre className="bg-gray-50 border border-gray-200 rounded p-4 text-xs overflow-auto max-h-80">
            {JSON.stringify({
              equivalence_analysis: {
                version: '1.0',
                belief_x: { raw: analysis.beliefXRaw, normalized: analysis.beliefXNormalized, source: analysis.beliefXSource },
                belief_y: { raw: analysis.beliefYRaw, normalized: analysis.beliefYNormalized, source: analysis.beliefYSource },
                fast_path: { passed: analysis.fastPathPassed, auto_merge: analysis.autoMerge },
                scores: {
                  synonym_convergence: analysis.synonymConvergenceScore,
                  overlap: { subject: analysis.subjectOverlap, predicate: analysis.predicateOverlap, context: analysis.contextOverlap, mechanism: analysis.mechanismOverlap, weighted_total: analysis.overlapScore },
                  strength_delta: { overall: analysis.overallStrengthDelta },
                  argument_balance: { pro: analysis.proEquivalenceScore, anti: analysis.antiEquivalenceScore, balance: analysis.argumentBalance },
                  non_equivalence_penalties: { different_causal_claim: analysis.penaltyDifferentCausal, different_required_evidence: analysis.penaltyDifferentEvidence, different_assumptions: analysis.penaltyDifferentAssumptions, different_policy_implication: analysis.penaltyDifferentPolicy, total_penalty: analysis.totalPenalty },
                  network_adjustment: analysis.networkAdjustment,
                  final_equivalence: analysis.finalEquivalenceScore,
                },
                structural_relationship: analysis.structuralRelationship,
                verdict: analysis.verdict,
                confidence: analysis.confidence,
                canonical_page: analysis.canonicalPage,
                linkage_score: analysis.linkageScore,
                analyst: { type: analysis.analystType, id: analysis.analystId, date: analysis.createdAt },
              },
            }, null, 2)}
          </pre>
        </section>

        <div className="text-center text-sm text-[var(--muted-foreground)] pt-4 border-t border-gray-200">
          <Link href="/equivalence" className="text-[var(--accent)] hover:underline">← All Equivalence Analyses</Link>
          {' · '}
          <a href={`/api/equivalence/${analysis.slug}`} className="text-[var(--accent)] hover:underline">View JSON</a>
        </div>
      </main>
    </div>
  )
}

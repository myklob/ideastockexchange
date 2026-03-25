/**
 * CBA Export API
 * GET /api/cba/[id]/export?format=html|markdown
 *
 * Exports a CBA analysis as PBworks-compatible HTML or Markdown.
 * Implements output formats from docs/automated-cba/references/output-templates.md
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCBA } from '@/features/cost-benefit-analysis/data/cba-data'
import { CostBenefitAnalysis, CBALineItem, CBACategory, CBA_CATEGORY_UNITS } from '@/core/types/cba'
import { formatDollars } from '@/core/scoring/cba-scoring'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cba = getCBA(id)

  if (!cba) {
    return NextResponse.json({ error: 'CBA not found', id }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') ?? 'html'

  if (format === 'markdown') {
    const md = generateMarkdown(cba)
    return new NextResponse(md, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="cba-${id}.md"`,
      },
    })
  }

  // Default: PBworks-compatible HTML
  const html = generateHTML(cba)
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="cba-${id}.html"`,
    },
  })
}

// ─── HTML Export (PBworks-compatible) ─────────────────────────
// All styles MUST be inline. No <style> blocks, no class attributes.
// See docs/automated-cba/references/output-templates.md

function likelihoodBadge(likelihood: number): string {
  const pct = (likelihood * 100).toFixed(0)
  const color =
    likelihood > 0.6 ? '#22c55e' : likelihood > 0.3 ? '#f59e0b' : '#ef4444'
  return `<span style="display:inline-block;background-color:${color};color:white;padding:2px 8px;border-radius:4px;font-size:90%;font-weight:bold;">${pct}%</span>`
}

function formatVal(val: number): string {
  return formatDollars(val)
}

function generateHTML(cba: CostBenefitAnalysis): string {
  const date = new Date(cba.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const isPositive = cba.netExpectedValue >= 0
  const verdictColor = isPositive ? '#22c55e' : cba.verdict === 'uncertain' ? '#f59e0b' : '#ef4444'
  const verdictLabel = cba.verdict === 'net_positive' ? 'Net Positive' : cba.verdict === 'net_negative' ? 'Net Negative' : 'Uncertain'
  const confLabel = (cba.confidence ?? 0) >= 0.7 ? 'High' : (cba.confidence ?? 0) >= 0.4 ? 'Moderate' : 'Low'

  const itemRows = (items: CBALineItem[]) =>
    items.map((item) => {
      const l = item.likelihoodBelief.activeLikelihood
      const ev = item.expectedValue ?? item.predictedImpact * l
      return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;">${item.title}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;">${item.canonicalCategory ?? item.category}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;text-align:right;">${formatVal(item.predictedImpact)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;text-align:center;">${likelihoodBadge(l)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;text-align:right;font-weight:bold;color:${ev >= 0 ? '#16a34a' : '#dc2626'};">${ev >= 0 ? '+' : ''}${formatVal(ev)}</td>
      </tr>`
    }).join('')

  const benefits = cba.items.filter((i) => i.type === 'benefit')
  const costs = cba.items.filter((i) => i.type === 'cost')

  const categoryRows = (cba.categoryBreakdown ?? [])
    .filter((c) => c.benefitsEv !== 0 || c.costsEv !== 0)
    .map((c) => {
      const unit = CBA_CATEGORY_UNITS[c.category as CBACategory] ?? ''
      const netColor = c.netEv >= 0 ? '#16a34a' : '#dc2626'
      return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;">${c.category} <span style="font-size:85%;color:#6b7280;">(${unit})</span></td>
        <td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;text-align:right;background-color:#e6f7e6;">+${formatVal(c.benefitsEv)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;text-align:right;background-color:#fde8e8;">-${formatVal(c.costsEv)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;text-align:right;font-weight:bold;color:${netColor};">${c.netEv >= 0 ? '+' : ''}${formatVal(c.netEv)}</td>
      </tr>`
    }).join('')

  const sensitivityRows = (cba.sensitivity ?? []).map((s, i) => `<tr>
    <td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;">${i + 1}.</td>
    <td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;">${s.impactTitle}</td>
    <td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;text-align:center;">
      ${(s.likelihoodLow * 100).toFixed(0)}%–${(s.likelihoodHigh * 100).toFixed(0)}%
    </td>
    <td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;text-align:right;font-weight:bold;color:#92400e;">±${formatVal(s.swing / 2)}</td>
  </tr>`).join('')

  const deduplicationRows = (cba.deduplicationLog ?? []).map((e) => `<tr>
    <td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;">
      <span style="background-color:${e.action === 'merged' ? '#fef3c7' : '#dbeafe'};color:${e.action === 'merged' ? '#92400e' : '#1e40af'};padding:2px 6px;border-radius:4px;font-size:85%;font-weight:bold;">${e.action}</span>
    </td>
    <td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;font-size:90%;color:#6b7280;">${(e.similarity * 100).toFixed(0)}%</td>
    <td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;font-size:90%;">${e.adjustment}</td>
  </tr>`).join('')

  const { optimistic, base, pessimistic } = cba.scenarios ?? {}

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>CBA: ${escHtml(cba.title)}</title></head>
<body style="font-family:Arial,sans-serif;max-width:900px;margin:0 auto;padding:20px;color:#1f2937;">

<h1 style="font-size:150%;margin-bottom:4px;">${escHtml(cba.title)}</h1>
<p style="color:#6b7280;font-size:90%;margin-top:0;">${escHtml(cba.description)}</p>

<h2>Executive Summary</h2>
<table border="0" style="width:100%;border-collapse:collapse;">
<tr style="background-color:#f0f3f6;">
  <th style="padding:6px 10px;text-align:left;border-bottom:2px solid #ccc;">Date</th>
  <th style="padding:6px 10px;text-align:left;border-bottom:2px solid #ccc;">Net Expected Value</th>
  <th style="padding:6px 10px;text-align:left;border-bottom:2px solid #ccc;">Verdict</th>
  <th style="padding:6px 10px;text-align:left;border-bottom:2px solid #ccc;">Confidence</th>
</tr>
<tr>
  <td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;">${date}</td>
  <td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;font-weight:bold;color:${verdictColor};">${isPositive ? '+' : ''}${formatVal(cba.netExpectedValue)}</td>
  <td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;">
    <span style="background-color:${verdictColor};color:white;padding:2px 8px;border-radius:4px;font-size:90%;font-weight:bold;">${verdictLabel}</span>
  </td>
  <td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;">${confLabel}</td>
</tr>
</table>

<h2>Category Dashboard</h2>
<table border="0" style="width:100%;border-collapse:collapse;">
<tr style="background-color:#f0f3f6;">
  <th style="padding:6px 10px;text-align:left;border-bottom:2px solid #ccc;">Category</th>
  <th style="padding:6px 10px;text-align:right;border-bottom:2px solid #ccc;">Benefits (Weighted)</th>
  <th style="padding:6px 10px;text-align:right;border-bottom:2px solid #ccc;">Costs (Weighted)</th>
  <th style="padding:6px 10px;text-align:right;border-bottom:2px solid #ccc;">Net EV</th>
</tr>
${categoryRows || '<tr><td colspan="4" style="padding:6px 10px;color:#6b7280;">No category data yet.</td></tr>'}
</table>

<h2>Benefits</h2>
<table border="0" style="width:100%;border-collapse:collapse;">
<tr style="background-color:#f0f3f6;">
  <th style="padding:6px 10px;text-align:left;border-bottom:2px solid #ccc;">Description</th>
  <th style="padding:6px 10px;text-align:left;border-bottom:2px solid #ccc;">Category</th>
  <th style="padding:6px 10px;text-align:right;border-bottom:2px solid #ccc;">Magnitude</th>
  <th style="padding:6px 10px;text-align:center;border-bottom:2px solid #ccc;">Likelihood</th>
  <th style="padding:6px 10px;text-align:right;border-bottom:2px solid #ccc;">Expected Value</th>
</tr>
${itemRows(benefits) || '<tr><td colspan="5" style="padding:6px 10px;color:#6b7280;">No benefits yet.</td></tr>'}
</table>

<h2>Costs</h2>
<table border="0" style="width:100%;border-collapse:collapse;">
<tr style="background-color:#f0f3f6;">
  <th style="padding:6px 10px;text-align:left;border-bottom:2px solid #ccc;">Description</th>
  <th style="padding:6px 10px;text-align:left;border-bottom:2px solid #ccc;">Category</th>
  <th style="padding:6px 10px;text-align:right;border-bottom:2px solid #ccc;">Magnitude</th>
  <th style="padding:6px 10px;text-align:center;border-bottom:2px solid #ccc;">Likelihood</th>
  <th style="padding:6px 10px;text-align:right;border-bottom:2px solid #ccc;">Expected Value</th>
</tr>
${itemRows(costs) || '<tr><td colspan="5" style="padding:6px 10px;color:#6b7280;">No costs yet.</td></tr>'}
</table>

${sensitivityRows ? `<h2>Sensitivity Analysis</h2>
<p style="font-size:90%;color:#6b7280;">Top items where additional research would most change the conclusion. Swing = magnitude × (likelihood_high − likelihood_low).</p>
<table border="0" style="width:100%;border-collapse:collapse;">
<tr style="background-color:#f0f3f6;">
  <th style="padding:6px 10px;text-align:left;border-bottom:2px solid #ccc;">#</th>
  <th style="padding:6px 10px;text-align:left;border-bottom:2px solid #ccc;">Impact</th>
  <th style="padding:6px 10px;text-align:center;border-bottom:2px solid #ccc;">Likelihood Range</th>
  <th style="padding:6px 10px;text-align:right;border-bottom:2px solid #ccc;">Swing</th>
</tr>
${sensitivityRows}
</table>` : ''}

${optimistic && base && pessimistic ? `<h2>Scenario Analysis</h2>
<table border="0" style="width:100%;border-collapse:collapse;">
<tr style="background-color:#f0f3f6;">
  <th style="padding:6px 10px;text-align:left;border-bottom:2px solid #ccc;">Scenario</th>
  <th style="padding:6px 10px;text-align:right;border-bottom:2px solid #ccc;">Net EV</th>
  <th style="padding:6px 10px;text-align:right;border-bottom:2px solid #ccc;">Benefits</th>
  <th style="padding:6px 10px;text-align:right;border-bottom:2px solid #ccc;">Costs</th>
</tr>
<tr><td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;background-color:#d1fae5;">Optimistic (+15%)</td><td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;text-align:right;background-color:#d1fae5;font-weight:bold;">${optimistic.totalEv >= 0 ? '+' : ''}${formatVal(optimistic.totalEv)}</td><td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;text-align:right;background-color:#e6f7e6;">+${formatVal(optimistic.totalBenefits)}</td><td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;text-align:right;background-color:#fde8e8;">-${formatVal(optimistic.totalCosts)}</td></tr>
<tr><td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;background-color:#dbeafe;">Base Case</td><td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;text-align:right;background-color:#dbeafe;font-weight:bold;">${base.totalEv >= 0 ? '+' : ''}${formatVal(base.totalEv)}</td><td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;text-align:right;background-color:#e6f7e6;">+${formatVal(base.totalBenefits)}</td><td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;text-align:right;background-color:#fde8e8;">-${formatVal(base.totalCosts)}</td></tr>
<tr><td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;background-color:#fee2e2;">Pessimistic (−15%)</td><td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;text-align:right;background-color:#fee2e2;font-weight:bold;">${pessimistic.totalEv >= 0 ? '+' : ''}${formatVal(pessimistic.totalEv)}</td><td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;text-align:right;background-color:#e6f7e6;">+${formatVal(pessimistic.totalBenefits)}</td><td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;text-align:right;background-color:#fde8e8;">-${formatVal(pessimistic.totalCosts)}</td></tr>
</table>` : ''}

${deduplicationRows ? `<h2>De-Duplication Log</h2>
<p style="font-size:90%;color:#6b7280;">What was merged or discounted and why. Two versions of the same argument count once.</p>
<table border="0" style="width:100%;border-collapse:collapse;">
<tr style="background-color:#f0f3f6;">
  <th style="padding:6px 10px;text-align:left;border-bottom:2px solid #ccc;">Action</th>
  <th style="padding:6px 10px;text-align:left;border-bottom:2px solid #ccc;">Overlap</th>
  <th style="padding:6px 10px;text-align:left;border-bottom:2px solid #ccc;">Description</th>
</tr>
${deduplicationRows}
</table>` : ''}

<h2>Methodology</h2>
<p style="font-size:90%;color:#6b7280;">
  This analysis uses the <a href="https://myclob.pbworks.com/w/page/156187122/cost-benefit%20analysis">Idea Stock Exchange Cost-Benefit Analysis</a> framework.
  Each impact's likelihood is derived from its argument tree: <strong>likelihood = pro_total / (pro_total + con_total)</strong>.
  Arguments are scored as: <strong>truth × linkage × importance</strong> (with depth attenuation 0.5^(depth-1) for sub-arguments).
  Expected value = magnitude × likelihood. Scores are computed, never manually assigned.
</p>

</body></html>`
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ─── Markdown Export ───────────────────────────────────────────

function generateMarkdown(cba: CostBenefitAnalysis): string {
  const date = new Date(cba.createdAt).toISOString().slice(0, 10)
  const verdictLabel = cba.verdict === 'net_positive' ? 'Net Positive' : cba.verdict === 'net_negative' ? 'Net Negative' : 'Uncertain'
  const confLabel = (cba.confidence ?? 0) >= 0.7 ? 'High' : (cba.confidence ?? 0) >= 0.4 ? 'Moderate' : 'Low'

  const benefits = cba.items.filter((i) => i.type === 'benefit')
  const costs = cba.items.filter((i) => i.type === 'cost')

  const itemsTable = (items: CBALineItem[]) =>
    items.length === 0
      ? '_None yet._'
      : [
          '| Description | Category | Magnitude | Likelihood | Expected Value |',
          '|---|---|---|---|---|',
          ...items.map((i) => {
            const l = i.likelihoodBelief.activeLikelihood
            const ev = i.expectedValue ?? i.predictedImpact * l
            return `| ${i.title} | ${i.canonicalCategory ?? i.category} | ${formatDollars(i.predictedImpact)} | ${(l * 100).toFixed(0)}% | ${ev >= 0 ? '+' : ''}${formatDollars(ev)} |`
          }),
        ].join('\n')

  const categoryTable =
    !cba.categoryBreakdown?.length
      ? ''
      : [
          '## Category Breakdown',
          '',
          '| Category | Benefits (Weighted) | Costs (Weighted) | Net EV |',
          '|---|---|---|---|',
          ...(cba.categoryBreakdown ?? [])
            .filter((c) => c.benefitsEv !== 0 || c.costsEv !== 0)
            .map((c) => `| ${c.category} (${c.unit}) | +${formatDollars(c.benefitsEv)} | -${formatDollars(c.costsEv)} | ${c.netEv >= 0 ? '+' : ''}${formatDollars(c.netEv)} |`),
        ].join('\n')

  const sensitivitySection =
    !cba.sensitivity?.length
      ? ''
      : [
          '## Sensitivity Analysis',
          '',
          '| # | Impact | Likelihood Range | Swing |',
          '|---|---|---|---|',
          ...(cba.sensitivity ?? []).map(
            (s, i) => `| ${i + 1} | ${s.impactTitle} | ${(s.likelihoodLow * 100).toFixed(0)}%–${(s.likelihoodHigh * 100).toFixed(0)}% | ±${formatDollars(s.swing / 2)} |`
          ),
        ].join('\n')

  const scenarioSection =
    !cba.scenarios
      ? ''
      : [
          '## Scenario Analysis',
          '',
          '| Scenario | Net EV | Benefits | Costs |',
          '|---|---|---|---|',
          `| Optimistic (+15%) | ${cba.scenarios.optimistic.totalEv >= 0 ? '+' : ''}${formatDollars(cba.scenarios.optimistic.totalEv)} | +${formatDollars(cba.scenarios.optimistic.totalBenefits)} | -${formatDollars(cba.scenarios.optimistic.totalCosts)} |`,
          `| Base Case | ${cba.scenarios.base.totalEv >= 0 ? '+' : ''}${formatDollars(cba.scenarios.base.totalEv)} | +${formatDollars(cba.scenarios.base.totalBenefits)} | -${formatDollars(cba.scenarios.base.totalCosts)} |`,
          `| Pessimistic (−15%) | ${cba.scenarios.pessimistic.totalEv >= 0 ? '+' : ''}${formatDollars(cba.scenarios.pessimistic.totalEv)} | +${formatDollars(cba.scenarios.pessimistic.totalBenefits)} | -${formatDollars(cba.scenarios.pessimistic.totalCosts)} |`,
        ].join('\n')

  const deduplicationSection =
    !cba.deduplicationLog?.length
      ? ''
      : [
          '## De-Duplication Log',
          '',
          ...cba.deduplicationLog.map(
            (e) => `- **${e.action}** (${(e.similarity * 100).toFixed(0)}% overlap): ${e.adjustment}`
          ),
        ].join('\n')

  return `# Cost-Benefit Analysis: ${cba.title}

**Date:** ${date}
**Overall Net EV:** ${cba.netExpectedValue >= 0 ? '+' : ''}${formatDollars(cba.netExpectedValue)}
**Verdict:** ${verdictLabel}
**Confidence:** ${confLabel}

## Executive Summary

${cba.description}

${categoryTable}

## Top Benefits

${itemsTable(benefits.slice(0, 5))}

## Top Costs

${itemsTable(costs.slice(0, 5))}

${sensitivitySection}

${scenarioSection}

${deduplicationSection}

## Methodology

Likelihood = pro\_total / (pro\_total + con\_total) from argument trees.
Argument score = truth × linkage × importance (depth attenuation: 0.5^(depth−1)).
Expected value = magnitude × likelihood.
See the [ISE Cost-Benefit Analysis](https://myclob.pbworks.com/w/page/156187122/cost-benefit%20analysis) framework.
`
}

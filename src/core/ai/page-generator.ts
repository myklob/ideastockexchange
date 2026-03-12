/**
 * Distributed AI Framework - Recursive Linked Page Generator
 * Creates interconnected HTML/Markdown pages for argument analysis
 */

import * as fs from 'fs';
import * as path from 'path';
import { IssueAnalysis, Argument, OutputConfig, FrameworkConfig } from './types';
import { AnalysisGenerator } from './analysis-generator';

export class PageGenerator {
  private config: OutputConfig;
  private analysisGenerator: AnalysisGenerator;
  private generatedPages: Map<string, IssueAnalysis> = new Map();
  private fullConfig: FrameworkConfig;

  constructor(config: FrameworkConfig, analysisGenerator: AnalysisGenerator) {
    this.config = config.output;
    this.fullConfig = config;
    this.analysisGenerator = analysisGenerator;
  }

  /**
   * Generate all pages for an analysis, recursively expanding arguments
   */
  async generateAllPages(analysis: IssueAnalysis, depth: number = 0): Promise<string[]> {
    const generatedFiles: string[] = [];

    // Generate main analysis page
    const mainPagePath = await this.generatePage(analysis);
    generatedFiles.push(mainPagePath);
    this.generatedPages.set(analysis.id, analysis);

    // Recursively expand high-scoring arguments if configured
    if (this.fullConfig.analysis.generateLinks && depth < this.fullConfig.analysis.maxDepth) {
      // Expand pro arguments
      for (const arg of analysis.reasonsToAgree) {
        if (this.shouldExpand(arg)) {
          const expandedAnalysis = await this.analysisGenerator.expandArgument(
            arg,
            analysis.title,
            depth + 1
          );
          if (expandedAnalysis) {
            arg.linkedPageId = expandedAnalysis.id;
            const subPages = await this.generateAllPages(expandedAnalysis, depth + 1);
            generatedFiles.push(...subPages);
          }
        }
      }

      // Expand con arguments
      for (const arg of analysis.reasonsToDisagree) {
        if (this.shouldExpand(arg)) {
          const expandedAnalysis = await this.analysisGenerator.expandArgument(
            arg,
            analysis.title,
            depth + 1
          );
          if (expandedAnalysis) {
            arg.linkedPageId = expandedAnalysis.id;
            const subPages = await this.generateAllPages(expandedAnalysis, depth + 1);
            generatedFiles.push(...subPages);
          }
        }
      }

      // Regenerate main page with updated links
      await this.generatePage(analysis);
    }

    // Generate index page if at root level
    if (depth === 0 && this.config.generateIndex) {
      const indexPath = await this.generateIndexPage();
      generatedFiles.push(indexPath);
    }

    return generatedFiles;
  }

  /**
   * Determine if an argument should be expanded into its own page
   */
  private shouldExpand(arg: Argument): boolean {
    const score = arg.score.strengthening || Math.abs(arg.score.weakening || 0);
    return score >= this.fullConfig.analysis.minScoreForExpansion;
  }

  /**
   * Generate a single analysis page
   */
  async generatePage(analysis: IssueAnalysis): Promise<string> {
    const filename = this.slugify(analysis.shortTitle || analysis.title) +
      (this.config.format === 'html' ? '.html' : this.config.format === 'markdown' ? '.md' : '.json');
    const filepath = path.join(this.config.outputDir, filename);

    // Ensure output directory exists
    fs.mkdirSync(this.config.outputDir, { recursive: true });

    let content: string;
    switch (this.config.format) {
      case 'html':
        content = this.renderHTML(analysis);
        break;
      case 'markdown':
        content = this.renderMarkdown(analysis);
        break;
      case 'json':
        content = JSON.stringify(analysis, null, 2);
        break;
    }

    fs.writeFileSync(filepath, content, 'utf-8');
    console.log(`[PageGenerator] Generated: ${filepath}`);

    return filepath;
  }

  /**
   * Generate index page listing all analyses
   */
  async generateIndexPage(): Promise<string> {
    const filename = 'index' + (this.config.format === 'html' ? '.html' : '.md');
    const filepath = path.join(this.config.outputDir, filename);

    const analyses = Array.from(this.generatedPages.values());

    let content: string;
    if (this.config.format === 'html') {
      content = this.renderIndexHTML(analyses);
    } else {
      content = this.renderIndexMarkdown(analyses);
    }

    fs.writeFileSync(filepath, content, 'utf-8');
    console.log(`[PageGenerator] Generated index: ${filepath}`);

    return filepath;
  }

  /**
   * Render analysis as HTML
   */
  private renderHTML(analysis: IssueAnalysis): string {
    const styles = this.config.includeStyles ? this.getStyles() : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(analysis.shortTitle || analysis.title)}</title>
  ${styles}
</head>
<body>
<div class="container">
${this.renderAnalysisHTML(analysis)}
</div>
</body>
</html>`;
  }

  /**
   * Render the analysis content as HTML
   */
  private renderAnalysisHTML(analysis: IssueAnalysis): string {
    const proTotal = analysis.reasonsToAgree.reduce((sum, arg) => sum + (arg.score.strengthening || 0), 0);
    const conTotal = analysis.reasonsToDisagree.reduce((sum, arg) => sum + Math.abs(arg.score.weakening || 0), 0);
    const eviProTotal = analysis.supportingEvidence.reduce((sum, e) => sum + e.contribution, 0);
    const eviConTotal = analysis.weakeningEvidence.reduce((sum, e) => sum + Math.abs(e.contribution), 0);
    const criteriaTotal = analysis.objectiveCriteria.reduce((sum, c) => sum + c.totalScore, 0);

    return `
<div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333;">

<h1>Belief: ${this.escapeHtml(analysis.title)}</h1>

<div style="background-color: #f9f9f9; padding: 15px; border: 1px solid #ddd; margin-bottom: 20px;">
  <p style="text-align: right; margin: 0;"><a href="${this.config.baseUrl}">Topic</a>: ${this.escapeHtml(analysis.topicHierarchy)}</p>
  <p style="text-align: right; margin: 0;">Topic ID: ${this.escapeHtml(analysis.topicId || 'N/A')}</p>
  <p style="text-align: right; margin: 0;">Belief Positivity: <strong>${analysis.beliefPositivity}% (${this.escapeHtml(analysis.beliefPositivityLabel)})</strong></p>
  <p style="text-align: right; font-size: .9em; margin-top: 5px;">Generated by: ${this.escapeHtml(analysis.generatedBy)} | <a href="https://github.com/myklob/ideastockexchange">View technical documentation</a></p>
</div>

<!-- ARGUMENT TREES -->
<h1>🔍 <a href="${this.config.baseUrl}/Reasons">Argument Trees</a></h1>
<p>Each reason is a belief with its own page. Scoring is recursive based on truth, linkage, and importance.</p>

<table style="border-color: #cccccc;" border="1" cellspacing="0" cellpadding="8" width="100%">
<thead>
<tr>
  <th width="55%">✅ Top Reasons to Agree</th>
  <th width="15%">Argument Score</th>
  <th width="15%">Linkage Score</th>
  <th width="15%">Amount Strengthening</th>
</tr>
</thead>
<tbody>
${analysis.reasonsToAgree.map((arg, i) => `
<tr>
  <td>
    <p>${i + 1}. ${arg.title ? `<strong>${this.escapeHtml(arg.title)}:</strong> ` : ''}${this.escapeHtml(arg.content)}
    ${arg.linkedPageId ? `<a href="${this.config.linkPrefix}${this.slugify(arg.title || arg.content)}.html">[Expand →]</a>` : ''}</p>
  </td>
  <td align="center">${arg.score.truthScore}</td>
  <td align="center">${arg.score.linkageScore}%</td>
  <td align="center">+${arg.score.strengthening || 0}</td>
</tr>
`).join('')}
<tr>
  <td colspan="3" align="right"><strong>Total Pro (Weighted):</strong></td>
  <td align="center"><strong>${proTotal.toFixed(1)}</strong></td>
</tr>
</tbody>
</table>

<h2>💀 Counter-Arguments (And Why They Fail)</h2>
<p><em>Each argument gets its own decomposition so you can see exactly where it breaks down.</em></p>

<table style="border-color: #cccccc;" border="1" cellspacing="0" cellpadding="8" width="100%">
<thead>
<tr>
  <th width="55%">❌ Counter-Arguments</th>
  <th width="15%">Score</th>
  <th width="15%">Linkage</th>
  <th width="15%">Weakening</th>
</tr>
</thead>
<tbody>
${analysis.reasonsToDisagree.map((arg, i) => `
<tr>
  <td style="background-color: #fff0f0;" colspan="4"><strong>Counter-Argument #${i + 1}: "${this.escapeHtml(arg.title || arg.content)}"</strong></td>
</tr>
${arg.subArguments && arg.subArguments.length > 0 ? `
<tr>
  <td colspan="4">
    <table border="0" width="100%">
    <tbody>
    <tr>
      <td style="background-color: #ffe6e6;" width="50%" valign="top">
        <strong>Sub-arguments supporting this:</strong><br/>
        ${arg.subArguments.filter(s => s.position === 'supporting').map(s => `- ${this.escapeHtml(s.content)}`).join('<br/>')}
      </td>
      <td style="background-color: #e6ffe6;" width="50%" valign="top">
        <strong>Sub-arguments destroying this:</strong><br/>
        ${arg.subArguments.filter(s => s.position === 'destroying').map(s => `- ${this.escapeHtml(s.content)}`).join('<br/>')}
      </td>
    </tr>
    </tbody>
    </table>
    ${arg.verdict ? `<p style="text-align: right;"><strong>Verdict: ${this.escapeHtml(arg.verdict)}</strong></p>` : ''}
  </td>
</tr>
` : ''}
<tr>
  <td>→ Final score for this counter-argument${arg.linkedPageId ? ` <a href="${this.config.linkPrefix}${this.slugify(arg.title || arg.content)}.html">[Expand →]</a>` : ''}</td>
  <td align="center">${arg.score.truthScore}</td>
  <td align="center">${arg.score.linkageScore}%</td>
  <td align="center">${arg.score.weakening || 0}</td>
</tr>
`).join('')}
<tr>
  <td colspan="3" align="right"><strong>Total Weakening:</strong></td>
  <td align="center"><strong>${(-conTotal).toFixed(1)}</strong></td>
</tr>
</tbody>
</table>

<hr/>

<!-- EVIDENCE -->
<h2>🔬 <a href="${this.config.baseUrl}/Evidence">Best Evidence</a></h2>
<p><em>Key: <strong>T1</strong>=Official Record/Peer-reviewed, <strong>T2</strong>=Institutional Analysis, <strong>T3</strong>=Journalism, <strong>T4</strong>=Anecdote</em></p>

<table style="border-collapse: collapse; border-color: #ccc;" border="1" cellspacing="0" cellpadding="8" width="100%">
<thead>
<tr style="background-color: #e6ffe6;">
  <th width="45%">✅ Top Supporting Evidence</th>
  <th width="15%">Evidence Score</th>
  <th width="15%">Linkage Score</th>
  <th width="10%">Type</th>
  <th width="15%">Contributing Amount</th>
</tr>
</thead>
<tbody>
${analysis.supportingEvidence.map(e => `
<tr>
  <td><strong>${this.escapeHtml(e.title)}:</strong> ${this.escapeHtml(e.description)}${e.critique ? `<br/><em style="color:#666;">${this.escapeHtml(e.critique)}</em>` : ''}</td>
  <td align="center">${e.score}</td>
  <td align="center">${e.linkageScore}%</td>
  <td align="center">${e.type}</td>
  <td align="center">+${e.contribution}</td>
</tr>
`).join('')}
<tr>
  <td colspan="4" align="right"><strong>Total Contributing:</strong></td>
  <td align="center"><strong>${eviProTotal.toFixed(1)}</strong></td>
</tr>
</tbody>
</table>

<br/>

<table style="border-collapse: collapse; border-color: #ccc;" border="1" cellspacing="0" cellpadding="8" width="100%">
<thead>
<tr style="background-color: #ffe6e6;">
  <th width="45%">❌ Top Weakening Evidence</th>
  <th width="15%">Evidence Score</th>
  <th width="15%">Linkage Score</th>
  <th width="10%">Type</th>
  <th width="15%">Amount Weakening</th>
</tr>
</thead>
<tbody>
${analysis.weakeningEvidence.map(e => `
<tr>
  <td><strong>${this.escapeHtml(e.title)}:</strong> ${this.escapeHtml(e.description)}${e.critique ? `<br/><em style="color:#666;">${this.escapeHtml(e.critique)}</em>` : ''}</td>
  <td align="center">${e.score}</td>
  <td align="center">${e.linkageScore}%</td>
  <td align="center">${e.type}</td>
  <td align="center">${e.contribution}</td>
</tr>
`).join('')}
<tr>
  <td colspan="4" align="right"><strong>Total Weakening:</strong></td>
  <td align="center"><strong>${eviConTotal.toFixed(1)}</strong></td>
</tr>
</tbody>
</table>

<hr/>

<!-- OBJECTIVE CRITERIA -->
<h2>📏 <a href="${this.config.baseUrl}/ObjectiveCriteria">Best Objective Criteria</a></h2>

<table style="border-collapse: collapse; border-color: #ccc;" border="1" cellspacing="0" cellpadding="8" width="100%">
<thead>
<tr style="background-color: #f0f0f0;">
  <th width="40%">✅ Top Objective Criteria</th>
  <th width="15%">Independence Score</th>
  <th width="15%">Linkage Score</th>
  <th width="15%">Criteria Type</th>
  <th width="15%">Total Score</th>
</tr>
</thead>
<tbody>
${analysis.objectiveCriteria.map(c => `
<tr>
  <td>${this.escapeHtml(c.description)}</td>
  <td align="center">${c.independenceScore}</td>
  <td align="center">${c.linkageScore}%</td>
  <td align="center">${this.escapeHtml(c.criteriaType)}</td>
  <td align="center">${c.totalScore}</td>
</tr>
`).join('')}
<tr>
  <td colspan="4" align="right"><strong>Total Contributing:</strong></td>
  <td align="center"><strong>${criteriaTotal.toFixed(1)}</strong></td>
</tr>
</tbody>
</table>

<hr/>

<!-- VALUES CONFLICT -->
<h2>⚖️ <a href="${this.config.baseUrl}/Values">Core Values Conflict</a></h2>

<table style="border-collapse: collapse; border-color: #ccc;" border="1" cellspacing="0" cellpadding="8" width="100%">
<thead>
<tr style="background-color: #f0f0f0;">
  <th width="50%">Supporting Values (Reform)</th>
  <th width="50%">Opposing Values (Status Quo)</th>
</tr>
</thead>
<tbody>
<tr>
  <td valign="top">
    <strong>Advertised:</strong><br/>
    ${analysis.valueConflict.supportingSide.advertised.map((v, i) => `${i + 1}. ${this.escapeHtml(v)}`).join('<br/>')}
    <br/><br/>
    <strong>Actual (Critics say):</strong><br/>
    ${analysis.valueConflict.supportingSide.actual.map((v, i) => `${i + 1}. ${this.escapeHtml(v)}`).join('<br/>')}
    <br/><br/>
    <strong>Fears:</strong> ${this.escapeHtml(analysis.valueConflict.supportingSide.fears)}
    <br/>
    <strong>Desires:</strong> ${this.escapeHtml(analysis.valueConflict.supportingSide.desire)}
  </td>
  <td valign="top">
    <strong>Advertised:</strong><br/>
    ${analysis.valueConflict.opposingSide.advertised.map((v, i) => `${i + 1}. ${this.escapeHtml(v)}`).join('<br/>')}
    <br/><br/>
    <strong>Actual (Critics say):</strong><br/>
    ${analysis.valueConflict.opposingSide.actual.map((v, i) => `${i + 1}. ${this.escapeHtml(v)}`).join('<br/>')}
    <br/><br/>
    <strong>Fears:</strong> ${this.escapeHtml(analysis.valueConflict.opposingSide.fears)}
    <br/>
    <strong>Desires:</strong> ${this.escapeHtml(analysis.valueConflict.opposingSide.desire)}
  </td>
</tr>
</tbody>
</table>

<hr/>

<!-- ASSUMPTIONS -->
<h2>📜 <a href="${this.config.baseUrl}/Assumptions">Foundational Assumptions</a></h2>

<table style="border-collapse: collapse; border-color: #ccc;" border="1" cellspacing="0" cellpadding="8" width="100%">
<thead>
<tr style="background-color: #f0f0f0;">
  <th width="50%">Required to Accept This Belief</th>
  <th width="50%">Required to Reject This Belief</th>
</tr>
</thead>
<tbody>
<tr>
  <td valign="top">
    ${analysis.acceptAssumptions.map((a, i) => `${i + 1}. ${this.escapeHtml(a)}`).join('<br/>')}
  </td>
  <td valign="top">
    ${analysis.rejectAssumptions.map((a, i) => `${i + 1}. ${this.escapeHtml(a)}`).join('<br/>')}
  </td>
</tr>
</tbody>
</table>

<hr/>

<!-- COST-BENEFIT -->
<h2>📉 <a href="${this.config.baseUrl}/CostBenefit">Cost-Benefit Analysis</a></h2>

<table style="border-collapse: collapse; border-color: #ccc;" border="1" cellspacing="0" cellpadding="8" width="100%">
<thead>
<tr>
  <th style="background-color: #e6ffe6;" width="50%">📕 Potential Benefits</th>
  <th style="background-color: #ffe6e6;" width="50%">📘 Potential Costs</th>
</tr>
</thead>
<tbody>
<tr>
  <td valign="top">
    ${analysis.benefits.map((b, i) => `${i + 1}. <strong>${this.escapeHtml(b.category)}:</strong> ${this.escapeHtml(b.description)}`).join('<br/>')}
  </td>
  <td valign="top">
    ${analysis.costs.map((c, i) => `${i + 1}. <strong>${this.escapeHtml(c.category)}:</strong> ${this.escapeHtml(c.description)}`).join('<br/>')}
  </td>
</tr>
</tbody>
</table>

<hr/>

<!-- COMPROMISE SOLUTIONS -->
<h2>🤝 <a href="${this.config.baseUrl}/Compromise">Best Compromise Solutions</a></h2>

<table style="border-collapse: collapse; border-color: #ccc;" border="1" cellspacing="0" cellpadding="8" width="100%">
<thead>
<tr style="background-color: #e6f3ff;">
  <th>Solutions Addressing Core Concerns</th>
</tr>
</thead>
<tbody>
<tr>
  <td>
    ${analysis.compromiseSolutions.map((s, i) => `<p><strong>${i + 1}. ${this.escapeHtml(s.title)}:</strong> ${this.escapeHtml(s.description)}</p>`).join('')}
  </td>
</tr>
</tbody>
</table>

<hr/>

<!-- OBSTACLES -->
<h2>🚧 <a href="${this.config.baseUrl}/Obstacles">Primary Obstacles</a></h2>

<ol>
${analysis.obstacles.map(o => `<li>${this.escapeHtml(o.description)}</li>`).join('')}
</ol>

<table border="1" cellpadding="8" width="100%">
<tbody>
<tr>
  <th width="50%">Supporter Blind Spots</th>
  <th width="50%">Opponent Blind Spots</th>
</tr>
<tr>
  <td>${analysis.blindSpots.supporters.map(b => `• ${this.escapeHtml(b)}`).join('<br/>')}</td>
  <td>${analysis.blindSpots.opponents.map(b => `• ${this.escapeHtml(b)}`).join('<br/>')}</td>
</tr>
</tbody>
</table>

<hr/>

<!-- INTERESTS -->
<h2>💡 <a href="${this.config.baseUrl}/Interests">Interests & Motivations</a></h2>

<table style="border-color: #cccccc;" border="1" cellspacing="0" cellpadding="8" width="100%">
<thead>
<tr>
  <th style="text-align: left;" width="50%"><strong>Supporters</strong></th>
  <th style="text-align: left;" width="50%"><strong>Opponents</strong></th>
</tr>
</thead>
<tbody>
<tr>
  <td valign="top">
    ${analysis.supporterInterests.map((int, i) => `${i + 1}. ${this.escapeHtml(int.stakeholder)}: ${int.interests.join(', ')}`).join('<br/>')}
  </td>
  <td valign="top">
    ${analysis.opponentInterests.map((int, i) => `${i + 1}. ${this.escapeHtml(int.stakeholder)}: ${int.interests.join(', ')}`).join('<br/>')}
  </td>
</tr>
</tbody>
</table>

<h3>🔗 Shared and Conflicting Interests</h3>

<table style="border-color: #cccccc;" border="1" cellspacing="0" cellpadding="8" width="100%">
<thead>
<tr>
  <th style="text-align: left;" width="50%"><strong>Shared Interests</strong></th>
  <th style="text-align: left;" width="50%"><strong>Conflicting Interests</strong></th>
</tr>
</thead>
<tbody>
<tr>
  <td valign="top">${analysis.sharedInterests.map((i, idx) => `${idx + 1}. ${this.escapeHtml(i)}`).join('<br/>')}</td>
  <td valign="top">${analysis.conflictingInterests.map((i, idx) => `${idx + 1}. ${this.escapeHtml(i)}`).join('<br/>')}</td>
</tr>
</tbody>
</table>

<hr/>

<!-- MEDIA RESOURCES -->
<h2>📚 <a href="${this.config.baseUrl}/Media">Media Resources</a></h2>

<table style="border-color: #cccccc;" border="1" cellspacing="0" cellpadding="8" width="100%">
<thead>
<tr>
  <th width="50%">📈 Supporting</th>
  <th width="50%">📉 Opposing</th>
</tr>
</thead>
<tbody>
<tr>
  <td valign="top">
    ${analysis.mediaResources.filter(m => m.position === 'supporting').map(m =>
      `<strong>${m.type.charAt(0).toUpperCase() + m.type.slice(1)}:</strong> "${this.escapeHtml(m.title)}"${m.description ? ` - ${this.escapeHtml(m.description)}` : ''}`
    ).join('<br/><br/>')}
  </td>
  <td valign="top">
    ${analysis.mediaResources.filter(m => m.position === 'opposing').map(m =>
      `<strong>${m.type.charAt(0).toUpperCase() + m.type.slice(1)}:</strong> "${this.escapeHtml(m.title)}"${m.description ? ` - ${this.escapeHtml(m.description)}` : ''}`
    ).join('<br/><br/>')}
  </td>
</tr>
</tbody>
</table>

<hr/>

<!-- LEGAL FRAMEWORK -->
<h2>⚖️ <a href="${this.config.baseUrl}/Legal">Legal Framework</a></h2>

<table style="border-color: #cccccc;" border="1" cellspacing="0" cellpadding="8" width="100%">
<thead>
<tr>
  <th width="50%">Supporting Laws</th>
  <th width="50%">Contradicting Laws</th>
</tr>
</thead>
<tbody>
<tr>
  <td valign="top">${analysis.supportingLaws.map((l, i) => `${i + 1}. ${this.escapeHtml(l.description)}`).join('<br/>')}</td>
  <td valign="top">${analysis.contradictingLaws.map((l, i) => `${i + 1}. ${this.escapeHtml(l.description)}`).join('<br/>')}</td>
</tr>
</tbody>
</table>

<hr/>

<!-- BELIEF MAPPING -->
<h2>🧭 <a href="${this.config.baseUrl}/BeliefMapping">General to Specific Belief Mapping</a></h2>

<h3>🔹 Most General (Upstream)</h3>
<table style="border-collapse: collapse; border-color: #ccc;" border="1" cellspacing="0" cellpadding="8" width="100%">
<thead>
<tr style="background-color: #f0f0f0;">
  <th width="50%">Support</th>
  <th width="50%">Oppose</th>
</tr>
</thead>
<tbody>
<tr>
  <td valign="top">${analysis.generalBeliefs.supportBeliefs.map((b, i) => `${i + 1}. ${this.escapeHtml(b)}`).join('<br/>')}</td>
  <td valign="top">${analysis.generalBeliefs.opposeBeliefs.map((b, i) => `${i + 1}. ${this.escapeHtml(b)}`).join('<br/>')}</td>
</tr>
</tbody>
</table>

<h3>🔹 More Specific (Downstream)</h3>
<table style="border-collapse: collapse; border-color: #ccc;" border="1" cellspacing="0" cellpadding="8" width="100%">
<thead>
<tr style="background-color: #f0f0f0;">
  <th width="50%">Support</th>
  <th width="50%">Oppose</th>
</tr>
</thead>
<tbody>
<tr>
  <td valign="top">${analysis.specificBeliefs.supportBeliefs.map((b, i) => `${i + 1}. ${this.escapeHtml(b)}`).join('<br/>')}</td>
  <td valign="top">${analysis.specificBeliefs.opposeBeliefs.map((b, i) => `${i + 1}. ${this.escapeHtml(b)}`).join('<br/>')}</td>
</tr>
</tbody>
</table>

<hr/>

<!-- SIMILAR BELIEFS -->
<h2>🔄 <a href="${this.config.baseUrl}/SimilarBeliefs">Similar Beliefs</a></h2>

<table style="border-color: #cccccc;" border="1" cellspacing="0" cellpadding="8" width="100%">
<thead>
<tr>
  <th width="50%">More Extreme Versions</th>
  <th width="50%">More Moderate Versions</th>
</tr>
</thead>
<tbody>
<tr>
  <td valign="top">${analysis.extremeVersions.map((v, i) => `${i + 1}. ${this.escapeHtml(v)}`).join('<br/>')}</td>
  <td valign="top">${analysis.moderateVersions.map((v, i) => `${i + 1}. ${this.escapeHtml(v)}`).join('<br/>')}</td>
</tr>
</tbody>
</table>

<hr/>

<!-- BIASES -->
<h2>🧠 <a href="${this.config.baseUrl}/Biases">Cognitive Biases</a></h2>

<table border="1" cellpadding="8" width="100%">
<tbody>
<tr>
  <th width="50%">Affecting Supporters</th>
  <th width="50%">Affecting Opponents</th>
</tr>
<tr>
  <td valign="top">
    ${analysis.biases.filter(b => b.affectsSide === 'supporters').map((b, i) => `${i + 1}. <strong>${this.escapeHtml(b.name)}:</strong> ${this.escapeHtml(b.description)}`).join('<br/>')}
  </td>
  <td valign="top">
    ${analysis.biases.filter(b => b.affectsSide === 'opponents').map((b, i) => `${i + 1}. <strong>${this.escapeHtml(b.name)}:</strong> ${this.escapeHtml(b.description)}`).join('<br/>')}
  </td>
</tr>
</tbody>
</table>

<hr/>

<!-- IMPORTANT FACTS -->
<h2>📌 Most Important Supporting Facts</h2>
<ol>
${analysis.importantFacts.map(f => `<li>${this.escapeHtml(f)}</li>`).join('')}
</ol>

<h2>⚠️ Unintended Consequences</h2>
<ol>
${analysis.unintendedConsequences.map(c => `<li>${this.escapeHtml(c)}</li>`).join('')}
</ol>

<hr/>

<!-- FINAL SCORE -->
<p style="text-align: right; font-size: 1.2em; font-weight: bold; margin-top: 20px;">
  Score: ${analysis.finalScore} (${analysis.scoreInterpretation})
  <em>based on <a href="${this.config.baseUrl}/ArgumentScoring">recursive argument scoring</a></em>
</p>

<!-- CONTRIBUTE -->
<h1>📬 Contribute</h1>
<p><a href="https://github.com/myklob/ideastockexchange">View the full codebase on GitHub</a> to understand the scoring algorithms, contribute, or adapt this system.</p>

<p>Start by exploring how we:</p>
<ul>
  <li>Calculate <a href="${this.config.baseUrl}/ArgumentScoring">argument scores from sub-arguments</a></li>
  <li>Measure <a href="${this.config.baseUrl}/Truth">truth</a> and <a href="${this.config.baseUrl}/Evidence">evidence quality</a></li>
  <li>Apply <a href="${this.config.baseUrl}/LinkageScores">linkage scores</a> to weight relevance</li>
  <li>Implement <a href="${this.config.baseUrl}/ReasonRank">ReasonRank</a> for quality-based sorting</li>
</ul>

<p style="text-align: right; font-size: 0.9em; color: #666;">
  Generated: ${analysis.createdAt.toISOString()} | Model: ${this.escapeHtml(analysis.generatedBy)}
</p>

</div>`;
  }

  /**
   * Render analysis as Markdown
   */
  private renderMarkdown(analysis: IssueAnalysis): string {
    return `# Belief: ${analysis.title}

> **Topic:** ${analysis.topicHierarchy}
> **Topic ID:** ${analysis.topicId || 'N/A'}
> **Belief Positivity:** ${analysis.beliefPositivity}% (${analysis.beliefPositivityLabel})
> **Generated by:** ${analysis.generatedBy}

---

## 🔍 Argument Trees

Each reason is a belief with its own page. Scoring is recursive based on truth, linkage, and importance.

### ✅ Top Reasons to Agree

| # | Argument | Score | Linkage | Strengthening |
|---|----------|-------|---------|---------------|
${analysis.reasonsToAgree.map((arg, i) =>
  `| ${i + 1} | **${arg.title || ''}** ${arg.content} ${arg.linkedPageId ? `[Expand →](${this.slugify(arg.title || arg.content)}.md)` : ''} | ${arg.score.truthScore} | ${arg.score.linkageScore}% | +${arg.score.strengthening || 0} |`
).join('\n')}

**Total Pro (Weighted):** ${analysis.reasonsToAgree.reduce((sum, arg) => sum + (arg.score.strengthening || 0), 0).toFixed(1)}

### ❌ Counter-Arguments (And Why They Fail)

${analysis.reasonsToDisagree.map((arg, i) => `
#### Counter-Argument #${i + 1}: "${arg.title || arg.content}"

${arg.subArguments && arg.subArguments.length > 0 ? `
**Supporting sub-arguments:**
${arg.subArguments.filter(s => s.position === 'supporting').map(s => `- ${s.content}`).join('\n')}

**Destroying sub-arguments:**
${arg.subArguments.filter(s => s.position === 'destroying').map(s => `- ${s.content}`).join('\n')}

${arg.verdict ? `**Verdict:** ${arg.verdict}` : ''}
` : ''}

| Score | Linkage | Weakening |
|-------|---------|-----------|
| ${arg.score.truthScore} | ${arg.score.linkageScore}% | ${arg.score.weakening || 0} |
`).join('\n')}

**Total Weakening:** ${(-analysis.reasonsToDisagree.reduce((sum, arg) => sum + Math.abs(arg.score.weakening || 0), 0)).toFixed(1)}

---

## 🔬 Best Evidence

### ✅ Supporting Evidence

| Evidence | Score | Linkage | Type | Contribution |
|----------|-------|---------|------|--------------|
${analysis.supportingEvidence.map(e =>
  `| **${e.title}:** ${e.description} | ${e.score} | ${e.linkageScore}% | ${e.type} | +${e.contribution} |`
).join('\n')}

### ❌ Weakening Evidence

| Evidence | Score | Linkage | Type | Weakening |
|----------|-------|---------|------|-----------|
${analysis.weakeningEvidence.map(e =>
  `| **${e.title}:** ${e.description} | ${e.score} | ${e.linkageScore}% | ${e.type} | ${e.contribution} |`
).join('\n')}

---

## ⚖️ Core Values Conflict

| Supporting Values | Opposing Values |
|-------------------|-----------------|
| **Advertised:** ${analysis.valueConflict.supportingSide.advertised.join(', ')} | **Advertised:** ${analysis.valueConflict.opposingSide.advertised.join(', ')} |
| **Actual:** ${analysis.valueConflict.supportingSide.actual.join(', ')} | **Actual:** ${analysis.valueConflict.opposingSide.actual.join(', ')} |
| **Fears:** ${analysis.valueConflict.supportingSide.fears} | **Fears:** ${analysis.valueConflict.opposingSide.fears} |

---

## 📜 Foundational Assumptions

| Required to Accept | Required to Reject |
|--------------------|-------------------|
${Math.max(analysis.acceptAssumptions.length, analysis.rejectAssumptions.length) > 0 ?
  Array.from({ length: Math.max(analysis.acceptAssumptions.length, analysis.rejectAssumptions.length) })
    .map((_, i) => `| ${analysis.acceptAssumptions[i] || ''} | ${analysis.rejectAssumptions[i] || ''} |`)
    .join('\n')
  : '| N/A | N/A |'}

---

## 🤝 Compromise Solutions

${analysis.compromiseSolutions.map((s, i) => `${i + 1}. **${s.title}:** ${s.description}`).join('\n')}

---

## 📌 Most Important Facts

${analysis.importantFacts.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## ⚠️ Unintended Consequences

${analysis.unintendedConsequences.map((c, i) => `${i + 1}. ${c}`).join('\n')}

---

**Final Score:** ${analysis.finalScore} (${analysis.scoreInterpretation})

*Generated: ${analysis.createdAt.toISOString()} | Model: ${analysis.generatedBy}*

---

## 📬 Contribute

[View the full codebase on GitHub](https://github.com/myklob/ideastockexchange)
`;
  }

  /**
   * Render index page as HTML
   */
  private renderIndexHTML(analyses: IssueAnalysis[]): string {
    const styles = this.config.includeStyles ? this.getStyles() : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Idea Stock Exchange - Argument Analysis Index</title>
  ${styles}
</head>
<body>
<div class="container">
  <h1>🔍 Idea Stock Exchange - Analysis Index</h1>
  <p>Comprehensive argument analyses generated using the distributed AI framework.</p>

  <table border="1" cellspacing="0" cellpadding="10" width="100%">
  <thead>
    <tr style="background-color: #f0f0f0;">
      <th width="50%">Topic</th>
      <th width="15%">Score</th>
      <th width="20%">Interpretation</th>
      <th width="15%">Generated</th>
    </tr>
  </thead>
  <tbody>
  ${analyses.map(a => `
    <tr>
      <td><a href="${this.slugify(a.shortTitle || a.title)}.html">${this.escapeHtml(a.shortTitle || a.title)}</a></td>
      <td align="center">${a.finalScore}</td>
      <td align="center">${a.scoreInterpretation}</td>
      <td align="center">${a.createdAt.toLocaleDateString()}</td>
    </tr>
  `).join('')}
  </tbody>
  </table>

  <hr/>
  <p><a href="https://github.com/myklob/ideastockexchange">View the source code on GitHub</a></p>
</div>
</body>
</html>`;
  }

  /**
   * Render index page as Markdown
   */
  private renderIndexMarkdown(analyses: IssueAnalysis[]): string {
    return `# 🔍 Idea Stock Exchange - Analysis Index

Comprehensive argument analyses generated using the distributed AI framework.

| Topic | Score | Interpretation | Generated |
|-------|-------|----------------|-----------|
${analyses.map(a =>
  `| [${a.shortTitle || a.title}](${this.slugify(a.shortTitle || a.title)}.md) | ${a.finalScore} | ${a.scoreInterpretation} | ${a.createdAt.toLocaleDateString()} |`
).join('\n')}

---

[View the source code on GitHub](https://github.com/myklob/ideastockexchange)
`;
  }

  /**
   * Get inline CSS styles
   */
  private getStyles(): string {
    return `<style>
body {
  font-family: 'Segoe UI', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
.container {
  background: #fff;
  padding: 20px;
}
h1, h2, h3 {
  color: #2c3e50;
}
table {
  border-collapse: collapse;
  width: 100%;
  margin: 15px 0;
}
th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}
th {
  background-color: #f0f0f0;
}
a {
  color: #3498db;
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}
hr {
  border: none;
  border-top: 1px solid #ddd;
  margin: 30px 0;
}
</style>`;
  }

  /**
   * Convert text to URL-safe slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

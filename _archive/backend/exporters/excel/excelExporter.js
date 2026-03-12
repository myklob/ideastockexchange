/**
 * Excel Exporter Service
 * Generates Excel workbooks from ISE belief data
 *
 * NOTE: Requires 'exceljs' package to be installed:
 * npm install exceljs
 */

import ExcelJS from 'exceljs';
import dataExtractor from '../common/dataExtractor.js';

class ExcelExporter {
  constructor() {
    this.workbook = null;
  }

  /**
   * Export a belief to Excel workbook
   * @param {String} beliefId - MongoDB ObjectId
   * @param {String} outputPath - Path to save the Excel file
   * @returns {Promise<String>} Path to the generated file
   */
  async exportBelief(beliefId, outputPath) {
    try {
      // Extract data
      console.log('Extracting belief data...');
      const data = await dataExtractor.extractBeliefData(beliefId);

      // Create workbook
      console.log('Creating Excel workbook...');
      this.workbook = new ExcelJS.Workbook();
      this.workbook.creator = 'ISE Export System';
      this.workbook.lastModifiedBy = 'ISE Export System';
      this.workbook.created = new Date();
      this.workbook.modified = new Date();

      // Add sheets
      await this.createBeliefMasterSheet(data);
      await this.createArgumentsSheet(data);
      await this.createEvidenceSheet(data);
      await this.createLawsSheet(data);
      await this.createAssumptionsSheet(data);
      await this.createDashboardSheet(data);
      await this.createFormulasReferenceSheet();

      // Enable iterative calculation (for circular references)
      this.workbook.calcProperties = {
        fullCalcOnLoad: true,
        iterate: true,
        iterateCount: 100,
        iterateDelta: 0.001
      };

      // Save workbook
      console.log(`Saving workbook to ${outputPath}...`);
      await this.workbook.xlsx.writeFile(outputPath);

      console.log('Export completed successfully!');
      return outputPath;
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  }

  /**
   * Create Beliefs_Master sheet
   */
  async createBeliefMasterSheet(data) {
    const { belief } = data;
    const sheet = this.workbook.addWorksheet('Beliefs_Master');

    // Define columns
    sheet.columns = [
      { header: 'Belief_ID', key: 'id', width: 30 },
      { header: 'Belief_Statement', key: 'statement', width: 50 },
      { header: 'Topic_Category', key: 'category', width: 20 },
      { header: 'Topic_Subcategory', key: 'subcategory', width: 20 },
      { header: 'Final_Score', key: 'finalScore', width: 15 },
      { header: 'Truth_Score', key: 'truthScore', width: 15 },
      { header: 'Specificity', key: 'specificity', width: 15 },
      { header: 'Sentiment_Polarity', key: 'sentiment', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Date_Created', key: 'created', width: 20 },
      { header: 'Date_Modified', key: 'modified', width: 20 }
    ];

    // Style header row
    sheet.getRow(1).font = { bold: true, size: 12 };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    sheet.getRow(1).font = { ...sheet.getRow(1).font, color: { argb: 'FFFFFFFF' } };

    // Add data row
    sheet.addRow({
      id: belief._id.toString(),
      statement: belief.statement,
      category: belief.category || 'other',
      subcategory: belief.tags?.[0] || '',
      finalScore: belief.conclusionScore || 50,
      truthScore: belief.conclusionScore || 50, // TODO: Calculate truth score
      specificity: belief.dimensions?.specificity || 50,
      sentiment: belief.dimensions?.sentimentPolarity || 0,
      status: belief.status || 'active',
      created: belief.createdAt,
      modified: belief.updatedAt
    });

    // Apply conditional formatting to Final_Score
    sheet.addConditionalFormatting({
      ref: 'E2:E100',
      rules: [
        {
          type: 'cellIs',
          operator: 'greaterThan',
          formulae: [60],
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              bgColor: { argb: 'FF00FF00' }
            }
          }
        },
        {
          type: 'cellIs',
          operator: 'lessThan',
          formulae: [40],
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              bgColor: { argb: 'FFFF0000' }
            }
          }
        }
      ]
    });

    // Freeze header row
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
  }

  /**
   * Create Arguments sheet
   */
  async createArgumentsSheet(data) {
    const { arguments: args, belief } = data;
    const sheet = this.workbook.addWorksheet('Arguments');

    // Define columns
    sheet.columns = [
      { header: 'Argument_ID', key: 'id', width: 30 },
      { header: 'Parent_Belief_ID', key: 'beliefId', width: 30 },
      { header: 'Argument_Statement', key: 'content', width: 50 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Linkage_Score', key: 'linkageScore', width: 15 },
      { header: 'Importance_Weight', key: 'importance', width: 20 },
      { header: 'Logical_Score', key: 'logical', width: 15 },
      { header: 'Evidence_Strength', key: 'evidenceStrength', width: 20 },
      { header: 'Overall_Score', key: 'overall', width: 15 },
      { header: 'ReasonRank_Score', key: 'reasonRank', width: 20 },
      { header: 'Lifecycle_Status', key: 'lifecycle', width: 20 },
      { header: 'Weighted_Contribution', key: 'contribution', width: 25 },
      { header: 'Date_Created', key: 'created', width: 20 }
    ];

    // Style header
    this.styleHeaderRow(sheet, 1);

    // Add argument rows
    args.forEach(arg => {
      const linkageScore = arg.scores?.linkage || 50;
      const importance = arg.scores?.importance || 50;
      const evidenceStrength = arg.scores?.evidenceStrength || 1.0;
      const overall = arg.scores?.overall || 50;
      const reasonRank = arg.reasonRankScore || 50;

      // Calculate weighted contribution
      // Formula: (linkageScore * overall / 100) * (importance / 10)
      const contribution = (linkageScore * overall / 100) * (importance / 10);

      sheet.addRow({
        id: arg._id,
        beliefId: belief._id.toString(),
        content: arg.content,
        type: arg.type === 'supporting' ? 'Agree' : 'Disagree',
        linkageScore: linkageScore,
        importance: importance / 10, // Scale to 1-10
        logical: arg.scores?.logical || 50,
        evidenceStrength: Math.round(evidenceStrength * 100),
        overall: overall,
        reasonRank: reasonRank,
        lifecycle: arg.lifecycleStatus || 'active',
        contribution: contribution,
        created: arg.createdAt
      });
    });

    // Apply conditional formatting
    this.applyArgumentFormatting(sheet, args.length + 1);

    // Freeze header
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
  }

  /**
   * Create Evidence sheet
   */
  async createEvidenceSheet(data) {
    const { evidence } = data;
    const sheet = this.workbook.addWorksheet('Evidence');

    // Define columns
    sheet.columns = [
      { header: 'Evidence_ID', key: 'id', width: 30 },
      { header: 'Evidence_Title', key: 'title', width: 40 },
      { header: 'Evidence_Description', key: 'description', width: 50 },
      { header: 'Evidence_Type', key: 'type', width: 20 },
      { header: 'Evidence_Tier', key: 'tier', width: 15 },
      { header: 'Credibility_Score', key: 'credibility', width: 20 },
      { header: 'Verification_Status', key: 'verification', width: 20 },
      { header: 'Source_URL', key: 'url', width: 40 },
      { header: 'Source_Author', key: 'author', width: 30 },
      { header: 'Source_Date', key: 'date', width: 20 },
      { header: 'Submitted_By', key: 'submittedBy', width: 20 }
    ];

    // Style header
    this.styleHeaderRow(sheet, 1);

    // Add evidence rows
    evidence.forEach(ev => {
      // Map evidence type to tier
      const tier = this.mapEvidenceTypeToTier(ev.type);

      sheet.addRow({
        id: ev._id,
        title: ev.title,
        description: ev.description,
        type: ev.type,
        tier: tier,
        credibility: ev.credibilityScore,
        verification: ev.verificationStatus,
        url: ev.source?.url || '',
        author: ev.source?.author || '',
        date: ev.source?.date || '',
        submittedBy: ev.submittedBy
      });

      // Make URL a hyperlink
      const lastRow = sheet.lastRow;
      if (ev.source?.url) {
        lastRow.getCell(8).value = {
          text: ev.source.url,
          hyperlink: ev.source.url
        };
        lastRow.getCell(8).font = { color: { argb: 'FF0000FF' }, underline: true };
      }
    });

    // Freeze header
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
  }

  /**
   * Create Laws sheet
   */
  async createLawsSheet(data) {
    const { laws } = data;
    const sheet = this.workbook.addWorksheet('Laws');

    // Define columns
    sheet.columns = [
      { header: 'Law_ID', key: 'id', width: 30 },
      { header: 'Law_Title', key: 'title', width: 40 },
      { header: 'Official_Name', key: 'officialName', width: 40 },
      { header: 'Jurisdiction_Country', key: 'country', width: 20 },
      { header: 'Jurisdiction_Level', key: 'level', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Relationship', key: 'relationship', width: 15 },
      { header: 'Relationship_Strength', key: 'strength', width: 25 },
      { header: 'Enacted_Date', key: 'enacted', width: 20 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Enforcement_Score', key: 'enforcement', width: 20 },
      { header: 'Overall_Score', key: 'overall', width: 15 }
    ];

    // Style header
    this.styleHeaderRow(sheet, 1);

    // Add law rows
    laws.forEach(law => {
      sheet.addRow({
        id: law._id,
        title: law.title,
        officialName: law.officialName,
        country: law.jurisdiction?.country || '',
        level: law.jurisdiction?.level || '',
        status: law.status,
        relationship: law.relationship,
        strength: law.relationshipStrength,
        enacted: law.enactedDate,
        category: law.category,
        enforcement: law.scores?.enforcement || 50,
        overall: law.scores?.overall || 50
      });
    });

    // Apply conditional formatting based on relationship
    this.applyLawFormatting(sheet, laws.length + 1);

    // Freeze header
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
  }

  /**
   * Create Assumptions sheet
   */
  async createAssumptionsSheet(data) {
    const { assumptions } = data;
    const sheet = this.workbook.addWorksheet('Assumptions');

    // Define columns
    sheet.columns = [
      { header: 'Assumption_ID', key: 'id', width: 30 },
      { header: 'Assumption_Statement', key: 'statement', width: 50 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Required_For', key: 'requiredFor', width: 20 },
      { header: 'Must_Accept', key: 'mustAccept', width: 15 },
      { header: 'Must_Reject', key: 'mustReject', width: 15 },
      { header: 'Aggregate_Score', key: 'score', width: 20 },
      { header: 'Criticality_Reason', key: 'reason', width: 40 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Votes', key: 'votes', width: 10 }
    ];

    // Style header
    this.styleHeaderRow(sheet, 1);

    // Add assumption rows
    assumptions.forEach(assumption => {
      const requiredFor = assumption.mustAccept ? 'Accept Belief' :
                         assumption.mustReject ? 'Reject Belief' : 'Neither';

      sheet.addRow({
        id: assumption._id,
        statement: assumption.statement,
        description: assumption.description,
        requiredFor: requiredFor,
        mustAccept: assumption.mustAccept ? 'YES' : 'NO',
        mustReject: assumption.mustReject ? 'YES' : 'NO',
        score: assumption.aggregateScore,
        reason: assumption.criticalityReason,
        status: assumption.status,
        votes: assumption.votes || 0
      });
    });

    // Freeze header
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
  }

  /**
   * Create Dashboard sheet with summary and charts
   */
  async createDashboardSheet(data) {
    const { belief, arguments: args } = data;
    const sheet = this.workbook.addWorksheet('Dashboard');

    // Set up dashboard layout
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'Belief Analysis Dashboard';
    titleCell.font = { size: 18, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Belief statement
    sheet.mergeCells('A3:F4');
    const beliefCell = sheet.getCell('A3');
    beliefCell.value = belief.statement;
    beliefCell.font = { size: 14, bold: true };
    beliefCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

    // Score summary
    sheet.getCell('A6').value = 'Final Belief Score:';
    sheet.getCell('B6').value = belief.conclusionScore || 50;
    sheet.getCell('B6').font = { size: 16, bold: true };
    sheet.getCell('B6').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: belief.conclusionScore >= 60 ? 'FF00FF00' :
                       belief.conclusionScore <= 40 ? 'FFFF0000' : 'FFFFFF00' }
    };

    // Argument counts
    const supporting = args.filter(a => a.type === 'supporting').length;
    const opposing = args.filter(a => a.type === 'opposing').length;

    sheet.getCell('A8').value = 'Supporting Arguments:';
    sheet.getCell('B8').value = supporting;
    sheet.getCell('B8').font = { color: { argb: 'FF008000' } };

    sheet.getCell('A9').value = 'Opposing Arguments:';
    sheet.getCell('B9').value = opposing;
    sheet.getCell('B9').font = { color: { argb: 'FFFF0000' } };

    // Top arguments section
    sheet.getCell('A11').value = 'Top Supporting Arguments';
    sheet.getCell('A11').font = { bold: true, size: 12 };

    const topSupporting = args
      .filter(a => a.type === 'supporting')
      .sort((a, b) => (b.reasonRankScore || 0) - (a.reasonRankScore || 0))
      .slice(0, 5);

    let row = 12;
    topSupporting.forEach((arg, i) => {
      sheet.getCell(`A${row}`).value = `${i + 1}. ${arg.content.substring(0, 100)}...`;
      sheet.getCell(`B${row}`).value = arg.reasonRankScore || 50;
      row++;
    });

    // Column widths
    sheet.getColumn('A').width = 50;
    sheet.getColumn('B').width = 15;
  }

  /**
   * Create Formulas_Reference sheet with documentation
   */
  async createFormulasReferenceSheet() {
    const sheet = this.workbook.addWorksheet('Formulas_Reference');

    // Title
    sheet.mergeCells('A1:D1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'ISE Formula Reference Guide';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };

    let row = 3;

    // Add formula documentation
    const formulas = [
      {
        name: 'Belief Score',
        formula: 'SUM(Supporting Weighted Contributions) - SUM(Opposing Weighted Contributions)',
        description: 'The final belief score is calculated by summing all supporting argument contributions and subtracting all opposing argument contributions.',
        range: '0-100 (can be negative if very weak)'
      },
      {
        name: 'Weighted Contribution',
        formula: '(Linkage_Score × Overall_Score / 100) × (Importance / 10)',
        description: 'Each argument contributes to the belief score based on how strongly it links to the belief, its overall quality, and its importance.',
        range: 'Typically 0-100'
      },
      {
        name: 'Overall Argument Score',
        formula: 'Evidence_Strength × Logical_Coherence × Verification × Linkage × Uniqueness × Importance',
        description: 'Multiplicative formula - weakness in any dimension significantly reduces the score.',
        range: '0-100'
      },
      {
        name: 'ReasonRank Score',
        formula: '(Evidence_Support × 0.4) + (Resistance × 0.3) + (Network_Position × 0.2) + (Expert_Consensus × 0.1)',
        description: 'PageRank-inspired algorithm that considers evidence quality, resistance to counterarguments, network position, and community validation.',
        range: '0-100'
      },
      {
        name: 'Evidence Tier Values',
        formula: 'Tier 1 = 100, Tier 2 = 75, Tier 3 = 50, Tier 4 = 25',
        description: 'Tier 1: Peer-reviewed studies, Tier 2: Expert analysis, Tier 3: Journalism, Tier 4: Opinion',
        range: '25-100'
      }
    ];

    formulas.forEach(f => {
      sheet.getCell(`A${row}`).value = f.name;
      sheet.getCell(`A${row}`).font = { bold: true, size: 12 };
      row++;

      sheet.getCell(`A${row}`).value = 'Formula:';
      sheet.getCell(`B${row}`).value = f.formula;
      row++;

      sheet.getCell(`A${row}`).value = 'Description:';
      sheet.mergeCells(`B${row}:D${row}`);
      sheet.getCell(`B${row}`).value = f.description;
      sheet.getCell(`B${row}`).alignment = { wrapText: true };
      row++;

      sheet.getCell(`A${row}`).value = 'Range:';
      sheet.getCell(`B${row}`).value = f.range;
      row += 2;
    });

    // Documentation links
    sheet.getCell(`A${row}`).value = 'Documentation Links:';
    sheet.getCell(`A${row}`).font = { bold: true, size: 12 };
    row++;

    const links = [
      { text: 'Argument Scores from Sub-Argument Scores', url: 'https://github.com/myklob/ideastockexchange/wiki' },
      { text: 'Truth Scoring', url: 'https://github.com/myklob/ideastockexchange/wiki/Truth-Score' },
      { text: 'Linkage Scores', url: 'https://github.com/myklob/ideastockexchange/wiki/Evidence-to-Conclusion-Relevance-Score' },
      { text: 'Evidence Quality', url: 'https://github.com/myklob/ideastockexchange/wiki/Evidence-Verification-Score-(EVS)' },
      { text: 'Cost-Benefit Analysis', url: 'https://github.com/myklob/ideastockexchange/wiki' },
      { text: 'GitHub Repository', url: 'https://github.com/myklob/ideastockexchange' }
    ];

    links.forEach(link => {
      sheet.getCell(`A${row}`).value = {
        text: link.text,
        hyperlink: link.url
      };
      sheet.getCell(`A${row}`).font = { color: { argb: 'FF0000FF' }, underline: true };
      row++;
    });

    // Column widths
    sheet.getColumn('A').width = 30;
    sheet.getColumn('B').width = 50;
    sheet.getColumn('C').width = 20;
    sheet.getColumn('D').width = 20;
  }

  /**
   * Helper: Style header row
   */
  styleHeaderRow(sheet, rowNumber) {
    const headerRow = sheet.getRow(rowNumber);
    headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  /**
   * Helper: Apply conditional formatting to Arguments sheet
   */
  applyArgumentFormatting(sheet, maxRow) {
    // Color code by type
    for (let i = 2; i <= maxRow; i++) {
      const typeCell = sheet.getCell(`D${i}`);
      if (typeCell.value === 'Agree') {
        typeCell.font = { color: { argb: 'FF008000' }, bold: true };
      } else if (typeCell.value === 'Disagree') {
        typeCell.font = { color: { argb: 'FFFF0000' }, bold: true };
      }
    }
  }

  /**
   * Helper: Apply conditional formatting to Laws sheet
   */
  applyLawFormatting(sheet, maxRow) {
    for (let i = 2; i <= maxRow; i++) {
      const relCell = sheet.getCell(`G${i}`);
      if (relCell.value === 'supports') {
        relCell.font = { color: { argb: 'FF008000' }, bold: true };
      } else if (relCell.value === 'opposes') {
        relCell.font = { color: { argb: 'FFFF0000' }, bold: true };
      }
    }
  }

  /**
   * Helper: Map evidence type to tier
   */
  mapEvidenceTypeToTier(type) {
    const tierMap = {
      'study': 'Tier 1',
      'data': 'Tier 1',
      'article': 'Tier 3',
      'book': 'Tier 2',
      'expert-opinion': 'Tier 2',
      'video': 'Tier 3',
      'image': 'Tier 4',
      'other': 'Tier 4'
    };
    return tierMap[type] || 'Tier 4';
  }

  /**
   * Export multiple beliefs to a single workbook
   */
  async exportMultipleBeliefs(beliefIds, outputPath) {
    try {
      console.log(`Extracting ${beliefIds.length} beliefs...`);
      const allData = await dataExtractor.extractMultipleBeliefs(beliefIds);

      this.workbook = new ExcelJS.Workbook();
      this.workbook.creator = 'ISE Export System';

      // Create a master sheet with all beliefs
      const masterSheet = this.workbook.addWorksheet('All_Beliefs');
      this.createMultiBeliefSheet(masterSheet, allData);

      // Save
      await this.workbook.xlsx.writeFile(outputPath);
      console.log('Multi-belief export completed!');
      return outputPath;
    } catch (error) {
      console.error('Error exporting multiple beliefs:', error);
      throw error;
    }
  }

  /**
   * Helper: Create sheet with multiple beliefs
   */
  createMultiBeliefSheet(sheet, allData) {
    sheet.columns = [
      { header: 'Belief_ID', key: 'id', width: 30 },
      { header: 'Statement', key: 'statement', width: 60 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Score', key: 'score', width: 12 },
      { header: 'Supporting_Args', key: 'supporting', width: 18 },
      { header: 'Opposing_Args', key: 'opposing', width: 18 },
      { header: 'Evidence_Count', key: 'evidence', width: 18 },
      { header: 'Laws_Count', key: 'laws', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];

    this.styleHeaderRow(sheet, 1);

    allData.forEach(data => {
      const { belief, arguments: args, evidence, laws } = data;
      sheet.addRow({
        id: belief._id.toString(),
        statement: belief.statement,
        category: belief.category || 'other',
        score: belief.conclusionScore || 50,
        supporting: args.filter(a => a.type === 'supporting').length,
        opposing: args.filter(a => a.type === 'opposing').length,
        evidence: evidence.length,
        laws: laws.length,
        status: belief.status || 'active'
      });
    });

    sheet.views = [{ state: 'frozen', ySplit: 1 }];
  }
}

export default new ExcelExporter();

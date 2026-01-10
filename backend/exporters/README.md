# ISE Export/Import System

## Overview

The ISE Export/Import system allows users to export belief analysis data from the Idea Stock Exchange database into Microsoft Excel workbooks and Microsoft Access databases. This enables offline analysis, data portability, and use of familiar tools for exploring belief arguments and evidence.

## Features

### Excel Export ✅ (Implemented)

- **Multi-sheet workbooks** with comprehensive belief data
- **Automatic formulas** for score calculations
- **Conditional formatting** for visual data analysis
- **Dashboard views** with summary statistics
- **Data validation** and structured input
- **Named ranges** for easy formula references
- **Hyperlinked sources** for evidence URLs

### Access Export 🔄 (Coming Soon)

- **Normalized relational database** structure
- **Queries** for complex data analysis
- **Forms** for data entry and viewing
- **Reports** for printing belief analyses
- **Relationships** with referential integrity

## Installation

1. Install the required dependency:
   ```bash
   cd backend
   npm install
   ```

2. The `exceljs` package should be automatically installed via `package.json`.

3. Verify installation:
   ```bash
   npm list exceljs
   ```

## API Endpoints

### Get Export Information
```http
GET /api/export/info
```

Returns information about supported export formats and features.

**Response:**
```json
{
  "success": true,
  "supportedFormats": ["excel", "access"],
  "excelFormats": [".xlsx", ".xlsm"],
  "features": {
    "excel": {
      "sheets": ["Beliefs_Master", "Arguments", "Evidence", ...],
      "features": ["Conditional Formatting", "Data Validation", ...]
    }
  }
}
```

### Export Single Belief to Excel
```http
POST /api/export/belief/:beliefId/excel
```

Exports a single belief with all related data to an Excel workbook.

**Request Body:**
```json
{
  "filename": "optional_filename.xlsx"
}
```

**Response:**
- Downloads Excel file directly
- Filename: `belief_{beliefId}_{timestamp}.xlsx` (if not specified)

**Example:**
```bash
curl -X POST http://localhost:5000/api/export/belief/507f1f77bcf86cd799439011/excel \
  -H "Content-Type: application/json" \
  -d '{"filename": "my_belief_analysis.xlsx"}' \
  --output my_belief_analysis.xlsx
```

### Export Multiple Beliefs to Excel
```http
POST /api/export/beliefs/excel
```

Exports multiple beliefs to a single workbook.

**Request Body:**
```json
{
  "beliefIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
  "filename": "optional_filename.xlsx"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/export/beliefs/excel \
  -H "Content-Type: application/json" \
  -d '{
    "beliefIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
    "filename": "multiple_beliefs.xlsx"
  }' \
  --output multiple_beliefs.xlsx
```

### Export Category to Excel
```http
GET /api/export/category/:category/excel?limit=100
```

Exports all beliefs in a specific category.

**Parameters:**
- `category` (path): Category name (politics, science, technology, etc.)
- `limit` (query): Maximum number of beliefs to export (default: 100)

**Example:**
```bash
curl http://localhost:5000/api/export/category/politics/excel?limit=50 \
  --output politics_beliefs.xlsx
```

## Excel Workbook Structure

### Sheet 1: Beliefs_Master

Primary belief information.

| Column | Description |
|--------|-------------|
| Belief_ID | Unique MongoDB ObjectId |
| Belief_Statement | The belief statement text |
| Topic_Category | Category (politics, science, etc.) |
| Topic_Subcategory | First tag or empty |
| Final_Score | Calculated belief score (0-100) |
| Truth_Score | Truth score calculation |
| Specificity | Specificity dimension (0-100) |
| Sentiment_Polarity | Sentiment toward topic (-100 to 100) |
| Status | active, draft, archived, flagged |
| Date_Created | Creation timestamp |
| Date_Modified | Last modification timestamp |

**Conditional Formatting:**
- Green fill: Final_Score > 60
- Red fill: Final_Score < 40

### Sheet 2: Arguments

All arguments supporting or opposing the belief.

| Column | Description |
|--------|-------------|
| Argument_ID | Unique argument ID |
| Parent_Belief_ID | Belief this argument supports/opposes |
| Argument_Statement | Argument text content |
| Type | "Agree" or "Disagree" |
| Linkage_Score | How relevant to belief (0-100) |
| Importance_Weight | Importance (1-10) |
| Logical_Score | Logical soundness (0-100) |
| Evidence_Strength | Quality of evidence (0-100) |
| Overall_Score | Overall argument quality (0-100) |
| ReasonRank_Score | ReasonRank algorithm score (0-100) |
| Lifecycle_Status | active, weakened, outdated, refuted, conditional |
| Weighted_Contribution | Calculated contribution to belief score |
| Date_Created | Creation timestamp |

**Formulas:**
- `Weighted_Contribution = (Linkage_Score × Overall_Score / 100) × (Importance_Weight / 10)`

**Color Coding:**
- "Agree" arguments: Green text
- "Disagree" arguments: Red text

### Sheet 3: Evidence

Evidence supporting arguments.

| Column | Description |
|--------|-------------|
| Evidence_ID | Unique evidence ID |
| Evidence_Title | Title of evidence |
| Evidence_Description | Detailed description |
| Evidence_Type | study, article, book, video, image, data, expert-opinion |
| Evidence_Tier | Tier 1-4 (quality ranking) |
| Credibility_Score | Credibility rating (0-100) |
| Verification_Status | unverified, pending, verified, disputed, debunked |
| Source_URL | Clickable hyperlink to source |
| Source_Author | Author/creator |
| Source_Date | Publication date |
| Submitted_By | Username who submitted |

**Evidence Tier Mapping:**
- **Tier 1** (100 pts): Peer-reviewed studies, scientific data
- **Tier 2** (75 pts): Expert opinion, books by experts
- **Tier 3** (50 pts): News articles, journalism
- **Tier 4** (25 pts): Videos, images, opinion pieces

### Sheet 4: Laws

Laws that support or oppose the belief.

| Column | Description |
|--------|-------------|
| Law_ID | Unique law ID |
| Law_Title | Title of the law |
| Official_Name | Official legal name/statute |
| Jurisdiction_Country | Country where law applies |
| Jurisdiction_Level | international, federal, national, state, local |
| Status | proposed, enacted, active, amended, repealed, challenged |
| Relationship | supports, opposes, neutral |
| Relationship_Strength | How strongly related (0-100) |
| Enacted_Date | When law was enacted |
| Category | criminal, civil, environmental, etc. |
| Enforcement_Score | How well enforced (0-100) |
| Overall_Score | Overall law impact score |

**Color Coding:**
- "supports" relationship: Green text
- "opposes" relationship: Red text

### Sheet 5: Assumptions

Assumptions underlying the belief or its arguments.

| Column | Description |
|--------|-------------|
| Assumption_ID | Unique assumption ID |
| Assumption_Statement | The assumption text |
| Description | Detailed description |
| Required_For | "Accept Belief", "Reject Belief", or "Neither" |
| Must_Accept | YES/NO - must accept for belief to hold |
| Must_Reject | YES/NO - must reject for belief to hold |
| Aggregate_Score | Weighted score from dependent arguments (0-100) |
| Criticality_Reason | Why this assumption is critical |
| Status | proposed, accepted, rejected, debated, archived |
| Votes | Net community votes |

### Sheet 6: Dashboard

Visual summary of the belief analysis.

**Includes:**
- Belief statement (large, centered)
- Final belief score (color-coded)
- Argument counts (supporting vs opposing)
- Top 5 supporting arguments with scores
- Top 5 opposing arguments with scores
- Summary statistics

### Sheet 7: Formulas_Reference

Documentation of all formulas used in the ISE system.

**Includes:**
- Formula explanations in plain English
- Excel syntax examples
- Score ranges and interpretations
- Links to ISE technical documentation:
  - [Argument Scores](https://myclob.pbworks.com/w/page/159333015/Argument%20scores%20from%20sub-argument%20scores)
  - [Truth Scoring](https://myclob.pbworks.com/w/page/21960078/truth)
  - [Linkage Scores](https://myclob.pbworks.com/w/page/159338766/Linkage%20Scores)
  - [Evidence Quality](https://myclob.pbworks.com/w/page/159353568/Evidence)
  - [GitHub Repository](https://github.com/myklob/ideastockexchange)

## Scoring Formulas

### Belief Score
```
Final_Belief_Score = SUM(Supporting_Weighted_Contributions) - SUM(Opposing_Weighted_Contributions)
```

The belief score represents the net balance of supporting vs opposing arguments, weighted by their quality and importance.

### Argument Weighted Contribution
```
Weighted_Contribution = (Linkage_Score × Overall_Score / 100) × (Importance_Weight / 10)
```

Each argument contributes to the belief score based on:
- **Linkage_Score**: How relevant the argument is to the belief (0-100)
- **Overall_Score**: Overall quality of the argument (0-100)
- **Importance_Weight**: How important this argument is (1-10)

### Overall Argument Score
```
Overall_Score = Evidence_Strength × Logical_Coherence × Verification × Linkage × Uniqueness × Importance
```

Multiplicative formula where each factor is 0-1, then multiplied by 100. Weakness in any dimension significantly reduces the overall score.

### ReasonRank Score
```
ReasonRank = (Evidence_Support × 0.4) +
             (Counterargument_Resistance × 0.3) +
             (Network_Position × 0.2) +
             (Expert_Consensus × 0.1)
```

PageRank-inspired algorithm that evaluates:
- Evidence quality and quantity
- How well the argument withstands challenges
- Position in the debate network
- Community validation through votes

## Usage Examples

### JavaScript/Node.js

```javascript
import axios from 'axios';
import fs from 'fs';

// Export a belief
async function exportBelief(beliefId) {
  const response = await axios({
    method: 'POST',
    url: `http://localhost:5000/api/export/belief/${beliefId}/excel`,
    responseType: 'arraybuffer',
    data: {
      filename: 'my_analysis.xlsx'
    }
  });

  fs.writeFileSync('my_analysis.xlsx', response.data);
  console.log('Export complete!');
}

// Export multiple beliefs
async function exportMultiple(beliefIds) {
  const response = await axios({
    method: 'POST',
    url: 'http://localhost:5000/api/export/beliefs/excel',
    responseType: 'arraybuffer',
    data: {
      beliefIds: beliefIds,
      filename: 'multiple_beliefs.xlsx'
    }
  });

  fs.writeFileSync('multiple_beliefs.xlsx', response.data);
  console.log('Export complete!');
}

// Usage
exportBelief('507f1f77bcf86cd799439011');
exportMultiple(['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']);
```

### Python

```python
import requests

def export_belief(belief_id, output_file='belief.xlsx'):
    url = f'http://localhost:5000/api/export/belief/{belief_id}/excel'
    response = requests.post(url, json={'filename': output_file})

    with open(output_file, 'wb') as f:
        f.write(response.content)

    print(f'Exported to {output_file}')

# Usage
export_belief('507f1f77bcf86cd799439011', 'my_belief_analysis.xlsx')
```

### Frontend (React/Fetch)

```javascript
async function downloadBeliefExport(beliefId) {
  try {
    const response = await fetch(
      `/api/export/belief/${beliefId}/excel`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: 'belief_analysis.xlsx' })
      }
    );

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'belief_analysis.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Export failed:', error);
  }
}

// Usage in React component
<button onClick={() => downloadBeliefExport(belief._id)}>
  Export to Excel
</button>
```

## File Structure

```
backend/exporters/
├── README.md                    # This file
├── common/
│   └── dataExtractor.js        # MongoDB data extraction service
├── excel/
│   └── excelExporter.js        # Excel export implementation
└── access/
    └── accessExporter.js       # Access export (coming soon)

backend/controllers/
└── exportController.js          # API request handlers

backend/routes/
└── exportRoutes.js             # API route definitions

exports/                         # Generated export files (temporary)
└── excel/
    └── *.xlsx                  # Exported Excel files
```

## Development

### Adding New Export Formats

To add a new export format:

1. Create a new exporter in `backend/exporters/{format}/`
2. Implement the exporter class with an `export()` method
3. Add controller methods in `exportController.js`
4. Add routes in `exportRoutes.js`
5. Update this README

### Testing Exports

```bash
# Start the server
cd backend
npm run dev

# Test export endpoint
curl -X POST http://localhost:5000/api/export/belief/YOUR_BELIEF_ID/excel \
  -H "Content-Type: application/json" \
  -d '{"filename": "test.xlsx"}' \
  --output test.xlsx

# Open the file
open test.xlsx  # macOS
xdg-open test.xlsx  # Linux
start test.xlsx  # Windows
```

## Troubleshooting

### ExcelJS Not Found

```bash
npm install exceljs
```

### Permission Errors Creating Export Directory

Ensure the backend has write permissions to create the `exports/` directory:

```bash
chmod 755 backend
```

### Large Export Timeouts

For beliefs with many arguments/evidence, increase the timeout:

```javascript
// In frontend fetch request
fetch('/api/export/belief/id/excel', {
  // ... other options
  signal: AbortSignal.timeout(60000) // 60 second timeout
})
```

### Memory Issues with Large Exports

ExcelJS loads the entire workbook in memory. For very large exports (1000+ arguments), consider:

1. Exporting in batches
2. Using streaming write mode (requires code modification)
3. Increasing Node.js memory limit:

```bash
node --max-old-space-size=4096 server.js
```

## Future Enhancements

- [ ] **Access Export**: Full MS Access database generation
- [ ] **Import Functionality**: Import Excel data back into ISE
- [ ] **CSV Export**: Simple CSV format for data analysis
- [ ] **PDF Reports**: Generate printable PDF belief analyses
- [ ] **Chart Embeds**: Embed interactive charts in Excel
- [ ] **VBA Macros**: Add VBA code for advanced Excel features
- [ ] **Template System**: User-customizable export templates
- [ ] **Batch Processing**: Queue system for large export jobs
- [ ] **Email Delivery**: Email exports to users
- [ ] **Cloud Storage**: Auto-upload to Dropbox/Google Drive

## Contributing

When adding features to the export system:

1. Follow the existing code structure
2. Update this README with new features
3. Add example usage
4. Test with various belief sizes
5. Handle errors gracefully
6. Add logging for debugging

## License

MIT License - See main project LICENSE file

## Contact

For questions or issues:
- GitHub: https://github.com/myklob/ideastockexchange
- Documentation: https://myclob.pbworks.com

---

**Last Updated:** November 28, 2025
**Version:** 1.0.0

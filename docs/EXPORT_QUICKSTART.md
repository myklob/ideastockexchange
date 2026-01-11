# ISE Export System - Quick Start Guide

## 🚀 Getting Started

This guide will help you quickly set up and use the ISE Export System to export belief data to Excel.

## Prerequisites

- Node.js 16+ installed
- MongoDB running with ISE data
- Backend server configured

## Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

This will automatically install `exceljs` and all other required dependencies.

### 2. Verify Installation

```bash
npm list exceljs
```

You should see:
```
exceljs@4.4.0
```

### 3. Start the Server

```bash
npm run dev
```

You should see:
```
🚀 Idea Stock Exchange API Server
📡 Server running on port 5000
```

## Quick Export Test

### Using cURL

```bash
# Export a belief (replace BELIEF_ID with actual ID)
curl -X POST http://localhost:5000/api/export/belief/BELIEF_ID/excel \
  -H "Content-Type: application/json" \
  -d '{"filename": "my_first_export.xlsx"}' \
  --output my_first_export.xlsx
```

### Using JavaScript

```javascript
// frontend/src/utils/exportBelief.js
export async function exportBeliefToExcel(beliefId, filename = 'belief.xlsx') {
  try {
    const response = await fetch(
      `/api/export/belief/${beliefId}/excel`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      }
    );

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { success: true };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: error.message };
  }
}
```

### Using React Component

```jsx
// frontend/src/components/ExportButton.jsx
import React, { useState } from 'react';
import { exportBeliefToExcel } from '../utils/exportBelief';

function ExportButton({ beliefId, beliefTitle }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const filename = `${beliefTitle.replace(/[^a-z0-9]/gi, '_')}.xlsx`;
      const result = await exportBeliefToExcel(beliefId, filename);

      if (result.success) {
        alert('Export successful! Check your downloads.');
      } else {
        alert(`Export failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Export error: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="export-button"
    >
      {exporting ? '📥 Exporting...' : '📊 Export to Excel'}
    </button>
  );
}

export default ExportButton;
```

## API Endpoints Overview

### 1. Get Export Info

```bash
GET /api/export/info
```

Returns capabilities and supported formats.

### 2. Export Single Belief

```bash
POST /api/export/belief/:beliefId/excel
Body: { "filename": "optional.xlsx" }
```

Exports one belief with all data.

### 3. Export Multiple Beliefs

```bash
POST /api/export/beliefs/excel
Body: {
  "beliefIds": ["id1", "id2", ...],
  "filename": "optional.xlsx"
}
```

Exports multiple beliefs to one workbook.

### 4. Export by Category

```bash
GET /api/export/category/:category/excel?limit=100
```

Exports all beliefs in a category.

## Excel File Structure

When you open the exported Excel file, you'll see these sheets:

1. **Beliefs_Master** - Core belief information
2. **Arguments** - All supporting and opposing arguments
3. **Evidence** - Evidence backing the arguments
4. **Laws** - Related laws and regulations
5. **Assumptions** - Underlying assumptions
6. **Dashboard** - Visual summary and top arguments
7. **Formulas_Reference** - Documentation of all formulas

## What You Can Do With Exported Files

### Offline Analysis
- Work with belief data without internet
- Use Excel's powerful filtering and sorting
- Create custom charts and visualizations

### Data Sharing
- Share analyses with colleagues
- Present findings in meetings
- Include in reports and presentations

### Custom Calculations
- Add your own formulas
- Experiment with different scoring methods
- Conduct "what-if" scenarios

### Integration
- Import into other tools (Power BI, Tableau)
- Combine with other datasets
- Generate custom reports

## Common Use Cases

### 1. Belief Comparison

Export multiple beliefs and create a comparison sheet:

```javascript
const beliefIds = [
  '507f1f77bcf86cd799439011',
  '507f1f77bcf86cd799439012',
  '507f1f77bcf86cd799439013'
];

await fetch('/api/export/beliefs/excel', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    beliefIds,
    filename: 'belief_comparison.xlsx'
  })
});
```

Then in Excel:
1. Open the "All_Beliefs" sheet
2. Sort by Final_Score
3. Create a pivot chart
4. Compare argument counts

### 2. Category Analysis

Export all beliefs in a category:

```bash
curl http://localhost:5000/api/export/category/politics/excel?limit=50 \
  --output politics_analysis.xlsx
```

Use for:
- Finding trends in political beliefs
- Identifying strongest/weakest positions
- Analyzing argument patterns

### 3. Evidence Audit

Export a belief, then:
1. Go to the Evidence sheet
2. Filter by Verification_Status = "unverified"
3. Identify gaps in evidence
4. Plan evidence collection strategy

### 4. Presentation Prep

Export key beliefs before a presentation:
1. Use Dashboard sheet for overview
2. Copy top arguments to slides
3. Print Formulas_Reference for methodology

## Troubleshooting

### Export Button Does Nothing

Check browser console for errors:
```javascript
F12 → Console
```

Common issues:
- CORS not configured
- Wrong API URL
- Network firewall blocking downloads

### File Won't Download

Try alternate method:
```javascript
// Instead of blob download, try:
window.location.href = `/api/export/belief/${beliefId}/excel`;
```

### "ExcelJS Not Found" Error

```bash
cd backend
npm install exceljs
npm run dev
```

### Timeout on Large Exports

Increase timeout in fetch:
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s

fetch(url, {
  signal: controller.signal,
  // ... other options
});
```

### Excel File Corrupted

This usually means:
1. Export didn't complete
2. File was partially downloaded
3. Server error during generation

Check server logs:
```bash
cd backend
tail -f logs/server.log  # if logging enabled
# or check console output
```

## Next Steps

### Add to Your Frontend

1. **Create Export Utility**:
   ```
   frontend/src/utils/exportBelief.js
   ```

2. **Add Export Button Component**:
   ```
   frontend/src/components/ExportButton.jsx
   ```

3. **Import in Belief View**:
   ```jsx
   import ExportButton from './components/ExportButton';

   // In your belief component:
   <ExportButton beliefId={belief._id} beliefTitle={belief.statement} />
   ```

### Customize Exports

Edit `backend/exporters/excel/excelExporter.js` to:
- Add custom sheets
- Change formatting
- Add charts
- Include additional data
- Modify formulas

### Build Import Feature

Coming soon:
- Import Excel data back to database
- Bulk belief creation from spreadsheets
- Update existing beliefs
- Validate imported data

## Advanced Features (Coming Soon)

- **Access Database Export**: Full relational database with forms and reports
- **PDF Reports**: Generate printable belief analyses
- **Email Delivery**: Send exports to users automatically
- **Scheduled Exports**: Daily/weekly automatic exports
- **Custom Templates**: User-defined export formats

## Support

- **Documentation**: `backend/exporters/README.md`
- **API Docs**: Visit `/api/export/info` for capabilities
- **GitHub Issues**: https://github.com/myklob/ideastockexchange/issues
- **PBworks**: https://myclob.pbworks.com

## Example Projects

### Dashboard Web App

Build a dashboard showing export statistics:

```javascript
// Get all beliefs by category
const categories = ['politics', 'science', 'technology'];
const exports = {};

for (const category of categories) {
  const response = await fetch(
    `/api/export/category/${category}/excel?limit=10`
  );
  exports[category] = await response.blob();
}
```

### Automated Reports

Daily export of top beliefs:

```javascript
// cron job or scheduled task
async function dailyExportReport() {
  const topBeliefs = await fetch('/api/beliefs?sort=conclusionScore&limit=10');
  const beliefIds = topBeliefs.map(b => b._id);

  await fetch('/api/export/beliefs/excel', {
    method: 'POST',
    body: JSON.stringify({
      beliefIds,
      filename: `top_beliefs_${new Date().toISOString().split('T')[0]}.xlsx`
    })
  });
}
```

### Data Pipeline

Export → Transform → Load into analytics:

```javascript
// 1. Export
const exportBlob = await exportBeliefToExcel(beliefId);

// 2. Transform (use external library to read Excel)
const workbook = await readExcelBlob(exportBlob);
const data = workbook.getWorksheet('Beliefs_Master');

// 3. Load into analytics database
await analyticsDB.insert({
  beliefId,
  score: data.getCell('E2').value,
  timestamp: new Date()
});
```

---

**Ready to export?** Try exporting your first belief now! 🚀

```bash
curl -X POST http://localhost:5000/api/export/belief/YOUR_BELIEF_ID/excel \
  -H "Content-Type: application/json" \
  --output my_first_export.xlsx
```

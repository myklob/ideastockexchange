import express from 'express';
import {
  exportBeliefToExcel,
  exportMultipleBeliefsToExcel,
  exportCategoryToExcel,
  exportBeliefToAccess,
  getExportInfo
} from '../controllers/exportController.js';

const router = express.Router();

/**
 * Export Routes
 *
 * These routes handle exporting ISE data to various formats:
 * - Excel workbooks (.xlsx)
 * - MS Access databases (.accdb) - Coming soon
 */

// Get export information and capabilities
router.get('/info', getExportInfo);

// Excel Exports
router.post('/belief/:beliefId/excel', exportBeliefToExcel);
router.post('/beliefs/excel', exportMultipleBeliefsToExcel);
router.get('/category/:category/excel', exportCategoryToExcel);

// Access Exports (placeholder for future implementation)
router.post('/belief/:beliefId/access', exportBeliefToAccess);

export default router;

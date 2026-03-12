import excelExporter from '../exporters/excel/excelExporter.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Export Controller
 * Handles API requests for exporting ISE data to various formats
 */

/**
 * Export a single belief to Excel
 * POST /api/export/belief/:beliefId/excel
 */
export const exportBeliefToExcel = async (req, res) => {
  try {
    const { beliefId } = req.params;
    const { filename } = req.body;

    if (!beliefId) {
      return res.status(400).json({
        success: false,
        error: 'Belief ID is required'
      });
    }

    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, '..', '..', 'exports', 'excel');
    await fs.mkdir(exportsDir, { recursive: true });

    // Generate filename
    const outputFilename = filename || `belief_${beliefId}_${Date.now()}.xlsx`;
    const outputPath = path.join(exportsDir, outputFilename);

    // Export to Excel
    await excelExporter.exportBelief(beliefId, outputPath);

    // Send file to client
    res.download(outputPath, outputFilename, async (err) => {
      if (err) {
        console.error('Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Error sending file'
          });
        }
      }

      // Clean up file after sending (optional)
      try {
        await fs.unlink(outputPath);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    });
  } catch (error) {
    console.error('Error exporting belief to Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Export multiple beliefs to Excel
 * POST /api/export/beliefs/excel
 * Body: { beliefIds: ['id1', 'id2', ...], filename: 'optional.xlsx' }
 */
export const exportMultipleBeliefsToExcel = async (req, res) => {
  try {
    const { beliefIds, filename } = req.body;

    if (!beliefIds || !Array.isArray(beliefIds) || beliefIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'beliefIds array is required'
      });
    }

    // Create exports directory
    const exportsDir = path.join(__dirname, '..', '..', 'exports', 'excel');
    await fs.mkdir(exportsDir, { recursive: true });

    // Generate filename
    const outputFilename = filename || `beliefs_export_${Date.now()}.xlsx`;
    const outputPath = path.join(exportsDir, outputFilename);

    // Export to Excel
    await excelExporter.exportMultipleBeliefs(beliefIds, outputPath);

    // Send file
    res.download(outputPath, outputFilename, async (err) => {
      if (err) {
        console.error('Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Error sending file'
          });
        }
      }

      // Clean up
      try {
        await fs.unlink(outputPath);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    });
  } catch (error) {
    console.error('Error exporting multiple beliefs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Export all beliefs in a category to Excel
 * GET /api/export/category/:category/excel
 */
export const exportCategoryToExcel = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 100 } = req.query;

    // Create exports directory
    const exportsDir = path.join(__dirname, '..', '..', 'exports', 'excel');
    await fs.mkdir(exportsDir, { recursive: true });

    // Generate filename
    const outputFilename = `${category}_beliefs_${Date.now()}.xlsx`;
    const outputPath = path.join(exportsDir, outputFilename);

    // Get all beliefs in category
    const { default: dataExtractor } = await import('../exporters/common/dataExtractor.js');
    const allData = await dataExtractor.extractAllBeliefs({
      category,
      limit: parseInt(limit)
    });

    // Extract just the belief IDs
    const beliefIds = allData.map(d => d.belief._id.toString());

    // Export to Excel
    await excelExporter.exportMultipleBeliefs(beliefIds, outputPath);

    // Send file
    res.download(outputPath, outputFilename, async (err) => {
      if (err) {
        console.error('Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Error sending file'
          });
        }
      }

      // Clean up
      try {
        await fs.unlink(outputPath);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    });
  } catch (error) {
    console.error('Error exporting category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get export status/info
 * GET /api/export/info
 */
export const getExportInfo = async (req, res) => {
  try {
    res.json({
      success: true,
      supportedFormats: ['excel', 'access'],
      excelFormats: ['.xlsx', '.xlsm'],
      accessFormats: ['.accdb'],
      features: {
        excel: {
          sheets: [
            'Beliefs_Master',
            'Arguments',
            'Evidence',
            'Laws',
            'Assumptions',
            'Dashboard',
            'Formulas_Reference'
          ],
          features: [
            'Conditional Formatting',
            'Data Validation',
            'Charts',
            'Formulas',
            'Named Ranges'
          ]
        },
        access: {
          status: 'Coming soon',
          features: [
            'Normalized Tables',
            'Relationships',
            'Queries',
            'Forms',
            'Reports'
          ]
        }
      },
      limits: {
        maxBeliefsPerExport: 1000,
        maxFileSizeMB: 100
      }
    });
  } catch (error) {
    console.error('Error getting export info:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Placeholder for Access export (requires Windows environment)
 * POST /api/export/belief/:beliefId/access
 */
export const exportBeliefToAccess = async (req, res) => {
  try {
    res.status(501).json({
      success: false,
      error: 'Access export not yet implemented',
      message: 'Access database export requires Windows environment and COM automation. This feature is planned for future release.'
    });
  } catch (error) {
    console.error('Error exporting to Access:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

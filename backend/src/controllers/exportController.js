const { generateWeeklyMatrix, calculateCompliance } = require('../services/reportService');
const { generatePDF } = require('../services/pdfService');
const { generateExcel } = require('../services/excelService');
const logger = require('../config/logger');
const path = require('path');

const getMatrixData = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: 'from and to dates are required' });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate) || isNaN(toDate)) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Make the date range inclusive for the entire "to" day (23:59:59.999)
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    const matrix = await generateWeeklyMatrix(fromDate, toDate);
    const compliance = calculateCompliance(matrix);

    res.json({
      matrix,
      compliance
    });
  } catch (error) {
    logger.error('Get matrix data error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const exportPDF = async (req, res) => {
  try {
    const { from, to, title } = req.body;

    if (!from || !to) {
      return res.status(400).json({ error: 'from and to dates are required' });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Make the date range inclusive for the entire "to" day (23:59:59.999)
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    const matrix = await generateWeeklyMatrix(fromDate, toDate);
    const { filename, filepath } = await generatePDF(matrix, title || 'Backup Report');

    logger.info('PDF export requested', { user: req.user.username, from, to });

    res.download(filepath, filename, (err) => {
      if (err) {
        logger.error('PDF download error', { error: err.message });
      }
      // Optionally delete file after download
      // fs.unlink(filepath).catch(() => {});
    });
  } catch (error) {
    logger.error('Export PDF error', { error: error.message });
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

const exportExcel = async (req, res) => {
  try {
    const { from, to, title } = req.body;

    if (!from || !to) {
      return res.status(400).json({ error: 'from and to dates are required' });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Make the date range inclusive for the entire "to" day (23:59:59.999)
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    const matrix = await generateWeeklyMatrix(fromDate, toDate);
    const { filename, filepath } = await generateExcel(matrix, title || 'Backup Report');

    logger.info('Excel export requested', { user: req.user.username, from, to });

    res.download(filepath, filename, (err) => {
      if (err) {
        logger.error('Excel download error', { error: err.message });
      }
      // Optionally delete file after download
      // fs.unlink(filepath).catch(() => {});
    });
  } catch (error) {
    logger.error('Export Excel error', { error: error.message });
    res.status(500).json({ error: 'Failed to generate Excel' });
  }
};

module.exports = {
  getMatrixData,
  exportPDF,
  exportExcel
};

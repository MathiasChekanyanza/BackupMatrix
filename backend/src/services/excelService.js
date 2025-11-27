const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../config/logger');

const generateExcel = async (matrix, title = 'Backup Report') => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Backup Matrix');

    // Title row
    worksheet.mergeCells('A1', 'D1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Meta row
    worksheet.mergeCells('A2', 'D2');
    const metaCell = worksheet.getCell('A2');
    metaCell.value = `From ${matrix.fromDate.toLocaleDateString()} to ${matrix.toDate.toLocaleDateString()}`;
    metaCell.font = { size: 10 };
    metaCell.alignment = { horizontal: 'center' };

    // Helper to keep date key logic consistent with reportService / frontend (local YYYY-MM-DD)
    const getLocalDateKey = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Header row
    const headerRow = worksheet.getRow(4);
    headerRow.values = [
      'Shop',
      'Server',
      'Database',
      ...matrix.dates.map(d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
    ];
    
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4A5568' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    // Data rows
    matrix.servers.forEach((server, index) => {
      const row = worksheet.getRow(5 + index);
      const values = [
        server.shopName || '',
        server.serverName,
        server.databaseName || '',
        ...matrix.dates.map(date => {
          const dateKey = getLocalDateKey(date);
          const day = server.days[dateKey] || { status: 'missing' };
          
          if (day.status === 'success') return '✓';
          if (day.status === 'failed') return '✗';
          return '—';
        })
      ];
      
      row.values = values;

      // Color cells based on status
      matrix.dates.forEach((date, dateIndex) => {
        const dateKey = getLocalDateKey(date);
        const day = server.days[dateKey] || { status: 'missing' };
        const cell = row.getCell(4 + dateIndex);
        
        cell.alignment = { horizontal: 'center', vertical: 'middle' };

        if (day.status === 'success') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFC6F6D5' }
          };
        } else if (day.status === 'failed') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFED7D7' }
          };
        } else {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEF5E7' }
          };
        }
      });
    });

    // Set column widths
    worksheet.getColumn(1).width = 20; // Shop
    worksheet.getColumn(2).width = 20; // Server
    worksheet.getColumn(3).width = 15; // Database
    matrix.dates.forEach((_, index) => {
      worksheet.getColumn(4 + index).width = 10;
    });

    // Borders for all cells
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber >= 4) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });

    // Ensure temp directory exists
    const tempDir = path.join(__dirname, '../../temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    const filename = `backup-report-${Date.now()}.xlsx`;
    const filepath = path.join(tempDir, filename);

    await workbook.xlsx.writeFile(filepath);

    logger.info('Excel generated', { filename });

    return { filename, filepath };
  } catch (error) {
    logger.error('Excel generation error', { error: error.message });
    throw error;
  }
};

module.exports = {
  generateExcel
};

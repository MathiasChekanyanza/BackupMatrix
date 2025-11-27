const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../config/logger');

const generateHTML = (matrix, title) => {
  // Helper to keep date key logic consistent with reportService / frontend (local YYYY-MM-DD)
  const getLocalDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const dateHeaders = matrix.dates.map(d => 
    `<th>${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</th>`
  ).join('');

  const rows = matrix.servers.map(server => {
    const cells = matrix.dates.map(date => {
      const dateKey = getLocalDateKey(date);
      const day = server.days[dateKey] || { status: 'missing' };
      
      let className = 'missing';
      let symbol = '—';
      
      if (day.status === 'success') {
        className = 'success';
        symbol = '✓';
      } else if (day.status === 'failed') {
        className = 'failed';
        symbol = '✗';
      }

      return `<td class="${className}">${symbol}</td>`;
    }).join('');

    return `
      <tr>
        <td class="server-name">${server.shopName || server.serverName}</td>
        <td class="server-detail">${server.serverName}</td>
        ${cells}
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page { size: A4 landscape; margin: 15mm; }
    body {
      font-family: Arial, sans-serif;
      font-size: 10pt;
    }
    h1 {
      text-align: center;
      margin-bottom: 20px;
      font-size: 16pt;
    }
    .meta {
      text-align: center;
      margin-bottom: 15px;
      font-size: 9pt;
      color: #666;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 6px 8px;
      text-align: center;
    }
    th {
      background-color: #4a5568;
      color: white;
      font-weight: bold;
    }
    .server-name {
      background-color: #edf2f7;
      font-weight: bold;
      text-align: left;
    }
    .server-detail {
      background-color: #f7fafc;
      text-align: left;
      font-size: 9pt;
    }
    .success { background-color: #c6f6d5; color: #22543d; }
    .failed { background-color: #fed7d7; color: #742a2a; }
    .missing { background-color: #fef5e7; color: #744210; }
    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 8pt;
      color: #999;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">
    From ${matrix.fromDate.toLocaleDateString()} to ${matrix.toDate.toLocaleDateString()}
    <br>Generated on ${new Date().toLocaleString()}
  </div>
  <table>
    <thead>
      <tr>
        <th>Shop</th>
        <th>Server</th>
        ${dateHeaders}
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <div class="footer">
    BackupMatrix Monitoring System | ✓ = Success | ✗ = Failed | — = No Report
  </div>
</body>
</html>
  `;
};

const generatePDF = async (matrix, title = 'Backup Report') => {
  let browser;
  try {
    const html = generateHTML(matrix, title);
    
    // Ensure temp directory exists
    const tempDir = path.join(__dirname, '../../temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    const filename = `backup-report-${Date.now()}.pdf`;
    const filepath = path.join(tempDir, filename);

    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.CHROME_PATH || undefined
    });

    const page = await browser.newPage();
    await page.setContent(html);
    await page.pdf({
      path: filepath,
      format: 'A4',
      landscape: true,
      printBackground: true
    });

    logger.info('PDF generated', { filename });

    return { filename, filepath };
  } catch (error) {
    logger.error('PDF generation error', { error: error.message });
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = {
  generatePDF
};

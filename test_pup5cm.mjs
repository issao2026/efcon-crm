import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'fs';

const MASCARA_BG_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663029938987/hqCW96Ftj9zcKD8QtxsDCe/mascara_bg_78151d47.png';

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  @page { size: A4; margin: 0; }
  html, body {
    margin: 0;
    padding: 0;
    font-family: Arial, sans-serif;
    font-size: 10pt;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body::before {
    content: '';
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    z-index: -1;
    background-image: url("${MASCARA_BG_URL}");
    background-size: 100% 100%;
    background-repeat: no-repeat;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  p { margin: 0.4em 0; line-height: 1.5; }
</style>
</head>
<body>
${Array(60).fill('<p>Este é um parágrafo de teste do contrato de compra e venda de imóvel. Linha de conteúdo para testar a paginação e o posicionamento do cabeçalho e rodapé em todas as páginas.</p>').join('\n')}
</body>
</html>`;

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium-browser',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  headless: true,
});

const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

// Test with 5cm top margin
const pdf = await page.pdf({
  format: 'A4',
  printBackground: true,
  margin: {
    top: '5cm',
    right: '2.2cm',
    bottom: '6.2cm',
    left: '2.2cm',
  },
});
await browser.close();

writeFileSync('/tmp/test_5cm.pdf', pdf);
console.log('Done! /tmp/test_5cm.pdf', pdf.length, 'bytes');

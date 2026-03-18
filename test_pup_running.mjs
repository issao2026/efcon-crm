import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'fs';

const MASCARA_BG_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663029938987/hqCW96Ftj9zcKD8QtxsDCe/mascara_bg_78151d47.png';

// Try a completely different approach: use @page margin + a transparent spacer div
// at the top of each "page" via CSS columns trick
const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  @page {
    size: A4;
    margin: 3.7cm 2.2cm 5.9cm 2.2cm;
    background-image: url("${MASCARA_BG_URL}");
    background-size: 100% 100%;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  html, body {
    margin: 0;
    padding: 0;
    font-family: Arial, sans-serif;
    font-size: 10pt;
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
const pdf = await page.pdf({
  format: 'A4',
  printBackground: true,
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
});
await browser.close();

writeFileSync('/tmp/test_running.pdf', pdf);
console.log('Done! /tmp/test_running.pdf', pdf.length, 'bytes');

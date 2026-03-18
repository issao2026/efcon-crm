import puppeteer from 'puppeteer-core';
import { writeFileSync, readFileSync } from 'fs';

// Load mascara as base64 to avoid CDN loading issues
const mascaraData = readFileSync('/home/ubuntu/webdev-static-assets/mascara_bg.png');
const mascaraB64 = `data:image/png;base64,${mascaraData.toString('base64')}`;

// The key insight: use a table-based layout where the header and footer rows
// contain the mascara image cropped to just those sections.
// This way the header/footer repeat on every page naturally.

// Alternative: use the full mascara as background on each "page div"
// but since we can't control page breaks precisely, let's try the 
// approach of using a transparent overlay with mix-blend-mode

// Actually the simplest approach: use puppeteer's header/footer template
// which IS rendered on every page by Chromium!

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
  /* Watermark only - no header/footer here, they go in puppeteer headerTemplate */
  body::before {
    content: '';
    position: fixed;
    top: 35%; left: 20%;
    width: 60%; height: 30%;
    z-index: -1;
    background-image: url("${mascaraB64}");
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    opacity: 0.06;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .content {
    padding: 0;
  }
  p { margin: 0.4em 0; line-height: 1.5; }
</style>
</head>
<body>
<div class="content">
${Array(60).fill('<p>Este é um parágrafo de teste do contrato de compra e venda de imóvel. Linha de conteúdo para testar a paginação e o posicionamento do cabeçalho e rodapé em todas as páginas.</p>').join('\n')}
</div>
</body>
</html>`;

// The mascara image is 1241x1754px (A4 ratio)
// Header: rows 0-177 = 10.1% of height = 3.0cm
// Footer: rows 1446-1754 = 17.6% of height = 5.22cm

// Use puppeteer's built-in header/footer templates which render on every page
// These use a special chromium feature that injects HTML on every page
const headerHtml = `<div style="width:100%;height:3.2cm;margin:0;padding:0;background-image:url('${mascaraB64}');background-size:100% auto;background-repeat:no-repeat;background-position:top left;-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>`;
const footerHtml = `<div style="width:100%;height:5.5cm;margin:0;padding:0;background-image:url('${mascaraB64}');background-size:100% auto;background-repeat:no-repeat;background-position:bottom left;-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>`;

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
  displayHeaderFooter: true,
  headerTemplate: headerHtml,
  footerTemplate: footerHtml,
  margin: {
    top: '3.8cm',
    right: '2.2cm',
    bottom: '5.9cm',
    left: '2.2cm',
  },
});
await browser.close();

writeFileSync('/tmp/test_inline2.pdf', pdf);
console.log('Done! /tmp/test_inline2.pdf', pdf.length, 'bytes');

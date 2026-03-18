import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'fs';

const MASCARA_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663029938987/hqCW96Ftj9zcKD8QtxsDCe/mascara_bg_78151d47.png';

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {
    size: A4;
    margin: 0;
    background-image: url("${MASCARA_URL}");
    background-size: 100% 100%;
    background-repeat: no-repeat;
  }
  body {
    margin: 0;
    padding: 3.6cm 2.2cm 5.6cm 2.2cm;
    font-family: Arial, sans-serif;
    font-size: 10pt;
    color: #111;
  }
  p { margin: 0.4em 0; line-height: 1.5; text-align: justify; }
  h2 { font-size: 10pt; margin: 0.8em 0 0.3em; }
</style>
</head>
<body>
<h2>CONTRATO DE COMPRA E VENDA</h2>
<p>Pelo presente instrumento particular, as partes abaixo qualificadas celebram o presente Contrato de Compra e Venda.</p>
<p><strong>VENDEDOR(A):</strong> PETERSON ALVES DE OLIVEIRA, brasileiro(a), solteiro(a), portador(a) do CPF nº 123.456.789-00.</p>
<p><strong>COMPRADOR(A):</strong> RODRIGO DA SILVA, brasileiro(a), solteiro(a), portador(a) do CPF nº 231.869.868-69.</p>
<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
</body>
</html>`;

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium-browser',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  headless: true,
});
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'networkidle0' });
const pdf = await page.pdf({
  format: 'A4',
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
});
writeFileSync('/tmp/test_pup2.pdf', pdf);
await browser.close();
console.log('PDF generated:', pdf.length, 'bytes');

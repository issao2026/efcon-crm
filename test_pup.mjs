import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'fs';

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium-browser',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  headless: true,
});
const page = await browser.newPage();
await page.setContent('<html><body><h1>Test PDF</h1><p>Hello world</p></body></html>');
const pdf = await page.pdf({ format: 'A4', printBackground: true });
writeFileSync('/tmp/test_puppeteer.pdf', pdf);
await browser.close();
console.log('PDF generated:', pdf.length, 'bytes');

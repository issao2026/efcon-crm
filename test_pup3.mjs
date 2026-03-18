import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'fs';

const MASCARA_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663029938987/hqCW96Ftj9zcKD8QtxsDCe/mascara_bg_78151d47.png';

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  @page { size: A4; margin: 0; }
  body {
    margin: 0;
    padding: 0;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10pt;
    color: #111;
  }
  .page-bg {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    z-index: -1;
    background-image: url("${MASCARA_URL}");
    background-size: 100% 100%;
    background-repeat: no-repeat;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .content {
    padding: 3.6cm 2.2cm 5.8cm 2.2cm;
  }
  p { margin: 0.4em 0; line-height: 1.55; text-align: justify; }
  h2 { font-size: 10pt; font-weight: bold; margin: 0.8em 0 0.3em; }
  strong { font-weight: bold; }
</style>
</head>
<body>
<div class="page-bg"></div>
<div class="content">
<h2>CONTRATO DE COMPRA E VENDA</h2>
<p>Pelo presente instrumento particular, as partes abaixo qualificadas celebram o presente <strong>Contrato de Compra e Venda</strong>, que se regerá pelas cláusulas e condições seguintes:</p>
<p><strong>VENDEDOR(A):</strong> PETERSON ALVES DE OLIVEIRA, brasileiro(a), solteiro(a), portador(a) do CPF nº 123.456.789-00, RG nº 6847344F, residente e domiciliado(a) em Rua das Acácias, 450, Apto 302, Goiânia/GO.</p>
<p><strong>COMPRADOR(A):</strong> RODRIGO DA SILVA, brasileiro(a), solteiro(a), portador(a) do CPF nº 231.869.868-69, RG nº 33056926, residente e domiciliado(a) em Rua das Palmeiras, 340, Goiânia/GO.</p>
<h2>CLÁUSULA 1ª – DO OBJETO</h2>
<p>O presente contrato tem por objeto o imóvel Apartamento residencial com 3 dormitórios (1 suíte), sala de estar e jantar, cozinha planejada, área de serviço, 2 banheiros sociais e 1 vaga de garagem coberta. Imóvel em ótimo estado de conservação, com acabamento de alto padrão, situado na Rua das Acácias, 450, Apto 302 Bloco B, Jardim Europa, Goiânia, GO, 74255-080, matriculado sob o nº 45.678 no 2º Cartório de Registro de Imóveis de Goiânia.</p>
<h2>CLÁUSULA 2ª – DO PREÇO E FORMA DE PAGAMENTO</h2>
<p>O valor total da transação é de <strong>R$ 485.000,00</strong>, a ser pago mediante À vista.</p>
<h2>CLÁUSULA 3ª – DA ENTREGA</h2>
<p>A entrega do imóvel será realizada na data acordada entre as partes, livre e desembaraçado de quaisquer ônus, dívidas ou encargos que possam prejudicar o pleno exercício do direito do comprador.</p>
<h2>CLÁUSULA 4ª – DAS OBRIGAÇÕES</h2>
<p>As partes se obrigam a cumprir fielmente todas as disposições do presente contrato, respondendo cada qual pelos danos decorrentes do descumprimento de suas obrigações.</p>
<h2>CLÁUSULA 5ª – DA RESCISÃO</h2>
<p>O descumprimento de qualquer cláusula deste contrato por qualquer das partes ensejará a rescisão do mesmo, com a aplicação das penalidades previstas em lei, além de perdas e danos eventualmente apurados.</p>
<h2>CLÁUSULA 6ª – DO FORO</h2>
<p>As partes elegem o foro da comarca de Goiânia/GO para dirimir quaisquer dúvidas ou litígios decorrentes deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.</p>
<p>E por estarem assim justos e contratados, firmam o presente instrumento em 02 (duas) vias de igual teor e forma, na presença das testemunhas abaixo.</p>
<p>Goiânia, GO, 18/03/2026.</p>
<br><br>
<p>___________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;___________________________</p>
<p><strong>PETERSON ALVES DE OLIVEIRA</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>RODRIGO DA SILVA</strong></p>
<p>CPF: 123.456.789-00&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CPF: 231.869.868-69</p>
</div>
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
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
});
writeFileSync('/tmp/test_pup3.pdf', pdf);
await browser.close();
console.log('PDF generated:', pdf.length, 'bytes');

/**
 * Contract generation using the official Marcello & Oliveira template.
 *
 * Production-compatible flow (100% Node.js, no Python/weasyprint/LibreOffice):
 *  1. Download contratopadrao.docx from CDN (cached locally)
 *  2. Fill {{placeholders}} with docxtemplater
 *  3. Convert filled .docx → HTML with mammoth
 *  4. Render with puppeteer-core + Chromium using headerTemplate/footerTemplate
 *     for the branded mascara letterhead (works correctly on ALL pages)
 */

import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import mammoth from 'mammoth';
import puppeteer from 'puppeteer-core';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CDN URL for the contract template DOCX
const CONTRACT_TEMPLATE_URL =
  'https://d2xsxph8kpxj0f.cloudfront.net/310419663029938987/hqCW96Ftj9zcKD8QtxsDCe/contratopadrao_096677ae.docx';

// Local cache paths
const CACHE_DIR = join(tmpdir(), 'efcon-templates');
const TEMPLATE_DOCX = join(CACHE_DIR, 'contratopadrao.docx');

// Mascara base64 — loaded once at module init from the bundled txt file
// Falls back to CDN URL if the local file is not available
let _mascaraDataUri: string | null = null;

function getMascaraDataUri(): string {
  if (_mascaraDataUri) return _mascaraDataUri;
  // Try to load from local file (available in sandbox and bundled in production)
  const localPaths = [
    join(__dirname, 'mascara_b64.txt'),
    join(process.cwd(), 'server/mascara_b64.txt'),
    '/home/ubuntu/efcon-crm/server/mascara_b64.txt',
  ];
  for (const p of localPaths) {
    if (existsSync(p)) {
      const b64 = readFileSync(p, 'utf-8').trim();
      _mascaraDataUri = `data:image/png;base64,${b64}`;
      return _mascaraDataUri;
    }
  }
  // Fallback: use CDN URL (may not work in headerTemplate due to CSP)
  return 'https://d2xsxph8kpxj0f.cloudfront.net/310419663029938987/hqCW96Ftj9zcKD8QtxsDCe/mascara_bg_78151d47.png';
}

async function downloadFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
}

async function ensureTemplates(): Promise<void> {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  if (!existsSync(TEMPLATE_DOCX)) await downloadFile(CONTRACT_TEMPLATE_URL, TEMPLATE_DOCX);
}

export type ContractFields = {
  nome_vendedor?: string;
  nacionalidade_vendedor?: string;
  estado_civil_vendedor?: string;
  profissao_vendedor?: string;
  tipo_documento_vendedor?: string;
  numero_documento_vendedor?: string;
  cpf_cnpj_vendedor?: string;
  endereco_vendedor?: string;

  nome_comprador?: string;
  nacionalidade_comprador?: string;
  estado_civil_comprador?: string;
  profissao_comprador?: string;
  tipo_documento_comprador?: string;
  numero_documento_comprador?: string;
  cpf_cnpj_comprador?: string;
  endereco_comprador?: string;

  nome_intermediadora?: string;
  cnpj_intermediadora?: string;
  creci_intermediadora?: string;
  endereco_intermediadora?: string;

  descricao_imovel?: string;
  matricula_imovel?: string;
  cartorio_registro_imoveis?: string;
  itens_que_permanecerao_no_imovel?: string;

  valor_total_contrato?: string;
  modalidade_pagamento?: string;

  // À vista
  valor_pagamento_avista?: string;
  forma_pagamento_avista?: string;
  data_pagamento_avista?: string;

  // Financiamento
  valor_entrada_financiamento?: string;
  forma_pagamento_entrada?: string;
  data_pagamento_entrada?: string;
  valor_financiado?: string;
  instituicao_financeira?: string;

  // Permuta
  descricao_imovel_permuta?: string;
  valor_imovel_permuta?: string;
  complemento_permuta?: string;
  ajuste_financeiro_permuta?: string;

  // Cláusulas contratuais
  prazo_entrega_posse?: string;
  condicao_entrega_posse?: string;
  prazo_escritura?: string;
  prazo_restituicao_valores?: string;
  prazo_certidao_objeto_pe?: string;
  quantidade_exercicios_iptu?: string;
  responsavel_despesas?: string;
  percentual_multa?: string;
  condicoes_distrato?: string;
  percentual_comissao?: string;
  valor_comissao?: string;

  // Imobiliária / Intermediária
  razao_social_imobiliaria?: string;
  cnpj_imobiliaria?: string;
  creci_imobiliaria?: string;
  endereco_imobiliaria?: string;
  assinatura_imobiliaria?: string;

  // Assinatura e foro
  plataforma_assinatura?: string;
  foro_eleito?: string;

  cidade_assinatura?: string;
  data_assinatura?: string;

  nome_testemunha_1?: string;
  cpf_testemunha_1?: string;
  nome_testemunha_2?: string;
  cpf_testemunha_2?: string;

  // Financiamento extra
  valor_financiamento?: string;
  valor_entrada_financiamento_extra?: string;
  // Locação
  prazo_locacao?: string;
  dia_vencimento_aluguel?: string;
  tipo_garantia?: string;
  valor_garantia?: string;
  indice_reajuste?: string;
  multa_rescisao_antecipada?: string;
  destinacao_imovel?: string;
  tipo_contrato?: string;
};

const DEFAULTS: Record<string, string> = {
  nome_vendedor: '___________________________',
  nacionalidade_vendedor: '',
  estado_civil_vendedor: '',
  profissao_vendedor: '',
  tipo_documento_vendedor: 'RG',
  numero_documento_vendedor: '___________________________',
  cpf_cnpj_vendedor: '___________________________',
  endereco_vendedor: '___________________________',

  nome_comprador: '___________________________',
  nacionalidade_comprador: '',
  estado_civil_comprador: '',
  profissao_comprador: '',
  tipo_documento_comprador: 'RG',
  numero_documento_comprador: '___________________________',
  cpf_cnpj_comprador: '___________________________',
  endereco_comprador: '___________________________',

  nome_intermediadora: 'Marcello & Oliveira Negócios Imobiliários',
  cnpj_intermediadora: '12.345.678/0001-99',
  creci_intermediadora: '28.867 J',
  endereco_intermediadora: 'Rua Elias José Cavalcanti, 1698 – Jardim Ermida I, Jundiaí-SP',

  descricao_imovel: '___________________________',
  matricula_imovel: '___________________________',
  cartorio_registro_imoveis: '___________________________',
  itens_que_permanecerao_no_imovel: '',

  valor_total_contrato: '___________________________',
  modalidade_pagamento: '___________________________',

  valor_pagamento_avista: 'N/A',
  forma_pagamento_avista: 'N/A',
  data_pagamento_avista: 'N/A',

  valor_entrada_financiamento: 'N/A',
  forma_pagamento_entrada: 'N/A',
  data_pagamento_entrada: 'N/A',
  valor_financiado: 'N/A',
  instituicao_financeira: 'N/A',

  descricao_imovel_permuta: 'N/A',
  valor_imovel_permuta: 'N/A',
  complemento_permuta: 'N/A',
  ajuste_financeiro_permuta: 'N/A',

  // Cláusulas contratuais
  prazo_entrega_posse: '30 dias após a assinatura',
  condicao_entrega_posse: 'livre e desembaraçado de quaisquer ônus',
  prazo_escritura: '60 dias após a quitação',
  prazo_restituicao_valores: '30 dias',
  prazo_certidao_objeto_pe: '30 dias',
  quantidade_exercicios_iptu: '1',
  responsavel_despesas: 'comprador',
  percentual_multa: '10%',
  condicoes_distrato: 'conforme lei 13.786/2018',
  percentual_comissao: '6%',
  valor_comissao: 'conforme contrato de intermediação',

  // Imobiliária
  razao_social_imobiliaria: 'Marcello & Oliveira Negócios Imobiliários',
  cnpj_imobiliaria: '12.345.678/0001-99',
  creci_imobiliaria: '28.867 J',
  endereco_imobiliaria: 'CRECI 28.867 J – Brasília, DF',
  assinatura_imobiliaria: 'Marcello & Oliveira Negócios Imobiliários',

  // Assinatura
  plataforma_assinatura: 'Clicksign',
  foro_eleito: 'Brasília, Distrito Federal',

  cidade_assinatura: '___________________________',
  data_assinatura: '___________________________',

  nome_testemunha_1: '___________________________',
  cpf_testemunha_1: '___________________________',
  nome_testemunha_2: '___________________________',
  cpf_testemunha_2: '___________________________',
  // Locação
  prazo_locacao: 'N/A',
  dia_vencimento_aluguel: 'N/A',
  tipo_garantia: 'N/A',
  valor_garantia: 'N/A',
  indice_reajuste: 'IGPM',
  multa_rescisao_antecipada: 'N/A',
  destinacao_imovel: 'residencial',
  tipo_contrato: 'COMPRA E VENDA',
};

function buildContentHtml(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  @page { size: A4; }
  html, body {
    margin: 0;
    padding: 0;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9.5pt;
    color: #111;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  h1, h2, h3 {
    font-size: 9.5pt;
    font-weight: bold;
    margin: 0.8em 0 0.3em;
  }
  p {
    margin: 0.35em 0;
    line-height: 1.55;
    text-align: justify;
  }
  strong { font-weight: bold; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.5em 0;
    font-size: 9pt;
  }
  td, th {
    border: 1px solid #ccc;
    padding: 4px 6px;
  }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

// Chromium executable paths to try (sandbox + production)
const CHROMIUM_PATHS = [
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/snap/bin/chromium',
];

function findChromium(): string {
  for (const p of CHROMIUM_PATHS) {
    try {
      execSync(`test -x "${p}"`, { stdio: 'pipe' });
      return p;
    } catch {}
  }
  try {
    const found = execSync('which chromium-browser chromium google-chrome 2>/dev/null | head -1', { stdio: 'pipe' })
      .toString().trim();
    if (found) return found;
  } catch {}
  throw new Error('Chromium not found. Install chromium-browser.');
}

/**
 * Generate the body HTML for a Locação (rental) contract.
 * Since the DOCX template is for Compra e Venda only, we generate locação HTML directly.
 */
function generateLocacaoBodyHtml(f: Record<string, string>): string {
  const v = (key: string, fallback = '___________________________') => f[key] || fallback;
  return `
<p style="text-align:center"><strong>CONTRATO DE LOCAÇÃO RESIDENCIAL/COMERCIAL</strong></p>
<p style="text-align:center">Marcello &amp; Oliveira Negócios Imobiliários – CRECI ${v('creci_imobiliaria', '28.867 J')}</p>
<br>
<p>Pelo presente instrumento particular, as partes abaixo qualificadas celebram o presente <strong>Contrato de Locação</strong>, que se regerá pelas cláusulas e condições seguintes:</p>
<br>
<p><strong>LOCADOR(A):</strong></p>
<p style="margin-left:1.5cm">${v('nome_vendedor')}, ${v('nacionalidade_vendedor', '')}${v('estado_civil_vendedor', '') ? ', ' + v('estado_civil_vendedor', '') : ''}${v('profissao_vendedor', '') ? ', ' + v('profissao_vendedor', '') : ''}, portador(a) do ${v('tipo_documento_vendedor', 'RG')} nº ${v('numero_documento_vendedor')}, inscrito(a) no CPF/CNPJ sob nº ${v('cpf_cnpj_vendedor')}, residente e domiciliado(a) em ${v('endereco_vendedor')}, doravante denominado(a) <strong>LOCADOR(A)</strong>.</p>
<br>
<p><strong>LOCATÁRIO(A):</strong></p>
<p style="margin-left:1.5cm">${v('nome_comprador')}, ${v('nacionalidade_comprador', '')}${v('estado_civil_comprador', '') ? ', ' + v('estado_civil_comprador', '') : ''}${v('profissao_comprador', '') ? ', ' + v('profissao_comprador', '') : ''}, portador(a) do ${v('tipo_documento_comprador', 'RG')} nº ${v('numero_documento_comprador')}, inscrito(a) no CPF/CNPJ sob nº ${v('cpf_cnpj_comprador')}, residente e domiciliado(a) em ${v('endereco_comprador')}, doravante denominado(a) <strong>LOCATÁRIO(A)</strong>.</p>
<br>
<p><strong>INTERMEDIADORA (SE APLICÁVEL):</strong></p>
<p style="margin-left:1.5cm">${v('nome_intermediadora', 'Marcello &amp; Oliveira Negócios Imobiliários')}, inscrita no CNPJ sob nº ${v('cnpj_intermediadora', '12.345.678/0001-99')}, CRECI nº ${v('creci_intermediadora', '28.867 J')}, com endereço comercial em ${v('endereco_intermediadora', 'CRECI 28.867 J – Brasília, DF')}, doravante denominada <strong>INTERMEDIADORA</strong>.</p>
<br>
<p><strong>CLÁUSULA 1ª – DO OBJETO</strong></p>
<p>O presente contrato tem por objeto a locação do imóvel: <strong>${v('descricao_imovel')}</strong>, matrícula nº ${v('matricula_imovel')} – ${v('cartorio_registro_imoveis')}, destinado a uso <strong>${v('destinacao_imovel', 'residencial')}</strong>.</p>
<br>
<p><strong>CLÁUSULA 2ª – DO PRAZO</strong></p>
<p>A locação terá prazo de <strong>${v('prazo_locacao', '___________________________')}</strong>, iniciando-se na data de assinatura deste instrumento.</p>
<br>
<p><strong>CLÁUSULA 3ª – DO ALUGUEL</strong></p>
<p>O valor do aluguel mensal é de <strong>${v('valor_total_contrato')}</strong>, a ser pago até o dia <strong>${v('dia_vencimento_aluguel', '___')}</strong> de cada mês, mediante ${v('modalidade_pagamento', 'transferência bancária')}.</p>
<br>
<p><strong>CLÁUSULA 4ª – DO REAJUSTE</strong></p>
<p>O aluguel será reajustado anualmente pelo índice <strong>${v('indice_reajuste', 'IGPM')}</strong>, conforme variação acumulada no período.</p>
<br>
<p><strong>CLÁUSULA 5ª – DA GARANTIA</strong></p>
<p>Como garantia locatícia, fica estabelecida: <strong>${v('tipo_garantia', '___________________________')}</strong>${v('valor_garantia', '') !== '___________________________' ? ', no valor de ' + v('valor_garantia') : ''}.</p>
<br>
<p><strong>CLÁUSULA 6ª – DAS OBRIGAÇÕES DO LOCATÁRIO</strong></p>
<p>O LOCATÁRIO obriga-se a: (a) pagar pontualmente o aluguel e encargos; (b) usar o imóvel conforme sua destinação; (c) conservar o imóvel em bom estado; (d) não sublocar ou ceder o imóvel sem autorização expressa do LOCADOR; (e) restituir o imóvel ao término do contrato nas mesmas condições em que o recebeu.</p>
<br>
<p><strong>CLÁUSULA 7ª – DAS OBRIGAÇÕES DO LOCADOR</strong></p>
<p>O LOCADOR obriga-se a: (a) entregar o imóvel em condições de uso; (b) garantir ao LOCATÁRIO o uso pacífico do imóvel; (c) responder pelos vícios ou defeitos anteriores à locação.</p>
<br>
<p><strong>CLÁUSULA 8ª – DA RESCISÃO E MULTA</strong></p>
<p>Em caso de rescisão antecipada pelo LOCATÁRIO, será devida multa de <strong>${v('multa_rescisao_antecipada', '___________________________')}</strong>. ${v('condicoes_distrato', '')}.</p>
<br>
<p><strong>CLÁUSULA 9ª – DO FORO</strong></p>
<p>Fica eleito o foro da comarca de <strong>${v('foro_eleito', 'Brasília, Distrito Federal')}</strong> para dirimir quaisquer controvérsias oriundas do presente contrato.</p>
<br>
<p>E por estarem assim justos e contratados, assinam o presente instrumento em 2 (duas) vias de igual teor e forma, na presença das testemunhas abaixo.</p>
<br>
<p>${v('cidade_assinatura')}, ${v('data_assinatura')}.</p>
<br><br>
<table style="width:100%;border:none">
  <tr>
    <td style="border:none;width:50%;text-align:center">___________________________<br><strong>${v('nome_vendedor')}</strong><br>LOCADOR(A)<br>CPF: ${v('cpf_cnpj_vendedor')}</td>
    <td style="border:none;width:50%;text-align:center">___________________________<br><strong>${v('nome_comprador')}</strong><br>LOCATÁRIO(A)<br>CPF: ${v('cpf_cnpj_comprador')}</td>
  </tr>
</table>
<br>
<table style="width:100%;border:none">
  <tr>
    <td style="border:none;width:50%;text-align:center">___________________________<br><strong>${v('razao_social_imobiliaria', 'Marcello &amp; Oliveira Imóveis')}</strong><br>INTERMEDIADORA<br>CRECI: ${v('creci_imobiliaria', '28.867 J')}</td>
    <td style="border:none;width:50%;text-align:center"></td>
  </tr>
</table>
<br>
<p><strong>Testemunhas:</strong></p>
<table style="width:100%;border:none">
  <tr>
    <td style="border:none;width:50%;text-align:center">___________________________<br>${v('nome_testemunha_1')}<br>CPF: ${v('cpf_testemunha_1')}</td>
    <td style="border:none;width:50%;text-align:center">___________________________<br>${v('nome_testemunha_2')}<br>CPF: ${v('cpf_testemunha_2')}</td>
  </tr>
</table>
`;
}

/**
 * Shared helper: merge fields with defaults, fill DOCX template (or generate locação HTML), convert to HTML.
 * Returns { bodyHtml, mascaraUri }.
 */
async function prepareContractHtml(fields: ContractFields): Promise<{ bodyHtml: string; mascaraUri: string }> {
  const mascaraUri = getMascaraDataUri();

  // Merge defaults + provided fields
  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries(DEFAULTS)) {
    merged[k] = v ?? '';
  }
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined && v !== null && v !== '') merged[k] = String(v);
  }

  // For Locação contracts: generate HTML directly (no DOCX template available)
  if (merged.tipo_contrato === 'LOCAÇÃO' || merged.tipo_contrato === 'LOCACAO') {
    const bodyHtml = generateLocacaoBodyHtml(merged);
    return { bodyHtml, mascaraUri };
  }

  await ensureTemplates();
  // Step 1: Fill DOCX template with docxtemplater
  const templateContent = readFileSync(TEMPLATE_DOCX, 'binary');
  const zip = new PizZip(templateContent);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' },
    nullGetter: () => '',
  });
  doc.render(merged);
  const filledDocxBuf = doc.getZip().generate({ type: 'nodebuffer' });
  // Step 2: Convert filled DOCX → HTML with mammoth
  const mammothResult = await mammoth.convertToHtml({ buffer: filledDocxBuf });
  const bodyHtml = mammothResult.value;
  return { bodyHtml, mascaraUri };
}

/**
 * Generate a branded contract PDF buffer from the given fields.
 */
export async function generateContractPdf(fields: ContractFields): Promise<Buffer> {
  const { bodyHtml, mascaraUri } = await prepareContractHtml(fields);

  // Build content HTML (no background — mascara goes in header/footer templates)
  const fullHtml = buildContentHtml(bodyHtml);

  // Build header/footer templates with the mascara letterhead
  // The mascara image is A4 (1241x1754px):
  //   - Header region: top 10.1% = 3.0cm
  //   - Footer region: bottom 17.6% = 5.22cm
  // We use background-position to show only the relevant part of the image.

  // Header: show top portion of mascara (3.2cm tall, full width)
  const headerTemplate = `<div style="
    width: 100%;
    height: 3.2cm;
    margin: 0;
    padding: 0;
    background-image: url('${mascaraUri}');
    background-size: 100% auto;
    background-repeat: no-repeat;
    background-position: top left;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  "></div>`;

  // Footer: show bottom portion of mascara (5.5cm tall, full width)
  const footerTemplate = `<div style="
    width: 100%;
    height: 5.5cm;
    margin: 0;
    padding: 0;
    background-image: url('${mascaraUri}');
    background-size: 100% auto;
    background-repeat: no-repeat;
    background-position: bottom left;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  "></div>`;

  // Render with puppeteer-core + Chromium → PDF
  const chromiumPath = findChromium();
  const browser = await puppeteer.launch({
    executablePath: chromiumPath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0', timeout: 30000 });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
      margin: {
        top: '4.2cm',
        right: '2.2cm',
        bottom: '6.5cm',
        left: '2.2cm',
      },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/**
 * Generate a print-ready HTML string for the contract.
 *
 * This is used as a fallback when Puppeteer/Chromium is not available in production.
 * The returned HTML:
 *  - Fills the DOCX template with the provided fields (same as the PDF path)
 *  - Embeds the mascara letterhead as a full-page @page background-image
 *  - Adds a "Print / Save as PDF" button bar visible on screen but hidden when printing
 *  - Auto-triggers window.print() after 800ms so the user can save as PDF immediately
 *
 * The frontend opens this HTML in a new window for the user to print/save.
 */
export async function generateContractHtml(fields: ContractFields): Promise<string> {
  const { bodyHtml, mascaraUri } = await prepareContractHtml(fields);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Contrato – Marcello &amp; Oliveira Imóveis</title>
<style>
  * { box-sizing: border-box; }
  @page { size: A4; margin: 0; }
  html, body {
    margin: 0;
    padding: 0;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9.5pt;
    color: #111;
    background: white;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  /*
   * Mascara letterhead — position:fixed so it covers every printed page.
   * @page background-image is NOT supported by Chrome/Firefox/Edge (only Puppeteer/WeasyPrint).
   * Using a fixed <img> element is the only cross-browser way to get a background on every page.
   */
  .mascara-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .mascara-bg img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: fill;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page-content {
    position: relative;
    z-index: 1;
    /* Top: 3.2cm header + 1cm gap; Bottom: 5.5cm footer + 0.5cm gap; Sides: 2.2cm */
    padding: 4.2cm 2.2cm 6.0cm 2.2cm;
    min-height: 29.7cm;
  }
  h1, h2, h3 {
    font-size: 9.5pt;
    font-weight: bold;
    margin: 0.8em 0 0.3em;
  }
  p {
    margin: 0.35em 0;
    line-height: 1.55;
    text-align: justify;
  }
  strong { font-weight: bold; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.5em 0;
    font-size: 9pt;
  }
  td, th {
    border: 1px solid #ccc;
    padding: 4px 6px;
  }
  /* Print toolbar — visible on screen, hidden when printing */
  .print-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #1e40af;
    color: white;
    padding: 10px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 9999;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  .print-bar span { flex: 1; }
  .print-bar button {
    background: white;
    color: #1e40af;
    border: none;
    padding: 7px 20px;
    border-radius: 5px;
    font-weight: bold;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.15s;
  }
  .print-bar button:hover { background: #dbeafe; }
  .print-bar .btn-close {
    background: #fee2e2;
    color: #991b1b;
  }
  .print-bar .btn-close:hover { background: #fecaca; }
  @media print {
    .print-bar { display: none !important; }
    /* Ensure mascara is rendered in print — Chrome requires -webkit-print-color-adjust */
    .mascara-bg, .mascara-bg img {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
</style>
</head>
<body>
<!-- Mascara letterhead: fixed behind all content, visible on screen AND in print -->
<div class="mascara-bg" aria-hidden="true">
  <img src="${mascaraUri}" alt="" />
</div>
<div class="print-bar">
  <span>📄 Contrato pronto – Marcello &amp; Oliveira Imóveis</span>
  <button onclick="window.print()">🖨️ Imprimir / Salvar como PDF</button>
  <button class="btn-close" onclick="window.close()">✕ Fechar</button>
</div>
<div class="page-content">
${bodyHtml}
</div>
<script>
  // Wait for the mascara image to load before triggering the print dialog
  var img = document.querySelector('.mascara-bg img');
  function triggerPrint() {
    setTimeout(function() { window.print(); }, 600);
  }
  if (img && !img.complete) {
    img.addEventListener('load', triggerPrint);
    img.addEventListener('error', triggerPrint); // print even if image fails
  } else {
    window.addEventListener('load', triggerPrint);
  }
</script>
</body>
</html>`;
}

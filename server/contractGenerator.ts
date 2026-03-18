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
 * Generate a branded contract PDF buffer from the given fields.
 */
export async function generateContractPdf(fields: ContractFields): Promise<Buffer> {
  await ensureTemplates();

  // Merge defaults + provided fields
  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries(DEFAULTS)) {
    merged[k] = v ?? '';
  }
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined && v !== null && v !== '') merged[k] = String(v);
  }

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

  // Step 3: Build content HTML (no background — mascara goes in header/footer templates)
  const fullHtml = buildContentHtml(bodyHtml);

  // Step 4: Build header/footer templates with the mascara letterhead
  // The mascara image is A4 (1241x1754px):
  //   - Header region: top 10.1% = 3.0cm
  //   - Footer region: bottom 17.6% = 5.22cm
  // We use background-position to show only the relevant part of the image.
  const mascaraUri = getMascaraDataUri();

  // Header: show top portion of mascara (3.2cm tall, full width)
  // background-size: 100% auto ensures the image fills the width and scales proportionally
  // background-position: top left aligns the top of the image to the top of the header
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
  // background-position: bottom left aligns the bottom of the image to the bottom of the footer
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

  // Step 5: Render with puppeteer-core + Chromium → PDF
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

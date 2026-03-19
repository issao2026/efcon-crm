/**
 * Contract generation using the official Marcello & Oliveira template.
 *
 * Production-compatible flow (no Chromium/Puppeteer dependency):
 *  1. Download contratopadrao.docx from CDN (cached locally)
 *  2. Fill {{placeholders}} with docxtemplater
 *  3. Convert filled .docx → HTML with mammoth
 *  4. Render HTML → PDF with weasyprint (Python) via child_process
 *     - Mascara letterhead applied as @page background-image
 *     - Works in both sandbox and production environments
 */

import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import mammoth from 'mammoth';
import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
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
let _mascaraDataUri: string | null = null;

function getMascaraDataUri(): string {
  if (_mascaraDataUri) return _mascaraDataUri;
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
  // Fallback: CDN URL
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

function buildFullHtml(bodyHtml: string, mascaraUri: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<style>
  @page {
    size: A4;
    margin: 4.2cm 2.2cm 6.5cm 2.2cm;
    background-image: url("${mascaraUri}");
    background-size: 100% 100%;
    background-repeat: no-repeat;
    -weasyprint-background-image: url("${mascaraUri}");
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9.5pt;
    color: #111;
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

/**
 * Render HTML to PDF using weasyprint (Python).
 * weasyprint is available in both sandbox and production environments.
 */
function renderWithWeasyprint(htmlContent: string): Buffer {
  const tmpHtml = join(tmpdir(), `efcon-contract-${Date.now()}.html`);
  const tmpPdf = join(tmpdir(), `efcon-contract-${Date.now()}.pdf`);
  try {
    writeFileSync(tmpHtml, htmlContent, 'utf-8');
    // Use Python weasyprint to convert HTML → PDF
    const result = spawnSync('python3', [
      '-c',
      `import weasyprint, sys; weasyprint.HTML(filename=sys.argv[1]).write_pdf(sys.argv[2])`,
      tmpHtml,
      tmpPdf,
    ], { timeout: 60000, stdio: 'pipe' });

    if (result.status !== 0) {
      const stderr = result.stderr?.toString() || '';
      throw new Error(`weasyprint failed: ${stderr}`);
    }
    if (!existsSync(tmpPdf)) {
      throw new Error('weasyprint did not produce output file');
    }
    return readFileSync(tmpPdf);
  } finally {
    try { if (existsSync(tmpHtml)) unlinkSync(tmpHtml); } catch {}
    try { if (existsSync(tmpPdf)) unlinkSync(tmpPdf); } catch {}
  }
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

  // Step 3: Build full HTML with mascara letterhead as @page background
  const mascaraUri = getMascaraDataUri();
  const fullHtml = buildFullHtml(bodyHtml, mascaraUri);

  // Step 4: Render HTML → PDF with weasyprint (no Chromium needed)
  return renderWithWeasyprint(fullHtml);
}

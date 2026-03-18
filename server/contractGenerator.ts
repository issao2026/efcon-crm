/**
 * Contract generation using the official Marcello & Oliveira template.
 *
 * Flow:
 *  1. Download contratopadrao.docx from CDN (or use local cache)
 *  2. Fill {{placeholders}} with docxtemplater
 *  3. Convert filled .docx → .pdf via LibreOffice headless
 *  4. Download Mascara.docx, convert to PDF (letterhead background)
 *  5. Merge: stamp letterhead on every page of the contract PDF
 *  6. Return the final branded PDF as a Buffer
 */

import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { nanoid } from 'nanoid';

// CDN URLs uploaded via manus-upload-file --webdev
const CONTRACT_TEMPLATE_URL =
  'https://d2xsxph8kpxj0f.cloudfront.net/310419663029938987/hqCW96Ftj9zcKD8QtxsDCe/contratopadrao_096677ae.docx';
const MASCARA_URL =
  'https://d2xsxph8kpxj0f.cloudfront.net/310419663029938987/hqCW96Ftj9zcKD8QtxsDCe/Mascara_79192f5f.docx';

// Local cache paths (persist across requests within the same process)
const CACHE_DIR = join(tmpdir(), 'efcon-templates');
const TEMPLATE_DOCX = join(CACHE_DIR, 'contratopadrao.docx');
const MASCARA_DOCX = join(CACHE_DIR, 'Mascara.docx');
const MASCARA_PDF = join(CACHE_DIR, 'Mascara.pdf');

async function downloadFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
}

async function ensureTemplates(): Promise<void> {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  if (!existsSync(TEMPLATE_DOCX)) await downloadFile(CONTRACT_TEMPLATE_URL, TEMPLATE_DOCX);
  if (!existsSync(MASCARA_DOCX)) await downloadFile(MASCARA_URL, MASCARA_DOCX);
  if (!existsSync(MASCARA_PDF)) {
    execSync(
      `libreoffice --headless --convert-to pdf "${MASCARA_DOCX}" --outdir "${CACHE_DIR}"`,
      { stdio: 'pipe' }
    );
  }
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

  razao_social_imobiliaria?: string;
  cnpj_imobiliaria?: string;
  creci_imobiliaria?: string;
  endereco_imobiliaria?: string;

  descricao_imovel?: string;
  matricula_imovel?: string;
  cartorio_registro_imoveis?: string;
  itens_que_permanecerao_no_imovel?: string;

  valor_total_contrato?: string;
  modalidade_pagamento?: string;
  valor_pagamento_avista?: string;
  forma_pagamento_avista?: string;
  data_pagamento_avista?: string;
  valor_financiamento?: string;
  instituicao_financeira?: string;
  descricao_imovel_permuta?: string;
  valor_imovel_permuta?: string;
  ajuste_financeiro_permuta?: string;

  prazo_entrega_posse?: string;
  condicao_entrega_posse?: string;
  prazo_escritura?: string;
  responsavel_despesas?: string;
  quantidade_exercicios_iptu?: string;
  prazo_certidao_objeto_pe?: string;
  prazo_restituicao_valores?: string;

  valor_comissao?: string;
  percentual_comissao?: string;
  percentual_multa?: string;
  condicoes_distrato?: string;
  plataforma_assinatura?: string;
  foro_eleito?: string;

  cidade_assinatura?: string;
  data_assinatura?: string;
  assinatura_vendedor?: string;
  assinatura_comprador?: string;
  assinatura_imobiliaria?: string;
  nome_testemunha_1?: string;
  cpf_testemunha_1?: string;
  nome_testemunha_2?: string;
  cpf_testemunha_2?: string;

  [key: string]: string | undefined;
};

const DEFAULTS: ContractFields = {
  razao_social_imobiliaria: 'Marcello & Oliveira Negócios Imobiliários',
  cnpj_imobiliaria: '12.345.678/0001-99',
  creci_imobiliaria: '28.867 J',
  endereco_imobiliaria: 'Rua Elias José Cavalcanti, 1698 – Jardim Ermida I, Jundiaí-SP',
  tipo_documento_vendedor: 'RG',
  tipo_documento_comprador: 'RG',
  valor_financiamento: 'N/A',
  instituicao_financeira: 'N/A',
  descricao_imovel_permuta: 'N/A',
  valor_imovel_permuta: 'N/A',
  ajuste_financeiro_permuta: 'N/A',
  prazo_entrega_posse: '30 (trinta) dias',
  condicao_entrega_posse: 'da assinatura deste instrumento',
  prazo_escritura: '60 (sessenta) dias',
  responsavel_despesas: 'comprador',
  quantidade_exercicios_iptu: '3 (três)',
  prazo_certidao_objeto_pe: '30 (trinta) dias',
  prazo_restituicao_valores: '30 (trinta) dias úteis',
  percentual_comissao: '6%',
  valor_comissao: 'a ser definido',
  percentual_multa: '10% (dez por cento)',
  condicoes_distrato: 'o disposto na Lei nº 13.786/2018',
  plataforma_assinatura: 'Clicksign',
  foro_eleito: 'Jundiaí, Estado de São Paulo',
  assinatura_vendedor: '___________________________',
  assinatura_comprador: '___________________________',
  assinatura_imobiliaria: '___________________________',
  nome_testemunha_1: '___________________________',
  cpf_testemunha_1: '___________________________',
  nome_testemunha_2: '___________________________',
  cpf_testemunha_2: '___________________________',
};

/**
 * Generate a branded contract PDF buffer from the given fields.
 */
export async function generateContractPdf(fields: ContractFields): Promise<Buffer> {
  await ensureTemplates();

  const merged: Record<string, string> = {};
  // Apply defaults first, then override with provided fields
  for (const [k, v] of Object.entries(DEFAULTS)) {
    merged[k] = v ?? '';
  }
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined && v !== null && v !== '') merged[k] = v;
  }

  // Step 1: Fill DOCX template
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

  // Step 2: Write filled DOCX to temp file and convert to PDF
  const workDir = join(tmpdir(), `efcon-${nanoid(8)}`);
  mkdirSync(workDir, { recursive: true });
  const filledDocxPath = join(workDir, 'contract.docx');
  const filledPdfPath = join(workDir, 'contract.pdf');
  writeFileSync(filledDocxPath, filledDocxBuf);

  execSync(
    `libreoffice --headless --convert-to pdf "${filledDocxPath}" --outdir "${workDir}"`,
    { stdio: 'pipe' }
  );

  // Step 3: Merge with mascara using Python (PyPDF2 is available in the sandbox)
  const brandedPdfPath = join(workDir, 'branded.pdf');
  const pyScript = `
from PyPDF2 import PdfReader, PdfWriter
from copy import deepcopy

mascara = PdfReader('${MASCARA_PDF}')
contract = PdfReader('${filledPdfPath}')
writer = PdfWriter()
bg_page = mascara.pages[0]

for page in contract.pages:
    bg = deepcopy(bg_page)
    bg.merge_page(page)
    writer.add_page(bg)

with open('${brandedPdfPath}', 'wb') as f:
    writer.write(f)
print('ok')
`;
  const pyScriptPath = join(workDir, 'merge.py');
  writeFileSync(pyScriptPath, pyScript);
  execSync(`python3 "${pyScriptPath}"`, { stdio: 'pipe' });

  const pdfBuffer = readFileSync(brandedPdfPath);

  // Cleanup
  try {
    execSync(`rm -rf "${workDir}"`, { stdio: 'pipe' });
  } catch {}

  return pdfBuffer;
}

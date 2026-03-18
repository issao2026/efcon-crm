/**
 * Contract generation using the official Marcello & Oliveira template.
 *
 * Production-compatible flow (no LibreOffice required):
 *  1. Download contratopadrao.docx from CDN (cached locally)
 *  2. Fill {{placeholders}} with docxtemplater
 *  3. Convert filled .docx → HTML with mammoth
 *  4. Convert HTML → plain content PDF with weasyprint (correct margins, no background)
 *  5. Rasterize content PDF pages with pdftoppm
 *  6. Composite mascara (header + watermark + footer) over each page using Pillow
 *  7. Reassemble composited images into final PDF
 */

import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import mammoth from 'mammoth';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { nanoid } from 'nanoid';

// CDN URLs uploaded via manus-upload-file --webdev
const CONTRACT_TEMPLATE_URL =
  'https://d2xsxph8kpxj0f.cloudfront.net/310419663029938987/hqCW96Ftj9zcKD8QtxsDCe/contratopadrao_096677ae.docx';

// Mascara background image (pre-rendered from Mascara.docx at 150dpi)
const MASCARA_BG_URL =
  'https://d2xsxph8kpxj0f.cloudfront.net/310419663029938987/hqCW96Ftj9zcKD8QtxsDCe/mascara_bg_78151d47.png';

// Local cache paths (persist across requests within the same process)
const CACHE_DIR = join(tmpdir(), 'efcon-templates');
const TEMPLATE_DOCX = join(CACHE_DIR, 'contratopadrao.docx');
const MASCARA_PNG = join(CACHE_DIR, 'mascara_bg.png');

async function downloadFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
}

async function ensureTemplates(): Promise<void> {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  if (!existsSync(TEMPLATE_DOCX)) await downloadFile(CONTRACT_TEMPLATE_URL, TEMPLATE_DOCX);
  if (!existsSync(MASCARA_PNG)) await downloadFile(MASCARA_BG_URL, MASCARA_PNG);
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

  cidade_assinatura?: string;
  data_assinatura?: string;

  nome_testemunha_1?: string;
  cpf_testemunha_1?: string;
  nome_testemunha_2?: string;
  cpf_testemunha_2?: string;
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
  @page {
    size: A4;
    /*
     * Mascara at 150dpi (1241x1754px):
     *   Header ends at row ~187 => 187/1754 * 29.7cm = 3.17cm from top
     *   Footer starts at row ~1443 => (1754-1443)/1754 * 29.7cm = 5.27cm from bottom
     * Use generous buffers to ensure text never overlaps header/footer
     */
    margin: 3.4cm 2.2cm 5.5cm 2.2cm;
  }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9.5pt;
    color: #111;
    margin: 0;
    padding: 0;
  }
  h1, h2, h3 {
    font-size: 10pt;
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
    if (v !== undefined && v !== null && v !== '') merged[k] = v;
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

  // Step 3: Wrap in clean HTML with correct margins (no background)
  const fullHtml = buildContentHtml(bodyHtml);

  // Step 4: Convert HTML → content PDF with weasyprint
  const workDir = join(tmpdir(), `efcon-${nanoid(8)}`);
  mkdirSync(workDir, { recursive: true });
  const htmlPath = join(workDir, 'contract.html');
  const contentPdfPath = join(workDir, 'content.pdf');
  const finalPdfPath = join(workDir, 'final.pdf');

  writeFileSync(htmlPath, fullHtml, 'utf-8');

  // Try weasyprint; if not found, install it first then retry
  try {
    execSync(`weasyprint "${htmlPath}" "${contentPdfPath}"`, {
      stdio: 'pipe',
      timeout: 60000,
    });
  } catch (err: any) {
    if (err.message?.includes('not found') || err.status === 127) {
      // Install weasyprint and dependencies, then retry
      execSync('pip3 install weasyprint pillow numpy --quiet 2>/dev/null || pip install weasyprint pillow numpy --quiet 2>/dev/null', {
        stdio: 'pipe',
        timeout: 120000,
      });
      execSync(`weasyprint "${htmlPath}" "${contentPdfPath}"`, {
        stdio: 'pipe',
        timeout: 60000,
      });
    } else {
      throw err;
    }
  }

  // Step 5: Composite mascara over content pages using Python + Pillow
  // Rasterize content PDF, paste mascara header/watermark/footer on each page, reassemble
  const composePy = `
import sys, os, glob
from PIL import Image
import numpy as np
import subprocess

content_pdf = sys.argv[1]
mascara_png = sys.argv[2]
output_pdf = sys.argv[3]
work_dir = sys.argv[4]

DPI = 150

# Rasterize content PDF to images
page_prefix = os.path.join(work_dir, 'pg')
subprocess.run(['pdftoppm', '-r', str(DPI), content_pdf, page_prefix], check=True)

page_files = sorted(glob.glob(page_prefix + '-*.ppm'))
if not page_files:
    page_files = sorted(glob.glob(page_prefix + '*.ppm'))

# Load mascara
mascara = Image.open(mascara_png).convert('RGB')
mascara_arr = np.array(mascara)
mh, mw = mascara_arr.shape[:2]

# Detect header end and footer start by scanning for dark rows
dark_pct = []
for y in range(mh):
    row = mascara_arr[y]
    dark_pixels = np.sum(row.mean(axis=1) < 150)
    dark_pct.append(dark_pixels / mw)

header_end = 0
for y in range(mh):
    if y > 10 and dark_pct[y] < 0.02:
        header_end = y + 3
        break

footer_start = mh
for y in range(mh - 1, 0, -1):
    if dark_pct[y] < 0.02:
        footer_start = y - 3
        break

print(f'Header ends: {header_end}px ({header_end/mh*29.7:.2f}cm), Footer starts: {footer_start}px ({(mh-footer_start)/mh*29.7:.2f}cm from bottom)', flush=True)

# Watermark: extract center region, make white pixels transparent, gray pixels semi-transparent
watermark_region = mascara.crop((0, header_end, mw, footer_start)).convert('RGBA')
wm_arr = np.array(watermark_region)
r, g, b = wm_arr[:,:,0], wm_arr[:,:,1], wm_arr[:,:,2]
is_white = (r > 240) & (g > 240) & (b > 240)
is_gray  = (~is_white) & (r > 180) & (g > 180) & (b > 180)
new_alpha = np.where(is_white, 0, np.where(is_gray, 55, 255)).astype(np.uint8)
wm_arr[:,:,3] = new_alpha
watermark_final = Image.fromarray(wm_arr)

output_images = []
for page_file in page_files:
    content_img = Image.open(page_file).convert('RGB')
    cw, ch = content_img.size

    # Resize mascara to match content page dimensions
    if (mw, mh) != (cw, ch):
        mascara_r = mascara.resize((cw, ch), Image.LANCZOS)
        header_end_r = int(header_end * ch / mh)
        footer_start_r = int(footer_start * ch / mh)
        wm_r = watermark_final.resize((cw, footer_start_r - header_end_r), Image.LANCZOS)
    else:
        mascara_r = mascara
        header_end_r = header_end
        footer_start_r = footer_start
        wm_r = watermark_final

    # Composite: start with content, paste header, watermark, footer from mascara
    composite = content_img.copy()
    composite.paste(mascara_r.crop((0, 0, cw, header_end_r)), (0, 0))
    composite.paste(mascara_r.crop((0, footer_start_r, cw, ch)), (0, footer_start_r))

    # Paste watermark semi-transparently
    composite_rgba = composite.convert('RGBA')
    composite_rgba.paste(wm_r, (0, header_end_r), wm_r)
    output_images.append(composite_rgba.convert('RGB'))

# Save as PDF
if output_images:
    output_images[0].save(output_pdf, save_all=True, append_images=output_images[1:], resolution=DPI)
    print(f'Saved {len(output_images)}-page PDF: {os.path.getsize(output_pdf)} bytes', flush=True)
else:
    raise RuntimeError('No pages generated')
`;

  const pyScriptPath = join(workDir, 'compose.py');
  writeFileSync(pyScriptPath, composePy, 'utf-8');

  execSync(
    `python3 "${pyScriptPath}" "${contentPdfPath}" "${MASCARA_PNG}" "${finalPdfPath}" "${workDir}"`,
    { stdio: 'pipe', timeout: 120000 }
  );

  const pdfBuffer = readFileSync(finalPdfPath);

  // Cleanup
  try {
    execSync(`find "${workDir}" -type f -delete && rmdir "${workDir}"`, { stdio: 'pipe' });
  } catch {}

  return pdfBuffer;
}

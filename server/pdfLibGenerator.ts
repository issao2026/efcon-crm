/**
 * Motor de geração de PDF usando pdf-lib — sem browser, sem Chromium.
 *
 * Fluxo:
 * 1. Recebe bodyHtml (HTML do contrato já montado)
 * 2. Extrai blocos de texto via node-html-parser
 * 3. Pagina manualmente respeitando header (45mm) e footer (70mm)
 * 4. Desenha header e footer (máscara PNG) em cada página
 * 5. Retorna Buffer do PDF
 */

import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import { parse as parseHtml } from 'node-html-parser';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// ─── Dimensões A4 em pontos (1pt = 1/72 polegada) ────────────────────────────
// A4: 210mm × 297mm = 595.28pt × 841.89pt
const A4_W = 595.28;
const A4_H = 841.89;

// Margens laterais: 14mm = 39.69pt
const MARGIN_X = 39.69;

// Header: 45mm = 127.56pt (topo da página)
const HEADER_H = 127.56;

// Footer: 70mm = 198.43pt (rodapé da página)
const FOOTER_H = 198.43;

// Área útil de texto
const CONTENT_TOP = HEADER_H + 6;       // pequena folga após o header
const CONTENT_BOTTOM = FOOTER_H + 6;    // pequena folga antes do footer
const CONTENT_W = A4_W - MARGIN_X * 2;  // largura útil
const CONTENT_H = A4_H - CONTENT_TOP - CONTENT_BOTTOM; // altura útil

// Tipografia
const FONT_SIZE = 9.5;
const LINE_HEIGHT = FONT_SIZE * 1.45;
const HEADING_SIZE = 10;
const HEADING_LINE_H = HEADING_SIZE * 1.5;
const PARA_SPACING = 4; // espaço extra entre parágrafos

// ─── Carrega a máscara PNG ────────────────────────────────────────────────────
function getMascaraBytes(): Uint8Array {
  const candidates = [
    join(process.cwd(), 'server/mascara_b64.txt'),
    '/home/ubuntu/efcon-crm/server/mascara_b64.txt',
    join(process.cwd(), 'mascara_b64.txt'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      const b64 = readFileSync(p, 'utf-8').trim();
      return Buffer.from(b64, 'base64');
    }
  }
  throw new Error('mascara_b64.txt não encontrado');
}

// ─── Tipos internos ───────────────────────────────────────────────────────────
type TextBlock = {
  text: string;
  isHeading: boolean;
  isBold: boolean;
  isCenter: boolean;
  indent: number; // nível de indentação (0 = normal)
};

// ─── Extrai texto plano dos blocos HTML ───────────────────────────────────────
function extractTextFromHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/td>/gi, '  |  ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

/**
 * Converte bodyHtml em blocos de texto estruturados.
 */
export function paginateTextBlocks(bodyHtml: string): TextBlock[] {
  const root = parseHtml(bodyHtml);
  const blocks: TextBlock[] = [];

  function processNode(node: ReturnType<typeof parseHtml>, depth = 0) {
    const tag = node.rawTagName?.toLowerCase() || '';

    if (['script', 'style'].includes(tag)) return;

    const isHeading = /^h[1-6]$/.test(tag);
    const isBlock = ['p', 'div', 'li', 'tr', 'blockquote', 'section', 'article'].includes(tag) || isHeading;

    if (isBlock || (tag === '' && node.nodeType === 3)) {
      // Text node or block element
      const rawText = extractTextFromHtml(node.innerHTML || node.text || '');
      if (!rawText.trim()) return;

      const style = (node as { getAttribute?: (a: string) => string | null }).getAttribute?.('style') || '';
      const isCenter = style.includes('center') || tag === 'center';
      const isBold = isHeading || style.includes('bold') || node.querySelectorAll?.('strong, b').length > 0;

      // Split by newlines to create sub-blocks
      const lines = rawText.split('\n').filter(l => l.trim());
      for (const line of lines) {
        blocks.push({
          text: line.trim(),
          isHeading,
          isBold,
          isCenter,
          indent: depth > 1 ? 1 : 0,
        });
      }
    } else {
      // Recurse into children
      for (const child of node.childNodes || []) {
        processNode(child as ReturnType<typeof parseHtml>, depth + 1);
      }
    }
  }

  for (const child of root.childNodes) {
    processNode(child as ReturnType<typeof parseHtml>);
  }

  return blocks;
}

/**
 * Quebra um texto longo em linhas que cabem na largura disponível.
 */
function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  // Approximate: 1 char ≈ fontSize * 0.5 for Arial
  charWidth = 0
): string[] {
  const avgCharW = charWidth || fontSize * 0.52;
  const charsPerLine = Math.floor(maxWidth / avgCharW);
  if (charsPerLine <= 0) return [text];

  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length <= charsPerLine) {
      current = test;
    } else {
      if (current) lines.push(current);
      // If a single word is too long, split it
      if (word.length > charsPerLine) {
        let remaining = word;
        while (remaining.length > charsPerLine) {
          lines.push(remaining.slice(0, charsPerLine));
          remaining = remaining.slice(charsPerLine);
        }
        current = remaining;
      } else {
        current = word;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Desenha o header (parte superior da máscara) em uma página.
 */
export async function drawHeader(page: PDFPage, mascaraImage: Awaited<ReturnType<PDFDocument['embedPng']>>) {
  // A máscara é uma imagem A4 inteira (1241×1754px).
  // Para mostrar apenas o topo (45mm = HEADER_H pts), desenhamos a imagem
  // em tamanho A4 completo mas clipada pelo header container.
  // pdf-lib não suporta clip nativo, então desenhamos a imagem em tamanho A4
  // posicionada em y=0 (canto inferior esquerdo em pdf-lib = bottom-left).
  page.drawImage(mascaraImage, {
    x: 0,
    y: 0,
    width: A4_W,
    height: A4_H,
    opacity: 1,
  });
}

/**
 * Desenha apenas o footer (parte inferior da máscara) — já incluído no drawHeader
 * pois a máscara é a página inteira. Esta função é um alias para clareza.
 */
export function drawFooter(_page: PDFPage, _mascaraImage: unknown) {
  // Footer já está incluído na máscara desenhada pelo drawHeader (imagem A4 inteira).
  // Nenhuma ação adicional necessária.
}

/**
 * Desenha o conteúdo do contrato em múltiplas páginas com header e footer.
 */
export async function drawContractBody(
  pdfDoc: PDFDocument,
  blocks: TextBlock[],
  mascaraImage: Awaited<ReturnType<PDFDocument['embedPng']>>
): Promise<void> {
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([A4_W, A4_H]);
  await drawHeader(page, mascaraImage);

  // Cursor Y: em pdf-lib, y=0 é o fundo. Conteúdo começa do topo para baixo.
  // y do topo da área de conteúdo = A4_H - CONTENT_TOP
  let cursorY = A4_H - CONTENT_TOP;
  const contentBottomY = CONTENT_BOTTOM; // y mínimo antes do footer

  function newPage() {
    page = pdfDoc.addPage([A4_W, A4_H]);
    drawHeader(page, mascaraImage);
    cursorY = A4_H - CONTENT_TOP;
  }

  for (const block of blocks) {
    const fontSize = block.isHeading ? HEADING_SIZE : FONT_SIZE;
    const lineH = block.isHeading ? HEADING_LINE_H : LINE_HEIGHT;
    const font = block.isBold ? boldFont : regularFont;
    const indentX = block.indent ? MARGIN_X + 12 : MARGIN_X;
    const textWidth = CONTENT_W - (block.indent ? 12 : 0);

    // Espaço extra antes de headings
    if (block.isHeading) {
      cursorY -= 4;
    }

    const wrappedLines = wrapText(block.text, textWidth, fontSize);

    for (const line of wrappedLines) {
      // Verificar se cabe na página atual
      if (cursorY - lineH < contentBottomY) {
        newPage();
      }

      cursorY -= lineH;

      const x = block.isCenter
        ? (A4_W - font.widthOfTextAtSize(line, fontSize)) / 2
        : indentX;

      page.drawText(line, {
        x,
        y: cursorY,
        size: fontSize,
        font,
        color: rgb(0.067, 0.067, 0.067), // #111
      });
    }

    // Espaço após o bloco
    cursorY -= PARA_SPACING;
  }
}

/**
 * Função principal: gera PDF completo com pdf-lib, sem browser.
 *
 * @param bodyHtml - HTML do contrato já montado (de prepareContractHtml)
 * @returns Buffer do PDF gerado
 */
export async function generateContractPdfWithPdfLib(bodyHtml: string): Promise<Buffer> {
  console.log('[contracts] using PDF engine: generateContractPdfWithPdfLib (pdf-lib, no browser)');

  // 1. Carregar máscara
  const mascaraBytes = getMascaraBytes();

  // 2. Criar documento PDF
  const pdfDoc = await PDFDocument.create();

  // 3. Embed da imagem da máscara
  const mascaraImage = await pdfDoc.embedPng(mascaraBytes);

  // 4. Extrair blocos de texto do HTML
  const blocks = paginateTextBlocks(bodyHtml);
  console.log('[contracts] text blocks extracted:', blocks.length);

  // 5. Desenhar conteúdo em páginas com header/footer
  await drawContractBody(pdfDoc, blocks, mascaraImage);

  // 6. Serializar para Buffer
  const pdfBytes = await pdfDoc.save();
  const buffer = Buffer.from(pdfBytes);

  console.log('[contracts] PDF generated with pdf-lib, pages:', pdfDoc.getPageCount(), 'bytes:', buffer.length);
  return buffer;
}

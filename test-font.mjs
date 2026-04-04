import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';

const fontBytes = fs.readFileSync('./server/fonts/Roboto-Regular.ttf');
const pdfDoc = await PDFDocument.create();
pdfDoc.registerFontkit(fontkit);

const font = await pdfDoc.embedFont(fontBytes);
console.log('✅ Fonte embarcada com sucesso!');

const page = pdfDoc.addPage([595.28, 841.89]);
page.drawText('Contrato de Compra e Venda de Imóvel', { x: 50, y: 800, size: 14, font });
page.drawText('Vendedor: José da Silva Neto, brasileiro, solteiro', { x: 50, y: 780, size: 11, font });
page.drawText('Comprador: João Ação Côrrea, CPF: 123.456.789-00', { x: 50, y: 760, size: 11, font });
page.drawText('Cláusula 1ª: O imóvel será transmitido em caráter ad corpus.', { x: 50, y: 740, size: 11, font });
page.drawText('Parágrafo único: ç ã é ô ú í à â ê ó — acentos do português.', { x: 50, y: 720, size: 11, font });
page.drawText('Rua São João, nº 15, Jardim Ermida I, Jundiaí-SP, CEP 13212-118.', { x: 50, y: 700, size: 11, font });

const pdfBytes = await pdfDoc.save();
fs.writeFileSync('/home/ubuntu/test-font-roboto.pdf', pdfBytes);
console.log('PDF gerado:', pdfBytes.length, 'bytes');

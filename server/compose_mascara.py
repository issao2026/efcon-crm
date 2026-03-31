#!/usr/bin/env python3
"""
compose_mascara.py — Compõe a máscara Marcello & Oliveira em cada página de um PDF.

Uso: python3 compose_mascara.py <input_pdf> <mascara_png> <output_pdf>

Pipeline:
  1. Converte cada página do PDF de texto para PNG (pdftoppm, 150 DPI)
  2. Aplica multiply blend: mascara * página
     - Branco (255) na página = identidade → mostra a máscara (header/footer escuros preservados)
     - Preto (0) na página = 0 → texto preto preservado
  3. Reconverte as PNGs compostas para PDF (img2pdf, tamanho A4 exato)
"""
import sys
import os
import glob
import subprocess
import tempfile

from PIL import Image, ImageChops
import img2pdf


def compose(input_pdf: str, mascara_png: str, output_pdf: str) -> None:
    # Load mascara once
    mascara = Image.open(mascara_png).convert('RGB')
    mascara_size = mascara.size  # (1241, 1754) at 150 DPI for A4

    with tempfile.TemporaryDirectory() as tmpdir:
        prefix = os.path.join(tmpdir, 'page')

        # Step 1: Convert PDF pages to PNG at 150 DPI
        result = subprocess.run(
            ['pdftoppm', '-png', '-r', '150', input_pdf, prefix],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            raise RuntimeError(f'pdftoppm failed: {result.stderr}')

        page_files = sorted(glob.glob(f'{prefix}-*.png'))
        if not page_files:
            raise RuntimeError('pdftoppm produced no output pages')

        composited = []
        for page_file in page_files:
            page_img = Image.open(page_file).convert('RGB')

            # Resize page to mascara dimensions if needed (should already match at 150 DPI)
            if page_img.size != mascara_size:
                page_img = page_img.resize(mascara_size, Image.LANCZOS)

            # Step 2: Multiply blend
            result_img = ImageChops.multiply(mascara, page_img)

            out_path = page_file.replace('.png', '_composited.png')
            result_img.save(out_path, 'PNG')
            composited.append(out_path)

        # Step 3: Convert composited PNGs to PDF (A4 exact)
        a4_w = img2pdf.mm_to_pt(210)
        a4_h = img2pdf.mm_to_pt(297)
        layout = img2pdf.get_layout_fun(pagesize=(a4_w, a4_h))

        with open(output_pdf, 'wb') as f:
            f.write(img2pdf.convert(composited, layout_fun=layout))


if __name__ == '__main__':
    if len(sys.argv) != 4:
        print(f'Usage: {sys.argv[0]} <input_pdf> <mascara_png> <output_pdf>', file=sys.stderr)
        sys.exit(1)

    input_pdf, mascara_png, output_pdf = sys.argv[1], sys.argv[2], sys.argv[3]

    if not os.path.exists(input_pdf):
        print(f'ERROR: input PDF not found: {input_pdf}', file=sys.stderr)
        sys.exit(1)
    if not os.path.exists(mascara_png):
        print(f'ERROR: mascara PNG not found: {mascara_png}', file=sys.stderr)
        sys.exit(1)

    compose(input_pdf, mascara_png, output_pdf)
    print(f'OK: {output_pdf} ({os.path.getsize(output_pdf)} bytes)', flush=True)

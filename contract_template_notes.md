# Contract Template Notes

## What the user means by "PDF dentro da base"

From the conversation history and images, the user uploaded a DOCX contract template (mascara) at the start of the project.
The contract PDF must be generated using that DOCX template as the base/letterhead, with placeholders replaced by actual data.

## Template files found in the project

The project has a `contractGenerator.ts` that:
1. Uses a DOCX template file stored in the project (the "mascara")
2. Replaces placeholders like `{{nome_vendedor}}`, `{{matricula_imovel}}`, etc.
3. Converts the filled DOCX to PDF using mammoth/html or a PDF library
4. Uploads the PDF to S3 and returns the URL

## Key requirement
- The PDF must use the original DOCX template (mascara) as the base
- NOT a plain HTML-generated document
- The template has the letterhead/branding of "Marcello & Oliveira Imóveis"
- After PDF is generated and saved to S3, THEN send via WhatsApp/email to all parties

## Distribution flow
1. Fill form → Generate PDF (using DOCX mascara) → Save to S3
2. Only after PDF URL is available → Show distribution modal
3. Modal shows: each party (vendedores, compradores, corretores) with WhatsApp + email buttons
4. WhatsApp: opens wa.me link with pre-filled message containing PDF URL
5. Email: opens mailto: link with PDF URL in body

## Files to check
- `/home/ubuntu/efcon-crm/server/contractGenerator.ts` - the PDF generator
- `/home/ubuntu/efcon-crm/server/routers.ts` - the tRPC procedures
- `/home/ubuntu/efcon-crm/client/src/pages/Contract.tsx` - the frontend form

# PDF Analysis — contratoefcon.pdf

## Problems found:

### 1. Text being cut off by the footer/header mascara (pages 1, 2, 3)
- **Page 1**: Last ~3 lines at the bottom are hidden behind the footer mascara (dark band)
  - "conforme" is cut at the bottom of page 1
- **Page 2**: First ~3 lines at the top are hidden behind the header mascara (dark band)
  - "Parte do valor será pago por financiamento..." starts behind the header
  - Also last lines cut by footer
- **Page 3**: First ~3 lines hidden behind header mascara
  - "O presente contrato poderá ser assinado..." hidden behind header

### 2. Root cause:
The Puppeteer PDF margins are not large enough:
- Current: top: 2.5cm, bottom: 4.2cm
- The header mascara is ~3.0cm tall (dark band)
- The footer mascara is ~5.3cm tall (dark band)
- So we need: top >= 3.2cm, bottom >= 5.5cm

### 3. Fix needed:
Increase margins in contractGenerator.ts:
- top: '3.2cm' (was 2.5cm)
- bottom: '5.5cm' (was 4.2cm)
- Also reduce headerTemplate height from 2.2cm to match

## Distribution flow (image 3 - Contratos page):
- "WhatsApp em Lote" button exists but only opens wa.me links (requires user to have WhatsApp)
- Need to add "Enviar por E-mail" option in the contract list actions menu
- The modal should show: WhatsApp (opens wa.me) + E-mail (opens mailto: or sends via backend SMTP)

## WhatsApp options:
1. **wa.me link** (current): Opens WhatsApp app with pre-filled message. FREE, no API needed. Works on mobile/desktop.
2. **Twilio/Z-API**: Sends automatically in background. Requires paid API subscription.
→ Keep wa.me approach but make it clear to user. Add email as alternative.

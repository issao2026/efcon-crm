# Efcon CRM - TODO

## Phase 2: Database & Styles
- [x] Database schema (deals, clients, documents, contracts, activities)
- [x] Global styles matching Efcon dark navy design
- [x] App.tsx routes setup

## Phase 3: Home Page
- [x] Hero section with dark navy background
- [x] Stats bar (10k+, 99.9%, <5min, 100%)
- [x] How it works (4 steps)
- [x] Features section with dashboard mockup
- [x] Operations section (Venda, Locação, Permuta)
- [x] Pricing section (Starter, Profissional, Enterprise)
- [x] CTA section and footer

## Phase 4: Dashboard
- [x] Sidebar navigation (Dashboard, Negócios, Clientes, Documentos, Contratos, Financeiro, Relatórios, Configurações)
- [x] Top header with search, notifications, user profile
- [x] Metrics cards (negócios ativos, contratos gerados, volume, pendências)
- [x] Pipeline Kanban (Rascunho, Em andamento, Contrato gerado, Assinatura, Concluído)
- [x] Deals table with filters (Todos, Venda, Locação, Permuta)
- [x] Recent activity feed

## Phase 5: Document Upload
- [x] Drag-and-drop upload interface
- [x] File type validation (JPG, PNG, PDF)
- [x] S3 upload integration
- [x] OCR processing via LLM
- [x] Auto-fill form fields from OCR results
- [x] Document checklist per deal

## Phase 6: Contract Generation
- [x] Contract form with all major fields
- [x] Field validation
- [x] LLM-powered field suggestions
- [x] Contract generation with HTML letterhead
- [x] Contract preview before download
- [x] S3 storage for generated contracts

## Phase 7: Deal Management & Notifications
- [x] Deal CRUD operations
- [x] Document checklist tracking
- [x] Owner notifications on new deals/uploads/contracts
- [x] Role-based access (admin/user)

## Phase 8: Tests & Delivery
- [x] Vitest tests for key procedures (12 tests passing)
- [x] Checkpoint save
- [x] Final delivery

## Future Enhancements
- [x] Deal detail page with full document checklist
- [ ] Automatic legal checklist by operation type
- [ ] Clicksign integration for digital signatures
- [ ] Financial reports with charts
- [ ] Client management module with history
- [ ] Real-time push notifications

## Bug Fixes & Missing Pages (Round 2)
- [x] Fix Dashboard.tsx duplicate useState import error (was stale Vite cache, not real error)
- [x] Fix all 404 routes (dashboard/negocios, dashboard/clientes, etc.)
- [x] Build Negócios page (list with filters, status badges, progress)
- [x] Build Clientes page (list with search, client cards)
- [x] Build Documentos page (global documents list with OCR status)
- [x] Build Contratos page (contracts list with download links)
- [x] Build Financeiro page (financial summary with charts)
- [x] Build Relatórios page (reports and analytics)
- [x] Build Deal Documents page (deal-level with OCR panel + legal checklist)
- [x] Build Configurações page
- [x] Wire all routes in App.tsx
- [x] Fix sidebar navigation links in Dashboard (removed toast.info blocker, added location-based active state)

## Round 3 — Home Link + Document Groups
- [ ] Add link to Home (/) on dashboard logo (DashboardShell + Dashboard sidebar + Upload header)
- [ ] Create document_groups table in schema (id, dealId, personName, personRole, createdAt)
- [ ] Create document_group_items table (groupId, documentId, docType: rg|cpf|cnh|escritura|comprovante|outro)
- [ ] Add documents.createGroup and documents.listGroups tRPC procedures
- [ ] Build DocumentGroups component — group cards showing person name, role, and document checklist per type
- [ ] Integrate group creation after OCR scan in NegocioDocumentos page
- [ ] Show grouped view in Documentos page with expand/collapse per group

## Round 4 — Document Viewer, Deal Links, Client Selectors
- [x] Document view/edit/delete modal in Documentos.tsx (click to open, edit OCR fields, delete)
- [x] OCR trigger button in Documentos.tsx document list
- [x] Person classification in Documentos.tsx (assign document to a person/group via DocumentDetailModal)
- [x] Client selectors (comprador, vendedor, corretista) in Novo Negócio modal
- [x] Build NegocioDetalhe page (deal detail with tabs: Resumo, Participantes, Documentos, Contrato, Histórico)
- [x] Enable all deal links in Negocios.tsx table rows (clickable rows navigate to deal detail)
- [x] Enable all deal card links in Dashboard Kanban (added Kanban view to Negocios.tsx with clickable cards)

## Round 5 — Onboarding Upload Page
- [x] Create OnboardingUpload page (/comecar) matching mockup: drag-and-drop, Pular, Continuar sem arquivos
- [x] Wire "Começar grátis" and "Criar conta" CTAs on Home to /comecar (after OAuth login)
- [x] After upload (or skip), redirect to /dashboard

## Round 6 — OCR Auto-processing Fix
- [ ] Fix OCR stuck on "Processando..." — investigate backend processOcr procedure
- [ ] Trigger OCR automatically when document modal opens (not just on button click)
- [ ] Show OCR results immediately after processing completes

## Round 7 — Vincular a cliente melhorado

- [x] Backend: procedure clients.createFromOcr to create client from OCR fields with clientRole
- [x] DocumentDetailModal: show link to existing client profile when one is selected
- [x] DocumentDetailModal: "Novo cliente" option shows inline form with role selector (Comprador/Vendedor/Corretor) and creates client from OCR data

## Round 8 — Cliente Detalhe + Contrato

- [x] Backend: clients.getById procedure returning client with documents and deals
- [x] Create ClienteDetalhe page (/dashboard/clientes/:id) with editable profile, documents tab, deals tab
- [x] Make client names clickable in Clientes page to navigate to detail
- [x] Update DocumentDetailModal ExternalLink to navigate to /dashboard/clientes/:id
- [x] Improve contract generation in NegocioDetalhe: pre-fill buyer/seller/broker from deal participants

## Round 9 — Modal Width Fix
- [x] Increase DocumentDetailModal width (max-w-5xl → max-w-6xl or wider) so OCR fields and new-client form are not truncated
- [x] Fix new-client category buttons to fit on one line (Comprador / Vendedor / Corretor)
- [x] Reduce OCR input font size slightly to show full text without truncation

## Round 10 — Vincular Negócio ao Cliente
- [x] Add "Vincular negócio" button in ClienteDetalhe Negócios tab
- [x] Dropdown to select an existing deal and link it to the client (as buyer/seller/broker)
- [x] Backend: procedure to link a client to a deal (update deal's buyerId/sellerId/brokerId)

## Round 12 — Client Lookup in Contract Page
- [ ] Add "Selecionar cliente cadastrado" dropdown at top of each section (Vendedor, Comprador, Corretor) in Contract.tsx
- [ ] On selection, auto-fill all fields (nome, CPF, RG, endereço, estado civil, profissão, nacionalidade) from the registered client

## Audit Round — Site-wide Errors & Inconsistencies (2026-03-18)
- [ ] Fix 404: /dashboard/contratos/novo — redirect to /dashboard/contrato
- [ ] Fix Contratos page: save generated contracts to DB and list them
- [ ] Fix Dashboard KPIs: show real counts from DB (negócios ativos, contratos gerados)
- [ ] Fix Relatórios chart: render real data in "Negócios por mês" chart
- [ ] Fix Clientes cards: show email, phone and role (comprador/vendedor)
- [ ] Wrap Contract generation page inside DashboardLayout (add sidebar)

## Phase 15 — PDF Fallback Fix (Production)
- [x] Add generateContractHtml function to contractGenerator.ts (fills DOCX template + mascara background)
- [x] Add contracts.generateHtml tRPC procedure to routers.ts
- [x] Fix Contract.tsx fallback: when Puppeteer fails in production, call generateHtml endpoint and open the branded HTML in a new window for printing
- [x] Update tests: add generateHtml tests, fix obsolete demo-data tests to reflect real-data behavior
- [x] All 14 tests passing
- [x] Fix mascara not loading: replaced @page background-image (not supported by browsers) with position:fixed <img> element (works in Chrome/Firefox/Edge print)

## Phase 14 — Contract Type Selector (Compra e Venda / Locação)
- [x] Add contract type selector at top of Contract form (Compra e Venda / Locação / Permuta / Financiamento)
- [x] Show/hide fields specific to each type (locação: prazo, dia vencimento, garantia, índice reajuste, multa rescisão; compra e venda: sinal, financiamento, prazo posse, escritura)
- [x] Update contractGenerator.ts with locação-specific fields in ContractFields type and DEFAULTS
- [x] Map locação fields in handleGenerate (prazo_locacao, tipo_garantia, indice_reajuste, destinacao_imovel, etc.)

## Phase 13 — Dashboard Clickable Cards + Spreadsheet Import
- [x] Make stat cards clickable (navigate to corresponding section)
- [x] Add WhatsApp floating button (FAB) fixed bottom-right on all dashboard pages (number: 11940388766)
- [x] Create spreadsheet import modal in Dashboard with file upload, preview table, column mapping, and import action
- [x] Add spreadsheet import (Excel/CSV) for deals and clients
- [x] Create import modal with file upload, preview, and column mapping
- [x] Add server-side import procedure (parse XLSX/CSV, validate, bulk insert)

## Phase 12 — Dashboard Real Data + Actions
- [x] Remove fake/static data from Dashboard (hardcoded trends, fake activities)
- [x] Connect dashboard stats cards to real DB data
- [x] Add visualizar, editar, apagar actions to deals table in Dashboard
- [x] Make pipeline kanban cards clickable (open edit modal)
- [x] Fix "Atualizado às" and user name to use real logged-in user data

## Phase 11 — Contract Actions
- [x] Add contracts.getById procedure
- [x] Add contracts.update procedure
- [x] Add contracts.delete procedure
- [x] Add visualizar (download PDF), editar (form preenchido) and apagar buttons to Contratos page

## Phase 10 — Mobile Responsiveness
- [x] Fix DashboardLayout: sidebar hidden on mobile, hamburger button to open/close, overlay backdrop
- [x] Fix DashboardShell: header responsive on mobile
- [x] Convert Imoveis.tsx from DashboardLayout to DashboardShell (consistent mobile behavior)

## Phase 9 — Improvements (Mar 2026)
- [x] Add missing contract fields (prazo de posse, prazo de escritura, percentual de multa, foro eleito, plataforma de assinatura, dados da imobiliária)
- [x] Update contractGenerator.ts with new ContractFields and DEFAULTS
- [x] Create /dashboard/imoveis page with full CRUD (list, create, edit, delete)
- [x] Add properties.update and properties.delete procedures to server router
- [x] Update DashboardLayout with proper CRM navigation (9 items + Efcon branding)
- [x] Implement CEP auto-fill via ViaCEP API (useCep hook shared across pages)
- [x] Add CEP lookup to Clientes.tsx new client form (with address fields)
- [x] Add CEP lookup to Negocios.tsx property address form
- [x] Add CEP lookup to Imoveis.tsx property modal

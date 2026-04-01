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

## Phase 16 — Locação Contract Fix
- [x] Fix: contrato de locação usa template de Compra e Venda no PDF (Vendedor/Comprador em vez de Locador/Locatário)
- [x] Added generateLocacaoBodyHtml() function that generates locação HTML directly with LOCADOR(A)/LOCATÁRIO(A) labels and all locação-specific clauses
- [x] prepareContractHtml() now routes to locação generator when tipo_contrato === 'LOCAÇÃO'
- [x] Updated tests: locacao test now verifies LOCADOR(A)/LOCATÁRIO(A) labels and absence of VENDEDOR(A)/COMPRADOR(A)
- [x] All 14 tests passing

## Phase 17 — PDF Margin Fix (Mascara Overlap)
- [x] Fix: texto invadindo a área preta da máscara nas páginas 2 e 3 do PDF
- [x] Analyzed mascara image pixel-by-pixel: header dark area 0–3.0cm, footer dark area starts at 24.37cm (5.33cm tall)
- [x] Fixed approach: use headerTemplate (3.2cm, background-size: 21cm 29.7cm, position: top) + footerTemplate (5.6cm, position: bottom)
- [x] Set correct page margins: top 3.8cm, bottom 5.8cm, left/right 2.2cm
- [x] Verified visually: all 3 pages have mascara correctly with text inside white area
- [x] All 14 tests passing

## Phase 18 — Safari iOS Compatibility Fix
- [x] Root cause: Safari iOS auto-translation modifies the DOM directly, conflicting with React Virtual DOM → removeChild crash
- [x] Fix: added translate="no" to <html> element and <meta name="google" content="notranslate"> to prevent auto-translation
- [x] Fix: changed lang="en" to lang="pt-BR" so Safari doesn't attempt translation
- [x] Fix: replaced next-themes useTheme() in sonner.tsx with project's custom ThemeContext (next-themes provider was not configured)
- [x] Fix: moved localStorage.setItem from useMemo to useEffect in useAuth.ts (side effects in useMemo violate React rules)
- [x] Fix: wrapped all localStorage access in try/catch for Safari iOS private browsing compatibility
- [x] Fix: translated ErrorBoundary to Portuguese and added translate="no"
- [x] All 14 tests passing

## Phase 19 — Navegação Top Nav + Múltiplos Participantes + WhatsApp
- [x] Redesenhar navegação: substituir sidebar pelo top nav horizontal dark (estilo efcon.com.br/auth)
- [x] Top nav: logo Efcon à esquerda, links centrais (Analytics, Configurações), botão "+ Novo Contrato" + notificações + tema + avatar à direita
- [x] Múltiplos vendedores no formulário de criação de contrato (+ Adicionar Vendedor)
- [x] Compradores: sozinho, marido e esposa, outros (múltiplos)
- [x] Corretores: múltiplos (+ Adicionar Corretor)
- [x] Lista de seleção rápida de clientes cadastrados no início do formulário
- [x] Envio de WhatsApp para cada participante verificar e assinar o contrato
- [x] WhatsApp em Lote: enviar para todos os participantes de uma vez
- [x] Atualizar generateLocacaoBodyHtml para exibir locadores/locatários adicionais no PDF
- [x] Testes multi-partes (16 testes passando)

## Phase 20 — Reformulação Dashboard + Contratos (Estilo Lovable)
- [ ] Pular /comecar: redirecionar direto para /dashboard após login
- [ ] Novo Dashboard dark: top nav (logo, Analytics, Configurações, + Novo Contrato, notificações, avatar), saudação personalizada, 3 stat cards (Total, Em Andamento, Finalizados), 4 action cards (Contratos, Relatórios, Configurações, Meu Perfil), painel de notificações à direita, banner "Criar Novo Contrato" no rodapé
- [ ] Página de Contratos dark: 4 stat cards no topo, barra de busca + filtros, lista de contratos com cards (status badge, código CTR, nome imóvel, ícones vendedor/comprador/corretor, barra de progresso, botão WhatsApp em Lote, botão Ver, menu ⋮)
- [ ] Modal "Novo Contrato": campo descrição do imóvel, seções Vendedores/Compradores/Corretores com e-mail + WhatsApp por participante, botões + Adicionar, botão Criar Contrato
- [ ] Página de detalhe do contrato (imagem6): progresso, participantes com status, tabs (Prévia, Documentos, Status OCR, Padronização, Validações, Assinaturas, Histórico), painel direito (Assinatura Digital, Status em Tempo Real)
- [ ] Atualizar schema: tabela contracts com código CTR, participantes (email, whatsapp, role, status), progresso, status
- [ ] Backend: procedures contracts.create, contracts.list, contracts.getById, contracts.updateStatus

## Phase 20 — Reformulação Dashboard + Contratos (CONCLUÍDO)
- [x] Pular /comecar: OAuth callback redireciona para /dashboard após login
- [x] Home.tsx: CTA "Começar grátis" redireciona para /dashboard (não /comecar)
- [x] Dashboard.tsx: redesenho completo estilo dark Lovable (imagem3/4) — top nav, cards de ação, stats reais, painel de notificações com abas, banner CTA
- [x] Contratos.tsx: redesenho completo estilo dark (imagem5) — stats 4 cards, busca, lista de contratos com status badge, progresso, participantes, botão WhatsApp em Lote, menu ações
- [x] Modal Novo Contrato (imagem7): dark, campo imóvel + e-mail/WhatsApp por vendedor/comprador/corretor, botões + Adicionar
- [x] Backend: contracts.create procedure simplificado para o modal
- [x] 16 testes passando

## Phase 21 — Dashboard Cores + PDF Margens
- [x] Dashboard: cores navy consistentes com a home (#060d1a, #0d1526, #0a1220)
- [x] Dashboard: todos os cards de Acesso Rápido clicáveis (navegam para a página)
- [x] Dashboard: clique em contrato recente ou notificação abre modal de preview
- [x] PDF: reduzir header de 3.2cm→2.2cm, footer de 5.6cm→3.8cm, margens top 2.5cm bottom 4.2cm

## Phase 22 — Clientes, Imóveis, Documentos, Contrato melhorado
- [ ] Schema DB: tabela clients (nome, cpf, email, whatsapp, papel, foto)
- [ ] Schema DB: tabela client_documents (clientId, tipo, s3Key, url, ocrData, ocrStatus)
- [ ] Schema DB: tabela properties (descricao, endereco, matricula, tipo, valor, s3Key matricula)
- [ ] Backend: procedures clients.list, clients.create, clients.get, clients.delete
- [ ] Backend: procedures clients.uploadDocument, clients.getDocuments
- [ ] Backend: procedures properties.list, properties.create, properties.get, properties.delete
- [ ] Página /dashboard/clientes: cards com avatar, nome, CPF, papel, botões Documentos/Negócios
- [ ] Página /dashboard/imoveis: lista com cards, busca, upload de matrícula
- [ ] Modal Novo Contrato: aba "Imóvel Cadastrado" vs "Novo Imóvel/Upload"
- [ ] Dashboard: card Clientes Cadastrados no Acesso Rápido
- [ ] Top nav: adicionar link Clientes e Imóveis
- [ ] PDF: ajuste fino margens (header/footer dentro da área branca)

## Phase 22 — Clientes, Imóveis, Upload Matrícula, Modal Contrato (CONCLUÍDO)
- [x] Colunas matriculaDocUrl/matriculaDocKey em properties e whatsapp em clients
- [x] Procedures: clients.uploadDocument, clients.delete, properties.uploadMatricula
- [x] Página Clientes: cards dark navy, busca, upload de documentos por cliente (RG, CPF, CNH, etc.)
- [x] Página Imóveis: upload de matrícula com modal, botão "Enviar Matrícula" em cada card
- [x] Modal Novo Contrato: toggle Imóvel Cadastrado vs Digitar Descrição
- [x] Dashboard: cards Clientes Cadastrados e Imóveis no Acesso Rápido
- [x] PDF: padding page-content reduzido (3.2cm top, 5.5cm bottom) para texto dentro da área branca
- [x] 16 testes passando

## Phase 23 — Template Contrato Antigo + Campo Matrícula
- [ ] Restaurar template de contrato de compra e venda para versão antiga (seções numeradas, Marcello & Oliveira)
- [ ] Adicionar campo matrícula no modal Novo Contrato
- [ ] Passar matrícula para o contractGenerator ao gerar PDF

## Phase 24 — Distribuição do Contrato (WhatsApp + E-mail pós-PDF)
- [x] Adicionar campo email nas PartyData (vendedores, compradores) e BrokerData (corretores) em Contract.tsx
- [x] Exibir campo email em PartyCard e BrokerCard no formulário
- [x] Após gerar PDF com sucesso (generatedPdfUrl disponível), mostrar modal de distribuição automaticamente
- [x] Modal de distribuição: lista de todas as partes (vendedores, compradores, corretores) com nome, papel, WhatsApp e e-mail
- [x] Botão WhatsApp: abre wa.me com mensagem pré-preenchida contendo link do PDF
- [x] Botão E-mail: abre mailto: com assunto e corpo contendo link do PDF
- [x] Botão "Enviar Todos via WhatsApp": abre todos os links em sequência
- [x] Somente exibir modal de distribuição APÓS o PDF estar pronto (URL disponível)
- [x] Indicador visual de status de envio por parte (✓ WA / ✓ Email)

## Phase 25 — Correção de Margens PDF + Distribuição na Lista de Contratos
- [ ] Corrigir margens Puppeteer: top 3.2cm, bottom 5.5cm (texto cortado pela máscara nas páginas 2 e 3)
- [ ] Ajustar headerTemplate height para 3.2cm e footerTemplate para 5.5cm
- [ ] Adicionar modal de distribuição (WhatsApp + E-mail) na página Contratos.tsx (botão "Distribuir" em cada contrato)
- [ ] Modal Contratos: mostrar participantes (vendedor, comprador, corretor) com botões WhatsApp e E-mail
- [ ] Explicar no modal que WhatsApp usa wa.me (abre o app, sem API paga)
- [ ] Adicionar opção "Enviar por E-mail" como alternativa ao WhatsApp

## Phase 26 — Dashboard Relatórios + Clientes Detalhe + Imóveis Situação + Distribuição Contratos
- [x] Schema: adicionar coluna propertyStatus em properties (disponivel/vendido/alugado/em_negociacao)
- [x] Migração SQL: ALTER TABLE properties ADD COLUMN propertyStatus
- [x] Página Imóveis: mostrar badge de situação em cada card, permitir editar situação no modal
- [x] Página Clientes: ao clicar no card navegar para /dashboard/clientes/:id
- [x] Relatórios: dark navy consistente (#0f1117 / #1a1d27), gráfico de barras empilhadas com dados reais do DB
- [x] Relatórios: KPIs conectados ao backend (totalDeals, totalClients, totalContracts, conclusionRate)
- [x] Contratos: substituir WhatsAppBatchModal por DistribuicaoModal (WhatsApp + E-mail) com link do PDF
- [x] Contratos: nota explicativa no modal sobre como o WhatsApp funciona (wa.me, sem API paga)
- [x] Modal Novo Imóvel: botão de upload de matrícula (PDF/imagem) com envio ao S3, preview do arquivo enviado
- [x] Remover "Documentos" do menu principal de navegação (DashboardShell)
- [x] Página /dashboard/clientes/:id com abas: Dados Pessoais | Documentos | Negócios
- [x] Aba Documentos no perfil do cliente: listar docs com imagem/preview + botão upload com OCR
- [x] NegocioDetalhe: upload+OCR de documentos inline na aba Documentos (sem redirecionar para /upload)
- [x] Todos os formulários (Imóveis, Clientes, Negócios): campos editáveis após criação

## Phase 27 — Correção Definitiva de Margens do PDF
- [x] Medir altura real do cabeçalho e rodapé da máscara via análise de pixels (Python PIL): header=30mm, footer=52mm
- [x] Corrigir margens Puppeteer: top 38mm, bottom 60mm (com buffer de segurança de 8mm)
- [x] Corrigir headerTemplate height: 30mm, footerTemplate height: 52mm

## Phase 27 — Margens PDF + Upload OCR no Modal Contrato
- [x] contractGenerator.ts: margens Puppeteer corrigidas (top: 38mm, bottom: 60mm, headerTemplate: 30mm, footerTemplate: 52mm)
- [x] Modal Criar Novo Contrato (Contratos.tsx): botão 📎 upload+OCR por participante para preencher e-mail/WhatsApp automaticamente

## Phase 28 — Upload de Matrícula no Modal Criar Novo Contrato
- [x] Seção "Identificação do Imóvel": botão "Enviar Matrícula" (PDF/imagem) com upload ao S3 + OCR
- [x] OCR extrai número da matrícula e cartório de registro automaticamente
- [x] Exibir preview do arquivo enviado (nome + ícone) e campos pré-preenchidos

## Phase 29 — Upload Documentos com OCR no Modal Novo Cliente + Novo Negócio
- [ ] Modal Novo Cliente (Clientes.tsx): seção "Documentos" com botões de upload por tipo (RG, CPF, CNH, Comprovante de Endereço)
- [ ] OCR preenche automaticamente: nome, CPF, RG, endereço, data de nascimento, estado civil, profissão, nacionalidade
- [ ] Preview do arquivo enviado com nome + link "Ver"
- [ ] Modal Novo Negócio (Negocios.tsx): botão "Enviar Matrícula" na seção Detalhes do Imóvel com upload S3 + OCR
- [ ] OCR preenche automaticamente campos Matrícula e Cartório de Registro no Novo Negócio

## Phase 29 — OCR Upload in Novo Cliente + Novo Negócio Modals

- [x] Add `documents.ocrInline` tRPC procedure: accepts base64 directly (no pre-existing documentId), uploads to S3, runs LLM OCR, returns extracted fields + fileUrl
- [x] Add document upload section in "Novo Cliente" modal (Clientes.tsx): 4 buttons for RG, CPF, CNH, Comprovante de Endereço — each triggers OCR and auto-fills name, CPF, RG, birthDate, address, motherName, fatherName
- [x] Add matrícula upload button in "Novo Negócio" modal property section (Negocios.tsx): OCR extracts matricula number, cartório, and property description — auto-fills registration, registryOffice, propertyDescription fields
- [x] 16 tests passing

## Phase 30 — Modal Criar Novo Contrato: Busca de Clientes + OCR por Participante

- [x] Matrícula: campo de texto editável + botão OCR que extrai número e cartório
- [x] Vendedores: dropdown de busca por clientes cadastrados (auto-preenche nome, CPF, RG, email, WhatsApp) + botão OCR por participante
- [x] Compradores: idem
- [x] Corretores: idem
- [x] Quando cliente cadastrado é selecionado, todos os campos do participante são preenchidos automaticamente
- [x] Botão OCR por participante: upload de RG/CPF/CNH → extrai nome, CPF, RG → preenche campos do participante

## Phase 31 — Wizard de 3 Etapas no Modal Criar Novo Contrato

- [x] Etapa 1: Partes envolvidas (Vendedores, Compradores, Corretores) com busca de cadastro + OCR por documento
- [x] Etapa 2: Identificação do Imóvel (seleção/descrição) + Matrícula com OCR (número + cartório editáveis)
- [x] Etapa 3: Revisão dos dados coletados + botão "Gerar Contrato" que navega para /dashboard/contrato com todos os campos pré-preenchidos
- [x] Passar dados do wizard para Contract.tsx via localStorage
- [x] Contract.tsx: ler dados pré-preenchidos e popular formulário automaticamente ao abrir (toast de confirmação)

## Phase 32 — Melhorias no Wizard de Contrato

- [x] Salvar rascunho do wizard no localStorage com botão "💾 Rascunho" e banner de retomada/descartar
- [x] Validação por etapa: bloquear "Próximo" se campos essenciais vazios (etapa 1: ao menos 1 vendedor e 1 comprador com nome; etapa 2: imóvel identificado)
- [x] OCR expandido: extrair estado civil, profissão e endereço do RG/CNH e preencher no ParticipantCard
- [x] Servidor: expandir prompt do ocrInline para retornar estadoCivil, profissao, endereco
- [x] Criar skill reutilizável do processo wizard OCR (efcon-ocr-wizard)

## Phase 33 — Contract.tsx: fundo azul-cinza + OCR por participante e imóvel

- [x] Fundo azul-cinza claro (bg-[#eef2f7]) em todos os inputs/selects do Contract.tsx
- [x] Botão OCR por participante (Vendedor, Comprador, Corretor) que faz upload de RG/CPF/CNH e preenche campos automaticamente
- [x] Botão OCR na seção Imóvel para upload de matrícula e preenchimento automático de matrícula + cartório

## Phase 34 — Confirmação antes de Excluir

- [x] Contratos.tsx: diálogo de confirmação antes de excluir contrato
- [x] Clientes.tsx: diálogo de confirmação antes de excluir cliente
- [x] Imoveis.tsx: diálogo de confirmação já existia (correto)
- [x] Negocios.tsx: não tem exclusão implementada (sem alteração necessária)

## Phase 35 — Matrícula: Layout Expandido + Upload OCR + Preview

- [x] Wizard Etapa 2 (Contratos.tsx): seção matrícula expandida — botão upload OCR com preview (nome + link Ver), campos número e cartório em linha abaixo, hint text
- [x] Modal Novo Imóvel (Imoveis.tsx): seção upload matrícula com OCR, preview do arquivo, auto-preenchimento dos campos Matrícula e Cartório de Registro

## Phase 36 — Matrícula Completa: Banco + OCR Expandido + Preview Inline + Skill

- [x] Schema: matriculaDocUrl já existia na tabela properties
- [x] Procedure: create property aceita matriculaDocBase64 + mimeType + fileName, faz upload S3 e salva URL
- [x] Imoveis.tsx: OCR envia base64 para procedure e salva matriculaDocUrl junto com o imóvel
- [x] OCR expandido: extrai endereco_imovel, area_total, proprietario_atual da matrícula e preenche campos
- [x] Modal preview inline: DocPreviewModal reutilizável integrado em Imoveis.tsx, Contratos.tsx e Contract.tsx
- [x] Skill: skill efcon-ocr-wizard atualizada com fluxo completo de matrícula, DocPreviewModal e persistência S3

## Phase 37 — Edição Inline no Modal Distribuir Contrato

- [x] Botão "Editar" (lápis) em cada participante do modal Distribuir Contrato
- [x] Painel inline azul com campos Nome, WhatsApp, E-mail editáveis
- [x] Salvar alterações localmente via localParties state (atualiza WA/email links em tempo real)
- [x] Fechar painel ao clicar em "Salvar" ou "Cancelar"

## Phase 38 — OCR Matrícula: Transcrição Completa + Fix Null

- [ ] Servidor: nova procedure ocrFullText que extrai texto integral do documento (sem JSON schema)
- [ ] Corrigir campos null: filtrar valores null/undefined para string vazia no handleMatriculaOcr (Contratos.tsx e Contract.tsx)
- [ ] Wizard etapa 2: botão "Transcrição Completa" que exibe o texto integral da matrícula em textarea editável
- [ ] Contract.tsx seção imóvel: mesmo botão de transcrição completa
- [ ] Melhorar prompt ocrInline para matrícula: instruir a não retornar null, usar string vazia se não encontrar

## Phase 38b — Corrigir Margens do PDF (texto sobre cabeçalho/rodapé)

- [ ] Medir altura exata do cabeçalho e rodapé da máscara em pixels/mm
- [ ] Ajustar margem superior (top) do conteúdo para não sobrepor o cabeçalho
- [ ] Ajustar margem inferior (bottom) do conteúdo para não sobrepor o rodapé
- [ ] Testar geração do PDF e verificar alinhamento

## Phase 38b — Ficha do Cliente + Margens PDF
- [x] Criar ClienteFichaModal com dois painéis: dados editáveis (esquerda) + documentos digitalizados (direita)
- [x] Clicar no nome do cliente abre a ficha completa
- [x] Upload de documento na ficha com OCR automático que preenche campos
- [x] Visualização de documentos com preview e download
- [x] Corrigir margens do PDF: header 42mm, footer 58mm (texto não sobrepõe mais a máscara)

## Phase 39 — Cards de Estatísticas Clicáveis (Contratos)
- [x] Adicionar estado statusFilter nos cards de Contratos
- [x] Clicar em cada card filtra a lista pelo status correspondente
- [x] Card ativo com borda destacada e descrição do que representa

## Phase 40 — OCR Matrícula Auto-fill Completo
- [x] Melhorar prompt OCR para extrair: número matrícula, cartório, endereço completo, área total, área construída, descrição do imóvel, cidade, estado, inscrição municipal, confrontações
- [x] Preencher automaticamente todos os campos do Step 2 do wizard após OCR
- [x] Mostrar toast de sucesso com campos extraídos após OCR

## Phase 41 — Prompt OCR Especializado (Matrícula)

- [ ] Substituir prompt OCR da matrícula pelo prompt especializado do usuário
- [ ] Atualizar JSON schema com novos campos: tipo_imovel, bairro, cidade, estado, cep, area_privativa, area_comum, valor, cnpj_cpf_proprietario, data_ultimo_registro, numero_registro, situacao_imovel
- [ ] Mapear novos campos no frontend (Contract.tsx, Imoveis.tsx, Negocios.tsx)

## Phase 42 — 3 Correções do Usuário
- [ ] Correção 1: Step 3 do wizard exibe todos os campos do imóvel (tipo, endereço, bairro, cidade, área, valor venal, proprietário)
- [ ] Correção 2: saveDraft/loadDraft persiste os 18 campos novos do imóvel
- [ ] Correção 3: @page background-image no template HTML para máscara repetir em todas as páginas do PDF

## Phase 43 — Corrigir Largura e Margens do PDF
- [x] Ajustar margens: top 40mm, bottom 57mm, right/left 2.0cm
- [x] Alturas dos templates: headerTemplate 40mm, footerTemplate 57mm
- [x] Adicionar width: 210mm e height: 297mm ao page.pdf()
- [x] Adicionar setViewport(794, 1123) antes do page.pdf()
- [x] Adicionar width: 210mm ao CSS do body no buildContractHtmlWithBackground

## Phase 44 — Alinhar headerTemplate/footerTemplate com margin.top/bottom
- [x] Substituir bloco page.pdf(): headerTemplate height=40mm = margin.top=40mm, footerTemplate height=60mm = margin.bottom=60mm
- [x] Usar background-size: 210mm 297mm (A4 completo) nos templates
- [x] Usar unidades mm em vez de cm nos templates

## Phase 45 — Ajuste de Escala 0.75 nos Templates Puppeteer
- [x] Aplicar fator de escala 0.75 no headerTemplate: height 53.3mm (= 40mm ÷ 0.75)
- [x] Aplicar fator de escala 0.75 no footerTemplate: height 80mm (= 60mm ÷ 0.75)
- [x] Ajustar background-size para 210mm 396mm (= 297mm ÷ 0.75)
- [x] Manter margens reais: top 40mm, bottom 60mm, left/right 20mm

## Phase 46 — Correção Definitiva das Margens do PDF
- [x] Diagnosticar causa raiz: headerTemplate/footerTemplate do Puppeteer não criam margem real no conteúdo
- [x] Medir máscara: top dark band 0-29mm, white starts 29mm; bottom dark band starts 51mm from bottom
- [x] Solução: displayHeaderFooter:true com height=40mm no header e height=55mm no footer, margin.top=40mm, margin.bottom=55mm
- [x] Testar PDF com margem top 40mm e bottom 55mm — texto sem sobreposição em todas as 3 páginas

## Phase 47 — Correção Margens Páginas 2 e 3
- [ ] CSS limpo com @page margin:0, sem padding no body
- [ ] headerTemplate height:53.4mm, background-size:210mm 396mm
- [ ] footerTemplate height:80mm, background-size:210mm 396mm
- [ ] margin.top:40mm, margin.bottom:60mm no page.pdf()
- [ ] page-break-inside:avoid em p, h1, h2, h3, div

## Phase 49 — Grid 3x3 para PDF
- [ ] Substituir generateContractPdf pela abordagem grid 3x3 (sem displayHeaderFooter, máscara como position:absolute no .bg, texto apenas na .cell-center)
- [ ] Verificar todas as páginas sem sobreposição

## Phase 50 — Máscara position:fixed + margens 45mm/65mm
- [ ] position:fixed para máscara (cobre 100% de cada página)
- [ ] margin.top:45mm + margin.bottom:65mm no page.pdf()
- [ ] padding-top:45mm + padding-bottom:65mm no body
- [ ] Verificar todas as páginas sem sobreposição

## Phase 51 — Opção A: pdf-lib overlay da máscara
- [ ] Instalar pdf-lib
- [ ] Passo 1: Puppeteer gera PDF do texto com margin top:45mm, bottom:65mm, sem máscara
- [ ] Passo 2: pdf-lib abre o PDF, lê a imagem da máscara e a desenha em cada página (z-index abaixo do texto)
- [ ] Verificar todas as páginas sem sobreposição

## Phase 52 — Correção Definitiva: Two-Pass PDF + Remoção Borda Diagnóstico (REVERTIDO)

- [x] Abordagem two-pass: Pass 1 (Puppeteer gera PDF de texto com margin top:52mm, bottom:82mm, displayHeaderFooter:true), Pass 2 (sharp + pdftoppm + PDFKit compõe a máscara em cada página)
- [x] Remover borda vermelha de diagnóstico do CSS do Pass 1
- [x] Adicionar suporte a vendedores_adicionais e compradores_adicionais no ContractFields e generateLocacaoBodyHtml
- [x] Todos os 16 testes passando

## Phase 53 — Restaurar Abordagem Original do PDF (headerTemplate/footerTemplate)

- [x] Analisar commit 198cb64: abordagem original usava headerTemplate (3.2cm, background-position: top left) + footerTemplate (5.5cm, background-position: bottom left) com margens top:4.2cm, bottom:6.5cm
- [x] Reverter generateContractPdf para abordagem de uma única passagem (sem two-pass, sem sharp/pdftoppm/PDFKit)
- [x] Remover importações desnecessárias (spawn, readdirSync, unlinkSync, rmdirSync, sharp, PDFDocument)
- [x] Verificado visualmente: 4 páginas com cabeçalho e rodapé Marcello & Oliveira corretos, sem texto invadindo as faixas escuras
- [x] 16 testes passando

## Phase 54 — Máscara via position:fixed no HTML (sem headerTemplate/footerTemplate)

- [x] Tentativa position:fixed descartada (não funciona em PDF multipagina no Chromium)
- [x] Abordagem final: headerTemplate/footerTemplate com imagem real da máscara, background-size:21cm 29.7cm
- [x] height do headerTemplate = margin.top = 3.6cm; height do footerTemplate = margin.bottom = 5.6cm
- [x] background-position: top left (header) e bottom left (footer)
- [x] Verificado visualmente: páginas 1, 2 e 3 sem texto invadindo cabeçalho ou rodapé
- [x] 16 testes passando

## Phase 55 — Ajuste de Margens: Texto para a 7cm da Base e 4cm do Topo

- [x] Aumentar bottom para 8.5cm e top para 4.5cm (heights dos templates iguais)
- [x] Gerar PDF de teste com contrato longo (4 páginas) e verificar visualmente
- [x] Confirmado: nenhum texto invade as faixas escuras em nenhuma página

## Phase 56 — Diagnóstico e Correção do HTML de Fallback

- [x] Diagnosticado: Puppeteer falha em produção → fallback usa generateContractHtml com window.print() automático
- [x] Analisada a máscara pixel-a-pixel: cabeçalho escuro termina em 2.74cm, rodapé escuro começa em 24.67cm (5.03cm do rodapé)
- [x] Corrigido generateContractHtml: @page { margin: 0 } + padding: 3.3cm 2.2cm 5.6cm 2.2cm no .page-content
- [x] Ajustado generateContractPdf: margens top:3.3cm, bottom:5.6cm, heights dos templates iguais
- [x] Verificado visualmente: páginas 1, 2 e 3 sem texto invadindo faixas escuras
- [x] 16 testes passando

## Phase 57 — Puppeteer em Produção (sem fallback HTML)

- [ ] Investigar por que o Puppeteer falha em produção (erro exato nos logs)
- [ ] Corrigir o Puppeteer para funcionar em produção (Chromium bundled ou executablePath correto)
- [ ] Remover o fallback HTML (window.print()) — Puppeteer deve ser o único caminho
- [ ] Testar geração do PDF em produção e verificar visualmente

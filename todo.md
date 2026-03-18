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
- [ ] Deal detail page with full document checklist
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

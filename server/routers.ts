import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";
import {
  getDb,
  getClients, getClientById, createClient, updateClient,
  getProperties, createProperty,
  getDeals, getDealById, createDeal, updateDeal, deleteDeal, getDashboardStats,
  getDocuments, getDocumentById, createDocument, updateDocument, deleteDocument,
  getContracts, getContractById, getContractByDealId, createContract, updateContract, deleteContract,
  getActivities, createActivity,
} from "./db";
import { nanoid } from "nanoid";
import * as XLSX from "xlsx";
import { generateContractPdf, generateContractHtml, type ContractFields } from "./contractGenerator";

// ─── Contract template ───────────────────────────────────────────────────────
const CONTRACT_TEMPLATE = `CONTRATO PADRÃO DE PROMESSA DE COMPRA E VENDA DE IMÓVEL

1. IDENTIFICAÇÃO DAS PARTES

VENDEDOR: {{nome_vendedor}}, {{nacionalidade_vendedor}}, {{estado_civil_vendedor}}, {{profissao_vendedor}}, portador(a) do {{tipo_documento_vendedor}} nº {{numero_documento_vendedor}}, inscrito(a) no CPF/CNPJ sob nº {{cpf_cnpj_vendedor}}, residente e domiciliado(a) em {{endereco_vendedor}}, doravante denominado(a) VENDEDOR.

COMPRADOR(ES): {{nome_comprador}}, {{nacionalidade_comprador}}, {{estado_civil_comprador}}, {{profissao_comprador}}, portador(a) do {{tipo_documento_comprador}} nº {{numero_documento_comprador}}, inscrito(a) no CPF/CNPJ sob nº {{cpf_cnpj_comprador}}, residente e domiciliado(a) em {{endereco_comprador}}, doravante denominado(a) COMPRADOR(ES).

INTERMEDIADORA: {{razao_social_imobiliaria}}, inscrita no CNPJ sob nº {{cnpj_imobiliaria}}, CRECI nº {{creci_imobiliaria}}, com endereço comercial em {{endereco_imobiliaria}}, doravante denominada INTERMEDIADORA.

2. OBJETO DO CONTRATO

O presente contrato tem por objeto a promessa de compra e venda do imóvel de propriedade do VENDEDOR ao(s) COMPRADOR(ES).

3. DESCRIÇÃO DO IMÓVEL

{{descricao_imovel}}
Matrícula nº {{matricula_imovel}} – {{cartorio_registro_imoveis}}.

Permanecerão no imóvel: {{itens_que_permanecerao_no_imovel}}

4. VALOR TOTAL E MODALIDADE DE PAGAMENTO

O valor total ajustado é de {{valor_total_contrato}}.
Modalidade de pagamento: {{modalidade_pagamento}}

5. PAGAMENTO À VISTA (SE APLICÁVEL)

Valor à vista: {{valor_pagamento_avista}}, por meio de {{forma_pagamento_avista}}, até {{data_pagamento_avista}}.

6. PAGAMENTO POR FINANCIAMENTO (SE APLICÁVEL)

Valor financiado: {{valor_financiamento}}, junto à {{instituicao_financeira}}.

7. PAGAMENTO MEDIANTE PERMUTA (SE APLICÁVEL)

Imóvel permutado: {{descricao_imovel_permuta}}
Valor atribuído: {{valor_imovel_permuta}}
{{ajuste_financeiro_permuta}}

8. POSSE E IMISSÃO NA POSSE

A posse será transmitida no prazo de {{prazo_entrega_posse}}, contados de {{condicao_entrega_posse}}.

9. ESCRITURA E REGISTRO

A escritura definitiva será outorgada no prazo de {{prazo_escritura}}, junto ao {{cartorio_registro_imoveis}}.

10. TRIBUTOS E DESPESAS

Correrão por conta de {{responsavel_despesas}}.

11. CERTIDÕES E DOCUMENTOS

Certidões dos últimos {{quantidade_exercicios_iptu}} exercícios de IPTU.
Certidões positivas com Certidão de Objeto e Pé no prazo de {{prazo_certidao_objeto_pe}}.
Valores pagos serão devolvidos em até {{prazo_restituicao_valores}}.

12. COMISSÃO DE CORRETAGEM

Comissão: {{valor_comissao}} ({{percentual_comissao}}).

13. MULTAS E PENALIDADES

Multa de {{percentual_multa}} pelo descumprimento contratual.

14. RESCISÃO / DISTRATO

{{condicoes_distrato}}

15. PROTEÇÃO DE DADOS (LGPD)

Os dados pessoais serão tratados nos termos da Lei nº 13.709/2018.

16. ASSINATURA ELETRÔNICA

Este contrato poderá ser assinado pela plataforma {{plataforma_assinatura}}.

17. FORO

Fica eleito o foro da Comarca de {{foro_eleito}}.

{{cidade_assinatura}}, {{data_assinatura}}

VENDEDOR: {{assinatura_vendedor}}
COMPRADOR(ES): {{assinatura_comprador}}
INTERMEDIADORA: {{assinatura_imobiliaria}}

TESTEMUNHAS:
1. {{nome_testemunha_1}} – {{cpf_testemunha_1}}
2. {{nome_testemunha_2}} – {{cpf_testemunha_2}}`;

function fillTemplate(template: string, fields: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(fields)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `[${key}]`);
  }
  return result;
}

// ─── Seed data for demo ──────────────────────────────────────────────────────
const DEMO_DEALS = [
  { code: 'VND-031', type: 'venda' as const, subtype: 'À vista', status: 'contrato_gerado' as const, totalValue: '485000', buyer: 'Carlos Andrade', broker: 'Marcello', property: 'Rua das Palmeiras, 340', docsCompleted: 7, docsTotal: 7, progressPct: 85 },
  { code: 'LOC-047', type: 'locacao' as const, subtype: 'Seguradora', status: 'em_andamento' as const, monthlyValue: '2800', buyer: 'Fernanda Lima', broker: 'Oliveira', property: 'Av. Brasil, 1.200 – apto 82', docsCompleted: 4, docsTotal: 7, progressPct: 45 },
  { code: 'VND-028', type: 'venda' as const, subtype: 'Financiamento', status: 'em_andamento' as const, totalValue: '320000', buyer: 'Roberto Souza', broker: 'Marcello', property: 'Qd. 12 Lt. 07 – Setor Sul', docsCompleted: 5, docsTotal: 8, progressPct: 60 },
  { code: 'PRM-005', type: 'permuta' as const, subtype: 'Combinado', status: 'em_andamento' as const, totalValue: '610000', buyer: 'Ana Ferreira', broker: 'Oliveira', property: 'Rua Ipê, 220 ↔ Rua Cedro, 45', docsCompleted: 3, docsTotal: 10, progressPct: 30 },
  { code: 'LOC-044', type: 'locacao' as const, subtype: 'Fiador', status: 'assinatura' as const, monthlyValue: '1900', buyer: 'Paulo Menezes', broker: 'Marcello', property: 'Res. Solar, apto 15', docsCompleted: 6, docsTotal: 6, progressPct: 100 },
  { code: 'VND-025', type: 'venda' as const, subtype: 'Fin. CEF', status: 'concluido' as const, totalValue: '275000', buyer: 'Lucia Campos', broker: 'Oliveira', property: 'Jd. América, 890', docsCompleted: 8, docsTotal: 8, progressPct: 100 },
  { code: 'VND-033', type: 'venda' as const, subtype: 'À vista', status: 'rascunho' as const, totalValue: '390000', buyer: 'Miguel Torres', broker: 'Marcello', property: 'Cond. Vista Verde, cs 7', docsCompleted: 1, docsTotal: 7, progressPct: 10 },
  { code: 'LOC-040', type: 'locacao' as const, subtype: 'Direto', status: 'concluido' as const, monthlyValue: '1500', buyer: 'Bruno Lima', broker: 'Oliveira', property: 'Rua Cedro, 220', docsCompleted: 7, docsTotal: 7, progressPct: 100 },
];

const DEMO_ACTIVITIES = [
  { type: 'contract', title: 'Contrato gerado para Carlos Andrade', description: 'VND-031 · Rua das Palmeiras', minutesAgo: 2 },
  { type: 'ocr', title: 'OCR concluído: RG Fernanda Lima', description: 'LOC-047 · 98.7% precisão', minutesAgo: 18 },
  { type: 'warning', title: 'Matrícula com baixa resolução', description: 'LOC-047 · requer novo upload', minutesAgo: 35 },
  { type: 'deal', title: 'Novo negócio cadastrado: VND-033', description: 'Cond. Vista Verde · Miguel Torres', minutesAgo: 120 },
  { type: 'sign', title: 'Contrato enviado ao Clicksign', description: 'LOC-044 · Paulo Menezes', minutesAgo: 300 },
  { type: 'ocr', title: 'OCR: IPTU 2024 processado', description: 'VND-028 · Roberto Souza', minutesAgo: 420 },
];

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      try {
        const stats = await getDashboardStats(ctx.user.id);
        return stats;
      } catch {
        return { activeDeals: 0, totalContracts: 0, totalVolume: 0, pendingDocs: 0 };
      }
    }),
    deals: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await getDeals(ctx.user.id);
      } catch {
        return [];
      }
    }),
    activities: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await getActivities(ctx.user.id, 8);
      } catch {
        return [];
      }
    }),
  }),

  // ─── Deals ─────────────────────────────────────────────────────────────────
  deals: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await getDeals(ctx.user.id);
      } catch {
        return [];
      }
    }),
    byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return getDealById(input.id);
    }),
    create: protectedProcedure.input(z.object({
      type: z.enum(['venda', 'locacao', 'permuta', 'financiamento']),
      subtype: z.string().optional(),
      totalValue: z.string().optional(),
      monthlyValue: z.string().optional(),
      paymentModality: z.string().optional(),
      notes: z.string().optional(),
      propertyDescription: z.string().optional(),
      buyerName: z.string().optional(),
      buyerId: z.number().optional(),
      sellerId: z.number().optional(),
      brokerId: z.number().optional(),
      propertyId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const prefix = input.type === 'venda' ? 'VND' : input.type === 'locacao' ? 'LOC' : input.type === 'permuta' ? 'PRM' : 'FIN';
      const code = `${prefix}-${nanoid(6).toUpperCase()}`;
      const result = await createDeal({
        userId: ctx.user.id,
        code,
        type: input.type,
        subtype: input.subtype,
        totalValue: input.totalValue as any,
        monthlyValue: input.monthlyValue as any,
        paymentModality: input.paymentModality,
        notes: input.notes,
        status: 'rascunho',
        buyerId: input.buyerId,
        sellerId: input.sellerId,
        brokerId: input.brokerId,
        propertyId: input.propertyId,
      });
      await createActivity({ userId: ctx.user.id, type: 'deal', title: `Novo negócio cadastrado: ${code}`, description: input.propertyDescription });
      await notifyOwner({ title: `Novo negócio: ${code}`, content: `Tipo: ${input.type}, Valor: ${input.totalValue || input.monthlyValue || 'N/A'}` });
      return { code, result };
    }),
    updateStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(['rascunho', 'em_andamento', 'contrato_gerado', 'assinatura', 'concluido']),
    })).mutation(async ({ ctx, input }) => {
      await updateDeal(input.id, { status: input.status });
      await createActivity({ userId: ctx.user.id, dealId: input.id, type: 'status', title: `Status atualizado para ${input.status}` });
      return { success: true };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      type: z.enum(['venda', 'locacao', 'permuta', 'financiamento']).optional(),
      subtype: z.string().optional(),
      status: z.enum(['rascunho', 'em_andamento', 'contrato_gerado', 'assinatura', 'concluido']).optional(),
      totalValue: z.string().optional(),
      monthlyValue: z.string().optional(),
      paymentModality: z.string().optional(),
      notes: z.string().optional(),
      buyerId: z.number().nullable().optional(),
      sellerId: z.number().nullable().optional(),
      brokerId: z.number().nullable().optional(),
      propertyId: z.number().nullable().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const existing = await getDealById(id);
      if (!existing || existing.userId !== ctx.user.id) throw new TRPCError({ code: 'NOT_FOUND' });
      await updateDeal(id, data as any);
      await createActivity({ userId: ctx.user.id, dealId: id, type: 'status', title: `Negócio ${existing.code} atualizado` });
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const existing = await getDealById(input.id);
      if (!existing || existing.userId !== ctx.user.id) throw new TRPCError({ code: 'NOT_FOUND' });
      await deleteDeal(input.id);
      return { success: true };
    }),
    linkClient: protectedProcedure.input(z.object({
      dealId: z.number(),
      clientId: z.number(),
      role: z.enum(['buyer', 'seller', 'broker']),
    })).mutation(async ({ input }) => {
      const field = input.role === 'buyer' ? { buyerId: input.clientId } : input.role === 'seller' ? { sellerId: input.clientId } : { brokerId: input.clientId };
      await updateDeal(input.dealId, field);
      return { success: true };
    }),
  }),

  // ─── Clients ───────────────────────────────────────────────────────────────
  clients: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getClients(ctx.user.id);
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const client = await getClientById(input.id);
      if (!client || client.userId !== ctx.user.id) throw new Error('Cliente n\u00e3o encontrado');
      // Fetch linked documents and deals
      const db = await import('./db').then(m => m.getDb ? m.getDb() : null);
      const clientDocs = await import('./db').then(m => m.getDocuments(ctx.user.id)).then(docs => docs.filter((d: any) => d.clientId === input.id));
      const clientDeals = await import('./db').then(m => m.getDeals(ctx.user.id)).then(ds => ds.filter((d: any) => d.buyerId === input.id || d.sellerId === input.id || d.brokerId === input.id));
      return { ...client, documents: clientDocs, deals: clientDeals };
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(2),
      cpfCnpj: z.string().optional(),
      rg: z.string().optional(),
      email: z.string().email().optional().or(z.literal('')),
      phone: z.string().optional(),
      address: z.string().optional(),
      birthDate: z.string().optional(),
      maritalStatus: z.string().optional(),
      nationality: z.string().optional(),
      profession: z.string().optional(),
      motherName: z.string().optional(),
      fatherName: z.string().optional(),
      clientRole: z.enum(['comprador', 'vendedor', 'locador', 'locatario', 'fiador', 'corretor']).optional(),
      whatsapp: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const result = await createClient({ ...input, userId: ctx.user.id });
      return { id: result.insertId, success: true };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().optional(),
        cpfCnpj: z.string().optional(),
        rg: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        birthDate: z.string().optional(),
        maritalStatus: z.string().optional(),
        nationality: z.string().optional(),
        profession: z.string().optional(),
        motherName: z.string().optional(),
        fatherName: z.string().optional(),
        clientRole: z.enum(['comprador', 'vendedor', 'locador', 'locatario', 'fiador', 'corretor']).optional(),
        whatsapp: z.string().optional(),
      }),
    })).mutation(async ({ input }) => {
      return updateClient(input.id, input.data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      const { clients: clientsTable } = await import('../drizzle/schema');
      const { eq, and } = await import('drizzle-orm');
      await db.delete(clientsTable).where(and(eq(clientsTable.id, input.id), eq(clientsTable.userId, ctx.user.id)));
      return { success: true };
    }),
    uploadDocument: protectedProcedure.input(z.object({
      clientId: z.number(),
      name: z.string(),
      docType: z.enum(['rg', 'cpf', 'cnh', 'comprovante_residencia', 'matricula', 'iptu', 'certidao', 'contrato', 'outro']),
      fileBase64: z.string(),
      mimeType: z.string(),
      fileSize: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const { storagePut } = await import('./storage');
      const buf = Buffer.from(input.fileBase64, 'base64');
      const ext = input.mimeType.split('/')[1] || 'bin';
      const key = `client-docs/${ctx.user.id}/${input.clientId}/${Date.now()}-${input.docType}.${ext}`;
      const { url } = await storagePut(key, buf, input.mimeType);
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      const { documents: docsTable } = await import('../drizzle/schema');
      const result = await db.insert(docsTable).values({
        userId: ctx.user.id,
        clientId: input.clientId,
        name: input.name,
        docType: input.docType,
        fileUrl: url,
        fileKey: key,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        ocrStatus: 'pending',
        docStatus: 'pendente',
      });
      return { id: (result as any).insertId, url, success: true };
    }),
    getDocuments: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const { documents: docsTable } = await import('../drizzle/schema');
      const { eq, and } = await import('drizzle-orm');
      return db.select().from(docsTable).where(and(eq(docsTable.clientId, input.clientId), eq(docsTable.userId, ctx.user.id)));
    }),
  }),

  // ─── Documents ─────────────────────────────────────────────────────────────
  documents: router({
    list: protectedProcedure.input(z.object({ dealId: z.number().optional() })).query(async ({ ctx, input }) => {
      return getDocuments(ctx.user.id, input.dealId);
    }),
    upload: protectedProcedure.input(z.object({
      name: z.string(),
      docType: z.enum(['rg', 'cpf', 'cnh', 'comprovante_residencia', 'matricula', 'iptu', 'certidao', 'contrato', 'outro']),
      fileBase64: z.string(),
      mimeType: z.string(),
      fileSize: z.number(),
      dealId: z.number().optional(),
      clientId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      // Upload to S3
      const fileBuffer = Buffer.from(input.fileBase64, 'base64');
      const fileKey = `documents/${ctx.user.id}/${nanoid()}-${input.name}`;
      const { url: fileUrl } = await storagePut(fileKey, fileBuffer, input.mimeType);

      // Create document record
      const result = await createDocument({
        userId: ctx.user.id,
        dealId: input.dealId,
        clientId: input.clientId,
        name: input.name,
        docType: input.docType,
        fileUrl,
        fileKey,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        ocrStatus: 'pending',
        docStatus: 'pendente',
      });

      const documentId = (result as any).insertId as number;
      await createActivity({ userId: ctx.user.id, dealId: input.dealId, type: 'upload', title: `Documento enviado: ${input.name}` });
      await notifyOwner({ title: 'Novo documento enviado', content: `${input.name} (${input.docType}) para negócio ${input.dealId || 'N/A'}` });
      return { fileUrl, fileKey, documentId };
    }),
    processOcr: protectedProcedure.input(z.object({
      documentId: z.number(),
      fileUrl: z.string(),
      docType: z.string(),
    })).mutation(async ({ ctx, input }) => {
      // Mark as processing
      await updateDocument(input.documentId, { ocrStatus: 'processing' });

      try {
        // Use LLM with image to extract document data
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: `Você é um sistema especializado em OCR de documentos brasileiros. 
Analise a imagem do documento e extraia os dados estruturados.
Retorne APENAS um JSON válido com os campos encontrados.
Para documentos de identidade (RG, CNH, CPF), extraia: nome, cpf, rg, data_nascimento, nome_mae, nome_pai, orgao_emissor, categoria_cnh (se CNH).
Para comprovante de residência: nome, endereco, cidade, estado, cep.
Para matrícula de imóvel: descricao_imovel, matricula, cartorio.
Nunca use o nome do arquivo como nome da pessoa.
Retorne confidence (0-100) indicando a qualidade da extração.`,
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: `Extraia os dados deste documento do tipo: ${input.docType}` },
                { type: 'image_url', image_url: { url: input.fileUrl, detail: 'high' } },
              ],
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'ocr_result',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  nome: { type: 'string' },
                  cpf: { type: 'string' },
                  rg: { type: 'string' },
                  data_nascimento: { type: 'string' },
                  nome_mae: { type: 'string' },
                  nome_pai: { type: 'string' },
                  orgao_emissor: { type: 'string' },
                  categoria_cnh: { type: 'string' },
                  endereco: { type: 'string' },
                  cidade: { type: 'string' },
                  estado: { type: 'string' },
                  cep: { type: 'string' },
                  descricao_imovel: { type: 'string' },
                  matricula: { type: 'string' },
                  cartorio: { type: 'string' },
                  tipo_documento: { type: 'string' },
                  confidence: { type: 'number' },
                },
                required: ['confidence', 'tipo_documento'],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        const ocrFields = typeof content === 'string' ? JSON.parse(content) : content;
        const confidence = ocrFields.confidence || 75;

        await updateDocument(input.documentId, {
          ocrStatus: 'done',
          ocrFields,
          ocrConfidence: confidence,
          ocrText: JSON.stringify(ocrFields),
          docStatus: confidence >= 75 ? 'extraido' : 'pendente',
        });

        await createActivity({
          userId: ctx.user.id,
          type: 'ocr',
          title: `OCR concluído: ${ocrFields.tipo_documento || input.docType}`,
          description: `${confidence}% precisão`,
        });

         return { success: true, fields: ocrFields, confidence };
      } catch (error) {
        await updateDocument(input.documentId, { ocrStatus: 'failed' });
        throw error;
      }
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const doc = await getDocumentById(input.id);
      if (!doc || doc.userId !== ctx.user.id) throw new Error('Documento não encontrado');
      return doc;
    }),
    updateOcrFields: protectedProcedure.input(z.object({
      id: z.number(),
      ocrFields: z.record(z.string(), z.string()),
      docType: z.string().optional(),
      clientId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const doc = await getDocumentById(input.id);
      if (!doc || doc.userId !== ctx.user.id) throw new Error('Documento não encontrado');
      const updates: Record<string, unknown> = { ocrFields: JSON.stringify(input.ocrFields) };
      if (input.docType) updates.docType = input.docType;
      if (input.clientId !== undefined) updates.clientId = input.clientId;
      await updateDocument(input.id, updates as any);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const doc = await getDocumentById(input.id);
      if (!doc || doc.userId !== ctx.user.id) throw new Error('Documento não encontrado');
      await deleteDocument(input.id);
      return { success: true };
    }),
    // Inline OCR: accepts base64 directly, uploads to S3, runs OCR, returns extracted fields
    // Used in modals where there is no pre-existing documentId (e.g., Novo Cliente)
    ocrInline: protectedProcedure.input(z.object({
      fileBase64: z.string(),
      mimeType: z.string(),
      fileName: z.string(),
      docType: z.string(),
    })).mutation(async ({ ctx, input }) => {
      // Upload to S3
      const fileBuffer = Buffer.from(input.fileBase64, 'base64');
      const fileKey = `documents/${ctx.user.id}/inline-${nanoid()}-${input.fileName}`;
      const { url: fileUrl } = await storagePut(fileKey, fileBuffer, input.mimeType);
      // For PDFs use file_url so LLM reads all pages; for images use image_url
      const isPdf = input.mimeType === 'application/pdf';
      const docContent: any = isPdf
        ? { type: 'file_url', file_url: { url: fileUrl, mime_type: 'application/pdf' } }
        : { type: 'image_url', image_url: { url: fileUrl, detail: 'high' } };
      // Run OCR via LLM
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
content: input.docType === 'matricula'
              ? `Você é um extrator especializado em matrículas imobiliárias brasileiras.

Analise o documento e retorne APENAS um objeto JSON válido, sem texto adicional, sem markdown, sem explicações.

Regras:
- Proprietário atual = último nome que recebeu o imóvel por venda, dação ou cessão
- Se um campo não existir no documento, retorne string vazia ""
- area_total = área privativa + área comum quando ambas existirem
- valor = extrair o valor proporcional ao imóvel desta matrícula, não o valor total da operação
- tipo_imovel = inferir pelo contexto (unidade autônoma em condomínio de lotes = Lote)
- Retorne SOMENTE o JSON, sem qualquer texto antes ou depois
- confidence = 0 a 100 indicando qualidade da extração
- tipo_documento = sempre "matricula"`
              : `Você é um sistema especializado em OCR de documentos brasileiros.
Analise o documento e extraia os dados estruturados. Leia TODAS as páginas do documento.
Retorne APENAS um JSON válido com os campos encontrados.
Para documentos de identidade (RG, CNH, CPF): extraia nome, cpf, rg, data_nascimento, nome_mae, nome_pai, orgao_emissor, categoria_cnh (se CNH).
Para CNH: também extraia profissao (campo "Categoria" ou profissão declarada), estado_civil se visível.
Para RG: extraia profissao se constar no documento, estado_civil se visível, endereco se constar no verso.
Para comprovante de residência: nome, endereco, cidade, estado, cep.
Se o documento tiver endereço no verso, inclua no campo endereco.
Nunca use o nome do arquivo como nome da pessoa.
IMPORTANTE: Nunca retorne null para nenhum campo. Se um campo não for encontrado, retorne string vazia "".
Retorne confidence (0-100) indicando a qualidade da extração.`,
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: `Extraia os dados deste documento do tipo: ${input.docType}. ${isPdf ? 'Este é um PDF — leia todas as páginas.' : ''}` },
              docContent,
            ],
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'ocr_result',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                nome: { type: 'string' },
                cpf: { type: 'string' },
                rg: { type: 'string' },
                data_nascimento: { type: 'string' },
                nome_mae: { type: 'string' },
                nome_pai: { type: 'string' },
                orgao_emissor: { type: 'string' },
                categoria_cnh: { type: 'string' },
                estado_civil: { type: 'string' },
                profissao: { type: 'string' },
                endereco: { type: 'string' },
                cidade: { type: 'string' },
                estado: { type: 'string' },
                cep: { type: 'string' },
                descricao_imovel: { type: 'string' },
                matricula: { type: 'string' },
                cartorio: { type: 'string' },
                endereco_imovel: { type: 'string' },
                bairro: { type: 'string' },
                cidade_imovel: { type: 'string' },
                estado_imovel: { type: 'string' },
                cep_imovel: { type: 'string' },
                area_total: { type: 'string' },
                area_privativa: { type: 'string' },
                area_comum: { type: 'string' },
                tipo_imovel: { type: 'string' },
                valor: { type: 'string' },
                proprietario_atual: { type: 'string' },
                cnpj_cpf_proprietario: { type: 'string' },
                data_ultimo_registro: { type: 'string' },
                numero_registro: { type: 'string' },
                situacao_imovel: { type: 'string' },
                tipo_documento: { type: 'string' },
                confidence: { type: 'number' },
              },
              required: ['confidence', 'tipo_documento'],
              additionalProperties: false,
            },
          },
        },
      });
      const content = response.choices[0]?.message?.content;
      const ocrFields = typeof content === 'string' ? JSON.parse(content) : content;
      // Sanitize: replace null/undefined values with empty strings
      const sanitized: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(ocrFields as Record<string, unknown>)) {
        sanitized[k] = v === null || v === undefined ? '' : v;
      }
      return { success: true, fields: sanitized, confidence: (sanitized.confidence as number) || 0, fileUrl };
    }),

    // Full text transcription: returns the complete raw text from the document
    // Used for complex PDFs (e.g., matrícula) where structured extraction may miss data
    ocrFullText: protectedProcedure.input(z.object({
      fileBase64: z.string(),
      mimeType: z.string(),
      fileName: z.string(),
    })).mutation(async ({ ctx, input }) => {
      // Upload to S3
      const fileBuffer = Buffer.from(input.fileBase64, 'base64');
      const fileKey = `documents/${ctx.user.id}/ocr-full-${nanoid()}-${input.fileName}`;
      const { url: fileUrl } = await storagePut(fileKey, fileBuffer, input.mimeType);
      // Run full transcription via LLM (no JSON schema — free text output)
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `Você é um sistema especializado em transcrição de documentos brasileiros.
Sua tarefa é transcrever o conteúdo COMPLETO do documento, preservando toda a estrutura, formatação e informações presentes.
Transcreva TODO o texto visível no documento, incluindo cabeçalhos, rodapés, selos, carimbos, anotações e qualquer outro texto.
Mantenha a estrutura lógica do documento (parágrafos, seções, etc.).
Não omita nenhuma informação. Não faça resumos. Transcreva tudo que estiver visível.
Se o documento tiver múltiplas páginas, transcreva todas elas em sequência.`,
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Transcreva o conteúdo completo deste documento, preservando toda a estrutura e informações:' },
              { type: 'image_url', image_url: { url: fileUrl, detail: 'high' } },
            ],
          },
        ],
      });
      const fullText = response.choices[0]?.message?.content || '';
      return { success: true, fullText, fileUrl };
    }),
  }),
  // ─── Document Groups ────────────────────────────────────────────────────────
  documentGroups: router({
    list: protectedProcedure.input(z.object({ dealId: z.number().optional() })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const { documentGroups, documentGroupItems, documents } = await import('../drizzle/schema');
      const { eq, and } = await import('drizzle-orm');
      const where = input.dealId
        ? and(eq(documentGroups.userId, ctx.user.id), eq(documentGroups.dealId, input.dealId))
        : eq(documentGroups.userId, ctx.user.id);
      const groups = await db.select().from(documentGroups).where(where).orderBy(documentGroups.createdAt);
      // Fetch items for each group
      const result = await Promise.all(groups.map(async (group) => {
        const items = await db.select({
          id: documentGroupItems.id,
          groupId: documentGroupItems.groupId,
          documentId: documentGroupItems.documentId,
          docType: documentGroupItems.docType,
          label: documentGroupItems.label,
          status: documentGroupItems.status,
          ocrFields: documentGroupItems.ocrFields,
          createdAt: documentGroupItems.createdAt,
          fileUrl: documents.fileUrl,
          fileName: documents.name,
          ocrConfidence: documents.ocrConfidence,
        })
        .from(documentGroupItems)
        .leftJoin(documents, eq(documentGroupItems.documentId, documents.id))
        .where(eq(documentGroupItems.groupId, group.id));
        return { ...group, items };
      }));
      return result;
    }),

    create: protectedProcedure.input(z.object({
      dealId: z.number().optional(),
      personName: z.string().min(1),
      personRole: z.enum(['comprador', 'vendedor', 'locador', 'locatario', 'fiador', 'corretor', 'imovel', 'outro']).default('outro'),
      cpf: z.string().optional(),
      notes: z.string().optional(),
      items: z.array(z.object({
        docType: z.enum(['rg', 'cpf', 'cnh', 'comprovante_residencia', 'matricula', 'iptu', 'certidao', 'escritura', 'contrato', 'outro']),
        label: z.string().optional(),
        documentId: z.number().optional(),
        ocrFields: z.record(z.string(), z.unknown()).optional(),
      })).default([]),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      const { documentGroups, documentGroupItems } = await import('../drizzle/schema');
      const [result] = await db.insert(documentGroups).values({
        userId: ctx.user.id,
        dealId: input.dealId,
        personName: input.personName,
        personRole: input.personRole,
        cpf: input.cpf,
        notes: input.notes,
      });
      const groupId = (result as any).insertId as number;
      // Insert items
      if (input.items.length > 0) {
        await db.insert(documentGroupItems).values(
          input.items.map(item => ({
            groupId,
            documentId: item.documentId,
            docType: item.docType,
            label: item.label || item.docType,
            status: item.documentId ? 'enviado' as const : 'pendente' as const,
            ocrFields: item.ocrFields as any,
          }))
        );
      }
      await createActivity({ userId: ctx.user.id, dealId: input.dealId, type: 'group', title: `Grupo criado: ${input.personName}` });
      return { groupId };
    }),

    addItem: protectedProcedure.input(z.object({
      groupId: z.number(),
      docType: z.enum(['rg', 'cpf', 'cnh', 'comprovante_residencia', 'matricula', 'iptu', 'certidao', 'escritura', 'contrato', 'outro']),
      label: z.string().optional(),
      documentId: z.number().optional(),
      ocrFields: z.record(z.string(), z.unknown()).optional(),
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      const { documentGroupItems } = await import('../drizzle/schema');
      await db.insert(documentGroupItems).values({
        groupId: input.groupId,
        documentId: input.documentId,
        docType: input.docType,
        label: input.label || input.docType,
        status: input.documentId ? 'enviado' : 'pendente',
        ocrFields: input.ocrFields as any,
      });
      return { success: true };
    }),

    updateItemStatus: protectedProcedure.input(z.object({
      itemId: z.number(),
      status: z.enum(['pendente', 'enviado', 'validado', 'rejeitado']),
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      const { documentGroupItems } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      await db.update(documentGroupItems).set({ status: input.status }).where(eq(documentGroupItems.id, input.itemId));
      return { success: true };
    }),

    autoGroupFromOcr: protectedProcedure.input(z.object({
      documentId: z.number(),
      dealId: z.number().optional(),
      ocrFields: z.record(z.string(), z.unknown()),
      docType: z.enum(['rg', 'cpf', 'cnh', 'comprovante_residencia', 'matricula', 'iptu', 'certidao', 'escritura', 'contrato', 'outro']),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      const { documentGroups, documentGroupItems } = await import('../drizzle/schema');
      const { eq, and } = await import('drizzle-orm');
      // Extract person name from OCR fields
      const fields = input.ocrFields as Record<string, string>;
      const personName = fields.nome || 'Pessoa desconhecida';
      const cpf = fields.cpf || undefined;
      // Try to find existing group with same name or CPF for this deal
      const existingGroups = await db.select().from(documentGroups)
        .where(and(eq(documentGroups.userId, ctx.user.id), input.dealId ? eq(documentGroups.dealId, input.dealId) : eq(documentGroups.userId, ctx.user.id)))
        .limit(20);
      let groupId: number;
      const matchingGroup = existingGroups.find(g =>
        (cpf && g.cpf === cpf) ||
        g.personName.toLowerCase() === personName.toLowerCase()
      );
      if (matchingGroup) {
        groupId = matchingGroup.id;
      } else {
        const [result] = await db.insert(documentGroups).values({
          userId: ctx.user.id,
          dealId: input.dealId,
          personName,
          cpf,
          personRole: 'outro',
        });
        groupId = (result as any).insertId as number;
      }
      // Add item to group
      await db.insert(documentGroupItems).values({
        groupId,
        documentId: input.documentId,
        docType: input.docType,
        label: input.docType,
        status: 'enviado',
        ocrFields: input.ocrFields as any,
      });
      return { groupId, personName, isNew: !matchingGroup };
    }),
  }),

  // ─── Contracts ─────────────────────────────────────────────────────────────
  contracts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getContracts(ctx.user.id);
    }),
    byDeal: protectedProcedure.input(z.object({ dealId: z.number() })).query(async ({ input }) => {
      return getContractByDealId(input.dealId);
    }),
    save: protectedProcedure.input(z.object({
      dealId: z.number().optional(),
      nomeVendedor: z.string().optional(),
      nacionalidadeVendedor: z.string().optional(),
      estadoCivilVendedor: z.string().optional(),
      profissaoVendedor: z.string().optional(),
      tipoDocumentoVendedor: z.string().optional(),
      numeroDocumentoVendedor: z.string().optional(),
      cpfCnpjVendedor: z.string().optional(),
      enderecoVendedor: z.string().optional(),
      nomeComprador: z.string().optional(),
      nacionalidadeComprador: z.string().optional(),
      estadoCivilComprador: z.string().optional(),
      profissaoComprador: z.string().optional(),
      tipoDocumentoComprador: z.string().optional(),
      numeroDocumentoComprador: z.string().optional(),
      cpfCnpjComprador: z.string().optional(),
      enderecoComprador: z.string().optional(),
      descricaoImovel: z.string().optional(),
      matriculaImovel: z.string().optional(),
      cartorioRegistroImoveis: z.string().optional(),
      itensImovel: z.string().optional(),
      valorTotalContrato: z.string().optional(),
      modalidadePagamento: z.string().optional(),
      valorPagamentoAvista: z.string().optional(),
      formaPagamentoAvista: z.string().optional(),
      dataPagamentoAvista: z.string().optional(),
      valorFinanciamento: z.string().optional(),
      instituicaoFinanceira: z.string().optional(),
      descricaoImovelPermuta: z.string().optional(),
      valorImovelPermuta: z.string().optional(),
      ajusteFinanceiroPermuta: z.string().optional(),
      prazoEntregaPosse: z.string().optional(),
      condicaoEntregaPosse: z.string().optional(),
      prazoEscritura: z.string().optional(),
      responsavelDespesas: z.string().optional(),
      quantidadeExerciciosIptu: z.string().optional(),
      prazoCertidaoObjetoPe: z.string().optional(),
      prazoRestituicaoValores: z.string().optional(),
      percentualComissao: z.string().optional(),
      valorComissao: z.string().optional(),
      percentualMulta: z.string().optional(),
      condicoesDistrato: z.string().optional(),
      plataformaAssinatura: z.string().optional(),
      razaoSocialImobiliaria: z.string().optional(),
      cnpjImobiliaria: z.string().optional(),
      creciImobiliaria: z.string().optional(),
      enderecoImobiliaria: z.string().optional(),
      foroEleito: z.string().optional(),
      cidadeAssinatura: z.string().optional(),
      dataAssinatura: z.string().optional(),
      nomeTestemunha1: z.string().optional(),
      cpfTestemunha1: z.string().optional(),
      nomeTestemunha2: z.string().optional(),
      cpfTestemunha2: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const code = `CTR-${nanoid(8).toUpperCase()}`;
      const result = await createContract({ ...input, userId: ctx.user.id, code, contractStatus: 'rascunho' });
      return { code, result };
    }),
    generate: protectedProcedure.input(z.object({
      contractId: z.number().optional(),
      fields: z.record(z.string(), z.string()),
    })).mutation(async ({ ctx, input }) => {
       // Generate branded PDF using the official Marcello & Oliveira template + mascara
      const contractFields: ContractFields = { ...input.fields };
      const pdfBuffer = await generateContractPdf(contractFields);
      // Upload branded PDF to S3
      const contractKey = `contracts/${ctx.user.id}/${nanoid()}-contrato.pdf`;
      const { url: contractUrl } = await storagePut(contractKey, pdfBuffer, 'application/pdf');
      if (input.contractId) {
        await updateContract(input.contractId, { pdfUrl: contractUrl, pdfKey: contractKey, contractStatus: 'gerado' });
      } else {
        // Always create a new contract record so it appears in the Contratos list
        const code = `CTR-${nanoid(8).toUpperCase()}`;
        await createContract({
          userId: ctx.user.id,
          code,
          nomeVendedor: input.fields.nome_vendedor || '',
          nomeComprador: input.fields.nome_comprador || '',
          descricaoImovel: input.fields.descricao_imovel || '',
          valorTotalContrato: input.fields.valor_total_contrato || '',
          pdfUrl: contractUrl,
          pdfKey: contractKey,
          contractStatus: 'gerado',
        });
      }
      await createActivity({ userId: ctx.user.id, type: 'contract', title: 'Contrato gerado', description: `Para ${input.fields.nome_vendedor || 'N/A'}` });
      await notifyOwner({ title: 'Contrato gerado', content: `Vendedor: ${input.fields.nome_vendedor || 'N/A'}, Comprador: ${input.fields.nome_comprador || 'N/A'}` });
      return { contractUrl, htmlContent: '', filledText: '' };
    }),
    generateHtml: protectedProcedure.input(z.object({
      fields: z.record(z.string(), z.string()),
    })).mutation(async ({ input }) => {
      const contractFields: ContractFields = { ...input.fields };
      const html = await generateContractHtml(contractFields);
      return { html };
    }),
    suggestFields: protectedProcedure.input(z.object({
      partialFields: z.record(z.string(), z.string()),
      context: z.string().optional(),
    })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `Você é um assistente jurídico especializado em contratos imobiliários brasileiros.
Analise os campos parcialmente preenchidos e sugira valores para os campos faltantes.
Use valores padrão razoáveis para o mercado imobiliário de Jundiaí-SP.
Retorne um JSON com sugestões para campos vazios ou incompletos.`,
          },
          {
            role: 'user',
            content: `Campos atuais: ${JSON.stringify(input.partialFields)}\nContexto: ${input.context || 'Contrato de compra e venda'}`,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'field_suggestions',
            strict: false,
            schema: {
              type: 'object',
              properties: {
                suggestions: { type: 'object' },
                warnings: { type: 'array', items: { type: 'string' } },
                summary: { type: 'string' },
              },
              required: ['suggestions', 'warnings', 'summary'],
              additionalProperties: false,
            },
          },
        },
      });
      const content = response.choices[0]?.message?.content;
      return typeof content === 'string' ? JSON.parse(content) : content;
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return getContractById(input.id, ctx.user.id);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      contractStatus: z.enum(['rascunho', 'gerado', 'enviado', 'assinado']).optional(),
      nomeVendedor: z.string().optional(),
      nomeComprador: z.string().optional(),
      descricaoImovel: z.string().optional(),
      valorTotalContrato: z.string().optional(),
      cidadeAssinatura: z.string().optional(),
      dataAssinatura: z.string().optional(),
      nomeTestemunha1: z.string().optional(),
      cpfTestemunha1: z.string().optional(),
      nomeTestemunha2: z.string().optional(),
      cpfTestemunha2: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const existing = await getContractById(id, ctx.user.id);
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' });
      await updateContract(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const existing = await getContractById(input.id, ctx.user.id);
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' });
      await deleteContract(input.id, ctx.user.id);
      return { success: true };
    }),
    create: protectedProcedure.input(z.object({
      descricaoImovel: z.string().optional(),
      nomeVendedor: z.string().optional(),
      nomeComprador: z.string().optional(),
      nomeCorretor: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const code = `CTR-${new Date().getFullYear()}-${nanoid(4).toUpperCase()}`;
      await createContract({ ...input, userId: ctx.user.id, code, contractStatus: 'rascunho' as const });
      await createActivity({ userId: ctx.user.id, type: 'contract', title: `Novo contrato criado: ${code}`, description: input.descricaoImovel || '' });
      return { code };
    }),
  }),
  // ─── Properties ─────────────────────────────────────────────────────────────
  properties: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getProperties(ctx.user.id);
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      const { properties: propsTable } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const rows = await db.select().from(propsTable).where(eq(propsTable.id, input.id)).limit(1);
      return rows[0] ?? null;
    }),
    create: protectedProcedure.input(z.object({
      description: z.string().optional(),
      propertyType: z.string().optional(),
      street: z.string().optional(),
      number: z.string().optional(),
      complement: z.string().optional(),
      neighborhood: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      registration: z.string().optional(),
      registryOffice: z.string().optional(),
      area: z.string().optional(),
      totalValue: z.string().optional(),
      items: z.string().optional(),
      propertyStatus: z.enum(['disponivel', 'vendido', 'alugado', 'em_negociacao']).optional(),
      matriculaDocBase64: z.string().optional(),
      matriculaDocMime: z.string().optional(),
      matriculaDocFileName: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { matriculaDocBase64, matriculaDocMime, matriculaDocFileName, ...propertyData } = input;
      const property = await createProperty({ ...propertyData, userId: ctx.user.id });
      // If a matrícula file was provided, upload to S3 and save URL
      if (matriculaDocBase64 && matriculaDocMime && property?.id) {
        try {
          const { storagePut } = await import('./storage');
          const buf = Buffer.from(matriculaDocBase64, 'base64');
          const ext = matriculaDocMime.split('/')[1] || 'bin';
          const key = `property-docs/${ctx.user.id}/${property.id}/matricula-${Date.now()}.${ext}`;
          const { url } = await storagePut(key, buf, matriculaDocMime);
          const db = await getDb();
          if (db) {
            const { properties: propsTable } = await import('../drizzle/schema');
            const { eq } = await import('drizzle-orm');
            await db.update(propsTable).set({ matriculaDocUrl: url, matriculaDocKey: key }).where(eq(propsTable.id, property.id));
          }
        } catch (e) { /* non-fatal: property was created, just skip doc */ }
      }
      return property;
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      description: z.string().optional(),
      propertyType: z.string().optional(),
      street: z.string().optional(),
      number: z.string().optional(),
      complement: z.string().optional(),
      neighborhood: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      registration: z.string().optional(),
      registryOffice: z.string().optional(),
      area: z.string().optional(),
      totalValue: z.string().optional(),
      items: z.string().optional(),
      propertyStatus: z.enum(['disponivel', 'vendido', 'alugado', 'em_negociacao']).optional(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      const { properties: propsTable } = await import('../drizzle/schema');
      const { eq, and } = await import('drizzle-orm');
      const { id, ...data } = input;
      await db.update(propsTable).set(data).where(and(eq(propsTable.id, id), eq(propsTable.userId, ctx.user.id)));
      return { success: true };
    }),
      delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      const { properties: propsTable } = await import('../drizzle/schema');
      const { eq, and } = await import('drizzle-orm');
      await db.delete(propsTable).where(and(eq(propsTable.id, input.id), eq(propsTable.userId, ctx.user.id)));
      return { success: true };
    }),
    uploadMatricula: protectedProcedure.input(z.object({
      propertyId: z.number(),
      fileBase64: z.string(),
      mimeType: z.string(),
      fileName: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const { storagePut } = await import('./storage');
      const buf = Buffer.from(input.fileBase64, 'base64');
      const ext = input.mimeType.split('/')[1] || 'bin';
      const key = `property-docs/${ctx.user.id}/${input.propertyId}/matricula-${Date.now()}.${ext}`;
      const { url } = await storagePut(key, buf, input.mimeType);
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      const { properties: propsTable } = await import('../drizzle/schema');
      const { eq, and } = await import('drizzle-orm');
      await db.update(propsTable).set({ matriculaDocUrl: url, matriculaDocKey: key }).where(and(eq(propsTable.id, input.propertyId), eq(propsTable.userId, ctx.user.id)));
      return { url, success: true };
    }),
  }),

  // ─── Reports ────────────────────────────────────────────────────────────────
  reports: router({
    dealsByMonth: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const { deals: dealsTable } = await import('../drizzle/schema');
      const { eq, gte, and } = await import('drizzle-orm');
      // Last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);
      const rows = await db.select().from(dealsTable)
        .where(and(eq(dealsTable.userId, ctx.user.id), gte(dealsTable.createdAt, sixMonthsAgo)));
      // Group by month and type
      const months: Record<string, { month: string; venda: number; locacao: number; permuta: number; financiamento: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
        months[key] = { month: label.charAt(0).toUpperCase() + label.slice(1), venda: 0, locacao: 0, permuta: 0, financiamento: 0 };
      }
      for (const row of rows) {
        const d = new Date(row.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (months[key] && row.type) {
          months[key][row.type as 'venda' | 'locacao' | 'permuta' | 'financiamento']++;
        }
      }
      return Object.values(months);
    }),
    summary: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { totalDeals: 0, totalClients: 0, totalContracts: 0, conclusionRate: 0 };
      const { deals: dealsTable, clients: clientsTable, contracts: contractsTable } = await import('../drizzle/schema');
      const { eq, count } = await import('drizzle-orm');
      const [dealCount] = await db.select({ count: count() }).from(dealsTable).where(eq(dealsTable.userId, ctx.user.id));
      const [clientCount] = await db.select({ count: count() }).from(clientsTable).where(eq(clientsTable.userId, ctx.user.id));
      const [contractCount] = await db.select({ count: count() }).from(contractsTable).where(eq(contractsTable.userId, ctx.user.id));
      const [concludedCount] = await db.select({ count: count() }).from(dealsTable)
        .where(eq(dealsTable.userId, ctx.user.id));
      const total = dealCount?.count ?? 0;
      const concluded = 0; // simplified
      const rate = total > 0 ? Math.round((concluded / total) * 100) : 0;
      return {
        totalDeals: total,
        totalClients: clientCount?.count ?? 0,
        totalContracts: contractCount?.count ?? 0,
        conclusionRate: rate,
      };
    }),
  }),

  // ─── Import (Spreadsheet) ────────────────────────────────────────────────────
  import: router({
    // Parse a base64-encoded XLSX/CSV file and return rows as JSON (preview)
    preview: protectedProcedure.input(z.object({
      fileBase64: z.string(),
      fileName: z.string(),
      sheetIndex: z.number().default(0),
    })).mutation(async ({ input }) => {
      const buf = Buffer.from(input.fileBase64, 'base64');
      const wb = XLSX.read(buf, { type: 'buffer' });
      const sheetName = wb.SheetNames[input.sheetIndex] ?? wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][];
      const headers = rows[0] ?? [];
      const data = rows.slice(1).filter(r => r.some(c => c !== '')).slice(0, 10); // preview first 10 rows
      return { headers, preview: data, sheetNames: wb.SheetNames, totalRows: rows.length - 1 };
    }),

    // Import clients from spreadsheet
    clients: protectedProcedure.input(z.object({
      fileBase64: z.string(),
      fileName: z.string(),
      sheetIndex: z.number().default(0),
      mapping: z.object({
        name: z.number(),
        cpfCnpj: z.number().optional(),
        email: z.number().optional(),
        phone: z.number().optional(),
        address: z.number().optional(),
        clientRole: z.number().optional(),
        profession: z.number().optional(),
        maritalStatus: z.number().optional(),
      }),
      hasHeader: z.boolean().default(true),
    })).mutation(async ({ ctx, input }) => {
      const buf = Buffer.from(input.fileBase64, 'base64');
      const wb = XLSX.read(buf, { type: 'buffer' });
      const sheetName = wb.SheetNames[input.sheetIndex] ?? wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][];
      const dataRows = input.hasHeader ? rows.slice(1) : rows;
      const validRoles = ['comprador', 'vendedor', 'locador', 'locatario', 'fiador', 'corretor'];
      let imported = 0, skipped = 0;
      for (const row of dataRows) {
        const name = String(row[input.mapping.name] ?? '').trim();
        if (!name) { skipped++; continue; }
        const rawRole = input.mapping.clientRole != null ? String(row[input.mapping.clientRole] ?? '').toLowerCase().trim() : '';
        const clientRole = validRoles.includes(rawRole) ? rawRole as any : 'comprador';
        await createClient({
          userId: ctx.user.id,
          name,
          cpfCnpj: input.mapping.cpfCnpj != null ? String(row[input.mapping.cpfCnpj] ?? '').trim() || undefined : undefined,
          email: input.mapping.email != null ? String(row[input.mapping.email] ?? '').trim() || undefined : undefined,
          phone: input.mapping.phone != null ? String(row[input.mapping.phone] ?? '').trim() || undefined : undefined,
          address: input.mapping.address != null ? String(row[input.mapping.address] ?? '').trim() || undefined : undefined,
          profession: input.mapping.profession != null ? String(row[input.mapping.profession] ?? '').trim() || undefined : undefined,
          maritalStatus: input.mapping.maritalStatus != null ? String(row[input.mapping.maritalStatus] ?? '').trim() || undefined : undefined,
          clientRole,
        });
        imported++;
      }
      return { imported, skipped };
    }),

    // Import deals from spreadsheet
    deals: protectedProcedure.input(z.object({
      fileBase64: z.string(),
      fileName: z.string(),
      sheetIndex: z.number().default(0),
      mapping: z.object({
        type: z.number(),
        totalValue: z.number().optional(),
        monthlyValue: z.number().optional(),
        status: z.number().optional(),
        notes: z.number().optional(),
        subtype: z.number().optional(),
        paymentModality: z.number().optional(),
      }),
      hasHeader: z.boolean().default(true),
    })).mutation(async ({ ctx, input }) => {
      const buf = Buffer.from(input.fileBase64, 'base64');
      const wb = XLSX.read(buf, { type: 'buffer' });
      const sheetName = wb.SheetNames[input.sheetIndex] ?? wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][];
      const dataRows = input.hasHeader ? rows.slice(1) : rows;
      const typeMap: Record<string, string> = { venda: 'venda', locacao: 'locacao', locação: 'locacao', permuta: 'permuta', financiamento: 'financiamento' };
      const statusMap: Record<string, string> = { rascunho: 'rascunho', 'em andamento': 'em_andamento', 'em_andamento': 'em_andamento', 'contrato gerado': 'contrato_gerado', assinatura: 'assinatura', concluido: 'concluido', concluído: 'concluido' };
      let imported = 0, skipped = 0;
      for (const row of dataRows) {
        const rawType = String(row[input.mapping.type] ?? '').toLowerCase().trim();
        const dealType = typeMap[rawType] as any;
        if (!dealType) { skipped++; continue; }
        const rawStatus = input.mapping.status != null ? String(row[input.mapping.status] ?? '').toLowerCase().trim() : '';
        const status = (statusMap[rawStatus] as any) || 'rascunho';
        const prefix = dealType === 'venda' ? 'VND' : dealType === 'locacao' ? 'LOC' : dealType === 'permuta' ? 'PRM' : 'FIN';
        const code = `${prefix}-${String(Date.now()).slice(-6)}-${nanoid(3).toUpperCase()}`;
        await createDeal({
          userId: ctx.user.id,
          code,
          type: dealType,
          status,
          subtype: input.mapping.subtype != null ? String(row[input.mapping.subtype] ?? '').trim() || undefined : undefined,
          totalValue: input.mapping.totalValue != null ? String(row[input.mapping.totalValue] ?? '').replace(/[^0-9.,]/g, '').replace(',', '.') || undefined : undefined,
          monthlyValue: input.mapping.monthlyValue != null ? String(row[input.mapping.monthlyValue] ?? '').replace(/[^0-9.,]/g, '').replace(',', '.') || undefined : undefined,
          paymentModality: input.mapping.paymentModality != null ? String(row[input.mapping.paymentModality] ?? '').trim() || undefined : undefined,
          notes: input.mapping.notes != null ? String(row[input.mapping.notes] ?? '').trim() || undefined : undefined,
        });
        imported++;
      }
      return { imported, skipped };
    }),
  }),
});
export type AppRouter = typeof appRouter;

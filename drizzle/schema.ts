import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  json,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  cpfCnpj: varchar("cpfCnpj", { length: 20 }),
  rg: varchar("rg", { length: 30 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  address: text("address"),
  birthDate: varchar("birthDate", { length: 20 }),
  maritalStatus: varchar("maritalStatus", { length: 30 }),
  nationality: varchar("nationality", { length: 50 }),
  profession: varchar("profession", { length: 100 }),
  motherName: varchar("motherName", { length: 255 }),
  fatherName: varchar("fatherName", { length: 255 }),
  clientRole: mysqlEnum("clientRole", ["comprador", "vendedor", "locador", "locatario", "fiador", "corretor"]).default("comprador"),
  whatsapp: varchar("whatsapp", { length: 30 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const properties = mysqlTable("properties", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  description: text("description"),
  propertyType: varchar("propertyType", { length: 50 }),
  street: varchar("street", { length: 255 }),
  number: varchar("number", { length: 20 }),
  complement: varchar("complement", { length: 100 }),
  neighborhood: varchar("neighborhood", { length: 100 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  registration: varchar("registration", { length: 50 }),
  registryOffice: varchar("registryOffice", { length: 255 }),
  area: varchar("area", { length: 50 }),
  totalValue: decimal("totalValue", { precision: 15, scale: 2 }),
  items: text("items"),
  matriculaDocUrl: text("matriculaDocUrl"),
  matriculaDocKey: varchar("matriculaDocKey", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const deals = mysqlTable("deals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  code: varchar("code", { length: 20 }).notNull(),
  type: mysqlEnum("type", ["venda", "locacao", "permuta", "financiamento"]).notNull(),
  subtype: varchar("subtype", { length: 50 }),
  status: mysqlEnum("status", ["rascunho", "em_andamento", "contrato_gerado", "assinatura", "concluido"]).default("rascunho").notNull(),
  sellerId: int("sellerId"),
  buyerId: int("buyerId"),
  propertyId: int("propertyId"),
  brokerId: int("brokerId"),
  totalValue: decimal("totalValue", { precision: 15, scale: 2 }),
  monthlyValue: decimal("monthlyValue", { precision: 15, scale: 2 }),
  paymentModality: varchar("paymentModality", { length: 50 }),
  notes: text("notes"),
  docsTotal: int("docsTotal").default(7),
  docsCompleted: int("docsCompleted").default(0),
  progressPct: int("progressPct").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dealId: int("dealId"),
  clientId: int("clientId"),
  name: varchar("name", { length: 255 }).notNull(),
  docType: mysqlEnum("docType", ["rg", "cpf", "cnh", "comprovante_residencia", "matricula", "iptu", "certidao", "contrato", "outro"]).default("outro"),
  fileUrl: text("fileUrl"),
  fileKey: varchar("fileKey", { length: 500 }),
  mimeType: varchar("mimeType", { length: 100 }),
  fileSize: int("fileSize"),
  ocrStatus: mysqlEnum("ocrStatus", ["pending", "processing", "done", "failed"]).default("pending"),
  ocrText: text("ocrText"),
  ocrFields: json("ocrFields"),
  ocrConfidence: int("ocrConfidence"),
  docStatus: mysqlEnum("docStatus", ["pendente", "extraido", "validado", "rejeitado"]).default("pendente"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const contracts = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dealId: int("dealId"),
  code: varchar("code", { length: 30 }),
  nomeVendedor: varchar("nomeVendedor", { length: 255 }),
  nacionalidadeVendedor: varchar("nacionalidadeVendedor", { length: 50 }),
  estadoCivilVendedor: varchar("estadoCivilVendedor", { length: 30 }),
  profissaoVendedor: varchar("profissaoVendedor", { length: 100 }),
  tipoDocumentoVendedor: varchar("tipoDocumentoVendedor", { length: 10 }),
  numeroDocumentoVendedor: varchar("numeroDocumentoVendedor", { length: 50 }),
  cpfCnpjVendedor: varchar("cpfCnpjVendedor", { length: 20 }),
  enderecoVendedor: text("enderecoVendedor"),
  nomeComprador: varchar("nomeComprador", { length: 255 }),
  nacionalidadeComprador: varchar("nacionalidadeComprador", { length: 50 }),
  estadoCivilComprador: varchar("estadoCivilComprador", { length: 30 }),
  profissaoComprador: varchar("profissaoComprador", { length: 100 }),
  tipoDocumentoComprador: varchar("tipoDocumentoComprador", { length: 10 }),
  numeroDocumentoComprador: varchar("numeroDocumentoComprador", { length: 50 }),
  cpfCnpjComprador: varchar("cpfCnpjComprador", { length: 20 }),
  enderecoComprador: text("enderecoComprador"),
  descricaoImovel: text("descricaoImovel"),
  matriculaImovel: varchar("matriculaImovel", { length: 50 }),
  cartorioRegistroImoveis: varchar("cartorioRegistroImoveis", { length: 255 }),
  itensImovel: text("itensImovel"),
  valorTotalContrato: varchar("valorTotalContrato", { length: 100 }),
  modalidadePagamento: varchar("modalidadePagamento", { length: 30 }),
  valorPagamentoAvista: varchar("valorPagamentoAvista", { length: 100 }),
  formaPagamentoAvista: varchar("formaPagamentoAvista", { length: 50 }),
  dataPagamentoAvista: varchar("dataPagamentoAvista", { length: 20 }),
  valorFinanciamento: varchar("valorFinanciamento", { length: 100 }),
  instituicaoFinanceira: varchar("instituicaoFinanceira", { length: 100 }),
  descricaoImovelPermuta: text("descricaoImovelPermuta"),
  valorImovelPermuta: varchar("valorImovelPermuta", { length: 100 }),
  ajusteFinanceiroPermuta: text("ajusteFinanceiroPermuta"),
  prazoEntregaPosse: varchar("prazoEntregaPosse", { length: 50 }),
  condicaoEntregaPosse: text("condicaoEntregaPosse"),
  prazoEscritura: varchar("prazoEscritura", { length: 50 }),
  responsavelDespesas: varchar("responsavelDespesas", { length: 50 }),
  quantidadeExerciciosIptu: varchar("quantidadeExerciciosIptu", { length: 10 }),
  prazoCertidaoObjetoPe: varchar("prazoCertidaoObjetoPe", { length: 50 }),
  prazoRestituicaoValores: varchar("prazoRestituicaoValores", { length: 50 }),
  percentualComissao: varchar("percentualComissao", { length: 20 }),
  valorComissao: varchar("valorComissao", { length: 100 }),
  percentualMulta: varchar("percentualMulta", { length: 20 }),
  condicoesDistrato: text("condicoesDistrato"),
  plataformaAssinatura: varchar("plataformaAssinatura", { length: 50 }),
  razaoSocialImobiliaria: varchar("razaoSocialImobiliaria", { length: 255 }),
  cnpjImobiliaria: varchar("cnpjImobiliaria", { length: 20 }),
  creciImobiliaria: varchar("creciImobiliaria", { length: 30 }),
  enderecoImobiliaria: text("enderecoImobiliaria"),
  foroEleito: varchar("foroEleito", { length: 100 }),
  cidadeAssinatura: varchar("cidadeAssinatura", { length: 100 }),
  dataAssinatura: varchar("dataAssinatura", { length: 20 }),
  nomeTestemunha1: varchar("nomeTestemunha1", { length: 255 }),
  cpfTestemunha1: varchar("cpfTestemunha1", { length: 20 }),
  nomeTestemunha2: varchar("nomeTestemunha2", { length: 255 }),
  cpfTestemunha2: varchar("cpfTestemunha2", { length: 20 }),
  pdfUrl: text("pdfUrl"),
  pdfKey: varchar("pdfKey", { length: 500 }),
  contractStatus: mysqlEnum("contractStatus", ["rascunho", "gerado", "enviado", "assinado"]).default("rascunho"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const documentGroups = mysqlTable("document_groups", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dealId: int("dealId"),
  personName: varchar("personName", { length: 255 }).notNull(),
  personRole: mysqlEnum("personRole", ["comprador", "vendedor", "locador", "locatario", "fiador", "corretor", "imovel", "outro"]).default("outro"),
  cpf: varchar("cpf", { length: 20 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const documentGroupItems = mysqlTable("document_group_items", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  documentId: int("documentId"),
  docType: mysqlEnum("docType", ["rg", "cpf", "cnh", "comprovante_residencia", "matricula", "iptu", "certidao", "escritura", "contrato", "outro"]).default("outro"),
  label: varchar("label", { length: 100 }),
  status: mysqlEnum("status", ["pendente", "enviado", "validado", "rejeitado"]).default("pendente"),
  ocrFields: json("ocrFields"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const activities = mysqlTable("activities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dealId: int("dealId"),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;
export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;
export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;
export type DocumentGroup = typeof documentGroups.$inferSelect;
export type InsertDocumentGroup = typeof documentGroups.$inferInsert;
export type DocumentGroupItem = typeof documentGroupItems.$inferSelect;
export type InsertDocumentGroupItem = typeof documentGroupItems.$inferInsert;

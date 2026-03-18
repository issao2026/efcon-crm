import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Test context helpers ─────────────────────────────────────────────────────
type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "admin" | "user" = "user"): { ctx: TrpcContext; clearedCookies: { name: string; options: Record<string, unknown> }[] } {
  const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-efcon",
    email: "marcello@efcon.com.br",
    name: "Marcello",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

// ─── Auth tests ───────────────────────────────────────────────────────────────
describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });
  });

  it("returns the current user from auth.me", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user).toBeTruthy();
    expect(user?.name).toBe("Marcello");
    expect(user?.email).toBe("marcello@efcon.com.br");
  });
});

// ─── Dashboard tests ──────────────────────────────────────────────────────────
describe("dashboard", () => {
  it("returns stats with fallback values when DB is unavailable", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.dashboard.stats();

    expect(stats).toBeTruthy();
    expect(typeof stats.activeDeals).toBe("number");
    expect(typeof stats.totalContracts).toBe("number");
    expect(stats.activeDeals).toBeGreaterThanOrEqual(0);
  });

  it("returns demo deals when DB is unavailable", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const deals = await caller.dashboard.deals();

    expect(Array.isArray(deals)).toBe(true);
    expect(deals.length).toBeGreaterThan(0);

    // Check first deal has required fields
    const first = deals[0] as any;
    expect(first).toHaveProperty("type");
    expect(first).toHaveProperty("status");
    expect(["venda", "locacao", "permuta", "financiamento"]).toContain(first.type);
    expect(["rascunho", "em_andamento", "contrato_gerado", "assinatura", "concluido"]).toContain(first.status);
  });

  it("returns activities with correct structure", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const activities = await caller.dashboard.activities();

    expect(Array.isArray(activities)).toBe(true);
    expect(activities.length).toBeGreaterThan(0);

    const act = activities[0] as any;
    expect(act).toHaveProperty("type");
    expect(act).toHaveProperty("title");
    expect(act).toHaveProperty("createdAt");
  });
});

// ─── Pipeline stage tests ─────────────────────────────────────────────────────
describe("pipeline stages", () => {
  it("demo deals cover all 5 pipeline stages", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const deals = await caller.dashboard.deals();
    const statuses = new Set((deals as any[]).map((d) => d.status));

    expect(statuses.has("rascunho")).toBe(true);
    expect(statuses.has("em_andamento")).toBe(true);
    expect(statuses.has("contrato_gerado")).toBe(true);
    expect(statuses.has("assinatura")).toBe(true);
    expect(statuses.has("concluido")).toBe(true);
  });

  it("demo deals include all 3 operation types", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const deals = await caller.dashboard.deals();
    const types = new Set((deals as any[]).map((d) => d.type));

    expect(types.has("venda")).toBe(true);
    expect(types.has("locacao")).toBe(true);
    expect(types.has("permuta")).toBe(true);
  });
});

// ─── Contract template tests ──────────────────────────────────────────────────
describe("contracts.generate", () => {
  it("generates a branded PDF contract with filled fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contracts.generate({
      fields: {
        nome_vendedor: "João Silva",
        cpf_cnpj_vendedor: "123.456.789-00",
        nome_comprador: "Maria Santos",
        cpf_cnpj_comprador: "987.654.321-00",
        descricao_imovel: "Apartamento 3 quartos",
        valor_total_contrato: "R$ 485.000",
        modalidade_pagamento: "À vista",
        data_assinatura: "18/03/2026",
        cidade_assinatura: "Jundiaí, SP",
      },
    });

    // Should return a URL pointing to the branded PDF in S3
    expect(result).toHaveProperty("contractUrl");
    expect(typeof result.contractUrl).toBe("string");
    expect(result.contractUrl).toMatch(/\.pdf$|pdf/);
  }, 60000); // 60s timeout for LibreOffice + PDF merge
});

// ─── Contract suggestFields tests ─────────────────────────────────────────────
describe("contracts.suggestFields", () => {
  it("returns suggestions and warnings from LLM", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contracts.suggestFields({
      partialFields: {
        nome_vendedor: "João Silva",
        valor_total_contrato: "R$ 300.000",
      },
      context: "Contrato de compra e venda",
    });

    expect(result).toHaveProperty("suggestions");
    expect(result).toHaveProperty("warnings");
    expect(result).toHaveProperty("summary");
    expect(typeof result.summary).toBe("string");
  }, 30000);
});

// ─── OCR documents tests ──────────────────────────────────────────────────────
describe("documents.list", () => {
  it("returns empty array when no documents exist", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const docs = await caller.documents.list({});

    expect(Array.isArray(docs)).toBe(true);
  });
});

// ─── Deals CRUD tests ─────────────────────────────────────────────────────────
describe("deals", () => {
  it("returns deals list", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const deals = await caller.deals.list();

    expect(Array.isArray(deals)).toBe(true);
  });
});

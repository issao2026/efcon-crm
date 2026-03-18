import { DashboardShell } from "@/components/DashboardShell";
import { DollarSign, TrendingUp, TrendingDown, BarChart3, ArrowUpRight, ArrowDownRight } from "lucide-react";

const DEMO_TRANSACTIONS = [
  { id: 1, description: "Comissão — Venda Rua das Palmeiras, 340", type: "entrada", value: 14550, date: "12/03/2025", deal: "VND-031" },
  { id: 2, description: "Comissão — Locação Av. Brasil, 1.200", type: "entrada", value: 840, date: "10/03/2025", deal: "LOC-047" },
  { id: 3, description: "Honorários cartório — Qd. 12 Lt. 07", type: "saida", value: 1200, date: "08/03/2025", deal: "FIN-028" },
  { id: 4, description: "Comissão — Venda Jd. América, 890", type: "entrada", value: 8250, date: "05/03/2025", deal: "VND-025" },
  { id: 5, description: "Publicidade e marketing", type: "saida", value: 3500, date: "01/03/2025", deal: null },
  { id: 6, description: "Comissão — Locação Rua Cedro, 220", type: "entrada", value: 450, date: "28/02/2025", deal: "LOC-049" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function Financeiro() {
  const totalEntrada = DEMO_TRANSACTIONS.filter((t) => t.type === "entrada").reduce((s, t) => s + t.value, 0);
  const totalSaida = DEMO_TRANSACTIONS.filter((t) => t.type === "saida").reduce((s, t) => s + t.value, 0);
  const saldo = totalEntrada - totalSaida;

  return (
    <DashboardShell searchPlaceholder="Buscar transações...">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Financeiro</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Resumo financeiro do período</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-border border-l-4 border-l-green-500 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Receitas (mês)</span>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-green-600">{formatCurrency(totalEntrada)}</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
            <ArrowUpRight className="w-3.5 h-3.5" /> +18% vs mês anterior
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border border-l-4 border-l-red-500 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Despesas (mês)</span>
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-red-600">{formatCurrency(totalSaida)}</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
            <ArrowDownRight className="w-3.5 h-3.5" /> +5% vs mês anterior
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border border-l-4 border-l-blue-500 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Saldo líquido</span>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600">{formatCurrency(saldo)}</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-blue-500">
            <ArrowUpRight className="w-3.5 h-3.5" /> Margem 79%
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-bold text-gray-900">Lançamentos recentes</h2>
        </div>
        <div className="divide-y divide-border">
          {DEMO_TRANSACTIONS.map((t) => (
            <div key={t.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${t.type === "entrada" ? "bg-green-100" : "bg-red-100"}`}>
                {t.type === "entrada"
                  ? <ArrowUpRight className="w-5 h-5 text-green-600" />
                  : <ArrowDownRight className="w-5 h-5 text-red-600" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{t.description}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{t.date}</span>
                  {t.deal && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{t.deal}</span>
                  )}
                </div>
              </div>
              <div className={`text-sm font-bold ${t.type === "entrada" ? "text-green-600" : "text-red-600"}`}>
                {t.type === "entrada" ? "+" : "-"}{formatCurrency(t.value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

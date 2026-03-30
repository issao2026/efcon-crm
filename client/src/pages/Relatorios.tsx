import { useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { trpc } from "@/lib/trpc";
import { TrendingUp, FileOutput, Users, CheckCircle2, Loader2, BarChart3 } from "lucide-react";

const CHART_HEIGHT = 180;

const MONTH_ABBR: Record<number, string> = {
  1: "Jan", 2: "Fev", 3: "Mar", 4: "Abr", 5: "Mai", 6: "Jun",
  7: "Jul", 8: "Ago", 9: "Set", 10: "Out", 11: "Nov", 12: "Dez",
};

export default function Relatorios() {
  const { data: stats, isLoading: statsLoading } = trpc.reports.summary.useQuery();
  const { data: monthlyRaw = [], isLoading: monthlyLoading } = trpc.reports.dealsByMonth.useQuery();

  const monthly = (monthlyRaw as any[]).map((d: any) => ({
    month: MONTH_ABBR[d.month] || String(d.month),
    venda: Number(d.venda) || 0,
    locacao: Number(d.locacao) || 0,
    permuta: Number(d.permuta) || 0,
  }));

  const maxValue = Math.max(...monthly.map((d) => d.venda + d.locacao + d.permuta), 1);

  // Compute type breakdown from monthly totals
  const totalVenda = monthly.reduce((s, d) => s + d.venda, 0);
  const totalLocacao = monthly.reduce((s, d) => s + d.locacao, 0);
  const totalPermuta = monthly.reduce((s, d) => s + d.permuta, 0);
  const grandTotal = totalVenda + totalLocacao + totalPermuta || 1;

  const kpis = [
    {
      label: "Total de negócios",
      value: statsLoading ? "—" : String(stats?.totalDeals ?? 0),
      sub: "todos os negócios",
      icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/20",
    },
    {
      label: "Contratos gerados",
      value: statsLoading ? "—" : String(stats?.totalContracts ?? 0),
      sub: "contratos no sistema",
      icon: FileOutput, color: "text-blue-400", bg: "bg-blue-500/20",
    },
    {
      label: "Clientes cadastrados",
      value: statsLoading ? "—" : String(stats?.totalClients ?? 0),
      sub: "clientes ativos",
      icon: Users, color: "text-violet-400", bg: "bg-violet-500/20",
    },
    {
      label: "Taxa de conclusão",
      value: statsLoading ? "—" : `${stats?.conclusionRate ?? 0}%`,
      sub: "negócios concluídos",
      icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/20",
    },
  ];

  return (
    <DashboardShell searchPlaceholder="Buscar relatórios...">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Relatórios</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Análise de desempenho e métricas</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-[#0f172a] rounded-2xl p-5 border border-white/5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide leading-tight">{kpi.label}</span>
              <div className={`w-8 h-8 ${kpi.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
            </div>
            <div className={`text-3xl font-black ${kpi.color}`}>{kpi.value}</div>
            <div className="text-xs text-slate-400 mt-1">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="bg-[#0f172a] rounded-2xl border border-white/5 shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-white">Negócios por mês</h2>
            <p className="text-xs text-slate-400 mt-0.5">Últimos 6 meses</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-slate-400">Venda</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-cyan-400" /><span className="text-slate-400">Locação</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-400" /><span className="text-slate-400">Permuta</span></div>
          </div>
        </div>

        {monthlyLoading ? (
          <div className="flex items-center justify-center" style={{ height: `${CHART_HEIGHT + 24}px` }}>
            <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
          </div>
        ) : monthly.length === 0 ? (
          <div className="flex flex-col items-center justify-center" style={{ height: `${CHART_HEIGHT + 24}px` }}>
            <BarChart3 className="w-10 h-10 text-slate-700 mb-2" />
            <p className="text-sm text-slate-500">Nenhum dado disponível ainda</p>
          </div>
        ) : (
          <div className="flex items-end gap-3" style={{ height: `${CHART_HEIGHT + 24}px` }}>
            {monthly.map((d) => {
              const total = d.venda + d.locacao + d.permuta;
              const totalH = Math.max(total > 0 ? 12 : 0, Math.round((total / maxValue) * CHART_HEIGHT));
              const vendaH = total > 0 ? Math.round((d.venda / total) * totalH) : 0;
              const locacaoH = total > 0 ? Math.round((d.locacao / total) * totalH) : 0;
              const permutaH = totalH - vendaH - locacaoH;
              return (
                <div
                  key={d.month}
                  className="flex-1 flex flex-col items-center justify-end gap-1"
                  style={{ height: `${CHART_HEIGHT + 24}px` }}
                >
                  {total > 0 && (
                    <span className="text-xs font-bold text-slate-300 mb-1">{total}</span>
                  )}
                  <div
                    className="w-full rounded-t-lg overflow-hidden flex flex-col-reverse"
                    style={{ height: `${totalH}px` }}
                  >
                    {vendaH > 0 && <div className="bg-blue-500 w-full" style={{ height: `${vendaH}px` }} />}
                    {locacaoH > 0 && <div className="bg-cyan-400 w-full" style={{ height: `${locacaoH}px` }} />}
                    {permutaH > 0 && <div className="bg-amber-400 w-full" style={{ height: `${permutaH}px` }} />}
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{d.month}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Type Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Compra & Venda", count: totalVenda, pct: Math.round((totalVenda / grandTotal) * 100), color: "bg-blue-500" },
          { label: "Locação", count: totalLocacao, pct: Math.round((totalLocacao / grandTotal) * 100), color: "bg-cyan-400" },
          { label: "Permuta", count: totalPermuta, pct: Math.round((totalPermuta / grandTotal) * 100), color: "bg-amber-400" },
        ].map((item) => (
          <div key={item.label} className="bg-[#0f172a] rounded-2xl border border-white/5 shadow-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-white text-sm">{item.label}</span>
              <span className="text-xs text-slate-400">{item.count} negócios</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 mb-2">
              <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
            </div>
            <div className="text-right text-xs font-bold text-slate-300">{item.pct}%</div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}

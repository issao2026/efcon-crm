import { DashboardShell } from "@/components/DashboardShell";
import { BarChart3, TrendingUp, FileOutput, Users, Briefcase, CheckCircle2 } from "lucide-react";

const MONTHLY_DATA = [
  { month: "Out", venda: 2, locacao: 3, permuta: 0 },
  { month: "Nov", venda: 3, locacao: 4, permuta: 1 },
  { month: "Dez", venda: 4, locacao: 2, permuta: 0 },
  { month: "Jan", venda: 3, locacao: 5, permuta: 1 },
  { month: "Fev", venda: 5, locacao: 4, permuta: 2 },
  { month: "Mar", venda: 4, locacao: 6, permuta: 1 },
];

const MAX_VALUE = Math.max(...MONTHLY_DATA.map((d) => d.venda + d.locacao + d.permuta));

export default function Relatorios() {
  return (
    <DashboardShell searchPlaceholder="Buscar relatórios...">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Relatórios</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Análise de desempenho e métricas</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Negócios concluídos", value: "14", sub: "+3 este mês", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
          { label: "Contratos gerados", value: "47", sub: "+12 este mês", icon: FileOutput, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Clientes ativos", value: "38", sub: "+5 este mês", icon: Users, color: "text-purple-600", bg: "bg-purple-100" },
          { label: "Taxa de conclusão", value: "78%", sub: "↑ 4% vs mês ant.", icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-100" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{kpi.label}</span>
              <div className={`w-8 h-8 ${kpi.bg} rounded-lg flex items-center justify-center`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
            </div>
            <div className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-gray-900">Negócios por mês</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Últimos 6 meses</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-muted-foreground">Venda</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-cyan-400" /><span className="text-muted-foreground">Locação</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-orange-400" /><span className="text-muted-foreground">Permuta</span></div>
          </div>
        </div>
        <div className="flex items-end gap-4 h-48">
          {MONTHLY_DATA.map((d) => {
            const total = d.venda + d.locacao + d.permuta;
            const totalPct = (total / MAX_VALUE) * 100;
            const vendaPct = (d.venda / total) * 100;
            const locacaoPct = (d.locacao / total) * 100;
            const permutaPct = (d.permuta / total) * 100;
            return (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col-reverse rounded-lg overflow-hidden" style={{ height: `${totalPct}%`, minHeight: "8px" }}>
                  <div className="bg-blue-500" style={{ height: `${vendaPct}%` }} />
                  <div className="bg-cyan-400" style={{ height: `${locacaoPct}%` }} />
                  <div className="bg-orange-400" style={{ height: `${permutaPct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{d.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Type Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Compra & Venda", pct: 45, count: 21, color: "bg-blue-500" },
          { label: "Locação", pct: 42, count: 19, color: "bg-cyan-400" },
          { label: "Permuta", pct: 13, count: 6, color: "bg-orange-400" },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-gray-900 text-sm">{item.label}</span>
              <span className="text-xs text-muted-foreground">{item.count} negócios</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
              <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
            </div>
            <div className="text-right text-xs font-bold text-gray-700">{item.pct}%</div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}

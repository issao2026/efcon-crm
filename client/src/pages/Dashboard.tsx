import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Zap, LayoutDashboard, Briefcase, Users, FileText, FileOutput,
  DollarSign, BarChart3, Settings, Bell, Search, Plus, ChevronRight,
  TrendingUp, AlertTriangle, CheckCircle2, Clock, Home, ArrowUpRight,
  Filter, RefreshCw, LogOut, User, Building2, Upload
} from "lucide-react";
import { getLoginUrl } from "@/const";

// ─── Types ───────────────────────────────────────────────────────────────────
type DealStatus = "rascunho" | "em_andamento" | "contrato_gerado" | "assinatura" | "concluido";
type DealType = "venda" | "locacao" | "permuta" | "financiamento";

interface Deal {
  id?: number;
  code?: string;
  type: DealType;
  subtype?: string;
  status: DealStatus;
  totalValue?: string;
  monthlyValue?: string;
  buyer?: string;
  broker?: string;
  property?: string;
  docsCompleted?: number;
  docsTotal?: number;
  progressPct?: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const PIPELINE_STAGES: { key: DealStatus; label: string; color: string; dot: string }[] = [
  { key: "rascunho", label: "Rascunho", color: "text-gray-500", dot: "bg-gray-400" },
  { key: "em_andamento", label: "Em andamento", color: "text-blue-600", dot: "bg-blue-500" },
  { key: "contrato_gerado", label: "Contrato gerado", color: "text-purple-600", dot: "bg-purple-500" },
  { key: "assinatura", label: "Assinatura", color: "text-yellow-600", dot: "bg-yellow-500" },
  { key: "concluido", label: "Concluído", color: "text-green-600", dot: "bg-green-500" },
];

const TYPE_LABELS: Record<DealType, string> = {
  venda: "VENDA",
  locacao: "LOCAÇÃO",
  permuta: "PERMUTA",
  financiamento: "FINANCIAMENTO",
};

const TYPE_COLORS: Record<DealType, string> = {
  venda: "type-badge-venda",
  locacao: "type-badge-locacao",
  permuta: "type-badge-permuta",
  financiamento: "type-badge-financiamento",
};

const STATUS_COLORS: Record<DealStatus, string> = {
  rascunho: "status-badge-rascunho",
  em_andamento: "status-badge-em_andamento",
  contrato_gerado: "status-badge-contrato_gerado",
  assinatura: "status-badge-assinatura",
  concluido: "status-badge-concluido",
};

const STATUS_LABELS: Record<DealStatus, string> = {
  rascunho: "Rascunho",
  em_andamento: "Em andamento",
  contrato_gerado: "Contrato gerado",
  assinatura: "Assinatura",
  concluido: "Concluído",
};

const ACTIVITY_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  contract: { icon: CheckCircle2, color: "text-green-500" },
  ocr: { icon: Search, color: "text-blue-500" },
  warning: { icon: AlertTriangle, color: "text-yellow-500" },
  deal: { icon: Plus, color: "text-blue-500" },
  sign: { icon: FileOutput, color: "text-purple-500" },
  upload: { icon: Upload, color: "text-teal-500" },
  status: { icon: RefreshCw, color: "text-gray-500" },
};

function formatTimeAgo(date: Date | string): string {
  const d = new Date(date);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin} min atrás`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h atrás`;
  return `${Math.floor(diffH / 24)}d atrás`;
}

function formatCurrency(value?: string | number): string {
  if (!value) return "—";
  const num = typeof value === "string" ? parseFloat(value.replace(/[^0-9.]/g, "")) : value;
  if (isNaN(num)) return String(value);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(num);
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ activeDeals = 0, pendingDocs = 0 }: { activeDeals?: number; pendingDocs?: number }) {
  const [location, navigate] = useLocation();
  const { logout, user } = useAuth();

  const navItems = [
    { label: "PRINCIPAL", items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
      { icon: Briefcase, label: "Negócios", href: "/dashboard/negocios", badge: activeDeals },
      { icon: Users, label: "Clientes", href: "/dashboard/clientes" },
      { icon: FileText, label: "Documentos", href: "/dashboard/documentos", badge: pendingDocs, badgeColor: "bg-red-500" },
      { icon: FileOutput, label: "Contratos", href: "/dashboard/contratos" },
    ]},
    { label: "FINANCEIRO", items: [
      { icon: DollarSign, label: "Financeiro", href: "/dashboard/financeiro" },
      { icon: BarChart3, label: "Relatórios", href: "/dashboard/relatorios" },
    ]},
    { label: "SISTEMA", items: [
      { icon: Settings, label: "Configurações", href: "/dashboard/configuracoes" },
    ]},
  ];

  return (
    <aside className="w-56 flex-shrink-0 bg-sidebar text-sidebar-foreground flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <Link href="/">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border hover:bg-white/5 transition-colors cursor-pointer">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-base">Efcon</span>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navItems.map((section) => (
          <div key={section.label} className="mb-6">
            <div className="text-sidebar-foreground/40 text-xs font-bold tracking-widest uppercase px-2 mb-2">
              {section.label}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.label}>
                  <Link href={item.href}>
                    <div
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        (location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href)))
                          ? "bg-sidebar-primary text-white"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      }`}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm flex-1">{item.label}</span>
                      {"badge" in item && item.badge != null && item.badge > 0 && (
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor || "bg-sidebar-foreground/20"} text-white`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || "M"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">{user?.name || "Marcello"}</div>
            <div className="text-sidebar-foreground/40 text-xs">admin · CRECI 28.867</div>
          </div>
          <button
            onClick={() => logout().then(() => navigate("/"))}
            className="text-sidebar-foreground/40 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── Kanban Card ─────────────────────────────────────────────────────────────
function KanbanCard({ deal }: { deal: Deal }) {
  const value = deal.type === "locacao"
    ? (deal.monthlyValue ? `R$ ${Number(deal.monthlyValue).toLocaleString("pt-BR")}/mês` : "—")
    : formatCurrency(deal.totalValue);

  return (
    <div className="kanban-card">
      <div className="flex items-center justify-between mb-2">
        <span className={TYPE_COLORS[deal.type]}>{TYPE_LABELS[deal.type]}</span>
        <span className="text-gray-400 text-xs">{deal.code}</span>
      </div>
      <div className="font-semibold text-gray-900 text-sm mb-0.5 truncate">{deal.property || "—"}</div>
      <div className="text-gray-500 text-xs mb-3">{deal.buyer || "—"}</div>
      <div className="flex items-center justify-between">
        <span className="text-gray-900 font-bold text-sm">{value}</span>
        {deal.docsCompleted != null && deal.docsTotal != null && (
          <span className="text-gray-400 text-xs">{deal.docsCompleted}/{deal.docsTotal} docs</span>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [typeFilter, setTypeFilter] = useState<"todos" | DealType>("todos");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");

  const { data: stats } = trpc.dashboard.stats.useQuery(undefined, { enabled: isAuthenticated });
  const { data: deals = [], isLoading: dealsLoading } = trpc.dashboard.deals.useQuery(undefined, { enabled: isAuthenticated });
  const { data: activities = [] } = trpc.dashboard.activities.useQuery(undefined, { enabled: isAuthenticated });

  const pipelineByStage = useMemo(() => {
    const map: Record<DealStatus, Deal[]> = {
      rascunho: [], em_andamento: [], contrato_gerado: [], assinatura: [], concluido: [],
    };
    for (const deal of deals as Deal[]) {
      if (deal.status in map) map[deal.status].push(deal);
    }
    return map;
  }, [deals]);

  const filteredDeals = useMemo(() => {
    if (typeFilter === "todos") return deals as Deal[];
    return (deals as Deal[]).filter((d) => d.type === typeFilter);
  }, [deals, typeFilter]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-5 h-5 text-white animate-pulse" />
          </div>
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Acesso restrito</h2>
          <Button onClick={() => (window.location.href = getLoginUrl())}>Entrar</Button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      icon: Home,
      label: "Negócios ativos",
      value: stats?.activeDeals ?? 0,
      trend: stats?.activeDeals ? "+3 este mês" : "—",
      trendColor: "text-green-500",
      accent: "border-l-blue-500",
    },
    {
      icon: FileOutput,
      label: "Contratos gerados",
      value: stats?.totalContracts ?? 0,
      trend: stats?.totalContracts ? "+12 este mês" : "—",
      trendColor: "text-green-500",
      accent: "border-l-purple-500",
    },
    {
      icon: DollarSign,
      label: "Volume total em negociação",
      value: formatCurrency(stats?.totalVolume ?? 0),
      trend: stats?.totalVolume ? "+R$ 1.2M" : "—",
      trendColor: "text-green-500",
      accent: "border-l-green-500",
    },
    {
      icon: AlertTriangle,
      label: "Pendências documentais",
      value: stats?.pendingDocs ?? 0,
      trend: stats?.pendingDocs ? "2 hoje" : "—",
      trendColor: "text-red-500",
      accent: "border-l-red-500",
    },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar activeDeals={stats?.activeDeals ?? 0} pendingDocs={stats?.pendingDocs ?? 0} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-border px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar negócio, cliente, imóvel..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 max-w-md"
            />
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <Link href="/dashboard/upload">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <Plus className="w-4 h-4" /> Novo negócio
              </Button>
            </Link>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Atualizado às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · Marcello & Oliveira CRECI 28.867 J
              </p>
            </div>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {(["7d", "30d", "90d"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    timeRange === r ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((card) => (
              <div key={card.label} className={`bg-white rounded-xl border border-border p-5 border-l-4 ${card.accent}`}>
                <div className="flex items-center justify-between mb-3">
                  <card.icon className="w-5 h-5 text-muted-foreground" />
                  <span className={`text-xs font-semibold flex items-center gap-1 ${card.trendColor}`}>
                    <TrendingUp className="w-3 h-3" /> {card.trend}
                  </span>
                </div>
                <div className="text-2xl font-black text-gray-900">{card.value}</div>
                <div className="text-muted-foreground text-xs mt-1">{card.label}</div>
              </div>
            ))}
          </div>

          {/* Pipeline + Activity */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-8">
            {/* Pipeline Kanban */}
            <div className="xl:col-span-3 bg-white rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <h2 className="font-bold text-gray-900">Pipeline de Negócios</h2>
                </div>
                <span className="text-muted-foreground text-xs">Clique em um card para ver detalhes</span>
              </div>
              <div className="grid grid-cols-5 gap-3 overflow-x-auto">
                {PIPELINE_STAGES.map((stage) => {
                  const stageDeals = pipelineByStage[stage.key] || [];
                  return (
                    <div key={stage.key} className="min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
                        <span className={`text-xs font-bold uppercase tracking-wide ${stage.color}`}>
                          {stage.label}
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground font-bold">{stageDeals.length}</span>
                      </div>
                      <div className="space-y-2">
                        {stageDeals.map((deal, i) => (
                          <KanbanCard key={deal.id ?? i} deal={deal} />
                        ))}
                        {stageDeals.length === 0 && (
                          <div className="border-2 border-dashed border-gray-100 rounded-xl p-4 text-center text-gray-300 text-xs">
                            Nenhum negócio
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <h2 className="font-bold text-gray-900 text-sm">Atividade recente</h2>
                </div>
                <button className="text-xs text-blue-600 hover:underline">Atualizar</button>
              </div>
              <div className="space-y-3">
                {(activities as any[]).slice(0, 8).map((act, i) => {
                  const config = ACTIVITY_ICONS[act.type] || ACTIVITY_ICONS.status;
                  const IconComp = config.icon;
                  return (
                    <div key={act.id ?? i} className="flex gap-3">
                      <div className={`w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 ${config.color}`}>
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-900 leading-tight">{act.title}</div>
                        {act.description && (
                          <div className="text-xs text-muted-foreground mt-0.5 truncate">{act.description}</div>
                        )}
                        <div className="text-xs text-muted-foreground/60 mt-0.5">
                          {formatTimeAgo(act.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Deals Table */}
          <div className="bg-white rounded-xl border border-border">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <h2 className="font-bold text-gray-900">Todos os Negócios</h2>
              </div>
              <div className="flex items-center gap-2">
                {(["todos", "venda", "locacao", "permuta"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTypeFilter(f)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      typeFilter === f
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {f === "todos" ? "Todos" : f === "venda" ? "Venda" : f === "locacao" ? "Locação" : "Permuta"}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["ID", "Tipo", "Imóvel / Data", "Cliente", "Valor", "Docs", "Progresso", "Status"].map((h) => (
                      <th key={h} className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wide px-4 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dealsLoading ? (
                    <tr><td colSpan={8} className="text-center py-8 text-muted-foreground text-sm">Carregando...</td></tr>
                  ) : filteredDeals.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8 text-muted-foreground text-sm">Nenhum negócio encontrado</td></tr>
                  ) : (
                    filteredDeals.map((deal, i) => {
                      const value = deal.type === "locacao"
                        ? (deal.monthlyValue ? `R$ ${Number(deal.monthlyValue).toLocaleString("pt-BR")}` : "—")
                        : formatCurrency(deal.totalValue);
                      return (
                        <tr key={deal.id ?? i} className="border-b border-border/50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-blue-600 text-sm font-semibold hover:underline cursor-pointer">
                              {deal.code || `#${i + 1}`}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className={TYPE_COLORS[deal.type]}>{TYPE_LABELS[deal.type]}</div>
                            {deal.subtype && <div className="text-xs text-muted-foreground">{deal.subtype}</div>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900 max-w-[180px] truncate">{deal.property || "—"}</div>
                            <div className="text-xs text-muted-foreground">{deal.broker ? `Corretor: ${deal.broker}` : ""}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">{deal.buyer || "—"}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold text-gray-900">{value}</span>
                          </td>
                          <td className="px-4 py-3">
                            {deal.docsCompleted != null && deal.docsTotal != null ? (
                              <div className="flex items-center gap-1">
                                {deal.docsCompleted === deal.docsTotal ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                )}
                                <span className="text-xs text-muted-foreground">{deal.docsCompleted}/{deal.docsTotal}</span>
                              </div>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3 min-w-[100px]">
                            {deal.progressPct != null ? (
                              <div>
                                <Progress value={deal.progressPct} className="h-1.5 mb-1" />
                                <span className="text-xs text-muted-foreground">{deal.progressPct}%</span>
                              </div>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={STATUS_COLORS[deal.status]}>
                              {STATUS_LABELS[deal.status]}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

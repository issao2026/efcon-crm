import { useState, useMemo } from "react";
import { SpreadsheetImportModal } from "@/components/SpreadsheetImportModal";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DashboardShell } from "@/components/DashboardShell";
import { toast } from "sonner";
import {
  Briefcase, FileText, FileOutput,
  DollarSign, BarChart3, Plus, ChevronRight,
  TrendingUp, AlertTriangle, CheckCircle2, Clock, Home, 
  Filter, RefreshCw, Upload, Search, Pencil, Trash2, X, Save,
  Eye,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type DealStatus = "rascunho" | "em_andamento" | "contrato_gerado" | "assinatura" | "concluido";
type DealType = "venda" | "locacao" | "permuta" | "financiamento";

interface Deal {
  id?: number;
  code?: string;
  type: DealType;
  subtype?: string;
  status: DealStatus;
  totalValue?: string | null;
  monthlyValue?: string | null;
  buyer?: string | null;
  broker?: string | null;
  property?: string | null;
  docsCompleted?: number | null;
  docsTotal?: number | null;
  progressPct?: number | null;
  paymentModality?: string | null;
  notes?: string | null;
  buyerId?: number | null;
  sellerId?: number | null;
  brokerId?: number | null;
  propertyId?: number | null;
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

function formatCurrency(value?: string | number | null): string {
  if (!value) return "—";
  const num = typeof value === "string" ? parseFloat(value.replace(/[^0-9.]/g, "")) : value;
  if (isNaN(num)) return String(value);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(num);
}

// ─── Kanban Card ─────────────────────────────────────────────────────────────
function KanbanCard({ deal, onClick }: { deal: Deal; onClick?: () => void }) {
  const value = deal.type === "locacao"
    ? (deal.monthlyValue ? `R$ ${Number(deal.monthlyValue).toLocaleString("pt-BR")}/mês` : "—")
    : formatCurrency(deal.totalValue);

  return (
    <div className="kanban-card cursor-pointer" onClick={onClick}>
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

// ─── Edit Deal Modal ──────────────────────────────────────────────────────────
function EditDealModal({ deal, onClose }: { deal: Deal; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    type: deal.type,
    subtype: deal.subtype || "",
    status: deal.status,
    totalValue: deal.totalValue || "",
    monthlyValue: deal.monthlyValue || "",
    paymentModality: deal.paymentModality || "",
    notes: deal.notes || "",
  });

  const updateMutation = trpc.deals.update.useMutation({
    onSuccess: () => {
      toast.success("Negócio atualizado!");
      utils.dashboard.deals.invalidate();
      utils.deals.list.invalidate();
      onClose();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const field = (label: string, key: keyof typeof form, type = "text") => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={form[key] as string}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-bold text-gray-900">Editar Negócio</h2>
            <p className="text-xs text-muted-foreground">{deal.code}</p>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-gray-900 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as DealType }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                <option value="venda">Venda</option>
                <option value="locacao">Locação</option>
                <option value="permuta">Permuta</option>
                <option value="financiamento">Financiamento</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as DealStatus }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                <option value="rascunho">Rascunho</option>
                <option value="em_andamento">Em andamento</option>
                <option value="contrato_gerado">Contrato gerado</option>
                <option value="assinatura">Assinatura</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>
          </div>
          {field("Subtipo / Modalidade", "subtype")}
          {form.type === "locacao"
            ? field("Valor Mensal (R$)", "monthlyValue")
            : field("Valor Total (R$)", "totalValue")}
          {field("Forma de Pagamento", "paymentModality")}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Observações</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            onClick={() => updateMutation.mutate({ id: deal.id!, ...form })}
            disabled={updateMutation.isPending || !deal.id}
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Deal Modal ────────────────────────────────────────────────────────
function DeleteDealModal({ deal, onClose }: { deal: Deal; onClose: () => void }) {
  const utils = trpc.useUtils();
  const deleteMutation = trpc.deals.delete.useMutation({
    onSuccess: () => {
      toast.success("Negócio excluído.");
      utils.dashboard.deals.invalidate();
      utils.deals.list.invalidate();
      utils.dashboard.stats.invalidate();
      onClose();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Excluir negócio</h2>
            <p className="text-xs text-muted-foreground">{deal.code}</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Tem certeza que deseja excluir o negócio <strong>{deal.code}</strong>?
          {deal.property && <> Imóvel: <strong>{deal.property}</strong>.</>} Esta ação não pode ser desfeita.
        </p>
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white gap-2"
            onClick={() => deleteMutation.mutate({ id: deal.id! })}
            disabled={deleteMutation.isPending || !deal.id}
          >
            <Trash2 className="w-4 h-4" />
            {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const [typeFilter, setTypeFilter] = useState<"todos" | DealType>("todos");
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [deletingDeal, setDeletingDeal] = useState<Deal | null>(null);
  const [showImport, setShowImport] = useState(false);

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

  // Compute real trends from data
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const dealsThisMonth = (deals as Deal[]).filter((d: any) => d.createdAt && new Date(d.createdAt).getTime() >= startOfMonth).length;

  const statCards = [
    {
      icon: Home,
      label: "Negócios ativos",
      value: stats?.activeDeals ?? 0,
      trend: dealsThisMonth > 0 ? `+${dealsThisMonth} este mês` : "Nenhum este mês",
      trendColor: dealsThisMonth > 0 ? "text-green-500" : "text-gray-400",
      accent: "border-l-blue-500",
      href: "/dashboard/negocios",
    },
    {
      icon: FileOutput,
      label: "Contratos gerados",
      value: stats?.totalContracts ?? 0,
      trend: stats?.totalContracts ? `${stats.totalContracts} total` : "Nenhum ainda",
      trendColor: "text-blue-500",
      accent: "border-l-purple-500",
      href: "/dashboard/contratos",
    },
    {
      icon: DollarSign,
      label: "Volume em negociação",
      value: formatCurrency(stats?.totalVolume ?? 0),
      trend: stats?.totalVolume ? "em negócios ativos" : "Sem negócios",
      trendColor: "text-green-500",
      accent: "border-l-green-500",
      href: "/dashboard/financeiro",
    },
    {
      icon: AlertTriangle,
      label: "Pendências documentais",
      value: stats?.pendingDocs ?? 0,
      trend: stats?.pendingDocs ? "documentos pendentes" : "Tudo em dia",
      trendColor: stats?.pendingDocs ? "text-red-500" : "text-green-500",
      accent: "border-l-red-500",
      href: "/dashboard/documentos",
    },
  ];

  // User display name
  const userName = (user as any)?.name || (user as any)?.username || "Corretor";

  return (
    <DashboardShell
      searchPlaceholder="Buscar negócio, cliente, imóvel..."
      headerRight={
        <Link href="/dashboard/negocios/novo">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1 text-xs md:text-sm px-2 md:px-3">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo negócio</span>
          </Button>
        </Link>
      }
    >
      {/* Modals */}
      {editingDeal && <EditDealModal deal={editingDeal} onClose={() => setEditingDeal(null)} />}
      {deletingDeal && <DeleteDealModal deal={deletingDeal} onClose={() => setDeletingDeal(null)} />}
      {showImport && <SpreadsheetImportModal onClose={() => setShowImport(false)} />}

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Atualizado às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {userName}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs border-green-200 text-green-700 hover:bg-green-50 hover:border-green-400"
          onClick={() => setShowImport(true)}
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Importar planilha</span>
          <span className="sm:hidden">Importar</span>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href}>
            <div className={`bg-white rounded-xl border border-border p-4 border-l-4 ${card.accent} cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 group`}>
              <div className="flex items-center justify-between mb-2">
                <card.icon className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                <span className={`text-xs font-semibold flex items-center gap-1 ${card.trendColor}`}>
                  <TrendingUp className="w-3 h-3" /> {card.trend}
                </span>
              </div>
              <div className="text-xl font-black text-gray-900">{card.value}</div>
              <div className="text-muted-foreground text-xs mt-1 flex items-center justify-between">
                <span>{card.label}</span>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pipeline + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mb-6">
        {/* Pipeline Kanban */}
        <div className="xl:col-span-3 bg-white rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-gray-900">Pipeline de Negócios</h2>
            </div>
            <span className="text-muted-foreground text-xs hidden sm:block">Clique em um card para editar</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto">
            {PIPELINE_STAGES.map((stage) => {
              const stageDeals = pipelineByStage[stage.key] || [];
              return (
                <div key={stage.key} className="min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${stage.dot}`} />
                    <span className={`text-xs font-bold uppercase tracking-wide truncate ${stage.color}`}>
                      {stage.label}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground font-bold flex-shrink-0">{stageDeals.length}</span>
                  </div>
                  <div className="space-y-2">
                    {stageDeals.map((deal, i) => (
                      <KanbanCard
                        key={deal.id ?? i}
                        deal={deal}
                        onClick={() => deal.id ? setEditingDeal(deal) : undefined}
                      />
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
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-gray-900 text-sm">Atividade recente</h2>
            </div>
          </div>
          {(activities as any[]).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">
              <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              Nenhuma atividade ainda
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {/* Deals Table */}
      <div className="bg-white rounded-xl border border-border">
        <div className="flex items-center justify-between p-4 border-b border-border flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-600" />
            <h2 className="font-bold text-gray-900">Todos os Negócios</h2>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {(["todos", "venda", "locacao", "permuta"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={`px-2 py-1 text-xs font-semibold rounded-lg transition-colors ${
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

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["ID", "Tipo", "Imóvel / Corretor", "Cliente", "Valor", "Docs", "Progresso", "Status", "Ações"].map((h) => (
                  <th key={h} className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dealsLoading ? (
                <tr><td colSpan={9} className="text-center py-8 text-muted-foreground text-sm">Carregando...</td></tr>
              ) : filteredDeals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <Briefcase className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm mb-3">Nenhum negócio cadastrado ainda</p>
                    <Link href="/dashboard/negocios/novo">
                      <Button size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-1" /> Criar primeiro negócio
                      </Button>
                    </Link>
                  </td>
                </tr>
              ) : (
                filteredDeals.map((deal, i) => {
                  const value = deal.type === "locacao"
                    ? (deal.monthlyValue ? `R$ ${Number(deal.monthlyValue).toLocaleString("pt-BR")}` : "—")
                    : formatCurrency(deal.totalValue);
                  return (
                    <tr key={deal.id ?? i} className="border-b border-border/50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span
                          className="text-blue-600 text-sm font-semibold hover:underline cursor-pointer whitespace-nowrap"
                          onClick={() => deal.id && navigate(`/dashboard/negocios/${deal.id}`)}
                        >
                          {deal.code || `#${i + 1}`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className={TYPE_COLORS[deal.type]}>{TYPE_LABELS[deal.type]}</div>
                        {deal.subtype && <div className="text-xs text-muted-foreground">{deal.subtype}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900 max-w-[160px] truncate">{deal.property || "—"}</div>
                        <div className="text-xs text-muted-foreground">{deal.broker ? `Corretor: ${deal.broker}` : ""}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 whitespace-nowrap">{deal.buyer || "—"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{value}</span>
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
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => deal.id && navigate(`/dashboard/negocios/${deal.id}`)}
                            className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingDeal(deal)}
                            className="p-1.5 text-muted-foreground hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                            title="Editar negócio"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingDeal(deal)}
                            className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Excluir negócio"
                            disabled={!deal.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border">
          {dealsLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
          ) : filteredDeals.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm mb-3">Nenhum negócio cadastrado</p>
              <Link href="/dashboard/negocios/novo">
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" /> Criar primeiro negócio
                </Button>
              </Link>
            </div>
          ) : (
            filteredDeals.map((deal, i) => {
              const value = deal.type === "locacao"
                ? (deal.monthlyValue ? `R$ ${Number(deal.monthlyValue).toLocaleString("pt-BR")}/mês` : "—")
                : formatCurrency(deal.totalValue);
              return (
                <div key={deal.id ?? i} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 text-sm font-bold">{deal.code || `#${i + 1}`}</span>
                      <span className={TYPE_COLORS[deal.type]}>{TYPE_LABELS[deal.type]}</span>
                    </div>
                    <span className={STATUS_COLORS[deal.status]}>{STATUS_LABELS[deal.status]}</span>
                  </div>
                  <div className="text-sm font-medium text-gray-900 truncate mb-0.5">{deal.property || "—"}</div>
                  <div className="text-xs text-muted-foreground mb-2">{deal.buyer || "—"}</div>
                  <div className="text-sm font-bold text-gray-900 mb-3">{value}</div>
                  <div className="flex items-center gap-2">
                    {deal.id && (
                      <Button size="sm" variant="outline" className="gap-1 text-xs h-8" onClick={() => navigate(`/dashboard/negocios/${deal.id}`)}>
                        <Eye className="w-3 h-3" /> Ver
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="gap-1 text-xs h-8" onClick={() => setEditingDeal(deal)}>
                      <Pencil className="w-3 h-3" /> Editar
                    </Button>
                    {deal.id && (
                      <Button
                        size="sm" variant="outline"
                        className="gap-1 text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeletingDeal(deal)}
                      >
                        <Trash2 className="w-3 h-3" /> Excluir
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

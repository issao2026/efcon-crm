import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Plus, Briefcase, Search, Filter, ChevronRight,
  CheckCircle2, AlertTriangle, Clock, FileOutput, Eye,
  Building2, User, DollarSign, Calendar,
} from "lucide-react";

type DealStatus = "rascunho" | "em_andamento" | "contrato_gerado" | "assinatura" | "concluido";
type DealType = "venda" | "locacao" | "permuta" | "financiamento";

const TYPE_LABELS: Record<DealType, string> = {
  venda: "VENDA", locacao: "LOCAÇÃO", permuta: "PERMUTA", financiamento: "FINANCIAMENTO",
};
const TYPE_COLORS: Record<DealType, string> = {
  venda: "type-badge-venda", locacao: "type-badge-locacao",
  permuta: "type-badge-permuta", financiamento: "type-badge-financiamento",
};
const STATUS_LABELS: Record<DealStatus, string> = {
  rascunho: "Rascunho", em_andamento: "Em andamento",
  contrato_gerado: "Contrato gerado", assinatura: "Assinatura", concluido: "Concluído",
};
const STATUS_COLORS: Record<DealStatus, string> = {
  rascunho: "status-badge-rascunho", em_andamento: "status-badge-em_andamento",
  contrato_gerado: "status-badge-contrato_gerado", assinatura: "status-badge-assinatura",
  concluido: "status-badge-concluido",
};

function formatCurrency(value?: string | number): string {
  if (!value) return "—";
  const num = typeof value === "string" ? parseFloat(value.replace(/[^0-9.]/g, "")) : value;
  if (isNaN(num)) return String(value);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(num);
}

export default function Negocios() {
  const [, navigate] = useLocation();
  const [typeFilter, setTypeFilter] = useState<"todos" | DealType>("todos");
  const [statusFilter, setStatusFilter] = useState<"todos" | DealStatus>("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewDeal, setShowNewDeal] = useState(false);

  // Form state for new deal
  const [newDeal, setNewDeal] = useState({
    type: "venda" as DealType,
    propertyDescription: "",
    buyerName: "",
    totalValue: "",
    monthlyValue: "",
  });

  const { data: deals = [], isLoading, refetch } = trpc.deals.list.useQuery();
  const createDeal = trpc.deals.create.useMutation({
    onSuccess: () => {
      toast.success("Negócio criado com sucesso!");
      setShowNewDeal(false);
      setNewDeal({ type: "venda", propertyDescription: "", buyerName: "", totalValue: "", monthlyValue: "" });
      refetch();
    },
    onError: () => toast.error("Erro ao criar negócio"),
  });

  const filtered = (deals as any[]).filter((d) => {
    if (typeFilter !== "todos" && d.type !== typeFilter) return false;
    if (statusFilter !== "todos" && d.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        d.property?.toLowerCase().includes(q) ||
        d.buyer?.toLowerCase().includes(q) ||
        d.code?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreate = () => {
      if (!newDeal.propertyDescription) { toast.error("Informe o imóvel"); return; }
    createDeal.mutate({
      type: newDeal.type,
      propertyDescription: newDeal.propertyDescription || undefined,
      buyerName: newDeal.buyerName || undefined,
      totalValue: newDeal.totalValue || undefined,
      monthlyValue: newDeal.monthlyValue || undefined,
    });
  };

  return (
    <DashboardShell
      searchPlaceholder="Buscar negócio, imóvel, cliente..."
      headerRight={
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          onClick={() => setShowNewDeal(true)}
        >
          <Plus className="w-4 h-4" /> Novo negócio
        </Button>
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Negócios</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{(deals as any[]).length} negócios cadastrados</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="w-4 h-4 text-muted-foreground mr-1" />
          {(["todos", "venda", "locacao", "permuta"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                typeFilter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "todos" ? "Todos" : f === "venda" ? "Venda" : f === "locacao" ? "Locação" : "Permuta"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {(["todos", "rascunho", "em_andamento", "contrato_gerado", "assinatura", "concluido"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === s ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s === "todos" ? "Todos status" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-gray-50/50">
                {["ID", "Tipo", "Imóvel", "Cliente", "Valor", "Docs", "Progresso", "Status", "Ações"].map((h) => (
                  <th key={h} className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wide px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="text-center py-12 text-muted-foreground text-sm">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <Briefcase className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">Nenhum negócio encontrado</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => setShowNewDeal(true)}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Criar primeiro negócio
                    </Button>
                  </td>
                </tr>
              ) : (
                filtered.map((deal: any, i: number) => {
                  const value = deal.type === "locacao"
                    ? (deal.monthlyValue ? `R$ ${Number(deal.monthlyValue).toLocaleString("pt-BR")}/mês` : "—")
                    : formatCurrency(deal.totalValue);
                  return (
                    <tr key={deal.id ?? i} className="border-b border-border/50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-blue-600 text-sm font-semibold">{deal.code || `#${i + 1}`}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className={TYPE_COLORS[deal.type as DealType] || "type-badge-venda"}>
                          {TYPE_LABELS[deal.type as DealType] || deal.type}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900 max-w-[180px] truncate">{deal.property || "—"}</div>
                        {deal.broker && <div className="text-xs text-muted-foreground">Corretor: {deal.broker}</div>}
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
                            {deal.docsCompleted === deal.docsTotal
                              ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                              : <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            }
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
                        <span className={STATUS_COLORS[deal.status as DealStatus] || "status-badge-rascunho"}>
                          {STATUS_LABELS[deal.status as DealStatus] || deal.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link href={`/dashboard/negocios/${deal.id}/documentos`}>
                            <button className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Documentos">
                              <FileOutput className="w-4 h-4" />
                            </button>
                          </Link>
                          <Link href={`/dashboard/contrato?dealId=${deal.id}`}>
                            <button className="p-1.5 text-muted-foreground hover:text-purple-600 hover:bg-purple-50 rounded transition-colors" title="Gerar contrato">
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Deal Modal */}
      {showNewDeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Novo Negócio</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Tipo de operação</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["venda", "locacao", "permuta", "financiamento"] as DealType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setNewDeal({ ...newDeal, type: t })}
                      className={`px-3 py-2 text-sm font-semibold rounded-lg border-2 transition-colors ${
                        newDeal.type === t ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Imóvel *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Ex: Rua das Palmeiras, 340"
                    value={newDeal.propertyDescription}
                    onChange={(e) => setNewDeal({ ...newDeal, propertyDescription: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">
                  {newDeal.type === "locacao" ? "Locatário" : "Comprador"}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Nome do cliente"
                    value={newDeal.buyerName}
                    onChange={(e) => setNewDeal({ ...newDeal, buyerName: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">
                  {newDeal.type === "locacao" ? "Aluguel mensal (R$)" : "Valor total (R$)"}
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Ex: 485000"
                    value={newDeal.type === "locacao" ? newDeal.monthlyValue : newDeal.totalValue}
                    onChange={(e) => {
                      if (newDeal.type === "locacao") setNewDeal({ ...newDeal, monthlyValue: e.target.value });
                      else setNewDeal({ ...newDeal, totalValue: e.target.value });
                    }}
                    className="w-full pl-9 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowNewDeal(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleCreate}
                disabled={createDeal.isPending}
              >
                {createDeal.isPending ? "Criando..." : "Criar negócio"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import {
  Plus, FileOutput, Search, Download, Eye, CheckCircle2,
  Clock, AlertTriangle, FileText,
} from "lucide-react";

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  compra_venda: "Compra e Venda", locacao: "Locação",
  permuta: "Permuta", financiamento: "Financiamento",
};

const STATUS_CONFIG = {
  rascunho: { label: "Rascunho", color: "bg-gray-100 text-gray-600" },
  gerado: { label: "Gerado", color: "bg-blue-100 text-blue-700" },
  enviado: { label: "Enviado", color: "bg-purple-100 text-purple-700" },
  assinado: { label: "Assinado", color: "bg-green-100 text-green-700" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

export default function Contratos() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: contracts = [], isLoading } = trpc.contracts.list.useQuery();

  const filtered = (contracts as any[]).filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.contractNumber?.toLowerCase().includes(q) ||
      c.sellerName?.toLowerCase().includes(q) ||
      c.buyerName?.toLowerCase().includes(q) ||
      c.propertyAddress?.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardShell
      searchPlaceholder="Buscar contratos..."
      headerRight={
        <Link href="/dashboard/contrato">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Novo contrato
          </Button>
        </Link>
      }
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Contratos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{(contracts as any[]).length} contratos gerados</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total gerados", count: (contracts as any[]).length, icon: FileOutput, color: "text-blue-600", border: "border-l-blue-500" },
          { label: "Assinados", count: (contracts as any[]).filter((c) => c.status === "assinado").length, icon: CheckCircle2, color: "text-green-600", border: "border-l-green-500" },
          { label: "Aguardando", count: (contracts as any[]).filter((c) => c.status === "enviado").length, icon: Clock, color: "text-yellow-600", border: "border-l-yellow-500" },
          { label: "Rascunhos", count: (contracts as any[]).filter((c) => c.status === "rascunho").length, icon: AlertTriangle, color: "text-gray-600", border: "border-l-gray-400" },
        ].map((stat) => (
          <div key={stat.label} className={`bg-white rounded-xl border border-border border-l-4 ${stat.border} p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <div className={`text-2xl font-black ${stat.color}`}>{stat.count}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-border p-4 mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por número, partes ou imóvel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Contracts List */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileOutput className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-4">Nenhum contrato encontrado</p>
            <Link href="/dashboard/contrato">
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" /> Gerar primeiro contrato
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  {["Nº Contrato", "Tipo", "Partes", "Imóvel", "Valor", "Data", "Status", "Ações"].map((h) => (
                    <th key={h} className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((contract: any, i: number) => {
                  const status = STATUS_CONFIG[contract.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.rascunho;
                  return (
                    <tr key={contract.id ?? i} className="border-b border-border/50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-blue-600 text-sm font-semibold">{contract.contractNumber || `#${i + 1}`}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          {CONTRACT_TYPE_LABELS[contract.contractType] || contract.contractType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{contract.sellerName || "—"}</div>
                        <div className="text-xs text-muted-foreground">{contract.buyerName || "—"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 max-w-[160px] truncate">{contract.propertyAddress || "—"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-gray-900">
                          {contract.totalValue
                            ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(Number(contract.totalValue))
                            : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {contract.createdAt ? new Date(contract.createdAt).toLocaleDateString("pt-BR") : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {contract.pdfUrl && (
                            <a href={contract.pdfUrl} target="_blank" rel="noopener noreferrer">
                              <button className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Ver contrato">
                                <Eye className="w-4 h-4" />
                              </button>
                            </a>
                          )}
                          {contract.pdfUrl && (
                            <a href={contract.pdfUrl} download>
                              <button className="p-1.5 text-muted-foreground hover:text-green-600 hover:bg-green-50 rounded transition-colors" title="Baixar">
                                <Download className="w-4 h-4" />
                              </button>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

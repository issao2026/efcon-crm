import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Plus, FileOutput, Search, Download, Eye, CheckCircle2,
  Clock, AlertTriangle, Pencil, Trash2, X, Save, ExternalLink,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  rascunho: { label: "Rascunho", color: "bg-gray-100 text-gray-600" },
  gerado: { label: "Gerado", color: "bg-blue-100 text-blue-700" },
  enviado: { label: "Enviado", color: "bg-purple-100 text-purple-700" },
  assinado: { label: "Assinado", color: "bg-green-100 text-green-700" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

type ContractRow = {
  id: number;
  code?: string | null;
  nomeVendedor?: string | null;
  nomeComprador?: string | null;
  descricaoImovel?: string | null;
  valorTotalContrato?: string | null;
  contractStatus?: string | null;
  pdfUrl?: string | null;
  createdAt: Date | string;
  cidadeAssinatura?: string | null;
  dataAssinatura?: string | null;
  nomeTestemunha1?: string | null;
  cpfTestemunha1?: string | null;
  nomeTestemunha2?: string | null;
  cpfTestemunha2?: string | null;
};

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ contract, onClose }: { contract: ContractRow; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    nomeVendedor: contract.nomeVendedor || "",
    nomeComprador: contract.nomeComprador || "",
    descricaoImovel: contract.descricaoImovel || "",
    valorTotalContrato: contract.valorTotalContrato || "",
    cidadeAssinatura: contract.cidadeAssinatura || "",
    dataAssinatura: contract.dataAssinatura || "",
    nomeTestemunha1: contract.nomeTestemunha1 || "",
    cpfTestemunha1: contract.cpfTestemunha1 || "",
    nomeTestemunha2: contract.nomeTestemunha2 || "",
    cpfTestemunha2: contract.cpfTestemunha2 || "",
    contractStatus: (contract.contractStatus || "rascunho") as "rascunho" | "gerado" | "enviado" | "assinado",
  });

  const updateMutation = trpc.contracts.update.useMutation({
    onSuccess: () => {
      toast.success("Contrato atualizado com sucesso!");
      utils.contracts.list.invalidate();
      onClose();
    },
    onError: (err) => toast.error(`Erro ao atualizar: ${err.message}`),
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-bold text-gray-900">Editar Contrato</h2>
            <p className="text-xs text-muted-foreground">{contract.code}</p>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-gray-900 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field("Vendedor", "nomeVendedor")}
            {field("Comprador", "nomeComprador")}
            {field("Descrição do Imóvel", "descricaoImovel")}
            {field("Valor Total", "valorTotalContrato")}
            {field("Cidade de Assinatura", "cidadeAssinatura")}
            {field("Data de Assinatura", "dataAssinatura")}
            {field("Testemunha 1 — Nome", "nomeTestemunha1")}
            {field("Testemunha 1 — CPF", "cpfTestemunha1")}
            {field("Testemunha 2 — Nome", "nomeTestemunha2")}
            {field("Testemunha 2 — CPF", "cpfTestemunha2")}
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
            <select
              value={form.contractStatus}
              onChange={(e) => setForm((f) => ({ ...f, contractStatus: e.target.value as typeof form.contractStatus }))}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            >
              <option value="rascunho">Rascunho</option>
              <option value="gerado">Gerado</option>
              <option value="enviado">Enviado</option>
              <option value="assinado">Assinado</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            onClick={() => updateMutation.mutate({ id: contract.id, ...form })}
            disabled={updateMutation.isPending}
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ contract, onClose }: { contract: ContractRow; onClose: () => void }) {
  const utils = trpc.useUtils();
  const deleteMutation = trpc.contracts.delete.useMutation({
    onSuccess: () => {
      toast.success("Contrato excluído.");
      utils.contracts.list.invalidate();
      onClose();
    },
    onError: (err) => toast.error(`Erro ao excluir: ${err.message}`),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Excluir contrato</h2>
            <p className="text-xs text-muted-foreground">{contract.code}</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Tem certeza que deseja excluir o contrato <strong>{contract.code}</strong> entre{" "}
          <strong>{contract.nomeVendedor || "—"}</strong> e{" "}
          <strong>{contract.nomeComprador || "—"}</strong>? Esta ação não pode ser desfeita.
        </p>
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white gap-2"
            onClick={() => deleteMutation.mutate({ id: contract.id })}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
            {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Contratos() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingContract, setEditingContract] = useState<ContractRow | null>(null);
  const [deletingContract, setDeletingContract] = useState<ContractRow | null>(null);

  const { data: contracts = [], isLoading } = trpc.contracts.list.useQuery();

  const filtered = (contracts as ContractRow[]).filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.code?.toLowerCase().includes(q) ||
      c.nomeVendedor?.toLowerCase().includes(q) ||
      c.nomeComprador?.toLowerCase().includes(q) ||
      c.descricaoImovel?.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardShell
      searchPlaceholder="Buscar contratos..."
      headerRight={
        <Link href="/dashboard/contrato">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1 text-xs md:text-sm px-2 md:px-3">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo contrato</span>
          </Button>
        </Link>
      }
    >
      {/* Modals */}
      {editingContract && <EditModal contract={editingContract} onClose={() => setEditingContract(null)} />}
      {deletingContract && <DeleteModal contract={deletingContract} onClose={() => setDeletingContract(null)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Contratos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{(contracts as ContractRow[]).length} contratos gerados</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total gerados", count: (contracts as ContractRow[]).length, icon: FileOutput, color: "text-blue-600", border: "border-l-blue-500" },
          { label: "Assinados", count: (contracts as ContractRow[]).filter((c) => c.contractStatus === "assinado").length, icon: CheckCircle2, color: "text-green-600", border: "border-l-green-500" },
          { label: "Aguardando", count: (contracts as ContractRow[]).filter((c) => c.contractStatus === "enviado").length, icon: Clock, color: "text-yellow-600", border: "border-l-yellow-500" },
          { label: "Rascunhos", count: (contracts as ContractRow[]).filter((c) => c.contractStatus === "rascunho").length, icon: AlertTriangle, color: "text-gray-600", border: "border-l-gray-400" },
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
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-gray-50/50">
                    {["Nº Contrato", "Partes", "Imóvel", "Valor", "Data", "Status", "Ações"].map((h) => (
                      <th key={h} className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((contract, i) => {
                    const statusKey = contract.contractStatus || "rascunho";
                    const status = STATUS_CONFIG[statusKey] || STATUS_CONFIG.rascunho;
                    return (
                      <tr key={contract.id ?? i} className="border-b border-border/50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-blue-600 text-sm font-semibold whitespace-nowrap">
                            {contract.code || `CTR-${String(i + 1).padStart(3, "0")}`}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{contract.nomeVendedor || "—"}</div>
                          <div className="text-xs text-muted-foreground">{contract.nomeComprador || "—"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 max-w-[160px] truncate">{contract.descricaoImovel || "—"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                            {contract.valorTotalContrato || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {contract.createdAt ? new Date(contract.createdAt).toLocaleDateString("pt-BR") : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {contract.pdfUrl && (
                              <a href={contract.pdfUrl} target="_blank" rel="noopener noreferrer">
                                <button
                                  className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Visualizar PDF"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </a>
                            )}
                            {contract.pdfUrl && (
                              <a href={contract.pdfUrl} download>
                                <button
                                  className="p-1.5 text-muted-foreground hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                  title="Baixar PDF"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </a>
                            )}
                            <button
                              onClick={() => setEditingContract(contract)}
                              className="p-1.5 text-muted-foreground hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                              title="Editar contrato"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingContract(contract)}
                              className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Excluir contrato"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border">
              {filtered.map((contract, i) => {
                const statusKey = contract.contractStatus || "rascunho";
                const status = STATUS_CONFIG[statusKey] || STATUS_CONFIG.rascunho;
                return (
                  <div key={contract.id ?? i} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-blue-600 text-sm font-bold">
                          {contract.code || `CTR-${String(i + 1).padStart(3, "0")}`}
                        </span>
                        <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {contract.createdAt ? new Date(contract.createdAt).toLocaleDateString("pt-BR") : "—"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-900 font-medium">{contract.nomeVendedor || "—"}</div>
                    <div className="text-xs text-muted-foreground mb-1">Comprador: {contract.nomeComprador || "—"}</div>
                    <div className="text-xs text-muted-foreground truncate mb-3">{contract.descricaoImovel || "—"}</div>
                    {contract.valorTotalContrato && (
                      <div className="text-sm font-bold text-gray-900 mb-3">{contract.valorTotalContrato}</div>
                    )}
                    <div className="flex items-center gap-2">
                      {contract.pdfUrl && (
                        <a href={contract.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="gap-1 text-xs h-8">
                            <ExternalLink className="w-3 h-3" /> Ver PDF
                          </Button>
                        </a>
                      )}
                      {contract.pdfUrl && (
                        <a href={contract.pdfUrl} download>
                          <Button size="sm" variant="outline" className="gap-1 text-xs h-8">
                            <Download className="w-3 h-3" /> Baixar
                          </Button>
                        </a>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs h-8"
                        onClick={() => setEditingContract(contract)}
                      >
                        <Pencil className="w-3 h-3" /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeletingContract(contract)}
                      >
                        <Trash2 className="w-3 h-3" /> Excluir
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

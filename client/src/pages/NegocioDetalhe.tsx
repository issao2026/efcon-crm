import { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { DocumentDetailModal } from "@/components/DocumentDetailModal";
import {
  ArrowLeft, Briefcase, FileText, Users, Building2,
  DollarSign, History, FileOutput, Loader2, CheckCircle2,
  AlertTriangle, Clock, Plus, Eye,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DealStatus = "rascunho" | "em_andamento" | "contrato_gerado" | "assinatura" | "concluido";
type DealType = "venda" | "locacao" | "permuta" | "financiamento";

const TYPE_LABELS: Record<string, string> = {
  venda: "Venda", locacao: "Locação", permuta: "Permuta", financiamento: "Financiamento",
};
const STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho", em_andamento: "Em andamento",
  contrato_gerado: "Contrato gerado", assinatura: "Assinatura", concluido: "Concluído",
};
const STATUS_COLORS: Record<string, string> = {
  rascunho: "bg-gray-100 text-gray-700",
  em_andamento: "bg-blue-100 text-blue-700",
  contrato_gerado: "bg-purple-100 text-purple-700",
  assinatura: "bg-orange-100 text-orange-700",
  concluido: "bg-green-100 text-green-700",
};
const DOC_TYPE_LABELS: Record<string, string> = {
  rg: "RG", cpf: "CPF", cnh: "CNH",
  comprovante_residencia: "Comp. Residência",
  matricula: "Matrícula", iptu: "IPTU",
  certidao: "Certidão", contrato: "Contrato", outro: "Outro",
};
const DOC_STATUS_COLORS: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800",
  extraido: "bg-blue-100 text-blue-800",
  validado: "bg-green-100 text-green-800",
  rejeitado: "bg-red-100 text-red-800",
};

function formatCurrency(value?: string | number): string {
  if (!value) return "—";
  const num = typeof value === "string" ? parseFloat(value.replace(/[^0-9.]/g, "")) : value;
  if (isNaN(num)) return String(value);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(num);
}

type Tab = "resumo" | "participantes" | "documentos" | "contrato" | "historico";

export default function NegocioDetalhe() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const dealId = parseInt(params.id || "0");
  const [activeTab, setActiveTab] = useState<Tab>("resumo");
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [newDocType, setNewDocType] = useState<string>("rg");
  const docFileRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const { data: deal, isLoading: dealLoading } = trpc.deals.byId.useQuery(
    { id: dealId },
    { enabled: !!dealId }
  );
  const { data: documents = [], refetch: refetchDocs } = trpc.documents.list.useQuery(
    { dealId },
    { enabled: !!dealId }
  );
  const { data: clients = [] } = trpc.clients.list.useQuery();

  const updateStatus = trpc.deals.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado");
      utils.deals.byId.invalidate({ id: dealId });
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  const uploadDocMutation = trpc.documents.upload.useMutation({
    onSuccess: () => {
      toast.success("Documento enviado! OCR em andamento...");
      setUploadingDoc(false);
      refetchDocs();
    },
    onError: (e) => { toast.error(e.message); setUploadingDoc(false); },
  });

  const handleDocUpload = async (file: File) => {
    setUploadingDoc(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1];
      await uploadDocMutation.mutateAsync({
        dealId,
        name: file.name.replace(/\.[^.]+$/, ""),
        fileBase64: base64,
        mimeType: file.type,
        fileSize: file.size,
        docType: newDocType as any,
      });
    };
    reader.readAsDataURL(file);
  };

  const ocrMutation = trpc.documents.processOcr.useMutation({
    onSuccess: (result) => {
      toast.success(`OCR concluído com ${result.confidence}% de confiança`);
      refetchDocs();
    },
    onError: (err) => toast.error(`Erro no OCR: ${err.message}`),
  });

  if (dealLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardShell>
    );
  }

  if (!deal) {
    return (
      <DashboardShell>
        <div className="text-center py-24">
          <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-muted-foreground">Negócio não encontrado</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard/negocios")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
        </div>
      </DashboardShell>
    );
  }

  const buyerClient = (clients as any[]).find((c) => c.id === deal.buyerId);
  const sellerClient = (clients as any[]).find((c) => c.id === deal.sellerId);
  const brokerClient = (clients as any[]).find((c) => c.id === deal.brokerId);

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "resumo", label: "Resumo", icon: <Briefcase className="w-4 h-4" /> },
    { key: "participantes", label: "Participantes", icon: <Users className="w-4 h-4" /> },
    { key: "documentos", label: `Documentos (${(documents as any[]).length})`, icon: <FileText className="w-4 h-4" /> },
    { key: "contrato", label: "Contrato", icon: <FileOutput className="w-4 h-4" /> },
    { key: "historico", label: "Histórico", icon: <History className="w-4 h-4" /> },
  ];

  return (
    <DashboardShell>
      {/* Back + Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/dashboard/negocios")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Negócios
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-gray-900">{deal.code}</h1>
              <Badge className={STATUS_COLORS[deal.status || "rascunho"] || "bg-gray-100 text-gray-700"}>
                {STATUS_LABELS[deal.status || "rascunho"] || deal.status}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {TYPE_LABELS[deal.type || "venda"] || deal.type}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {deal.notes || "Sem descrição"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Select
              value={deal.status || "rascunho"}
              onValueChange={(v) => updateStatus.mutate({ id: dealId, status: v as DealStatus })}
            >
              <SelectTrigger className="h-9 text-sm w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => navigate(`/dashboard/contrato?dealId=${dealId}`)}
            >
              <FileOutput className="w-4 h-4 mr-1" /> Gerar contrato
            </Button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {deal.progressPct != null && (
        <div className="bg-white rounded-xl border border-border p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Progresso do negócio</span>
            <span className="text-sm font-bold text-gray-900">{deal.progressPct}%</span>
          </div>
          <Progress value={deal.progressPct} className="h-2" />
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>Documentos: {deal.docsCompleted ?? 0}/{deal.docsTotal ?? 7}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white rounded-xl border border-border p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors flex-1 justify-center ${
              activeTab === tab.key
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "resumo" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Deal Info */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" /> Informações do Imóvel
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Tipo de operação</p>
                <p className="text-sm font-semibold text-gray-900">{TYPE_LABELS[deal.type || "venda"] || deal.type}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Imóvel</p>
                <p className="text-sm font-semibold text-gray-900">{deal.notes || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Modalidade de pagamento</p>
                <p className="text-sm font-semibold text-gray-900">{deal.paymentModality || "—"}</p>
              </div>
            </div>
          </div>

          {/* Financial Info */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" /> Informações Financeiras
            </h3>
            <div className="space-y-3">
              {deal.type === "locacao" ? (
                <div>
                  <p className="text-xs text-muted-foreground">Aluguel mensal</p>
                  <p className="text-xl font-black text-gray-900">{formatCurrency(deal.monthlyValue as any)}</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-muted-foreground">Valor total</p>
                  <p className="text-xl font-black text-gray-900">{formatCurrency(deal.totalValue as any)}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge className={STATUS_COLORS[deal.status || "rascunho"] || "bg-gray-100 text-gray-700"}>
                  {STATUS_LABELS[deal.status || "rascunho"] || deal.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Participants summary */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" /> Participantes
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">{deal.type === "locacao" ? "Locatário" : "Comprador"}</p>
                <p className="text-sm font-semibold text-gray-900">{buyerClient?.name || "—"}</p>
                {buyerClient?.cpfCnpj && <p className="text-xs text-muted-foreground">CPF: {buyerClient.cpfCnpj}</p>}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{deal.type === "locacao" ? "Locador" : "Vendedor"}</p>
                <p className="text-sm font-semibold text-gray-900">{sellerClient?.name || "—"}</p>
                {sellerClient?.cpfCnpj && <p className="text-xs text-muted-foreground">CPF: {sellerClient.cpfCnpj}</p>}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Corretista</p>
                <p className="text-sm font-semibold text-gray-900">{brokerClient?.name || "—"}</p>
              </div>
            </div>
          </div>

          {/* Documents summary */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-600" /> Documentos
            </h3>
            <div className="space-y-2">
              {(documents as any[]).slice(0, 5).map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    {doc.ocrStatus === "done" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    ) : doc.ocrStatus === "failed" ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    )}
                    <span className="text-xs text-gray-700 truncate max-w-[140px]">{doc.name}</span>
                  </div>
                  <Badge className={`text-xs ${DOC_STATUS_COLORS[doc.docStatus || "pendente"] || "bg-gray-100 text-gray-700"}`}>
                    {DOC_TYPE_LABELS[doc.docType || "outro"] || doc.docType}
                  </Badge>
                </div>
              ))}
              {(documents as any[]).length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum documento enviado</p>
              )}
              {(documents as any[]).length > 5 && (
                <button
                  onClick={() => setActiveTab("documentos")}
                  className="text-xs text-blue-600 hover:underline mt-1"
                >
                  Ver todos ({(documents as any[]).length})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "participantes" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: deal.type === "locacao" ? "Locatário (Comprador)" : "Comprador", client: buyerClient, role: "comprador" },
            { label: deal.type === "locacao" ? "Locador (Vendedor)" : "Vendedor", client: sellerClient, role: "vendedor" },
            { label: "Corretista", client: brokerClient, role: "corretor" },
          ].map(({ label, client }) => (
            <div key={label} className="bg-white rounded-xl border border-border p-5">
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide text-muted-foreground">{label}</h3>
              {client ? (
                <div className="space-y-2">
                  <p className="font-bold text-gray-900">{client.name}</p>
                  {client.cpfCnpj && <p className="text-sm text-muted-foreground">CPF/CNPJ: {client.cpfCnpj}</p>}
                  {client.rg && <p className="text-sm text-muted-foreground">RG: {client.rg}</p>}
                  {client.email && <p className="text-sm text-muted-foreground">Email: {client.email}</p>}
                  {client.phone && <p className="text-sm text-muted-foreground">Tel: {client.phone}</p>}
                  {client.address && <p className="text-sm text-muted-foreground">Endereço: {client.address}</p>}
                  {client.maritalStatus && <p className="text-sm text-muted-foreground">Estado civil: {client.maritalStatus}</p>}
                  {client.nationality && <p className="text-sm text-muted-foreground">Nacionalidade: {client.nationality}</p>}
                  {client.profession && <p className="text-sm text-muted-foreground">Profissão: {client.profession}</p>}
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 w-full text-xs"
                    onClick={() => navigate(`/dashboard/clientes`)}
                  >
                    Ver perfil completo
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Não definido</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 text-xs"
                    onClick={() => navigate("/dashboard/clientes")}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Adicionar cliente
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "documentos" && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-bold text-gray-900 flex-1">Documentos do negócio</h3>
              <div className="flex items-center gap-2">
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="h-8 rounded-lg border border-gray-200 text-xs px-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                  onClick={() => docFileRef.current?.click()}
                  disabled={uploadingDoc}
                >
                  {uploadingDoc ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                  {uploadingDoc ? "Enviando..." : "Enviar"}
                </Button>
                <input
                  ref={docFileRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDocUpload(f); e.target.value = ""; }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG — máx. 10 MB. OCR extrai dados automaticamente.</p>
          </div>
          {(documents as any[]).length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Nenhum documento enviado</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => navigate("/dashboard/upload")}
              >
                <Plus className="w-4 h-4 mr-1" /> Enviar primeiro documento
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {(documents as any[]).map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => { setSelectedDocId(doc.id); setDocModalOpen(true); }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={`text-xs ${DOC_STATUS_COLORS[doc.docStatus || "pendente"] || "bg-gray-100 text-gray-700"}`}>
                          {DOC_TYPE_LABELS[doc.docType || "outro"] || doc.docType}
                        </Badge>
                        {doc.ocrConfidence != null && (
                          <span className="text-xs text-muted-foreground">OCR: {doc.ocrConfidence}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.ocrStatus === "done" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : doc.ocrStatus === "failed" ? (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    ) : doc.ocrStatus === "processing" ? (
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-400" />
                    )}
                    {doc.ocrStatus !== "done" && doc.fileUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          ocrMutation.mutate({ documentId: doc.id, fileUrl: doc.fileUrl, docType: doc.docType || "outro" });
                        }}
                        disabled={ocrMutation.isPending}
                      >
                        {ocrMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "OCR"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={(e) => { e.stopPropagation(); setSelectedDocId(doc.id); setDocModalOpen(true); }}
                    >
                      <Eye className="w-3 h-3 mr-1" /> Ver
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "contrato" && (
        <div className="bg-white rounded-xl border border-border p-8 text-center">
          <FileOutput className="w-12 h-12 text-purple-300 mx-auto mb-4" />
          <h3 className="font-bold text-gray-900 mb-2">Gerar Contrato</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Gere o contrato automaticamente com os dados do negócio e participantes.
          </p>
          <Button
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => navigate(`/dashboard/contrato?dealId=${dealId}`)}
          >
            <FileOutput className="w-4 h-4 mr-2" /> Ir para geração de contrato
          </Button>
        </div>
      )}

      {activeTab === "historico" && (
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-gray-600" /> Histórico de atividades
          </h3>
          <div className="text-center py-8 text-muted-foreground">
            <History className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm">Histórico em desenvolvimento</p>
          </div>
        </div>
      )}

      {/* Document Detail Modal */}
      <DocumentDetailModal
        documentId={selectedDocId}
        open={docModalOpen}
        onClose={() => { setDocModalOpen(false); setSelectedDocId(null); }}
        onDeleted={() => refetchDocs()}
        onUpdated={() => refetchDocs()}
      />
    </DashboardShell>
  );
}

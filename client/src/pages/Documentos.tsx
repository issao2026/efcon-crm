import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DocumentDetailModal } from "@/components/DocumentDetailModal";
import {
  FileText, Search, CheckCircle2, Clock,
  XCircle, Eye, Download, RefreshCw, Upload, Loader2, Zap,
} from "lucide-react";

const DOC_TYPE_LABELS: Record<string, string> = {
  rg: "RG", cpf: "CPF", cnh: "CNH", comprovante_residencia: "Comprovante",
  matricula: "Matrícula", iptu: "IPTU", certidao: "Certidão",
  contrato: "Contrato", outro: "Outro",
};

const OCR_STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  pending: { label: "Pendente", icon: Clock, color: "text-gray-500", bg: "bg-gray-100" },
  processing: { label: "Processando", icon: RefreshCw, color: "text-blue-600", bg: "bg-blue-50" },
  done: { label: "OCR Concluído", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
  completed: { label: "Validado", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
  failed: { label: "Com problema", icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
};

function formatFileSize(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Documentos() {
  const [searchQuery, setSearchQuery] = useState("");
  const [ocrFilter, setOcrFilter] = useState<"todos" | "pending" | "processing" | "done" | "failed">("todos");
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [docModalOpen, setDocModalOpen] = useState(false);

  const { data: documents = [], isLoading, refetch } = trpc.documents.list.useQuery({});

  const ocrMutation = trpc.documents.processOcr.useMutation({
    onSuccess: (result) => {
      toast.success(`OCR concluído com ${result.confidence}% de confiança`);
      refetch();
    },
    onError: (err) => toast.error(`Erro no OCR: ${err.message}`),
  });

  const handleOpenDoc = (docId: number) => {
    setSelectedDocId(docId);
    setDocModalOpen(true);
  };

  const filtered = (documents as any[]).filter((d) => {
    if (ocrFilter !== "todos" && d.ocrStatus !== ocrFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return d.name?.toLowerCase().includes(q) || d.docType?.toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {
    done: (documents as any[]).filter((d) => d.ocrStatus === "done" || d.ocrStatus === "completed").length,
    processing: (documents as any[]).filter((d) => d.ocrStatus === "processing").length,
    pending: (documents as any[]).filter((d) => d.ocrStatus === "pending").length,
    failed: (documents as any[]).filter((d) => d.ocrStatus === "failed").length,
  };

  return (
    <DashboardShell
      searchPlaceholder="Buscar documentos..."
      headerRight={
        <Link href="/dashboard/upload">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Upload className="w-4 h-4" /> Novo upload
          </Button>
        </Link>
      }
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Documentos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{(documents as any[]).length} documentos enviados</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { key: "done", label: "OCR Concluído", count: counts.done, icon: CheckCircle2, color: "text-green-600", border: "border-l-green-500" },
          { key: "processing", label: "OCR em andamento", count: counts.processing, icon: RefreshCw, color: "text-blue-600", border: "border-l-blue-500" },
          { key: "pending", label: "Pendentes", count: counts.pending, icon: Clock, color: "text-yellow-600", border: "border-l-yellow-500" },
          { key: "failed", label: "Com problema", count: counts.failed, icon: XCircle, color: "text-red-600", border: "border-l-red-500" },
        ].map((stat) => (
          <div
            key={stat.key}
            onClick={() => setOcrFilter(stat.key as any)}
            className={`bg-white rounded-xl border border-border border-l-4 ${stat.border} p-4 cursor-pointer hover:shadow-sm transition-shadow ${ocrFilter === stat.key ? "ring-2 ring-blue-200" : ""}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <div className={`text-2xl font-black ${stat.color}`}>{stat.count}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome ou tipo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-1">
          {(["todos", "done", "processing", "pending", "failed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setOcrFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                ocrFilter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "todos" ? "Todos" : f === "done" ? "Concluído" : f === "processing" ? "Processando" : f === "pending" ? "Pendente" : "Problema"}
            </button>
          ))}
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-4">Nenhum documento encontrado</p>
            <Link href="/dashboard/upload">
              <Button size="sm" variant="outline">
                <Upload className="w-4 h-4 mr-1" /> Enviar primeiro documento
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((doc: any) => {
              const status = OCR_STATUS_CONFIG[doc.ocrStatus as keyof typeof OCR_STATUS_CONFIG] || OCR_STATUS_CONFIG.pending;
              const StatusIcon = status.icon;
              return (
                <div key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => handleOpenDoc(doc.id)}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${status.bg}`}>
                    <FileText className={`w-5 h-5 ${status.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">{doc.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        {DOC_TYPE_LABELS[doc.docType] || doc.docType}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatFileSize(doc.fileSize)}</span>
                      {doc.createdAt && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {status.label}
                  </div>
                  {doc.ocrConfidence != null && (
                    <div className="text-xs text-muted-foreground font-medium w-16 text-right">
                      {doc.ocrConfidence}%
                    </div>
                  )}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {(doc.ocrStatus === "pending" || doc.ocrStatus === "failed") && doc.fileUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          ocrMutation.mutate({ documentId: doc.id, fileUrl: doc.fileUrl, docType: doc.docType || "outro" });
                        }}
                        disabled={ocrMutation.isPending}
                        title="Processar OCR"
                      >
                        <Zap className="w-3 h-3" /> OCR
                      </Button>
                    )}
                    <button
                      className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Ver e editar"
                      onClick={(e) => { e.stopPropagation(); handleOpenDoc(doc.id); }}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {doc.fileUrl && (
                      <a href={doc.fileUrl} download={doc.name} onClick={(e) => e.stopPropagation()}>
                        <button className="p-1.5 text-muted-foreground hover:text-green-600 hover:bg-green-50 rounded transition-colors" title="Baixar">
                          <Download className="w-4 h-4" />
                        </button>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <DocumentDetailModal
        documentId={selectedDocId}
        open={docModalOpen}
        onClose={() => { setDocModalOpen(false); setSelectedDocId(null); }}
        onDeleted={() => refetch()}
        onUpdated={() => refetch()}
      />
    </DashboardShell>
  );
}
